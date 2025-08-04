/**
 * Enhanced Discovery Adapters with Environment-Specific Optimizations
 * Extends base adapters with document discovery capabilities
 */

import { BaseAdapter, RequestTransform, AdapterConfig } from './base-adapter';
import { GitHubPagesAdapter, GitHubPagesConfig } from './github-pages-adapter';
import { NetlifyAdapter, NetlifyConfig } from './netlify-adapter';
import { EnvironmentInfo, HostingEnvironment } from '../foundation/environment-utils';

/**
 * Discovery strategy interface for environment-specific optimizations
 */
export interface DiscoveryStrategy {
  type: 'api-based' | 'manifest-based' | 'probe-based' | 'hybrid';
  priority: number;
  capabilities: DiscoveryCapability[];
}

/**
 * Discovery capabilities that environments may support
 */
export enum DiscoveryCapability {
  DIRECTORY_LISTING = 'directory_listing',
  API_ACCESS = 'api_access',
  MANIFEST_FILES = 'manifest_files',
  BUILD_TIME_OPTIMIZATION = 'build_time_optimization',
  HEAD_REQUEST_SUPPORT = 'head_request_support',
  BATCH_REQUESTS = 'batch_requests'
}

/**
 * Discovery request for optimization
 */
export interface DiscoveryRequest {
  basePath: string;
  patterns: string[];
  maxDepth?: number;
  excludePatterns?: string[];
}

/**
 * Optimized discovery request
 */
export interface OptimizedDiscoveryRequest extends DiscoveryRequest {
  strategy: DiscoveryStrategy;
  platformHints?: PlatformHint[];
  batchSize?: number;
}

/**
 * Platform-specific hints extracted from environment
 */
export interface PlatformHint {
  type: 'config_file' | 'manifest' | 'api_endpoint' | 'directory_structure';
  content: any;
  confidence: number;
  source: string;
}

/**
 * Structure hints from platform files
 */
export interface StructureHint {
  suggestedPaths: string[];
  excludePatterns: string[];
  knownStructure?: 'jekyll' | 'gatsby' | 'vuepress' | 'gitbook' | 'mdbook' | 'docusaurus';
  confidence: number;
}

/**
 * Enhanced GitHub Pages adapter with discovery optimizations
 */
export class EnhancedGitHubPagesAdapter extends GitHubPagesAdapter {
  private apiCache = new Map<string, any>();
  private configCache = new Map<string, any>();

  constructor(environment: EnvironmentInfo, config: GitHubPagesConfig = {}) {
    super(environment, {
      enableHeadToGetTransform: true,
      enableRangeHeaders: true,
      enableGitHubApiOptimization: true,
      ...config
    });
  }

  /**
   * Get optimal discovery strategy for GitHub Pages
   */
  getOptimalDiscoveryStrategy(): DiscoveryStrategy {
    const hasApiAccess = this.canUseGitHubApi();
    const isJekyllSite = this.isJekyllSite();

    if (hasApiAccess) {
      return {
        type: 'api-based',
        priority: 1,
        capabilities: [
          DiscoveryCapability.API_ACCESS,
          DiscoveryCapability.DIRECTORY_LISTING,
          DiscoveryCapability.BATCH_REQUESTS
        ]
      };
    }

    if (isJekyllSite) {
      return {
        type: 'manifest-based',
        priority: 2,
        capabilities: [
          DiscoveryCapability.MANIFEST_FILES,
          DiscoveryCapability.HEAD_REQUEST_SUPPORT
        ]
      };
    }

    return {
      type: 'probe-based',
      priority: 3,
      capabilities: [DiscoveryCapability.HEAD_REQUEST_SUPPORT]
    };
  }

  /**
   * Transform discovery request for GitHub Pages optimization
   */
  async transformDiscoveryRequest(request: DiscoveryRequest): Promise<OptimizedDiscoveryRequest> {
    const strategy = this.getOptimalDiscoveryStrategy();
    const platformHints = await this.extractPlatformHints(request.basePath);

    return {
      ...request,
      strategy,
      platformHints,
      batchSize: strategy.type === 'api-based' ? 50 : 10
    };
  }

