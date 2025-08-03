/**
 * Smart Config Discovery Algorithm
 * Reduces sequential config file checking from 4 requests to 1-2 parallel requests
 * Integrates with Agent B's environment adapters and Agent C's feature flags
 */

import { DocsConfig } from '../../config-loader';
import { DiscoveryCache } from '../foundation/DiscoveryCache';
import { PerformanceMonitor } from '../foundation/PerformanceMonitor';
import { RequestMonitor } from '../foundation/RequestMonitor';
import { BaseAdapter, RequestTransform } from '../adapters/base-adapter';
import { GitHubPagesAdapter } from '../adapters/github-pages-adapter';
import { EnvironmentUtils, EnvironmentInfo } from '../foundation/environment-utils';
import { FeatureFlags } from '../foundation/FeatureFlags';

/**
 * Config file discovery result
 */
export interface ConfigResult {
  path: string;
  exists: boolean;
  config?: DocsConfig;
  fromCache: boolean;
  responseTime: number;
  error?: Error;
}

/**
 * Config discovery options
 */
export interface ConfigDiscoveryOptions {
  enableParallelDiscovery?: boolean;
  enableCaching?: boolean;
  maxConcurrentRequests?: number;
  timeout?: number;
  useHeadRequests?: boolean;
  fallbackToDefaults?: boolean;
}

/**
 * Smart Config Discovery Algorithm
 * Implements intelligent parallel config discovery with caching and environment adaptation
 */
export class SmartConfigDiscovery {
  private readonly cache: DiscoveryCache<ConfigResult>;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly requestMonitor: RequestMonitor;
  private readonly adapter: BaseAdapter;
  private readonly environment: EnvironmentInfo;
  private readonly options: Required<ConfigDiscoveryOptions>;

  /**
   * Default config files in order of preference
   */
  private static readonly DEFAULT_CONFIG_FILES = [
    'docs-config.json',
    'docs.config.json', 
    '.docs.json',
    'markdown-docs.json'
  ];

