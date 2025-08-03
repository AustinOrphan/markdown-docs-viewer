/**
 * GitHub Pages adapter for handling platform-specific requirements
 * Handles HEAD request blocking, CORS restrictions, and HTML error responses
 */

import { BaseAdapter, RequestTransform, AdapterConfig } from './base-adapter';
import { EnvironmentInfo } from '../foundation/environment-utils';
import { OptimizationErrors } from '../errors';

/**
 * GitHub Pages specific configuration
 */
export interface GitHubPagesConfig extends AdapterConfig {
  enableHeadToGetTransform?: boolean;
  enableRangeHeaders?: boolean;
  maxContentLength?: number;
  customDomain?: string;
}

/**
 * GitHub Pages adapter that handles platform-specific limitations
 */
export class GitHubPagesAdapter extends BaseAdapter {
  private readonly githubConfig: GitHubPagesConfig;
  private headRequestCache = new Map<string, boolean>();

  constructor(environment: EnvironmentInfo, config: GitHubPagesConfig = {}) {
    super(environment, config);
    this.githubConfig = {
      enableHeadToGetTransform: true,
      enableRangeHeaders: true,
      maxContentLength: 1024, // Only read first 1KB for HEAD-like requests
      ...config
    };
  }

  /**
   * Transform requests to work around GitHub Pages limitations
   */
  async transformRequest(url: string, options?: RequestInit): Promise<RequestTransform> {
    const method = options?.method?.toUpperCase() || 'GET';
    const transform: RequestTransform = {
      url,
      method,
      headers: { ...options?.headers },
      options: { ...options }
    };

    // Handle HEAD requests (GitHub Pages often blocks these)
    if (method === 'HEAD' && this.githubConfig.enableHeadToGetTransform) {
      return await this.transformHeadRequest(url, options, transform);
    }

    // Add GitHub Pages specific headers
    this.addGitHubPagesHeaders(transform);

    return transform;
  }

  /**
   * Transform HEAD requests to GET requests with Range headers
   */
  private async transformHeadRequest(
    url: string, 
    options?: RequestInit,
    transform: RequestTransform = {}
  ): Promise<RequestTransform> {
    // Check if we've already determined this URL blocks HEAD requests
    const cacheKey = this.getUrlCacheKey(url);
    const knownToBlockHead = this.headRequestCache.get(cacheKey);

    if (knownToBlockHead === true) {
      // Convert to GET with Range header
      return this.convertToRangedGet(url, options, transform);
    }

    if (knownToBlockHead === false) {
      // Known to work, keep as HEAD
      return transform;
    }

    // Unknown, try HEAD first but be prepared to fall back
    try {
      // Test HEAD request with short timeout
      const testResponse = await this.testHeadRequest(url);
      
      if (testResponse) {
        // HEAD request worked, cache this result and proceed
        this.headRequestCache.set(cacheKey, false);
        return transform;
      } else {
        // HEAD request failed, cache this and convert to GET
        this.headRequestCache.set(cacheKey, true);
        return this.convertToRangedGet(url, options, transform);
      }
    } catch {
      // Error testing HEAD, assume it's blocked
      this.headRequestCache.set(cacheKey, true);
      return this.convertToRangedGet(url, options, transform);
    }
  }

  /**
   * Convert HEAD request to GET request with Range header
   */
  private convertToRangedGet(
    url: string, 
    options?: RequestInit,
    transform: RequestTransform = {}
  ): RequestTransform {
    const maxLength = this.githubConfig.maxContentLength || 1024;
    
    return {
      ...transform,
      method: 'GET',
      headers: {
        ...transform.headers,
        'Range': `bytes=0-${maxLength - 1}`,
        'Accept': '*/*',
        'User-Agent': this.getUserAgent()
      },
      options: {
        ...transform.options,
        method: 'GET'
      }
    };
  }

