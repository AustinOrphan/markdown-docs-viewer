/**
 * Unit tests for RequestMonitor
 * 
 * Tests cover request deduplication, metrics collection, listener pattern, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  RequestMonitor,
  getGlobalRequestMonitor,
  resetGlobalRequestMonitor,
  createMonitoredFetch,
  type RequestMetrics,
  type RequestListener
} from '../../../src/optimization/foundation/RequestMonitor';
import { PerformanceMonitor } from '../../../src/optimization/foundation/PerformanceMonitor';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
vi.stubGlobal('performance', {
  now: mockPerformanceNow
});

// Mock Date.now for consistent timestamps
const mockDateNow = vi.fn();
vi.stubGlobal('Date', { now: mockDateNow });

// Mock setTimeout for retry delays
vi.stubGlobal('setTimeout', vi.fn((callback) => {
  callback();
  return 1;
}));

describe('RequestMonitor', () => {
  let monitor: RequestMonitor;
  let performanceMonitor: PerformanceMonitor;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 1000000;
    mockDateNow.mockImplementation(() => currentTime);
    mockPerformanceNow.mockImplementation(() => currentTime);
    
    performanceMonitor = new PerformanceMonitor();
    monitor = new RequestMonitor(performanceMonitor);
    
    mockFetch.mockClear();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('Basic Request Monitoring', () => {
    it('should monitor successful requests', async () => {
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      const response = await monitor.monitoredFetch('https://example.com/test');
      
      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
      
      const metrics = monitor.getAllMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        url: 'https://example.com/test',
        method: 'GET',
        success: true,
        status: 200
      });
    });

    it('should monitor failed requests', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);
      
      await expect(monitor.monitoredFetch('https://example.com/fail'))
        .rejects.toThrow();
      
      const metrics = monitor.getAllMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        url: 'https://example.com/fail',
        method: 'GET',
        success: false,
        error: 'Network error'
      });
    });

    it('should track request timing', async () => {
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockImplementation(async () => {
        currentTime += 150; // Simulate 150ms request
        return mockResponse;
      });
      
      await monitor.monitoredFetch('https://example.com/timed');
      
      const metrics = monitor.getAllMetrics();
      expect(metrics[0].duration).toBe(150);
    });

    it('should support different HTTP methods', async () => {
      const mockResponse = new Response('{}', { status: 201 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      await monitor.monitoredFetch('https://example.com/api', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });
      
      const metrics = monitor.getAllMetrics();
      expect(metrics[0].method).toBe('POST');
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const mockResponse = new Response('shared', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Start two identical requests simultaneously
      const promise1 = monitor.monitoredFetch('https://example.com/same');
      const promise2 = monitor.monitoredFetch('https://example.com/same');
      
      const [response1, response2] = await Promise.all([promise1, promise2]);
      
      expect(response1).toBe(mockResponse);
      expect(response2).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const metrics = monitor.getAllMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics.some(m => m.fromCache)).toBe(true);
    });

    it('should consider method and body for deduplication', async () => {
      const mockResponse1 = new Response('get', { status: 200 });
      const mockResponse2 = new Response('post', { status: 200 });
      
      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);
      
      // Same URL but different methods should not be deduplicated
      const promise1 = monitor.monitoredFetch('https://example.com/api');
      const promise2 = monitor.monitoredFetch('https://example.com/api', {
        method: 'POST'
      });
      
      await Promise.all([promise1, promise2]);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should disable deduplication when configured', async () => {
      monitor.configure({ deduplicationEnabled: false });
      
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);
      
      const promise1 = monitor.monitoredFetch('https://example.com/nodedup');
      const promise2 = monitor.monitoredFetch('https://example.com/nodedup');
      
      await Promise.all([promise1, promise2]);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Concurrent Request Management', () => {
    it('should limit concurrent requests', async () => {
      monitor.configure({ maxConcurrentRequests: 2 });
      
      let resolveRequest1: (response: Response) => void;
      let resolveRequest2: (response: Response) => void;
      
      mockFetch
        .mockImplementationOnce(() => new Promise(resolve => { resolveRequest1 = resolve; }))
        .mockImplementationOnce(() => new Promise(resolve => { resolveRequest2 = resolve; }));
      
      // Start two requests (should be allowed)
      const promise1 = monitor.monitoredFetch('https://example.com/1');
      const promise2 = monitor.monitoredFetch('https://example.com/2');
      
      // Third request should be rejected
      await expect(monitor.monitoredFetch('https://example.com/3'))
        .rejects.toThrow('Maximum concurrent requests');
      
      // Resolve the first two requests
      resolveRequest1!(new Response('1'));
      resolveRequest2!(new Response('2'));
      
      await Promise.all([promise1, promise2]);
    });

    it('should track pending requests', async () => {
      let resolveRequest: (response: Response) => void;
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => { resolveRequest = resolve; })
      );
      
      const promise = monitor.monitoredFetch('https://example.com/pending');
      
      const pending = monitor.getPendingRequests();
      expect(pending).toHaveLength(1);
      expect(pending[0].url).toBe('https://example.com/pending');
      
      resolveRequest!(new Response('done'));
      await promise;
      
      expect(monitor.getPendingRequests()).toHaveLength(0);
    });

    it('should cancel all pending requests', async () => {
      let abortSignal: AbortSignal;
      mockFetch.mockImplementationOnce((url, options) => {
        abortSignal = options.signal;
        return new Promise(() => {}); // Never resolves
      });
      
      const promise = monitor.monitoredFetch('https://example.com/cancel');
      
      monitor.cancelAllRequests();
      
      expect(abortSignal!.aborted).toBe(true);
      expect(monitor.getPendingRequests()).toHaveLength(0);
    });

    it('should cancel requests by URL pattern', async () => {
      let abortSignal1: AbortSignal;
      let abortSignal2: AbortSignal;
      
      mockFetch
        .mockImplementationOnce((url, options) => {
          abortSignal1 = options.signal;
          return new Promise(() => {});
        })
        .mockImplementationOnce((url, options) => {
          abortSignal2 = options.signal;
          return new Promise(() => {});
        });
      
      const promise1 = monitor.monitoredFetch('https://api.example.com/users');
      const promise2 = monitor.monitoredFetch('https://cdn.example.com/images');
      
      monitor.cancelRequestsForUrl(/api\.example\.com/);
      
      expect(abortSignal1!.aborted).toBe(true);
      expect(abortSignal2!.aborted).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce(new Response('success', { status: 200 }));
      
      const response = await monitor.monitoredFetch('https://example.com/retry');
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
      
      const metrics = monitor.getAllMetrics();
      expect(metrics[0].retryCount).toBe(2);
    });

    it('should give up after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent failure'));
      
      await expect(monitor.monitoredFetch('https://example.com/fail'))
        .rejects.toThrow('Request failed after 2 retries');
      
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 attempts total
    });

    it('should not retry aborted requests', async () => {
      const abortError = new Error('The user aborted a request');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);
      
      await expect(monitor.monitoredFetch('https://example.com/abort'))
        .rejects.toThrow();
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Listener Pattern', () => {
    it('should notify listeners of request metrics', async () => {
      const listener = vi.fn();
      const unsubscribe = monitor.addListener(listener);
      
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      await monitor.monitoredFetch('https://example.com/listen');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/listen',
          success: true
        })
      );
      
      unsubscribe();
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      monitor.addListener(errorListener);
      monitor.addListener(goodListener);
      
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      // Should not throw despite listener error
      await monitor.monitoredFetch('https://example.com/error');
      
      expect(goodListener).toHaveBeenCalled();
    });

    it('should remove listeners correctly', () => {
      const listener = vi.fn();
      monitor.addListener(listener);
      monitor.removeListener(listener);
      
      // Should not call removed listener
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Statistics and Metrics', () => {
    beforeEach(async () => {
      // Create test data
      const responses = [
        new Response('1', { status: 200 }),
        new Response('2', { status: 404 }),
        new Response('3', { status: 200 })
      ];
      
      mockFetch
        .mockResolvedValueOnce(responses[0])
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);
      
      // Successful GET
      await monitor.monitoredFetch('https://example.com/success');
      
      // Failed request
      try {
        await monitor.monitoredFetch('https://example.com/fail');
      } catch {}
      
      // 404 response
      await monitor.monitoredFetch('https://example.com/notfound');
      
      // POST request
      await monitor.monitoredFetch('https://example.com/post', {
        method: 'POST'
      });
    });

    it('should provide comprehensive statistics', () => {
      const stats = monitor.getStats();
      
      expect(stats.totalRequests).toBe(4);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(1);
      expect(stats.requestsByMethod.GET).toBe(3);
      expect(stats.requestsByMethod.POST).toBe(1);
      expect(stats.requestsByStatus[200]).toBe(2);
      expect(stats.requestsByStatus[404]).toBe(1);
    });

    it('should calculate average response time', () => {
      // Mock different durations
      const metricsWithDuration = monitor.getAllMetrics().map((metric, index) => ({
        ...metric,
        duration: (index + 1) * 100 // 100, 200, 300, 400 ms
      }));
      
      // Replace metrics for testing
      monitor.reset();
      metricsWithDuration.forEach(metric => {
        (monitor as any).recordMetrics(metric);
      });
      
      const stats = monitor.getStats();
      expect(stats.averageResponseTime).toBe(250); // (100+200+300+400)/4
    });

    it('should filter metrics by URL pattern', () => {
      const apiMetrics = monitor.getMetricsForUrl(/\/api\//);
      const allMetrics = monitor.getMetricsForUrl('example.com');
      
      expect(apiMetrics).toHaveLength(0); // No API endpoints in test data
      expect(allMetrics).toHaveLength(4); // All match example.com
    });
  });

  describe('Data Export and Analysis', () => {
    it('should export metrics to JSON', async () => {
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      await monitor.monitoredFetch('https://example.com/export');
      
      const exported = monitor.exportMetrics();
      const data = JSON.parse(exported);
      
      expect(data.stats).toBeDefined();
      expect(data.metrics).toHaveLength(1);
      expect(data.pendingRequests).toBeDefined();
      expect(data.timestamp).toBeTypeOf('number');
    });
  });

  describe('Configuration', () => {
    it('should allow runtime configuration', () => {
      monitor.configure({
        deduplicationEnabled: false,
        maxConcurrentRequests: 5
      });
      
      // Configuration should be applied (tested in other test cases)
      expect(() => monitor.configure({})).not.toThrow();
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset all state', async () => {
      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);
      
      await monitor.monitoredFetch('https://example.com/reset');
      
      expect(monitor.getAllMetrics()).toHaveLength(1);
      
      monitor.reset();
      
      expect(monitor.getAllMetrics()).toHaveLength(0);
      expect(monitor.getPendingRequests()).toHaveLength(0);
    });
  });
});

describe('Global RequestMonitor', () => {
  beforeEach(() => {
    resetGlobalRequestMonitor();
  });

  it('should return same instance on multiple calls', () => {
    const instance1 = getGlobalRequestMonitor();
    const instance2 = getGlobalRequestMonitor();
    
    expect(instance1).toBe(instance2);
  });

  it('should reset global instance', () => {
    const instance = getGlobalRequestMonitor();
    
    // Add some state
    (instance as any).metrics.push({ url: 'test' });
    
    resetGlobalRequestMonitor();
    
    // Should create new instance
    const newInstance = getGlobalRequestMonitor();
    expect(newInstance).not.toBe(instance);
  });
});

describe('Monitored Fetch Function', () => {
  beforeEach(() => {
    resetGlobalRequestMonitor();
    mockFetch.mockClear();
  });

  it('should create monitored fetch function', async () => {
    const monitoredFetch = createMonitoredFetch();
    const mockResponse = new Response('test', { status: 200 });
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    const response = await monitoredFetch('https://example.com/monitored');
    
    expect(response).toBe(mockResponse);
    
    const globalMonitor = getGlobalRequestMonitor();
    expect(globalMonitor.getAllMetrics()).toHaveLength(1);
  });

  it('should handle URL objects', async () => {
    const monitoredFetch = createMonitoredFetch();
    const mockResponse = new Response('test', { status: 200 });
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    const url = new URL('https://example.com/url-object');
    await monitoredFetch(url);
    
    const globalMonitor = getGlobalRequestMonitor();
    const metrics = globalMonitor.getAllMetrics();
    expect(metrics[0].url).toBe('https://example.com/url-object');
  });
});