/**
 * Base adapter for environment-specific request handling
 * Provides common functionality for all environment adapters
 */

import { EnvironmentInfo } from '../foundation/environment-utils';
import { NetworkError, OptimizationErrors } from '../errors';

/**
 * Request transformation interface
 */
export interface RequestTransform {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  options?: RequestInit;
  skipRequest?: boolean;
  fallbackResponse?: Response;
}

/**
 * Adapter configuration interface
 */
export interface AdapterConfig {
  maxRetries?: number;
  timeoutMs?: number;
  enableCaching?: boolean;
  customHeaders?: Record<string, string>;
  fallbackBehavior?: 'retry' | 'skip' | 'error';
}

/**
 * Base adapter class that all environment adapters extend
 */
export abstract class BaseAdapter {
  protected environment: EnvironmentInfo;
  protected config: AdapterConfig;

  constructor(environment: EnvironmentInfo, config: AdapterConfig = {}) {
    this.environment = environment;
    this.config = {
      maxRetries: 3,
      timeoutMs: 10000,
      enableCaching: true,
      fallbackBehavior: 'retry',
      ...config
    };
  }

  /**
   * Transform a request before it's sent
   * Each adapter implements this to handle environment-specific requirements
   */
  abstract transformRequest(url: string, options?: RequestInit): Promise<RequestTransform>;

  /**
   * Handle a failed request with environment-specific retry logic
   */
  abstract handleFailedRequest(
    url: string, 
    error: Error, 
    attemptNumber: number,
    originalOptions?: RequestInit
  ): Promise<RequestTransform | null>;

  /**
   * Get environment-specific error suggestions
   */
  abstract getErrorSuggestions(error: Error, url: string): string[];

  /**
   * Execute a request with environment-specific transformations
   */
  async executeRequest(url: string, options?: RequestInit): Promise<Response> {
    let attemptNumber = 0;
    let lastError: Error | null = null;

    while (attemptNumber < (this.config.maxRetries || 3) + 1) {
      try {
        // Transform the request for this environment
        const transform = await this.transformRequest(url, options);

        // If adapter says to skip, return a fallback response
        if (transform.skipRequest) {
          if (transform.fallbackResponse) {
            return transform.fallbackResponse;
          }
          throw new Error(`Request skipped by ${this.environment.type} adapter`);
        }

        // Execute the transformed request
        const requestUrl = transform.url || url;
        const requestMethod = transform.method || options?.method || 'GET';
        const requestOptions: RequestInit = {
          ...options,
          ...transform.options,
          method: requestMethod,
          headers: {
            ...options?.headers,
            ...this.config.customHeaders,
            ...transform.headers
          }
        };

        // Add timeout if specified
        if (this.config.timeoutMs) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
          requestOptions.signal = controller.signal;

          try {
            const response = await fetch(requestUrl, requestOptions);
            clearTimeout(timeoutId);
            
            // Validate response
            await this.validateResponse(response, requestUrl);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        } else {
          const response = await fetch(requestUrl, requestOptions);
          await this.validateResponse(response, requestUrl);
          return response;
        }

      } catch (error) {
        lastError = error as Error;
        attemptNumber++;

        // If this was the last attempt, throw the error
        if (attemptNumber > (this.config.maxRetries || 3)) {
          break;
        }

        // Try to handle the failed request
        const retryTransform = await this.handleFailedRequest(
          url, 
          lastError, 
          attemptNumber, 
          options
        );

        // If adapter says no retry, break
        if (!retryTransform) {
          break;
        }

        // If adapter returned a fallback response, return it
        if (retryTransform.fallbackResponse) {
          return retryTransform.fallbackResponse;
        }

        // Wait before retry (exponential backoff)
        await this.waitBeforeRetry(attemptNumber);
      }
    }

    // All retries failed, create appropriate error
    throw this.createAdapterError(url, lastError || new Error('Unknown error'), attemptNumber - 1);
  }

  /**
   * Validate response and throw appropriate errors
   */
  protected async validateResponse(response: Response, url: string): Promise<void> {
    if (!response.ok) {
      // Check for specific error patterns that each environment might have
      if (response.status === 404) {
        throw OptimizationErrors.documentNotFound(url);
      }
      
      if (response.status === 403) {
        throw OptimizationErrors.networkRequestFailed(url, 403, 'Forbidden');
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        throw OptimizationErrors.rateLimited(url, retryAfter ? parseInt(retryAfter) : undefined);
      }

      if (response.status >= 500) {
        throw OptimizationErrors.networkRequestFailed(url, response.status, response.statusText);
      }

      // Generic client error
      throw OptimizationErrors.networkRequestFailed(url, response.status, response.statusText);
    }

    // Additional validation for CORS and content type if needed
    await this.validateResponseContent(response, url);
  }

