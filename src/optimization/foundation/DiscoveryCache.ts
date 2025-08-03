/**
 * DiscoveryCache - High-performance caching system with LRU eviction and TTL support
 * 
 * Features:
 * - Generic type support for type-safe caching
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) expiration
 * - localStorage persistence with fallback to memory
 * - Configurable maximum entries
 * - Cache key namespacing
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxEntries?: number;
  defaultTTL?: number;
  namespace?: string;
  persistToStorage?: boolean;
  cleanupInterval?: number;
}

export class DiscoveryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private config: Required<CacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;
  private storageKey: string;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      defaultTTL: config.defaultTTL ?? 3600000, // 1 hour default
      namespace: config.namespace ?? 'discovery',
      persistToStorage: config.persistToStorage ?? true,
      cleanupInterval: config.cleanupInterval ?? 300000 // 5 minutes
    };

    this.storageKey = `mdv-cache-${this.config.namespace}`;
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Get a value from the cache
   * Updates access order for LRU and checks TTL expiration
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set a value in the cache with optional TTL
   * Handles LRU eviction when max entries exceeded
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    
    // Update existing entry
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.ttl = ttl ?? this.config.defaultTTL;
      entry.lastAccessed = now;
      this.updateAccessOrder(key);
      this.saveToStorage();
      return;
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.saveToStorage();
  }

  /**
   * Check if a key exists in the cache (without updating access order)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): void {
    if (this.cache.delete(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.saveToStorage();
    }
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.clearStorage();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccesses = 0;

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expiredCount++;
      }
      totalAccesses += entry.accessCount;
    }

    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      expiredEntries: expiredCount,
      totalAccesses,
      averageAccesses: this.cache.size > 0 ? totalAccesses / this.cache.size : 0,
      oldestEntry: this.getOldestEntryAge(),
      newestEntry: this.getNewestEntryAge()
    };
  }

  /**
   * Get all cache keys (useful for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Cleanup expired entries manually
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Set TTL for an existing cache entry
   */
  setTTL(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    entry.ttl = ttl;
    entry.timestamp = Date.now(); // Reset timestamp
    this.saveToStorage();
    return true;
  }

  /**
   * Get remaining TTL for a cache entry (in milliseconds)
   */
  getRemainingTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry || !entry.ttl) {
      return null;
    }

    const elapsed = Date.now() - entry.timestamp;
    const remaining = entry.ttl - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  /**
   * Check if a cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) {
      return false;
    }
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const serializable = {
        cache: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(serializable));
    } catch (error) {
      // Storage quota exceeded or other error - silently fail
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored);
      
      // Restore cache entries
      for (const [key, entry] of data.cache) {
        if (!this.isExpired(entry)) {
          this.cache.set(key, entry);
        }
      }

      // Restore access order (filter out expired entries)
      this.accessOrder = data.accessOrder.filter((key: string) => this.cache.has(key));
    } catch (error) {
      // Invalid data or parse error - start fresh
      console.warn('Failed to load cache from localStorage:', error);
      this.clearStorage();
    }
  }

  /**
   * Clear cache from localStorage
   */
  private clearStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer (useful for testing or cleanup)
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Get age of oldest entry in milliseconds
   */
  private getOldestEntryAge(): number {
    if (this.cache.size === 0) return 0;
    
    const now = Date.now();
    let oldest = now;
    
    for (const entry of this.cache.values()) {
      oldest = Math.min(oldest, entry.timestamp);
    }
    
    return now - oldest;
  }

  /**
   * Get age of newest entry in milliseconds
   */
  private getNewestEntryAge(): number {
    if (this.cache.size === 0) return 0;
    
    const now = Date.now();
    let newest = 0;
    
    for (const entry of this.cache.values()) {
      newest = Math.max(newest, entry.timestamp);
    }
    
    return now - newest;
  }

  /**
   * Cleanup method to be called before destroying the cache
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.saveToStorage();
  }
}

// Factory function for creating commonly configured caches
export function createDiscoveryCache<T>(config?: CacheConfig): DiscoveryCache<T> {
  return new DiscoveryCache<T>(config);
}

// Pre-configured cache instances for common use cases
export const configCache = new DiscoveryCache<any>({
  namespace: 'config',
  maxEntries: 100,
  defaultTTL: 600000 // 10 minutes
});

export const documentCache = new DiscoveryCache<string>({
  namespace: 'documents',
  maxEntries: 500,
  defaultTTL: 1800000 // 30 minutes
});

export const metadataCache = new DiscoveryCache<any>({
  namespace: 'metadata',
  maxEntries: 200,
  defaultTTL: 900000 // 15 minutes
});