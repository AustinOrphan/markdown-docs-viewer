/**
 * Week 3 Production Utilities
 * 
 * Helper utilities for production environment detection, configuration,
 * and readiness validation for optimization deployment
 */

import { FeatureFlags } from '../foundation/FeatureFlags';
import { getGlobalPerformanceMonitor } from '../foundation/PerformanceMonitor';
import { ProductionPerformanceConfig } from './performance-optimizer';

export interface ProductionEnvironmentInfo {
  environment: 'development' | 'staging' | 'production' | 'unknown';
  hosting: 'github-pages' | 'netlify' | 'vercel' | 'cloudflare' | 'aws' | 'custom' | 'unknown';
  capabilities: {
    serviceWorker: boolean;
    webWorkers: boolean;
    indexedDB: boolean;
    webAssembly: boolean;
    http2: boolean;
    compression: boolean;
  };
  performance: {
    connectionType: string;
    deviceMemory: number;
    hardwareConcurrency: number;
    isMobile: boolean;
    isLowEndDevice: boolean;
  };
  features: {
    smartConfigDiscovery: boolean;
    progressiveDocumentDiscovery: boolean;
    requestPooling: boolean;
    enhancedErrorHandling: boolean;
  };
}

/**
 * Production utilities for environment detection and optimization management
 */
export class ProductionUtils {
  /**
   * Detect current production environment
   */
  static detectProductionEnvironment(): ProductionEnvironmentInfo {
    const performanceMonitor = getGlobalPerformanceMonitor();
    const detectionMeasure = performanceMonitor.startMeasure('environment-detection');

    try {
      const info: ProductionEnvironmentInfo = {
        environment: this.detectEnvironmentType(),
        hosting: this.detectHostingProvider(),
        capabilities: this.detectBrowserCapabilities(),
        performance: this.detectPerformanceCharacteristics(),
        features: this.detectEnabledFeatures(),
      };

      performanceMonitor.endMeasure('environment-detection');
      return info;

    } catch (error) {
      performanceMonitor.endMeasure('environment-detection');
      console.warn('Environment detection failed:', error);
      
      // Return safe defaults
      return {
        environment: 'unknown',
        hosting: 'unknown',
        capabilities: {
          serviceWorker: false,
          webWorkers: false,
          indexedDB: false,
          webAssembly: false,
          http2: false,
          compression: false,
        },
        performance: {
          connectionType: 'unknown',
          deviceMemory: 4,
          hardwareConcurrency: 2,
          isMobile: false,
          isLowEndDevice: false,
        },
        features: {
          smartConfigDiscovery: false,
          progressiveDocumentDiscovery: false,
          requestPooling: false,
          enhancedErrorHandling: false,
        },
      };
    }
  }

  /**
   * Get production-optimized configuration based on environment
   */
  static getProductionConfig(envInfo?: ProductionEnvironmentInfo): ProductionPerformanceConfig {
    const env = envInfo || this.detectProductionEnvironment();

    // Base configuration
    const config: ProductionPerformanceConfig = {
      memoryThresholds: {
        warning: 50,
        critical: 100,
        maxCacheSize: 20,
      },
      cacheOptimization: {
        targetHitRate: 0.9,
        compressionEnabled: env.capabilities.compression,
        warmingStrategy: 'predictive',
        evictionPolicy: 'lru',
      },
      networkOptimization: {
        requestCoalescing: true,
        mobileOptimizations: env.performance.isMobile,
        http2PushEnabled: env.capabilities.http2,
        maxConcurrentRequests: env.performance.isMobile ? 4 : 6,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 1.5,
          initialDelay: 100,
        },
      },
      garbageCollection: {
        enableMemoryPressureMonitoring: true,
        forceGCOnThreshold: env.performance.isLowEndDevice,
        memoryLeakDetection: env.environment === 'production',
      },
    };

    // Environment-specific optimizations
    if (env.environment === 'production') {
      // Production: Conservative but effective settings
      config.memoryThresholds.warning = 40;
      config.memoryThresholds.critical = 80;
      config.cacheOptimization.targetHitRate = 0.95;
      config.networkOptimization.maxConcurrentRequests = env.performance.isMobile ? 3 : 5;
    } else if (env.environment === 'staging') {
      // Staging: More aggressive for testing
      config.cacheOptimization.warmingStrategy = 'eager';
      config.networkOptimization.maxConcurrentRequests = 8;
    } else if (env.environment === 'development') {
      // Development: Less aggressive, more debugging
      config.memoryThresholds.warning = 100;
      config.memoryThresholds.critical = 200;
      config.garbageCollection.memoryLeakDetection = true;
    }