  /**
   * Validate response content (can be overridden by adapters)
   */
  protected async validateResponseContent(response: Response, url: string): Promise<void> {
    // Check if response is actually HTML error page (common in static hosting)
    const contentType = response.headers.get('content-type') || '';
    
    if (url.endsWith('.md') || url.endsWith('.markdown')) {
      // For markdown files, ensure we're not getting HTML error pages
      if (contentType.includes('text/html')) {
        // Read a small portion to check for error page markers
        const text = await response.clone().text();
        const firstKB = text.slice(0, 1024).toLowerCase();
        
        if (firstKB.includes('<title>404') || 
            firstKB.includes('not found') || 
            firstKB.includes('error')) {
          throw OptimizationErrors.documentNotFound(url);
        }
      }
    }
  }

  /**
   * Create environment-specific error with suggestions
   */
  protected createAdapterError(url: string, originalError: Error, attempts: number): NetworkError {
    const suggestions = this.getErrorSuggestions(originalError, url);
    
    // Determine if this is a retryable error
    const isRetryable = this.isRetryableError(originalError);
    
    return new NetworkError(
      this.getErrorCodeFromError(originalError),
      `${this.environment.type} adapter failed after ${attempts} attempts: ${originalError.message}`,
      this.getUserMessageFromError(originalError, url),
      suggestions,
      isRetryable,
      this.getHttpStatusFromError(originalError),
      {
        requestUrl: url,
        environment: this.environment.type,
        retryAttempt: attempts,
        originalError: originalError,
        adapterType: this.constructor.name
      }
    );
  }

  /**
   * Wait before retry with exponential backoff
   */
  protected async waitBeforeRetry(attemptNumber: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Determine if an error is retryable
   */
  protected isRetryableError(error: Error): boolean {
    // Network errors are generally retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.name === 'AbortError') {
      return true;
    }
    
    // 5xx server errors are retryable
    const status = this.getHttpStatusFromError(error);
    if (status && status >= 500) {
      return true;
    }
    
    // 429 rate limiting is retryable
    if (status === 429) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract HTTP status from error (if available)
   */
  protected getHttpStatusFromError(error: Error): number | undefined {
    // Check if error has status property (common in fetch errors)
    if ('status' in error && typeof (error as any).status === 'number') {
      return (error as any).status;
    }
    
    // Parse status from error message if possible
    const statusMatch = error.message.match(/status:?\s*(\d{3})/i);
    if (statusMatch) {
      return parseInt(statusMatch[1]);
    }
    
    return undefined;
  }

  /**
   * Map error to appropriate error code
   */
  protected getErrorCodeFromError(error: Error): any {
    const status = this.getHttpStatusFromError(error);
    
    if (status === 404) return 'DOCUMENT_NOT_FOUND';
    if (status === 403) return 'NETWORK_ERROR';
    if (status === 429) return 'RATE_LIMITED';
    if (status && status >= 500) return 'NETWORK_ERROR';
    if (error.name === 'AbortError') return 'NETWORK_TIMEOUT';
    
    return 'NETWORK_ERROR';
  }

  /**
   * Generate user-friendly error message
   */
  protected getUserMessageFromError(error: Error, _url: string): string {
    const status = this.getHttpStatusFromError(error);
    
    if (status === 404) {
      return 'The requested document could not be found.';
    }
    
    if (status === 403) {
      return 'Access to the requested document was denied.';
    }
    
    if (status === 429) {
      return 'Too many requests. Please wait before trying again.';
    }
    
    if (error.name === 'AbortError') {
      return 'Request timed out. Please try again.';
    }
    
    if (error.message.includes('CORS')) {
      return 'Cross-origin request blocked. This may be due to browser security restrictions.';
    }
    
    return `Unable to load content from ${this.environment.type}. Please try again.`;
  }

  /**
   * Get common suggestions that apply to all environments
   */
  protected getCommonSuggestions(error: Error, _url: string): string[] {
    const suggestions: string[] = [];
    
    if (this.getHttpStatusFromError(error) === 404) {
      suggestions.push(
        'Check if the file exists at the specified path',
        'Verify the file extension is correct',
        'Check if the file has been moved or renamed'
      );
    } else if (error.name === 'AbortError') {
      suggestions.push(
        'Check your internet connection',
        'The server might be temporarily overloaded',
        'Try again in a few moments'
      );
    } else if (error.message.includes('CORS')) {
      suggestions.push(
        'Ensure the server allows cross-origin requests',
        'Check if the URL protocol matches your site (HTTP vs HTTPS)'
      );
    } else {
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      );
    }
    
    return suggestions;
  }
}