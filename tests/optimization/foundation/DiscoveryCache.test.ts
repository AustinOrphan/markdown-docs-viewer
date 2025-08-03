/**
 * Unit tests for DiscoveryCache
 * 
 * Tests cover LRU eviction, TTL expiration, localStorage persistence, and performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  DiscoveryCache, 
  createDiscoveryCache,
  configCache,
  documentCache,
  metadataCache
} from '../../../src/optimization/foundation/DiscoveryCache';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

vi.stubGlobal('localStorage', localStorageMock);

// Mock Date.now for consistent TTL testing
const mockDateNow = vi.fn();
vi.stubGlobal('Date', { now: mockDateNow });

describe('DiscoveryCache', () => {
  let cache: DiscoveryCache<string>;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 1000000; // Start at a reasonable timestamp
    mockDateNow.mockImplementation(() => currentTime);
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    cache = new DiscoveryCache<string>({
      maxEntries: 3,
      defaultTTL: 60000, // 1 minute
      namespace: 'test',
      persistToStorage: false // Disable for most tests
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should check key existence with has()', () => {
      cache.set('exists', 'value');
      expect(cache.has('exists')).toBe(true);
      expect(cache.has('not-exists')).toBe(false);
    });

    it('should delete specific keys', () => {
      cache.set('to-delete', 'value');
      expect(cache.has('to-delete')).toBe(true);
      
      cache.delete('to-delete');
      expect(cache.has('to-delete')).toBe(false);
      expect(cache.get('to-delete')).toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.getStats().size).toBe(2);
      
      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used item when max entries exceeded', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // All should be present
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      
      // Adding 4th item should evict key1 (oldest)
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update access order when getting items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add 4th item - should evict key2 (now oldest)
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update access order when updating existing items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Update key1 to make it most recently used
      cache.set('key1', 'new-value1');
      
      // Add 4th item - should evict key2 (now oldest)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('new-value1');
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('expiring', 'value', 30000); // 30 seconds TTL
      
      expect(cache.get('expiring')).toBe('value');
      
      // Move time forward past TTL
      currentTime += 35000;
      
      expect(cache.get('expiring')).toBeNull();
      expect(cache.has('expiring')).toBe(false);
    });

    it('should use default TTL when none specified', () => {
      cache.set('default-ttl', 'value');
      
      // Move time forward past default TTL (60000ms)
      currentTime += 65000;
      
      expect(cache.get('default-ttl')).toBeNull();
    });

    it('should not expire entries without TTL', () => {
      const neverExpireCache = new DiscoveryCache<string>({
        defaultTTL: undefined
      });
      
      neverExpireCache.set('never-expires', 'value');
      
      // Move time forward significantly
      currentTime += 1000000;
      
      expect(neverExpireCache.get('never-expires')).toBe('value');
      neverExpireCache.destroy();
    });

    it('should allow setting TTL for existing entries', () => {
      cache.set('update-ttl', 'value', 60000);
      
      expect(cache.setTTL('update-ttl', 10000)).toBe(true);
      
      // Move time past new TTL but less than original
      currentTime += 15000;
      
      expect(cache.get('update-ttl')).toBeNull();
    });

    it('should return false when setting TTL for non-existent key', () => {
      expect(cache.setTTL('non-existent', 10000)).toBe(false);
    });

    it('should calculate remaining TTL correctly', () => {
      cache.set('ttl-check', 'value', 60000);
      
      currentTime += 20000; // 20 seconds elapsed
      
      const remaining = cache.getRemainingTTL('ttl-check');
      expect(remaining).toBe(40000); // 40 seconds remaining
    });

    it('should return null TTL for non-existent keys', () => {
      expect(cache.getRemainingTTL('non-existent')).toBeNull();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide comprehensive statistics', () => {
      cache.set('stat1', 'value1');
      cache.set('stat2', 'value2');
      
      // Access one item multiple times
      cache.get('stat1');
      cache.get('stat1');
      cache.get('stat2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxEntries).toBe(3);
      expect(stats.totalAccesses).toBe(5); // 2 sets + 3 gets
      expect(stats.averageAccesses).toBe(2.5);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should detect expired entries in statistics', () => {
      cache.set('will-expire', 'value', 30000);
      cache.set('will-not-expire', 'value', 120000);
      
      currentTime += 35000; // Expire first entry
      
      const stats = cache.getStats();
      expect(stats.expiredEntries).toBe(1);
    });

    it('should provide list of cache keys', () => {
      cache.set('key-a', 'value');
      cache.set('key-b', 'value');
      
      const keys = cache.getKeys();
      expect(keys).toContain('key-a');
      expect(keys).toContain('key-b');
      expect(keys).toHaveLength(2);
    });
  });

  describe('Cleanup Operations', () => {
    it('should manually cleanup expired entries', () => {
      cache.set('expire1', 'value', 30000);
      cache.set('expire2', 'value', 30000);
      cache.set('valid', 'value', 120000);
      
      currentTime += 35000; // Expire first two
      
      const removedCount = cache.cleanup();
      expect(removedCount).toBe(2);
      expect(cache.getStats().size).toBe(1);
      expect(cache.has('valid')).toBe(true);
    });

    it('should automatically cleanup on timer', (done) => {
      const autoCleanupCache = new DiscoveryCache<string>({
        cleanupInterval: 50, // 50ms for quick test
        defaultTTL: 30
      });
      
      autoCleanupCache.set('auto-expire', 'value', 25);
      
      setTimeout(() => {
        expect(autoCleanupCache.has('auto-expire')).toBe(false);
        autoCleanupCache.destroy();
        done();
      }, 100);
    });

    it('should stop cleanup timer when destroyed', () => {
      const timerSpy = vi.spyOn(global, 'clearInterval');
      
      cache.destroy();
      
      expect(timerSpy).toHaveBeenCalled();
      timerSpy.mockRestore();
    });
  });

  describe('localStorage Persistence', () => {
    let persistentCache: DiscoveryCache<string>;

    beforeEach(() => {
      persistentCache = new DiscoveryCache<string>({
        namespace: 'persistent-test',
        persistToStorage: true
      });
    });

    afterEach(() => {
      persistentCache.destroy();
    });

    it('should save to localStorage on set operations', () => {
      persistentCache.set('persist-key', 'persist-value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mdv-cache-persistent-test',
        expect.stringContaining('persist-key')
      );
    });

    it('should load from localStorage on initialization', () => {
      const storedData = {
        cache: [['loaded-key', { 
          value: 'loaded-value', 
          timestamp: currentTime,
          ttl: 60000,
          accessCount: 1,
          lastAccessed: currentTime
        }]],
        accessOrder: ['loaded-key'],
        timestamp: currentTime
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const loadedCache = new DiscoveryCache<string>({
        namespace: 'loaded-test',
        persistToStorage: true
      });
      
      expect(loadedCache.get('loaded-key')).toBe('loaded-value');
      loadedCache.destroy();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const cache = new DiscoveryCache<string>({
        namespace: 'invalid-test',
        persistToStorage: true
      });
      
      // Should not throw and should work normally
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      cache.destroy();
    });

    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // Should not throw when storage fails
      expect(() => {
        persistentCache.set('quota-test', 'value');
      }).not.toThrow();
    });

    it('should clear localStorage on clear()', () => {
      persistentCache.clear();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'mdv-cache-persistent-test'
      );
    });
  });

  describe('Type Safety and Generics', () => {
    it('should work with different types', () => {
      const numberCache = new DiscoveryCache<number>();
      const objectCache = new DiscoveryCache<{ id: number; name: string }>();
      
      numberCache.set('num', 42);
      objectCache.set('obj', { id: 1, name: 'test' });
      
      expect(numberCache.get('num')).toBe(42);
      expect(objectCache.get('obj')).toEqual({ id: 1, name: 'test' });
      
      numberCache.destroy();
      objectCache.destroy();
    });

    it('should maintain type safety with factory function', () => {
      const typedCache = createDiscoveryCache<boolean>({
        maxEntries: 10
      });
      
      typedCache.set('flag', true);
      expect(typedCache.get('flag')).toBe(true);
      
      typedCache.destroy();
    });
  });

  describe('Pre-configured Caches', () => {
    it('should provide pre-configured cache instances', () => {
      expect(configCache).toBeInstanceOf(DiscoveryCache);
      expect(documentCache).toBeInstanceOf(DiscoveryCache);
      expect(metadataCache).toBeInstanceOf(DiscoveryCache);
    });

    it('should have different namespaces for pre-configured caches', () => {
      configCache.set('config-test', 'config-value');
      documentCache.set('doc-test', 'doc-value');
      metadataCache.set('meta-test', 'meta-value');
      
      // Each should maintain separate storage
      expect(configCache.get('config-test')).toBe('config-value');
      expect(documentCache.get('doc-test')).toBe('doc-value');
      expect(metadataCache.get('meta-test')).toBe('meta-value');
      
      // Should not cross-contaminate
      expect(configCache.get('doc-test')).toBeNull();
      expect(documentCache.get('meta-test')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined localStorage gracefully', () => {
      vi.stubGlobal('localStorage', undefined);
      
      const cache = new DiscoveryCache<string>({
        persistToStorage: true
      });
      
      // Should work without localStorage
      cache.set('no-storage', 'value');
      expect(cache.get('no-storage')).toBe('value');
      
      cache.destroy();
    });

    it('should handle very large cache operations', () => {
      const largeCache = new DiscoveryCache<string>({
        maxEntries: 10000,
        persistToStorage: false
      });
      
      // Add many entries
      for (let i = 0; i < 5000; i++) {
        largeCache.set(`key-${i}`, `value-${i}`);
      }
      
      expect(largeCache.getStats().size).toBe(5000);
      
      // Should still be fast
      const startTime = Date.now();
      largeCache.get('key-2500');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
      
      largeCache.destroy();
    });

    it('should handle concurrent operations safely', () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve().then(() => {
          cache.set(`concurrent-${i}`, `value-${i}`);
          return cache.get(`concurrent-${i}`);
        }));
      }
      
      return Promise.all(promises).then(results => {
        // All operations should complete successfully
        expect(results).toHaveLength(100);
        expect(results.every(r => typeof r === 'string')).toBe(true);
      });
    });
  });
});