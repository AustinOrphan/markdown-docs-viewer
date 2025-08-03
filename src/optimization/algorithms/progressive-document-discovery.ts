/**
 * Progressive Document Discovery Algorithm
 * Reduces document discovery from 60+ requests to <10 requests through intelligent patterns
 */

import { Document } from '../../types';
import { EnvironmentInfo, HostingEnvironment } from '../foundation/environment-utils';
import { getEnvironmentDetector } from '../utils/environment-detector';
import { createEnvironmentAdapter } from '../adapters';
import { DocumentLoadError, OptimizationErrors } from '../errors';

// Cache imports from Agent A's foundation
let DiscoveryCache: any;
let RequestMonitor: any;
let PerformanceMonitor: any;

try {
  const foundation = require('../foundation');
  DiscoveryCache = foundation.DiscoveryCache;
  RequestMonitor = foundation.RequestMonitor;
  PerformanceMonitor = foundation.PerformanceMonitor;
} catch {
  // Mock implementations for when Agent A's components aren't available
  DiscoveryCache = class { get() { return null; } set() {} };
  RequestMonitor = class { record() {} getStats() { return {}; } };
  PerformanceMonitor = class { startMeasure() { return { end() { return {}; } }; } };
}

/**
 * Document discovery result with metadata
 */
export interface DiscoveryResult {
  document: Document;
  path: string;
  source: 'smart-start' | 'pattern-match' | 'expansion' | 'fallback';
  confidence: number;
  requestOrder: number;
}

/**
 * Document pattern analysis
 */
export interface DocumentPattern {
  type: 'flat' | 'hierarchical' | 'sequential' | 'categorized' | 'mixed';
  confidence: number;
  indicators: string[];
  recommendations: PatternRecommendation[];
}

/**
 * Pattern-based recommendations for further discovery
 */
export interface PatternRecommendation {
  path: string;
  probability: number;
  reasoning: string;
}

/**
 * Discovery statistics for optimization tracking
 */
export interface DiscoveryStats {
  totalRequests: number;
  successfulRequests: number;
  documentsFound: number;
  patternConfidence: number;
  stoppedReason: 'pattern-complete' | 'consecutive-404s' | 'max-requests' | 'manual';
  executionTime: number;
}

/**
 * Configuration for progressive discovery
 */
export interface ProgressiveDiscoveryConfig {
  maxRequests?: number;
  consecutiveFailureThreshold?: number;
  patternConfidenceThreshold?: number;
  enableSmartStarting?: boolean;
  enablePatternRecognition?: boolean;
  enableEnvironmentOptimization?: boolean;
}

/**
 * Progressive Document Discovery implementation
 */
export class ProgressiveDocumentDiscovery {
  private config: Required<ProgressiveDiscoveryConfig>;
  private cache: any;
  private requestMonitor: any;
  private performanceMonitor: any;
  private environment: EnvironmentInfo | null = null;
  private stats: DiscoveryStats;

