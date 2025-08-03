/**
 * Netlify adapter for handling platform-specific optimizations
 * Netlify generally has good compatibility but this adapter handles edge cases
 */

import { BaseAdapter, RequestTransform, AdapterConfig } from './base-adapter';
import { EnvironmentInfo } from '../foundation/environment-utils';
import { OptimizationErrors } from '../errors';

/**
 * Netlify specific configuration
 */
export interface NetlifyConfig extends AdapterConfig {
  enableFunctionDetection?: boolean;
  enableRedirectHandling?: boolean;
  enableEdgeCaching?: boolean;
}

/**
 * Netlify adapter that handles platform-specific optimizations
 */
export class NetlifyAdapter extends BaseAdapter {
  private readonly netlifyConfig: NetlifyConfig;

  constructor(environment: EnvironmentInfo, config: NetlifyConfig = {}) {
    super(environment, config);
    this.netlifyConfig = {
      enableFunctionDetection: true,
      enableRedirectHandling: true,
      enableEdgeCaching: true,
      ...config
    };
  }

  /**
   * Transform requests for Netlify optimization
   */
  async transformRequest(url: string, options?: RequestInit): Promise<RequestTransform> {
    const transform: RequestTransform = {
      url,
      method: options?.method || 'GET',
      headers: { ...options?.headers },
      options: { ...options }
    };

    // Add Netlify-optimized headers
    this.addNetlifyHeaders(transform);

    // Handle Netlify Functions if detected
    if (this.netlifyConfig.enableFunctionDetection && this.isNetlifyFunction(url)) {
      return this.optimizeForNetlifyFunction(transform);
    }

    return transform;
  }

  /**
   * Handle failed requests with Netlify-specific logic
   */
  async handleFailedRequest(
    url: string,
    error: Error,
    attemptNumber: number,
    originalOptions?: RequestInit
  ): Promise<RequestTransform | null> {
    // Handle Netlify redirects
    if (this.netlifyConfig.enableRedirectHandling && this.isRedirectError(error)) {
      const redirectUrl = await this.detectNetlifyRedirect(url);
      if (redirectUrl) {
        return { url: redirectUrl, options: originalOptions };
      }
    }

    // Handle Netlify function timeouts
    if (this.isNetlifyFunction(url) && this.isTimeoutError(error)) {
      // Retry with longer timeout for functions
      return {
        url,
        options: {
          ...originalOptions,
          signal: this.createLongerTimeoutSignal()
        }
      };
    }

    // No specific handling for this error
    return null;
  }

  /**
   * Get Netlify-specific error suggestions
   */
  getErrorSuggestions(error: Error, url: string): string[] {
    const suggestions = this.getCommonSuggestions(error, url);
    
    // Add Netlify specific suggestions
    if (this.isNetlifyFunction(url)) {
      suggestions.unshift(
        'Check if the Netlify function is deployed and running',
        'Verify function permissions and environment variables',
        'Check Netlify function logs for errors'
      );
    }

    if (this.isRedirectError(error)) {
      suggestions.unshift(
        'Check Netlify _redirects file for redirect rules',
        'Verify the redirect target exists',
        'Check for redirect loops'
      );
    }

    if (error.message.includes('404') && url.includes('/.netlify/')) {
      suggestions.unshift(
        'Netlify feature not available in this environment',
        'Check if you\'re on the correct Netlify domain'
      );
    }

    return suggestions;
  }

  /**
   * Add Netlify-optimized headers
   */
  private addNetlifyHeaders(transform: RequestTransform): void {
    if (!transform.headers) {
      transform.headers = {};
    }

    // Enable Netlify edge caching if configured
    if (this.netlifyConfig.enableEdgeCaching) {
      transform.headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes
    }

    // Add User-Agent for Netlify analytics
    if (!transform.headers['User-Agent']) {
      transform.headers['User-Agent'] = 'MarkdownDocsViewer/1.0 (Netlify)';
    }
  }

  /**
   * Check if URL is a Netlify function
   */
  private isNetlifyFunction(url: string): boolean {
    return url.includes('/.netlify/functions/') || url.includes('/.netlify/edge-functions/');
  }

