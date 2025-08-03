/**
 * RequestMonitor - HTTP request monitoring and deduplication system
 * 
 * Features:
 * - Request deduplication to eliminate redundant HTTP calls
 * - Comprehensive request metrics and timing
 * - Real-time monitoring with listener pattern
 * - Integration with PerformanceMonitor
 * - Circuit breaker integration readiness
 * - Request caching and retry logic
 */

import { PerformanceMonitor, getGlobalPerformanceMonitor } from './PerformanceMonitor';

export interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  success?: boolean;
  error?: string;
  fromCache?: boolean;
  deduplicationKey?: string;
  retryCount?: number;
}

export interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  deduplicatedRequests: number;
  averageResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<number, number>;
  errorsByType: Record<string, number>;
}

export interface PendingRequest {
  promise: Promise<Response>;
  startTime: number;
  abortController: AbortController;
}

export type RequestListener = (metrics: RequestMetrics) => void;

export class RequestMonitor {
  private metrics: RequestMetrics[] = [];
  private pendingRequests = new Map<string, PendingRequest>();
  private listeners: Set<RequestListener> = new Set();
  private performanceMonitor: PerformanceMonitor;
  private deduplicationEnabled: boolean = true;
  private maxConcurrentRequests: number = 10;
  private currentConcurrentRequests: number = 0;

  constructor(performanceMonitor?: PerformanceMonitor) {
    this.performanceMonitor = performanceMonitor || getGlobalPerformanceMonitor();
  }

  /**
   * Monitor a fetch request with deduplication and metrics collection
   */
  async monitoredFetch(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const method = options.method || 'GET';
    const deduplicationKey = this.generateDeduplicationKey(url, options);
    
    // Check for existing pending request (deduplication)
    if (this.deduplicationEnabled && this.pendingRequests.has(deduplicationKey)) {
      const pending = this.pendingRequests.get(deduplicationKey)!;
      
      // Record deduplicated request
      this.recordMetrics({
        url,
        method,
        startTime: Date.now(),
        fromCache: true,
        deduplicationKey
      });
      
      return pending.promise;
    }

    // Check concurrent request limit
    if (this.currentConcurrentRequests >= this.maxConcurrentRequests) {
      throw new Error(`Maximum concurrent requests (${this.maxConcurrentRequests}) exceeded`);
    }

    const startTime = Date.now();
    const abortController = new AbortController();
    const perfMeasurement = this.performanceMonitor.startMeasure(`request-${deduplicationKey}`);
    
    // Add abort signal to options
    const fetchOptions: RequestInit = {
      ...options,
      signal: abortController.signal
    };

    const requestPromise = this.executeFetch(url, fetchOptions, startTime, deduplicationKey);
    
    // Store pending request for deduplication
    const pendingRequest: PendingRequest = {
      promise: requestPromise,
      startTime,
      abortController
    };
    
    this.pendingRequests.set(deduplicationKey, pendingRequest);
    this.currentConcurrentRequests++;

    try {
      const response = await requestPromise;
      perfMeasurement.end();
      return response;
    } finally {
      this.pendingRequests.delete(deduplicationKey);
      this.currentConcurrentRequests--;
    }
  }

  /**
   * Execute the actual fetch with metrics recording
   */
  private async executeFetch(
    url: string,
    options: RequestInit,
    startTime: number,
    deduplicationKey: string
  ): Promise<Response> {
    const method = options.method || 'GET';
    let response: Response;
    let error: string | undefined;
    let attemptCount = 0;
    const maxAttempts = 3;

    while (attemptCount < maxAttempts) {
      try {
        response = await fetch(url, options);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        this.recordMetrics({
          url,
          method,
          startTime,
          endTime,
          duration,
          status: response.status,
          success: response.ok,
          deduplicationKey,
          retryCount: attemptCount
        });

        return response;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        const isAbortError = err instanceof Error && (err.name === 'AbortError' || error.includes('AbortError'));
        attemptCount++;
        
        // Don't retry on abort or certain errors
        if (options.signal?.aborted || isAbortError || attemptCount >= maxAttempts) {
          break;
        }
        
        // Exponential backoff for retries
        await this.delay(Math.pow(2, attemptCount) * 100);
      }
    }

    // Record failed request
    const endTime = Date.now();
    this.recordMetrics({
      url,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      success: false,
      error,
      deduplicationKey,
      retryCount: attemptCount - 1
    });

    throw new Error(`Request failed after ${attemptCount - 1} retries: ${error}`);
  }

  /**
   * Generate a deduplication key for requests
   */
  private generateDeduplicationKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = options.headers ? JSON.stringify(options.headers) : '';
    const body = options.body ? String(options.body) : '';
    
