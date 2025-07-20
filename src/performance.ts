import { Document } from './types';

// LRU Cache implementation for documents
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private accessOrder: K[];

  constructor(capacity: number = 50) {
    this.capacity = Math.max(1, capacity);
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to front (most recently used)
      this.moveToFront(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.set(key, value);
      this.moveToFront(key);
    } else {
      // Add new key
      if (this.cache.size >= this.capacity) {
        this.evictLeastRecentlyUsed();
      }
      this.cache.set(key, value);
      this.accessOrder.unshift(key);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getMemoryUsage(): number {
    // Estimate memory usage in bytes
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += this.estimateSize(key) + this.estimateSize(value);
    }
    return totalSize;
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  private moveToFront(key: K): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.unshift(key);
  }

  private evictLeastRecentlyUsed(): void {
    const lru = this.accessOrder.pop();
    if (lru !== undefined) {
      this.cache.delete(lru);
    }
  }

  private estimateSize(obj: any): number {
    if (typeof obj === 'string') {
      return obj.length * 2; // UTF-16 characters
    }
    if (typeof obj === 'number') {
      return 8; // 64-bit number
    }
    if (typeof obj === 'object' && obj !== null) {
      return JSON.stringify(obj).length * 2;
    }
    return 4; // Other primitives
  }
}

// Enhanced cache with persistence
export class PersistentCache extends LRUCache<string, string> {
  private storageKey: string;
  private useStorage: boolean;

  constructor(capacity: number = 50, storageKey: string = 'mdv-cache') {
    super(capacity);
    this.storageKey = storageKey;
    this.useStorage = this.isStorageAvailable();
    
    if (this.useStorage) {
      this.loadFromStorage();
    }
  }

  set(key: string, value: string): void {
    super.set(key, value);
    
    if (this.useStorage) {
      this.saveToStorage();
    }
  }

  clear(): void {
    super.clear();
    
    if (this.useStorage) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn('Failed to clear persistent cache:', error);
      }
    }
  }

  private isStorageAvailable(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private loadFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const data = JSON.parse(cached);
        for (const [key, value] of data.entries || []) {
          super.set(key, value);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }
}