  /**
   * Optimize request for Netlify functions
   */
  private optimizeForNetlifyFunction(transform: RequestTransform): RequestTransform {
    // Functions may take longer, so don't add aggressive timeouts
    if (transform.options && transform.options.signal) {
      delete transform.options.signal;
    }

    // Add function-specific headers
    if (!transform.headers) {
      transform.headers = {};
    }

    transform.headers['Accept'] = 'application/json, text/plain, */*';
    
    return transform;
  }

  /**
   * Check if error indicates a redirect
   */
  private isRedirectError(error: Error): boolean {
    const status = this.getHttpStatusFromError(error);
    return status === 301 || status === 302 || status === 307 || status === 308;
  }

  /**
   * Check if error is a timeout
   */
  private isTimeoutError(error: Error): boolean {
    return error.name === 'AbortError' || error.message.includes('timeout');
  }

  /**
   * Detect Netlify redirects by checking common redirect patterns
   */
  private async detectNetlifyRedirect(url: string): Promise<string | null> {
    try {
      // Try to fetch the Netlify _redirects file
      const redirectsUrl = new URL('/_redirects', url).href;
      const response = await fetch(redirectsUrl, { method: 'GET' });
      
      if (response.ok) {
        const redirectRules = await response.text();
        const redirectTarget = this.parseRedirectRules(redirectRules, url);
        if (redirectTarget) {
          return redirectTarget;
        }
      }
    } catch {
      // Ignore errors in redirect detection
    }

    // Try common Netlify redirect patterns
    const commonRedirects = this.getCommonNetlifyRedirects(url);
    for (const redirectUrl of commonRedirects) {
      try {
        const response = await fetch(redirectUrl, { method: 'HEAD' });
        if (response.ok) {
          return redirectUrl;
        }
      } catch {
        // Continue to next redirect
      }
    }

    return null;
  }

  /**
   * Parse Netlify redirect rules
   */
  private parseRedirectRules(rules: string, originalUrl: string): string | null {
    const lines = rules.split('\n');
    const urlPath = new URL(originalUrl).pathname;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const fromPattern = parts[0];
        const toPattern = parts[1];
        
        // Simple pattern matching (could be enhanced)
        if (this.matchesRedirectPattern(urlPath, fromPattern)) {
          return this.resolveRedirectTarget(originalUrl, toPattern);
        }
      }
    }
    
    return null;
  }

  /**
   * Check if URL path matches redirect pattern
   */
  private matchesRedirectPattern(path: string, pattern: string): boolean {
    // Convert Netlify redirect pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\?')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Resolve redirect target URL
   */
  private resolveRedirectTarget(originalUrl: string, target: string): string {
    if (target.startsWith('http')) {
      return target;
    }
    
    const base = new URL(originalUrl);
    return new URL(target, base).href;
  }

  /**
   * Get common Netlify redirect patterns to try
   */
  private getCommonNetlifyRedirects(url: string): string[] {
    const redirects: string[] = [];
    const urlObj = new URL(url);
    
    // Try without trailing slash
    if (urlObj.pathname.endsWith('/')) {
      redirects.push(url.slice(0, -1));
    } else {
      redirects.push(url + '/');
    }
    
    // Try with index.html
    if (!urlObj.pathname.includes('.')) {
      const indexUrl = url.endsWith('/') ? url + 'index.html' : url + '/index.html';
      redirects.push(indexUrl);
    }
    
    return redirects;
  }

  /**
   * Create longer timeout signal for functions
   */
  private createLongerTimeoutSignal(): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30000); // 30 seconds for functions
    return controller.signal;
  }

  /**
   * Enhanced response validation for Netlify
   */
  protected async validateResponseContent(response: Response, url: string): Promise<void> {
    await super.validateResponseContent(response, url);

    // Check for Netlify-specific error pages
    const contentType = response.headers.get('content-type') || '';
    
    if (response.status === 404 && contentType.includes('text/html')) {
      const text = await response.clone().text();
      const lowerText = text.toLowerCase();
      
      // Netlify specific 404 page markers
      if (lowerText.includes('netlify') && lowerText.includes('page not found')) {
        throw OptimizationErrors.documentNotFound(url);
      }
    }

    // Check for Netlify function errors
    if (this.isNetlifyFunction(url) && !response.ok) {
      const text = await response.clone().text();
      if (text.includes('Function not found') || text.includes('Lambda error')) {
        throw OptimizationErrors.networkRequestFailed(
          url, 
          response.status, 
          'Netlify function error'
        );
      }
    }
  }
}