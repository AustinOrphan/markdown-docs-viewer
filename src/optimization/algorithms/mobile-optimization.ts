/**
 * Mobile Network Optimization System
 * Adapts discovery and loading strategies based on network conditions and device capabilities
 */

import { DiscoveryResult } from './progressive-document-discovery';
import { Document } from '../../types';

/**
 * Network condition detection
 */
export interface NetworkConditions {
  speed: 'fast' | 'medium' | 'slow';
  type: '5g' | '4g' | '3g' | '2g' | 'wifi' | 'unknown';
  latency: number; // RTT in ms
  downlink: number; // Mbps
  uplink: number; // Mbps
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  saveData: boolean;
  rtt: number;
}

/**
 * Adaptive discovery strategy based on network conditions
 */
export interface AdaptiveDiscoveryStrategy {
  maxConcurrentRequests: number;
  requestTimeout: number;
  compressionEnabled: boolean;
  priorityMode: 'critical-only' | 'selective' | 'full';
  batchSize: number;
  retryAttempts: number;
  backoffMultiplier: number;
  prefetchEnabled: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

/**
 * Mobile device capabilities
 */
export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  screenSize: 'small' | 'medium' | 'large';
  memoryGB: number;
  processorCores: number;
  supportsPrefetch: boolean;
  supportsServiceWorker: boolean;
  maxConcurrentConnections: number;
}

/**
 * Mobile optimization analytics
 */
export interface MobileOptimizationAnalytics {
  networkChanges: number;
  strategyAdaptations: number;
  bandwidthSaved: number;
  latencyImprovement: number;
  batteryOptimization: number;
  userExperienceScore: number;
}

/**
 * Request compression options
 */
export interface CompressionOptions {
  enabled: boolean;
  method: 'gzip' | 'brotli' | 'deflate';
  level: number; // 1-9
  threshold: number; // Minimum size to compress (bytes)
}

/**
 * Mobile Network Optimization implementation
 */
export class MobileNetworkOptimization {
  private currentConditions: NetworkConditions | null = null;
  private deviceCapabilities: DeviceCapabilities;
  private currentStrategy: AdaptiveDiscoveryStrategy;
  private analytics: MobileOptimizationAnalytics;
  private strategyHistory: Array<{ timestamp: number; strategy: AdaptiveDiscoveryStrategy; reason: string }> = [];
  private networkMonitorInterval: number | null = null;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.currentStrategy = this.getDefaultStrategy();
    this.analytics = {
      networkChanges: 0,
      strategyAdaptations: 0,
      bandwidthSaved: 0,
      latencyImprovement: 0,
      batteryOptimization: 0,
      userExperienceScore: 7.0 // Start with neutral score
    };

