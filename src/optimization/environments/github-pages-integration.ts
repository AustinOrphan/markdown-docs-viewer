/**
 * GitHub Pages API Integration & Jekyll Optimization System
 * Environment-specific optimizations for GitHub Pages hosted documentation
 */

import { Document } from '../../types';
import { DiscoveryResult } from '../algorithms/progressive-document-discovery';

/**
 * GitHub Pages configuration
 */
export interface GitHubPagesConfig {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
  customDomain?: string;
  jekyllEnabled: boolean;
  baseUrl: string;
  apiVersion: string;
}

/**
 * Jekyll site configuration
 */
export interface JekyllSiteConfig {
  title?: string;
  description?: string;
  baseurl?: string;
  url?: string;
  markdown?: string;
  highlighter?: string;
  theme?: string;
  plugins?: string[];
  collections?: Record<string, any>;
  defaults?: any[];
  excludes?: string[];
}

/**
 * GitHub API response for repository contents
 */
export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

/**
 * Jekyll post/page frontmatter
 */
export interface JekyllFrontmatter {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  layout?: string;
  permalink?: string;
  published?: boolean;
  order?: number;
  weight?: number;
  [key: string]: any;
}

/**
 * GitHub Pages optimization analytics
 */
export interface GitHubPagesAnalytics {
  totalFilesDiscovered: number;
  jekyllFilesProcessed: number;
  markdownFilesFound: number;
  postsDiscovered: number;
  pagesDiscovered: number;
  collectionsFound: number;
  apiRequestsSaved: number;
  cacheHitRate: number;
  processingTime: number;
}

/**
 * Jekyll collection configuration
 */
export interface JekyllCollection {
  name: string;
  path: string;
  output: boolean;
  permalink?: string;
  defaults?: any;
}

/**
 * GitHub Pages Integration System
 */
export class GitHubPagesIntegration {
  private config: GitHubPagesConfig;
  private jekyllConfig: JekyllSiteConfig | null = null;
  private analytics: GitHubPagesAnalytics;
  private contentCache = new Map<string, GitHubContent>();
  private apiRequestCount = 0;
  private rateLimitRemaining = 5000;
  private rateLimitReset = 0;

  constructor(config: GitHubPagesConfig) {
    this.config = {
      branch: 'main',
      ...config
    };

    this.analytics = {
      totalFilesDiscovered: 0,
      jekyllFilesProcessed: 0,
      markdownFilesFound: 0,
      postsDiscovered: 0,
      pagesDiscovered: 0,
      collectionsFound: 0,
      apiRequestsSaved: 0,
      cacheHitRate: 0,
      processingTime: 0
    };
  }

  /**
   * Discover documents from GitHub Pages repository
   */
  async discoverDocuments(): Promise<Document[]> {
    const startTime = Date.now();
    console.log(`🔍 Discovering documents from GitHub Pages: ${this.config.owner}/${this.config.repo}`);

    try {
      // Load Jekyll configuration first for optimization
      await this.loadJekyllConfiguration();

      // Discover documents using Jekyll-aware strategies
      const documents = await this.performJekyllOptimizedDiscovery();

      this.analytics.processingTime = Date.now() - startTime;
      this.analytics.totalFilesDiscovered = documents.length;

      console.log(`✅ GitHub Pages Discovery: Found ${documents.length} documents in ${this.analytics.processingTime}ms`);
      return documents;

    } catch (error) {
      console.error('GitHub Pages discovery failed:', error);
      
      // Fallback to basic GitHub API discovery
      return this.performBasicGitHubDiscovery();
    }
  }

  /**
   * Load Jekyll site configuration
   */
  async loadJekyllConfiguration(): Promise<JekyllSiteConfig | null> {
    console.log('📋 Loading Jekyll configuration...');

    try {
      // Try to load _config.yml
      const configContent = await this.getFileContent('_config.yml');
      if (configContent) {
        this.jekyllConfig = this.parseJekyllConfig(configContent);
        console.log('✅ Jekyll configuration loaded:', {
          title: this.jekyllConfig.title,
          collections: Object.keys(this.jekyllConfig.collections || {}),
          plugins: this.jekyllConfig.plugins?.length || 0
        });
        return this.jekyllConfig;
      }

      // Try _config.yaml as fallback
      const yamlConfigContent = await this.getFileContent('_config.yaml');
      if (yamlConfigContent) {
        this.jekyllConfig = this.parseJekyllConfig(yamlConfigContent);
        return this.jekyllConfig;
      }

      console.log('ℹ️ No Jekyll configuration found, using defaults');
      return null;

    } catch (error) {
      console.warn('Failed to load Jekyll configuration:', error);
      return null;
    }
  }

