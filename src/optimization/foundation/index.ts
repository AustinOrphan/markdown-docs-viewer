/**
 * Foundation utilities for the Zero-Config Optimization system
 * 
 * This module provides the core infrastructure components used across
 * all optimization features:
 * 
 * - FeatureFlags: Runtime feature flag management with persistence
 */

// Feature flags exports
export {
  FeatureFlags,
  FeatureFlagsImpl,
  FeatureFlagsStatic,
  OptimizationFlags,
  ABTestingHelpers,
  FeatureFlagsDev,
  type IFeatureFlags
} from './FeatureFlags';

// Import for local use
import { FeatureFlags, FeatureFlagsImpl } from './FeatureFlags';
import { getGlobalPerformanceMonitor, resetGlobalPerformanceMonitor, PerformanceMonitor } from './PerformanceMonitor';
import { createDiscoveryCache, DiscoveryCache, configCache, documentCache, metadataCache } from './DiscoveryCache';
import { getGlobalRequestMonitor, resetGlobalRequestMonitor, RequestMonitor } from './RequestMonitor';

// Performance monitoring exports (Agent A)
export {
  PerformanceMonitor,
  getGlobalPerformanceMonitor,
  resetGlobalPerformanceMonitor,
  type PerformanceMeasurement,
  type PerformanceReport
} from './PerformanceMonitor';

// Cache system exports (Agent A)
export {
  DiscoveryCache,
  createDiscoveryCache,
  configCache,
  documentCache,
  metadataCache
} from './DiscoveryCache';

// Request monitoring exports (Agent A)
export {
  RequestMonitor,
  getGlobalRequestMonitor,
  resetGlobalRequestMonitor,
  createMonitoredFetch,
  type RequestMetrics,
  type RequestStats,
  type RequestListener,
  type PendingRequest
} from './RequestMonitor';

// Environment utilities exports (Agent B)
export {
  EnvironmentUtils,
  EnvironmentCache,
  HostingEnvironment,
  EnvironmentCapabilities,
  EnvironmentInfo
} from './environment-utils';

// Utility types and interfaces for foundation components
export interface FoundationConfig {
  performance?: {
    enabled?: boolean;
    maxReports?: number;
  };
  cache?: {
    enabled?: boolean;
    maxEntries?: number;
    defaultTTL?: number;
    persistToStorage?: boolean;
  };
  requests?: {
    deduplicationEnabled?: boolean;
    maxConcurrentRequests?: number;
    retryAttempts?: number;
  };
  featureFlags?: {
    initialFlags?: Record<string, boolean>;
    enabledByDefault?: string[];
  };
}

/**
 * Initialize foundation components with configuration
 */
export function initializeFoundation(config: FoundationConfig = {}): {
  performanceMonitor: PerformanceMonitor;
  cache: DiscoveryCache;
  requestMonitor: RequestMonitor;
  featureFlags: FeatureFlagsImpl;
} {
  const performanceMonitor = getGlobalPerformanceMonitor();
  
  const cache = createDiscoveryCache({
    maxEntries: config.cache?.maxEntries,
    defaultTTL: config.cache?.defaultTTL,
    persistToStorage: config.cache?.persistToStorage
  });

  const requestMonitor = getGlobalRequestMonitor();
  if (config.requests) {
    requestMonitor.configure({
      deduplicationEnabled: config.requests.deduplicationEnabled,
      maxConcurrentRequests: config.requests.maxConcurrentRequests
    });
  }

  const featureFlags = FeatureFlagsImpl.getInstance();
  if (config.featureFlags?.initialFlags) {
    featureFlags.setFlags(config.featureFlags.initialFlags);
  }
  if (config.featureFlags?.enabledByDefault) {
    featureFlags.enableFlags(config.featureFlags.enabledByDefault);
  }

  return {
    performanceMonitor,
    cache,
    requestMonitor,
    featureFlags
  };
}

/**
 * Reset all foundation components
 */
export function resetFoundation(): void {
  resetGlobalPerformanceMonitor();
  resetGlobalRequestMonitor();
  configCache.clear();
  documentCache.clear();
  metadataCache.clear();
  FeatureFlags.reset();
}

/**
 * Get comprehensive foundation statistics
 */
export function getFoundationStats() {
  const performanceMonitor = getGlobalPerformanceMonitor();
  const requestMonitor = getGlobalRequestMonitor();

  return {
    performance: performanceMonitor.getStats(),
    requests: requestMonitor.getStats(),
    cache: {
      config: configCache.getStats(),
      documents: documentCache.getStats(),
      metadata: metadataCache.getStats()
    },
    featureFlags: {
      enabled: FeatureFlags.getEnabledFlags(),
      all: FeatureFlags.getAll()
    },
    timestamp: Date.now()
  };
}