// Search index for fast document searching
export class SearchIndex {
  private documents: Document[] = [];
  private titleIndex: Map<string, Set<number>> = new Map();
  private contentIndex: Map<string, Set<number>> = new Map();
  private tagIndex: Map<string, Set<number>> = new Map();
  private searchCache: Map<string, Document[]> = new Map();
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'but', 'or', 'not', 'can'
  ]);

  updateIndex(documents: Document[], contentCache: Map<string, string>): void {
    this.documents = documents;
    this.clearIndex();
    this.searchCache.clear();

    documents.forEach((doc, index) => {
      // Index title
      this.indexText(doc.title, this.titleIndex, index);
      
      // Index description
      if (doc.description) {
        this.indexText(doc.description, this.contentIndex, index);
      }

      // Index tags
      if (doc.tags) {
        doc.tags.forEach(tag => {
          this.indexText(tag, this.tagIndex, index);
        });
      }

      // Index content if available
      const content = contentCache.get(doc.id);
      if (content) {
        // Remove markdown syntax for cleaner indexing
        const cleanContent = this.cleanMarkdown(content);
        this.indexText(cleanContent, this.contentIndex, index);
      }
    });
  }

  search(query: string, options: {
    searchInTags?: boolean;
    fuzzySearch?: boolean;
    caseSensitive?: boolean;
    maxResults?: number;
  } = {}): Document[] {
    const cacheKey = JSON.stringify({ query, options });
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const {
      searchInTags = true,
      fuzzySearch = false,
      caseSensitive = false,
      maxResults = 10
    } = options;

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const queryTerms = this.tokenize(normalizedQuery);
    
    const results = new Map<number, { score: number; doc: Document }>();

    for (const term of queryTerms) {
      if (this.stopWords.has(term)) continue;

      // Search in titles (highest priority)
      this.searchInIndex(term, this.titleIndex, results, 3, fuzzySearch);
      
      // Search in content (medium priority)
      this.searchInIndex(term, this.contentIndex, results, 1, fuzzySearch);
      
      // Search in tags (medium priority)
      if (searchInTags) {
        this.searchInIndex(term, this.tagIndex, results, 2, fuzzySearch);
      }
    }

    // Sort by score and return results
    const sortedResults = Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => result.doc);

    this.searchCache.set(cacheKey, sortedResults);
    return sortedResults;
  }

  private clearIndex(): void {
    this.titleIndex.clear();
    this.contentIndex.clear();
    this.tagIndex.clear();
  }

  private indexText(text: string, index: Map<string, Set<number>>, docIndex: number): void {
    const tokens = this.tokenize(text.toLowerCase());
    
    for (const token of tokens) {
      if (!this.stopWords.has(token)) {
        if (!index.has(token)) {
          index.set(token, new Set());
        }
        index.get(token)!.add(docIndex);
      }
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  private cleanMarkdown(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
      .replace(/[#*_~`]/g, '') // Remove markdown syntax
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private searchInIndex(
    term: string, 
    index: Map<string, Set<number>>, 
    results: Map<number, { score: number; doc: Document }>,
    weight: number,
    fuzzySearch: boolean
  ): void {
    // Exact match
    if (index.has(term)) {
      for (const docIndex of index.get(term)!) {
        this.addToResults(results, docIndex, weight);
      }
    }

    // Fuzzy search if enabled
    if (fuzzySearch) {
      for (const [indexedTerm, docIndices] of index) {
        if (this.fuzzyMatch(term, indexedTerm)) {
          for (const docIndex of docIndices) {
            this.addToResults(results, docIndex, weight * 0.5); // Lower weight for fuzzy matches
          }
        }
      }
    }

    // Prefix matching
    for (const [indexedTerm, docIndices] of index) {
      if (indexedTerm.startsWith(term) && indexedTerm !== term) {
        for (const docIndex of docIndices) {
          this.addToResults(results, docIndex, weight * 0.8); // Lower weight for prefix matches
        }
      }
    }
  }

  private addToResults(
    results: Map<number, { score: number; doc: Document }>,
    docIndex: number,
    weight: number
  ): void {
    if (docIndex < this.documents.length) {
      const doc = this.documents[docIndex];
      if (results.has(docIndex)) {
        results.get(docIndex)!.score += weight;
      } else {
        results.set(docIndex, { score: weight, doc });
      }
    }
  }

  private fuzzyMatch(query: string, target: string): boolean {
    if (query.length === 0) return true;
    if (target.length === 0) return false;

    const tolerance = Math.floor(Math.max(query.length, target.length) * 0.3);
    return this.levenshteinDistance(query, target) <= tolerance;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }
}

// Debounced function utility for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = undefined;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttled function utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility for documents
export class LazyLoader {
  private observers: Map<Element, IntersectionObserver> = new Map();
  private loadedElements: WeakSet<Element> = new WeakSet();

  observeElement(
    element: Element,
    callback: () => void,
    options: IntersectionObserverInit = {}
  ): void {
    if (this.loadedElements.has(element)) {
      return; // Already loaded
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
            callback();
            this.loadedElements.add(entry.target);
            observer.unobserve(entry.target);
            this.observers.delete(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  unobserveElement(element: Element): void {
    const observer = this.observers.get(element);
    if (observer) {
      observer.unobserve(element);
      this.observers.delete(element);
    }
  }

  cleanup(): void {
    for (const [element, observer] of this.observers) {
      observer.unobserve(element);
    }
    this.observers.clear();
  }
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: (() => void)[] = [];
  private memoryWarningThreshold = 50 * 1024 * 1024; // 50MB

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  removeCleanupTask(task: () => void): void {
    const index = this.cleanupTasks.indexOf(task);
    if (index > -1) {
      this.cleanupTasks.splice(index, 1);
    }
  }

  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    
    // Force garbage collection if available (mainly for Node.js)
    if (global.gc) {
      global.gc();
    }
  }

  checkMemoryUsage(): boolean {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedJSHeapSize = memInfo.usedJSHeapSize;
      
      if (usedJSHeapSize > this.memoryWarningThreshold) {
        console.warn(`High memory usage detected: ${Math.round(usedJSHeapSize / 1024 / 1024)}MB`);
        this.cleanup();
        return false;
      }
    }
    return true;
  }

  getMemoryStats(): { used?: number; total?: number; limit?: number } {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return {};
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(label) || [];
    
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  getAllMetrics(): Record<string, ReturnType<typeof this.getMetrics>> {
    const result: Record<string, ReturnType<typeof this.getMetrics>> = {};
    
    for (const label of this.metrics.keys()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.recordMetric('resource-load', entry.duration);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Failed to observe resource timing:', error);
      }
    }
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}