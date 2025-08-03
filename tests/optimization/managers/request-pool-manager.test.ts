/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  RequestPoolManager,
  createRequestPoolManager,
  getGlobalRequestPoolManager,
  resetGlobalRequestPoolManager,
  CircuitBreakerState,
  type RequestBatch,
  type RequestResult,
  type PoolManagerConfig
} from '../../../src/optimization/managers/request-pool-manager';
import { DiscoveryCache } from '../../../src/optimization/foundation/DiscoveryCache';
import { PerformanceMonitor } from '../../../src/optimization/foundation/PerformanceMonitor';
import { RequestMonitor } from '../../../src/optimization/foundation/RequestMonitor';
import { FeatureFlags } from '../../../src/optimization/foundation/FeatureFlags';

// Mock environment
vi.mock('../../../src/optimization/foundation/environment-utils', () => ({
  EnvironmentUtils: {
    detectEnvironment: () => ({
      type: 'local',
      capabilities: {
        supportsHeadRequests: true,
        supportsCors: true,
        supportsRangeRequests: false
      },
      platform: 'browser'
    })
  }
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout for older environments
if (!AbortSignal.timeout) {
  AbortSignal.timeout = vi.fn((ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  });
}

describe('RequestPoolManager', () => {
  let cache: DiscoveryCache<Response>;
  let performanceMonitor: PerformanceMonitor;
  let requestMonitor: RequestMonitor;
  let poolManager: RequestPoolManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset feature flags
    FeatureFlags.reset();
    FeatureFlags.enable('REQUEST_POOL_MANAGER');
    
    // Create fresh instances
    cache = new DiscoveryCache<Response>({ maxEntries: 100, defaultTTL: 300000 });
    performanceMonitor = new PerformanceMonitor();
    requestMonitor = new RequestMonitor();
    
    poolManager = new RequestPoolManager(performanceMonitor, requestMonitor, cache, {
      maxPoolSize: 10,
      batchSize: 3,
      batchTimeout: 100,
      enableCircuitBreaker: true,
      enableRateLimit: true,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 5000,
        successThreshold: 2,
        timeWindow: 30000
      },
      rateLimit: {
        maxRequestsPerSecond: 10,
        maxConcurrentRequests: 5,
        burstSize: 15,
        windowSize: 1000
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetGlobalRequestPoolManager();
    FeatureFlags.reset();
  });

  describe('Constructor and Factory Functions', () => {
    it('should create RequestPoolManager with default config', () => {
      const defaultManager = new RequestPoolManager(performanceMonitor, requestMonitor, cache);
      expect(defaultManager).toBeInstanceOf(RequestPoolManager);
    });

    it('should create RequestPoolManager with factory function', () => {
      const factoryManager = createRequestPoolManager(performanceMonitor, requestMonitor, cache);
      expect(factoryManager).toBeInstanceOf(RequestPoolManager);
    });

    it('should provide global instance', () => {
      const global1 = getGlobalRequestPoolManager();
      const global2 = getGlobalRequestPoolManager();
      expect(global1).toBe(global2);
    });

    it('should reset global instance', () => {
      const global1 = getGlobalRequestPoolManager();
      resetGlobalRequestPoolManager();
      const global2 = getGlobalRequestPoolManager();
      expect(global1).not.toBe(global2);
    });
  });

  describe('Request Batching', () => {
    it('should batch requests successfully', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/data1', priority: 'high' },
        { id: '2', url: 'https://api.example.com/data2', priority: 'normal' },
        { id: '3', url: 'https://api.example.com/data3', priority: 'low' }
      ];

      mockFetch.mockResolvedValue(new Response('{"success": true}', { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.batch.id).toBe(requests[index].id);
        expect(result.response).toBeInstanceOf(Response);
        expect(result.error).toBeUndefined();
        expect(result.executionTime).toBeGreaterThan(0);
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should group requests by domain and method', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api1.example.com/data', options: { method: 'GET' } },
        { id: '2', url: 'https://api1.example.com/other', options: { method: 'GET' } },
        { id: '3', url: 'https://api2.example.com/data', options: { method: 'GET' } },
        { id: '4', url: 'https://api1.example.com/data', options: { method: 'POST' } }
      ];

      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(4);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should prioritize high priority requests', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/low', priority: 'low' },
        { id: '2', url: 'https://api.example.com/high', priority: 'high' },
        { id: '3', url: 'https://api.example.com/normal', priority: 'normal' }
      ];

      const executionOrder: string[] = [];
      mockFetch.mockImplementation((url: string) => {
        executionOrder.push(url);
        return Promise.resolve(new Response('{"success": true}', { status: 200 }));
      });

      await poolManager.batchRequests(requests);

      // High priority should be executed first
      expect(executionOrder[0]).toBe('https://api.example.com/high');
    });

    it('should handle mixed success and failure', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/success' },
        { id: '2', url: 'https://api.example.com/failure' },
        { id: '3', url: 'https://api.example.com/error' }
      ];

      mockFetch
        .mockResolvedValueOnce(new Response('{"success": true}', { status: 200 }))
        .mockResolvedValueOnce(new Response('{"error": "not found"}', { status: 404 }))
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(3);
      expect(results[0].response).toBeInstanceOf(Response);
      expect(results[0].error).toBeUndefined();
      expect(results[1].response).toBeInstanceOf(Response);
      expect(results[1].error).toBeUndefined();
      expect(results[2].response).toBeUndefined();
      expect(results[2].error).toBeInstanceOf(Error);
    });

    it('should use cache for duplicate requests', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/data' },
        { id: '2', url: 'https://api.example.com/data' }
      ];

      mockFetch.mockResolvedValue(new Response('{"data": "cached"}', { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(2);
      expect(results[0].fromCache).toBe(false);
      expect(results[1].fromCache).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to direct execution when feature disabled', async () => {
      FeatureFlags.disable('REQUEST_POOL_MANAGER');

      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/data' }
      ];

      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(1);
      expect(results[0].response).toBeInstanceOf(Response);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should remain closed under normal operation', async () => {
      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));

      const stats = poolManager.getCircuitBreakerStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(0);
    });

    it('should open after consecutive failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Trigger 3 failures (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
        } catch {
          // Expected to fail
        }
      }

      const stats = poolManager.getCircuitBreakerStats();
      expect(stats.state).toBe(CircuitBreakerState.OPEN);
      expect(stats.failures).toBe(3);
    });

    it('should block requests when open', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
        } catch {
          // Expected to fail
        }
      }

      // Next request should be blocked
      await expect(
        poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'))
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after recovery timeout', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
        } catch {
          // Expected to fail
        }
      }

      expect(poolManager.getCircuitBreakerStats().state).toBe(CircuitBreakerState.OPEN);

      // Advance time past recovery timeout
      vi.advanceTimersByTime(6000);

      // Mock successful response
      mockFetch.mockResolvedValueOnce(new Response('{"success": true}', { status: 200 }));

      // This should transition to half-open and succeed
      const result = await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
      expect(result).toBeInstanceOf(Response);

      const stats = poolManager.getCircuitBreakerStats();
      expect(stats.state).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should close after successful requests in half-open state', async () => {
      // Open the circuit first
      mockFetch.mockRejectedValue(new Error('Network error'));
      for (let i = 0; i < 3; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
        } catch {
          // Expected to fail
        }
      }

      // Advance time to allow recovery
      vi.advanceTimersByTime(6000);

      // Mock successful responses
      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      // Execute successful requests (threshold is 2)
      await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
      await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));

      const stats = poolManager.getCircuitBreakerStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.successes).toBe(2);
    });

    it('should track state changes', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const initialStats = poolManager.getCircuitBreakerStats();
      expect(initialStats.stateChangeCount).toBe(0);

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/data'));
        } catch {
          // Expected to fail
        }
      }

      const openStats = poolManager.getCircuitBreakerStats();
      expect(openStats.stateChangeCount).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit concurrent requests', async () => {
      let activeRequests = 0;
      let maxConcurrent = 0;

      mockFetch.mockImplementation(() => {
        activeRequests++;
        maxConcurrent = Math.max(maxConcurrent, activeRequests);
        
        return new Promise(resolve => {
          setTimeout(() => {
            activeRequests--;
            resolve(new Response('{"success": true}', { status: 200 }));
          }, 100);
        });
      });

      // Create more requests than concurrent limit
      const requests: RequestBatch[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        url: `https://api.example.com/data${i}`
      }));

      await poolManager.batchRequests(requests);

      expect(maxConcurrent).toBeLessThanOrEqual(5); // maxConcurrentRequests
    });

    it('should respect rate limit tokens', async () => {
      const config: PoolManagerConfig = {
        rateLimit: {
          maxRequestsPerSecond: 2,
          maxConcurrentRequests: 10,
          burstSize: 3,
          windowSize: 1000
        }
      };

      const rateLimitedManager = new RequestPoolManager(performanceMonitor, requestMonitor, cache, config);

      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const startTime = Date.now();
      
      // Make more requests than burst size
      const requests: RequestBatch[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        url: `https://api.example.com/data${i}`
      }));

      await rateLimitedManager.batchRequests(requests);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take some time due to rate limiting
      expect(duration).toBeGreaterThan(0);
    });

    it('should provide single request rate limiting', async () => {
      mockFetch.mockResolvedValue(new Response('{"data": "test"}', { status: 200 }));

      const response = await poolManager.rateLimitedRequest('https://api.example.com/single');

      expect(response).toBeInstanceOf(Response);
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/single', undefined);
    });

    it('should throw error for failed rate limited request', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        poolManager.rateLimitedRequest('https://api.example.com/error')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track request metrics', async () => {
      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/data' }
      ];

      await poolManager.batchRequests(requests);

      const requestStats = requestMonitor.getStats();
      expect(requestStats.totalRequests).toBeGreaterThan(0);
      expect(requestStats.successfulRequests).toBeGreaterThan(0);
    });

    it('should track performance measurements', async () => {
      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/data' }
      ];

      await poolManager.batchRequests(requests);

      const performanceStats = performanceMonitor.getStats();
      expect(performanceStats.totalMeasurements).toBeGreaterThan(0);
    });

    it('should provide comprehensive stats', () => {
      const stats = poolManager.getStats();

      expect(stats).toHaveProperty('circuitBreaker');
      expect(stats).toHaveProperty('rateLimit');
      expect(stats).toHaveProperty('batching');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('config');

      expect(stats.circuitBreaker.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.rateLimit.activeRequests).toBe(0);
      expect(stats.batching.pendingBatches).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle timeout errors', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/timeout', timeout: 100 }
      ];

      mockFetch.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve(new Response('{"data": "delayed"}', { status: 200 })), 200)
        )
      );

      const results = await poolManager.batchRequests(requests);

      expect(results[0].error).toBeInstanceOf(Error);
    });

    it('should handle retry attempts', async () => {
      const requests: RequestBatch[] = [
        { id: '1', url: 'https://api.example.com/retry', retryCount: 2 }
      ];

      mockFetch.mockRejectedValue(new Error('Temporary error'));

      const results = await poolManager.batchRequests(requests);

      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[0].retryAttempt).toBe(2);
    });

    it('should reset all state', () => {
      // Trigger some activity first
      poolManager.getStats();

      poolManager.reset();

      const stats = poolManager.getStats();
      expect(stats.circuitBreaker.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.circuitBreaker.failures).toBe(0);
      expect(stats.circuitBreaker.successes).toBe(0);
      expect(stats.rateLimit.activeRequests).toBe(0);
      expect(stats.rateLimit.queueLength).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom batch size', async () => {
      const customManager = new RequestPoolManager(performanceMonitor, requestMonitor, cache, {
        batchSize: 2
      });

      const batchSpy = vi.spyOn(customManager as any, 'executeRequestChunk');
      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const requests: RequestBatch[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        url: `https://api.example.com/data${i}`
      }));

      await customManager.batchRequests(requests);

      // Should be called 3 times (2 + 2 + 1)
      expect(batchSpy).toHaveBeenCalledTimes(3);
    });

    it('should work with disabled features', async () => {
      const disabledManager = new RequestPoolManager(performanceMonitor, requestMonitor, cache, {
        enableCircuitBreaker: false,
        enableRateLimit: false
      });

      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const result = await disabledManager.executeWithCircuitBreaker(() => 
        fetch('https://api.example.com/data')
      );

      expect(result).toBeInstanceOf(Response);
    });
  });
});