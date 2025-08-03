/**
 * Test helpers for optimization tests
 *
 * Provides utilities for performance benchmarking, request counting,
 * and async test operations for the zero-config optimization project.
 */

import { vi, expect } from 'vitest';

/**
 * Performance benchmarking utilities
 */
export class PerformanceBenchmark {
  private startTime: number;
  private measurements: Array<{ label: string; duration: number }> = [];

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Start a new measurement
   */
  public start(): void {
    this.startTime = performance.now();
  }

  /**
   * End current measurement and record it
   */
  public end(label: string): number {
    const duration = performance.now() - this.startTime;
    this.measurements.push({ label, duration });
    return duration;
  }

  /**
   * Get all measurements
   */
  public getMeasurements(): Array<{ label: string; duration: number }> {
    return [...this.measurements];
  }

  /**
   * Clear all measurements
   */
  public clear(): void {
    this.measurements = [];
  }

  /**
   * Assert that operation completed within time limit
   */
  public assertWithinTime(label: string, maxMs: number): void {
    const measurement = this.measurements.find(m => m.label === label);
    if (!measurement) {
      throw new Error(`No measurement found for label: ${label}`);
    }
    expect(measurement.duration).toBeLessThan(maxMs);
  }

  /**
   * Assert that all measurements are under 2 seconds (test requirement)
   */
  public assertFastTests(): void {
    const slowTests = this.measurements.filter(m => m.duration > 2000);
    if (slowTests.length > 0) {
      const slowTestNames = slowTests.map(t => `${t.label}: ${t.duration}ms`).join(', ');
      throw new Error(`Tests exceeded 2 second limit: ${slowTestNames}`);
    }
  }
}

/**
 * Request counting and monitoring utilities
 */
export class RequestCounter {
  private requests: Array<{
    url: string;
    method: string;
    timestamp: number;
    duration?: number;
    success?: boolean;
  }> = [];

  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  /**
   * Start monitoring requests
   */
  public startMonitoring(): void {
    global.fetch = vi
      .fn()
      .mockImplementation(async (url: string, options: Record<string, any> = {}) => {
        const startTime = performance.now();
        const method = options.method || 'GET';

        try {
          const response = await this.originalFetch(url, options);
          const duration = performance.now() - startTime;

          this.requests.push({
            url: url.toString(),
            method,
            timestamp: Date.now(),
            duration,
            success: response.ok,
          });

          return response;
        } catch (error) {
          const duration = performance.now() - startTime;

          this.requests.push({
            url: url.toString(),
            method,
            timestamp: Date.now(),
            duration,
            success: false,
          });

          throw error;
        }
      });
  }

  /**
   * Stop monitoring and restore original fetch
   */
  public stopMonitoring(): void {
    global.fetch = this.originalFetch;
  }

  /**
   * Get all recorded requests
   */
  public getRequests(): Array<{
    url: string;
    method: string;
    timestamp: number;
    duration?: number;
    success?: boolean;
  }> {
    return [...this.requests];
  }

  /**
   * Get request count
   */
  public getCount(): number {
    return this.requests.length;
  }

  /**
   * Get successful request count
   */
  public getSuccessCount(): number {
    return this.requests.filter(r => r.success).length;
  }

  /**
   * Get failed request count
   */
  public getFailureCount(): number {
    return this.requests.filter(r => r.success === false).length;
  }

  /**
   * Clear all recorded requests
   */
  public clear(): void {
    this.requests = [];
  }

  /**
   * Assert that request count is under limit
   */
  public assertUnderLimit(maxRequests: number): void {
    expect(this.getCount()).toBeLessThanOrEqual(maxRequests);
  }

  /**
   * Assert that we achieved the <10 request goal
   */
  public assertOptimizationGoal(): void {
    this.assertUnderLimit(10);
  }

  /**
   * Get requests by URL pattern
   */
  public getRequestsByPattern(pattern: RegExp): Array<(typeof this.requests)[0]> {
    return this.requests.filter(r => pattern.test(r.url));
  }

  /**
   * Get average response time
   */
  public getAverageResponseTime(): number {
    const requestsWithDuration = this.requests.filter(r => r.duration !== undefined);
    if (requestsWithDuration.length === 0) return 0;

    const totalDuration = requestsWithDuration.reduce((sum, r) => sum + (r.duration || 0), 0);
    return totalDuration / requestsWithDuration.length;
  }
}

/**
 * Async test utilities for network operations
 */
