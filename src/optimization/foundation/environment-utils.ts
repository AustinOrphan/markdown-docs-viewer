/**
 * Environment detection utilities for Week 1
 * Base utilities that will be used by the full EnvironmentDetector in Week 2
 */

/**
 * Basic hosting environment types
 */
export enum HostingEnvironment {
  GITHUB_PAGES = 'github_pages',
  NETLIFY = 'netlify', 
  VERCEL = 'vercel',
  LOCAL_DEV = 'local_dev',
  UNKNOWN = 'unknown',
}

/**
 * Environment capabilities that affect request behavior
 */
export interface EnvironmentCapabilities {
  corsSupport: boolean;
  headRequests: boolean;
  maxConcurrentRequests: number;
  supportsRangeRequests: boolean;
  hasCustomErrorPages: boolean;
  requiresAuthHeaders: boolean;
}

/**
 * Environment detection result
 */
export interface EnvironmentInfo {
  type: HostingEnvironment;
  confidence: number; // 0-1 scale
  indicators: string[];
  capabilities: EnvironmentCapabilities;
  detectedAt: Date;
}

/**
 * Basic platform detection helpers
 * These will be used by the full EnvironmentDetector in Week 2
 */
export class EnvironmentUtils {
  
  /**
   * Detect if running in GitHub Pages environment
   */
  static detectGitHubPages(): { detected: boolean; indicators: string[]; confidence: number } {
    const indicators: string[] = [];
    let confidence = 0;

    // Check hostname patterns
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname.toLowerCase();
      
      // Primary GitHub Pages domains
      if (hostname.endsWith('.github.io')) {
        indicators.push('github.io domain');
        confidence += 0.8;
      }
      
      // Custom domain with GitHub Pages
      if (hostname.includes('github') && !hostname.includes('api')) {
        indicators.push('github in hostname');
        confidence += 0.3;
      }
    }

    // Check for GitHub Pages specific headers or behaviors
    if (typeof document !== 'undefined') {
      // GitHub Pages often serves specific meta tags
      const generator = document.querySelector('meta[name="generator"]')?.getAttribute('content');
      if (generator?.toLowerCase().includes('github')) {
        indicators.push('github generator meta tag');
        confidence += 0.4;
      }
    }