  /**
   * Add GitHub Pages specific headers
   */
  private addGitHubPagesHeaders(transform: RequestTransform): void {
    if (!transform.headers) {
      transform.headers = {};
    }

    // Add User-Agent to avoid potential blocking
    if (!transform.headers['User-Agent']) {
      transform.headers['User-Agent'] = this.getUserAgent();
    }

    // Add Accept header for better compatibility
    if (!transform.headers['Accept']) {
      transform.headers['Accept'] = '*/*';
    }

    // Add Cache-Control for development
    if (this.isLocalDevelopment()) {
      transform.headers['Cache-Control'] = 'no-cache';
    }
  }

  /**
   * Handle failed requests with GitHub Pages specific retry logic
   */
  async handleFailedRequest(
    url: string,
    error: Error,
    attemptNumber: number,
    originalOptions?: RequestInit
  ): Promise<RequestTransform | null> {
    const method = originalOptions?.method?.toUpperCase() || 'GET';

    // If HEAD request failed, try converting to GET
    if (method === 'HEAD' && this.githubConfig.enableHeadToGetTransform) {
      const cacheKey = this.getUrlCacheKey(url);
      this.headRequestCache.set(cacheKey, true);
      
      return this.convertToRangedGet(url, originalOptions);
    }

    // Handle specific GitHub Pages error patterns
    if (this.isGitHubPagesError(error)) {
      return await this.handleGitHubPagesSpecificError(url, error, originalOptions);
    }

    // If this is a CORS error, try different approaches
    if (this.isCorsError(error)) {
      return await this.handleCorsError(url, error, originalOptions);
    }

    // For rate limiting, implement backoff
    if (this.isRateLimitError(error)) {
      const retryAfter = this.extractRetryAfter(error);
      if (retryAfter && attemptNumber <= 2) {
        // Wait longer for rate limiting
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return { url, options: originalOptions };
      }
    }

    // No specific handling for this error
    return null;
  }

  /**
   * Handle GitHub Pages specific errors
   */
  private async handleGitHubPagesSpecificError(
    url: string,
    error: Error,
    originalOptions?: RequestInit
  ): Promise<RequestTransform | null> {
    // Check if this might be an HTML error page
    if (error.message.includes('404') || error.message.includes('not found')) {
      // For markdown files, try common variations
      if (url.endsWith('.md')) {
        const variations = this.getUrlVariations(url);
        for (const variation of variations) {
          try {
            const testResponse = await this.testRequest(variation);
            if (testResponse && testResponse.ok) {
              return { url: variation, options: originalOptions };
            }
          } catch {
            // Continue to next variation
          }
        }
      }
    }

    return null;
  }

  /**
   * Handle CORS errors
   */
  private async handleCorsError(
    url: string,
    error: Error,
    originalOptions?: RequestInit
  ): Promise<RequestTransform | null> {
    // Try removing problematic headers
    const cleanOptions = { ...originalOptions };
    if (cleanOptions.headers) {
      const headers = { ...cleanOptions.headers } as any;
      delete headers['Authorization'];
      delete headers['X-Requested-With'];
      cleanOptions.headers = headers;
    }

    return { url, options: cleanOptions };
  }

  /**
   * Get environment-specific error suggestions
   */
  getErrorSuggestions(error: Error, url: string): string[] {
    const suggestions = this.getCommonSuggestions(error, url);
    
    // Add GitHub Pages specific suggestions
    if (this.isGitHubPagesError(error)) {
      suggestions.unshift(
        'Verify the file exists in your GitHub repository',
        'Check if GitHub Pages is enabled for your repository',
        'Ensure the file is in the correct branch (main/master or gh-pages)'
      );
    }

    if (error.message.includes('HEAD') || this.headRequestCache.get(this.getUrlCacheKey(url))) {
      suggestions.unshift(
        'GitHub Pages blocks HEAD requests - using GET with Range headers instead',
        'This is normal behavior for GitHub Pages'
      );
    }

    if (this.isCorsError(error)) {
      suggestions.unshift(
        'GitHub Pages has CORS restrictions for some file types',
        'Try accessing the file directly in your browser',
        'Ensure your site is served over HTTPS if the target is HTTPS'
      );
    }

    return suggestions;
  }

