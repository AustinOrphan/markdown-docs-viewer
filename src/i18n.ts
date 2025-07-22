import { I18nConfig, I18nMessages } from './types';
import { ErrorCode, MarkdownDocsError, ErrorSeverity } from './errors';

/**
 * Internationalization manager for multi-language support
 */
export class I18nManager {
  private config: I18nConfig;
  private currentLocale: string;
  private messages: Record<string, I18nMessages>;
  private fallbackLocale: string;

  constructor(config: I18nConfig) {
    this.config = config;
    this.currentLocale = config.locale;
    this.messages = config.messages;
    this.fallbackLocale = config.fallbackLocale || 'en';

    this.validateConfig();
  }

  /**
   * Validate the i18n configuration
   */
  private validateConfig(): void {
    if (!this.messages[this.currentLocale]) {
      console.warn(
        `No messages found for locale "${this.currentLocale}", falling back to "${this.fallbackLocale}"`
      );
      if (!this.messages[this.fallbackLocale]) {
        throw new MarkdownDocsError(
          ErrorCode.INVALID_CONFIG,
          `No messages found for locale "${this.currentLocale}" or fallback locale "${this.fallbackLocale}"`,
          'No translation messages found for the specified locale or fallback locale.',
          ErrorSeverity.HIGH,
          false,
          {
            operation: 'validateI18nConfig',
            additionalData: { locale: this.currentLocale, fallbackLocale: this.fallbackLocale },
          }
        );
      }
    }
  }

  /**
   * Get a translated message
   */
  t(key: string, params?: Record<string, any>): string {
    const message = this.getMessage(key);

    if (!message) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }

    // Replace parameters in the message
    if (params) {
      return this.interpolate(message, params);
    }

    return message;
  }

  /**
   * Get a message from the messages object
   */
  private getMessage(key: string): string | undefined {
    const keys = key.split('.');
    let current: any = this.messages[this.currentLocale];

    // Try current locale first
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    // If not found, try fallback locale
    if (current === undefined && this.fallbackLocale !== this.currentLocale) {
      current = this.messages[this.fallbackLocale];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return undefined;
        }
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Interpolate parameters into a message
   */
  private interpolate(message: string, params: Record<string, any>): string {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Change the current locale
   */
  setLocale(locale: string): void {
    if (!this.messages[locale]) {
      throw new MarkdownDocsError(
        ErrorCode.INVALID_CONFIG,
        `No messages found for locale "${locale}"`,
        'The specified locale is not available.',
        ErrorSeverity.HIGH,
        false,
        { operation: 'setLocale', additionalData: { locale } }
      );
    }
    this.currentLocale = locale;
  }

  /**
   * Get the current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return Object.keys(this.messages);
  }

  /**
   * Check if a locale is available
   */
  hasLocale(locale: string): boolean {
    return locale in this.messages;
  }

  /**
   * Add messages for a new locale
   */
  addLocale(locale: string, messages: I18nMessages): void {
    this.messages[locale] = messages;
  }

  /**
   * Extend messages for an existing locale
   */
  extendLocale(locale: string, messages: I18nMessages): void {
    if (!this.messages[locale]) {
      this.messages[locale] = {};
    }
    this.messages[locale] = this.deepMerge(this.messages[locale], messages);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          output[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }

    return output;
  }
}

/**
 * Default English messages
 */
export const defaultMessages: I18nMessages = {
  app: {
    title: 'Documentation',
    loading: 'Loading documentation...',
    error: 'An error occurred',
    retry: 'Try Again',
    welcome: 'Welcome to the Documentation',
    selectDocument: 'Select a document from the sidebar to begin reading.',
  },
  navigation: {
    toggleMenu: 'Toggle navigation',
    search: 'Search',
    searchPlaceholder: 'Search documentation...',
    categories: 'Categories',
    tags: 'Tags',
    noResults: 'No results found',
  },
  document: {
    copyCode: 'Copy',
    codeCopied: 'Copied!',
    copyFailed: 'Copy failed',
    tableOfContents: 'Table of Contents',
    backToTop: 'Back to top',
  },
  export: {
    title: 'Export Documentation',
    format: 'Format',
    pdf: 'PDF',
    html: 'HTML',
    selectDocuments: 'Select documents to export',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    exportButton: 'Export',
    exporting: 'Exporting...',
    exportSuccess: 'Export completed successfully',
    exportError: 'Export failed',
    options: {
      includeTheme: 'Include theme styles',
      includeTOC: 'Include table of contents',
      embedAssets: 'Embed assets (images, etc.)',
    },
  },
  errors: {
    documentNotFound: 'Document not found',
    loadError: 'Failed to load document',
    networkError: 'Network error occurred',
    unknown: 'An unexpected error occurred',
  },
};

/**
 * Create an i18n configuration with default messages
 */
export function createI18nConfig(overrides: Partial<I18nConfig> = {}): I18nConfig {
  const messages = overrides.messages || {};

  // Ensure English messages exist
  if (!messages.en) {
    messages.en = defaultMessages;
  } else {
    // Merge with default messages
    messages.en = mergeMessages(defaultMessages, messages.en);
  }

  return {
    locale: 'en',
    fallbackLocale: 'en',
    ...overrides,
    messages,
  };
}

/**
 * Merge two message objects
 */
function mergeMessages(defaults: I18nMessages, custom: I18nMessages): I18nMessages {
  const result: I18nMessages = { ...defaults };

  for (const key in custom) {
    if (Object.prototype.hasOwnProperty.call(custom, key)) {
      const defaultValue = defaults[key];
      const customValue = custom[key];

      if (
        typeof customValue === 'object' &&
        typeof defaultValue === 'object' &&
        !Array.isArray(customValue) &&
        !Array.isArray(defaultValue)
      ) {
        result[key] = mergeMessages(defaultValue as I18nMessages, customValue as I18nMessages);
      } else {
        result[key] = customValue;
      }
    }
  }

  return result;
}

/**
 * Helper function to create locale-specific messages
 */
export function createLocaleMessages(
  locale: string,
  messages: I18nMessages
): Record<string, I18nMessages> {
  return {
    [locale]: messages,
  };
}
