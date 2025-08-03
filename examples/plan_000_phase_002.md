# Plan 000 - Phase 2: Infrastructure & Reliability

## Overview

This phase builds critical infrastructure for request management and error handling. It introduces a request pool manager with circuit breaker functionality and implements comprehensive error handling to provide better user feedback when discovery fails.

## Timeline

**Duration**: Week 2 (5 days)  
**Priority**: High (Stability and user experience)

## Objectives

1. Implement request pooling to limit concurrent HTTP requests
2. Add circuit breaker pattern for handling repeated failures
3. Create comprehensive error handling with user-friendly messages
4. Implement request deduplication to prevent redundant calls
5. Provide actionable feedback when discovery fails

## Issue Implementation

### Issue #3: Request Pool Manager and Circuit Breaker

**Priority**: High | **Type**: Infrastructure | **Effort**: 4-5 days

#### Implementation Details

**Step 1: Core Request Manager** (Day 1-2)

```typescript
// src/request-manager.ts
import { PerformanceMonitor } from './utils/performance-monitor';
import { ErrorFactory, ErrorType } from './utils/error-factory';

export interface RequestManagerOptions {
  maxConcurrent?: number; // Default: 5
  timeout?: number; // Default: 10000ms
  circuitBreakerThreshold?: number; // Default: 10
  circuitBreakerTimeout?: number; // Default: 60000ms
  retryAttempts?: number; // Default: 2
  retryDelay?: number; // Default: 1000ms
}

export interface RequestResult<T = Response> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  attempts: number;
}

export class RequestManager {
  private static instance: RequestManager;
  private options: Required<RequestManagerOptions>;

  // Request pooling
  private activeRequests = new Set<Promise<any>>();
  private requestQueue: Array<{
    execute: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  // Circuit breaker
  private consecutiveFailures = 0;
  private circuitOpen = false;
  private circuitOpenTime = 0;

  // Request deduplication
  private inflightRequests = new Map<string, Promise<Response>>();

  // Performance tracking
  private performanceMonitor = new PerformanceMonitor();

  private constructor(options: RequestManagerOptions = {}) {
    this.options = {
      maxConcurrent: 5,
      timeout: 10000,
      circuitBreakerThreshold: 10,
      circuitBreakerTimeout: 60000,
      retryAttempts: 2,
      retryDelay: 1000,
      ...options,
    };
  }

  static getInstance(options?: RequestManagerOptions): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager(options);
    }
    return RequestManager.instance;
  }

  async fetch(url: string, init?: RequestInit): Promise<RequestResult> {
    const startTime = performance.now();
    let attempts = 0;

    try {
      // Check circuit breaker
      this.checkCircuitBreaker();

      // Request deduplication
      const requestKey = this.getRequestKey(url, init);
      const inflight = this.inflightRequests.get(requestKey);
      if (inflight) {
        console.log(`♻️  Reusing inflight request for: ${url}`);
        const response = await inflight;
        return {
          success: response.ok,
          data: response.clone(),
          duration: performance.now() - startTime,
          attempts: 0, // Reused request
        };
      }

      // Execute request with retry logic
      let lastError: Error | undefined;

      for (attempts = 1; attempts <= this.options.retryAttempts; attempts++) {
        try {
          const response = await this.executeRequest(url, init, requestKey);

          // Reset circuit breaker on success
          this.consecutiveFailures = 0;

          return {
            success: response.ok,
            data: response,
            duration: performance.now() - startTime,
            attempts,
          };
        } catch (error) {
          lastError = error as Error;

          // Don't retry on certain errors
          if (this.isNonRetryableError(error)) {
            break;
          }

          // Wait before retry (exponential backoff)
          if (attempts < this.options.retryAttempts) {
            const delay = this.options.retryDelay * Math.pow(2, attempts - 1);
            await this.delay(delay);
          }
        }
      }

      // All attempts failed
      throw lastError || new Error('Request failed');
    } catch (error) {
      // Update circuit breaker
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.options.circuitBreakerThreshold) {
        this.openCircuit();
      }

      return {
        success: false,
        error: error as Error,
        duration: performance.now() - startTime,
        attempts,
      };
    }
  }

  private async executeRequest(
    url: string,
    init?: RequestInit,
    requestKey?: string
  ): Promise<Response> {
    // Wait for available slot in request pool
    while (this.activeRequests.size >= this.options.maxConcurrent) {
      await this.waitForSlot();
    }

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    const fetchPromise = fetch(url, {
      ...init,
      signal: controller.signal,
    });

    // Track in request pool
    this.activeRequests.add(fetchPromise);

    // Track for deduplication
    if (requestKey) {
      this.inflightRequests.set(requestKey, fetchPromise);
    }

    try {
      const response = await fetchPromise;
      clearTimeout(timeoutId);
      return response;
    } finally {
      // Cleanup
      this.activeRequests.delete(fetchPromise);
      if (requestKey) {
        this.inflightRequests.delete(requestKey);
      }

      // Process queued requests
      this.processQueue();
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        execute: () => Promise.resolve(),
        resolve,
        reject,
      });
    });
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0 && this.activeRequests.size < this.options.maxConcurrent) {
      const queued = this.requestQueue.shift();
      if (queued) {
        queued.resolve(undefined);
      }
    }
  }

  private checkCircuitBreaker(): void {
    if (!this.circuitOpen) return;

    const elapsed = Date.now() - this.circuitOpenTime;
    if (elapsed > this.options.circuitBreakerTimeout) {
      // Try to close circuit
      this.circuitOpen = false;
      this.consecutiveFailures = 0;
      console.log('🔌 Circuit breaker reset');
    } else {
      throw new Error(
        `Circuit breaker is open. Too many consecutive failures. Retry in ${Math.ceil(
          (this.options.circuitBreakerTimeout - elapsed) / 1000
        )} seconds.`
      );
    }
  }

  private openCircuit(): void {
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();
    console.error(
      `🔌 Circuit breaker opened after ${this.consecutiveFailures} consecutive failures`
    );
  }

  private getRequestKey(url: string, init?: RequestInit): string {
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.stringify(init.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on CORS errors, 4xx client errors, etc.
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return true; // CORS error
    }

    if (error.status && error.status >= 400 && error.status < 500) {
      return true; // Client error
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for monitoring and management

  getStats(): {
    activeRequests: number;
    queuedRequests: number;
    circuitOpen: boolean;
    consecutiveFailures: number;
  } {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      circuitOpen: this.circuitOpen,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  reset(): void {
    this.activeRequests.clear();
    this.requestQueue = [];
    this.inflightRequests.clear();
    this.consecutiveFailures = 0;
    this.circuitOpen = false;
  }
}
```