    this.initializeNetworkMonitoring();
  }

  /**
   * Detect current network conditions
   */
  detectNetworkConditions(): NetworkConditions {
    if (typeof navigator === 'undefined') {
      return this.getDefaultNetworkConditions();
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return this.getDefaultNetworkConditions();
    }

    const conditions: NetworkConditions = {
      speed: this.categorizeSpeed(connection.downlink || 10),
      type: this.normalizeConnectionType(connection.type || connection.effectiveType || 'unknown'),
      latency: connection.rtt || 100,
      downlink: connection.downlink || 10,
      uplink: connection.uplink || 1,
      effectiveType: connection.effectiveType || '4g',
      saveData: connection.saveData || false,
      rtt: connection.rtt || 100
    };

    return conditions;
  }

  /**
   * Adapt discovery strategy based on current conditions
   */
  adaptDiscoveryStrategy(conditions?: NetworkConditions): AdaptiveDiscoveryStrategy {
    const networkConditions = conditions || this.currentConditions || this.detectNetworkConditions();
    this.currentConditions = networkConditions;

    const strategy = this.calculateOptimalStrategy(networkConditions);
    
    // Record strategy change
    if (JSON.stringify(strategy) !== JSON.stringify(this.currentStrategy)) {
      this.strategyHistory.push({
        timestamp: Date.now(),
        strategy: { ...strategy },
        reason: this.getStrategyChangeReason(networkConditions)
      });
      
      this.analytics.strategyAdaptations++;
      this.currentStrategy = strategy;
    }

    return strategy;
  }

  /**
   * Optimize request for mobile conditions
   */
  optimizeRequest(url: string, options: RequestInit = {}): RequestInit {
    const strategy = this.currentStrategy;
    const optimizedOptions: RequestInit = { ...options };

    // Apply timeout
    if (!optimizedOptions.signal) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), strategy.requestTimeout);
      optimizedOptions.signal = controller.signal;
    }

    // Add compression headers
    if (strategy.compressionEnabled) {
      const headers = new Headers(optimizedOptions.headers);
      headers.set('Accept-Encoding', 'gzip, br, deflate');
      optimizedOptions.headers = headers;
    }

    // Add cache directives for mobile
    if (this.deviceCapabilities.isMobile) {
      const headers = new Headers(optimizedOptions.headers);
      
      switch (strategy.cacheStrategy) {
        case 'aggressive':
          headers.set('Cache-Control', 'max-age=86400, stale-while-revalidate=604800');
          break;
        case 'moderate':
          headers.set('Cache-Control', 'max-age=3600, stale-while-revalidate=86400');
          break;
        case 'minimal':
          headers.set('Cache-Control', 'max-age=300, must-revalidate');
          break;
      }
      
      optimizedOptions.headers = headers;
    }

    return optimizedOptions;
  }

  /**
   * Batch requests for mobile efficiency
   */
  async batchRequests(urls: string[], options: RequestInit = {}): Promise<Response[]> {
    const strategy = this.currentStrategy;
    const batches: string[][] = [];
    
    // Split into batches
    for (let i = 0; i < urls.length; i += strategy.batchSize) {
      batches.push(urls.slice(i, i + strategy.batchSize));
    }

    const results: Response[] = [];

    // Process batches with concurrency control
    for (const batch of batches) {
      const batchPromises = batch.map(url => 
        this.executeWithRetry(url, this.optimizeRequest(url, options))
      );

      // Limit concurrent requests
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create error response for failed requests
          results.push(new Response(null, { status: 500, statusText: 'Request failed' }));
        }
      }

      // Add delay between batches on slow connections
      if (this.currentConditions?.speed === 'slow' && batches.length > 1) {
        await this.delay(strategy.backoffMultiplier * 100);
      }
    }

    return results;
  }

  /**
   * Prioritize documents based on mobile context
   */
  prioritizeDocuments(documents: Document[]): Document[] {
    if (this.currentStrategy.priorityMode === 'critical-only') {
      return this.filterCriticalDocuments(documents);
    }

    if (this.currentStrategy.priorityMode === 'selective') {
      return this.selectivelyPrioritizeDocuments(documents);
    }

    return documents; // Full mode
  }

  /**
   * Estimate data usage for requests
   */
  estimateDataUsage(documents: Document[]): number {
    let totalBytes = 0;
    
    for (const doc of documents) {
      // Estimate based on content size and metadata
      const contentSize = doc.content?.length || 5000; // Default estimate
      const metadataSize = JSON.stringify(doc).length;
      totalBytes += contentSize + metadataSize;
    }

    // Add overhead for headers and protocol
    return totalBytes * 1.2;
  }

  /**
   * Get current analytics
   */
  getAnalytics(): MobileOptimizationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get current strategy
   */
  getCurrentStrategy(): AdaptiveDiscoveryStrategy {
    return { ...this.currentStrategy };
  }

  /**
   * Get network conditions
   */
  getNetworkConditions(): NetworkConditions | null {
    return this.currentConditions ? { ...this.currentConditions } : null;
  }

  /**
   * Update analytics based on performance
   */
  updateAnalytics(metrics: {
    requestTime?: number;
    bandwidthUsed?: number;
    success?: boolean;
    userRating?: number;
  }): void {
    if (metrics.bandwidthUsed) {
      this.analytics.bandwidthSaved += this.estimateBandwidthSavings(metrics.bandwidthUsed);
    }

    if (metrics.requestTime) {
      this.analytics.latencyImprovement += this.calculateLatencyImprovement(metrics.requestTime);
    }

    if (metrics.userRating) {
      // Exponential moving average for user experience score
      this.analytics.userExperienceScore = 
        0.9 * this.analytics.userExperienceScore + 0.1 * metrics.userRating;
    }

    if (this.deviceCapabilities.isMobile) {
      this.analytics.batteryOptimization += this.estimateBatteryOptimization();
    }
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Detect initial conditions
    this.currentConditions = this.detectNetworkConditions();
    this.adaptDiscoveryStrategy();

    // Monitor for changes
    if (typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection;
      
      if (connection) {
        connection.addEventListener('change', () => {
          this.analytics.networkChanges++;
          this.currentConditions = this.detectNetworkConditions();
          this.adaptDiscoveryStrategy();
        });
      }
    }

    // Periodic monitoring for environments without connection API
    this.networkMonitorInterval = window.setInterval(() => {
      this.performNetworkTest();
    }, 30000); // Every 30 seconds
  }

  /**
   * Calculate optimal strategy based on conditions
   */
  private calculateOptimalStrategy(conditions: NetworkConditions): AdaptiveDiscoveryStrategy {
    const base = this.getDefaultStrategy();

    // Adjust based on connection speed
    switch (conditions.speed) {
      case 'slow':
        return {
          ...base,
          maxConcurrentRequests: 1,
          requestTimeout: 15000,
          compressionEnabled: true,
          priorityMode: 'critical-only',
          batchSize: 2,
          retryAttempts: 1,
          backoffMultiplier: 3,
          prefetchEnabled: false,
          cacheStrategy: 'aggressive'
        };

      case 'medium':
        return {
          ...base,
          maxConcurrentRequests: 2,
          requestTimeout: 10000,
          compressionEnabled: true,
          priorityMode: 'selective',
          batchSize: 3,
          retryAttempts: 2,
          backoffMultiplier: 2,
          prefetchEnabled: false,
          cacheStrategy: 'moderate'
        };

      case 'fast':
        return {
          ...base,
          maxConcurrentRequests: 4,
          requestTimeout: 5000,
          compressionEnabled: false,
          priorityMode: 'full',
          batchSize: 5,
          retryAttempts: 3,
          backoffMultiplier: 1.5,
          prefetchEnabled: true,
          cacheStrategy: 'moderate'
        };
    }

    return base;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(url: string, options: RequestInit): Promise<Response> {
    const strategy = this.currentStrategy;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= strategy.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.ok) {
          return response;
        }
        
        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        throw new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < strategy.retryAttempts) {
          const delay = Math.pow(strategy.backoffMultiplier, attempt) * 1000;
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined') {
      return this.getDefaultDeviceCapabilities();
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);

    return {
      isMobile,
      isTablet,
      screenSize: window.innerWidth < 768 ? 'small' : window.innerWidth < 1200 ? 'medium' : 'large',
      memoryGB: (navigator as any).deviceMemory || 4,
      processorCores: navigator.hardwareConcurrency || 4,
      supportsPrefetch: 'serviceWorker' in navigator,
      supportsServiceWorker: 'serviceWorker' in navigator,
      maxConcurrentConnections: isMobile ? 6 : 10
    };
  }

  /**
   * Perform network speed test
   */
  private async performNetworkTest(): Promise<void> {
    try {
      const startTime = Date.now();
      const testUrl = `${window.location.origin}/favicon.ico?t=${Date.now()}`;
      
      await fetch(testUrl, { method: 'HEAD', cache: 'no-cache' });
      const endTime = Date.now();
      const latency = endTime - startTime;

      // Update conditions based on test
      if (this.currentConditions) {
        this.currentConditions.latency = latency;
        this.currentConditions.rtt = latency;
        this.currentConditions.speed = this.categorizeSpeed(this.currentConditions.downlink);
      }
    } catch (error) {
      // Network test failed, assume slow connection
      if (this.currentConditions) {
        this.currentConditions.speed = 'slow';
      }
    }
  }

  /**
   * Helper methods
   */
  private categorizeSpeed(downlink: number): 'fast' | 'medium' | 'slow' {
    if (downlink >= 5) return 'fast';
    if (downlink >= 1.5) return 'medium';
    return 'slow';
  }

  private normalizeConnectionType(type: string): NetworkConditions['type'] {
    if (type.includes('wifi')) return 'wifi';
    if (type.includes('5g')) return '5g';
    if (type.includes('4g')) return '4g';
    if (type.includes('3g')) return '3g';
    if (type.includes('2g')) return '2g';
    return 'unknown';
  }

  private getDefaultStrategy(): AdaptiveDiscoveryStrategy {
    return {
      maxConcurrentRequests: 3,
      requestTimeout: 8000,
      compressionEnabled: true,
      priorityMode: 'selective',
      batchSize: 4,
      retryAttempts: 2,
      backoffMultiplier: 2,
      prefetchEnabled: true,
      cacheStrategy: 'moderate'
    };
  }

  private getDefaultNetworkConditions(): NetworkConditions {
    return {
      speed: 'medium',
      type: 'unknown',
      latency: 100,
      downlink: 5,
      uplink: 1,
      effectiveType: '4g',
      saveData: false,
      rtt: 100
    };
  }

  private getDefaultDeviceCapabilities(): DeviceCapabilities {
    return {
      isMobile: false,
      isTablet: false,
      screenSize: 'large',
      memoryGB: 8,
      processorCores: 4,
      supportsPrefetch: true,
      supportsServiceWorker: true,
      maxConcurrentConnections: 10
    };
  }

  private getStrategyChangeReason(conditions: NetworkConditions): string {
    return `Network conditions changed: ${conditions.type} ${conditions.speed} (${conditions.downlink}Mbps)`;
  }

  private filterCriticalDocuments(documents: Document[]): Document[] {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes('readme') ||
      doc.title.toLowerCase().includes('getting started') ||
      doc.title.toLowerCase().includes('quick start') ||
      doc.order === 1
    );
  }

  private selectivelyPrioritizeDocuments(documents: Document[]): Document[] {
    return documents
      .sort((a, b) => {
        const aScore = this.calculateDocumentPriority(a);
        const bScore = this.calculateDocumentPriority(b);
        return bScore - aScore;
      })
      .slice(0, Math.ceil(documents.length * 0.7)); // Top 70%
  }

  private calculateDocumentPriority(doc: Document): number {
    let score = 0;
    
    if (doc.order) score += 10 - doc.order;
    if (doc.title.toLowerCase().includes('readme')) score += 5;
    if (doc.title.toLowerCase().includes('getting started')) score += 4;
    if (doc.title.toLowerCase().includes('api')) score += 3;
    if (doc.category === 'tutorials') score += 2;
    
    return score;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private estimateBandwidthSavings(used: number): number {
    // Estimate savings from compression and optimization
    return used * 0.3; // Assume 30% savings
  }

  private calculateLatencyImprovement(requestTime: number): number {
    // Calculate improvement based on baseline
    const baseline = 2000; // 2 second baseline
    return Math.max(0, baseline - requestTime);
  }

  private estimateBatteryOptimization(): number {
    // Estimate battery savings from reduced requests
    return this.deviceCapabilities.isMobile ? 0.1 : 0;
  }
}

/**
 * Factory function for mobile optimization
 */
export function createMobileNetworkOptimization(): MobileNetworkOptimization {
  return new MobileNetworkOptimization();
}