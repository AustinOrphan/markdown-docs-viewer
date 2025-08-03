/**
 * Configuration loading and management system
 * Handles loading config from files, merging with defaults, and validation
 * 
 * Week 3 Production Enhancement:
 * - Smart Config Discovery integration for optimal performance
 * - Request pooling and caching for reduced network overhead
 * - Feature flag controls for gradual rollout
 * - 100% backward compatibility maintained
 */

import { DocumentationConfig } from './types';

// Week 3 Production Integration: Smart optimization imports
import { getGlobalSmartConfigDiscovery } from './optimization/algorithms/smart-config-discovery';
import { FeatureFlags } from './optimization/foundation/FeatureFlags';
import { getGlobalPerformanceMonitor } from './optimization/foundation/PerformanceMonitor';
import { configCache } from './optimization/foundation/DiscoveryCache';

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
   * Week 3 Enhancement: Uses Smart Config Discovery when available for optimal performance
   */
  async loadConfig(configPath?: string): Promise<DocsConfig> {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const configMeasure = performanceMonitor.startMeasure('config-loader-load');
    
    try {
      // Check if Smart Config Discovery is enabled for optimized loading
      if (FeatureFlags.isEnabled('SMART_CONFIG_DISCOVERY')) {
        console.log('🔍 ConfigLoader: Using Smart Config Discovery (optimized)...');
        
        try {
          const result = await this.loadConfigOptimized(configPath);
          if (result) {
            performanceMonitor.endMeasure('config-loader-load');
            console.log('✅ ConfigLoader: Smart discovery successful');
            return result;
          }
        } catch (error) {
          console.warn('⚠️ ConfigLoader: Smart discovery failed, falling back to traditional method:', error);
          FeatureFlags.disable('SMART_CONFIG_DISCOVERY'); // Temporarily disable to prevent cascade failures
        }
      }

      // Fallback to traditional config loading (maintains backward compatibility)
      console.log('📋 ConfigLoader: Using traditional config loading...');
      
      if (configPath) {
        // Load specific config file
        await this.loadConfigFile(configPath);
      } else {
        // Auto-discover config file
        await this.autoDiscoverConfig();
      }

      // Validate and normalize config
      this.validateConfig();
      
      performanceMonitor.endMeasure('config-loader-load');
      return this.config;
      
    } catch (error) {
      performanceMonitor.endMeasure('config-loader-load');
      console.warn('ConfigLoader failed:', error);
      
      // Return safe defaults if all loading methods fail
      this.config = { ...DEFAULT_CONFIG };
      this.validateConfig();
      return this.config;
    }
  }

  /**
   * Week 3 Production Enhancement: Optimized Configuration Loading
   * Uses Smart Config Discovery for improved performance and caching
   */
  private async loadConfigOptimized(configPath?: string): Promise<DocsConfig | null> {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const optimizedMeasure = performanceMonitor.startMeasure('config-loader-optimized');
    
    try {
      // 1. Check cache first
      const cacheKey = `config-loader:${configPath || 'auto-discovery'}`;
      const cached = configCache.get(cacheKey);
      if (cached) {
        console.log('✅ ConfigLoader: Using cached configuration');
        performanceMonitor.endMeasure('config-loader-optimized');
        this.config = cached as DocsConfig;
        return this.config;
      }

      // 2. Use Smart Config Discovery for optimized loading
      const smartDiscovery = getGlobalSmartConfigDiscovery();
      
      if (configPath) {
        // Specific config file requested
        const exists = await smartDiscovery.checkConfigExists(configPath);
        if (exists) {
          const results = await smartDiscovery.discoverConfigs([configPath]);
          const configResult = results[0];
          
          if (configResult?.config) {
            // Convert from smart discovery format to DocsConfig
            const docsConfig = this.convertSmartConfigToDocsConfig(configResult.config);
            this.config = this.mergeConfig(DEFAULT_CONFIG, docsConfig);
            this.configPath = configPath;
            
            // Cache the result
            configCache.set(cacheKey, this.config, 300000); // 5-minute cache
            
            performanceMonitor.endMeasure('config-loader-optimized');
            console.log(`✅ ConfigLoader: Smart discovery loaded config from ${configPath}`);
            return this.config;
          }
        }
      } else {
        // Auto-discover config files using Smart Config Discovery
        const results = await smartDiscovery.discoverConfigs();
        const configResult = results.find(r => r.exists && r.config);
        
        if (configResult?.config) {
          // Convert and merge configuration
          const docsConfig = this.convertSmartConfigToDocsConfig(configResult.config);
          this.config = this.mergeConfig(DEFAULT_CONFIG, docsConfig);
          this.configPath = configResult.path;
          
          // Cache the result
          configCache.set(cacheKey, this.config, 300000); // 5-minute cache
          
          performanceMonitor.endMeasure('config-loader-optimized');
          console.log(`✅ ConfigLoader: Smart discovery found config in ${configResult.path}`);
          return this.config;
        }
      }
      
      // No configuration found via smart discovery
      performanceMonitor.endMeasure('config-loader-optimized');
      return null;
      
    } catch (error) {
      performanceMonitor.endMeasure('config-loader-optimized');
      console.error('Smart config loading failed:', error);
      throw error;
    }
  }

  /**
   * Converts Smart Config Discovery result to DocsConfig format
   * Handles format differences between optimization system and legacy config
   */
  private convertSmartConfigToDocsConfig(smartConfig: any): DocsConfig {
    // Smart Config Discovery returns standardized format, convert to DocsConfig
    return {
      title: smartConfig.title || smartConfig.name,
      theme: smartConfig.theme,
      source: {
        path: smartConfig.source?.path || smartConfig.source?.basePath,
        type: smartConfig.source?.type,
        exclude: smartConfig.source?.exclude,
        include: smartConfig.source?.include,
      },
      navigation: smartConfig.navigation,
      search: smartConfig.search,
      branding: smartConfig.branding,
      features: smartConfig.features,
      performance: smartConfig.performance,
    };
  }

  /**
   * Auto-discovers configuration file
   * Enhanced with request optimization and caching for better performance
   */
  private async autoDiscoverConfig(): Promise<void> {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const discoveryMeasure = performanceMonitor.startMeasure('config-auto-discovery');
    
    try {
      // Check cache first
      const cacheKey = 'config-auto-discovery-result';
      const cached = configCache.get(cacheKey);
      if (cached) {
        const cachedResult = cached as { path?: string; config?: DocsConfig };
        if (cachedResult.path && cachedResult.config) {
          this.configPath = cachedResult.path;
          this.config = cachedResult.config;
          console.log(`📋 Using cached config from: ${cachedResult.path}`);
          performanceMonitor.endMeasure('config-auto-discovery');
          return;
        }
      }

      // Traditional file discovery with enhanced error handling
      for (const filename of CONFIG_FILES) {
        try {
          const response = await fetch(filename, { method: 'HEAD' });
          if (response && response.ok) {
            await this.loadConfigFile(filename);
            this.configPath = filename;
            
            // Cache the successful result
            configCache.set(cacheKey, { path: filename, config: this.config }, 180000); // 3-minute cache
            
            console.log(`📋 Loaded config from: ${filename}`);
            performanceMonitor.endMeasure('config-auto-discovery');
            return;
          }
        } catch (error) {
          // File doesn't exist or error occurred, continue searching
          console.debug(`Config file ${filename} not found or inaccessible:`, error);
        }
      }

      console.log('📋 No config file found, using defaults');
      
      // Cache the "no config found" result to avoid repeated requests
      configCache.set(cacheKey, { path: undefined, config: undefined }, 60000); // 1-minute cache for "not found"
      
      performanceMonitor.endMeasure('config-auto-discovery');
      
    } catch (error) {
      performanceMonitor.endMeasure('config-auto-discovery');
      console.warn('Auto-discovery failed:', error);
    }
  }

  /**
   * Loads configuration from a specific file
   * Enhanced with caching and improved error handling
   */
  private async loadConfigFile(path: string): Promise<void> {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const fileMeasure = performanceMonitor.startMeasure('config-file-load');
    
    try {
      // Check cache first
      const cacheKey = `config-file:${path}`;
      const cached = configCache.get(cacheKey);
      if (cached) {
        this.config = cached as DocsConfig;
        console.log(`📋 Using cached config from: ${path}`);
        performanceMonitor.endMeasure('config-file-load');
        return;
      }

      const response = await fetch(path);
      if (!response || !response.ok) {
        throw new Error(
          `Failed to load config: ${response?.status || 'Network error'} ${response?.statusText || 'No response'}`
        );
      }

      const userConfig = await response.json();
      this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
      
      // Cache the successful result
      configCache.set(cacheKey, this.config, 300000); // 5-minute cache
      
      performanceMonitor.endMeasure('config-file-load');
      
    } catch (error) {
      performanceMonitor.endMeasure('config-file-load');
      console.warn(`Failed to load config from ${path}:`, error);
      console.log('Using default configuration');
      
      // Don't cache failures - they should be retried
      throw error;
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
 * Enhanced with optimized loading when available
 */
export async function loadConfig(configPath?: string): Promise<DocsConfig> {
  const loader = new ConfigLoader();
  return loader.loadConfig(configPath);
}

/**
 * Week 3 Production Enhancement: Optimized config loading function
 * Uses Smart Config Discovery when available, falls back gracefully
 */
export async function loadConfigOptimized(configPath?: string): Promise<DocsConfig> {
  const performanceMonitor = getGlobalPerformanceMonitor();
  const optimizedMeasure = performanceMonitor.startMeasure('loadConfigOptimized');
  
  try {
    if (FeatureFlags.isEnabled('SMART_CONFIG_DISCOVERY')) {
      console.log('🔍 Using optimized config loading...');
      
      try {
        const smartDiscovery = getGlobalSmartConfigDiscovery();
        
        if (configPath) {
          // Load specific config file via smart discovery
          const results = await smartDiscovery.discoverConfigs([configPath]);
          const configResult = results[0];
          
          if (configResult?.config) {
            performanceMonitor.endMeasure('loadConfigOptimized');
            console.log(`✅ Optimized config loaded from ${configPath}`);
            
            // Convert smart discovery result to DocsConfig format
            return {
              title: configResult.config.title || 'Documentation',
              theme: configResult.config.theme || 'default-light',
              source: configResult.config.source || { path: './docs', type: 'auto' },
              navigation: configResult.config.navigation || DEFAULT_CONFIG.navigation,
              search: configResult.config.search || DEFAULT_CONFIG.search,
              branding: configResult.config.branding || DEFAULT_CONFIG.branding,
              features: configResult.config.features || DEFAULT_CONFIG.features,
              performance: configResult.config.performance || DEFAULT_CONFIG.performance,
            };
          }
        } else {
          // Auto-discover config files
          const results = await smartDiscovery.discoverConfigs();
          const configResult = results.find(r => r.exists && r.config);
          
          if (configResult?.config) {
            performanceMonitor.endMeasure('loadConfigOptimized');
            console.log(`✅ Optimized config auto-discovered from ${configResult.path}`);
            
            // Convert smart discovery result to DocsConfig format
            return {
              title: configResult.config.title || 'Documentation',
              theme: configResult.config.theme || 'default-light',
              source: configResult.config.source || { path: './docs', type: 'auto' },
              navigation: configResult.config.navigation || DEFAULT_CONFIG.navigation,
              search: configResult.config.search || DEFAULT_CONFIG.search,
              branding: configResult.config.branding || DEFAULT_CONFIG.branding,
              features: configResult.config.features || DEFAULT_CONFIG.features,
              performance: configResult.config.performance || DEFAULT_CONFIG.performance,
            };
          }
        }
        
        console.log('⚠️ Smart discovery found no config, falling back to traditional method');
      } catch (error) {
        console.warn('⚠️ Smart config discovery failed, falling back to traditional method:', error);
        FeatureFlags.disable('SMART_CONFIG_DISCOVERY'); // Temporarily disable
      }
    }

    // Fallback to traditional loading
    console.log('📋 Using traditional config loading...');
    const loader = new ConfigLoader();
    const result = await loader.loadConfig(configPath);
    
    performanceMonitor.endMeasure('loadConfigOptimized');
    return result;
    
  } catch (error) {
    performanceMonitor.endMeasure('loadConfigOptimized');
    console.warn('All config loading methods failed:', error);
    
    // Return safe defaults
    return { ...DEFAULT_CONFIG };
  }
}