**Step 2: Integration with Existing Code** (Day 2-3)

```typescript
// src/config-loader.ts (update to use RequestManager)
import { RequestManager } from './request-manager';

export class ConfigLoader {
  private requestManager = RequestManager.getInstance();

  private async checkFileExists(filename: string): Promise<boolean> {
    const result = await this.requestManager.fetch(filename, {
      method: 'HEAD',
    });

    return result.success && result.data?.ok === true;
  }

  private async loadConfigFile(path: string): Promise<void> {
    const result = await this.requestManager.fetch(path);

    if (!result.success || !result.data?.ok) {
      const error = result.error || new Error(`Failed to load config from ${path}`);
      throw ErrorFactory.create(error, 'config-loading', ErrorType.FILE_NOT_FOUND);
    }

    try {
      const userConfig = await result.data.json();
      this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch (error) {
      throw ErrorFactory.create(error as Error, 'config-parsing', ErrorType.INVALID_CONFIG);
    }
  }
}
```

---

### Issue #4: Enhanced Error Handling and User Feedback

**Priority**: High | **Type**: User Experience | **Effort**: 3-4 days

#### Implementation Details

**Step 1: Enhanced Error System** (Day 3-4)

```typescript
// src/errors/discovery-error.ts
export class DiscoveryError extends Error {
  constructor(
    public readonly type: ErrorType,
    public readonly context: string,
    public readonly userMessage: string,
    public readonly technicalDetails: string,
    public readonly suggestions: string[],
    public readonly originalError?: Error
  ) {
    super(userMessage);
    this.name = 'DiscoveryError';
  }

  toJSON() {
    return {
      type: this.type,
      context: this.context,
      userMessage: this.userMessage,
      technicalDetails: this.technicalDetails,
      suggestions: this.suggestions,
      timestamp: new Date().toISOString(),
    };
  }
}

// src/errors/error-analyzer.ts
export class ErrorAnalyzer {
  static analyze(
    error: Error,
    context: string
  ): {
    type: ErrorType;
    userMessage: string;
    suggestions: string[];
  } {
    // CORS detection
    if (this.isCorsError(error)) {
      return {
        type: ErrorType.CORS_ERROR,
        userMessage: 'Unable to access documentation files due to browser security restrictions.',
        suggestions: [
          'Ensure your documentation is served from the same domain as your website',
          'Configure CORS headers on your server to allow access',
          'Consider using a docs-manifest.json file to avoid discovery requests',
        ],
      };
    }

    // Timeout detection
    if (this.isTimeoutError(error)) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        userMessage:
          'The request took too long to complete. This might indicate a slow network or server issue.',
        suggestions: [
          'Check your internet connection',
          'Verify the server is responding',
          'Try again with a better connection',
        ],
      };
    }

    // Rate limiting detection
    if (this.isRateLimitError(error)) {
      return {
        type: ErrorType.RATE_LIMIT,
        userMessage: 'Too many requests have been made. The server is limiting access.',
        suggestions: [
          'Wait a few moments before trying again',
          'Use a docs-manifest.json to reduce the number of requests',
          'Contact your hosting provider about rate limits',
        ],
      };
    }

    // 404 Not Found
    if (this.isNotFoundError(error)) {
      return {
        type: ErrorType.FILE_NOT_FOUND,
        userMessage: 'The requested documentation files could not be found.',
        suggestions: [
          'Verify your documentation files are in the correct location',
          'Check the basePath configuration',
          'Ensure file names match expected patterns (README.md, index.md, etc.)',
        ],
      };
    }

    // Default network error
    return {
      type: ErrorType.NETWORK_ERROR,
      userMessage: 'A network error occurred while loading documentation.',
      suggestions: [
        'Check your internet connection',
        'Verify the documentation URL is correct',
        'Check browser console for technical details',
      ],
    };
  }

  private static isCorsError(error: Error): boolean {
    return (
      error.name === 'TypeError' &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('CORS') ||
        error.message.includes('cross-origin'))
    );
  }

  private static isTimeoutError(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.includes('timed out')
    );
  }

  private static isRateLimitError(error: Error): boolean {
    return (
      error.message.includes('429') ||
      error.message.toLowerCase().includes('rate limit') ||
      error.message.toLowerCase().includes('too many requests')
    );
  }

  private static isNotFoundError(error: Error): boolean {
    return error.message.includes('404') || error.message.toLowerCase().includes('not found');
  }
}
```

