/**
 * Configuration loading and management system
 * Handles loading config from files, merging with defaults, and validation
 */

import { DocumentationConfig } from './types';

export interface DocsConfig {
  title?: string;
  theme?: string;
  source?: {
    path?: string;
    type?: 'auto' | 'local' | 'url' | 'github' | 'content';
    exclude?: string[];
    include?: string[];
  };
  navigation?: {
    autoSort?: boolean;
    showCategories?: boolean;
    collapsible?: boolean;
    showTags?: boolean;
    showDescription?: boolean;
  };
  search?: {
    enabled?: boolean;
    placeholder?: string;
    fuzzySearch?: boolean;
    caseSensitive?: boolean;
  };
  branding?: {
    logo?: string;
    favicon?: string;
    footer?: string;
  };
  features?: {
    tableOfContents?: boolean;
    codeHighlighting?: boolean;
    darkMode?: boolean;
    print?: boolean;
    export?: boolean;
  };
  performance?: {
    lazyLoading?: boolean;
    cacheSize?: number;
    prefetchNext?: boolean;
  };
}

/**
 * Default configuration that works out of the box
 */
const DEFAULT_CONFIG: DocsConfig = {
  title: 'Documentation',
  theme: 'default-light',
  source: {
    path: './docs',
    type: 'auto',
    exclude: ['**/node_modules/**', '**/.*', '**/_*', '**/draft*'],
  },
  navigation: {
    autoSort: true,
    showCategories: true,
    collapsible: true,
    showTags: false,
    showDescription: true,
  },
  search: {
    enabled: true,
    placeholder: 'Search documentation...',
    fuzzySearch: true,
    caseSensitive: false,
  },
  branding: {
    footer: 'Generated with Markdown Docs Viewer',
  },
  features: {
    tableOfContents: true,
    codeHighlighting: true,
    darkMode: true,
    print: true,
    export: false,
  },
  performance: {
    lazyLoading: true,
    cacheSize: 50,
    prefetchNext: true,
  },
};

/**
 * Configuration file names to search for (in order of preference)
 */
const CONFIG_FILES = ['docs-config.json', 'docs.config.json', '.docs.json', 'markdown-docs.json'];

/**
 * Loads and manages configuration for the documentation viewer
 */
export class ConfigLoader {
  private config: DocsConfig;
  private configPath?: string;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Loads configuration from file or uses defaults
   */
  async loadConfig(configPath?: string): Promise<DocsConfig> {
    if (configPath) {
      // Load specific config file
      await this.loadConfigFile(configPath);
    } else {
      // Auto-discover config file
      await this.autoDiscoverConfig();
    }

    // Validate and normalize config
    this.validateConfig();

    return this.config;
  }

  /**
   * Auto-discovers configuration file
   */
  private async autoDiscoverConfig(): Promise<void> {
    for (const filename of CONFIG_FILES) {
      try {
        const response = await fetch(filename, { method: 'HEAD' });
        if (response.ok) {
          await this.loadConfigFile(filename);
          this.configPath = filename;
          console.log(`📋 Loaded config from: ${filename}`);
          return;
        }
      } catch {
        // File doesn't exist, continue searching
      }
    }

    console.log('📋 No config file found, using defaults');
  }

  /**
   * Loads configuration from a specific file
   */
  private async loadConfigFile(path: string): Promise<void> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }

      const userConfig = await response.json();
      this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch (error) {
      console.warn(`Failed to load config from ${path}:`, error);
      console.log('Using default configuration');
    }
  }

  /**
   * Deep merges user config with defaults
   */
  private mergeConfig(defaults: DocsConfig, userConfig: DocsConfig): DocsConfig {
    const merged = { ...defaults };

    for (const [key, value] of Object.entries(userConfig)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Deep merge objects
        merged[key as keyof DocsConfig] = {
          ...((defaults as any)[key] || {}),
          ...value,
        } as any;
      } else {
        // Direct assignment for primitives and arrays
        (merged as any)[key] = value;
      }
    }

    return merged;
  }

  /**
   * Validates configuration and applies fixes
   */
  private validateConfig(): void {
    // Ensure required fields exist
    if (!this.config.title) {
      this.config.title = 'Documentation';
    }

    if (!this.config.source?.path) {
      this.config.source = this.config.source || {};
      this.config.source.path = './docs';
    }

    // Normalize paths
    if (
      this.config.source.path &&
      !this.config.source.path.startsWith('./') &&
      !this.config.source.path.startsWith('/')
    ) {
      this.config.source.path = `./${this.config.source.path}`;
    }

    // Validate theme name
    if (this.config.theme && !this.config.theme.includes('-')) {
      this.config.theme = `${this.config.theme}-light`;
    }
  }

  /**
   * Converts DocsConfig to DocumentationConfig for the viewer
   */
  toDocumentationConfig(): Partial<DocumentationConfig> {
    const config = this.config;

    return {
      title: config.title,
      source: {
        type: config.source?.type === 'auto' ? 'local' : config.source?.type || 'local',
        basePath: config.source?.path || './docs',
        documents: [], // Will be populated by auto-discovery
      },
      theme: config.theme as any,
      navigation: {
        showCategories: config.navigation?.showCategories ?? true,
        collapsible: config.navigation?.collapsible ?? true,
        showTags: config.navigation?.showTags ?? false,
        showDescription: config.navigation?.showDescription ?? true,
        sortBy: config.navigation?.autoSort ? 'order' : 'title',
      },
      search: {
        enabled: config.search?.enabled ?? true,
        placeholder: config.search?.placeholder || 'Search documentation...',
        fuzzySearch: config.search?.fuzzySearch ?? true,
        caseSensitive: config.search?.caseSensitive ?? false,
      },
      performance: {
        lazyLoading: {
          enabled: config.performance?.lazyLoading ?? true,
        },
        cacheSize: config.performance?.cacheSize ?? 50,
        preloadStrategy: config.performance?.prefetchNext ? 'adjacent' : 'none',
      },
    };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): DocsConfig {
    return this.config;
  }

  /**
   * Gets the path to the loaded config file
   */
  getConfigPath(): string | undefined {
    return this.configPath;
  }

  /**
   * Generates a sample configuration file
   */
  static generateSampleConfig(): string {
    const sampleConfig: DocsConfig = {
      title: 'My Documentation',
      theme: 'github-light',
      source: {
        path: './docs',
        exclude: ['**/drafts/**', '**/_*'],
      },
      navigation: {
        autoSort: true,
        showCategories: true,
        collapsible: true,
      },
      search: {
        enabled: true,
        placeholder: 'Search docs...',
        fuzzySearch: true,
      },
      branding: {
        logo: './assets/logo.png',
        footer: 'Copyright © 2025 My Company',
      },
      features: {
        tableOfContents: true,
        codeHighlighting: true,
        darkMode: true,
        export: true,
      },
    };

    return JSON.stringify(sampleConfig, null, 2);
  }
}

/**
 * Quick helper function for zero-config setup
 */
export async function loadConfig(configPath?: string): Promise<DocsConfig> {
  const loader = new ConfigLoader();
  return loader.loadConfig(configPath);
}
