/**
 * Content-Aware Discovery Enhancement System
 * Intelligently differentiates content types and optimizes discovery for specific documentation generators
 */

import { Document } from '../../types';
import { DiscoveryResult } from './progressive-document-discovery';

/**
 * Content type detection result
 */
export interface ContentType {
  type: 'markdown' | 'html' | 'text' | 'binary' | 'image' | 'unknown';
  subtype?: 'documentation' | 'blog' | 'api' | 'tutorial' | 'reference';
  confidence: number;
  encoding?: string;
  size?: number;
}

/**
 * Documentation generator detection
 */
export interface DocGeneratorInfo {
  generator: 'gitbook' | 'docusaurus' | 'vuepress' | 'gatsby' | 'next' | 'jekyll' | 'mkdocs' | 'hugo' | 'sphinx' | 'unknown';
  version?: string;
  confidence: number;
  indicators: string[];
  optimizations: GeneratorOptimization[];
}

/**
 * Generator-specific optimizations
 */
export interface GeneratorOptimization {
  type: 'path_patterns' | 'config_files' | 'build_outputs' | 'api_endpoints';
  description: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Binary file detection result
 */
export interface BinaryFileInfo {
  isBinary: boolean;
  fileType?: 'image' | 'video' | 'audio' | 'archive' | 'executable' | 'document';
  mimeType?: string;
  skipReason?: string;
}

/**
 * Content analysis result
 */
export interface ContentAnalysis {
  contentType: ContentType;
  generatorInfo: DocGeneratorInfo;
  binaryInfo: BinaryFileInfo;
  shouldInclude: boolean;
  priority: number;
  metadata: Record<string, any>;
}

/**
 * Content-aware discovery analytics
 */
export interface ContentAwareAnalytics {
  totalFilesAnalyzed: number;
  markdownFilesFound: number;
  binaryFilesSkipped: number;
  generatorDetections: Record<string, number>;
  optimizationsApplied: number;
  processingTimeSaved: number;
}

/**
 * Content-Aware Discovery implementation
 */
export class ContentAwareDiscovery {
  private analytics: ContentAwareAnalytics;
  private generatorCache = new Map<string, DocGeneratorInfo>();
  private contentTypeCache = new Map<string, ContentType>();
  private binaryPatterns!: RegExp[];
  private textPatterns!: RegExp[];

  constructor() {
    this.analytics = {
      totalFilesAnalyzed: 0,
      markdownFilesFound: 0,
      binaryFilesSkipped: 0,
      generatorDetections: {},
      optimizationsApplied: 0,
      processingTimeSaved: 0
    };

    this.initializePatterns();
  }

