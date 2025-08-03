/**
 * Request Pool Manager & Circuit Breaker
 * Prevents request flooding and handles failures gracefully
 * Implements batching, rate limiting, and circuit breaker patterns
 */

import { PerformanceMonitor, getGlobalPerformanceMonitor } from '../foundation/PerformanceMonitor';
import { RequestMonitor, getGlobalRequestMonitor } from '../foundation/RequestMonitor';
import { DiscoveryCache, createDiscoveryCache } from '../foundation/DiscoveryCache';
import { BaseAdapter } from '../adapters/base-adapter';
import { EnvironmentUtils, EnvironmentInfo } from '../foundation/environment-utils';
import { FeatureFlags } from '../foundation/FeatureFlags';

/**
 * Request batch for grouping similar requests
 */
export interface RequestBatch {
  id: string;
  url: string;
  options?: RequestInit;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retryCount?: number;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Requests are blocked
  HALF_OPEN = 'half_open' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time to wait before testing recovery
  successThreshold: number;      // Successes needed to close from half-open
  timeWindow: number;           // Time window for failure counting
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxConcurrentRequests: number;
  burstSize: number;
  windowSize: number;
}

/**
 * Pool manager configuration
 */
export interface PoolManagerConfig {
  maxPoolSize?: number;
  batchSize?: number;
  batchTimeout?: number;
  enableCircuitBreaker?: boolean;
  enableRateLimit?: boolean;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  rateLimit?: Partial<RateLimitConfig>;
}

/**
 * Request execution result
 */
export interface RequestResult {
  batch: RequestBatch;
  response?: Response;
  error?: Error;
  fromCache?: boolean;
  executionTime: number;
  retryAttempt: number;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateChangeCount: number;
}

/**
 * Request Pool Manager with Circuit Breaker and Rate Limiting
 */
export class RequestPoolManager {
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly requestMonitor: RequestMonitor;
  private readonly cache: DiscoveryCache<Response>;
  private readonly environment: EnvironmentInfo;
  private readonly config: Required<PoolManagerConfig>;

  // Circuit breaker state
  private circuitState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private stateChangeCount: number = 0;
  private failureWindow: number[] = [];

  // Rate limiting state
  private requestTokens: number = 0;
  private lastTokenRefill: number = Date.now();
  private activeRequests: number = 0;
  private requestQueue: Array<{
    batch: RequestBatch;
    resolve: (result: RequestResult) => void;
    reject: (error: Error) => void;
  }> = [];

  // Batching state
  private pendingBatches: Map<string, RequestBatch[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    performanceMonitor: PerformanceMonitor,
    requestMonitor: RequestMonitor,
    cache: DiscoveryCache<Response>,
    config: PoolManagerConfig = {}
  ) {
    this.performanceMonitor = performanceMonitor;
    this.requestMonitor = requestMonitor;
    this.cache = cache;
    this.environment = EnvironmentUtils.detectEnvironment();

    // Default configuration
    this.config = {
      maxPoolSize: 10,
      batchSize: 5,
      batchTimeout: 100,
      enableCircuitBreaker: true,
      enableRateLimit: true,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 5000,
        successThreshold: 2,
        timeWindow: 30000,
        ...config.circuitBreaker
      },
      rateLimit: {
        maxRequestsPerSecond: 10,
        maxConcurrentRequests: 5,
        burstSize: 15,
        windowSize: 1000,
        ...config.rateLimit
      },
      ...config
    };

