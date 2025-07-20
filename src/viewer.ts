import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { 
  DocumentationConfig, 
  Document, 
  ViewerState, 
  Theme,
  DocumentSource 
} from './types';
import { defaultTheme } from './themes';
import { generateStyles } from './styles';
import { createNavigation } from './navigation';
import { createSearch } from './search';
import { DocumentLoader } from './loader';
import { Router } from './router';
import {
  MarkdownDocsError,
  ErrorFactory,
  ErrorBoundary,
  ErrorLogger,
  ConsoleErrorLogger,
  DEFAULT_RETRY_CONFIG
} from './errors';
import { 
  generateMobileCSS, 
  addViewportMeta, 
  isMobileViewport,
  getCurrentBreakpoint,
  BREAKPOINTS
} from './mobile-styles';

export class MarkdownDocsViewer {
  private config: DocumentationConfig;
  private state: ViewerState;
  private container: HTMLElement;
  private loader: DocumentLoader;
  private router: Router | null = null;
  private styles: HTMLStyleElement | null = null;
  private errorBoundary: ErrorBoundary;
  private logger: ErrorLogger;

  constructor(config: DocumentationConfig) {
    try {
      // Initialize logger first
      this.logger = new ConsoleErrorLogger(process?.env?.NODE_ENV === 'development');
      
      // Initialize error boundary
      this.errorBoundary = new ErrorBoundary((error) => {
        this.handleError(error);
      });

      // Validate and set up configuration
      this.config = this.validateAndMergeConfig(config);
      
      // Initialize state
      this.state = {
        currentDocument: null,
        documents: [],
        searchQuery: '',
        searchResults: [],
        loading: false,
        error: null,
        sidebarOpen: false
      };

      // Find and validate container
      this.container = this.validateContainer(config.container);

      // Initialize loader with error handling configuration
      const retryConfig = config.errorHandling?.retryConfig 
        ? { ...DEFAULT_RETRY_CONFIG, ...config.errorHandling.retryConfig }
        : DEFAULT_RETRY_CONFIG;
      
      this.loader = new DocumentLoader(this.config.source, retryConfig, this.logger);

      // Initialize the viewer
      this.init();
    } catch (error) {
      // Handle initialization errors
      const wrappedError = error instanceof MarkdownDocsError 
        ? error 
        : new MarkdownDocsError(
            'UNKNOWN_ERROR' as any,
            `Initialization failed: ${error}`,
            'Failed to initialize the documentation viewer. Please check your configuration.',
            'critical' as any,
            false,
            { operation: 'initialization', originalError: error }
          );
      
      this.handleError(wrappedError);
      throw wrappedError;
    }
  }

  private validateContainer(container: string | HTMLElement): HTMLElement {
    let element: HTMLElement | null;
    
    if (typeof container === 'string') {
      element = document.querySelector(container);
      if (!element) {
        throw ErrorFactory.containerNotFound(container);
      }
    } else {
      element = container;
    }

    if (!(element instanceof HTMLElement)) {
      throw new MarkdownDocsError(
        'INVALID_CONFIG' as any,
        'Container is not a valid HTML element',
        'The provided container is not a valid HTML element.',
        'high' as any,
        false,
        { operation: 'validateContainer' }
      );
    }

    return element;
  }