    // Simple hash for deduplication key
    return `${method}:${url}:${this.simpleHash(headers + body)}`;
  }

  /**
   * Simple hash function for deduplication
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Record request metrics and notify listeners
   */
  private recordMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.warn('Request listener error:', error);
      }
    });
  }

  /**
   * Add a request listener
   */
  addListener(listener: RequestListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a request listener
   */
  removeListener(listener: RequestListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Get comprehensive request statistics
   */
  getStats(): RequestStats {
    const stats: RequestStats = {
      totalRequests: this.metrics.length,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      deduplicatedRequests: 0,
      averageResponseTime: 0,
      requestsByMethod: {},
      requestsByStatus: {},
      errorsByType: {}
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const metric of this.metrics) {
      // Count success/failure
      if (metric.success === true) {
        stats.successfulRequests++;
      } else if (metric.success === false) {
        stats.failedRequests++;
      }

      // Count cached/deduplicated
      if (metric.fromCache) {
        stats.cachedRequests++;
      }
      if (metric.deduplicationKey && metric.fromCache) {
        stats.deduplicatedRequests++;
      }

      // Aggregate by method
      stats.requestsByMethod[metric.method] = 
        (stats.requestsByMethod[metric.method] || 0) + 1;

      // Aggregate by status
      if (metric.status) {
        stats.requestsByStatus[metric.status] = 
          (stats.requestsByStatus[metric.status] || 0) + 1;
      }

      // Aggregate errors
      if (metric.error) {
        stats.errorsByType[metric.error] = 
          (stats.errorsByType[metric.error] || 0) + 1;
      }

      // Calculate average response time
      if (metric.duration !== undefined) {
        totalDuration += metric.duration;
        durationCount++;
      }
    }

    stats.averageResponseTime = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific URL pattern
   */
  getMetricsForUrl(urlPattern: string | RegExp): RequestMetrics[] {
    const pattern = typeof urlPattern === 'string' 
      ? new RegExp(urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : urlPattern;
    
    return this.metrics.filter(metric => pattern.test(metric.url));
  }

  /**
   * Get currently pending requests
   */
  getPendingRequests(): Array<{ url: string; startTime: number; elapsed: number }> {
    const now = Date.now();
    return Array.from(this.pendingRequests.entries()).map(([key, pending]) => ({
      url: key.split(':').slice(1, -1).join(':'), // Extract URL from METHOD:URL:HASH format
      startTime: pending.startTime,
      elapsed: now - pending.startTime
    }));
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    for (const pending of this.pendingRequests.values()) {
      pending.abortController.abort();
    }
    this.pendingRequests.clear();
    this.currentConcurrentRequests = 0;
  }

  /**
   * Cancel requests matching a URL pattern
   */
  cancelRequestsForUrl(urlPattern: string | RegExp): void {
    const pattern = typeof urlPattern === 'string' 
      ? new RegExp(urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : urlPattern;

    for (const [key, pending] of this.pendingRequests.entries()) {
      const url = key.split(':').slice(1, -1).join(':');
      if (pattern.test(url)) {
        pending.abortController.abort();
        this.pendingRequests.delete(key);
        this.currentConcurrentRequests--;
      }
    }
  }

  /**
   * Reset all metrics and clear pending requests
   */
  reset(): void {
    this.metrics.length = 0;
    this.cancelAllRequests();
    this.performanceMonitor.reset();
  }

  /**
   * Configure request monitor settings
   */
  configure(options: {
    deduplicationEnabled?: boolean;
    maxConcurrentRequests?: number;
  }): void {
    if (options.deduplicationEnabled !== undefined) {
      this.deduplicationEnabled = options.deduplicationEnabled;
    }
    if (options.maxConcurrentRequests !== undefined) {
      this.maxConcurrentRequests = options.maxConcurrentRequests;
    }
  }

  /**
   * Export metrics to JSON for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      stats: this.getStats(),
      metrics: this.metrics,
      pendingRequests: this.getPendingRequests(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Utility function for delays (used in retry logic)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for global use
let globalInstance: RequestMonitor | null = null;

/**
 * Get the global RequestMonitor instance
 */
export function getGlobalRequestMonitor(): RequestMonitor {
  if (!globalInstance) {
    globalInstance = new RequestMonitor();
  }
  return globalInstance;
}

/**
 * Reset the global RequestMonitor instance
 */
export function resetGlobalRequestMonitor(): void {
  if (globalInstance) {
    globalInstance.reset();
  }
  globalInstance = null;
}

/**
 * Create a monitored fetch function that uses the global RequestMonitor
 */
export function createMonitoredFetch(): typeof fetch {
  const monitor = getGlobalRequestMonitor();
  
  return async function monitoredFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    return monitor.monitoredFetch(url, init);
  };
}