    // Check user agent for GitHub Pages crawler patterns
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('github') || userAgent.includes('pages')) {
        indicators.push('github in user agent');
        confidence += 0.2;
      }
    }

    return {
      detected: confidence > 0.5,
      indicators,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Detect if running in Netlify environment
   */
  static detectNetlify(): { detected: boolean; indicators: string[]; confidence: number } {
    const indicators: string[] = [];
    let confidence = 0;

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname.toLowerCase();
      
      // Netlify domains
      if (hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.com')) {
        indicators.push('netlify domain');
        confidence += 0.8;
      }
    }

    // Check for Netlify-specific headers
    if (typeof document !== 'undefined') {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.src?.includes('netlify')) {
          indicators.push('netlify script detected');
          confidence += 0.3;
        }
      });
    }

    // Check for Netlify environment variables (if available)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NETLIFY) {
        indicators.push('NETLIFY env var');
        confidence += 0.6;
      }
    }

    return {
      detected: confidence > 0.5,
      indicators,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Detect if running in Vercel environment
   */
  static detectVercel(): { detected: boolean; indicators: string[]; confidence: number } {
    const indicators: string[] = [];
    let confidence = 0;

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname.toLowerCase();
      
      // Vercel domains
      if (hostname.endsWith('.vercel.app') || hostname.endsWith('.now.sh')) {
        indicators.push('vercel domain');
        confidence += 0.8;
      }
    }

    // Check for Vercel environment variables
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VERCEL) {
        indicators.push('VERCEL env var');
        confidence += 0.6;
      }
      if (process.env.VERCEL_ENV) {
        indicators.push('VERCEL_ENV detected');
        confidence += 0.4;
      }
    }

    return {
      detected: confidence > 0.5,
      indicators,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Detect if running in local development environment
   */
  static detectLocalDev(): { detected: boolean; indicators: string[]; confidence: number } {
    const indicators: string[] = [];
    let confidence = 0;

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname.toLowerCase();
      const port = window.location.port;
      
      // Common local development hosts
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        indicators.push('local hostname');
        confidence += 0.7;
      }
      
      // Common development ports
      if (port && ['3000', '3001', '5000', '5173', '8000', '8080', '8081'].includes(port)) {
        indicators.push('development port');
        confidence += 0.5;
      }
      
      // Protocol check
      if (window.location.protocol === 'file:') {
        indicators.push('file protocol');
        confidence += 0.8;
      }
    }

    // Check for development environment variables
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NODE_ENV === 'development') {
        indicators.push('NODE_ENV=development');
        confidence += 0.6;
      }
    }

    return {
      detected: confidence > 0.5,
      indicators,
      confidence: Math.min(confidence, 1)
    };
  }

  /**
   * Browser capability checks
   */
  static checkBrowserCapabilities(): Partial<EnvironmentCapabilities> {
    const capabilities: Partial<EnvironmentCapabilities> = {};

    // Check CORS support
    capabilities.corsSupport = typeof XMLHttpRequest !== 'undefined' && 
      'withCredentials' in new XMLHttpRequest();

    // Estimate max concurrent requests based on browser
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('chrome')) {
        capabilities.maxConcurrentRequests = 6;
      } else if (userAgent.includes('firefox')) {
        capabilities.maxConcurrentRequests = 6;
      } else if (userAgent.includes('safari')) {
        capabilities.maxConcurrentRequests = 6;
      } else {
        capabilities.maxConcurrentRequests = 4; // Conservative default
      }
    } else {
      capabilities.maxConcurrentRequests = 4;
    }

    return capabilities;
  }

  /**
   * Network condition detection
   */
  static detectNetworkConditions(): {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
  } {
    const result: any = {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true
    };

    // Check Network Information API if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        result.connectionType = connection.type;
        result.effectiveType = connection.effectiveType;
        result.downlink = connection.downlink;
      }
    }

    return result;
  }

  /**
   * Get default capabilities for a hosting environment
   */
  static getDefaultCapabilities(environment: HostingEnvironment): EnvironmentCapabilities {
    switch (environment) {
      case HostingEnvironment.GITHUB_PAGES:
        return {
          corsSupport: true,
          headRequests: false, // GitHub Pages often blocks HEAD requests
          maxConcurrentRequests: 4,
          supportsRangeRequests: false,
          hasCustomErrorPages: true,
          requiresAuthHeaders: false,
        };

      case HostingEnvironment.NETLIFY:
        return {
          corsSupport: true,
          headRequests: true,
          maxConcurrentRequests: 6,
          supportsRangeRequests: true,
          hasCustomErrorPages: true,
          requiresAuthHeaders: false,
        };

      case HostingEnvironment.VERCEL:
        return {
          corsSupport: true,
          headRequests: true,
          maxConcurrentRequests: 6,
          supportsRangeRequests: true,
          hasCustomErrorPages: true,
          requiresAuthHeaders: false,
        };

      case HostingEnvironment.LOCAL_DEV:
        return {
          corsSupport: false, // Often CORS issues in local dev
          headRequests: true,
          maxConcurrentRequests: 8,
          supportsRangeRequests: true,
          hasCustomErrorPages: false,
          requiresAuthHeaders: false,
        };

      case HostingEnvironment.UNKNOWN:
      default:
        return {
          corsSupport: true,
          headRequests: true,
          maxConcurrentRequests: 4, // Conservative default
          supportsRangeRequests: false,
          hasCustomErrorPages: false,
          requiresAuthHeaders: false,
        };
    }
  }

  /**
   * Quick environment detection (used for caching)
   */
  static quickDetect(): EnvironmentInfo {
    const detections = [
      { type: HostingEnvironment.GITHUB_PAGES, ...this.detectGitHubPages() },
      { type: HostingEnvironment.NETLIFY, ...this.detectNetlify() },
      { type: HostingEnvironment.VERCEL, ...this.detectVercel() },
      { type: HostingEnvironment.LOCAL_DEV, ...this.detectLocalDev() },
    ];

    // Find the detection with highest confidence
    const bestMatch = detections.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const environmentType = bestMatch.confidence > 0.5 ? bestMatch.type : HostingEnvironment.UNKNOWN;
    const capabilities = {
      ...this.getDefaultCapabilities(environmentType),
      ...this.checkBrowserCapabilities()
    };

    return {
      type: environmentType,
      confidence: bestMatch.confidence,
      indicators: bestMatch.indicators,
      capabilities,
      detectedAt: new Date()
    };
  }

  /**
   * Cache key generator for environment detection results
   */
  static generateCacheKey(): string {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const userAgent = typeof navigator !== 'undefined' ? 
      navigator.userAgent.slice(0, 50) : 'unknown';
    
    return `env-${hostname}-${btoa(userAgent).slice(0, 10)}`;
  }
}

/**
 * Simple environment cache for Week 1
 * Will be enhanced in Week 2 with the full DiscoveryCache system
 */
export class EnvironmentCache {
  private static readonly CACHE_KEY = 'mdv-environment-cache';
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  static get(): EnvironmentInfo | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp > this.CACHE_TTL) {
        this.clear();
        return null;
      }

      // Restore Date object
      data.info.detectedAt = new Date(data.info.detectedAt);
      return data.info;
    } catch {
      return null;
    }
  }

  static set(info: EnvironmentInfo): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const data = {
        info,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore cache errors
    }
  }

  static clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.CACHE_KEY);
      }
    } catch {
      // Ignore cache errors
    }
  }
}