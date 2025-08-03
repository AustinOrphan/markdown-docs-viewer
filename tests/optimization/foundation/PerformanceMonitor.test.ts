/**
 * Unit tests for PerformanceMonitor
 * 
 * Tests cover all functionality with edge cases and performance validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PerformanceMonitor, 
  getGlobalPerformanceMonitor,
  resetGlobalPerformanceMonitor,
  type PerformanceReport,
  type PerformanceMeasurement
} from '../../../src/optimization/foundation/PerformanceMonitor';

// Mock performance.now() for consistent testing
const mockPerformanceNow = vi.fn();
vi.stubGlobal('performance', {
  now: mockPerformanceNow,
  memory: {
    usedJSHeapSize: 1000000
  }
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let currentTime = 0;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
  });

  describe('Basic Measurement', () => {
    it('should start and end measurements correctly', () => {
      const measurement = monitor.startMeasure('test-operation');
      
      expect(measurement.label).toBe('test-operation');
      expect(measurement.startTime).toBe(0);
      
      currentTime = 100;
      const report = measurement.end();
      
      expect(report.label).toBe('test-operation');
      expect(report.duration).toBe(100);
      expect(report.startTime).toBe(0);
      expect(report.endTime).toBe(100);
    });

    it('should track multiple measurements independently', () => {
      const measurement1 = monitor.startMeasure('operation-1');
      currentTime = 50;
      const measurement2 = monitor.startMeasure('operation-2');
      
      currentTime = 100;
      const report1 = measurement1.end();
      
      currentTime = 150;
      const report2 = measurement2.end();
      
      expect(report1.duration).toBe(100);
      expect(report2.duration).toBe(100); // 150 - 50
    });

    it('should handle measurements via endMeasure method', () => {
      monitor.startMeasure('direct-end');
      currentTime = 75;
      
      const report = monitor.endMeasure('direct-end');
      
      expect(report.label).toBe('direct-end');
      expect(report.duration).toBe(75);
    });

    it('should throw error when ending non-existent measurement', () => {
      expect(() => monitor.endMeasure('non-existent')).toThrow(
        'No active measurement found for label: non-existent'
      );
    });
  });

  describe('Measurement Management', () => {
    it('should store completed reports', () => {
      monitor.startMeasure('stored-1');
      currentTime = 100;
      monitor.endMeasure('stored-1');
      
      monitor.startMeasure('stored-2');
      currentTime = 200;
      monitor.endMeasure('stored-2');
      
      const reports = monitor.getReport();
      expect(reports).toHaveLength(2);
      expect(reports[0].label).toBe('stored-1');
      expect(reports[1].label).toBe('stored-2');
    });

    it('should return copy of reports to prevent modification', () => {
      monitor.startMeasure('immutable');
      currentTime = 50;
      monitor.endMeasure('immutable');
      
      const reports1 = monitor.getReport();
      const reports2 = monitor.getReport();
      
      expect(reports1).not.toBe(reports2);
      expect(reports1).toEqual(reports2);
      
      reports1.push({} as PerformanceReport);
      expect(monitor.getReport()).toHaveLength(1);
    });

    it('should track active measurements', () => {
      monitor.startMeasure('active-1');
      currentTime = 25;
      monitor.startMeasure('active-2');
      currentTime = 50;
      
      const active = monitor.getActiveMeasurements();
      
      expect(active).toHaveLength(2);
      expect(active[0]).toEqual({
        label: 'active-1',
        elapsedTime: 50
      });
      expect(active[1]).toEqual({
        label: 'active-2',
        elapsedTime: 25
      });
    });

    it('should remove measurements from active list when ended', () => {
      monitor.startMeasure('to-remove');
      expect(monitor.getActiveMeasurements()).toHaveLength(1);
      
      currentTime = 100;
      monitor.endMeasure('to-remove');
      
      expect(monitor.getActiveMeasurements()).toHaveLength(0);
    });
  });

  describe('Statistics and Analysis', () => {
    beforeEach(() => {
      // Create test data
      monitor.startMeasure('op-1');
      currentTime = 100;
      monitor.endMeasure('op-1');
      
      monitor.startMeasure('op-2');
      currentTime = 250;
      monitor.endMeasure('op-2');
      
      monitor.startMeasure('op-3');
      currentTime = 300;
      monitor.endMeasure('op-3');
    });

    it('should calculate comprehensive statistics', () => {
      const stats = monitor.getStats();
      
      expect(stats.totalMeasurements).toBe(3);
      expect(stats.totalDuration).toBe(200); // 100 + 150 + 50
      expect(stats.averageDuration).toBe(200 / 3);
      expect(stats.minDuration).toBe(50);
      expect(stats.maxDuration).toBe(150);
      expect(typeof stats.memoryDelta).toBe('number');
    });

    it('should handle empty statistics gracefully', () => {
      const emptyMonitor = new PerformanceMonitor();
      const stats = emptyMonitor.getStats();
      
      expect(stats.totalMeasurements).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.totalDuration).toBe(0);
    });
  });

  describe('Advanced Features', () => {
    it('should create scoped measurements', () => {
      const scoped = monitor.createScopedMeasurement('scoped-op');
      currentTime = 150;
      
      const report = scoped.end();
      
      expect(report.label).toBe('scoped-op');
      expect(report.duration).toBe(150);
    });

    it('should measure synchronous operations', () => {
      const operation = vi.fn(() => 'result');
      currentTime = 0;
      
      const { result, report } = monitor.measureSync('sync-op', operation);
      currentTime = 75;
      
      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledOnce();
      expect(report.label).toBe('sync-op');
    });

    it('should handle synchronous operation errors', () => {
      const operation = vi.fn(() => {
        throw new Error('Operation failed');
      });
      
      expect(() => monitor.measureSync('error-op', operation)).toThrow('Operation failed');
      
      // Should still record the measurement
      const reports = monitor.getReport();
      expect(reports).toHaveLength(1);
      expect(reports[0].label).toBe('error-op');
    });

    it('should measure asynchronous operations', async () => {
      const asyncOperation = vi.fn(async () => {
        currentTime += 100;
        return 'async-result';
      });
      
      const { result, report } = await monitor.measureAsync('async-op', asyncOperation);
      
      expect(result).toBe('async-result');
      expect(asyncOperation).toHaveBeenCalledOnce();
      expect(report.label).toBe('async-op');
      expect(report.duration).toBe(100);
    });

    it('should handle asynchronous operation errors', async () => {
      const asyncOperation = vi.fn(async () => {
        currentTime += 50;
        throw new Error('Async failed');
      });
      
      await expect(monitor.measureAsync('async-error', asyncOperation))
        .rejects.toThrow('Async failed');
      
      // Should still record the measurement
      const reports = monitor.getReport();
      expect(reports).toHaveLength(1);
      expect(reports[0].label).toBe('async-error');
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset all measurements and reports', () => {
      monitor.startMeasure('to-reset');
      currentTime = 100;
      monitor.endMeasure('to-reset');
      
      monitor.startMeasure('active-reset');
      
      expect(monitor.getReport()).toHaveLength(1);
      expect(monitor.getActiveMeasurements()).toHaveLength(1);
      
      monitor.reset();
      
      expect(monitor.getReport()).toHaveLength(0);
      expect(monitor.getActiveMeasurements()).toHaveLength(0);
    });
  });

  describe('Data Export', () => {
    it('should export measurements to JSON', () => {
      monitor.startMeasure('export-test');
      currentTime = 50;
      monitor.endMeasure('export-test');
      
      monitor.startMeasure('active-export');
      currentTime = 75;
      
      const json = monitor.exportToJSON();
      const data = JSON.parse(json);
      
      expect(data.completedReports).toHaveLength(1);
      expect(data.activeMeasurements).toHaveLength(1);
      expect(data.stats).toBeDefined();
      expect(data.timestamp).toBeTypeOf('number');
    });
  });

  describe('Performance Overhead', () => {
    it('should have minimal overhead (<1ms)', () => {
      const iterations = 1000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const measurement = monitor.startMeasure(`test-${i}`);
        measurement.end();
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      // Should average less than 1ms per operation
      expect(averageTime).toBeLessThan(1);
    });
  });
});

describe('Global PerformanceMonitor', () => {
  beforeEach(() => {
    resetGlobalPerformanceMonitor();
  });

  it('should return same instance on multiple calls', () => {
    const instance1 = getGlobalPerformanceMonitor();
    const instance2 = getGlobalPerformanceMonitor();
    
    expect(instance1).toBe(instance2);
  });

  it('should reset global instance', () => {
    const instance1 = getGlobalPerformanceMonitor();
    instance1.startMeasure('global-test');
    
    expect(instance1.getActiveMeasurements()).toHaveLength(1);
    
    resetGlobalPerformanceMonitor();
    
    // Should still be same instance but reset
    const instance2 = getGlobalPerformanceMonitor();
    expect(instance1).toBe(instance2);
    expect(instance1.getActiveMeasurements()).toHaveLength(0);
  });
});

describe('Memory Usage Tracking', () => {
  it('should track memory delta when performance.memory is available', () => {
    const stats = monitor.getStats();
    expect(typeof stats.memoryDelta).toBe('number');
  });

  it('should handle missing performance.memory gracefully', () => {
    vi.stubGlobal('performance', {
      now: mockPerformanceNow
    });
    
    const monitorNoMemory = new PerformanceMonitor();
    const stats = monitorNoMemory.getStats();
    
    expect(stats.memoryDelta).toBe(0);
  });
});