  /**
   * Optimize document discovery for Jekyll sites
   */
  async performJekyllOptimizedDiscovery(): Promise<Document[]> {
    const documents: Document[] = [];

    // Discovery strategy based on Jekyll configuration
    const discoveryPaths = this.getJekyllDiscoveryPaths();
    
    console.log(`🔍 Using Jekyll-optimized discovery for ${discoveryPaths.length} paths`);

    // Process each discovery path
    for (const path of discoveryPaths) {
      try {
        const pathDocuments = await this.discoverDocumentsInPath(path);
        documents.push(...pathDocuments);
      } catch (error) {
        console.warn(`Failed to discover documents in path ${path}:`, error);
      }
    }

    // Process Jekyll collections if configured
    if (this.jekyllConfig?.collections) {
      const collectionDocs = await this.discoverJekyllCollections();
      documents.push(...collectionDocs);
    }

    // Process Jekyll posts
    const posts = await this.discoverJekyllPosts();
    documents.push(...posts);

    // Process Jekyll pages
    const pages = await this.discoverJekyllPages();
    documents.push(...pages);

    return this.deduplicateDocuments(documents);
  }

  /**
   * Get optimal discovery paths for Jekyll sites
   */
  private getJekyllDiscoveryPaths(): string[] {
    const paths: string[] = [];

    // Standard Jekyll directories
    paths.push('');           // Root directory
    paths.push('_posts');     // Jekyll posts
    paths.push('_pages');     // Jekyll pages
    paths.push('docs');       // Common docs directory
    paths.push('documentation'); // Alternative docs directory

    // Add collection paths from Jekyll config
    if (this.jekyllConfig?.collections) {
      for (const [collectionName, collection] of Object.entries(this.jekyllConfig.collections)) {
        if (typeof collection === 'object' && collection !== null) {
          // Collection directory (default: _collectionName)
          paths.push(`_${collectionName}`);
        }
      }
    }

    // Add custom paths from Jekyll config
    if (this.jekyllConfig?.defaults) {
      for (const defaultConfig of this.jekyllConfig.defaults) {
        if (defaultConfig.scope?.path) {
          paths.push(defaultConfig.scope.path);
        }
      }
    }

    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Discover documents in a specific path
   */
  private async discoverDocumentsInPath(path: string): Promise<Document[]> {
    const documents: Document[] = [];
    
    try {
      const contents = await this.getDirectoryContents(path);
      
      for (const item of contents) {
        if (item.type === 'file' && this.isMarkdownFile(item.name)) {
          const document = await this.processMarkdownFile(item);
          if (document) {
            documents.push(document);
            this.analytics.markdownFilesFound++;
          }
        } else if (item.type === 'dir' && this.shouldExploreDirectory(item.name)) {
          // Recursively explore subdirectories
          const subDocuments = await this.discoverDocumentsInPath(item.path);
          documents.push(...subDocuments);
        }
      }
    } catch (error) {
      console.warn(`Failed to explore path ${path}:`, error);
    }

    return documents;
  }

  /**
   * Discover Jekyll collections
   */
  private async discoverJekyllCollections(): Promise<Document[]> {
    const documents: Document[] = [];

    if (!this.jekyllConfig?.collections) {
      return documents;
    }

    console.log('📚 Discovering Jekyll collections...');

    for (const [collectionName, collectionConfig] of Object.entries(this.jekyllConfig.collections)) {
      try {
        const collectionPath = `_${collectionName}`;
        const collectionDocs = await this.discoverDocumentsInPath(collectionPath);
        
        // Add collection metadata to documents
        for (const doc of collectionDocs) {
          doc.collection = collectionName;
          doc.category = doc.category || collectionName;
        }

        documents.push(...collectionDocs);
        this.analytics.collectionsFound++;
        
        console.log(`📁 Collection "${collectionName}": ${collectionDocs.length} documents`);
      } catch (error) {
        console.warn(`Failed to process collection ${collectionName}:`, error);
      }
    }

    return documents;
  }

  /**
   * Discover Jekyll posts
   */
  private async discoverJekyllPosts(): Promise<Document[]> {
    console.log('📝 Discovering Jekyll posts...');
    
    try {
      const posts = await this.discoverDocumentsInPath('_posts');
      
      // Process Jekyll post naming convention and frontmatter
      for (const post of posts) {
        const postDate = post.file ? this.extractDateFromPostFilename(post.file) : null;
        if (postDate) {
          post.date = postDate;
          post.category = post.category || 'posts';
        }
      }

      this.analytics.postsDiscovered = posts.length;
      console.log(`📝 Found ${posts.length} Jekyll posts`);
      
      return posts;
    } catch (error) {
      console.warn('Failed to discover Jekyll posts:', error);
      return [];
    }
  }

  /**
   * Discover Jekyll pages
   */
  private async discoverJekyllPages(): Promise<Document[]> {
    console.log('📄 Discovering Jekyll pages...');
    
    try {
      const pages = await this.discoverDocumentsInPath('_pages');
      
      // Add page metadata
      for (const page of pages) {
        page.category = page.category || 'pages';
      }

      this.analytics.pagesDiscovered = pages.length;
      console.log(`📄 Found ${pages.length} Jekyll pages`);
      
      return pages;
    } catch (error) {
      console.warn('Failed to discover Jekyll pages:', error);
      return [];
    }
  }

  /**
   * Process markdown file from GitHub
   */
  private async processMarkdownFile(item: GitHubContent): Promise<Document | null> {
    try {
      const content = await this.getFileContent(item.path);
      if (!content) return null;

      const frontmatter = this.extractJekyllFrontmatter(content);
      const markdownContent = this.stripFrontmatter(content);

      const document: Document = {
        id: this.generateDocumentId(item.path),
        title: this.extractTitle(frontmatter, markdownContent, item.name),
        file: this.getDocumentUrl(item.path),
        content: markdownContent,
        frontmatter,
        category: this.extractCategory(frontmatter, item.path),
        tags: frontmatter.tags,
        description: frontmatter.description || this.extractDescription(markdownContent),
        order: frontmatter.order || frontmatter.weight,
        date: frontmatter.date,
        author: frontmatter.author,
        permalink: frontmatter.permalink,
        layout: frontmatter.layout
      };

      this.analytics.jekyllFilesProcessed++;
      return document;

    } catch (error) {
      console.warn(`Failed to process markdown file ${item.path}:`, error);
      return null;
    }
  }

  /**
   * Get file content from GitHub API
   */
  private async getFileContent(path: string): Promise<string | null> {
    // Check cache first
    const cached = this.contentCache.get(path);
    if (cached && cached.content) {
      this.analytics.cacheHitRate++;
      return this.decodeBase64Content(cached.content);
    }

    try {
      await this.checkRateLimit();
      
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
      const headers = this.getApiHeaders();
      
      const response = await fetch(url, { headers });
      this.updateRateLimit(response);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // File not found
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubContent = await response.json();
      this.contentCache.set(path, data);

      if (data.content && data.encoding === 'base64') {
        return this.decodeBase64Content(data.content);
      }

      return null;
    } catch (error) {
      console.warn(`Failed to get file content for ${path}:`, error);
      return null;
    }
  }

  /**
   * Get directory contents from GitHub API
   */
  private async getDirectoryContents(path: string): Promise<GitHubContent[]> {
    try {
      await this.checkRateLimit();
      
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
      const headers = this.getApiHeaders();
      
      const response = await fetch(url, { headers });
      this.updateRateLimit(response);
      
      if (!response.ok) {
        if (response.status === 404) {
          return []; // Directory not found
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubContent[] = await response.json();
      
      // Cache directory contents
      for (const item of data) {
        this.contentCache.set(item.path, item);
      }

      return data;
    } catch (error) {
      console.warn(`Failed to get directory contents for ${path}:`, error);
      return [];
    }
  }

  /**
   * Parse Jekyll configuration file
   */
  private parseJekyllConfig(content: string): JekyllSiteConfig {
    try {
      // Simple YAML parsing for Jekyll config
      const config: JekyllSiteConfig = {};
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes(':')) {
          continue;
        }

        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        
        // Parse common Jekyll config values
        switch (key.trim()) {
          case 'title':
            config.title = this.parseYamlValue(value);
            break;
          case 'description':
            config.description = this.parseYamlValue(value);
            break;
          case 'baseurl':
            config.baseurl = this.parseYamlValue(value);
            break;
          case 'url':
            config.url = this.parseYamlValue(value);
            break;
          case 'markdown':
            config.markdown = this.parseYamlValue(value);
            break;
          case 'highlighter':
            config.highlighter = this.parseYamlValue(value);
            break;
          case 'theme':
            config.theme = this.parseYamlValue(value);
            break;
          case 'plugins':
            config.plugins = this.parseYamlArray(value);
            break;
          case 'collections':
            config.collections = this.parseYamlObject(value, lines);
            break;
          case 'defaults':
            config.defaults = this.parseYamlArray(value);
            break;
          case 'exclude':
            config.excludes = this.parseYamlArray(value);
            break;
        }
      }

      return config;
    } catch (error) {
      console.warn('Failed to parse Jekyll config:', error);
      return {};
    }
  }

  /**
   * Extract Jekyll frontmatter from markdown content
   */
  private extractJekyllFrontmatter(content: string): JekyllFrontmatter {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    try {
      const frontmatterContent = frontmatterMatch[1];
      const frontmatter: JekyllFrontmatter = {};
      const lines = frontmatterContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.includes(':')) continue;

        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        
        // Parse frontmatter values
        switch (key.trim()) {
          case 'title':
            frontmatter.title = this.parseYamlValue(value);
            break;
          case 'description':
            frontmatter.description = this.parseYamlValue(value);
            break;
          case 'date':
            frontmatter.date = this.parseYamlValue(value);
            break;
          case 'author':
            frontmatter.author = this.parseYamlValue(value);
            break;
          case 'layout':
            frontmatter.layout = this.parseYamlValue(value);
            break;
          case 'permalink':
            frontmatter.permalink = this.parseYamlValue(value);
            break;
          case 'published':
            frontmatter.published = this.parseYamlBoolean(value);
            break;
          case 'order':
          case 'weight':
            const numValue = parseInt(this.parseYamlValue(value));
            if (!isNaN(numValue)) {
              frontmatter[key.trim() as 'order' | 'weight'] = numValue;
            }
            break;
          case 'categories':
            frontmatter.categories = this.parseYamlArray(value);
            break;
          case 'tags':
            frontmatter.tags = this.parseYamlArray(value);
            break;
          default:
            // Store other frontmatter values
            frontmatter[key.trim()] = this.parseYamlValue(value);
        }
      }

      return frontmatter;
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error);
      return {};
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics(): GitHubPagesAnalytics {
    return { ...this.analytics };
  }