export class AsyncTestHelpers {
  /**
   * Wait for a condition to be true with timeout
   */
  public static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const result = await condition();
      if (result) {
        return;
      }
      await this.delay(intervalMs);
    }

    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  /**
   * Wait for multiple async operations to complete
   */
  public static async waitForAll<T>(promises: Promise<T>[], timeoutMs = 10000): Promise<T[]> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operations did not complete within ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    return Promise.race([Promise.all(promises), timeoutPromise]);
  }

  /**
   * Simple delay utility
   */
  public static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for DOM ready state
   */
  public static async waitForDOMReady(): Promise<void> {
    if (typeof document === 'undefined') return;

    if (document.readyState === 'complete') {
      return;
    }

    return new Promise(resolve => {
      const handler = () => {
        if (document.readyState === 'complete') {
          document.removeEventListener('readystatechange', handler);
          resolve();
        }
      };
      document.addEventListener('readystatechange', handler);
    });
  }

  /**
   * Create a mock network delay
   */
  public static async simulateNetworkDelay(minMs = 100, maxMs = 500): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await this.delay(delay);
  }

  /**
   * Batch async operations with concurrency limit
   */
  public static async batchAsync<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    concurrency = 3
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(item => operation(item)));
      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Memory leak detection utilities
 */
export class MemoryTestHelpers {
  private initialMemory: number;

  constructor() {
    this.initialMemory = this.getMemoryUsage();
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Assert that memory usage hasn't grown significantly
   */
  public assertNoMemoryLeak(maxGrowthMB = 10): void {
    const currentMemory = this.getMemoryUsage();
    if (this.initialMemory === 0 || currentMemory === 0) {
      // Memory API not available, skip test
      return;
    }

    const growthBytes = currentMemory - this.initialMemory;
    const growthMB = growthBytes / (1024 * 1024);

    expect(growthMB).toBeLessThan(maxGrowthMB);
  }

  /**
   * Force garbage collection if available
   */
  public forceGC(): void {
    if (typeof global !== 'undefined' && 'gc' in global) {
      (global as any).gc();
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerators {
  /**
   * Generate mock configuration data
   */
  public static createMockConfig(overrides: Record<string, any> = {}): any {
    return {
      title: 'Test Documentation',
      basePath: '/docs',
      theme: 'light',
      searchEnabled: true,
      tocEnabled: true,
      ...overrides,
    };
  }

  /**
   * Generate mock document list
   */
  public static createMockDocuments(
    count = 5
  ): Array<{ path: string; title: string; content?: string }> {
    return Array.from({ length: count }, (_, i) => ({
      path: `/doc-${i + 1}.md`,
      title: `Document ${i + 1}`,
      content: `# Document ${i + 1}\n\nThis is test content for document ${i + 1}.`,
    }));
  }

  /**
   * Generate mock HTTP responses
   */
  public static createMockResponse(
    data: any,
    status = 200,
    headers: Record<string, string> = {}
  ): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  /**
   * Generate mock error responses
   */
  public static createMockErrorResponse(status = 404, message = 'Not Found'): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Common test setup and teardown utilities
 */
export class TestSetup {
  private static cleanupFunctions: Array<() => void> = [];

  /**
   * Add a cleanup function to run after test
   */
  public static addCleanup(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Run all cleanup functions
   */
  public static cleanup(): void {
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    this.cleanupFunctions = [];
  }

  /**
   * Reset localStorage
   */
  public static resetLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  }

  /**
   * Reset sessionStorage
   */
  public static resetSessionStorage(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  }

  /**
   * Set up common test environment
   */
  public static setupTestEnvironment(): void {
    this.resetLocalStorage();
    this.resetSessionStorage();

    // Mock console methods to avoid noise in tests
    if (process.env.NODE_ENV === 'test') {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    }
  }

  /**
   * Restore test environment
   */
  public static restoreTestEnvironment(): void {
    this.cleanup();
    vi.restoreAllMocks();
  }
}

/**
 * Create a comprehensive test suite helper
 */
export function createOptimizationTestSuite(name: string) {
  const benchmark = new PerformanceBenchmark();
  const requestCounter = new RequestCounter();
  const memoryHelper = new MemoryTestHelpers();

  return {
    name,
    benchmark,
    requestCounter,
    memoryHelper,

    setup() {
      TestSetup.setupTestEnvironment();
      requestCounter.startMonitoring();
      benchmark.start();
    },

    teardown() {
      requestCounter.stopMonitoring();
      memoryHelper.assertNoMemoryLeak();
      TestSetup.restoreTestEnvironment();
    },

    assertOptimizationGoals() {
      requestCounter.assertOptimizationGoal();
      benchmark.assertFastTests();
    },
  };
}