    // Initialize rate limiting tokens
    this.requestTokens = this.config.rateLimit.burstSize;
  }

  /**
   * Execute requests with batching, rate limiting, and circuit breaker
   */
  async batchRequests(requests: RequestBatch[]): Promise<RequestResult[]> {
    const measure = this.performanceMonitor.startMeasure('batch-requests');
    
    try {
      // Check feature flag
      if (!FeatureFlags.isEnabled('REQUEST_POOL_MANAGER')) {
        return this.executeRequestsDirectly(requests);
      }

      // Group requests by similarity for batching
      const batchGroups = this.groupRequestsForBatching(requests);
      const results: RequestResult[] = [];

      // Execute each batch group
      for (const [groupKey, batchGroup] of batchGroups.entries()) {
        const batchResults = await this.executeBatchGroup(groupKey, batchGroup);
        results.push(...batchResults);
      }

      this.performanceMonitor.endMeasure('batch-requests');
      return results;

    } catch (error) {
      this.performanceMonitor.endMeasure('batch-requests');
      throw error;
    }
  }

  /**
   * Execute a single operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    const measureLabel = `circuit-breaker-execute-${Date.now()}-${Math.random()}`; // Use unique label
    
    try {
      this.performanceMonitor.startMeasure(measureLabel);
      
      // Check circuit breaker state
      if (this.config.enableCircuitBreaker) {
        await this.checkCircuitBreaker();
      }

      // Execute operation
      const result = await operation();
      
      // Record success
      if (this.config.enableCircuitBreaker) {
        this.recordSuccess();
      }

      try {
        this.performanceMonitor.endMeasure(measureLabel);
      } catch (endMeasureError) {
        // Ignore endMeasure errors but don't let them break the flow
      }
      
      return result;

    } catch (error) {
      // Record failure
      if (this.config.enableCircuitBreaker) {
        this.recordFailure();
      }

      try {
        this.performanceMonitor.endMeasure(measureLabel);
      } catch (endMeasureError) {
        // Ignore endMeasure errors to prevent masking the original error
      }
      throw error;
    }
  }

  /**
   * Execute rate-limited request
   */
  async rateLimitedRequest(url: string, options?: RequestInit): Promise<Response> {
    // Add timeout protection
    const timeoutMs = 5000; // 5 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const batch: RequestBatch = {
        id: `rate-limited-${Date.now()}-${Math.random()}`,
        url,
        options: {
          ...options,
          signal: options?.signal || controller.signal
        },
        priority: 'normal',
        timeout: timeoutMs
      };

      const results = await this.batchRequests([batch]);
      const result = results[0];

      clearTimeout(timeoutId);

      if (result.error) {
        throw result.error;
      }

      if (!result.response) {
        throw new Error('No response received from rate-limited request');
      }

      return result.response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Batch existence check for multiple URLs
   * Used by progressive document discovery
   */
  async batchExistenceCheck(
    urls: string[],
    options?: { batchSize?: number; maxConcurrency?: number; timeout?: number }
  ): Promise<{ path: string; exists: boolean; error?: Error }[]> {
    const measure = this.performanceMonitor.startMeasure('batch-existence-check');
    
    try {
      const { batchSize = 15, maxConcurrency = 3, timeout = 5000 } = options || {};
      
      // Create HEAD request batches
      const batches: RequestBatch[] = urls.map(url => ({
        id: `existence-check-${Date.now()}-${Math.random()}`,
        url,
        options: { method: 'HEAD' },
        priority: 'normal',
        timeout
      }));

      // Process in chunks to respect concurrency limits
      const results: { path: string; exists: boolean; error?: Error }[] = [];
      
      for (let i = 0; i < batches.length; i += batchSize) {
        const chunk = batches.slice(i, i + batchSize);
        const chunkResults = await this.batchRequests(chunk);
        
        for (const result of chunkResults) {
          results.push({
            path: result.batch.url,
            exists: result.response?.ok || false,
            error: result.error
          });
        }
        
        // Respect concurrency by adding delay between chunks
        if (i + batchSize < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.performanceMonitor.endMeasure('batch-existence-check');
      return results;
      
    } catch (error) {
      this.performanceMonitor.endMeasure('batch-existence-check');
      throw error;
    }
  }

  /**
   * Batch content loading for multiple URLs
   * Used by progressive document discovery
   */
  async batchContentLoad(
    items: Array<{ path: string; processor?: (content: string) => any }>,
    options?: { batchSize?: number; maxConcurrency?: number; timeout?: number }
  ): Promise<any[]> {
    const measure = this.performanceMonitor.startMeasure('batch-content-load');
    
    try {
      const { batchSize = 8, maxConcurrency = 2, timeout = 10000 } = options || {};
      
      // Create GET request batches
      const batches: RequestBatch[] = items.map(item => ({
        id: `content-load-${Date.now()}-${Math.random()}`,
        url: item.path,
        options: { method: 'GET' },
        priority: 'normal',
        timeout
      }));

      // Process in chunks to respect concurrency limits
      const results: any[] = [];
      
      for (let i = 0; i < batches.length; i += batchSize) {
        const chunk = batches.slice(i, i + batchSize);
        const chunkResults = await this.batchRequests(chunk);
        
        for (let j = 0; j < chunkResults.length; j++) {
          const result = chunkResults[j];
          const item = items[i + j];
          
          if (result.error || !result.response?.ok) {
            results.push(null);
            continue;
          }
          
          try {
            const content = await result.response.text();
            
            // Apply processor if provided
            if (item.processor) {
              const processed = item.processor(content);
              results.push(processed);
            } else {
              results.push({ path: item.path, content });
            }
            
          } catch (error) {
            console.warn(`Failed to process content for ${item.path}:`, error);
            results.push(null);
          }
        }
        
        // Respect concurrency by adding delay between chunks
        if (i + batchSize < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      this.performanceMonitor.endMeasure('batch-content-load');
      return results;
      
    } catch (error) {
      this.performanceMonitor.endMeasure('batch-content-load');
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): CircuitBreakerStats {
    return {
      state: this.circuitState,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime || undefined,
      lastSuccessTime: this.lastSuccessTime || undefined,
      stateChangeCount: this.stateChangeCount
    };
  }

  /**
   * Get pool manager statistics
   */
  getStats() {
    return {
      circuitBreaker: this.getCircuitBreakerStats(),
      rateLimit: {
        activeRequests: this.activeRequests,
        queueLength: this.requestQueue.length,
        tokensAvailable: this.requestTokens,
        maxConcurrent: this.config.rateLimit.maxConcurrentRequests
      },
      batching: {
        pendingBatches: this.pendingBatches.size,
        activeTimers: this.batchTimers.size
      },
      performance: this.performanceMonitor.getStats(),
      requests: this.requestMonitor.getStats(),
      config: this.config
    };
  }

  /**
   * Reset circuit breaker and rate limiting state
   */
  reset(): void {
    this.circuitState = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.stateChangeCount = 0;
    this.failureWindow = [];
    this.requestTokens = this.config.rateLimit.burstSize;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.pendingBatches.clear();
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();
  }

  /**
   * Group requests for efficient batching
   */
  private groupRequestsForBatching(requests: RequestBatch[]): Map<string, RequestBatch[]> {
    const groups = new Map<string, RequestBatch[]>();

    for (const request of requests) {
      // Create grouping key based on URL domain and method
      const url = new URL(request.url, window.location.origin);
      const method = request.options?.method || 'GET';
      const groupKey = `${url.origin}:${method}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey)!.push(request);
    }

    return groups;
  }

  /**
   * Execute a batch group with rate limiting and circuit breaker
   */
  private async executeBatchGroup(groupKey: string, batchGroup: RequestBatch[]): Promise<RequestResult[]> {
    const results: RequestResult[] = [];

    // Sort by priority
    batchGroup.sort((a, b) => {
      const priorities = { high: 3, normal: 2, low: 1 };
      return priorities[b.priority || 'normal'] - priorities[a.priority || 'normal'];
    });

    // Execute in chunks respecting rate limits
    for (let i = 0; i < batchGroup.length; i += this.config.batchSize) {
      const chunk = batchGroup.slice(i, i + this.config.batchSize);
      const chunkResults = await this.executeRequestChunk(chunk);
      results.push(...chunkResults);

      // Add delay between chunks if needed
      if (i + this.config.batchSize < batchGroup.length) {
        await this.waitForRateLimit();
      }
    }

    return results;
  }

  /**
   * Execute a chunk of requests with circuit breaker protection
   */
  private async executeRequestChunk(chunk: RequestBatch[]): Promise<RequestResult[]> {
    const promises = chunk.map(async (batch) => {
      return this.executeWithCircuitBreaker(async () => {
        return this.executeSingleRequest(batch);
      });
    });

    return Promise.all(promises);
  }

  /**
   * Execute a single request with monitoring
   */
  private async executeSingleRequest(batch: RequestBatch): Promise<RequestResult> {
    const startTime = performance.now();
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // Wait for rate limit compliance
      await this.acquireRateLimit();

      // Check cache first
      const cacheKey = `${batch.url}:${JSON.stringify(batch.options || {})}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return {
          batch,
          response: cached,
          fromCache: true,
          executionTime: performance.now() - startTime,
          retryAttempt: 0
        };
      }

      // Execute request
      this.activeRequests++;
      
      // Create timeout controller if timeout is specified
      let timeoutController: AbortController | undefined;
      
      if (batch.timeout) {
        timeoutController = new AbortController();
        timeoutId = setTimeout(() => timeoutController!.abort(), batch.timeout);
      }
      
      const monitoredFetch = this.requestMonitor.monitoredFetch.bind(this.requestMonitor);
      const response = await monitoredFetch(batch.url, {
        ...batch.options,
        signal: timeoutController?.signal || batch.options?.signal
      });

      // Cache successful responses
      if (response.ok) {
        this.cache.set(cacheKey, response.clone(), 300000); // 5 minute cache
      }

      // Request tracking is handled automatically through monitored fetch

      return {
        batch,
        response,
        fromCache: false,
        executionTime: performance.now() - startTime,
        retryAttempt: batch.retryCount || 0
      };

    } catch (error) {
      // Failed request tracking is handled automatically through monitored fetch

      return {
        batch,
        error: error as Error,
        fromCache: false,
        executionTime: performance.now() - startTime,
        retryAttempt: batch.retryCount || 0
      };

    } finally {
      // Always clear timeout and decrement counters
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.activeRequests--;
      this.releaseRateLimit();
    }
  }

  /**
   * Check circuit breaker state and throw if open
   */
  private async checkCircuitBreaker(): Promise<void> {
    const now = Date.now();

    switch (this.circuitState) {
      case CircuitBreakerState.CLOSED:
        // Normal operation
        break;

      case CircuitBreakerState.OPEN:
        // Check if recovery timeout has passed
        if (now - this.lastFailureTime >= this.config.circuitBreaker.recoveryTimeout) {
          this.circuitState = CircuitBreakerState.HALF_OPEN;
          this.stateChangeCount++;
          console.log('Circuit breaker moving to HALF_OPEN state');
        } else {
          throw new Error('Circuit breaker is OPEN - requests are blocked');
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        // Allow limited requests to test recovery
        break;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.circuitState === CircuitBreakerState.HALF_OPEN) {
      if (this.successes >= this.config.circuitBreaker.successThreshold) {
        this.circuitState = CircuitBreakerState.CLOSED;
        this.failures = 0;
        this.failureWindow = [];
        this.stateChangeCount++;
        console.log('Circuit breaker moving to CLOSED state');
      }
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(): void {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;

    // Add to failure window
    this.failureWindow.push(now);
    
    // Remove old failures outside time window
    const windowStart = now - this.config.circuitBreaker.timeWindow;
    this.failureWindow = this.failureWindow.filter(time => time > windowStart);

    // Check if we should open the circuit
    if (this.failureWindow.length >= this.config.circuitBreaker.failureThreshold) {
      this.circuitState = CircuitBreakerState.OPEN;
      this.stateChangeCount++;
      console.log(`Circuit breaker OPEN - ${this.failures} failures in time window`);
    }
  }

  /**
   * Acquire rate limit token
   */
  private async acquireRateLimit(): Promise<void> {
    if (!this.config.enableRateLimit) {
      return;
    }

    // Refill tokens based on time passed
    this.refillTokens();

    // Add timeout protection to prevent infinite loops
    const startTime = Date.now();
    const maxWaitTime = 30000; // 30 seconds max wait

    // Wait for available token
    while (this.requestTokens <= 0 || this.activeRequests >= this.config.rateLimit.maxConcurrentRequests) {
      // Check for timeout
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Rate limit acquisition timeout');
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      this.refillTokens();
    }

    this.requestTokens--;
  }

  /**
   * Release rate limit (for concurrent request tracking)
   */
  private releaseRateLimit(): void {
    // This is handled by activeRequests decrement in executeSingleRequest
  }

  /**
   * Refill rate limit tokens
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastTokenRefill;
    const tokensToAdd = Math.floor((timePassed / 1000) * this.config.rateLimit.maxRequestsPerSecond);

    if (tokensToAdd > 0) {
      this.requestTokens = Math.min(
        this.config.rateLimit.burstSize,
        this.requestTokens + tokensToAdd
      );
      this.lastTokenRefill = now;
    }
  }

  /**
   * Wait for rate limit compliance
   */
  private async waitForRateLimit(): Promise<void> {
    const delay = 1000 / this.config.rateLimit.maxRequestsPerSecond;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Execute requests directly without batching (fallback)
   */
  private async executeRequestsDirectly(requests: RequestBatch[]): Promise<RequestResult[]> {
    const results: RequestResult[] = [];

    for (const batch of requests) {
      const result = await this.executeSingleRequest(batch);
      results.push(result);
    }

    return results;
  }
}

/**
 * Factory function to create RequestPoolManager with foundation components
 */
export function createRequestPoolManager(
  performanceMonitor: PerformanceMonitor,
  requestMonitor: RequestMonitor,
  cache: DiscoveryCache<Response>,
  config?: PoolManagerConfig
): RequestPoolManager {
  return new RequestPoolManager(performanceMonitor, requestMonitor, cache, config);
}

/**
 * Global instance for easy access
 */
let globalPoolManager: RequestPoolManager | null = null;

/**
 * Get global RequestPoolManager instance
 */
export function getGlobalRequestPoolManager(): RequestPoolManager {
  if (!globalPoolManager) {
    globalPoolManager = new RequestPoolManager(
      getGlobalPerformanceMonitor(),
      getGlobalRequestMonitor(),
      createDiscoveryCache({ maxEntries: 100, defaultTTL: 300000 })
    );
  }

  return globalPoolManager;
}

/**
 * Reset global instance
 */
export function resetGlobalRequestPoolManager(): void {
  if (globalPoolManager) {
    globalPoolManager.reset();
  }
  globalPoolManager = null;
}