  /**
   * Cache key for storing discovery results
   */
  private static readonly CACHE_KEY_PREFIX = 'smart-config-discovery';
  private static readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    cache: DiscoveryCache<ConfigResult>,
    performanceMonitor: PerformanceMonitor,
    requestMonitor: RequestMonitor,
    options: ConfigDiscoveryOptions = {}
  ) {
    this.cache = cache;
    this.performanceMonitor = performanceMonitor;
    this.requestMonitor = requestMonitor;
    this.environment = EnvironmentUtils.detectEnvironment();
    
    // Initialize environment-specific adapter
    this.adapter = this.createEnvironmentAdapter();
    
    this.options = {
      enableParallelDiscovery: true,
      enableCaching: true,
      maxConcurrentRequests: 4,
      timeout: 5000,
      useHeadRequests: true,
      fallbackToDefaults: true,
      ...options
    };
  }

  /**
   * Discover configuration files with smart parallel checking
   * Reduces 4 sequential requests to 1-2 parallel requests
   */
  async discoverConfigs(configFiles?: string[]): Promise<ConfigResult[]> {
    const measure = this.performanceMonitor.startMeasure('smart-config-discovery');
    
    try {
      // Check if feature is enabled
      if (!FeatureFlags.isEnabled('SMART_CONFIG_DISCOVERY')) {
        return this.fallbackToSequentialDiscovery(configFiles);
      }

      const filesToCheck = configFiles || SmartConfigDiscovery.DEFAULT_CONFIG_FILES;
      const cacheKey = this.getCacheKey(filesToCheck);

      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.performanceMonitor.endMeasure('smart-config-discovery');
          return cached.map(result => ({ ...result, fromCache: true }));
        }
      }

      // Perform parallel discovery
      const results = await this.performParallelDiscovery(filesToCheck);

      // Cache successful results
      if (this.options.enableCaching && results.length > 0) {
        this.cache.set(cacheKey, results, SmartConfigDiscovery.CACHE_TTL);
      }

      return results;

    } catch (error) {
      this.performanceMonitor.endMeasure('smart-config-discovery');
      
      if (this.options.fallbackToDefaults) {
        return this.fallbackToSequentialDiscovery(configFiles);
      }
      
      throw error;
    }
  }

  /**
   * Check if a specific config file exists (with caching)
   */
  async checkConfigExists(path: string): Promise<boolean> {
    const cacheKey = `${SmartConfigDiscovery.CACHE_KEY_PREFIX}:exists:${path}`;
    
    if (this.options.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached !== null) {
        return cached.exists;
      }
    }

    const measure = this.performanceMonitor.startMeasure(`config-exists-check:${path}`);
    
    try {
      // Use HEAD request with GET fallback via environment adapter
      const exists = await this.checkFileExistence(path);
      
      if (this.options.enableCaching) {
        const result: ConfigResult = {
          path,
          exists,
          fromCache: false,
          responseTime: this.performanceMonitor.endMeasure(`config-exists-check:${path}`).duration
        };
        this.cache.set(cacheKey, result, SmartConfigDiscovery.CACHE_TTL);
      }

      return exists;

    } catch (error) {
      this.performanceMonitor.endMeasure(`config-exists-check:${path}`);
      return false;
    }
  }

  /**
   * Get cached config result
   */
  getCachedConfig(key: string): ConfigResult | null {
    if (!this.options.enableCaching) {
      return null;
    }
    return this.cache.get(key);
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get discovery statistics
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      performance: this.performanceMonitor.getStats(),
      requests: this.requestMonitor.getStats(),
      environment: this.environment.type,
      options: this.options
    };
  }

  /**
   * Perform parallel discovery of config files
   */
  private async performParallelDiscovery(configFiles: string[]): Promise<ConfigResult[]> {
    const measure = this.performanceMonitor.startMeasure('parallel-config-discovery');
    
    try {
      // Create existence check promises for all files
      const existencePromises = configFiles.map(async (path) => {
        const fileStartTime = performance.now();
        
        try {
          const exists = await this.checkFileExistence(path);
          return {
            path,
            exists,
            fromCache: false,
            responseTime: performance.now() - fileStartTime
          };
        } catch (error) {
          return {
            path,
            exists: false,
            fromCache: false,
            responseTime: performance.now() - fileStartTime,
            error: error as Error
          };
        }
      });

      // Wait for all existence checks to complete
      const existenceResults = await Promise.all(existencePromises);
      
      // Find first existing config file
      const existingFile = existenceResults.find(result => result.exists);
      
      if (!existingFile) {
        this.performanceMonitor.endMeasure('parallel-config-discovery');
        return existenceResults;
      }

      // Load the first existing config file
      try {
        const config = await this.loadConfigFile(existingFile.path);
        existingFile.config = config;
      } catch (error) {
        existingFile.error = error as Error;
      }

      this.performanceMonitor.endMeasure('parallel-config-discovery');
      return existenceResults;

    } catch (error) {
      this.performanceMonitor.endMeasure('parallel-config-discovery');
      throw error;
    }
  }

  /**
   * Check if a file exists using HEAD request with GET fallback
   */
  private async checkFileExistence(path: string): Promise<boolean> {
    const requestStartTime = performance.now();
    
    try {
      // For environments that support HEAD requests, use adapter
      if (this.environment.capabilities?.supportsHeadRequests && this.options.useHeadRequests) {
        const requestOptions: RequestInit = {
          method: 'HEAD',
          signal: AbortSignal.timeout(this.options.timeout)
        };

        const response = await this.adapter.executeRequest(path, requestOptions);
        
        // RequestMonitor tracks automatically through monitored fetch

        return response.ok;
      } else {
        // Fallback to direct fetch for simpler environments
        const requestOptions: RequestInit = {
          method: this.options.useHeadRequests ? 'HEAD' : 'GET',
          signal: AbortSignal.timeout(this.options.timeout)
        };

        const monitoredFetch = this.requestMonitor.monitoredFetch.bind(this.requestMonitor);
        const response = await monitoredFetch(path, requestOptions);
        
        // RequestMonitor tracks automatically through monitored fetch

        return response.ok;
      }

    } catch (error) {
      // Failed requests are tracked automatically through fetch monitoring

      // If HEAD request failed and we're on GitHub Pages, this is expected
      if (this.environment.type === 'github_pages' && this.options.useHeadRequests) {
        console.log(`HEAD request failed for ${path}, this is normal on GitHub Pages`);
      }

      return false;
    }
  }

  /**
   * Load configuration from a specific file
   */
  private async loadConfigFile(path: string): Promise<DocsConfig> {
    const measure = this.performanceMonitor.startMeasure(`config-file-load:${path}`);
    const requestStartTime = performance.now();
    
    try {
      const monitoredFetch = this.requestMonitor.monitoredFetch.bind(this.requestMonitor);
      const response = await monitoredFetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }

      const config = await response.json();
      
      this.performanceMonitor.endMeasure(`config-file-load:${path}`);
      return config;

    } catch (error) {
      this.performanceMonitor.endMeasure(`config-file-load:${path}`);
      throw error;
    }
  }

  /**
   * Create environment-specific adapter
   */
  private createEnvironmentAdapter(): BaseAdapter {
    switch (this.environment.type) {
      case 'github_pages':
        return new GitHubPagesAdapter(this.environment, {
          enableHeadToGetTransform: true,
          maxContentLength: 1024
        });
      
      default:
        // For other environments, use a basic adapter wrapper
        return new (class extends BaseAdapter {
          async transformRequest(url: string, options?: RequestInit): Promise<RequestTransform> {
            return { url, options };
          }

          async handleFailedRequest(): Promise<RequestTransform | null> {
            return null;
          }

          getErrorSuggestions(error: Error, url: string): string[] {
            return this.getCommonSuggestions(error, url);
          }
        })(this.environment);
    }
  }

  /**
   * Fallback to sequential discovery when parallel fails
   */
  private async fallbackToSequentialDiscovery(configFiles?: string[]): Promise<ConfigResult[]> {
    const measure = this.performanceMonitor.startMeasure('sequential-config-discovery-fallback');
    const filesToCheck = configFiles || SmartConfigDiscovery.DEFAULT_CONFIG_FILES;
    const results: ConfigResult[] = [];

    try {
      for (const path of filesToCheck) {
        const fileStartTime = performance.now();
        
        try {
          const monitoredFetch = this.requestMonitor.monitoredFetch.bind(this.requestMonitor);
          const response = await monitoredFetch(path, { method: 'HEAD' });
          const exists = response.ok;
          
          const result: ConfigResult = {
            path,
            exists,
            fromCache: false,
            responseTime: performance.now() - fileStartTime
          };

          if (exists) {
            // Load the config file
            try {
              const monitoredFetch = this.requestMonitor.monitoredFetch.bind(this.requestMonitor);
              const configResponse = await monitoredFetch(path);
              result.config = await configResponse.json();
            } catch (error) {
              result.error = error as Error;
            }
          }

          results.push(result);

          // Stop at first successful config
          if (exists && result.config) {
            break;
          }

        } catch (error) {
          results.push({
            path,
            exists: false,
            fromCache: false,
            responseTime: performance.now() - fileStartTime,
            error: error as Error
          });
        }
      }

      this.performanceMonitor.endMeasure('sequential-config-discovery-fallback');
      return results;

    } catch (error) {
      this.performanceMonitor.endMeasure('sequential-config-discovery-fallback');
      throw error;
    }
  }

  /**
   * Generate cache key for config file list
   */
  private getCacheKey(configFiles: string[]): string {
    return `${SmartConfigDiscovery.CACHE_KEY_PREFIX}:${configFiles.join(',')}`;
  }
}

/**
 * Factory function to create SmartConfigDiscovery with foundation components
 */
export function createSmartConfigDiscovery(
  cache: DiscoveryCache<ConfigResult>,
  performanceMonitor: PerformanceMonitor,
  requestMonitor: RequestMonitor,
  options?: ConfigDiscoveryOptions
): SmartConfigDiscovery {
  return new SmartConfigDiscovery(cache, performanceMonitor, requestMonitor, options);
}

/**
 * Global instance for easy access
 */
let globalDiscovery: SmartConfigDiscovery | null = null;

/**
 * Get global SmartConfigDiscovery instance
 */
export function getGlobalSmartConfigDiscovery(): SmartConfigDiscovery {
  if (!globalDiscovery) {
    // Create a simple instance with default components
    globalDiscovery = new SmartConfigDiscovery(
      new DiscoveryCache<ConfigResult>({ maxEntries: 100, defaultTTL: 300000 }),
      new PerformanceMonitor(),
      new RequestMonitor()
    );
  }
  
  return globalDiscovery;
}

/**
 * Reset global instance
 */
export function resetGlobalSmartConfigDiscovery(): void {
  globalDiscovery = null;
}