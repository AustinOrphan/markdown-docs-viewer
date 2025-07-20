import { Document, DocumentSource } from './types';
import { 
  MarkdownDocsError, 
  ErrorFactory, 
  withRetry, 
  ErrorBoundary, 
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  ErrorLogger,
  ConsoleErrorLogger 
} from './errors';
import { PersistentCache, PerformanceMonitor, MemoryManager } from './performance';

export class DocumentLoader {
  private source: DocumentSource;
  private cache: PersistentCache;
  private retryConfig: RetryConfig;
  private errorBoundary: ErrorBoundary;
  private logger: ErrorLogger;
  private performanceMonitor: PerformanceMonitor;
  private memoryManager: MemoryManager;
  private loadingPromises: Map<string, Promise<string>> = new Map();

  constructor(
    source: DocumentSource, 
    retryConfig: Partial<RetryConfig> = {},
    logger?: ErrorLogger,
    cacheSize: number = 50
  ) {
    this.source = source;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.logger = logger || new ConsoleErrorLogger();
    this.errorBoundary = new ErrorBoundary((error) => this.logger.log(error));
    this.cache = new PersistentCache(cacheSize, `mdv-cache-${this.source.type}`);
    this.performanceMonitor = new PerformanceMonitor();
    this.memoryManager = MemoryManager.getInstance();
    
    // Add cleanup task for memory management
    this.memoryManager.addCleanupTask(() => {
      this.clearOldCacheEntries();
    });
  }

  async loadAll(): Promise<Document[]> {
    return this.errorBoundary.execute(
      async () => {
        this.logger.debug('Loading all documents', { sourceType: this.source.type });
        
        // Validate source configuration
        this.validateSource();
        
        return this.source.documents;
      },
      () => {
        this.logger.warn('Failed to load documents, returning empty array');
        return [];
      },
      { operation: 'loadAll' }
    );
  }

  async loadDocument(doc: Document): Promise<string> {
    return this.errorBoundary.execute(
      async () => {
        const endTiming = this.performanceMonitor.startTiming('document-load');
        
        try {
          // Check cache first
          if (this.cache.has(doc.id)) {
            this.logger.debug('Loading document from cache', { documentId: doc.id });
            const cached = this.cache.get(doc.id)!;
            endTiming();
            return cached;
          }

          // Check if already loading to prevent duplicate requests
          if (this.loadingPromises.has(doc.id)) {
            this.logger.debug('Document already loading, waiting for existing promise', { documentId: doc.id });
            const result = await this.loadingPromises.get(doc.id)!;
            endTiming();
            return result;
          }

          this.logger.debug('Loading document', { 
            documentId: doc.id, 
            hasContent: !!doc.content,
            hasFile: !!doc.file 
          });

          let content = '';
          
          // Create loading promise to prevent duplicates
          const loadingPromise = (async () => {
            if (doc.content) {
              // Content provided directly
              content = doc.content;
            } else if (doc.file) {
              // Load from file with retry logic
              content = await withRetry(
                () => this.loadFromSource(doc.file!),
                this.retryConfig
              );
            } else {
              throw ErrorFactory.documentNotFound(doc.id);
            }

            // Cache the loaded content
            this.cache.set(doc.id, content);
            this.logger.debug('Document loaded successfully', { 
              documentId: doc.id, 
              contentLength: content.length,
              cacheSize: this.cache.size() 
            });

            // Check memory usage after loading
            this.memoryManager.checkMemoryUsage();

            return content;
          })();
          
          this.loadingPromises.set(doc.id, loadingPromise);
          
          try {
            content = await loadingPromise;
            return content;
          } finally {
            this.loadingPromises.delete(doc.id);
            endTiming();
          }
        } catch (error) {
          endTiming();
          throw error;
        }
      },
      () => {
        this.logger.warn('Failed to load document, returning empty content', { documentId: doc.id });
        return '';
      },
      { operation: 'loadDocument', documentId: doc.id }
    );
  }

  private validateSource(): void {
    if (!this.source) {
      throw new MarkdownDocsError(
        'INVALID_SOURCE' as any,
        'Document source is not defined',
        'Invalid document source configuration.',
        'high' as any,
        false
      );
    }

    if (!this.source.documents || this.source.documents.length === 0) {
      throw new MarkdownDocsError(
        'INVALID_SOURCE' as any,
        'No documents defined in source',
        'No documents are configured to load.',
        'medium' as any,
        false
      );
    }

    // Validate source-specific requirements
    switch (this.source.type) {
      case 'local':
        // Local sources should have basePath for relative files
        break;
      case 'url':
        if (!this.source.baseUrl) {
          this.logger.warn('URL source without baseUrl may cause issues with relative paths');
        }
        break;
      case 'github':
        // GitHub sources don't require additional validation
        break;
      case 'content':
        // Content sources should have content in documents
        const missingContent = this.source.documents.filter(doc => !doc.content);
        if (missingContent.length > 0) {
          this.logger.warn('Content source has documents without content', {
            missingContentIds: missingContent.map(doc => doc.id)
          });
        }
        break;
      default:
        throw new MarkdownDocsError(
          'INVALID_SOURCE' as any,
          `Unknown source type: ${this.source.type}`,
          'Unsupported document source type.',
          'high' as any,
          false
        );
    }
  }