  /**
   * Extract structure hints from GitHub Pages specific files
   */
  async extractStructureHints(basePath: string): Promise<StructureHint> {
    const hints: StructureHint = {
      suggestedPaths: [],
      excludePatterns: [],
      confidence: 0
    };

    try {
      // Check for Jekyll _config.yml
      const jekyllConfig = await this.tryGetJekyllConfig(basePath);
      if (jekyllConfig) {
        hints.knownStructure = 'jekyll';
        hints.confidence += 0.8;
        hints.suggestedPaths.push(...this.getJekyllSuggestedPaths(jekyllConfig));
        hints.excludePatterns.push(...this.getJekyllExcludePatterns(jekyllConfig));
      }

      // Check for GitHub repository structure via API
      if (this.canUseGitHubApi()) {
        const repoStructure = await this.getRepositoryStructure(basePath);
        if (repoStructure) {
          hints.suggestedPaths.push(...this.extractPathsFromRepoStructure(repoStructure));
          hints.confidence += 0.6;
        }
      }

      // Fallback: check for common GitHub Pages patterns
      if (hints.confidence < 0.5) {
        hints.suggestedPaths.push(
          'docs/',
          'documentation/',
          'wiki/',
          '_posts/',
          '_pages/'
        );
        hints.confidence = 0.3;
      }

    } catch (error) {
      // Graceful fallback to basic patterns
      hints.suggestedPaths.push('docs/', 'README.md');
      hints.confidence = 0.2;
    }

    return hints;
  }

  /**
   * Get discovery paths optimized for GitHub Pages
   */
  async getOptimizedDiscoveryPaths(basePath: string): Promise<string[]> {
    const structureHints = await this.extractStructureHints(basePath);
    const optimizedPaths: string[] = [];

    // High-priority paths based on detected structure
    if (structureHints.knownStructure === 'jekyll') {
      optimizedPaths.push(
        `${basePath}/_config.yml`,
        `${basePath}/index.md`,
        `${basePath}/README.md`,
        `${basePath}/_pages/`,
        `${basePath}/_posts/`
      );
    } else {
      // Standard GitHub Pages patterns
      optimizedPaths.push(
        `${basePath}/README.md`,
        `${basePath}/docs/README.md`,
        `${basePath}/docs/index.md`,
        `${basePath}/index.md`
      );
    }

    // Add structure hint paths
    optimizedPaths.push(...structureHints.suggestedPaths.map(path => 
      path.startsWith('/') ? path : `${basePath}/${path}`
    ));

    // Remove duplicates using Array.from
    return Array.from(new Set(optimizedPaths));
  }

  // Private helper methods for GitHub Pages optimization
  private canUseGitHubApi(): boolean {
    if (typeof window === 'undefined') return false;
    
    const hostname = window.location.hostname;
    return hostname.endsWith('.github.io') && this.hasGitHubToken();
  }

  private hasGitHubToken(): boolean {
    // Check for GitHub token in environment or localStorage
    return !!(process.env.GITHUB_TOKEN || 
             (typeof localStorage !== 'undefined' && localStorage.getItem('github_token')));
  }

  private isJekyllSite(): boolean {
    // Will be determined by checking for _config.yml during discovery
    return this.configCache.has('jekyll_config');
  }

  private async tryGetJekyllConfig(basePath: string): Promise<any> {
    try {
      const configUrl = `${basePath}/_config.yml`;
      const cached = this.configCache.get(configUrl);
      if (cached) return cached;

      const response = await this.executeRequest(configUrl);
      if (response.ok) {
        const content = await response.text();
        const config = this.parseYamlConfig(content);
        this.configCache.set(configUrl, config);
        this.configCache.set('jekyll_config', true);
        return config;
      }
    } catch (error) {
      // Jekyll config not available
    }
    return null;
  }

  private parseYamlConfig(content: string): any {
    // Simple YAML parser for basic Jekyll config
    const config: any = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          config[key.trim()] = value.replace(/['"]/g, '');
        }
      }
    }
    