    // Mobile-specific optimizations
    if (env.performance.isMobile) {
      config.memoryThresholds.warning = 30;
      config.memoryThresholds.critical = 60;
      config.memoryThresholds.maxCacheSize = 10;
      config.cacheOptimization.compressionEnabled = true;
      config.networkOptimization.maxConcurrentRequests = 3;
    }

    // Low-end device optimizations
    if (env.performance.isLowEndDevice) {
      config.memoryThresholds.warning = 20;
      config.memoryThresholds.critical = 40;
      config.memoryThresholds.maxCacheSize = 5;
      config.cacheOptimization.warmingStrategy = 'lazy';
      config.networkOptimization.maxConcurrentRequests = 2;
      config.garbageCollection.forceGCOnThreshold = true;
    }

    // Slow connection optimizations
    if (env.performance.connectionType === '2g' || env.performance.connectionType === '3g') {
      config.networkOptimization.maxConcurrentRequests = 2;
      config.networkOptimization.retryPolicy.maxRetries = 5;
      config.networkOptimization.retryPolicy.backoffMultiplier = 2.0;
      config.cacheOptimization.compressionEnabled = true;
    }

    return config;
  }

  /**
   * Validate production readiness
   */
  static validateProductionReadiness(): {
    ready: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;

    try {
      const env = this.detectProductionEnvironment();

      // Check feature enablement (25 points)
      let featureScore = 0;
      if (env.features.smartConfigDiscovery) featureScore += 7;
      if (env.features.progressiveDocumentDiscovery) featureScore += 7;
      if (env.features.requestPooling) featureScore += 6;
      if (env.features.enhancedErrorHandling) featureScore += 5;
      score += featureScore;

      if (featureScore < 20) {
        issues.push('Critical optimization features are disabled');
        recommendations.push('Enable Smart Config Discovery and Progressive Document Discovery for optimal performance');
      }

      // Check browser capabilities (20 points)
      let capabilityScore = 0;
      if (env.capabilities.serviceWorker) capabilityScore += 5;
      if (env.capabilities.webWorkers) capabilityScore += 4;
      if (env.capabilities.indexedDB) capabilityScore += 4;
      if (env.capabilities.compression) capabilityScore += 4;
      if (env.capabilities.http2) capabilityScore += 3;
      score += capabilityScore;

      if (capabilityScore < 15) {
        issues.push('Limited browser capabilities detected');
        recommendations.push('Consider progressive enhancement strategies for older browsers');
      }

      // Check performance characteristics (20 points)
      let perfScore = 0;
      if (env.performance.deviceMemory >= 4) perfScore += 5;
      if (env.performance.hardwareConcurrency >= 4) perfScore += 5;
      if (!env.performance.isLowEndDevice) perfScore += 5;
      if (env.performance.connectionType !== '2g' && env.performance.connectionType !== '3g') perfScore += 5;
      score += perfScore;

      if (perfScore < 15) {
        issues.push('Limited device performance detected');
        recommendations.push('Enable low-end device optimizations and aggressive memory management');
      }

      // Check hosting environment (15 points)
      if (env.hosting !== 'unknown') {
        score += 10;
        if (env.hosting === 'netlify' || env.hosting === 'vercel' || env.hosting === 'cloudflare') {
          score += 5; // Bonus for optimized hosting
        }
      } else {
        issues.push('Unknown hosting environment');
        recommendations.push('Configure hosting-specific optimizations for better performance');
      }

      // Check environment type (10 points)
      if (env.environment === 'production') {
        score += 10;
      } else if (env.environment === 'staging') {
        score += 7;
      } else if (env.environment === 'development') {
        score += 3;
      } else {
        issues.push('Unknown environment type');
        recommendations.push('Set proper environment indicators for optimal configuration');
      }

      // Check error handling (10 points)
      if (env.features.enhancedErrorHandling) {
        score += 10;
      } else {
        issues.push('Enhanced error handling is disabled');
        recommendations.push('Enable production error handling for better reliability');
      }

      const ready = score >= 70 && issues.length === 0;

      return {
        ready,
        score: Math.min(score, maxScore),
        issues,
        recommendations,
      };

    } catch (error) {
      return {
        ready: false,
        score: 0,
        issues: ['Production readiness validation failed'],
        recommendations: ['Review environment setup and try again'],
      };
    }
  }

  // Private helper methods
  private static detectEnvironmentType(): ProductionEnvironmentInfo['environment'] {
    // Check various environment indicators
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'production') return 'production';
      if (nodeEnv === 'staging') return 'staging';
      if (nodeEnv === 'development') return 'development';
    }

    // Check window location for environment clues
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
      }
      if (hostname.includes('staging') || hostname.includes('preview')) {
        return 'staging';
      }
      if (hostname.includes('.netlify.app') || hostname.includes('.vercel.app')) {
        return hostname.includes('main') ? 'production' : 'staging';
      }
    }

    return 'unknown';
  }

  private static detectHostingProvider(): ProductionEnvironmentInfo['hosting'] {
    if (typeof window === 'undefined') return 'unknown';

    const hostname = window.location.hostname;
    const userAgent = navigator.userAgent;

    // Check for common hosting providers
    if (hostname.includes('.github.io') || hostname.includes('github.dev')) {
      return 'github-pages';
    }
    if (hostname.includes('.netlify.app') || hostname.includes('.netlify.com')) {
      return 'netlify';
    }
    if (hostname.includes('.vercel.app') || hostname.includes('.vercel.com')) {
      return 'vercel';
    }
    if (hostname.includes('.pages.dev') || hostname.includes('.workers.dev')) {
      return 'cloudflare';
    }
    if (hostname.includes('.amazonaws.com') || hostname.includes('.s3.')) {
      return 'aws';
    }

    // Check headers or other indicators if available
    // This would require server-side detection in a real implementation

    return 'custom';
  }

  private static detectBrowserCapabilities(): ProductionEnvironmentInfo['capabilities'] {
    const capabilities = {
      serviceWorker: 'serviceWorker' in navigator,
      webWorkers: typeof Worker !== 'undefined',
      indexedDB: 'indexedDB' in window,
      webAssembly: typeof WebAssembly !== 'undefined',
      http2: false, // Would need server-side detection
      compression: false, // Would need server-side detection
    };

    // Check for compression support
    if ('CompressionStream' in window) {
      capabilities.compression = true;
    }

    // HTTP/2 detection is complex and would typically be done server-side
    // For now, assume modern browsers support it
    if ('fetch' in window && 'ReadableStream' in window) {
      capabilities.http2 = true;
    }

    return capabilities;
  }

  private static detectPerformanceCharacteristics(): ProductionEnvironmentInfo['performance'] {
    const characteristics = {
      connectionType: 'unknown',
      deviceMemory: 4, // Default assumption
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowEndDevice: false,
    };

    // Connection type detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      characteristics.connectionType = connection.effectiveType || 'unknown';
    }

    // Device memory detection
    if ('deviceMemory' in navigator) {
      characteristics.deviceMemory = (navigator as any).deviceMemory;
    }

    // Low-end device heuristics
    characteristics.isLowEndDevice = 
      characteristics.deviceMemory < 2 ||
      characteristics.hardwareConcurrency < 2 ||
      (characteristics.isMobile && characteristics.connectionType === '2g');

    return characteristics;
  }

  private static detectEnabledFeatures(): ProductionEnvironmentInfo['features'] {
    return {
      smartConfigDiscovery: FeatureFlags.isEnabled('SMART_CONFIG_DISCOVERY'),
      progressiveDocumentDiscovery: FeatureFlags.isEnabled('PROGRESSIVE_DOCUMENT_DISCOVERY'),
      requestPooling: FeatureFlags.isEnabled('REQUEST_POOLING'),
      enhancedErrorHandling: FeatureFlags.isEnabled('ENHANCED_ERROR_HANDLING'),
    };
  }
}

/**
 * Quick environment detection helper
 */
export function detectProductionEnvironment(): ProductionEnvironmentInfo {
  return ProductionUtils.detectProductionEnvironment();
}

/**
 * Quick production config helper
 */
export function getProductionConfig(envInfo?: ProductionEnvironmentInfo): ProductionPerformanceConfig {
  return ProductionUtils.getProductionConfig(envInfo);
}

/**
 * Quick production readiness validation helper
 */
export function validateProductionReadiness() {
  return ProductionUtils.validateProductionReadiness();
}