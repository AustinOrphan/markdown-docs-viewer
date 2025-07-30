export interface Document {
  id: string;
  title: string;
  file?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  order?: number;
}

export interface DocumentSource {
  type: 'local' | 'url' | 'github' | 'content';
  basePath?: string;
  baseUrl?: string;
  documents: Document[];
  headers?: Record<string, string>;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textPrimary: string;
    textLight: string;
    textSecondary: string;
    border: string;
    code: string;
    codeBackground: string;
    link: string;
    linkHover: string;
    error: string;
    warning: string;
    success: string;
  };
  fonts: {
    body: string;
    heading: string;
    code: string;
  };
  spacing: {
    unit: number;
    containerMaxWidth: string;
    sidebarWidth: string;
  };
  borderRadius: string;
  customCSS?: string;
  enablePersistence?: boolean;
  storageKey?: string;
  switcherPosition?: 'header' | 'footer' | 'sidebar' | 'floating';
  showPreview?: boolean;
  showDescription?: boolean;
  allowCustomThemes?: boolean;
  darkTogglePosition?: 'header' | 'footer' | 'floating';
  showDarkModeLabel?: boolean;
}

export interface SearchOptions {
  enabled: boolean;
  placeholder?: string;
  caseSensitive?: boolean;
  fuzzySearch?: boolean;
  searchInTags?: boolean;
  maxResults?: number;
}

export interface NavigationOptions {
  showCategories: boolean;
  showTags: boolean;
  collapsible: boolean;
  showDescription: boolean;
  sortBy?: 'title' | 'order' | 'date';
}

export interface RenderOptions {
  syntaxHighlighting: boolean;
  highlightTheme?: string;
  copyCodeButton: boolean;
  linkTarget?: '_blank' | '_self';
  sanitizeHtml?: boolean;
  customRenderers?: Record<string, (content: string) => string>;
}

export interface ErrorHandlingOptions {
  retryConfig?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    exponentialBackoff?: boolean;
  };
  gracefulDegradation?: boolean;
  showErrorDetails?: boolean;
  enableErrorLogging?: boolean;
  customErrorMessages?: Record<string, string>;
}

export interface PerformanceOptions {
  cacheSize?: number;
  enablePersistentCache?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableMemoryManagement?: boolean;
  preloadStrategy?: 'none' | 'visible' | 'adjacent' | 'all';
  lazyLoading?: {
    enabled?: boolean;
    threshold?: number;
    rootMargin?: string;
  };
  searchOptions?: {
    debounceDelay?: number;
    indexUpdateThrottle?: number;
    cacheSearchResults?: boolean;
  };
}

export interface DocumentationConfig {
  container: string | HTMLElement;
  source: DocumentSource;
  theme?: Theme;
  search?: SearchOptions;
  navigation?: NavigationOptions;
  render?: RenderOptions;
  errorHandling?: ErrorHandlingOptions;
  performance?: PerformanceOptions;
  mobile?: MobileOptions;
  title?: string;
  logo?: string;
  footer?: string;
  onDocumentLoad?: (doc: Document) => void;
  onError?: (error: Error) => void;
  onPerformanceMetrics?: (metrics: Record<string, any>) => void;
  onThemeChange?: (theme: Theme) => void;
  responsive?: boolean;
  routing?: 'hash' | 'memory' | 'none';
}

export interface MobileOptions {
  enabled?: boolean;
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  touchTargets?: {
    minimum?: number;
    comfortable?: number;
    large?: number;
  };
  typography?: {
    baseFontSize?: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
      xxl?: number;
    };
    lineHeight?: {
      tight?: number;
      normal?: number;
      relaxed?: number;
    };
    scaleRatio?: number;
  };
  navigation?: {
    swipeGestures?: boolean;
    collapseBehavior?: 'overlay' | 'push' | 'reveal';
    showBackdrop?: boolean;
    closeOnOutsideClick?: boolean;
  };
  gestures?: {
    swipeToNavigate?: boolean;
    pinchToZoom?: boolean;
    doubleTapToZoom?: boolean;
    swipeThreshold?: number;
  };
  layout?: {
    containerPadding?: number;
    contentSpacing?: number;
    borderRadius?: number;
  };
  performance?: {
    enableTouchOptimizations?: boolean;
    preventDefaultTouch?: boolean;
    optimizeScrolling?: boolean;
  };
}

export interface ViewerState {
  currentDocument: Document | null;
  documents: Document[];
  searchQuery: string;
  searchResults: Document[];
  loading: boolean;
  error: Error | null;
  sidebarOpen: boolean;
  desktopSidebarCollapsed: boolean;
}

export type ExportFormat = 'pdf' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  documentIds?: string[];
  filename?: string;
  title?: string;
  includeTheme?: boolean;
  includeTOC?: boolean;
  embedAssets?: boolean;
  locale?: string;
  pdfOptions?: {
    format?: 'a4' | 'a3' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  };
}

export interface I18nConfig {
  locale: string;
  fallbackLocale?: string;
  messages: Record<string, I18nMessages>;
}

