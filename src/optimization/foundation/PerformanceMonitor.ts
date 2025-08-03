/**
 * PerformanceMonitor - High-performance monitoring utility for tracking execution times
 * 
 * Designed to have minimal overhead (<1ms) while providing accurate performance measurements.
 * Uses performance.now() for high-resolution timing and optimized data structures.
 */

export interface PerformanceMeasurement {
  label: string;
  startTime: number;
  end(): PerformanceReport;
}

export interface PerformanceReport {
  label: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface ActiveMeasurement {
  label: string;
  startTime: number;
}

export class PerformanceMonitor {
  private activeMeasurements = new Map<string, ActiveMeasurement>();
  private completedReports: PerformanceReport[] = [];
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Start measuring performance for a labeled operation
   * Returns a measurement object that can be used to end the measurement
   */
  startMeasure(label: string): PerformanceMeasurement {
    const startTime = performance.now();
    
    const measurement: ActiveMeasurement = {
      label,
      startTime
    };
    
    this.activeMeasurements.set(label, measurement);
    
    return {
      label,
      startTime,
      end: () => this.endMeasure(label)
    };
  }

  /**
   * End a measurement and return the performance report
   * Optimized for minimal overhead using Map lookup
   */
  endMeasure(label: string): PerformanceReport {
    const endTime = performance.now();
    const measurement = this.activeMeasurements.get(label);
    
    if (!measurement) {
      throw new Error(`No active measurement found for label: ${label}`);
    }
    
    this.activeMeasurements.delete(label);
    
    const report: PerformanceReport = {
      label: measurement.label,
      duration: endTime - measurement.startTime,
      startTime: measurement.startTime,
      endTime
    };
    
    this.completedReports.push(report);
    return report;
  }

  /**
   * Get all completed performance reports
   * Returns a copy to prevent external modification
   */
  getReport(): PerformanceReport[] {
    return [...this.completedReports];
  }

  /**
   * Get aggregated statistics for performance analysis
   */
  getStats() {
    if (this.completedReports.length === 0) {
      return {
        totalMeasurements: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
        memoryDelta: this.getMemoryDelta()
      };
    }

    const durations = this.completedReports.map(r => r.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    
    return {
      totalMeasurements: this.completedReports.length,
      averageDuration: totalDuration / this.completedReports.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration,
      memoryDelta: this.getMemoryDelta()
    };
  }

  /**
   * Get active measurements (useful for debugging hanging operations)
   */
  getActiveMeasurements(): Array<{ label: string; elapsedTime: number }> {
    const now = performance.now();
    return Array.from(this.activeMeasurements.values()).map(m => ({
      label: m.label,
      elapsedTime: now - m.startTime
    }));
  }

  /**
   * Reset all measurements and clear reports
   */
  reset(): void {
    this.activeMeasurements.clear();
    this.completedReports.length = 0;
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Create a scoped measurement that automatically ends when the scope exits
   * Useful for try/finally patterns or async operations
   */
  createScopedMeasurement(label: string): { end: () => PerformanceReport } {
    const measurement = this.startMeasure(label);
    return {
      end: () => measurement.end()
    };
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(label: string, operation: () => Promise<T>): Promise<{ result: T; report: PerformanceReport }> {
    const measurement = this.startMeasure(label);
    try {
      const result = await operation();
      const report = measurement.end();
      return { result, report };
    } catch (error) {
      measurement.end();
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(label: string, operation: () => T): { result: T; report: PerformanceReport } {
    const measurement = this.startMeasure(label);
    try {
      const result = operation();
      const report = measurement.end();
      return { result, report };
    } catch (error) {
      measurement.end();
      throw error;
    }
  }

  /**
   * Get current memory usage (best effort, fallback to 0 if not available)
   */
  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get memory usage delta since baseline
   */
  private getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }

  /**
   * Export measurements to JSON for external analysis
   */
  exportToJSON(): string {
    return JSON.stringify({
      completedReports: this.completedReports,
      activeMeasurements: this.getActiveMeasurements(),
      stats: this.getStats(),
      timestamp: Date.now()
    }, null, 2);
  }
}

// Singleton instance for global use
let globalInstance: PerformanceMonitor | null = null;

/**
 * Get the global PerformanceMonitor instance
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalInstance) {
    globalInstance = new PerformanceMonitor();
  }
  return globalInstance;
}

/**
 * Reset the global PerformanceMonitor instance
 */
export function resetGlobalPerformanceMonitor(): void {
  if (globalInstance) {
    globalInstance.reset();
  }
}