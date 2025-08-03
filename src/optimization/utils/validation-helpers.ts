/**
 * Production Validation Helpers
 * 
 * Production-safe utilities for validation and performance measurement
 * without dependencies on test utilities.
 */

export interface PerformanceMetrics {
  requestCount: number;
  initializationTime: number;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage?: number;
}

export interface ValidationResult {
  success: boolean;
  metrics: PerformanceMetrics;
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/**
 * Simple performance benchmark utility
 */
export class ProductionPerformanceBenchmark {
  private startTime: number = 0;
  private endTime: number = 0;
  private measurements: Array<{ label: string; duration: number; timestamp: number }> = [];

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  measure(label: string): { end: () => number } {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.measurements.push({ label, duration, timestamp: Date.now() });
        return duration;
      }
    };
  }

  getResults(): Array<{ label: string; duration: number; timestamp: number }> {
    return [...this.measurements];
  }

  reset(): void {
    this.measurements = [];
    this.startTime = 0;
    this.endTime = 0;
  }
}

/**
 * Simple request counter utility
 */
export class ProductionRequestCounter {
  private count: number = 0;
  private errorCount: number = 0;
  private startTime: number = Date.now();

  increment(): void {
    this.count++;
  }

  incrementError(): void {
    this.errorCount++;
  }

  getCount(): number {
    return this.count;
  }

  getTotalRequests(): number {
    return this.count;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  getStats(): { total: number; errors: number; errorRate: number; duration: number } {
    const duration = Date.now() - this.startTime;
    return {
      total: this.count,
      errors: this.errorCount,
      errorRate: this.count > 0 ? (this.errorCount / this.count) * 100 : 0,
      duration
    };
  }

  reset(): void {
    this.count = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }
}

/**
 * Create validation helpers for production use
 */
export function createValidationHelpers() {
  return {
    benchmark: new ProductionPerformanceBenchmark(),
    requestCounter: new ProductionRequestCounter(),
    
    validatePerformanceMetrics: (metrics: PerformanceMetrics): boolean => {
      return (
        metrics.requestCount >= 0 &&
        metrics.initializationTime >= 0 &&
        metrics.cacheHitRate >= 0 && metrics.cacheHitRate <= 100 &&
        metrics.errorRate >= 0 && metrics.errorRate <= 100
      );
    },
    
    validateOptimizationEffectiveness: (baselineRequests: number, optimizedRequests: number): number => {
      if (baselineRequests <= 0) return 0;
      return ((baselineRequests - optimizedRequests) / baselineRequests) * 100;
    },
    
    createMockResponse: (status: number, data?: any) => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
      json: () => Promise.resolve(data || {}),
      text: () => Promise.resolve(JSON.stringify(data || {})),
    }),
  };
}

/**
 * Validate site accessibility and performance
 */
export async function validateSitePerformance(url: string): Promise<ValidationResult> {
  const helpers = createValidationHelpers();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const startTime = performance.now();
    helpers.requestCounter.increment();
    
    const response = await fetch(url, { method: 'HEAD' });
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      errors.push(`Failed to access ${url}: ${response.status} ${response.statusText}`);
    }
    
    if (duration > 5000) {
      warnings.push(`Slow response from ${url}: ${duration.toFixed(0)}ms`);
    }
    
    const metrics: PerformanceMetrics = {
      requestCount: helpers.requestCounter.getCount(),
      initializationTime: duration,
      cacheHitRate: 0, // Would be calculated based on cache headers
      errorRate: response.ok ? 0 : 100,
    };
    
    return {
      success: response.ok,
      metrics,
      errors,
      warnings,
      timestamp: Date.now(),
    };
    
  } catch (error) {
    errors.push(`Network error accessing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      metrics: {
        requestCount: helpers.requestCounter.getCount(),
        initializationTime: 0,
        cacheHitRate: 0,
        errorRate: 100,
      },
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(
  baseline: PerformanceMetrics,
  optimized: PerformanceMetrics
): {
  requestReduction: number;
  performanceImprovement: number;
  cacheImprovement: number;
  errorReduction: number;
  summary: string;
} {
  const requestReduction = baseline.requestCount > 0 
    ? ((baseline.requestCount - optimized.requestCount) / baseline.requestCount) * 100 
    : 0;
    
  const performanceImprovement = baseline.initializationTime > 0
    ? ((baseline.initializationTime - optimized.initializationTime) / baseline.initializationTime) * 100
    : 0;
    
  const cacheImprovement = optimized.cacheHitRate - baseline.cacheHitRate;
  const errorReduction = baseline.errorRate - optimized.errorRate;
  
  const summary = `Performance improved: ${performanceImprovement.toFixed(1)}% faster, ${requestReduction.toFixed(1)}% fewer requests, ${cacheImprovement.toFixed(1)}% better cache hit rate`;
  
  return {
    requestReduction,
    performanceImprovement,
    cacheImprovement,
    errorReduction,
    summary,
  };
}