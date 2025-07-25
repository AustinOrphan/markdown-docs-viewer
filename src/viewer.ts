import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { DocumentationConfig, Document, ViewerState, Theme } from './types';
import { defaultTheme } from './themes';
import { generateStyles } from './styles';
import { createNavigation } from './navigation';
import { createSearch } from './search';
import { DocumentLoader } from './loader';
import { Router } from './router';
import {
  MarkdownDocsError,
  ErrorCode,
  ErrorSeverity,
  ErrorFactory,
  ErrorBoundary,
  ErrorLogger,
  ConsoleErrorLogger,
  DEFAULT_RETRY_CONFIG,
} from './errors';
import { announceToScreenReader } from './utils';
import {
  generateMobileCSS,
  addViewportMeta,
  isMobileViewport,
  getCurrentBreakpoint,
  BREAKPOINTS,
} from './mobile-styles';
import { ThemeManager } from './theme-manager';
import { ThemeSwitcher } from './theme-switcher';
import { DarkModeToggle } from './dark-mode-toggle';

// Swipe gesture constants
const SWIPE_THRESHOLD = 50;
const SWIPE_EDGE_THRESHOLD = 50;

export class MarkdownDocsViewer {
  private config: DocumentationConfig;
  private state: ViewerState;
  private container: HTMLElement;
  private loader: DocumentLoader;
  private router: Router | null = null;
  private styles: HTMLStyleElement | null = null;
  private errorBoundary: ErrorBoundary;
  private logger: ErrorLogger;
  private themeManager: ThemeManager;
  private themeSwitcher: ThemeSwitcher;
  private darkModeToggle: DarkModeToggle;

  constructor(config: DocumentationConfig) {
    try {
      // Initialize logger first
      const isDevelopment =
        typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
      this.logger = new ConsoleErrorLogger(isDevelopment);

      // Initialize error boundary
      this.errorBoundary = new ErrorBoundary(error => {
        this.handleError(error);
      });

      // Validate and set up configuration
      this.config = this.validateAndMergeConfig(config);

      // Validate required dependencies
      this.validateDependencies();

      // Initialize state
      this.state = {
        currentDocument: null,
        documents: [],
        searchQuery: '',
        searchResults: [],
        loading: false,
        error: null,
        sidebarOpen: false,
      };

      // Find and validate container
      this.container = this.validateContainer(config.container);

      // Initialize loader with error handling configuration
      const retryConfig = config.errorHandling?.retryConfig
        ? { ...DEFAULT_RETRY_CONFIG, ...config.errorHandling.retryConfig }
        : DEFAULT_RETRY_CONFIG;

      this.loader = new DocumentLoader(this.config.source, retryConfig, this.logger);

      // Initialize theme manager
      this.themeManager = new ThemeManager({
        enablePersistence: this.config.theme?.enablePersistence !== false,
        storageKey: this.config.theme?.storageKey || 'mdv-theme',
        onThemeChange: theme => {
          this.applyTheme(theme);
          if (this.config.onThemeChange) {
            this.config.onThemeChange(theme);
          }
        },
      });

      // Initialize theme switcher
      this.themeSwitcher = new ThemeSwitcher(this.themeManager, {
        position: this.config.theme?.switcherPosition || 'header',
        showPreview: this.config.theme?.showPreview !== false,
        showDescription: this.config.theme?.showDescription !== false,
        allowCustomThemes: this.config.theme?.allowCustomThemes !== false,
      });

      // Initialize dark mode toggle
      this.darkModeToggle = new DarkModeToggle(this.themeManager, {
        position: this.config.theme?.darkTogglePosition || 'header',
        showLabel: this.config.theme?.showDarkModeLabel !== false,
        compact: this.config.theme?.compactDarkToggle === true,
        onToggle: (isDark, theme) => {
          if (this.config.onThemeChange) {
            this.config.onThemeChange(theme);
          }
        },
      });

      // Initialize the viewer
      this.init();
    } catch (error) {
      // Handle initialization errors
      const wrappedError =
        error instanceof MarkdownDocsError
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

  private validateDependencies(): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check for marked
    if (typeof marked === 'undefined') {
      missing.push('marked - Markdown parser is required');
    }

    // Check for highlight.js (optional but recommended)
    if (typeof hljs === 'undefined') {
      warnings.push('highlight.js - Syntax highlighting will be disabled');
    } else {
      // Check if highlight.js has required methods
      if (typeof hljs.highlight !== 'function') {
        warnings.push('highlight.js.highlight - Some highlighting features may not work');
      }
      if (typeof hljs.highlightElement !== 'function') {
        warnings.push('highlight.js.highlightElement - Auto-highlighting will be disabled');
      }
    }

    // Check for markedHighlight (optional)
    if (typeof markedHighlight === 'undefined' && this.config?.render?.syntaxHighlighting) {
      warnings.push('marked-highlight - Advanced syntax highlighting will be disabled');
    }

    // Check browser environment
    if (typeof document === 'undefined') {
      missing.push('DOM environment - This library requires a browser environment');
    }
    if (typeof window === 'undefined') {
      missing.push('Window object - Browser environment is required');
    }

    // Log warnings
    warnings.forEach(warning => {
      this.logger.warn(`Optional dependency missing: ${warning}`);
    });

    // Throw error for critical missing dependencies
    if (missing.length > 0) {
      const error = new MarkdownDocsError(
        ErrorCode.MISSING_DEPENDENCY,
        `Missing required dependencies: ${missing.join(', ')}`,
        'Some required libraries are not available. Please ensure all dependencies are properly loaded.',
        ErrorSeverity.CRITICAL,
        false,
        {
          operation: 'validateDependencies',
          additionalData: { missingDependencies: missing, warnings },
        }
      );
      throw error;
    }

    this.logger.debug('Dependency validation completed', { warnings: warnings.length });
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
        showDescription: true,
      },
      render: {
        syntaxHighlighting: true,
        copyCodeButton: true,
        linkTarget: '_self',
      },
      errorHandling: {
        gracefulDegradation: true,
        showErrorDetails: false,
        enableErrorLogging: true,
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
          exponentialBackoff: true,
        },
      },
      responsive: true,
      mobile: {
        enabled: true,
        breakpoints: BREAKPOINTS,
        touchTargets: {
          minimum: 44,
          comfortable: 48,
          large: 56,
        },
        typography: {
          baseFontSize: {
            xs: 14,
            sm: 15,
            md: 16,
            lg: 16,
            xl: 16,
            xxl: 16,
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
          },
          scaleRatio: 1.2,
        },
        navigation: {
          swipeGestures: true,
          collapseBehavior: 'overlay',
          showBackdrop: true,
          closeOnOutsideClick: true,
        },
        gestures: {
          swipeToNavigate: true,
          pinchToZoom: false,
          doubleTapToZoom: false,
          swipeThreshold: SWIPE_THRESHOLD,
        },
        layout: {
          containerPadding: 16,
          contentSpacing: 24,
          borderRadius: 8,
        },
        performance: {
          enableTouchOptimizations: true,
          preventDefaultTouch: true,
          optimizeScrolling: true,
        },
      },
      routing: 'hash',
      ...config,
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