**Step 2: Error Display Component** (Day 4)

```typescript
// src/components/error-display.ts
import { DiscoveryError } from '../errors/discovery-error';
import { escapeHtml } from '../utils';

export class ErrorDisplay {
  static render(error: DiscoveryError, container: HTMLElement): void {
    const isDebugMode = localStorage.getItem('mdv_debug_mode') === 'true';

    const html = `
      <div class="mdv-error-container" role="alert" aria-live="assertive">
        <div class="mdv-error-header">
          <svg class="mdv-error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 class="mdv-error-title">Documentation Loading Error</h2>
        </div>
        
        <p class="mdv-error-message">${escapeHtml(error.userMessage)}</p>
        
        ${
          error.suggestions.length > 0
            ? `
          <div class="mdv-error-suggestions">
            <h3>Suggestions:</h3>
            <ul>
              ${error.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
        
        ${
          isDebugMode
            ? `
          <details class="mdv-error-debug">
            <summary>Technical Details</summary>
            <div class="mdv-error-debug-content">
              <p><strong>Error Type:</strong> ${escapeHtml(error.type)}</p>
              <p><strong>Context:</strong> ${escapeHtml(error.context)}</p>
              <pre>${escapeHtml(error.technicalDetails)}</pre>
            </div>
          </details>
        `
            : ''
        }
        
        <div class="mdv-error-actions">
          <button onclick="window.location.reload()" class="mdv-button mdv-button-primary">
            Retry
          </button>
          ${
            !isDebugMode
              ? `
            <button onclick="localStorage.setItem('mdv_debug_mode', 'true'); window.location.reload()" 
                    class="mdv-button mdv-button-secondary">
              Enable Debug Mode
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.injectStyles();
  }

  private static injectStyles(): void {
    if (document.getElementById('mdv-error-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mdv-error-styles';
    styles.textContent = `
      .mdv-error-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: #fff;
        border: 1px solid #e1e4e8;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-error-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1rem;
      }
      
      .mdv-error-icon {
        color: #d73a49;
        flex-shrink: 0;
      }
      
      .mdv-error-title {
        margin: 0;
        font-size: 1.5rem;
        color: #24292e;
      }
      
      .mdv-error-message {
        font-size: 1.1rem;
        line-height: 1.5;
        color: #586069;
        margin-bottom: 1.5rem;
      }
      
      .mdv-error-suggestions {
        background: #f6f8fa;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .mdv-error-suggestions h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        color: #24292e;
      }
      
      .mdv-error-suggestions ul {
        margin: 0;
        padding-left: 1.5rem;
      }
      
      .mdv-error-suggestions li {
        margin: 0.25rem 0;
        color: #586069;
      }
      
      .mdv-error-debug {
        margin-bottom: 1.5rem;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 1rem;
      }
      
      .mdv-error-debug summary {
        cursor: pointer;
        font-weight: 600;
        color: #24292e;
      }
      
      .mdv-error-debug-content {
        margin-top: 1rem;
        font-size: 0.875rem;
      }
      
      .mdv-error-debug pre {
        background: #f6f8fa;
        padding: 0.75rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.8rem;
      }
      
      .mdv-error-actions {
        display: flex;
        gap: 1rem;
      }
      
      .mdv-button {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.2s;
      }
      
      .mdv-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-button-primary {
        background: #0366d6;
        color: white;
        border-color: #0366d6;
      }
      
      .mdv-button-primary:hover {
        background: #0256c7;
      }
      
      .mdv-button-secondary {
        background: white;
        color: #0366d6;
      }
      
      .mdv-button-secondary:hover {
        background: #f6f8fa;
      }
      
      @media (max-width: 600px) {
        .mdv-error-container {
          margin: 1rem;
          padding: 1.5rem;
        }
        
        .mdv-error-actions {
          flex-direction: column;
        }
        
        .mdv-button {
          width: 100%;
          text-align: center;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}
```

**Step 3: Integration with Zero-Config** (Day 5)

```typescript
// src/zero-config.ts (enhanced error handling)
import { ErrorDisplay } from './components/error-display';
import { DiscoveryError } from './errors/discovery-error';
import { ErrorAnalyzer } from './errors/error-analyzer';

export async function init(options: ZeroConfigOptions = {}): Promise<MarkdownDocsViewer> {
  try {
    // ... existing initialization code ...
  } catch (error) {
    console.error('❌ Failed to initialize Markdown Docs Viewer:', error);

    // Create enhanced error
    const analysis = ErrorAnalyzer.analyze(error as Error, 'initialization');
    const discoveryError = new DiscoveryError(
      analysis.type,
      'initialization',
      analysis.userMessage,
      (error as Error).stack || (error as Error).message,
      analysis.suggestions,
      error as Error
    );

    // Log to console for developers
    if (localStorage.getItem('mdv_debug_mode') === 'true') {
      console.group('🔍 Discovery Error Details');
      console.error('Type:', discoveryError.type);
      console.error('Context:', discoveryError.context);
      console.error('Technical Details:', discoveryError.technicalDetails);
      console.error('Suggestions:', discoveryError.suggestions);
      console.groupEnd();
    }

    // Display user-friendly error
    let container: HTMLElement | null = null;
    try {
      container = options.container
        ? typeof options.container === 'string'
          ? document.querySelector(options.container)
          : options.container
        : document.getElementById('docs') || document.body;
    } catch {
      container = document.body;
    }

    if (container) {
      ErrorDisplay.render(discoveryError, container);
    }

    // Return error viewer for consistency
    return createErrorViewer(container, discoveryError);
  }
}
```

## Testing Requirements

### Unit Tests

```typescript
// tests/request-manager.test.ts
describe('RequestManager', () => {
  it('should limit concurrent requests', async () => {
    const manager = RequestManager.getInstance({ maxConcurrent: 2 });

    const requests = Array.from({ length: 5 }, (_, i) => manager.fetch(`/test${i}`));

    // Check that only 2 are active at once
    const stats = manager.getStats();
    expect(stats.activeRequests).toBeLessThanOrEqual(2);
  });

  it('should deduplicate identical requests', async () => {
    const manager = RequestManager.getInstance();

    const request1 = manager.fetch('/test');
    const request2 = manager.fetch('/test');

    // Both should return the same promise
    expect(request1).toBe(request2);
  });

  it('should open circuit breaker after failures', async () => {
    const manager = RequestManager.getInstance({
      circuitBreakerThreshold: 3,
    });

    // Simulate 3 failures
    for (let i = 0; i < 3; i++) {
      await manager.fetch('/fail');
    }

    // Next request should fail immediately
    await expect(manager.fetch('/test')).rejects.toThrow('Circuit breaker is open');
  });
});
```

### Integration Tests

```typescript
// tests/integration/error-handling.test.ts
describe('Error Handling Integration', () => {
  it('should display CORS error correctly', async () => {
    // Mock CORS error
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const container = document.createElement('div');
    await init({ container });

    expect(container.innerHTML).toContain('browser security restrictions');
    expect(container.innerHTML).toContain('Configure CORS headers');
  });

  it('should handle rate limiting gracefully', async () => {
    // Mock 429 response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const container = document.createElement('div');
    await init({ container });

    expect(container.innerHTML).toContain('Too many requests');
    expect(container.innerHTML).toContain('Wait a few moments');
  });
});
```

## Success Metrics

1. **Request Management**
   - [ ] Max 5 concurrent requests enforced
   - [ ] Circuit breaker prevents cascade failures
   - [ ] Request deduplication reduces redundant calls by 50%

2. **Error Handling**
   - [ ] 100% of errors have user-friendly messages
   - [ ] Error suggestions lead to resolution in 80% of cases
   - [ ] Debug mode provides actionable technical details

3. **Performance**
   - [ ] Request pooling reduces overall discovery time by 20%
   - [ ] Circuit breaker prevents hanging requests
   - [ ] Retry logic handles transient failures

4. **User Experience**
   - [ ] Clear error messages reduce support requests
   - [ ] Actionable suggestions help users self-resolve
   - [ ] Debug mode aids developer troubleshooting

## Rollout Strategy

### Week 2 Schedule

**Monday-Tuesday**: Request Manager Implementation

- Implement core request pooling
- Add circuit breaker logic
- Create deduplication system

**Wednesday-Thursday**: Error Handling System

- Build error analysis engine
- Create error display component
- Implement debug mode

**Friday**: Integration and Testing

- Integrate with existing code
- Complete test coverage
- Performance validation

## Next Steps

After completing Phase 2:

- Robust request management in place
- User-friendly error handling implemented
- Ready for Phase 3: Cross-environment compatibility