  /**
   * Analyze content type and determine if it should be included
   */
  async analyzeContent(path: string, headers?: Headers): Promise<ContentAnalysis> {
    this.analytics.totalFilesAnalyzed++;
    const startTime = Date.now();

    try {
      // Quick binary detection from path
      const binaryInfo = this.detectBinaryFile(path, headers);
      if (binaryInfo.isBinary) {
        this.analytics.binaryFilesSkipped++;
        return {
          contentType: { type: 'binary', confidence: 0.9 },
          generatorInfo: { generator: 'unknown', confidence: 0, indicators: [], optimizations: [] },
          binaryInfo,
          shouldInclude: false,
          priority: 0,
          metadata: { skipReason: binaryInfo.skipReason }
        };
      }

      // Detect content type
      const contentType = await this.detectContentType(path, headers);
      
      // Detect documentation generator
      const generatorInfo = await this.detectDocumentationGenerator(path);

      // Calculate priority and inclusion
      const shouldInclude = this.shouldIncludeContent(contentType, generatorInfo);
      const priority = this.calculateContentPriority(contentType, generatorInfo, path);

      const analysis: ContentAnalysis = {
        contentType,
        generatorInfo,
        binaryInfo,
        shouldInclude,
        priority,
        metadata: this.extractMetadata(path, contentType, generatorInfo)
      };

      this.analytics.processingTimeSaved += Date.now() - startTime;
      
      if (contentType.type === 'markdown') {
        this.analytics.markdownFilesFound++;
      }

      return analysis;
    } catch (error) {
      console.warn(`Content analysis failed for ${path}:`, error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Optimize discovery paths for detected generator
   */
  optimizeDiscoveryPaths(basePath: string, generatorInfo: DocGeneratorInfo): string[] {
    const optimizedPaths: string[] = [];

    switch (generatorInfo.generator) {
      case 'gitbook':
        optimizedPaths.push(
          `${basePath}/SUMMARY.md`,
          `${basePath}/README.md`,
          `${basePath}/book.json`,
          `${basePath}/.gitbook.yaml`
        );
        break;

      case 'docusaurus':
        optimizedPaths.push(
          `${basePath}/docusaurus.config.js`,
          `${basePath}/docs/intro.md`,
          `${basePath}/docs/README.md`,
          `${basePath}/sidebars.js`
        );
        break;

      case 'vuepress':
        optimizedPaths.push(
          `${basePath}/.vuepress/config.js`,
          `${basePath}/README.md`,
          `${basePath}/guide/README.md`,
          `${basePath}/.vuepress/config.ts`
        );
        break;

      case 'gatsby':
        optimizedPaths.push(
          `${basePath}/gatsby-config.js`,
          `${basePath}/src/pages/index.md`,
          `${basePath}/content/README.md`,
          `${basePath}/static/README.md`
        );
        break;

      case 'jekyll':
        optimizedPaths.push(
          `${basePath}/_config.yml`,
          `${basePath}/index.md`,
          `${basePath}/_posts/`,
          `${basePath}/_pages/`,
          `${basePath}/README.md`
        );
        break;

      case 'mkdocs':
        optimizedPaths.push(
          `${basePath}/mkdocs.yml`,
          `${basePath}/docs/index.md`,
          `${basePath}/docs/README.md`
        );
        break;

      case 'hugo':
        optimizedPaths.push(
          `${basePath}/config.yaml`,
          `${basePath}/config.toml`,
          `${basePath}/content/_index.md`,
          `${basePath}/content/README.md`
        );
        break;

      case 'sphinx':
        optimizedPaths.push(
          `${basePath}/conf.py`,
          `${basePath}/index.rst`,
          `${basePath}/README.rst`,
          `${basePath}/source/index.rst`
        );
        break;

      default:
        // Generic documentation patterns
        optimizedPaths.push(
          `${basePath}/README.md`,
          `${basePath}/docs/README.md`,
          `${basePath}/documentation/README.md`
        );
    }

    return optimizedPaths.filter(path => !this.isProbablyBinary(path));
  }

  /**
   * Filter documents based on content analysis
   */
  filterDocuments(documents: Document[]): Document[] {
    return documents.filter(doc => {
      const analysis = this.analyzeContentSync(doc.file || doc.id);
      return analysis.shouldInclude;
    });
  }

  /**
   * Prioritize documents based on content analysis
   */
  prioritizeDocuments(documents: Document[]): Document[] {
    return documents
      .map(doc => ({
        document: doc,
        analysis: this.analyzeContentSync(doc.file || doc.id)
      }))
      .sort((a, b) => b.analysis.priority - a.analysis.priority)
      .map(item => item.document);
  }

  /**
   * Get analytics data
   */
  getAnalytics(): ContentAwareAnalytics {
    return { ...this.analytics };
  }

  /**
   * Detect content type from path and headers
   */
  private async detectContentType(path: string, headers?: Headers): Promise<ContentType> {
    // Check cache first
    const cached = this.contentTypeCache.get(path);
    if (cached) return cached;

    let type: ContentType['type'] = 'unknown';
    let subtype: ContentType['subtype'] | undefined;
    let confidence = 0.5;

    // Analyze file extension
    const extension = this.getFileExtension(path).toLowerCase();
    
    switch (extension) {
      case 'md':
      case 'markdown':
        type = 'markdown';
        confidence = 0.95;
        subtype = this.detectMarkdownSubtype(path);
        break;
        
      case 'html':
      case 'htm':
        type = 'html';
        confidence = 0.9;
        break;
        
      case 'txt':
      case 'text':
        type = 'text';
        confidence = 0.8;
        break;
        
      default:
        if (this.isImageExtension(extension)) {
          type = 'image';
          confidence = 0.9;
        } else if (this.isBinaryExtension(extension)) {
          type = 'binary';
          confidence = 0.9;
        }
    }

    // Use headers if available
    if (headers) {
      const contentType = headers.get('content-type');
      if (contentType) {
        if (contentType.includes('text/markdown')) {
          type = 'markdown';
          confidence = 0.98;
        } else if (contentType.includes('text/html')) {
          type = 'html';
          confidence = 0.95;
        } else if (contentType.includes('text/plain')) {
          type = 'text';
          confidence = 0.9;
        } else if (contentType.startsWith('image/')) {
          type = 'image';
          confidence = 0.95;
        }
      }
    }

    const result: ContentType = { type, subtype, confidence };
    this.contentTypeCache.set(path, result);
    return result;
  }

  /**
   * Detect documentation generator from path patterns
   */
  private async detectDocumentationGenerator(path: string): Promise<DocGeneratorInfo> {
    const domain = this.extractDomain(path);
    const cached = this.generatorCache.get(domain);
    if (cached) return cached;

    const indicators: string[] = [];
    let generator: DocGeneratorInfo['generator'] = 'unknown';
    let confidence = 0;

    // Analyze path patterns
    if (path.includes('.gitbook')) {
      generator = 'gitbook';
      confidence = 0.9;
      indicators.push('.gitbook directory structure');
    } else if (path.includes('docusaurus.config')) {
      generator = 'docusaurus';
      confidence = 0.95;
      indicators.push('docusaurus.config file');
    } else if (path.includes('.vuepress')) {
      generator = 'vuepress';
      confidence = 0.9;
      indicators.push('.vuepress directory');
    } else if (path.includes('gatsby-config')) {
      generator = 'gatsby';
      confidence = 0.9;
      indicators.push('gatsby-config file');
    } else if (path.includes('_config.yml') || path.includes('_posts') || path.includes('_pages')) {
      generator = 'jekyll';
      confidence = 0.8;
      indicators.push('Jekyll directory structure');
    } else if (path.includes('mkdocs.yml')) {
      generator = 'mkdocs';
      confidence = 0.9;
      indicators.push('mkdocs.yml file');
    } else if (path.includes('config.toml') || path.includes('config.yaml')) {
      generator = 'hugo';
      confidence = 0.7;
      indicators.push('Hugo config file');
    } else if (path.includes('conf.py') || path.includes('.rst')) {
      generator = 'sphinx';
      confidence = 0.8;
      indicators.push('Sphinx documentation');
    }

    const optimizations = this.getGeneratorOptimizations(generator);
    
    const result: DocGeneratorInfo = {
      generator,
      confidence,
      indicators,
      optimizations
    };

    this.generatorCache.set(domain, result);
    this.analytics.generatorDetections[generator] = 
      (this.analytics.generatorDetections[generator] || 0) + 1;

    return result;
  }

  /**
   * Detect binary files efficiently
   */
  private detectBinaryFile(path: string, headers?: Headers): BinaryFileInfo {
    const extension = this.getFileExtension(path).toLowerCase();
    
    // Check common binary extensions
    if (this.isBinaryExtension(extension)) {
      return {
        isBinary: true,
        fileType: this.getBinaryFileType(extension),
        skipReason: `Binary file type: ${extension}`
      };
    }

    // Check MIME type from headers
    if (headers) {
      const contentType = headers.get('content-type');
      if (contentType && !contentType.startsWith('text/') && !contentType.includes('json')) {
        return {
          isBinary: true,
          mimeType: contentType,
          skipReason: `Non-text MIME type: ${contentType}`
        };
      }
    }

    return { isBinary: false };
  }

  /**
   * Initialize file type patterns
   */
  private initializePatterns(): void {
    this.binaryPatterns = [
      /\.(exe|dll|so|dylib|bin)$/i,
      /\.(zip|rar|tar|gz|7z|bz2)$/i,
      /\.(jpg|jpeg|png|gif|svg|ico|webp)$/i,
      /\.(mp4|avi|mov|wmv|flv|webm)$/i,
      /\.(mp3|wav|flac|aac|ogg)$/i,
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i
    ];

    this.textPatterns = [
      /\.(md|markdown|txt|text|rst)$/i,
      /\.(html|htm|xml|json|yaml|yml)$/i,
      /\.(js|ts|jsx|tsx|css|scss|sass)$/i,
      /\.(py|java|cpp|c|h|cs|php|rb)$/i
    ];
  }

  /**
   * Helper methods
   */
  private shouldIncludeContent(contentType: ContentType, generatorInfo: DocGeneratorInfo): boolean {
    // Always include markdown
    if (contentType.type === 'markdown') return true;
    
    // Include HTML from documentation generators
    if (contentType.type === 'html' && generatorInfo.confidence > 0.5) return true;
    
    // Include text files that might be documentation
    if (contentType.type === 'text') {
      return contentType.subtype === 'documentation' || 
             contentType.subtype === 'api' ||
             contentType.subtype === 'reference';
    }
    
    // Exclude binary and unknown types
    return false;
  }

  private calculateContentPriority(
    contentType: ContentType, 
    generatorInfo: DocGeneratorInfo, 
    path: string
  ): number {
    let priority = 0;

    // Base priority by content type
    switch (contentType.type) {
      case 'markdown':
        priority = 10;
        break;
      case 'html':
        priority = 7;
        break;
      case 'text':
        priority = 5;
        break;
      default:
        priority = 1;
    }

    // Boost for documentation subtypes
    if (contentType.subtype === 'documentation') priority += 5;
    if (contentType.subtype === 'api') priority += 4;
    if (contentType.subtype === 'tutorial') priority += 3;

    // Boost for recognized generators
    priority += generatorInfo.confidence * 3;

    // Boost for important file names
    const filename = this.getFileName(path).toLowerCase();
    if (filename.includes('readme')) priority += 5;
    if (filename.includes('getting-started')) priority += 4;
    if (filename.includes('quickstart')) priority += 4;
    if (filename.includes('index')) priority += 3;

    return Math.min(priority, 20); // Cap at 20
  }

  private detectMarkdownSubtype(path: string): ContentType['subtype'] {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('api') || pathLower.includes('reference')) {
      return 'api';
    }
    if (pathLower.includes('tutorial') || pathLower.includes('guide')) {
      return 'tutorial';
    }
    if (pathLower.includes('blog') || pathLower.includes('post')) {
      return 'blog';
    }
    if (pathLower.includes('doc') || pathLower.includes('readme')) {
      return 'documentation';
    }
    
    return 'documentation';
  }

  private getGeneratorOptimizations(generator: DocGeneratorInfo['generator']): GeneratorOptimization[] {
    const optimizations: Record<string, GeneratorOptimization[]> = {
      gitbook: [
        {
          type: 'config_files',
          description: 'Use SUMMARY.md for navigation structure',
          implementation: 'Parse SUMMARY.md to get document hierarchy',
          priority: 'high'
        }
      ],
      docusaurus: [
        {
          type: 'config_files',
          description: 'Use sidebars.js for navigation',
          implementation: 'Parse sidebars configuration',
          priority: 'high'
        }
      ],
      jekyll: [
        {
          type: 'path_patterns',
          description: 'Focus on _posts and _pages directories',
          implementation: 'Prioritize Jekyll-specific directories',
          priority: 'medium'
        }
      ]
    };

    return optimizations[generator] || [];
  }

  private analyzeContentSync(path: string): ContentAnalysis {
    // Simplified synchronous analysis for already-discovered content
    const contentType = this.detectContentTypeSync(path);
    const binaryInfo = this.detectBinaryFile(path);
    const generatorInfo = this.detectDocumentationGeneratorSync(path);
    
    return {
      contentType,
      generatorInfo,
      binaryInfo,
      shouldInclude: this.shouldIncludeContent(contentType, generatorInfo),
      priority: this.calculateContentPriority(contentType, generatorInfo, path),
      metadata: {}
    };
  }

  private detectContentTypeSync(path: string): ContentType {
    const extension = this.getFileExtension(path).toLowerCase();
    
    if (extension === 'md' || extension === 'markdown') {
      return { type: 'markdown', confidence: 0.95, subtype: this.detectMarkdownSubtype(path) };
    }
    if (extension === 'html' || extension === 'htm') {
      return { type: 'html', confidence: 0.9 };
    }
    if (this.isBinaryExtension(extension)) {
      return { type: 'binary', confidence: 0.9 };
    }
    
    return { type: 'text', confidence: 0.5 };
  }

  private detectDocumentationGeneratorSync(path: string): DocGeneratorInfo {
    // Simplified sync detection
    if (path.includes('gitbook')) {
      return { generator: 'gitbook', confidence: 0.8, indicators: [], optimizations: [] };
    }
    if (path.includes('docusaurus')) {
      return { generator: 'docusaurus', confidence: 0.8, indicators: [], optimizations: [] };
    }
    
    return { generator: 'unknown', confidence: 0, indicators: [], optimizations: [] };
  }

  private getDefaultAnalysis(): ContentAnalysis {
    return {
      contentType: { type: 'unknown', confidence: 0 },
      generatorInfo: { generator: 'unknown', confidence: 0, indicators: [], optimizations: [] },
      binaryInfo: { isBinary: false },
      shouldInclude: false,
      priority: 0,
      metadata: {}
    };
  }

  private extractMetadata(path: string, contentType: ContentType, generatorInfo: DocGeneratorInfo): Record<string, any> {
    return {
      fileExtension: this.getFileExtension(path),
      fileName: this.getFileName(path),
      directory: this.getDirectory(path),
      contentType: contentType.type,
      generator: generatorInfo.generator,
      analysisTimestamp: Date.now()
    };
  }

  // Utility methods
  private getFileExtension(path: string): string {
    return path.split('.').pop() || '';
  }

  private getFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  private getDirectory(path: string): string {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/');
  }

  private extractDomain(path: string): string {
    try {
      const url = new URL(path);
      return url.hostname;
    } catch {
      return 'localhost';
    }
  }

  private isBinaryExtension(ext: string): boolean {
    return this.binaryPatterns.some(pattern => pattern.test(`.${ext}`));
  }

  private isImageExtension(ext: string): boolean {
    return /^(jpg|jpeg|png|gif|svg|ico|webp|bmp|tiff)$/i.test(ext);
  }

  private getBinaryFileType(ext: string): BinaryFileInfo['fileType'] {
    if (this.isImageExtension(ext)) return 'image';
    if (/^(zip|rar|tar|gz|7z|bz2)$/i.test(ext)) return 'archive';
    if (/^(mp4|avi|mov|wmv|flv|webm)$/i.test(ext)) return 'video';
    if (/^(mp3|wav|flac|aac|ogg)$/i.test(ext)) return 'audio';
    if (/^(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(ext)) return 'document';
    if (/^(exe|dll|so|dylib|bin)$/i.test(ext)) return 'executable';
    return undefined;
  }

  private isProbablyBinary(path: string): boolean {
    const ext = this.getFileExtension(path);
    return this.isBinaryExtension(ext);
  }
}

/**
 * Factory function for content-aware discovery
 */
export function createContentAwareDiscovery(): ContentAwareDiscovery {
  return new ContentAwareDiscovery();
}