  private async loadFromSource(path: string): Promise<string> {
    this.logger.debug('Loading from source', { 
      path, 
      sourceType: this.source.type 
    });

    switch (this.source.type) {
      case 'local':
        return this.loadLocal(path);
      case 'url':
        return this.loadFromUrl(path);
      case 'github':
        return this.loadFromGithub(path);
      case 'content':
        // Content should be provided in doc.content
        throw new MarkdownDocsError(
          'DOCUMENT_LOAD_FAILED' as any,
          'Content source should not load from path',
          'Internal error: Content source attempted to load from file path.',
          'medium' as any,
          false
        );
      default:
        throw new MarkdownDocsError(
          'INVALID_SOURCE' as any,
          `Unknown source type: ${this.source.type}`,
          'Unsupported document source type.',
          'high' as any,
          false
        );
    }
  }

  private async loadLocal(path: string): Promise<string> {
    const fullPath = this.source.basePath ? `${this.source.basePath}/${path}` : path;
    
    this.logger.debug('Loading local file', { path, fullPath });

    try {
      const response = await fetch(fullPath);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw ErrorFactory.documentNotFound(path);
        }
        
        throw ErrorFactory.networkError(fullPath, response.status, response.statusText);
      }
      
      const content = await response.text();
      this.logger.debug('Local file loaded successfully', { 
        path, 
        contentLength: content.length 
      });
      