  constructor(config: ProgressiveDiscoveryConfig = {}) {
    this.config = {
      maxRequests: 10,
      consecutiveFailureThreshold: 5,
      patternConfidenceThreshold: 0.9,
      enableSmartStarting: true,
      enablePatternRecognition: true,
      enableEnvironmentOptimization: true,
      ...config
    };

    // Initialize foundation components
    this.cache = new DiscoveryCache();
    this.requestMonitor = new RequestMonitor();
    this.performanceMonitor = new PerformanceMonitor();

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      documentsFound: 0,
      patternConfidence: 0,
      stoppedReason: 'manual',
      executionTime: 0
    };
  }

  /**
   * Main discovery entry point - reduces 60+ requests to <10
   */
  async discoverDocuments(basePath: string): Promise<Document[]> {
    const measurement = this.performanceMonitor.startMeasure('progressive-discovery');
    
    try {
      // Initialize environment detection
      if (this.config.enableEnvironmentOptimization) {
        await this.initializeEnvironment();
      }

      const results: DiscoveryResult[] = [];
      
      // Phase 1: Smart starting points (aim for 80% success in first 5 requests)
      if (this.config.enableSmartStarting) {
        const smartResults = await this.executeSmartStarting(basePath);
        results.push(...smartResults);
        
        // Check if we should stop after smart starting
        if (this.shouldContinueDiscovery(results) === false) {
          if (this.stats.stoppedReason === 'manual') {
            this.stats.stoppedReason = 'pattern-complete';
          }
          return this.extractDocuments(results);
        }
      }

      // Phase 2: Pattern recognition and progressive expansion
      if (this.config.enablePatternRecognition && results.length > 0 && this.shouldContinueDiscovery(results)) {
        const pattern = this.analyzeDocumentPattern(results);
        this.stats.patternConfidence = pattern.confidence;
        
        if (pattern.confidence >= this.config.patternConfidenceThreshold) {
          const patternResults = await this.executePatternBasedDiscovery(basePath, pattern);
          results.push(...patternResults);
        }
      }

      // Phase 3: Fallback expansion if needed
      if ((results.length === 0 || this.stats.totalRequests < 3) && this.shouldContinueDiscovery(results)) {
        const fallbackResults = await this.executeFallbackDiscovery(basePath, results);
        results.push(...fallbackResults);
      }

      // Set final stopped reason if not already set
      if (this.stats.stoppedReason === 'manual') {
        if (this.stats.totalRequests >= this.config.maxRequests) {
          this.stats.stoppedReason = 'max-requests';
        } else if (this.stats.patternConfidence >= this.config.patternConfidenceThreshold) {
          this.stats.stoppedReason = 'pattern-complete';
        }
      }

      this.stats.documentsFound = results.length;
      return this.extractDocuments(results);

    } finally {
      const report = measurement.end();
      this.stats.executionTime = report.duration;
    }
  }

  /**
   * Phase 1: Smart starting points with high probability
   */
  private async executeSmartStarting(basePath: string): Promise<DiscoveryResult[]> {
    const smartPaths = this.getSmartStartingPaths(basePath);
    const results: DiscoveryResult[] = [];
    let consecutiveFailures = 0;

    for (const { path, probability, reasoning } of smartPaths) {
      if (this.stats.totalRequests >= this.config.maxRequests) {
        this.stats.stoppedReason = 'max-requests';
        break;
      }
      if (consecutiveFailures >= this.config.consecutiveFailureThreshold) {
        this.stats.stoppedReason = 'consecutive-404s';
        break;
      }

      try {
        const document = await this.tryDiscoverDocument(path);
        if (document) {
          results.push({
            document,
            path,
            source: 'smart-start',
            confidence: probability,
            requestOrder: this.stats.totalRequests - 1 // Request was already incremented in tryDiscoverDocument
          });
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      } catch (error) {
        consecutiveFailures++;
        // Don't throw - continue with next smart path
      }
    }

    // Set stopped reason if we hit consecutive failures
    if (consecutiveFailures >= this.config.consecutiveFailureThreshold) {
      this.stats.stoppedReason = 'consecutive-404s';
    }

    return results;
  }

  /**
   * Phase 2: Pattern-based discovery expansion
   */
  private async executePatternBasedDiscovery(
    basePath: string, 
    pattern: DocumentPattern
  ): Promise<DiscoveryResult[]> {
    const results: DiscoveryResult[] = [];
    let consecutiveFailures = 0;

    for (const recommendation of pattern.recommendations) {
      if (this.stats.totalRequests >= this.config.maxRequests) break;
      if (consecutiveFailures >= this.config.consecutiveFailureThreshold) break;

      try {
        const fullPath = this.resolvePath(basePath, recommendation.path);
        const document = await this.tryDiscoverDocument(fullPath);
        
        if (document) {
          results.push({
            document,
            path: fullPath,
            source: 'pattern-match',
            confidence: recommendation.probability,
            requestOrder: this.stats.totalRequests - 1 // Request was already incremented in tryDiscoverDocument
          });
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      } catch (error) {
        consecutiveFailures++;
      }
    }

    return results;
  }

  /**
   * Phase 3: Fallback discovery for edge cases
   */
  private async executeFallbackDiscovery(
    basePath: string,
    existingResults: DiscoveryResult[]
  ): Promise<DiscoveryResult[]> {
    // If we have some results but not many, try a few more strategic paths
    const fallbackPaths = this.getFallbackPaths(basePath, existingResults);
    const results: DiscoveryResult[] = [];
    let consecutiveFailures = 0;

    for (const path of fallbackPaths.slice(0, 3)) { // Limit fallback attempts
      if (this.stats.totalRequests >= this.config.maxRequests) {
        this.stats.stoppedReason = 'max-requests';
        break;
      }
      if (consecutiveFailures >= 3) {
        this.stats.stoppedReason = 'consecutive-404s';
        break; // Lower threshold for fallback
      }

      try {
        const document = await this.tryDiscoverDocument(path);
        if (document) {
          results.push({
            document,
            path,
            source: 'fallback',
            confidence: 0.3,
            requestOrder: this.stats.totalRequests - 1 // Request was already incremented in tryDiscoverDocument
          });
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      } catch (error) {
        consecutiveFailures++;
      }
    }

    // Set stopped reason if we exhausted all paths without success
    if (results.length === 0 && existingResults.length === 0) {
      this.stats.stoppedReason = 'consecutive-404s';
    }

    return results;
  }

  /**
   * Get smart starting paths based on common patterns and environment
   */
  private getSmartStartingPaths(basePath: string): Array<{
    path: string;
    probability: number;
    reasoning: string;
  }> {
    const paths = [
      // Highest probability paths first
      {
        path: `${basePath}/README.md`,
        probability: 0.9,
        reasoning: 'README.md is the most common documentation entry point'
      },
      {
        path: `${basePath}/docs/README.md`,
        probability: 0.8,
        reasoning: 'docs/README.md is standard for dedicated documentation directories'
      },
      {
        path: `${basePath}/index.md`,
        probability: 0.7,
        reasoning: 'index.md is common for documentation site roots'
      },
      {
        path: `${basePath}/docs/index.md`,
        probability: 0.7,
        reasoning: 'docs/index.md is standard for documentation sites'
      },
      {
        path: `${basePath}/getting-started.md`,
        probability: 0.6,
        reasoning: 'Getting started guides are common first documents'
      }
    ];

    // Add environment-specific optimizations
    if (this.environment?.type === HostingEnvironment.GITHUB_PAGES) {
      paths.unshift({
        path: `${basePath}/_config.yml`,
        probability: 0.5,
        reasoning: 'Jekyll config may provide structure hints for GitHub Pages'
      });
    }

    return paths.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Analyze discovered documents to identify patterns
   */
  analyzeDocumentPattern(results: DiscoveryResult[]): DocumentPattern {
    if (results.length === 0) {
      return {
        type: 'flat',
        confidence: 0,
        indicators: [],
        recommendations: []
      };
    }

    const paths = results.map(r => r.path);
    const indicators: string[] = [];
    let type: DocumentPattern['type'] = 'flat';
    let confidence = 0;

    // Detect sequential pattern (01-, 02-, numbered files) - more flexible regex
    const sequentialPattern = paths.some(path => /\d+[-_.]/.test(path));
    if (sequentialPattern) {
      indicators.push('sequential numbering detected');
      type = 'sequential';
      confidence += 0.4;
    }

    // Detect categorized pattern (common directory names) - check first to set baseline
    const categories = ['api', 'guides', 'tutorials', 'reference', 'examples'];
    const categorizedPattern = paths.some(path => 
      categories.some(cat => path.includes(`${cat}/`) || path.startsWith(`${cat}/`))
    );
    if (categorizedPattern) {
      indicators.push('categorized structure detected');
      if (type === 'sequential') type = 'mixed';
      else type = 'categorized';
      confidence += 0.4;
    }

    // Detect hierarchical pattern (multiple directory levels) - check for 3+ levels
    const hierarchicalPattern = paths.some(path => {
      const segments = path.split('/').filter(Boolean);
      return segments.length >= 3; // basePath/category/subcategory/file
    });
    if (hierarchicalPattern) {
      indicators.push('hierarchical directory structure detected');
      if (type === 'sequential') type = 'mixed';
      else if (type === 'categorized') type = 'hierarchical'; // Hierarchical takes precedence over categorized
      else type = 'hierarchical';
      confidence += 0.3;
    }

    // Generate recommendations based on pattern
    const recommendations = this.generatePatternRecommendations(results, type, indicators);

    return {
      type,
      confidence: Math.min(confidence, 1.0),
      indicators,
      recommendations
    };
  }

  /**
   * Generate recommendations based on detected pattern
   */
  private generatePatternRecommendations(
    results: DiscoveryResult[],
    patternType: DocumentPattern['type'],
    indicators: string[]
  ): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    const foundPaths = results.map(r => r.path);
    const baseDirs = [...new Set(foundPaths.map(p => p.substring(0, p.lastIndexOf('/'))))];

    switch (patternType) {
      case 'sequential':
        // Look for next numbers in sequence
        recommendations.push(...this.getSequentialRecommendations(foundPaths));
        break;

      case 'hierarchical':
        // Explore subdirectories of found directories
        recommendations.push(...this.getHierarchicalRecommendations(baseDirs));
        break;

      case 'categorized':
        // Look in common category directories
        recommendations.push(...this.getCategorizedRecommendations(baseDirs));
        break;

      case 'mixed':
        // Combine multiple strategies
        recommendations.push(
          ...this.getSequentialRecommendations(foundPaths),
          ...this.getCategorizedRecommendations(baseDirs)
        );
        break;

      default: // flat
        // Look for common files in same directories
        recommendations.push(...this.getFlatRecommendations(baseDirs));
    }

    return recommendations
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5); // Limit recommendations to prevent excessive requests
  }

  /**
   * Get sequential pattern recommendations
   */
  private getSequentialRecommendations(foundPaths: string[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    const numbers = foundPaths
      .map(path => {
        const match = path.match(/(\d+)[-_.]/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(n => n !== null) as number[];

    if (numbers.length > 0) {
      const maxNum = Math.max(...numbers);
      const baseDir = foundPaths[0].substring(0, foundPaths[0].lastIndexOf('/'));
      
      // Look for next few numbers in sequence
      for (let i = 1; i <= 3; i++) {
        const nextNum = String(maxNum + i).padStart(2, '0');
        recommendations.push({
          path: `${baseDir}/${nextNum}-*.md`,
          probability: 0.8 - (i * 0.2),
          reasoning: `Sequential pattern suggests ${nextNum}-prefixed files`
        });
      }
    }

    return recommendations;
  }

  /**
   * Get hierarchical pattern recommendations
   */
  private getHierarchicalRecommendations(baseDirs: string[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    
    for (const dir of baseDirs) {
      const commonSubdirs = ['advanced', 'basic', 'intro', 'setup', 'config'];
      commonSubdirs.forEach(subdir => {
        recommendations.push({
          path: `${dir}/${subdir}/README.md`,
          probability: 0.6,
          reasoning: `Hierarchical pattern suggests ${subdir} subdirectory`
        });
      });
    }

    return recommendations;
  }

  /**
   * Get categorized pattern recommendations
   */
  private getCategorizedRecommendations(baseDirs: string[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    const categories = ['api', 'guides', 'tutorials', 'reference', 'examples'];
    
    const rootDir = baseDirs.find(dir => !dir.includes('/')) || baseDirs[0];
    
    categories.forEach(category => {
      recommendations.push({
        path: `${rootDir}/${category}/README.md`,
        probability: 0.7,
        reasoning: `Categorized pattern suggests ${category} directory`
      });
    });

    return recommendations;
  }

  /**
   * Get flat pattern recommendations
   */
  private getFlatRecommendations(baseDirs: string[]): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    const commonFiles = ['installation.md', 'configuration.md', 'api.md', 'examples.md'];
    
    for (const dir of baseDirs) {
      commonFiles.forEach(file => {
        recommendations.push({
          path: `${dir}/${file}`,
          probability: 0.5,
          reasoning: `Flat pattern suggests common files in same directory`
        });
      });
    }

    return recommendations;
  }

  /**
   * Try to discover a document at a specific path
   */
  private async tryDiscoverDocument(path: string): Promise<Document | null> {
    this.stats.totalRequests++;
    
    try {
      // Check cache first
      const cached = this.cache.get(path);
      if (cached) return cached;

      // Use environment adapter if available
      let response: Response;
      if (this.environment && this.config.enableEnvironmentOptimization) {
        const adapter = createEnvironmentAdapter(this.environment);
        response = await adapter.executeRequest(path);
      } else {
        response = await fetch(path);
      }

      if (!response.ok) {
        return null;
      }

      const content = await response.text();
      const document = this.createDocumentFromContent(path, content);
      
      // Cache successful discoveries
      this.cache.set(path, document);
      this.stats.successfulRequests++;
      
      // Record for monitoring
      this.requestMonitor.record(path, { success: true, fromCache: false });
      
      return document;

    } catch (error) {
      this.requestMonitor.record(path, { success: false, error });
      return null;
    }
  }

  /**
   * Create Document object from path and content
   */
  private createDocumentFromContent(path: string, content: string): Document {
    const filename = path.split('/').pop() || 'unknown';
    const title = this.extractTitle(content, filename);
    
    return {
      id: this.generateId(path),
      title,
      file: path,
      content,
      category: this.extractCategory(path),
      order: this.extractOrder(content, filename),
      tags: this.extractTags(content),
      description: this.extractDescription(content)
    };
  }

  /**
   * Should continue discovery based on current results
   */
  shouldContinueDiscovery(results: DiscoveryResult[]): boolean {
    // Stop if we've hit the request limit
    if (this.stats.totalRequests >= this.config.maxRequests) {
      this.stats.stoppedReason = 'max-requests';
      return false;
    }

    // Stop if pattern recognition is confident enough
    if (this.stats.patternConfidence >= this.config.patternConfidenceThreshold) {
      this.stats.stoppedReason = 'pattern-complete';
      return false;
    }

    // Continue discovery
    return true;
  }

  /**
   * Initialize environment detection for optimizations
   */
  private async initializeEnvironment(): Promise<void> {
    try {
      const detector = getEnvironmentDetector();
      this.environment = await detector.detect();
    } catch (error) {
      console.warn('Environment detection failed, using default behavior');
      this.environment = null;
    }
  }

  /**
   * Extract documents from discovery results
   */
  private extractDocuments(results: DiscoveryResult[]): Document[] {
    return results
      .sort((a, b) => a.requestOrder - b.requestOrder)
      .map(r => r.document);
  }

  /**
   * Get fallback paths when smart discovery yields few results
   */
  private getFallbackPaths(basePath: string, existingResults: DiscoveryResult[]): string[] {
    const existingPaths = existingResults.map(r => r.path);
    const fallbackPaths = [
      `${basePath}/documentation/README.md`,
      `${basePath}/guide/README.md`,
      `${basePath}/manual/README.md`
    ];

    return fallbackPaths.filter(path => !existingPaths.includes(path));
  }

  /**
   * Resolve relative path to absolute
   */
  private resolvePath(basePath: string, relativePath: string): string {
    if (relativePath.includes('*')) {
      // Handle wildcard patterns - for now, try most common replacement
      return relativePath.replace('*', 'index');
    }
    return relativePath.startsWith('/') ? relativePath : `${basePath}/${relativePath}`;
  }

  /**
   * Get discovery statistics
   */
  getStats(): DiscoveryStats {
    return { ...this.stats };
  }

  // Helper methods for document processing (similar to auto-discovery.ts)
  private extractTitle(content: string, filename: string): string {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();
    
    return filename
      .replace(/\.md$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^Readme$/i, 'Overview');
  }

  private extractCategory(path: string): string | undefined {
    const pathParts = path.split('/');
    if (pathParts.length > 2) {
      return pathParts[pathParts.length - 2];
    }
    return undefined;
  }

  private extractOrder(content: string, filename: string): number | undefined {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const orderMatch = frontmatterMatch[1].match(/^order:\s*(\d+)$/m);
      if (orderMatch) return parseInt(orderMatch[1]);
    }

    const numericMatch = filename.match(/^(\d+)[-_.]/);
    if (numericMatch) return parseInt(numericMatch[1]);

    return undefined;
  }

  private extractTags(content: string): string[] | undefined {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const tagsMatch = frontmatterMatch[1].match(/^tags:\s*\[(.*?)\]$/m);
      if (tagsMatch) {
        return tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
      }
    }
    return undefined;
  }

  private extractDescription(content: string): string | undefined {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const descMatch = frontmatterMatch[1].match(/^description:\s*(.+)$/m);
      if (descMatch) return descMatch[1].trim().replace(/['"]/g, '');
    }

    const contentAfterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    const contentAfterTitle = contentAfterFrontmatter.replace(/^#.*\n/, '');
    const firstPara = contentAfterTitle.match(/^([^#\n].+?)(?:\n\n|\n#|$)/);
    if (firstPara) {
      return firstPara[1].trim().substring(0, 200) + (firstPara[1].length > 200 ? '...' : '');
    }

    return undefined;
  }

  private generateId(path: string): string {
    return path
      .replace(/^.*\//, '')
      .replace(/\.md$/, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
  }
}

/**
 * Factory function for easy instantiation
 */
export function createProgressiveDiscovery(config?: ProgressiveDiscoveryConfig): ProgressiveDocumentDiscovery {
  return new ProgressiveDocumentDiscovery(config);
}

/**
 * Quick helper function that replaces the original auto-discovery
 */
export async function progressiveAutoDiscoverDocs(
  basePath = './docs',
  config?: ProgressiveDiscoveryConfig
): Promise<Document[]> {
  const discovery = createProgressiveDiscovery(config);
  return discovery.discoverDocuments(basePath);
}