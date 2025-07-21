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