        // Apply initial theme
        const initialTheme = this.config.theme?.name
          ? this.themeManager.getTheme(this.config.theme.name) || this.config.theme
          : this.themeManager.getCurrentTheme();
        this.applyTheme(initialTheme);

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
          theme: this.config.theme?.name,
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
        // Check if highlighting dependencies are available
        if (typeof hljs !== 'undefined' && typeof markedHighlight !== 'undefined') {
          const logger = this.logger; // Capture logger reference for use in highlight function
          marked.use(
            markedHighlight({
              langPrefix: 'hljs language-',
              highlight(code, lang) {
                try {
                  if (
                    typeof hljs.getLanguage === 'function' &&
                    typeof hljs.highlight === 'function'
                  ) {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                  }
                  return code;
                } catch {
                  logger.warn('Syntax highlighting failed, falling back to plain text.');
                  // Fallback to plain text if highlighting fails
                  return code;
                }
              },
            })
          );
        } else {
          this.logger.warn('Syntax highlighting enabled but dependencies not available', {
            hljs: typeof hljs !== 'undefined',
            markedHighlight: typeof markedHighlight !== 'undefined',
          });
        }
      }

      marked.setOptions({
        gfm: true,
        breaks: true,
      });
    } catch (error) {
      this.logger.warn('Failed to configure markdown parser', { error });
      // Continue without syntax highlighting if configuration fails
    }
  }

  private applyTheme(theme: Theme): void {
    this.errorBoundary.execute(
      async () => {
        // Apply CSS variables through theme manager
        this.themeManager.applyCSSVariables(theme);

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

        // Add theme switcher styles
        cssContent += this.themeSwitcher.getStyles();

        // Add dark mode toggle styles
        cssContent += this.darkModeToggle.getStyles();

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
        this.router = new Router(this.config.routing!, docId => {
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
        this.container.innerHTML =
          '<div class="mdv-error">Failed to render viewer interface.</div>';
      },
      { operation: 'render' }
    );
  }

  private renderHeader(): string {
    const showThemeSwitcher = (this.config.theme?.switcherPosition || 'header') === 'header';
    const showDarkToggle = (this.config.theme?.darkTogglePosition || 'header') === 'header';

    const headerActions = [];
    if (showDarkToggle) {
      headerActions.push(this.darkModeToggle.render());
    }
    if (showThemeSwitcher) {
      headerActions.push(this.themeSwitcher.render());
    }

    return `
      <header class="mdv-header">
        <button class="mdv-mobile-toggle" aria-label="Toggle navigation"></button>
        ${this.config.logo ? `<img src="${this.config.logo}" alt="Logo" class="mdv-logo">` : ''}
        <h1 class="mdv-title">${this.config.title || 'Documentation'}</h1>
        ${headerActions.length > 0 ? `<div class="mdv-header-actions">${headerActions.join('')}</div>` : ''}
      </header>
    `;
  }

  private renderSidebar(): string {
    const navigation = createNavigation(
      this.state.documents,
      this.state.currentDocument,
      this.config.navigation!
    );

    const search = this.config.search?.enabled ? createSearch(this.config.search) : '';

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
          ${
            this.state.currentDocument.description
              ? `<p class="mdv-document-description">${this.state.currentDocument.description}</p>`
              : ''
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
        retryButton = '<button class="mdv-retry-button">Try Again</button>';
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
        html = html.replace(
          /<pre><code/g,
          '<div class="mdv-code-block"><button class="mdv-copy-button">Copy</button><pre><code'
        );
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

        // Theme switcher
        const themeSwitcherContainer = this.container.querySelector('.mdv-theme-switcher');
        if (themeSwitcherContainer) {
          this.themeSwitcher.attachTo(themeSwitcherContainer as HTMLElement);
        }

        // Dark mode toggle
        const darkModeToggleContainer = this.container.querySelector('.mdv-dark-mode-toggle');
        if (darkModeToggleContainer) {
          this.darkModeToggle.attachTo(darkModeToggleContainer as HTMLElement);
        }

        // Navigation links
        this.container.querySelectorAll('.mdv-nav-link').forEach(link => {
          link.addEventListener('click', e => {
            e.preventDefault();
            const docId = link.getAttribute('data-doc-id');
            if (docId) {
              this.loadDocument(docId).catch(error => {
                this.logger.error('Navigation click failed', { docId, error });
              });
            }
          });

          // Add keyboard navigation support
          link.addEventListener('keydown', e => {
            this.handleNavigationKeydown(e as KeyboardEvent, link as HTMLElement);
          });
        });

        // Setup collapsible category support
        this.container.querySelectorAll('.mdv-nav-category.collapsible').forEach(category => {
          // Click handler for button
          category.addEventListener('click', () => {
            this.toggleCategory(category as HTMLElement);
          });

          // Additional keyboard support
          category.addEventListener('keydown', e => {
            this.handleCategoryKeydown(e as KeyboardEvent, category as HTMLElement);
          });
        });

        // Search
        const searchInput = this.container.querySelector('.mdv-search-input') as HTMLInputElement;
        searchInput?.addEventListener('input', e => {
          try {
            this.handleSearch((e.target as HTMLInputElement).value);
          } catch (error) {
            this.logger.warn('Search input handling failed', { error });
          }
        });

        // Copy buttons
        this.container.querySelectorAll('.mdv-copy-button').forEach(button => {
          button.addEventListener('click', async e => {
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

        // Retry buttons
        this.container.querySelectorAll('.mdv-retry-button').forEach(button => {
          button.addEventListener('click', () => {
            window.location.reload();
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
    if (isMobileViewport() && document.body && document.body.style) {
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
    const threshold = this.config.mobile?.gestures?.swipeThreshold || SWIPE_THRESHOLD;

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
          if (deltaX > threshold && startX < SWIPE_EDGE_THRESHOLD && !this.state.sidebarOpen) {
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
      const htmlElement = element as HTMLElement;
      if (htmlElement && htmlElement.style) {
        htmlElement.style.touchAction = 'manipulation';
      }
    });

    // Optimize scrolling on mobile
    if (this.config.mobile?.performance?.optimizeScrolling) {
      const scrollElements = this.container.querySelectorAll('.mdv-navigation, .mdv-content');
      scrollElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement && htmlElement.style) {
          htmlElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
          htmlElement.style.overscrollBehavior = 'contain';
        }
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
    if (toggle && toggle.style) {
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
        if (isMobileViewport()) {
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

  private handleNavigationKeydown(e: KeyboardEvent, currentLink: HTMLElement): void {
    const allNavLinks = Array.from(
      this.container.querySelectorAll('.mdv-nav-link')
    ) as HTMLElement[];
    const currentIndex = allNavLinks.indexOf(currentLink);

    let targetIndex: number;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (currentIndex + 1) % allNavLinks.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = currentIndex === 0 ? allNavLinks.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = allNavLinks.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        currentLink.click();
        return;
      default:
        return;
    }

    if (targetIndex !== currentIndex && allNavLinks[targetIndex]) {
      allNavLinks[targetIndex].focus();

      // Announce navigation change for screen readers
      this.announceNavigationChange(allNavLinks[targetIndex]);
    }
  }

  private handleCategoryKeydown(e: KeyboardEvent, category: HTMLElement): void {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggleCategory(category);
        break;
      case 'ArrowDown': {
        e.preventDefault();
        // Focus first nav link in this category if expanded
        const sublist = category.nextElementSibling as HTMLElement;
        if (sublist && !sublist.hidden) {
          const firstLink = sublist.querySelector('.mdv-nav-link') as HTMLElement;
          firstLink?.focus();
        }
        break;
      }
    }
  }

  private toggleCategory(category: HTMLElement): void {
    const sublist = category.nextElementSibling as HTMLElement;
    const collapseIcon = category.querySelector('.mdv-collapse-icon') as HTMLElement;

    if (sublist) {
      const isExpanded = category.getAttribute('aria-expanded') === 'true';
      const newExpanded = !isExpanded;

      category.setAttribute('aria-expanded', newExpanded.toString());
      sublist.hidden = !newExpanded;

      if (collapseIcon) {
        collapseIcon.style.transform = newExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      }

      // Announce state change
      const announcement = `${category.textContent?.trim()} ${newExpanded ? 'expanded' : 'collapsed'}`;
      announceToScreenReader(announcement, 'mdv-nav-announcements');
    }
  }

  private announceNavigationChange(link: HTMLElement): void {
    const linkText = link.textContent?.trim() || '';
    announceToScreenReader(`Focused: ${linkText}`, 'mdv-nav-announcements');
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
            ...(doc.tags || []),
          ]
            .join(' ')
            .toLowerCase();

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
    // Check if state is initialized before accessing it
    if (this.state) {
      this.state.error = error;
      this.state.loading = false;
    }

    // Log the error if logger exists
    if (this.logger) {
      this.logger.log(error);
    } else {
      // Fallback to console if logger not initialized
      console.error('MarkdownDocsViewer Error:', error);
    }

    // Call user-provided error handler
    if (this.config?.onError) {
      try {
        this.config.onError(error);
      } catch (handlerError) {
        if (this.logger) {
          this.logger.error('Error in user error handler', { handlerError });
        } else {
          console.error('Error in user error handler:', handlerError);
        }
      }
    }

    // Only render if state and container exist
    if (this.state && this.container) {
      this.render();
    }
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

  public setTheme(theme: Theme | string): void {
    if (typeof theme === 'string') {
      const themeObj = this.themeManager.setTheme(theme);
      if (themeObj) {
        this.config.theme = themeObj;
      }
    } else {
      // For theme objects, still use ThemeManager for consistent state management
      if (theme.name && this.themeManager.getTheme(theme.name)) {
        this.themeManager.setTheme(theme.name);
      } else {
        // Create a temporary theme if not registered
        const tempThemeName = `temp-${Date.now()}`;
        this.themeManager.registerTheme({ ...theme, name: tempThemeName });
        this.themeManager.setTheme(tempThemeName);
      }
      this.config.theme = theme;
    }
  }

  public getAvailableThemes(): Theme[] {
    return this.themeManager.getAvailableThemes();
  }

  public registerTheme(theme: Theme): void {
    this.themeManager.registerTheme(theme as any);
  }

  public createCustomTheme(name: string, overrides: Partial<Theme>): Theme {
    return this.themeManager.createCustomTheme(name, overrides);
  }

  public getDocument(id: string): Document | null {
    return this.state.documents.find(doc => doc.id === id) || null;
  }

  public getAllDocuments(): Document[] {
    return [...this.state.documents];
  }

  public async search(query: string): Promise<Document[]> {
    return new Promise(resolve => {
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