      return content;
    } catch (error) {
      if (error instanceof MarkdownDocsError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw ErrorFactory.networkError(fullPath);
      }

      throw new MarkdownDocsError(
        'FILE_READ_ERROR' as any,
        `Failed to load local file ${path}: ${error}`,
        'Unable to load the requested file. Please check if the file exists and is accessible.',
        'medium' as any,
        true,
        { 
          operation: 'loadLocal', 
          originalError: error,
          additionalData: { path, fullPath }
        }
      );
    }
  }

  private async loadFromUrl(path: string): Promise<string> {
    const url = this.source.baseUrl ? `${this.source.baseUrl}/${path}` : path;
    
    this.logger.debug('Loading from URL', { path, url });

    try {
      const response = await fetch(url, {
        headers: this.source.headers || {}
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw ErrorFactory.documentNotFound(path);
        }
        
        if (response.status === 403 || response.status === 401) {
          throw new MarkdownDocsError(
            'UNAUTHORIZED_ACCESS' as any,
            `Unauthorized access to ${url}: ${response.statusText}`,
            'Access denied. Please check your credentials or permissions.',
            'high' as any,
            false,
            { 
              operation: 'loadFromUrl',
              additionalData: { url, status: response.status }
            }
          );
        }

        if (response.status === 429) {
          throw new MarkdownDocsError(
            'RATE_LIMITED' as any,
            `Rate limited when accessing ${url}`,
            'Too many requests. Please wait and try again.',
            'medium' as any,
            true,
            { 
              operation: 'loadFromUrl',
              additionalData: { url, status: response.status }
            }
          );
        }
        
        throw ErrorFactory.networkError(url, response.status, response.statusText);
      }
      
      const content = await response.text();
      this.logger.debug('URL content loaded successfully', { 
        url, 
        contentLength: content.length 
      });
      
      return content;
    } catch (error) {
      if (error instanceof MarkdownDocsError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw ErrorFactory.networkError(url);
      }

      throw new MarkdownDocsError(
        'NETWORK_ERROR' as any,
        `Failed to load from URL ${url}: ${error}`,
        'Unable to load content from the specified URL. Please check your connection and try again.',
        'medium' as any,
        true,
        { 
          operation: 'loadFromUrl', 
          originalError: error,
          additionalData: { path, url }
        }
      );
    }
  }

  private async loadFromGithub(path: string): Promise<string> {
    // Parse GitHub URL format: owner/repo/branch/path/to/file
    const parts = path.split('/');
    if (parts.length < 3) {
      throw new MarkdownDocsError(
        'INVALID_CONFIG' as any,
        'Invalid GitHub path format. Expected: owner/repo/branch/path/to/file',
        'Invalid GitHub file path format.',
        'high' as any,
        false,
        { 
          operation: 'loadFromGithub',
          additionalData: { path, expectedFormat: 'owner/repo/branch/path/to/file' }
        }
      );
    }

    const [owner, repo, branch = 'main', ...filePath] = parts;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath.join('/')}?ref=${branch}`;

    this.logger.debug('Loading from GitHub', { 
      path, 
      owner, 
      repo, 
      branch, 
      filePath: filePath.join('/'),
      apiUrl 
    });

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MarkdownDocsViewer/1.0',
          ...(this.source.headers || {})
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw ErrorFactory.githubApiError(path, 404, 'File not found');
        }

        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          
          let message = 'GitHub API rate limit exceeded';
          if (rateLimitReset) {
            const resetTime = new Date(parseInt(rateLimitReset) * 1000);
            message += `. Rate limit resets at ${resetTime.toISOString()}`;
          }
          
          throw ErrorFactory.githubApiError(path, 403, message);
        }

        const errorText = await response.text().catch(() => 'Unknown error');
        throw ErrorFactory.githubApiError(path, response.status, errorText);
      }

      const data = await response.json();
      
      // Handle different response types
      if (Array.isArray(data)) {
        throw new MarkdownDocsError(
          'GITHUB_API_ERROR' as any,
          'GitHub path points to a directory, not a file',
          'The specified GitHub path is a directory. Please specify a file path.',
          'medium' as any,
          false,
          { 
            operation: 'loadFromGithub',
            additionalData: { path, responseType: 'directory' }
          }
        );
      }

      if (!data.content) {
        throw new MarkdownDocsError(
          'GITHUB_API_ERROR' as any,
          'No content found in GitHub response',
          'The requested GitHub file appears to be empty or inaccessible.',
          'medium' as any,
          false,
          { 
            operation: 'loadFromGithub',
            additionalData: { path, data }
          }
        );
      }
      
      // Decode base64 content
      const content = atob(data.content.replace(/\s/g, ''));
      
      this.logger.debug('GitHub content loaded successfully', { 
        path, 
        contentLength: content.length,
        sha: data.sha 
      });
      
      return content;
    } catch (error) {
      if (error instanceof MarkdownDocsError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw ErrorFactory.networkError(apiUrl);
      }

      throw new MarkdownDocsError(
        'GITHUB_API_ERROR' as any,
        `Failed to load from GitHub ${path}: ${error}`,
        'Unable to load content from GitHub. Please check the file path and try again.',
        'medium' as any,
        true,
        { 
          operation: 'loadFromGithub', 
          originalError: error,
          additionalData: { path, apiUrl, owner, repo, branch }
        }
      );
    }
  }

  clearCache(): void {
    this.logger.debug('Clearing document cache', { cacheSize: this.cache.size() });
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size();
  }

  isCached(docId: string): boolean {
    return this.cache.has(docId);
  }

  getCacheStats(): {
    size: number;
    capacity: number;
    memoryUsage: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size(),
      capacity: this.cache.getCapacity(),
      memoryUsage: this.cache.getMemoryUsage()
    };
  }

  getPerformanceMetrics(): Record<string, any> {
    return this.performanceMonitor.getAllMetrics();
  }

  private clearOldCacheEntries(): void {
    // This method is called by the memory manager when memory is low
    // The LRU cache will automatically evict old entries
    this.logger.debug('Memory cleanup triggered, cache will evict LRU entries as needed');
  }

  // Method to update retry configuration
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
    this.logger.debug('Updated retry configuration', { retryConfig: this.retryConfig });
  }

  // Cleanup method
  destroy(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.performanceMonitor.cleanup();
    this.logger.debug('DocumentLoader destroyed and cleaned up');
  }

  // Preload documents for better performance
  async preloadDocuments(docIds: string[]): Promise<void> {
    const endTiming = this.performanceMonitor.startTiming('preload-documents');
    
    try {
      const documentsToLoad = this.source.documents.filter(doc => 
        docIds.includes(doc.id) && !this.cache.has(doc.id)
      );

      if (documentsToLoad.length > 0) {
        this.logger.debug('Preloading documents', { 
          count: documentsToLoad.length,
          docIds 
        });

        // Load documents in parallel with concurrency limit
        const concurrencyLimit = 3;
        for (let i = 0; i < documentsToLoad.length; i += concurrencyLimit) {
          const batch = documentsToLoad.slice(i, i + concurrencyLimit);
          await Promise.allSettled(
            batch.map(doc => this.loadDocument(doc))
          );
        }
      }
    } finally {
      endTiming();
    }
  }
}