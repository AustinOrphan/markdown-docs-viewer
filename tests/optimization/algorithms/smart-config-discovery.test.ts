/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  SmartConfigDiscovery, 
  createSmartConfigDiscovery,
  getGlobalSmartConfigDiscovery,
  resetGlobalSmartConfigDiscovery,
  type ConfigResult,
  type ConfigDiscoveryOptions
} from '../../../src/optimization/algorithms/smart-config-discovery';
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

describe('SmartConfigDiscovery', () => {
  let cache: DiscoveryCache<ConfigResult>;
  let performanceMonitor: PerformanceMonitor;
  let requestMonitor: RequestMonitor;
  let discovery: SmartConfigDiscovery;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset feature flags
    FeatureFlags.reset();
    FeatureFlags.enable('SMART_CONFIG_DISCOVERY');
    
    // Create fresh instances
    cache = new DiscoveryCache<ConfigResult>({ maxEntries: 100, defaultTTL: 300000 });
    performanceMonitor = new PerformanceMonitor();
    requestMonitor = new RequestMonitor();
    
    discovery = new SmartConfigDiscovery(cache, performanceMonitor, requestMonitor, {
      enableParallelDiscovery: true,
      enableCaching: true,
      maxConcurrentRequests: 4,
      timeout: 5000,
      useHeadRequests: true,
      fallbackToDefaults: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetGlobalSmartConfigDiscovery();
    FeatureFlags.reset();
  });

  describe('Constructor and Factory Functions', () => {
    it('should create SmartConfigDiscovery with default options', () => {
      const defaultDiscovery = new SmartConfigDiscovery(cache, performanceMonitor, requestMonitor);
      expect(defaultDiscovery).toBeInstanceOf(SmartConfigDiscovery);
    });

    it('should create SmartConfigDiscovery with factory function', () => {
      const factoryDiscovery = createSmartConfigDiscovery(cache, performanceMonitor, requestMonitor);
      expect(factoryDiscovery).toBeInstanceOf(SmartConfigDiscovery);
    });

    it('should provide global instance', () => {
      const global1 = getGlobalSmartConfigDiscovery();
      const global2 = getGlobalSmartConfigDiscovery();
      expect(global1).toBe(global2);
    });

    it('should reset global instance', () => {
      const global1 = getGlobalSmartConfigDiscovery();
      resetGlobalSmartConfigDiscovery();
      const global2 = getGlobalSmartConfigDiscovery();
      expect(global1).not.toBe(global2);
    });
  });

  describe('Configuration Discovery', () => {
    it('should discover config files in parallel', async () => {
      // Mock successful HEAD request for first file
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 })) // docs-config.json HEAD
        .mockResolvedValueOnce(new Response('', { status: 404 })) // docs.config.json HEAD
        .mockResolvedValueOnce(new Response('', { status: 404 })) // .docs.json HEAD
        .mockResolvedValueOnce(new Response('', { status: 404 })) // markdown-docs.json HEAD
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Test Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // docs-config.json GET

      const results = await discovery.discoverConfigs();

      expect(results).toHaveLength(4);
      expect(results[0].exists).toBe(true);
      expect(results[0].config).toEqual({ title: 'Test Config' });
      expect(results[1].exists).toBe(false);
      expect(results[2].exists).toBe(false);
      expect(results[3].exists).toBe(false);

      // Should make 5 requests total (4 HEAD + 1 GET)
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should cache discovery results', async () => {
      // Mock successful responses
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 404 }))
        .mockResolvedValueOnce(new Response('', { status: 404 }))
        .mockResolvedValueOnce(new Response('', { status: 404 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Cached Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      // First call
      const results1 = await discovery.discoverConfigs();
      expect(results1[0].fromCache).toBe(false);

      // Second call should use cache
      const results2 = await discovery.discoverConfigs();
      expect(results2[0].fromCache).toBe(true);
      
      // Should not make additional fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should handle custom config file list', async () => {
      const customFiles = ['custom-config.json', 'my-docs.json'];
      
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 404 })) // custom-config.json HEAD
        .mockResolvedValueOnce(new Response('', { status: 200 })) // my-docs.json HEAD
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Custom Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // my-docs.json GET

      const results = await discovery.discoverConfigs(customFiles);

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe('custom-config.json');
      expect(results[0].exists).toBe(false);
      expect(results[1].path).toBe('my-docs.json');
      expect(results[1].exists).toBe(true);
      expect(results[1].config).toEqual({ title: 'Custom Config' });
    });

    it('should fallback to sequential discovery when feature flag disabled', async () => {
      FeatureFlags.disable('SMART_CONFIG_DISCOVERY');

      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 404 })) // docs-config.json HEAD
        .mockResolvedValueOnce(new Response('', { status: 200 })) // docs.config.json HEAD
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Sequential Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // docs.config.json GET

      const results = await discovery.discoverConfigs();

      expect(results).toHaveLength(2); // Should stop at first successful config
      expect(results[1].config).toEqual({ title: 'Sequential Config' });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const results = await discovery.discoverConfigs();

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.exists).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
      });
    });
  });

  describe('Individual File Checking', () => {
    it('should check if config file exists', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      const exists = await discovery.checkConfigExists('test-config.json');

      expect(exists).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('test-config.json', {
        method: 'HEAD',
        signal: expect.any(AbortSignal)
      });
    });

    it('should cache existence check results', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      // First call
      const exists1 = await discovery.checkConfigExists('test-config.json');
      expect(exists1).toBe(true);

      // Second call should use cache
      const exists2 = await discovery.checkConfigExists('test-config.json');
      expect(exists2).toBe(true);

      // Should only make one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle file not found', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }));

      const exists = await discovery.checkConfigExists('nonexistent.json');

      expect(exists).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const exists = await discovery.checkConfigExists('error-config.json');

      expect(exists).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should get cached config result', async () => {
      const testResult: ConfigResult = {
        path: 'test.json',
        exists: true,
        fromCache: false,
        responseTime: 100,
        config: { title: 'Test' }
      };

      cache.set('test-key', testResult);

      const cached = discovery.getCachedConfig('test-key');
      expect(cached).toEqual(testResult);
    });

    it('should return null for non-existent cache key', () => {
      const cached = discovery.getCachedConfig('nonexistent-key');
      expect(cached).toBeNull();
    });

    it('should clear cache', () => {
      cache.set('test-key', {
        path: 'test.json',
        exists: true,
        fromCache: false,
        responseTime: 100
      });

      discovery.clearCache();

      const cached = discovery.getCachedConfig('test-key');
      expect(cached).toBeNull();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide comprehensive stats', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      await discovery.checkConfigExists('test.json');

      const stats = discovery.getStats();

      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('environment');
      expect(stats).toHaveProperty('options');
      expect(stats.environment).toBe('local');
    });

    it('should track performance measurements', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      await discovery.checkConfigExists('test.json');

      const performanceStats = performanceMonitor.getStats();
      expect(performanceStats.totalMeasurements).toBeGreaterThan(0);
    });

    it('should track request metrics', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      await discovery.checkConfigExists('test.json');

      const requestStats = requestMonitor.getStats();
      expect(requestStats.totalRequests).toBe(1);
      expect(requestStats.successfulRequests).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 200 })) // HEAD
        .mockResolvedValueOnce(new Response('invalid json', { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // GET

      const results = await discovery.discoverConfigs(['test.json']);

      expect(results[0].exists).toBe(true);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[0].config).toBeUndefined();
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const results = await discovery.discoverConfigs(['test.json']);

      expect(results[0].exists).toBe(false);
      expect(results[0].error).toBeInstanceOf(Error);
    });

    it('should fallback when parallel discovery fails', async () => {
      // Make parallel discovery fail
      const failingDiscovery = new SmartConfigDiscovery(
        cache, 
        performanceMonitor, 
        requestMonitor, 
        { fallbackToDefaults: true }
      );

      // Mock environment adapter to throw
      vi.spyOn(failingDiscovery as any, 'checkFileExistence').mockRejectedValue(new Error('Adapter error'));

      // Mock fetch for fallback
      mockFetch
        .mockResolvedValueOnce(new Response('', { status: 404 })) // HEAD
        .mockResolvedValueOnce(new Response('', { status: 200 })) // HEAD
        .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'Fallback Config' }), { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        })); // GET

      const results = await failingDiscovery.discoverConfigs();

      expect(results).toHaveLength(2); // Should stop at first successful
      expect(results[1].config).toEqual({ title: 'Fallback Config' });
    });
  });

  describe('Environment Integration', () => {
    it('should create GitHub Pages adapter when on GitHub Pages', () => {
      vi.doMock('../../../src/optimization/foundation/environment-utils', () => ({
        EnvironmentUtils: {
          detectEnvironment: () => ({
            type: 'github_pages',
            capabilities: {
              supportsHeadRequests: false,
              supportsCors: true,
              supportsRangeRequests: true
            },
            platform: 'browser'
          })
        }
      }));

      const githubDiscovery = new SmartConfigDiscovery(cache, performanceMonitor, requestMonitor);
      expect(githubDiscovery).toBeInstanceOf(SmartConfigDiscovery);
    });

    it('should use GET requests when HEAD requests are disabled', async () => {
      const discoveryNoHead = new SmartConfigDiscovery(
        cache, 
        performanceMonitor, 
        requestMonitor,
        { useHeadRequests: false }
      );

      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      await discoveryNoHead.checkConfigExists('test.json');

      expect(mockFetch).toHaveBeenCalledWith('test.json', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should make parallel requests for multiple files', async () => {
      const startTime = Date.now();
      
      // Mock responses with delay to test parallelism
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(new Response('', { status: 404 })), 50)
        )
      );

      await discovery.discoverConfigs(['file1.json', 'file2.json', 'file3.json', 'file4.json']);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete in much less time than sequential (4 * 50ms = 200ms)
      expect(totalTime).toBeLessThan(150);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should respect concurrent request limits', async () => {
      const limitedDiscovery = new SmartConfigDiscovery(
        cache, 
        performanceMonitor, 
        requestMonitor,
        { maxConcurrentRequests: 2 }
      );

      let concurrentRequests = 0;
      let maxConcurrent = 0;

      mockFetch.mockImplementation(() => {
        concurrentRequests++;
        maxConcurrent = Math.max(maxConcurrent, concurrentRequests);
        
        return new Promise(resolve => 
          setTimeout(() => {
            concurrentRequests--;
            resolve(new Response('', { status: 404 }));
          }, 50)
        );
      });

      await limitedDiscovery.discoverConfigs(['file1.json', 'file2.json', 'file3.json', 'file4.json']);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});