  /**
   * Test if HEAD request works for a URL
   */
  private async testHeadRequest(url: string): Promise<Response | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // Very short timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok ? response : null;
    } catch {
      return null;
    }
  }

  /**
   * Test a request quickly
   */
  private async testRequest(url: string): Promise<Response | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response;
    } catch {
      return null;
    }
  }

  /**
   * Get URL variations to try for failed requests
   */
  private getUrlVariations(url: string): string[] {
    const variations: string[] = [];
    
    if (url.endsWith('.md')) {
      // Try with .markdown extension
      variations.push(url.replace(/\.md$/, '.markdown'));
      
      // Try with README prefix if it's an index-like name
      const fileName = url.split('/').pop() || '';
      if (!fileName.toLowerCase().startsWith('readme')) {
        const basePath = url.substring(0, url.lastIndexOf('/') + 1);
        variations.push(basePath + 'README.md');
      }
    }

    // Try different case variations for case-sensitive filesystems
    if (url.includes('/')) {
      const parts = url.split('/');
      const fileName = parts.pop() || '';
      variations.push(parts.join('/') + '/' + fileName.toLowerCase());
      variations.push(parts.join('/') + '/' + fileName.toUpperCase());
    }

    return variations;
  }

  /**
   * Check if error is GitHub Pages specific
   */
  private isGitHubPagesError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('github') ||
      message.includes('pages') ||
      message.includes('404') ||
      (message.includes('not found') && this.environment.type === 'github_pages')
    );
  }

  /**
   * Check if error is CORS related
   */
  private isCorsError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('cors') ||
      message.includes('cross-origin') ||
      message.includes('access-control')
    );
  }

  /**
   * Check if error is rate limiting
   */
  private isRateLimitError(error: Error): boolean {
    const status = this.getHttpStatusFromError(error);
    return status === 429 || error.message.toLowerCase().includes('rate limit');
  }

  /**
   * Extract retry-after value from error
   */
  private extractRetryAfter(error: Error): number | null {
    const retryMatch = error.message.match(/retry[- ]?after:?\s*(\d+)/i);
    return retryMatch ? parseInt(retryMatch[1]) : null;
  }

  /**
   * Get cache key for URL
   */
  private getUrlCacheKey(url: string): string {
    // Normalize URL for caching
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Get appropriate User-Agent string
   */
  private getUserAgent(): string {
    const baseUA = 'MarkdownDocsViewer/1.0';
    
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return `${baseUA} (${navigator.userAgent})`;
    }
    
    return baseUA;
  }

  /**
   * Check if running in local development
   */
  private isLocalDevelopment(): boolean {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    }
    return false;
  }

  /**
   * Enhanced response validation for GitHub Pages
   */
  protected async validateResponseContent(response: Response, url: string): Promise<void> {
    await super.validateResponseContent(response, url);

    // GitHub Pages specific validation
    const contentType = response.headers.get('content-type') || '';
    
    // Check for GitHub Pages error pages (which are often HTML)
    if (url.endsWith('.md') && contentType.includes('text/html')) {
      const text = await response.clone().text();
      const lowerText = text.toLowerCase();
      
      // GitHub Pages specific error page markers
      if (lowerText.includes('404 - file not found') ||
          lowerText.includes('github pages') && lowerText.includes('not found') ||
          lowerText.includes('there isn\'t a github pages site here')) {
        throw OptimizationErrors.documentNotFound(url);
      }
    }

    // Check for GitHub rate limiting in response body
    if (response.status === 200 && contentType.includes('application/json')) {
      try {
        const json = await response.clone().json();
        if (json.message && json.message.includes('rate limit')) {
          throw OptimizationErrors.rateLimited(url);
        }
      } catch {
        // Not JSON, ignore
      }
    }
  }
}