    return config;
  }

  private getJekyllSuggestedPaths(config: any): string[] {
    const paths = ['_posts/', '_pages/', '_includes/', '_layouts/'];
    
    // Add custom collections if defined
    if (config.collections) {
      Object.keys(config.collections).forEach(collection => {
        paths.push(`_${collection}/`);
      });
    }
    
    return paths;
  }

  private getJekyllExcludePatterns(config: any): string[] {
    const patterns = ['_site/', '.jekyll-cache/', '.sass-cache/'];
    
    if (config.exclude && Array.isArray(config.exclude)) {
      patterns.push(...config.exclude);
    }
    
    return patterns;
  }

  private async getRepositoryStructure(basePath: string): Promise<any> {
    // Extract repo info from GitHub Pages URL
    const repoInfo = this.extractRepositoryInfo();
    if (!repoInfo) return null;

    const cacheKey = `repo_structure_${repoInfo.owner}_${repoInfo.repo}`;
    const cached = this.apiCache.get(cacheKey);
    if (cached) return cached;

    try {
      const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents`;
      const token = this.getGitHubToken();
      const headers: Record<string, string> = token ? { 'Authorization': `token ${token}` } : {};

      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const structure = await response.json();
        this.apiCache.set(cacheKey, structure);
        return structure;
      }
    } catch (error) {
      // API access failed, continue with fallback
    }

    return null;
  }

  private extractRepositoryInfo(): { owner: string; repo: string } | null {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    if (!hostname.endsWith('.github.io')) return null;

    const parts = hostname.split('.');
    if (parts.length < 3) return null;

    const owner = parts[0];
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;

    return { owner, repo };
  }

  private getGitHubToken(): string | null {
    return process.env.GITHUB_TOKEN || 
           (typeof localStorage !== 'undefined' ? localStorage.getItem('github_token') : null);
  }

  private extractPathsFromRepoStructure(structure: any[]): string[] {
    const paths: string[] = [];
    
    for (const item of structure) {
      if (item.type === 'dir') {
        // Add common documentation directories
        if (['docs', 'documentation', 'wiki', 'guides'].includes(item.name)) {
          paths.push(`${item.name}/`);
        }
      } else if (item.type === 'file' && item.name.endsWith('.md')) {
        paths.push(item.name);
      }
    }
    
    return paths;
  }

  private async extractPlatformHints(basePath: string): Promise<PlatformHint[]> {
    const hints: PlatformHint[] = [];

    // Try to get Jekyll config as a hint
    const jekyllConfig = await this.tryGetJekyllConfig(basePath);
    if (jekyllConfig) {
      hints.push({
        type: 'config_file',
        content: jekyllConfig,
        confidence: 0.9,
        source: '_config.yml'
      });
    }

    // Try to get repository structure via API
    if (this.canUseGitHubApi()) {
      const repoStructure = await this.getRepositoryStructure(basePath);
      if (repoStructure) {
        hints.push({
          type: 'api_endpoint',
          content: repoStructure,
          confidence: 0.8,
          source: 'github_api'
        });
      }
    }

    return hints;
  }
}

/**
 * Enhanced Netlify adapter with discovery optimizations
 */
export class EnhancedNetlifyAdapter extends NetlifyAdapter {
  constructor(environment: EnvironmentInfo, config: NetlifyConfig = {}) {
    super(environment, {
      enableFunctionDetection: true,
      enableRedirectHandling: true,
      enableEdgeCaching: true,
      enableBuildOptimization: true,
      ...config
    });
  }

  /**
   * Get optimal discovery strategy for Netlify
   */
  getOptimalDiscoveryStrategy(): DiscoveryStrategy {
    return {
      type: 'hybrid',
      priority: 1,
      capabilities: [
        DiscoveryCapability.DIRECTORY_LISTING,
        DiscoveryCapability.MANIFEST_FILES,
        DiscoveryCapability.BUILD_TIME_OPTIMIZATION,
        DiscoveryCapability.HEAD_REQUEST_SUPPORT
      ]
    };
  }

  /**
   * Transform discovery request for Netlify optimization
   */
  async transformDiscoveryRequest(request: DiscoveryRequest): Promise<OptimizedDiscoveryRequest> {
    const strategy = this.getOptimalDiscoveryStrategy();
    const platformHints = await this.extractNetlifyHints(request.basePath);

    return {
      ...request,
      strategy,
      platformHints,
      batchSize: 15 // Netlify can handle moderate batching
    };
  }

  /**
   * Extract structure hints from Netlify-specific files
   */
  async extractStructureHints(basePath: string): Promise<StructureHint> {
    const hints: StructureHint = {
      suggestedPaths: [],
      excludePatterns: [],
      confidence: 0
    };

    try {
      // Check for _redirects file
      const redirects = await this.tryGetRedirects(basePath);
      if (redirects) {
        hints.suggestedPaths.push(...this.extractPathsFromRedirects(redirects));
        hints.confidence += 0.4;
      }

      // Check for netlify.toml
      const netlifyConfig = await this.tryGetNetlifyConfig(basePath);
      if (netlifyConfig) {
        hints.suggestedPaths.push(...this.extractPathsFromNetlifyConfig(netlifyConfig));
        hints.confidence += 0.6;
      }

      // Netlify-specific patterns
      hints.suggestedPaths.push(
        'docs/',
        'documentation/',
        '.netlify/functions/',
        'api/',
        'public/'
      );
      hints.confidence = Math.max(hints.confidence, 0.3);

    } catch (error) {
      // Fallback patterns
      hints.suggestedPaths.push('docs/', 'public/');
      hints.confidence = 0.2;
    }

    return hints;
  }

  private async tryGetRedirects(basePath: string): Promise<string | null> {
    try {
      const response = await this.executeRequest(`${basePath}/_redirects`);
      return response.ok ? await response.text() : null;
    } catch {
      return null;
    }
  }

  private async tryGetNetlifyConfig(basePath: string): Promise<any> {
    try {
      const response = await this.executeRequest(`${basePath}/netlify.toml`);
      if (response.ok) {
        const content = await response.text();
        return this.parseTomlConfig(content);
      }
    } catch {
      // Config not available
    }
    return null;
  }

  private parseTomlConfig(content: string): any {
    // Simple TOML parser for basic Netlify config
    const config: any = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, value] = trimmed.split('=', 2);
        config[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    }
    
    return config;
  }

  private extractPathsFromRedirects(redirects: string): string[] {
    const paths: string[] = [];
    const lines = redirects.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const sourcePath = parts[1];
          if (sourcePath.endsWith('.md') || sourcePath.endsWith('/')) {
            paths.push(sourcePath);
          }
        }
      }
    }
    
    return paths;
  }

  private extractPathsFromNetlifyConfig(config: any): string[] {
    const paths: string[] = [];
    
    // Extract paths from build configuration
    if (config.publish) {
      paths.push(`${config.publish}/`);
    }
    
    // Extract paths from function configuration
    if (config.functions) {
      paths.push(`${config.functions}/`);
    }
    
    return paths;
  }

  private async extractNetlifyHints(basePath: string): Promise<PlatformHint[]> {
    const hints: PlatformHint[] = [];

    // Try to get Netlify config
    const netlifyConfig = await this.tryGetNetlifyConfig(basePath);
    if (netlifyConfig) {
      hints.push({
        type: 'config_file',
        content: netlifyConfig,
        confidence: 0.8,
        source: 'netlify.toml'
      });
    }

    // Try to get redirects
    const redirects = await this.tryGetRedirects(basePath);
    if (redirects) {
      hints.push({
        type: 'config_file',
        content: redirects,
        confidence: 0.6,
        source: '_redirects'
      });
    }

    return hints;
  }
}

/**
 * Factory function to create enhanced discovery adapters
 */
export function createEnhancedDiscoveryAdapter(environment: EnvironmentInfo): BaseAdapter {
  switch (environment.type) {
    case HostingEnvironment.GITHUB_PAGES:
      return new EnhancedGitHubPagesAdapter(environment);

    case HostingEnvironment.NETLIFY:
      return new EnhancedNetlifyAdapter(environment);

    case HostingEnvironment.VERCEL:
      // Use enhanced Netlify adapter as baseline for Vercel
      return new EnhancedNetlifyAdapter(environment);

    default:
      // Fallback to base GitHub Pages adapter for unknown environments
      return new EnhancedGitHubPagesAdapter(environment);
  }
}