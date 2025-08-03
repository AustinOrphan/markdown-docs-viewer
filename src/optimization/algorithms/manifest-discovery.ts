/**
 * Manifest-Based Discovery System
 * 
 * Achieves zero HTTP requests when a valid documentation manifest exists.
 * This is the ultimate optimization that can eliminate all discovery requests
 * when manifest files are available and current.
 */

import { FeatureFlags, OptimizationFlags } from '../foundation/FeatureFlags';
import { createDiscoveryCache } from '../foundation/DiscoveryCache';
import { getGlobalRequestMonitor } from '../foundation/RequestMonitor';
import { DiscoveryResult } from '../config/DiscoveryTypes';

/**
 * Documentation manifest structure
 */
export interface DocumentManifest {
  version: string;
  generatedAt: string; // ISO timestamp
  config: {
    title: string;
    theme?: string;
    source: any; // Configuration source details
  };
  documents: DocumentEntry[];
  structure: {
    type: 'hierarchical' | 'flat';
    categories: string[];
  };
}

/**
 * Individual document entry in manifest
 */
export interface DocumentEntry {
  id: string;
  title: string;
  path: string;
  lastModified: string; // ISO timestamp
  category?: string;
  size?: number;
  hash?: string;
}

/**
 * Manifest validation result
 */
export interface ManifestValidationResult {
  isValid: boolean;
  isStale: boolean;
  errors: string[];
  stalePaths: string[];
  confidence: number; // 0-1, how confident we are in the manifest
}

/**
 * Manifest location types
 */
export enum ManifestLocation {
  HIDDEN_FILE = '.docs-manifest.json',
  VISIBLE_FILE = 'docs-manifest.json',
  PACKAGE_JSON = 'package.json',
}

/**
 * Manifest discovery configuration
 */
export interface ManifestDiscoveryConfig {
  enabled: boolean;
  searchLocations: ManifestLocation[];
  validationEnabled: boolean;
  stalenessThreshold: number; // milliseconds
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
}

/**
 * Default configuration for manifest discovery
 */
const DEFAULT_CONFIG: ManifestDiscoveryConfig = {
  enabled: true,
  searchLocations: [
    ManifestLocation.HIDDEN_FILE,
    ManifestLocation.VISIBLE_FILE,
    ManifestLocation.PACKAGE_JSON,
  ],
  validationEnabled: true,
  stalenessThreshold: 5 * 60 * 1000, // 5 minutes
  cacheEnabled: true,
  cacheTTL: 30 * 60 * 1000, // 30 minutes
};

/**
 * Manifest-based discovery implementation
 * 
 * This class implements the ultimate optimization: zero HTTP requests
 * when a valid and current manifest exists.
 */
export class ManifestDiscovery {
  private config: ManifestDiscoveryConfig;
  private cache = createDiscoveryCache<DocumentManifest>();
  private requestMonitor = getGlobalRequestMonitor();
  