  private validateAndMergeConfig(config: DocumentationConfig): DocumentationConfig {
    // Validate required fields
    if (!config.container) {
      throw new MarkdownDocsError(
        'INVALID_CONFIG' as any,
        'Container is required',
        'Container element is required for initialization.',
        'critical' as any,
        false
      );
    }

    if (!config.source) {
      throw new MarkdownDocsError(
        'INVALID_CONFIG' as any,
        'Document source is required',
        'Document source configuration is required.',
        'critical' as any,
        false
      );
    }

    // Merge with defaults
    return {
      theme: defaultTheme,
      search: { enabled: true },
      navigation: { 
        showCategories: true, 
        showTags: false,
        collapsible: true,
        showDescription: true
      },
      render: {
        syntaxHighlighting: true,
        copyCodeButton: true,
        linkTarget: '_self'
      },
      errorHandling: {
        gracefulDegradation: true,
        showErrorDetails: false,
        enableErrorLogging: true,
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
          exponentialBackoff: true
        }
      },
      responsive: true,
      mobile: {
        enabled: true,
        breakpoints: BREAKPOINTS,
        touchTargets: {
          minimum: 44,
          comfortable: 48,
          large: 56
        },
        typography: {
          baseFontSize: {
            xs: 14,
            sm: 15,
            md: 16,
            lg: 16,
            xl: 16,
            xxl: 16
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          },
          scaleRatio: 1.2
        },
        navigation: {
          swipeGestures: true,
          collapseBehavior: 'overlay',
          showBackdrop: true,
          closeOnOutsideClick: true
        },
        gestures: {
          swipeToNavigate: true,
          pinchToZoom: false,
          doubleTapToZoom: false,
          swipeThreshold: 50
        },
        layout: {
          containerPadding: 16,
          contentSpacing: 24,
          borderRadius: 8
        },
        performance: {
          enableTouchOptimizations: true,
          preventDefaultTouch: true,
          optimizeScrolling: true
        }
      },
      routing: 'hash',
      ...config
    };
  }

  private async init(): Promise<void> {
    await this.errorBoundary.execute(
      async () => {
        this.state.loading = true;
        this.state.error = null;
        this.render(); // Show loading state
        
        // Configure marked with error handling
        this.configureMarked();
        
        // Apply theme with error handling
        this.applyTheme(this.config.theme!);
        
        // Load documents with error handling
        await this.loadDocuments();
        
        // Setup routing with error handling
        if (this.config.routing !== 'none') {
          this.setupRouting();
        }
        
        // Render UI
        this.render();
        
        // Load initial document
        await this.loadInitialDocument();
        
        this.state.loading = false;
        this.render();
        
        this.logger.debug('MarkdownDocsViewer initialized successfully', {
          documentCount: this.state.documents.length,
          hasRouter: !!this.router,
          theme: this.config.theme?.name
        });
      },
      () => {
        this.state.loading = false;
        this.render();
      },
      { operation: 'init' }
    );
  }

  private configureMarked(): void {
    try {
      if (this.config.render?.syntaxHighlighting) {
        marked.use(markedHighlight({
          langPrefix: 'hljs language-',
          highlight(code, lang) {
            try {
              const language = hljs.getLanguage(lang) ? lang : 'plaintext';
              return hljs.highlight(code, { language }).value;
            } catch (error) {
              // Fallback to plain text if highlighting fails
              return code;
            }
          }
        }));
      }

      marked.setOptions({
        gfm: true,
        breaks: true
      });
    } catch (error) {
      this.logger.warn('Failed to configure markdown parser', { error });
      // Continue without syntax highlighting if configuration fails
    }
  }

  private applyTheme(theme: Theme): void {
    this.errorBoundary.execute(
      async () => {
        // Remove existing styles
        if (this.styles) {
          this.styles.remove();
        }

        // Generate and apply new styles
        this.styles = document.createElement('style');
        let cssContent = generateStyles(theme, this.config);
        
        // Add mobile-responsive styles if enabled
        if (this.config.responsive && this.config.mobile?.enabled !== false) {
          cssContent += generateMobileCSS(this.config);
        }
        
        this.styles.textContent = cssContent;
        document.head.appendChild(this.styles);
        
        // Add viewport meta tag for mobile optimization
        if (this.config.mobile?.enabled !== false) {
          addViewportMeta();
        }
      },
      () => {
        this.logger.warn('Failed to apply theme, using default styles');
      },
      { operation: 'applyTheme', additionalData: { themeName: theme.name } }
    );
  }

  private async loadDocuments(): Promise<void> {
    await this.errorBoundary.execute(
      async () => {
        const documents = await this.loader.loadAll();
        this.state.documents = documents;
        
        if (documents.length === 0) {
          this.logger.warn('No documents loaded');
        }
      },
      () => {
        this.state.documents = [];
        this.logger.error('Failed to load documents, using empty document list');
      },
      { operation: 'loadDocuments' }
    );
  }

  private setupRouting(): void {
    this.errorBoundary.execute(
      async () => {
        this.router = new Router(this.config.routing!, (docId) => {
          this.loadDocument(docId).catch(error => {
            this.logger.error('Router-triggered document load failed', { docId, error });
          });
        });
      },
      () => {
        this.logger.warn('Failed to setup routing, navigation will work without URL updates');
      },
      { operation: 'setupRouting' }
    );
  }

  private async loadInitialDocument(): Promise<void> {
    await this.errorBoundary.execute(
      async () => {
        const initialDoc = this.router?.getCurrentRoute() || this.state.documents[0]?.id;
        if (initialDoc) {
          await this.loadDocument(initialDoc);
        }
      },
      () => {
        this.logger.debug('No initial document to load');
      },
      { operation: 'loadInitialDocument' }
    );
  }

  private render(): void {
    this.errorBoundary.execute(
      async () => {
        this.container.innerHTML = `
          <div class="mdv-app">
            ${this.renderHeader()}
            <div class="mdv-layout">
              ${this.renderSidebar()}
              ${this.renderContent()}
            </div>
            ${this.config.footer ? this.renderFooter() : ''}
          </div>
        `;

        this.attachEventListeners();
      },
      () => {
        this.container.innerHTML = '<div class="mdv-error">Failed to render viewer interface.</div>';
      },
      { operation: 'render' }
    );
  }

  private renderHeader(): string {
    return `
      <header class="mdv-header">
        <button class="mdv-mobile-toggle" aria-label="Toggle navigation">☰</button>
        ${this.config.logo ? `<img src="${this.config.logo}" alt="Logo" class="mdv-logo">` : ''}
        <h1 class="mdv-title">${this.config.title || 'Documentation'}</h1>
      </header>
    `;
  }

  private renderSidebar(): string {
    const navigation = createNavigation(
      this.state.documents,
      this.state.currentDocument,
      this.config.navigation!
    );

    const search = this.config.search?.enabled 
      ? createSearch(this.config.search)
      : '';

    return `
      <aside class="mdv-sidebar ${this.state.sidebarOpen ? 'open' : ''}">
        ${search}
        <nav class="mdv-navigation">
          ${navigation}
        </nav>
      </aside>
    `;
  }

  private renderContent(): string {
    if (this.state.loading) {
      return `
        <main class="mdv-content">
          <div class="mdv-loading">
            <div class="mdv-loading-spinner"></div>
            <p>Loading documentation...</p>
          </div>
        </main>
      `;
    }

    if (this.state.error) {
      return this.renderError(this.state.error);
    }

    if (!this.state.currentDocument) {
      return `
        <main class="mdv-content">
          <div class="mdv-welcome">
            <h2>Welcome to the Documentation</h2>
            <p>Select a document from the sidebar to begin reading.</p>
          </div>
        </main>
      `;
    }

    return `
      <main class="mdv-content">
        <article class="mdv-document">
          <h1 class="mdv-document-title">${this.state.currentDocument.title}</h1>
          ${this.state.currentDocument.description ? 
            `<p class="mdv-document-description">${this.state.currentDocument.description}</p>` : ''
          }
          <div class="mdv-document-content">
            ${this.renderMarkdown(this.state.currentDocument.content || '')}
          </div>
        </article>
      </main>
    `;
  }

  private renderError(error: Error): string {
    const isMarkdownError = error instanceof MarkdownDocsError;
    const showDetails = this.config.errorHandling?.showErrorDetails;
    
    let errorMessage = 'An unexpected error occurred.';
    let errorDetails = '';
    let retryButton = '';

    if (isMarkdownError) {
      errorMessage = error.userMessage;
      
      if (error.isRetryable) {
        retryButton = '<button class="mdv-retry-button" onclick="window.location.reload()">Try Again</button>';
      }
      
      if (showDetails) {
        errorDetails = `
          <details class="mdv-error-details">
            <summary>Error Details</summary>
            <pre><code>${JSON.stringify(error.toJSON(), null, 2)}</code></pre>
          </details>
        `;
      }
    } else {
      if (showDetails) {
        errorDetails = `
          <details class="mdv-error-details">
            <summary>Error Details</summary>
            <pre><code>${error.stack || error.message}</code></pre>
          </details>
        `;
      }
    }

    return `
      <main class="mdv-content">
        <div class="mdv-error">
          <div class="mdv-error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p class="mdv-error-message">${errorMessage}</p>
          ${retryButton}
          ${errorDetails}
        </div>
      </main>
    `;
  }

  private renderFooter(): string {
    return `<footer class="mdv-footer">${this.config.footer}</footer>`;
  }

  private renderMarkdown(content: string): string {
    try {
      let html = marked(content) as string;
      
      // Add copy buttons to code blocks if enabled
      if (this.config.render?.copyCodeButton) {
        html = html.replace(/<pre><code/g, '<div class="mdv-code-block"><button class="mdv-copy-button">Copy</button><pre><code');
        html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');
      }

      // Apply link target
      if (this.config.render?.linkTarget === '_blank') {
        html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
      }

      return html;
    } catch (error) {
      this.logger.error('Failed to render markdown, showing raw content', { error });
      return `<pre>${content}</pre>`;
    }
  }

  private attachEventListeners(): void {
    this.errorBoundary.execute(
      async () => {
        // Mobile toggle
        const toggle = this.container.querySelector('.mdv-mobile-toggle');
        toggle?.addEventListener('click', () => {
          this.state.sidebarOpen = !this.state.sidebarOpen;
          this.updateSidebar();
        });

        // Mobile touch gestures and interactions
        this.setupMobileInteractions();

        // Navigation links
        this.container.querySelectorAll('.mdv-nav-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const docId = link.getAttribute('data-doc-id');
            if (docId) {
              this.loadDocument(docId).catch(error => {
                this.logger.error('Navigation click failed', { docId, error });
              });
            }
          });
        });

        // Search
        const searchInput = this.container.querySelector('.mdv-search-input') as HTMLInputElement;
        searchInput?.addEventListener('input', (e) => {
          try {
            this.handleSearch((e.target as HTMLInputElement).value);
          } catch (error) {
            this.logger.warn('Search input handling failed', { error });
          }
        });

        // Copy buttons
        this.container.querySelectorAll('.mdv-copy-button').forEach(button => {
          button.addEventListener('click', async (e) => {
            try {
              const codeBlock = (e.target as HTMLElement).nextElementSibling?.querySelector('code');
              if (codeBlock && navigator.clipboard) {
                await navigator.clipboard.writeText(codeBlock.textContent || '');
                button.textContent = 'Copied!';
                setTimeout(() => {
                  button.textContent = 'Copy';
                }, 2000);
              }
            } catch (error) {
              this.logger.warn('Copy to clipboard failed', { error });
              button.textContent = 'Copy failed';
              setTimeout(() => {
                button.textContent = 'Copy';
              }, 2000);
            }
          });
        });
      },
      () => {
        this.logger.warn('Failed to attach some event listeners');
      },
      { operation: 'attachEventListeners' }
    );
  }

  private updateSidebar(): void {
    const sidebar = this.container.querySelector('.mdv-sidebar');
    const backdrop = this.container.querySelector('.mdv-sidebar-backdrop');
    
    if (sidebar) {
      sidebar.classList.toggle('open', this.state.sidebarOpen);
    }
    
    if (backdrop) {
      backdrop.classList.toggle('show', this.state.sidebarOpen);
    }
    
    // Update ARIA attributes for accessibility
    if (sidebar) {
      sidebar.setAttribute('aria-hidden', this.state.sidebarOpen ? 'false' : 'true');
    }
    
    // Prevent body scroll when sidebar is open on mobile
    if (isMobileViewport()) {
      document.body.style.overflow = this.state.sidebarOpen ? 'hidden' : '';
    }
  }

  private setupMobileInteractions(): void {
    if (!this.config.mobile?.enabled) return;

    this.errorBoundary.execute(
      async () => {
        // Add mobile backdrop for sidebar overlay
        this.setupSidebarBackdrop();
        
        // Setup swipe gestures if enabled
        if (this.config.mobile?.gestures?.swipeToNavigate) {
          this.setupSwipeGestures();
        }
        
        // Setup touch optimizations
        if (this.config.mobile?.performance?.enableTouchOptimizations) {
          this.setupTouchOptimizations();
        }
        
        // Handle window resize for responsive behavior
        this.setupResponsiveHandlers();
      },
      () => {
        this.logger.warn('Failed to setup mobile interactions');
      },
      { operation: 'setupMobileInteractions' }
    );
  }

  private setupSidebarBackdrop(): void {
    if (!this.config.mobile?.navigation?.showBackdrop) return;
    
    let backdrop = this.container.querySelector('.mdv-sidebar-backdrop') as HTMLElement;
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mdv-sidebar-backdrop';
      this.container.appendChild(backdrop);
    }
    
    // Close sidebar when clicking backdrop
    if (this.config.mobile.navigation?.closeOnOutsideClick) {
      backdrop.addEventListener('click', () => {
        this.state.sidebarOpen = false;
        this.updateSidebar();
      });
    }
  }

  private setupSwipeGestures(): void {
    let startX = 0;
    let startY = 0;
    let isSwipe = false;
    const threshold = this.config.mobile?.gestures?.swipeThreshold || 50;
    
    const sidebar = this.container.querySelector('.mdv-sidebar') as HTMLElement;
    const content = this.container.querySelector('.mdv-content') as HTMLElement;
    
    if (!sidebar || !content) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwipe = false;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isSwipe) {
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Check if this is a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          isSwipe = true;
          
          // Prevent default scroll if mobile optimizations are enabled
          if (this.config.mobile?.performance?.preventDefaultTouch) {
            e.preventDefault();
          }
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isSwipe && e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - startX;
        
        // Only trigger on mobile viewports
        if (isMobileViewport()) {
          // Swipe right to open sidebar (from left edge)
          if (deltaX > threshold && startX < 50 && !this.state.sidebarOpen) {
            this.state.sidebarOpen = true;
            this.updateSidebar();
          }
          // Swipe left to close sidebar
          else if (deltaX < -threshold && this.state.sidebarOpen) {
            this.state.sidebarOpen = false;
            this.updateSidebar();
          }
        }
      }
      
      isSwipe = false;
    };
    
    // Add touch event listeners
    content.addEventListener('touchstart', handleTouchStart, { passive: true });
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  private setupTouchOptimizations(): void {
    // Add touch-action CSS properties to key elements
    const elements = this.container.querySelectorAll(
      '.mdv-button, .mdv-nav-item, .mdv-mobile-toggle, .mdv-search-input, .mdv-toc-item'
    );
    
    elements.forEach(element => {
      (element as HTMLElement).style.touchAction = 'manipulation';
    });
    
    // Optimize scrolling on mobile
    if (this.config.mobile?.performance?.optimizeScrolling) {
      const scrollElements = this.container.querySelectorAll('.mdv-navigation, .mdv-content');
      scrollElements.forEach(element => {
        (element as HTMLElement).style.setProperty('-webkit-overflow-scrolling', 'touch');
        (element as HTMLElement).style.overscrollBehavior = 'contain';
      });
    }
  }

  private setupResponsiveHandlers(): void {
    // Handle window resize to update responsive behavior
    const handleResize = () => {
      const currentBreakpoint = getCurrentBreakpoint();
      
      // Auto-close sidebar on larger screens
      if (currentBreakpoint !== 'xs' && currentBreakpoint !== 'sm' && this.state.sidebarOpen) {
        this.state.sidebarOpen = false;
        this.updateSidebar();
      }
      
      // Update any responsive-dependent UI
      this.updateResponsiveUI();
    };
    
    // Throttle resize events for performance
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 150);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      // Small delay to allow orientation change to complete
      setTimeout(handleResize, 100);
    });
  }

  private updateResponsiveUI(): void {
    // Update any UI elements that depend on current screen size
    const currentBreakpoint = getCurrentBreakpoint();
    
    // Add breakpoint class to container for CSS targeting
    const container = this.container;
    
    // Remove existing breakpoint classes
    Object.keys(BREAKPOINTS).forEach(bp => {
      container.classList.remove(`mdv-breakpoint-${bp}`);
    });
    
    // Add current breakpoint class
    container.classList.add(`mdv-breakpoint-${currentBreakpoint}`);
    
    // Update mobile toggle visibility
    const toggle = container.querySelector('.mdv-mobile-toggle') as HTMLElement;
    if (toggle) {
      toggle.style.display = isMobileViewport() ? 'flex' : 'none';
    }
  }

  private async loadDocument(docId: string): Promise<void> {
    await this.errorBoundary.execute(
      async () => {
        const doc = this.state.documents.find(d => d.id === docId);
        if (!doc) {
          throw ErrorFactory.documentNotFound(docId);
        }

        this.state.loading = true;
        this.state.error = null;
        this.render();

        // Load content if not already loaded
        if (!doc.content && doc.file) {
          doc.content = await this.loader.loadDocument(doc);
        }

        this.state.currentDocument = doc;
        this.state.loading = false;
        
        if (this.router) {
          this.router.setRoute(docId);
        }

        if (this.config.onDocumentLoad) {
          this.config.onDocumentLoad(doc);
        }

        this.render();
        
        // Scroll to top
        this.container.querySelector('.mdv-content')?.scrollTo(0, 0);
        
        // Close mobile sidebar
        if (window.innerWidth <= 768) {
          this.state.sidebarOpen = false;
          this.updateSidebar();
        }

        this.logger.debug('Document loaded successfully', { docId });
      },
      () => {
        this.state.loading = false;
        this.render();
      },
      { operation: 'loadDocument', documentId: docId }
    );
  }

  private handleSearch(query: string): void {
    this.state.searchQuery = query;
    
    if (!query.trim()) {
      this.state.searchResults = [];
      this.render();
      return;
    }

    try {
      // Simple search implementation with error handling
      const results = this.state.documents.filter(doc => {
        try {
          const searchIn = [
            doc.title,
            doc.description || '',
            doc.content || '',
            ...(doc.tags || [])
          ].join(' ').toLowerCase();
          
          return searchIn.includes(query.toLowerCase());
        } catch (error) {
          this.logger.warn('Error during document search', { docId: doc.id, error });
          return false;
        }
      });

      this.state.searchResults = results.slice(0, this.config.search?.maxResults || 10);
      this.render();
    } catch (error) {
      this.logger.error('Search operation failed', { query, error });
      this.state.searchResults = [];
    }
  }

  private handleError(error: MarkdownDocsError): void {
    this.state.error = error;
    this.state.loading = false;
    
    // Log the error
    this.logger.log(error);
    
    // Call user-provided error handler
    if (this.config.onError) {
      try {
        this.config.onError(error);
      } catch (handlerError) {
        this.logger.error('Error in user error handler', { handlerError });
      }
    }
    
    this.render();
  }

  // Public API methods
  public async refresh(): Promise<void> {
    await this.errorBoundary.execute(
      async () => {
        this.loader.clearCache();
        await this.loadDocuments();
        this.render();
      },
      () => {
        this.logger.error('Failed to refresh documents');
      },
      { operation: 'refresh' }
    );
  }

  public setTheme(theme: Theme): void {
    this.config.theme = theme;
    this.applyTheme(theme);
  }

  public getDocument(id: string): Document | null {
    return this.state.documents.find(doc => doc.id === id) || null;
  }

  public getAllDocuments(): Document[] {
    return [...this.state.documents];
  }

  public async search(query: string): Promise<Document[]> {
    return new Promise((resolve) => {
      this.handleSearch(query);
      resolve([...this.state.searchResults]);
    });
  }

  public destroy(): void {
    try {
      if (this.styles) {
        this.styles.remove();
      }
      if (this.router) {
        this.router.destroy();
      }
      this.container.innerHTML = '';
      this.logger.debug('MarkdownDocsViewer destroyed');
    } catch (error) {
      this.logger.warn('Error during cleanup', { error });
    }
  }

  // Getters for current state and config (useful for debugging)
  public getState(): ViewerState {
    return { ...this.state };
  }

  public getConfig(): DocumentationConfig {
    return { ...this.config };
  }

  // Additional methods for export functionality
  public getDocuments(): Document[] {
    return [...this.state.documents];
  }

  public async getDocumentContent(doc: Document): Promise<string> {
    if (doc.content) {
      return doc.content;
    }
    
    if (doc.file) {
      const content = await this.loader.loadDocument(doc);
      doc.content = content;
      return content;
    }
    
    return '';
  }

  public getTheme(): Theme {
    return this.config.theme!;
  }

  public getThemeStyles(): string {
    return generateStyles(this.config.theme!, this.config);
  }
}