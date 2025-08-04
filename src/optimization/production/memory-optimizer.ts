/**
 * Memory Optimization Module for Production Performance
 * Provides heap management, leak detection, and memory usage optimization
 */

import { PerformanceMonitor } from '../foundation/PerformanceMonitor';

export interface MemoryOptimizationConfig {
  enableGarbageCollectionOptimization?: boolean;
  maxHeapSize?: number;
  enableMemoryLeakDetection?: boolean;
  memoryWarningThreshold?: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  gcCount: number;
  gcDuration: number;
}

export class MemoryOptimizer {
  private config: Required<MemoryOptimizationConfig>;
  private performanceMonitor: PerformanceMonitor;
  private memoryHistory: MemoryMetrics[] = [];

  constructor(
    performanceMonitor: PerformanceMonitor,
    config: MemoryOptimizationConfig = {}
  ) {
    this.performanceMonitor = performanceMonitor;
    this.config = {
      enableGarbageCollectionOptimization: true,
      maxHeapSize: 1024 * 1024 * 1024, // 1GB
      enableMemoryLeakDetection: true,
      memoryWarningThreshold: 0.8,
      ...config
    };
  }

  getCurrentMemoryMetrics(): MemoryMetrics {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0,
        gcCount: 0, // Will be tracked separately
        gcDuration: 0
      };
    }
    
    // Browser fallback using performance.memory if available
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      const memory = (window.performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0,
        arrayBuffers: 0,
        gcCount: 0,
        gcDuration: 0
      };
    }
    
    // Complete fallback
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      gcCount: 0,
      gcDuration: 0
    };
  }

  optimizeMemoryUsage(): void {
    const measureLabel = `memory-optimization-${Date.now()}`;
    
    try {
      this.performanceMonitor.startMeasure(measureLabel);
      
      // Force garbage collection if available
      if (this.config.enableGarbageCollectionOptimization) {
        if (typeof global !== 'undefined' && (global as any).gc) {
          (global as any).gc();
        } else if (typeof window !== 'undefined' && (window as any).gc) {
          (window as any).gc();
        }
      }

      // Clear memory history if too large
      if (this.memoryHistory.length > 100) {
        this.memoryHistory = this.memoryHistory.slice(-50);
      }

      // Track current memory state
      const currentMetrics = this.getCurrentMemoryMetrics();
      this.memoryHistory.push(currentMetrics);

      this.performanceMonitor.endMeasure(measureLabel);
    } catch (error) {
      try {
        this.performanceMonitor.endMeasure(measureLabel);
      } catch (endError) {
        // Ignore measurement errors
      }
      console.warn('Memory optimization failed:', error);
    }
  }

  detectMemoryLeaks(): boolean {
    if (!this.config.enableMemoryLeakDetection) return false;

    const current = this.getCurrentMemoryMetrics();
    
    // Add current metrics to history
    this.memoryHistory.push(current);

    if (this.memoryHistory.length < 5) return false;

    // Simple leak detection: steady increase over time
    const recent = this.memoryHistory.slice(-5);
    const increasing = recent.every((metrics, i) => 
      i === 0 || metrics.heapUsed > recent[i - 1].heapUsed
    );

    const isOverThreshold = current.heapUsed > this.config.maxHeapSize * this.config.memoryWarningThreshold;
    
    if (increasing && isOverThreshold) {
      console.warn('Potential memory leak detected:', {
        currentHeapUsed: current.heapUsed,
        threshold: this.config.maxHeapSize * this.config.memoryWarningThreshold,
        trend: 'increasing'
      });
      return true;
    }

    return false;
  }

  getMemoryStats() {
    const current = this.getCurrentMemoryMetrics();
    const history = this.memoryHistory.slice(-10); // Last 10 measurements
    
    return {
      current,
      history,
      leakDetected: this.detectMemoryLeaks(),
      optimizationEnabled: this.config.enableGarbageCollectionOptimization,
      warningThreshold: this.config.maxHeapSize * this.config.memoryWarningThreshold
    };
  }

  cleanup(): void {
    this.memoryHistory = [];
  }
}