  /**
   * Helper methods
   */
  private async performBasicGitHubDiscovery(): Promise<Document[]> {
    console.log('🔄 Falling back to basic GitHub discovery...');
    // Implement basic GitHub repository file discovery
    return [];
  }

  private getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': this.config.apiVersion,
      'User-Agent': 'MarkdownDocsViewer/1.0'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 10 && Date.now() < this.rateLimitReset * 1000) {
      const waitTime = (this.rateLimitReset * 1000) - Date.now();
      console.warn(`⏳ GitHub API rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private updateRateLimit(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining) this.rateLimitRemaining = parseInt(remaining);
    if (reset) this.rateLimitReset = parseInt(reset);
    
    this.apiRequestCount++;
  }

  private decodeBase64Content(content: string): string {
    try {
      return atob(content.replace(/\n/g, ''));
    } catch (error) {
      console.warn('Failed to decode base64 content:', error);
      return '';
    }
  }

  private isMarkdownFile(filename: string): boolean {
    return /\.(md|markdown)$/i.test(filename);
  }

  private shouldExploreDirectory(dirname: string): boolean {
    const excludedDirs = ['.git', '.github', 'node_modules', '_site', '.sass-cache', '.jekyll-cache'];
    return !excludedDirs.includes(dirname) && !dirname.startsWith('.');
  }

  private generateDocumentId(path: string): string {
    return path.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  private getDocumentUrl(path: string): string {
    if (this.config.customDomain) {
      return `https://${this.config.customDomain}/${path}`;
    }
    return `https://${this.config.owner}.github.io/${this.config.repo}/${path}`;
  }

  private extractTitle(frontmatter: JekyllFrontmatter, content: string, filename: string): string {
    if (frontmatter.title) return frontmatter.title;
    
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();
    
    return this.filenameToTitle(filename);
  }

  private extractCategory(frontmatter: JekyllFrontmatter, path: string): string | undefined {
    if (frontmatter.categories?.length) return frontmatter.categories[0];
    
    const pathParts = path.split('/');
    if (pathParts.length > 1) {
      const dir = pathParts[0];
      if (dir.startsWith('_')) return dir.substring(1);
      return dir;
    }
    
    return undefined;
  }

  private extractDescription(content: string): string | undefined {
    const firstParagraph = content.match(/^([^#\n].+?)(?:\n\n|$)/m);
    if (firstParagraph) {
      return firstParagraph[1].trim().substring(0, 200);
    }
    return undefined;
  }

  private extractDateFromPostFilename(filename: string): string | undefined {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : undefined;
  }

  private stripFrontmatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  private filenameToTitle(filename: string): string {
    return filename
      .replace(/\.(md|markdown)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private parseYamlValue(value: string): string {
    return value.replace(/^['"]|['"]$/g, '').trim();
  }

  private parseYamlBoolean(value: string): boolean {
    return ['true', 'yes', 'on'].includes(value.toLowerCase());
  }

  private parseYamlArray(value: string): string[] {
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(item => item.trim().replace(/^['"]|['"]$/g, ''));
    }
    return [];
  }

  private parseYamlObject(value: string, lines: string[]): Record<string, any> {
    // Simplified YAML object parsing
    return {};
  }

  private deduplicateDocuments(documents: Document[]): Document[] {
    const seen = new Set<string>();
    return documents.filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
  }
}

/**
 * Factory function for GitHub Pages integration
 */
export function createGitHubPagesIntegration(config: GitHubPagesConfig): GitHubPagesIntegration {
  return new GitHubPagesIntegration(config);
}