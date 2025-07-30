export { MarkdownDocsViewer } from './viewer';
export * from './types';
export { themes, createCustomTheme } from './themes';
export { createViewer, quickStart } from './factory';

// Zero-config API for drop-in usage
export {
  init,
  getViewer,
  reload,
  setTheme,
  getAvailableThemes,
  generateConfig,
} from './zero-config';
export { default as ZeroConfig } from './zero-config';

// Configuration and auto-discovery
export { ConfigLoader, loadConfig, type DocsConfig } from './config-loader';
export { AutoDiscovery, autoDiscoverDocs, type AutoDiscoveryOptions } from './auto-discovery';
export {
  MarkdownDocsError,
  ErrorCode,
  ErrorSeverity,
  ErrorFactory,
  withRetry,
  ErrorBoundary,
  ConsoleErrorLogger,
} from './errors';
export {
  LRUCache,
  PersistentCache,
  SearchIndex,
  debounce,
  throttle,
  LazyLoader,
  MemoryManager,
  PerformanceMonitor,
} from './performance';
export { SearchManager } from './search';
export { ExportManager, createExportOptions } from './export';
export { I18nManager, createI18nConfig, defaultMessages, createLocaleMessages } from './i18n';
export { TableOfContents, addHeadingIds } from './toc';
export { AdvancedSearchManager } from './advanced-search';
export { generatePrintStyles, addPrintUtilities, generatePrintPreview } from './print-styles';
export { DarkModeToggle, type DarkModeToggleOptions } from './dark-mode-toggle';
export { ThemeBuilder, type ThemeBuilderOptions } from './theme-builder';
export { ThemeManager, type ThemePreset } from './theme-manager';
export { ThemeSwitcher, type ThemeSwitcherOptions } from './theme-switcher';
