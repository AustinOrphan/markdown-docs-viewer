/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartConfigDiscovery } from '../../../src/optimization/algorithms/smart-config-discovery';
import { RequestPoolManager } from '../../../src/optimization/managers/request-pool-manager';
import { initializeFoundation, resetFoundation } from '../../../src/optimization/foundation';
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

describe('Week 2 Algorithms Integration', () => {
  let foundation: ReturnType<typeof initializeFoundation>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset and initialize foundation
    resetFoundation();
    FeatureFlags.reset();
    FeatureFlags.enable('SMART_CONFIG_DISCOVERY');
    FeatureFlags.enable('REQUEST_POOL_MANAGER');
    
    foundation = initializeFoundation({
      performance: { enabled: true, maxReports: 100 },
      cache: { enabled: true, maxEntries: 100, defaultTTL: 300000 },
      requests: { deduplicationEnabled: true, maxConcurrentRequests: 5 }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFoundation();
    FeatureFlags.reset();
  });

  describe('SmartConfigDiscovery Integration', () => {
    it('should integrate with foundation components', async () => {
      const discovery = new SmartConfigDiscovery(
        foundation.cache,
        foundation.performanceMonitor,
        foundation.requestMonitor
      );

      // Mock successful config discovery
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      const exists = await discovery.checkConfigExists('test-config.json');
      expect(exists).toBe(true);

      // Verify integration with performance monitoring
      const performanceStats = foundation.performanceMonitor.getStats();
      expect(performanceStats.totalMeasurements).toBeGreaterThan(0);

      // Verify integration with request monitoring
      const requestStats = foundation.requestMonitor.getStats();
      expect(requestStats.totalRequests).toBe(1);
      expect(requestStats.successfulRequests).toBe(1);

      // Verify caching integration
      const cacheStats = foundation.cache.getStats();
      expect(cacheStats.totalEntries).toBeGreaterThan(0);
    });

    it('should work with feature flag controls', async () => {
      const discovery = new SmartConfigDiscovery(
        foundation.cache,
        foundation.performanceMonitor,
        foundation.requestMonitor
      );

      // Test with feature enabled
      FeatureFlags.enable('SMART_CONFIG_DISCOVERY');
      
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Test Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      let results = await discovery.discoverConfigs(['test.json']);
      expect(results[0].exists).toBe(true);

      // Test with feature disabled
      FeatureFlags.disable('SMART_CONFIG_DISCOVERY');
      
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Fallback Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      results = await discovery.discoverConfigs(['test2.json']);
      expect(results[0].exists).toBe(true);
    });
  });

  describe('RequestPoolManager Integration', () => {
    it('should integrate with foundation components', async () => {
      const poolManager = new RequestPoolManager(
        foundation.performanceMonitor,
        foundation.requestMonitor,
        foundation.cache
      );

      mockFetch.mockResolvedValue(new Response('{"success": true}', { status: 200 }));

      const requests = [
        { id: '1', url: 'https://api.example.com/test1' },
        { id: '2', url: 'https://api.example.com/test2' }
      ];

      const results = await poolManager.batchRequests(requests);

      expect(results).toHaveLength(2);
      expect(results[0].response).toBeInstanceOf(Response);
      expect(results[1].response).toBeInstanceOf(Response);

      // Verify performance monitoring integration
      const performanceStats = foundation.performanceMonitor.getStats();
      expect(performanceStats.totalMeasurements).toBeGreaterThan(0);

      // Verify request monitoring integration
      const requestStats = foundation.requestMonitor.getStats();
      expect(requestStats.totalRequests).toBeGreaterThan(0);
    });

    it('should work with circuit breaker', async () => {
      const poolManager = new RequestPoolManager(
        foundation.performanceMonitor,
        foundation.requestMonitor,
        foundation.cache,
        {
          circuitBreaker: {
            failureThreshold: 2,
            recoveryTimeout: 1000,
            successThreshold: 1,
            timeWindow: 10000
          }
        }
      );

      // Test circuit breaker opening
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Trigger failures
      for (let i = 0; i < 2; i++) {
        try {
          await poolManager.executeWithCircuitBreaker(() => fetch('https://api.example.com/fail'));
        } catch {
          // Expected to fail
        }
      }

      const stats = poolManager.getCircuitBreakerStats();
      expect(stats.failures).toBe(2);
    });
  });

  describe('Algorithm Coordination', () => {
    it('should work together for config discovery and request pooling', async () => {
      const discovery = new SmartConfigDiscovery(
        foundation.cache,
        foundation.performanceMonitor,
        foundation.requestMonitor
      );

      const poolManager = new RequestPoolManager(
        foundation.performanceMonitor,
        foundation.requestMonitor,
        foundation.cache
      );

      // Mock config file discovery
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 })) // HEAD request
        .mockResolvedValueOnce(new Response(JSON.stringify({ 
          title: 'Integrated Config',
          source: { path: './docs' }
        }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // GET request

      // Discover config using SmartConfigDiscovery
      const configResults = await discovery.discoverConfigs(['integration-config.json']);
      expect(configResults[0].exists).toBe(true);
      expect(configResults[0].config?.title).toBe('Integrated Config');

      // Use RequestPoolManager for subsequent document requests
      mockFetch.mockResolvedValue(new Response('# Document Content', { 
        status: 200,
        headers: { 'content-type': 'text/markdown' }
      }));

      const docRequests = [
        { id: 'doc1', url: './docs/doc1.md' },
        { id: 'doc2', url: './docs/doc2.md' },
        { id: 'doc3', url: './docs/doc3.md' }
      ];

      const docResults = await poolManager.batchRequests(docRequests);
      expect(docResults).toHaveLength(3);
      docResults.forEach(result => {
        expect(result.response).toBeInstanceOf(Response);
      });

      // Verify overall foundation stats
      const foundationStats = {
        performance: foundation.performanceMonitor.getStats(),
        requests: foundation.requestMonitor.getStats(),
        cache: foundation.cache.getStats()
      };

      expect(foundationStats.performance.totalMeasurements).toBeGreaterThan(0);
      expect(foundationStats.requests.totalRequests).toBeGreaterThan(0);
      expect(foundationStats.cache.totalEntries).toBeGreaterThan(0);
    });

    it('should handle errors gracefully across components', async () => {
      const discovery = new SmartConfigDiscovery(
        foundation.cache,
        foundation.performanceMonitor,
        foundation.requestMonitor,
        { fallbackToDefaults: true }
      );

      const poolManager = new RequestPoolManager(
        foundation.performanceMonitor,
        foundation.requestMonitor,
        foundation.cache,
        { enableCircuitBreaker: true, enableRateLimit: true }
      );

      // Test discovery with network errors
      mockFetch.mockRejectedValue(new Error('Network error'));

      const configResults = await discovery.discoverConfigs(['error-config.json']);
      expect(configResults[0].exists).toBe(false);
      expect(configResults[0].error).toBeInstanceOf(Error);

      // Test pool manager with failures
      const requests = [
        { id: 'fail1', url: 'https://api.example.com/fail1' },
        { id: 'fail2', url: 'https://api.example.com/fail2' }
      ];

      const results = await poolManager.batchRequests(requests);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.error).toBeInstanceOf(Error);
      });

      // Verify error tracking
      const requestStats = foundation.requestMonitor.getStats();
      expect(requestStats.failedRequests).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should achieve request reduction goals', async () => {
      const discovery = new SmartConfigDiscovery(
        foundation.cache,
        foundation.performanceMonitor,
        foundation.requestMonitor
      );

      // Simulate traditional sequential config discovery (4 requests)
      const traditionalRequestCount = 4;

      // Test parallel discovery
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 404 })) // config1 HEAD
        .mockResolvedValueOnce(new Response('', { status: 200 })) // config2 HEAD  
        .mockResolvedValueOnce(new Response('', { status: 404 })) // config3 HEAD
        .mockResolvedValueOnce(new Response('', { status: 404 })) // config4 HEAD
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Found' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // config2 GET

      const startTime = performance.now();
      await discovery.discoverConfigs(['config1.json', 'config2.json', 'config3.json', 'config4.json']);
      const endTime = performance.now();

      const requestStats = foundation.requestMonitor.getStats();
      const parallelRequestCount = requestStats.totalRequests;

      // Should make 5 requests (4 HEAD + 1 GET) instead of potential 8 (4 HEAD + 4 GET in worst case)
      expect(parallelRequestCount).toBe(5);
      
      // Verify it's much faster than sequential (parallel execution)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(200); // Should complete quickly due to parallelism

      console.log(`Traditional approach: ${traditionalRequestCount} sequential requests`);
      console.log(`Optimized approach: ${parallelRequestCount} parallel requests`);
      console.log(`Execution time: ${executionTime.toFixed(2)}ms`);
    });
  });
});