/**
 * Shared types for the discovery system
 * 
 * These interfaces define the common data structures used across
 * all discovery algorithms (manifest, smart config, progressive document discovery).
 */

/**
 * Result of a discovery operation
 */
export interface DiscoveryResult {
  config: DocumentationConfig;
  documents: DocumentInfo[];
  structure: DocumentStructure;
  metadata: DiscoveryMetadata;
}

/**
 * Configuration discovered for documentation
 */
export interface DocumentationConfig {
  title: string;
  theme?: string;
  source: DocumentSource;
  search?: SearchConfig;
  navigation?: NavigationConfig;
  export?: ExportConfig;
}

/**
 * Document source configuration
 */
export interface DocumentSource {
  type: 'local' | 'url' | 'github' | 'content';
  basePath?: string;
  branch?: string;
  headers?: Record<string, string>;
  [key: string]: any;
}

/**
 * Information about a discovered document
 */
export interface DocumentInfo {
  id: string;
  title: string;
  url: string;
  path: string;
  category?: string;
  lastModified?: Date;
  size?: number;
  hash?: string;
}

/**
 * Structure of the documentation
 */
export interface DocumentStructure {
  type: 'hierarchical' | 'flat';
  categories: string[];
  order?: string[];
}

/**
 * Metadata about the discovery process
 */
export interface DiscoveryMetadata {
  discoveryMethod: 'manifest' | 'smart-config' | 'progressive' | 'fallback';
  requestCount: number;
  cacheHit: boolean;
  timestamp: number;
  confidence: number; // 0-1, how confident we are in the results
  source: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Search configuration
 */
export interface SearchConfig {
  enabled: boolean;
  placeholder?: string;
  fields?: string[];
  filters?: FilterConfig[];
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  enabled: boolean;
  collapsed?: boolean;
  showCategories?: boolean;
  customOrder?: string[];
}

/**
 * Export configuration
 */
export interface ExportConfig {
  enabled: boolean;
  formats?: ('pdf' | 'html' | 'json')[];
}

/**
 * Filter configuration for search
 */
export interface FilterConfig {
  field: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: string[];
  label?: string;
}

/**
 * Discovery algorithm interface
 */
export interface DiscoveryAlgorithm {
  /**
   * Attempt to discover documentation configuration and documents
   */
  discover(basePath: string, options?: any): Promise<DiscoveryResult | null>;

  /**
   * Get algorithm-specific statistics
   */
  getStats(): any;

  /**
   * Reset algorithm state
   */
  reset(): void;
}

/**
 * Discovery chain configuration
 */
export interface DiscoveryChainConfig {
  algorithms: DiscoveryAlgorithm[];
  timeout?: number;
  fallbackEnabled?: boolean;
  cacheEnabled?: boolean;
}

/**
 * Discovery chain result with fallback information
 */
export interface DiscoveryChainResult extends DiscoveryResult {
  algorithmUsed: string;
  fallbacksTriggered: string[];
  totalTime: number;
}