export interface I18nMessages {
  [key: string]: string | I18nMessages;
}

export interface AdvancedSearchOptions extends SearchOptions {
  filters?: {
    categories?: string[];
    tags?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
  };
  highlighting?: boolean;
  searchHistory?: boolean;
  maxHistoryItems?: number;
}

export interface TableOfContentsOptions {
  enabled?: boolean;
  maxDepth?: number;
  sticky?: boolean;
  scrollSpy?: boolean;
  collapsible?: boolean;
  position?: 'left' | 'right' | 'inline';
}

export function validateConfig(config: DocumentationConfig): void {
  // Validate container is provided
  if (!config.container) {
    throw new Error(
      'Container is required: Please provide either a CSS selector string (e.g., "#my-container") or an HTMLElement. ' +
        'The container is where the markdown viewer will be rendered.'
    );
  }

  // Validate container type and provide descriptive error messages
  if (typeof config.container === 'string') {
    // Validate CSS selector format
    if (config.container.trim() === '') {
      throw new Error(
        'Container selector cannot be empty: Please provide a valid CSS selector string (e.g., "#my-container", ".docs-viewer").'
      );
    }

    // Check if it's a valid CSS selector format (comprehensive validation)
    try {
      // Test if the selector is valid by attempting to use it with querySelector
      if (typeof document !== 'undefined') {
        document.querySelector(config.container);
      }
    } catch (error) {
      throw new Error(
        `Invalid CSS selector "${config.container}": Please provide a valid CSS selector. ` +
          'Common formats include "#id" for IDs, ".class" for classes, or "element" for element types. ' +
          `Original error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Check if element exists in DOM (only if we're in browser environment)
    if (typeof document !== 'undefined') {
      const element = document.querySelector(config.container);
      if (!element) {
        throw new Error(
          `Container element not found: No element matches the selector "${config.container}". ` +
            'Please ensure the element exists in the DOM before initializing the viewer. ' +
            'You may need to wait for the DOM to load or verify the selector is correct.'
        );
      }

      // Validate that the found element is suitable for content
      if (!(element instanceof HTMLElement)) {
        throw new Error(
          `Container element is not an HTMLElement: The element matching "${config.container}" is not a valid HTML element. ` +
            'Please ensure the selector targets an HTML element that can contain content.'
        );
      }
    }
  } else if (config.container) {
    // Validate HTMLElement
    if (typeof HTMLElement !== 'undefined' && !(config.container instanceof HTMLElement)) {
      throw new Error(
        'Container must be an HTMLElement: When providing an element object, it must be a valid HTMLElement instance. ' +
          'Use document.getElementById(), document.querySelector(), or create an element with document.createElement().'
      );
    }

    // Additional validation for HTMLElement
    if (config.container && typeof config.container === 'object') {
      // Check if it has basic HTMLElement properties
      if (!('tagName' in config.container) || !('appendChild' in config.container)) {
        throw new Error(
          'Container object is not a valid HTMLElement: The provided object does not have the required properties of an HTMLElement. ' +
            'Please provide a valid DOM element.'
        );
      }
    }
  }

  // Validate source is provided
  if (!config.source) {
    throw new Error(
      'Configuration Error: Source is required. Please provide a DocumentSource object with type and documents.'
    );
  }

  // Validate source type
  const validSourceTypes = ['local', 'url', 'github', 'content'];
  if (!validSourceTypes.includes(config.source.type)) {
    throw new Error(
      `Configuration Error: Invalid source type "${config.source.type}". Valid types are: ${validSourceTypes.join(', ')}.`
    );
  }

  // Validate documents array exists
  if (!Array.isArray(config.source.documents)) {
    throw new Error(
      'Configuration Error: Source documents must be an array. Please provide an array of Document objects.'
    );
  }

  // Validate documents array is not empty
  if (config.source.documents.length === 0) {
    throw new Error(
      'Configuration Error: Source documents array cannot be empty. Please provide at least one document.'
    );
  }

  // Validate each document in the array
  config.source.documents.forEach((doc, index) => {
    if (!doc || typeof doc !== 'object') {
      throw new Error(
        `Configuration Error: Document at index ${index} is invalid. Each document must be an object.`
      );
    }

    if (!doc.id || typeof doc.id !== 'string' || doc.id.trim() === '') {
      throw new Error(
        `Configuration Error: Document at index ${index} is missing a valid id. Each document must have a non-empty string id.`
      );
    }

    if (!doc.title || typeof doc.title !== 'string' || doc.title.trim() === '') {
      throw new Error(
        `Configuration Error: Document "${doc.id}" is missing a valid title. Each document must have a non-empty string title.`
      );
    }

    // For content type, either content or file must be provided
    if (config.source.type === 'content' && !doc.content) {
      throw new Error(
        `Configuration Error: Document "${doc.id}" of content source type must have content property.`
      );
    }

    // For non-content types, file must be provided
    if (config.source.type !== 'content' && !doc.file) {
      throw new Error(
        `Configuration Error: Document "${doc.id}" of ${config.source.type} source type must have file property.`
      );
    }
  });

  // Validate source-specific requirements
  if (config.source.type === 'local' && !config.source.basePath) {
    throw new Error('Configuration Error: Local source type requires basePath property.');
  }

  if (config.source.type === 'url' && !config.source.baseUrl) {
    throw new Error('Configuration Error: URL source type requires baseUrl property.');
  }

  if (config.source.type === 'github') {
    let hostname: string | undefined;
    try {
      hostname = new URL(config.source.baseUrl!).hostname;
    } catch (e) {
      hostname = undefined;
    }
    const allowedHosts = ['github.com', 'www.github.com'];
    if (!config.source.baseUrl || !hostname || !allowedHosts.includes(hostname)) {
      throw new Error(
        'Configuration Error: GitHub source type requires baseUrl property pointing to a GitHub repository.'
      );
    }
  }

  // Validate optional theme configuration
  if (config.theme) {
    validateThemeConfig(config.theme);
  }

  // Validate optional search configuration
  if (config.search) {
    validateSearchConfig(config.search);
  }

  // Validate optional navigation configuration
  if (config.navigation) {
    validateNavigationConfig(config.navigation);
  }

  // Validate optional render configuration
  if (config.render) {
    validateRenderConfig(config.render);
  }

  // Validate optional routing configuration
  if (config.routing) {
    const validRoutingTypes = ['hash', 'memory', 'none'];
    if (!validRoutingTypes.includes(config.routing)) {
      throw new Error(
        `Configuration Error: Invalid routing type "${config.routing}". Valid types are: ${validRoutingTypes.join(', ')}.`
      );
    }
  }
}

/**
 * Validates theme configuration
 */
function validateThemeConfig(theme: Theme): void {
  if (!theme.name || typeof theme.name !== 'string') {
    throw new Error('Configuration Error: Theme must have a valid name property.');
  }

  if (!theme.colors || typeof theme.colors !== 'object') {
    throw new Error('Configuration Error: Theme must have a colors object.');
  }

  if (!theme.fonts || typeof theme.fonts !== 'object') {
    throw new Error('Configuration Error: Theme must have a fonts object.');
  }

  if (!theme.spacing || typeof theme.spacing !== 'object') {
    throw new Error('Configuration Error: Theme must have a spacing object.');
  }

  // Validate required color properties
  const requiredColors = ['primary', 'background', 'text', 'textPrimary'];
  requiredColors.forEach(color => {
    if (!theme.colors[color as keyof typeof theme.colors]) {
      throw new Error(`Configuration Error: Theme colors must include ${color} property.`);
    }
  });

  // Validate required font properties
  const requiredFonts = ['body', 'heading', 'code'];
  requiredFonts.forEach(font => {
    if (!theme.fonts[font as keyof typeof theme.fonts]) {
      throw new Error(`Configuration Error: Theme fonts must include ${font} property.`);
    }
  });
}

/**
 * Validates search configuration
 */
function validateSearchConfig(search: SearchOptions): void {
  if (typeof search.enabled !== 'boolean') {
    throw new Error('Configuration Error: Search enabled property must be a boolean.');
  }

  if (
    search.maxResults !== undefined &&
    (typeof search.maxResults !== 'number' || search.maxResults <= 0)
  ) {
    throw new Error('Configuration Error: Search maxResults must be a positive number.');
  }
}

/**
 * Validates navigation configuration
 */
function validateNavigationConfig(navigation: NavigationOptions): void {
  if (typeof navigation.showCategories !== 'boolean') {
    throw new Error('Configuration Error: Navigation showCategories property must be a boolean.');
  }

  if (typeof navigation.showTags !== 'boolean') {
    throw new Error('Configuration Error: Navigation showTags property must be a boolean.');
  }

  if (typeof navigation.collapsible !== 'boolean') {
    throw new Error('Configuration Error: Navigation collapsible property must be a boolean.');
  }

  if (navigation.sortBy) {
    const validSortOptions = ['title', 'order', 'date'];
    if (!validSortOptions.includes(navigation.sortBy)) {
      throw new Error(
        `Configuration Error: Invalid navigation sortBy "${navigation.sortBy}". Valid options are: ${validSortOptions.join(', ')}.`
      );
    }
  }
}

/**
 * Validates render configuration
 */
function validateRenderConfig(render: RenderOptions): void {
  if (typeof render.syntaxHighlighting !== 'boolean') {
    throw new Error('Configuration Error: Render syntaxHighlighting property must be a boolean.');
  }

  if (typeof render.copyCodeButton !== 'boolean') {
    throw new Error('Configuration Error: Render copyCodeButton property must be a boolean.');
  }

  if (render.linkTarget) {
    const validTargets = ['_blank', '_self'];
    if (!validTargets.includes(render.linkTarget)) {
      throw new Error(
        `Configuration Error: Invalid render linkTarget "${render.linkTarget}". Valid options are: ${validTargets.join(', ')}.`
      );
    }
  }
}