  constructor(config: Partial<ManifestDiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Attempt to discover documentation using manifest files
   * Returns null if no valid manifest found, triggering fallback discovery
   */
  public async discoverFromManifest(basePath: string): Promise<DiscoveryResult | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      // Try to load manifest
      const manifest = await this.loadManifest(basePath);
      if (!manifest) {
        return null;
      }

      // Validate manifest if enabled
      if (this.config.validationEnabled) {
        const validation = await this.validateManifest(manifest, basePath);
        if (!validation.isValid || validation.isStale) {
          // Manifest is invalid or stale, fall back to discovery
          return null;
        }
      }

      // Convert manifest to discovery result
      return this.manifestToDiscoveryResult(manifest, basePath);

    } catch (error) {
      // Error loading or processing manifest, fall back to discovery
      console.warn('Manifest discovery failed, falling back to standard discovery:', error);
      return null;
    }
  }

  /**
   * Load manifest from available locations
   */
  public async loadManifest(basePath: string): Promise<DocumentManifest | null> {
    // Check cache first
    const cacheKey = `manifest:${basePath}`;
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Try each location in order
    for (const location of this.config.searchLocations) {
      try {
        const manifest = await this.loadFromLocation(basePath, location);
        if (manifest) {
          // Cache the result
          if (this.config.cacheEnabled) {
            this.cache.set(cacheKey, manifest, this.config.cacheTTL);
          }
          return manifest;
        }
      } catch (error) {
        // Continue to next location
        continue;
      }
    }

    return null;
  }

  /**
   * Load manifest from specific location
   */
  private async loadFromLocation(basePath: string, location: ManifestLocation): Promise<DocumentManifest | null> {
    const url = this.buildManifestUrl(basePath, location);
    
    try {
      const response = await this.requestMonitor.fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.success || !response.data.ok) {
        return null;
      }

      const data = await response.data.json();
      
      if (location === ManifestLocation.PACKAGE_JSON) {
        // Extract from package.json
        return data.documentationManifest || null;
      } else {
        // Direct manifest file
        return this.validateManifestStructure(data) ? data : null;
      }

    } catch (error) {
      return null;
    }
  }

  /**
   * Build URL for manifest location
   */
  private buildManifestUrl(basePath: string, location: ManifestLocation): string {
    const cleanBasePath = basePath.replace(/\/+$/, '');
    return `${cleanBasePath}/${location}`;
  }

  /**
   * Validate manifest structure
   */
  private validateManifestStructure(data: any): data is DocumentManifest {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.generatedAt === 'string' &&
      data.config &&
      typeof data.config.title === 'string' &&
      Array.isArray(data.documents) &&
      data.structure &&
      typeof data.structure.type === 'string' &&
      Array.isArray(data.structure.categories)
    );
  }

  /**
   * Validate manifest is current and accurate
   */
  public async validateManifest(manifest: DocumentManifest, basePath: string): Promise<ManifestValidationResult> {
    const result: ManifestValidationResult = {
      isValid: true,
      isStale: false,
      errors: [],
      stalePaths: [],
      confidence: 1.0,
    };

    try {
      // Check manifest age
      const generatedAt = new Date(manifest.generatedAt).getTime();
      const now = Date.now();
      const age = now - generatedAt;

      if (age > this.config.stalenessThreshold) {
        result.isStale = true;
        result.errors.push(`Manifest is ${Math.round(age / 1000)}s old, threshold is ${Math.round(this.config.stalenessThreshold / 1000)}s`);
        result.confidence *= 0.7;
      }

      // Validate document paths (sample a few to avoid too many requests)
      const sampleSize = Math.min(3, manifest.documents.length);
      const sampleDocuments = manifest.documents.slice(0, sampleSize);

      for (const doc of sampleDocuments) {
        try {
          const url = `${basePath.replace(/\/+$/, '')}/${doc.path}`;
          const response = await this.requestMonitor.fetch(url, {
            method: 'HEAD',
            timeout: 5000,
          });

          if (!response.success) {
            result.stalePaths.push(doc.path);
            result.confidence *= 0.8;
          }
        } catch (error) {
          result.stalePaths.push(doc.path);
          result.confidence *= 0.8;
        }
      }

      // If too many paths are stale, mark as invalid
      if (result.stalePaths.length > sampleSize / 2) {
        result.isValid = false;
        result.errors.push(`Too many stale paths: ${result.stalePaths.length}/${sampleSize}`);
      }

      // Low confidence means manifest is unreliable
      if (result.confidence < 0.5) {
        result.isValid = false;
        result.errors.push(`Low confidence: ${result.confidence}`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Convert manifest to discovery result
   */
  private manifestToDiscoveryResult(manifest: DocumentManifest, basePath: string): DiscoveryResult {
    const cleanBasePath = basePath.replace(/\/+$/, '');
    
    return {
      config: {
        title: manifest.config.title,
        theme: manifest.config.theme || 'default-light',
        source: {
          type: 'local',
          basePath: cleanBasePath,
          ...manifest.config.source,
        },
      },
      documents: manifest.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: `${cleanBasePath}/${doc.path}`,
        path: doc.path,
        category: doc.category,
        lastModified: doc.lastModified ? new Date(doc.lastModified) : undefined,
      })),
      structure: {
        type: manifest.structure.type,
        categories: manifest.structure.categories,
      },
      metadata: {
        discoveryMethod: 'manifest',
        requestCount: 1, // Only the manifest request
        cacheHit: false,
        timestamp: Date.now(),
        confidence: 1.0,
        source: 'manifest-discovery',
      },
    };
  }

  /**
   * Generate manifest from discovered documents
   */
  public generateManifest(config: any, documents: any[]): DocumentManifest {
    const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];
    
    return {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      config: {
        title: config.title || 'Documentation',
        theme: config.theme || 'default-light',
        source: config.source || {},
      },
      documents: documents.map(doc => ({
        id: doc.id || this.generateDocumentId(doc.path),
        title: doc.title || this.extractTitleFromPath(doc.path),
        path: doc.path,
        lastModified: doc.lastModified ? doc.lastModified.toISOString() : new Date().toISOString(),
        category: doc.category,
        size: doc.size,
        hash: doc.hash,
      })),
      structure: {
        type: categories.length > 0 ? 'hierarchical' : 'flat',
        categories,
      },
    };
  }

  /**
   * Save manifest for future use
   */
  public async saveManifest(manifest: DocumentManifest, basePath: string, location: ManifestLocation = ManifestLocation.HIDDEN_FILE): Promise<void> {
    // Note: In browser environment, we can't actually save files
    // This would be implemented in Node.js environments or via service worker
    console.info('Manifest saving not supported in browser environment', {
      manifest,
      basePath,
      location,
    });
  }

  /**
   * Check if manifest discovery is enabled
   */
  private isEnabled(): boolean {
    return (
      this.config.enabled &&
      FeatureFlags.isEnabled(OptimizationFlags.MANIFEST_DISCOVERY)
    );
  }

  /**
   * Generate document ID from path
   */
  private generateDocumentId(path: string): string {
    return path
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  }

  /**
   * Extract title from file path
   */
  private extractTitleFromPath(path: string): string {
    const filename = path.split('/').pop() || path;
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    // Convert kebab-case or snake_case to Title Case
    return nameWithoutExt
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get discovery statistics
   */
  public getStats() {
    return {
      config: { ...this.config },
      cacheStats: this.cache.getStats(),
      requestStats: this.requestMonitor.getStats(),
    };
  }

  /**
   * Reset cache and state
   */
  public reset(): void {
    this.cache.clear();
  }
}

/**
 * Singleton instance for global use
 */
let globalManifestDiscovery: ManifestDiscovery | null = null;

/**
 * Get global manifest discovery instance
 */
export function getGlobalManifestDiscovery(config?: Partial<ManifestDiscoveryConfig>): ManifestDiscovery {
  if (!globalManifestDiscovery) {
    globalManifestDiscovery = new ManifestDiscovery(config);
  }
  return globalManifestDiscovery;
}

/**
 * Reset global manifest discovery instance
 */
export function resetGlobalManifestDiscovery(): void {
  if (globalManifestDiscovery) {
    globalManifestDiscovery.reset();
  }
  globalManifestDiscovery = null;
}