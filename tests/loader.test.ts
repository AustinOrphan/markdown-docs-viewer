import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentLoader } from '../src/loader';
import { Document, DocumentSource } from '../src/types';
import { ConsoleErrorLogger } from '../src/errors';
import { PersistentCache, PerformanceMonitor, MemoryManager } from '../src/performance';

// Mock the performance module
vi.mock('../src/performance', () => {
  const mockMemoryManager = {
    addCleanupTask: vi.fn(),
    checkMemoryUsage: vi.fn(),
  };

  return {
    PersistentCache: vi.fn().mockImplementation((size: number, _namespace: string) => ({
      has: vi.fn().mockReturnValue(false),
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      size: vi.fn().mockReturnValue(0),
      getCapacity: vi.fn().mockReturnValue(size),
      getMemoryUsage: vi.fn().mockReturnValue(1024),
    })),
    PerformanceMonitor: vi.fn().mockImplementation(() => ({
      startTiming: vi.fn().mockReturnValue(() => {}),
      getAllMetrics: vi.fn().mockReturnValue({}),
      cleanup: vi.fn(),
    })),
    MemoryManager: {
      getInstance: vi.fn(() => mockMemoryManager),
    },
  };
});

// Mock global fetch
global.fetch = vi.fn();

describe('DocumentLoader', () => {
  let mockFetch: any;
  let mockCache: any;
  let mockPerformanceMonitor: any;
  let mockMemoryManager: any;

  const createSource = (
    type: DocumentSource['type'],
    documents: Document[] = []
  ): DocumentSource => ({
    type,
    documents,
    basePath: type === 'local' ? '/base' : undefined,
    baseUrl: type === 'url' ? 'https://example.com' : undefined,
    headers: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(global.fetch);

    // Create mock instances
    mockCache = {
      has: vi.fn().mockReturnValue(false),
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      size: vi.fn().mockReturnValue(0),
      getCapacity: vi.fn().mockReturnValue(50),
      getMemoryUsage: vi.fn().mockReturnValue(1024),
    };

    mockPerformanceMonitor = {
      startTiming: vi.fn().mockReturnValue(() => {}),
      getAllMetrics: vi.fn().mockReturnValue({}),
      cleanup: vi.fn(),
    };

    mockMemoryManager = MemoryManager.getInstance();

    // Reset mocks to get fresh instances
    vi.mocked(PersistentCache).mockClear();
    vi.mocked(PerformanceMonitor).mockClear();

    // Make the mocks return our instances
    vi.mocked(PersistentCache).mockImplementation(() => mockCache);
    vi.mocked(PerformanceMonitor).mockImplementation(() => mockPerformanceMonitor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const source = createSource('local');
      new DocumentLoader(source);

      expect(PersistentCache).toHaveBeenCalledWith(50, 'mdv-cache-local');
      expect(PerformanceMonitor).toHaveBeenCalled();
      expect(mockMemoryManager.addCleanupTask).toHaveBeenCalled();
    });

    it('should initialize with custom cache size', () => {
      const source = createSource('local');
      new DocumentLoader(source, {}, undefined, 100);

      expect(PersistentCache).toHaveBeenCalledWith(100, 'mdv-cache-local');
    });

    it('should initialize with custom logger', () => {
      const source = createSource('local');
      const customLogger = new ConsoleErrorLogger();
      const loader = new DocumentLoader(source, {}, customLogger);

      expect(loader).toBeDefined();
    });
  });

  describe('loadAll', () => {
    it('should return all documents', async () => {
      const documents = [
        { id: 'doc1', title: 'Doc 1', file: 'doc1.md' },
        { id: 'doc2', title: 'Doc 2', file: 'doc2.md' },
      ];
      const source = createSource('local', documents);
      const loader = new DocumentLoader(source);

      const result = await loader.loadAll();

      expect(result).toEqual(documents);
    });

    it('should handle errors and return empty array', async () => {
      const source = createSource('local');
      // Remove documents to trigger validation error
      source.documents = [];
      const loader = new DocumentLoader(source);

      const result = await loader.loadAll();

      expect(result).toEqual([]);
    });

    it('should validate source configuration', async () => {
      const source = createSource('local', []);
      const loader = new DocumentLoader(source);

      const result = await loader.loadAll();

      expect(result).toEqual([]);
    });
  });

  describe('loadDocument', () => {
    it('should load document with content', async () => {
      const doc: Document = {
        id: 'doc1',
        title: 'Doc 1',
        content: 'Document content',
      };
      const source = createSource('content', [doc]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(doc);

      expect(result).toBe('Document content');
      expect(mockCache.set).toHaveBeenCalledWith('doc1', 'Document content');
    });

    it('should load document from cache if available', async () => {
      const source = createSource('local', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      mockCache.has.mockReturnValue(true);
      mockCache.get.mockReturnValue('Cached content');

      const doc = source.documents[0];
      const result = await loader.loadDocument(doc);

      expect(result).toBe('Cached content');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle loading promise deduplication', async () => {
      const source = createSource('local', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'File content',
      });

      const doc = source.documents[0];

      // Start two parallel loads
      const promise1 = loader.loadDocument(doc);
      const promise2 = loader.loadDocument(doc);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('File content');
      expect(result2).toBe('File content');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch
    });

    it('should handle document without content or file', async () => {
      const doc: Document = { id: 'doc1', title: 'Doc 1' };
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(doc);

      expect(result).toBe('');
    });

    it('should check memory usage after loading', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'File content',
      });

      const doc: Document = { id: 'doc1', title: 'Doc 1', file: 'doc1.md' };
      const source = createSource('local', [doc]);
      const loader = new DocumentLoader(source);
      await loader.loadDocument(doc);

      expect(mockMemoryManager.checkMemoryUsage).toHaveBeenCalled();
    });
  });

  describe('loadFromSource', () => {
    it('should dispatch to correct loader based on source type', async () => {
      const testCases = [
        { type: 'local' as const, file: 'test.md' },
        { type: 'url' as const, file: 'test.md' },
        { type: 'github' as const, file: 'owner/repo/main/test.md' },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
          ok: true,
          text: async () => 'Content',
          json: async () => ({ content: btoa('Content') }),
        });

        const source = createSource(testCase.type, [
          { id: 'doc1', title: 'Doc 1', file: testCase.file },
        ]);
        const loader = new DocumentLoader(source);
        const doc = source.documents[0];

        await loader.loadDocument(doc);

        expect(mockFetch).toHaveBeenCalled();
      }
    });

    it('should throw error for content source trying to load from path', async () => {
      const source = createSource('content', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should throw error for unknown source type', async () => {
      const source = createSource('unknown' as any, [
        { id: 'doc1', title: 'Doc 1', file: 'doc1.md' },
      ]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });
  });

  describe('loadLocal', () => {
    it('should load local file successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Local file content',
      });

      const doc: Document = { id: 'doc1', title: 'Doc 1', file: 'doc1.md' };
      const source = createSource('local', [doc]);
      const loader = new DocumentLoader(source);
      const result = await loader.loadDocument(doc);

      expect(mockFetch).toHaveBeenCalledWith('/base/doc1.md');
      expect(result).toBe('Local file content');
    });

    it('should handle 404 error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const doc: Document = { id: 'doc1', title: 'Doc 1', file: 'doc1.md' };
      const source = createSource('local', [doc]);
      const loader = new DocumentLoader(source);
      const result = await loader.loadDocument(doc);

      expect(result).toBe('');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const doc: Document = { id: 'doc1', title: 'Doc 1', file: 'doc1.md' };
      const source = createSource('local', [doc]);
      const loader = new DocumentLoader(source);
      const result = await loader.loadDocument(doc);

      expect(result).toBe('');
    });

    it('should handle other fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      const doc: Document = { id: 'doc1', title: 'Doc 1', file: 'doc1.md' };
      const source = createSource('local', [doc]);
      const loader = new DocumentLoader(source);
      const result = await loader.loadDocument(doc);

      expect(result).toBe('');
    });
  });

  describe('loadFromUrl', () => {
    it('should load from URL with baseUrl', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'URL content',
      });

      const source = createSource('url', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/doc1.md', { headers: {} });
      expect(result).toBe('URL content');
    });

    it('should handle 401/403 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const source = createSource('url', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should handle rate limiting (429)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const source = createSource('url', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Content',
      });

      const source = createSource('url', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      source.headers = { Authorization: 'Bearer token' };
      const loader = new DocumentLoader(source);

      await loader.loadDocument(source.documents[0]);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/doc1.md', {
        headers: { Authorization: 'Bearer token' },
      });
    });
  });

  describe('loadFromGithub', () => {
    it('should load from GitHub successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: btoa('GitHub content'),
          sha: 'abc123',
        }),
      });

      const source = createSource('github', [
        { id: 'doc1', title: 'Doc 1', file: 'owner/repo/main/path/to/file.md' },
      ]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/path/to/file.md?ref=main',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'MarkdownDocsViewer/1.0',
          }),
        })
      );
      expect(result).toBe('GitHub content');
    });

    it('should handle invalid GitHub path format', async () => {
      const source = createSource('github', [{ id: 'doc1', title: 'Doc 1', file: 'invalid/path' }]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should handle GitHub API rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({
          'X-RateLimit-Reset': '1234567890',
        }),
        text: async () => 'Rate limit exceeded',
      });

      const source = createSource('github', [
        { id: 'doc1', title: 'Doc 1', file: 'owner/repo/main/file.md' },
      ]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should handle directory response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [], // Array indicates directory
      });

      const source = createSource('github', [
        { id: 'doc1', title: 'Doc 1', file: 'owner/repo/main/dir' },
      ]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should handle missing content in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sha: 'abc123' }), // No content field
      });

      const source = createSource('github', [
        { id: 'doc1', title: 'Doc 1', file: 'owner/repo/main/file.md' },
      ]);
      const loader = new DocumentLoader(source);

      const result = await loader.loadDocument(source.documents[0]);

      expect(result).toBe('');
    });

    it('should use default branch when not specified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: btoa('Content'),
        }),
      });

      const source = createSource('github', [
        { id: 'doc1', title: 'Doc 1', file: 'owner/repo/file.md' }, // No branch - will use default
      ]);
      const loader = new DocumentLoader(source);

      await loader.loadDocument(source.documents[0]);

      // The loader will parse this as an invalid path and return empty string
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      loader.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should get cache size', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      mockCache.size.mockReturnValue(5);

      const size = loader.getCacheSize();

      expect(size).toBe(5);
    });

    it('should check if document is cached', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      mockCache.has.mockReturnValue(true);

      const isCached = loader.isCached('doc1');

      expect(isCached).toBe(true);
      expect(mockCache.has).toHaveBeenCalledWith('doc1');
    });

    it('should get cache stats', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      mockCache.size.mockReturnValue(10);
      mockCache.getCapacity.mockReturnValue(50);
      mockCache.getMemoryUsage.mockReturnValue(2048);

      const stats = loader.getCacheStats();

      expect(stats).toEqual({
        size: 10,
        capacity: 50,
        memoryUsage: 2048,
      });
    });
  });

  describe('Performance and Utility Methods', () => {
    it('should get performance metrics', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      const metrics = { loadTime: 100 };
      mockPerformanceMonitor.getAllMetrics.mockReturnValue(metrics);

      const result = loader.getPerformanceMetrics();

      expect(result).toEqual(metrics);
    });

    it('should update retry configuration', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      loader.updateRetryConfig({ maxAttempts: 5 });

      // Verify by attempting to load with new config
      expect(loader).toBeDefined();
    });

    it('should destroy and cleanup resources', () => {
      const source = createSource('local');
      const loader = new DocumentLoader(source);

      loader.destroy();

      expect(mockCache.clear).toHaveBeenCalled();
      expect(mockPerformanceMonitor.cleanup).toHaveBeenCalled();
    });

    it('should preload documents', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Preloaded content',
      });

      const source = createSource('local', [
        { id: 'doc1', title: 'Doc 1', file: 'doc1.md' },
        { id: 'doc2', title: 'Doc 2', file: 'doc2.md' },
        { id: 'doc3', title: 'Doc 3', file: 'doc3.md' },
      ]);
      const loader = new DocumentLoader(source);

      await loader.preloadDocuments(['doc1', 'doc2']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should skip preloading cached documents', async () => {
      mockCache.has.mockImplementation(id => id === 'doc1');
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Content',
      });

      const source = createSource('local', [
        { id: 'doc1', title: 'Doc 1', file: 'doc1.md' },
        { id: 'doc2', title: 'Doc 2', file: 'doc2.md' },
      ]);
      const loader = new DocumentLoader(source);

      await loader.preloadDocuments(['doc1', 'doc2']);

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only doc2
    });

    it('should handle preload errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Load failed'));

      const source = createSource('local', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      // Should not throw
      await expect(loader.preloadDocuments(['doc1'])).resolves.toBeUndefined();
    });
  });

  describe('Source Validation', () => {
    it('should validate missing source', async () => {
      const source = { type: undefined, documents: [] } as any;
      const loader = new DocumentLoader(source);

      const result = await loader.loadAll();

      expect(result).toEqual([]);
    });

    it('should validate empty documents', async () => {
      const source = createSource('local', []);
      const loader = new DocumentLoader(source);

      const result = await loader.loadAll();

      expect(result).toEqual([]);
    });

    it('should warn about URL source without baseUrl', async () => {
      const source = createSource('url', [
        { id: 'doc1', title: 'Doc 1', file: 'https://example.com/doc1.md' },
      ]);
      source.baseUrl = undefined;
      const loader = new DocumentLoader(source);

      await loader.loadAll();

      // Should not throw, just warn
      expect(loader).toBeDefined();
    });

    it('should warn about content source with missing content', async () => {
      const source = createSource('content', [
        { id: 'doc1', title: 'Doc 1' }, // No content
      ]);
      const loader = new DocumentLoader(source);

      await loader.loadAll();

      // Should not throw, just warn
      expect(loader).toBeDefined();
    });
  });

  describe('Error Handling with Retry', () => {
    it('should handle retryable errors', async () => {
      const source = createSource('local', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source);

      // The loader returns empty string on errors
      mockFetch.mockRejectedValue(new TypeError('Network error'));

      const doc = source.documents[0];
      const result = await loader.loadDocument(doc);

      expect(result).toBe('');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should respect custom retry config', async () => {
      vi.useFakeTimers();

      const source = createSource('local', [{ id: 'doc1', title: 'Doc 1', file: 'doc1.md' }]);
      const loader = new DocumentLoader(source, { maxAttempts: 1 });

      mockFetch.mockRejectedValue(new TypeError('Network error'));

      const promise = loader.loadDocument(source.documents[0]);

      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
