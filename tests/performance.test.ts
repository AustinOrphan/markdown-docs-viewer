import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  LRUCache, 
  PersistentCache, 
  SearchIndex, 
  debounce, 
  throttle,
  LazyLoader,
  MemoryManager,
  PerformanceMonitor 
} from '../src/performance';
import { Document } from '../src/types';

describe('Performance Optimizations', () => {
  describe('LRUCache', () => {
    let cache: LRUCache<string, string>;

    beforeEach(() => {
      cache = new LRUCache<string, string>(3);
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should respect capacity limits', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);
      expect(cache.getCapacity()).toBe(3);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key3')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should delete specific entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const deleted = cache.delete('key1');
      
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should estimate memory usage', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'longer_value_string');
      
      const memoryUsage = cache.getMemoryUsage();
      
      expect(memoryUsage).toBeGreaterThan(0);
      expect(typeof memoryUsage).toBe('number');
    });
  });

  describe('PersistentCache', () => {
    let cache: PersistentCache;

    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      vi.stubGlobal('localStorage', localStorageMock as any);
      
      cache = new PersistentCache(3, 'test-cache');
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('should function as LRU cache when localStorage is available', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should attempt to save to localStorage', () => {
      cache.set('key1', 'value1');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should attempt to clear localStorage on clear', () => {
      cache.clear();
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-cache');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage to throw an error
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => cache.set('key1', 'value1')).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('SearchIndex', () => {
    let searchIndex: SearchIndex;
    let documents: Document[];
    let contentCache: Map<string, string>;

    beforeEach(() => {
      searchIndex = new SearchIndex();
      documents = [
        {
          id: 'doc1',
          title: 'Getting Started Guide',
          description: 'Learn the basics of our platform',
          tags: ['beginner', 'tutorial'],
          category: 'Getting Started'
        },
        {
          id: 'doc2',
          title: 'Advanced Configuration',
          description: 'Configure advanced settings',
          tags: ['advanced', 'configuration'],
          category: 'Configuration'
        },
        {
          id: 'doc3',
          title: 'API Reference',
          description: 'Complete API documentation',
          tags: ['api', 'reference'],
          category: 'Reference'
        }
      ];
      
      contentCache = new Map([
        ['doc1', '# Getting Started\nThis guide will help you get started with our platform.'],
        ['doc2', '# Advanced Configuration\nLearn how to configure advanced features.'],
        ['doc3', '# API Reference\nComplete reference for our REST API.']
      ]);
    });

    it('should index documents and enable search', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('getting started');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc1');
    });

    it('should search in titles with high priority', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('guide');
      
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('doc1'); // Should rank higher due to title match
    });

    it('should search in tags when enabled', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('beginner', { searchInTags: true });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc1');
    });

    it('should respect case sensitivity option', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const caseInsensitiveResults = searchIndex.search('API', { caseSensitive: false });
      const caseSensitiveResults = searchIndex.search('API', { caseSensitive: true });
      
      expect(caseInsensitiveResults).toHaveLength(1);
      expect(caseSensitiveResults).toHaveLength(1);
    });

    it('should limit search results', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('configuration', { maxResults: 1 });
      
      expect(results).toHaveLength(1);
    });

    it('should perform fuzzy search when enabled', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('configureation', { fuzzySearch: true }); // Misspelled
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should cache search results', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      // First search
      const results1 = searchIndex.search('getting started');
      
      // Second identical search should return cached results
      const results2 = searchIndex.search('getting started');
      
      expect(results1).toEqual(results2);
      expect(results1).toHaveLength(1);
    });

    it('should filter out stop words', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      // "the" is a stop word and should be ignored
      const results = searchIndex.search('the guide');
      
      expect(results).toHaveLength(2); // Should find results for "guide"
    });

    it('should handle empty search queries', () => {
      searchIndex.updateIndex(documents, contentCache);
      
      const results = searchIndex.search('');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('should delay function execution', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');
      
      vi.advanceTimersByTime(150);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });

  describe('Throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('should limit function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn('first');
      throttledFn('second');
      throttledFn('third');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');
      
      vi.advanceTimersByTime(150);
      
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('fourth');
    });
  });

  describe('LazyLoader', () => {
    let lazyLoader: LazyLoader;
    let mockElement: HTMLElement;
    let mockObserver: any;

    beforeEach(() => {
      lazyLoader = new LazyLoader();
      mockElement = document.createElement('div');
      
      // Mock IntersectionObserver
      mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      };
      
      vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation((callback) => {
        mockObserver.callback = callback;
        return mockObserver;
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('should observe elements for intersection', () => {
      const callback = vi.fn();
      
      lazyLoader.observeElement(mockElement, callback);
      
      expect(IntersectionObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
    });

    it('should execute callback when element intersects', () => {
      const callback = vi.fn();
      
      lazyLoader.observeElement(mockElement, callback);
      
      // Simulate intersection
      mockObserver.callback([{
        target: mockElement,
        isIntersecting: true
      }]);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should not observe already loaded elements', () => {
      const callback = vi.fn();
      
      // First observation
      lazyLoader.observeElement(mockElement, callback);
      
      // Simulate intersection to mark as loaded
      mockObserver.callback([{
        target: mockElement,
        isIntersecting: true
      }]);
      
      // Reset mock
      mockObserver.observe.mockClear();
      
      // Second observation should be ignored
      lazyLoader.observeElement(mockElement, callback);
      
      expect(mockObserver.observe).not.toHaveBeenCalled();
    });

    it('should unobserve elements', () => {
      const callback = vi.fn();
      
      lazyLoader.observeElement(mockElement, callback);
      lazyLoader.unobserveElement(mockElement);
      
      expect(mockObserver.unobserve).toHaveBeenCalledWith(mockElement);
    });

    it('should cleanup all observers', () => {
      const callback = vi.fn();
      
      lazyLoader.observeElement(mockElement, callback);
      lazyLoader.cleanup();
      
      expect(mockObserver.unobserve).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('MemoryManager', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = MemoryManager.getInstance();
    });

    it('should be a singleton', () => {
      const instance1 = MemoryManager.getInstance();
      const instance2 = MemoryManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should add and execute cleanup tasks', () => {
      const cleanupTask = vi.fn();
      
      memoryManager.addCleanupTask(cleanupTask);
      memoryManager.cleanup();
      
      expect(cleanupTask).toHaveBeenCalled();
    });

    it('should remove cleanup tasks', () => {
      const cleanupTask = vi.fn();
      
      memoryManager.addCleanupTask(cleanupTask);
      memoryManager.removeCleanupTask(cleanupTask);
      memoryManager.cleanup();
      
      expect(cleanupTask).not.toHaveBeenCalled();
    });

    it('should handle cleanup task errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorTask = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      const normalTask = vi.fn();
      
      memoryManager.addCleanupTask(errorTask);
      memoryManager.addCleanupTask(normalTask);
      
      expect(() => memoryManager.cleanup()).not.toThrow();
      expect(normalTask).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should check memory usage when performance.memory is available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 20 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024
      };
      
      (global as any).performance = { memory: mockMemory };
      
      const result = memoryManager.checkMemoryUsage();
      
      expect(result).toBe(true); // Should return true for normal usage
    });

    it('should return memory stats when available', () => {
      const mockMemory = {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 20 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024
      };
      
      (global as any).performance = { memory: mockMemory };
      
      const stats = memoryManager.getMemoryStats();
      
      expect(stats.used).toBe(10);
      expect(stats.total).toBe(20);
      expect(stats.limit).toBe(100);
    });
  });

  describe('PerformanceMonitor', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor();
      
      // Mock performance object and performance.now
      let mockTime = 0;
      const mockPerformance = {
        now: vi.fn().mockImplementation(() => mockTime += 10),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn().mockReturnValue([]),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn()
      };
      
      vi.stubGlobal('performance', mockPerformance);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('should measure timing metrics', () => {
      const endTiming = performanceMonitor.startTiming('test-operation');
      endTiming();
      
      const metrics = performanceMonitor.getMetrics('test-operation');
      
      expect(metrics.count).toBe(1);
      expect(metrics.avg).toBe(10);
      expect(metrics.min).toBe(10);
      expect(metrics.max).toBe(10);
    });

    it('should record multiple measurements', () => {
      performanceMonitor.recordMetric('test-metric', 5);
      performanceMonitor.recordMetric('test-metric', 15);
      performanceMonitor.recordMetric('test-metric', 10);
      
      const metrics = performanceMonitor.getMetrics('test-metric');
      
      expect(metrics.count).toBe(3);
      expect(metrics.avg).toBe(10);
      expect(metrics.min).toBe(5);
      expect(metrics.max).toBe(15);
    });

    it('should limit stored measurements', () => {
      // Add more than 100 measurements
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric('test-metric', i);
      }
      
      const metrics = performanceMonitor.getMetrics('test-metric');
      
      expect(metrics.count).toBe(100); // Should be limited to 100
    });

    it('should return all metrics', () => {
      performanceMonitor.recordMetric('metric1', 10);
      performanceMonitor.recordMetric('metric2', 20);
      
      const allMetrics = performanceMonitor.getAllMetrics();
      
      expect(allMetrics).toHaveProperty('metric1');
      expect(allMetrics).toHaveProperty('metric2');
      expect(allMetrics.metric1.avg).toBe(10);
      expect(allMetrics.metric2.avg).toBe(20);
    });

    it('should clear all metrics', () => {
      performanceMonitor.recordMetric('test-metric', 10);
      performanceMonitor.clearMetrics();
      
      const metrics = performanceMonitor.getMetrics('test-metric');
      
      expect(metrics.count).toBe(0);
    });

    it('should handle non-existent metrics gracefully', () => {
      const metrics = performanceMonitor.getMetrics('non-existent');
      
      expect(metrics.count).toBe(0);
      expect(metrics.avg).toBe(0);
      expect(metrics.min).toBe(0);
      expect(metrics.max).toBe(0);
    });

    it('should cleanup observers', () => {
      const mockObserver = {
        disconnect: vi.fn()
      };
      
      // Simulate having observers
      (performanceMonitor as any).observers = [mockObserver];
      
      performanceMonitor.cleanup();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });
});