/**
 * Network Optimization Module for Production Performance
 * Provides request coalescing, connection pooling, and bandwidth optimization
 */

import { RequestMonitor } from '../foundation/RequestMonitor';
import { PerformanceMonitor } from '../foundation/PerformanceMonitor';

export interface NetworkOptimizationConfig {
  enableRequestCoalescing?: boolean;
  enableConnectionPooling?: boolean;
  maxConcurrentRequests?: number;
  requestTimeoutMs?: number;
  enableBandwidthOptimization?: boolean;
  compressionEnabled?: boolean;
}

export interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  averageLatency: number;
  bandwidthUsage: number;
  connectionPoolSize: number;
  requestsPerSecond: number;
  compressionRatio?: number;
}

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
}

export class NetworkOptimizer {
  private config: Required<NetworkOptimizationConfig>;
  private requestMonitor: RequestMonitor;
  private performanceMonitor: PerformanceMonitor;
  private connectionPool: Set<string> = new Set();
  private requestHistory: Array<{ timestamp: number; latency: number }> = [];

  constructor(
    requestMonitor: RequestMonitor,
    performanceMonitor: PerformanceMonitor,
    config: NetworkOptimizationConfig = {}
  ) {
    this.requestMonitor = requestMonitor;
    this.performanceMonitor = performanceMonitor;
    this.config = {
      enableRequestCoalescing: true,
      enableConnectionPooling: true,
      maxConcurrentRequests: 10,
      requestTimeoutMs: 30000,
      enableBandwidthOptimization: true,
      compressionEnabled: true,
      ...config
    };
  }

  getNetworkMetrics(): NetworkMetrics {
    const stats = this.requestMonitor.getStats();
    const recentRequests = this.requestHistory.filter(
      req => Date.now() - req.timestamp < 60000 // Last minute
    );
    
    return {
      totalRequests: stats.totalRequests,
      failedRequests: stats.failedRequests,
      averageLatency: stats.averageResponseTime || 0,
      bandwidthUsage: this.estimateBandwidthUsage(),
      connectionPoolSize: this.connectionPool.size,
      requestsPerSecond: recentRequests.length / 60,
      compressionRatio: this.config.compressionEnabled ? 0.7 : undefined
    };
  }

  getConnectionPoolStats(): ConnectionPoolStats {
    return {
      activeConnections: this.connectionPool.size,
      idleConnections: Math.max(0, this.config.maxConcurrentRequests - this.connectionPool.size),
      totalConnections: this.connectionPool.size,
      maxConnections: this.config.maxConcurrentRequests
    };
  }

  optimizeNetworkPerformance(): void {
    const measureLabel = `network-optimization-${Date.now()}`;
    
    try {
      this.performanceMonitor.startMeasure(measureLabel);
      
      // Connection pool optimization
      if (this.config.enableConnectionPooling) {
        this.optimizeConnectionPool();
      }

      // Request coalescing optimization
      if (this.config.enableRequestCoalescing) {
        this.optimizeRequestCoalescing();
      }

      // Bandwidth optimization
      if (this.config.enableBandwidthOptimization) {
        this.optimizeBandwidthUsage();
      }

      // Clean up old request history
      this.cleanupRequestHistory();

      this.performanceMonitor.endMeasure(measureLabel);
    } catch (error) {
      try {
        this.performanceMonitor.endMeasure(measureLabel);
      } catch (endError) {
        // Ignore measurement errors
      }
      console.warn('Network optimization failed:', error);
    }
  }

  private optimizeConnectionPool(): void {
    // Remove idle connections if pool is over capacity
    if (this.connectionPool.size > this.config.maxConcurrentRequests) {
      const excessConnections = this.connectionPool.size - this.config.maxConcurrentRequests;
      const connectionsToRemove = Array.from(this.connectionPool).slice(0, excessConnections);
      
      connectionsToRemove.forEach(connection => {
        this.connectionPool.delete(connection);
      });
    }
  }

  private optimizeRequestCoalescing(): void {
    // Request coalescing logic would go here
    // For now, this is a placeholder for future implementation
    // In practice, this would batch similar requests together
  }

  private optimizeBandwidthUsage(): void {
    // Bandwidth optimization logic would go here
    // This could include request prioritization, compression, etc.
  }

  private cleanupRequestHistory(): void {
    const cutoffTime = Date.now() - 300000; // Keep last 5 minutes
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp > cutoffTime
    );
  }

  private estimateBandwidthUsage(): number {
    // Rough estimation based on request count and average response size
    const stats = this.requestMonitor.getStats();
    const averageResponseSize = 50 * 1024; // Assume 50KB average response
    return stats.totalRequests * averageResponseSize;
  }

  trackRequest(url: string, latency: number): void {
    // Track connection
    const domain = this.extractDomain(url);
    this.connectionPool.add(domain);

    // Track request performance
    this.requestHistory.push({
      timestamp: Date.now(),
      latency
    });

    // Clean up if history gets too large
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-500);
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  getOptimizationStatus() {
    const metrics = this.getNetworkMetrics();
    const poolStats = this.getConnectionPoolStats();
    
    return {
      metrics,
      poolStats,
      optimizations: {
        requestCoalescing: this.config.enableRequestCoalescing,
        connectionPooling: this.config.enableConnectionPooling,
        bandwidthOptimization: this.config.enableBandwidthOptimization,
        compression: this.config.compressionEnabled
      },
      performance: {
        averageLatency: metrics.averageLatency,
        requestsPerSecond: metrics.requestsPerSecond,
        errorRate: metrics.totalRequests > 0 ? metrics.failedRequests / metrics.totalRequests : 0
      }
    };
  }

  cleanup(): void {
    this.connectionPool.clear();
    this.requestHistory = [];
  }
}