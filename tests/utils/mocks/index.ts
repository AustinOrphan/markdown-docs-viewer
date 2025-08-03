/**
 * Mock utilities for optimization testing
 *
 * Provides centralized mock utilities to prevent circular dependencies
 * and ensure consistent mocking across test suites.
 */

import { vi } from 'vitest';

export {
  EnvironmentMock,
  EnvironmentMockPresets,
  EnvironmentTestHelpers,
  MockEnvironmentType,
} from '../environment-mock';
export type {
  MockEnvironmentCapabilities,
  NetworkDelayConfig,
  ResponseConfig,
} from '../environment-mock';

// Re-export test helpers
export {
  PerformanceBenchmark,
  RequestCounter,
  AsyncTestHelpers,
  MemoryTestHelpers,
  TestDataGenerators,
  TestSetup,
  createOptimizationTestSuite,
} from '../../optimization/test-helpers';

/**
 * Mock factory for creating feature flag instances
 */
export function createMockFeatureFlags(initialFlags: Record<string, boolean> = {}) {
  return {
    isEnabled: vi.fn((flag: string) => initialFlags[flag] ?? false),
    enable: vi.fn((flag: string) => {
      initialFlags[flag] = true;
    }),
    disable: vi.fn((flag: string) => {
      initialFlags[flag] = false;
    }),
    getAll: vi.fn(() => ({ ...initialFlags })),
    reset: vi.fn(() => {
      Object.keys(initialFlags).forEach(key => delete initialFlags[key]);
    }),
    enableFlags: vi.fn((flags: string[]) => {
      flags.forEach(flag => {
        initialFlags[flag] = true;
      });
    }),
    disableFlags: vi.fn((flags: string[]) => {
      flags.forEach(flag => {
        initialFlags[flag] = false;
      });
    }),
    setFlags: vi.fn((flags: Record<string, boolean>) => {
      Object.assign(initialFlags, flags);
    }),
    hasFlag: vi.fn((flag: string) => flag in initialFlags),
    getEnabledFlags: vi.fn(() => Object.keys(initialFlags).filter(key => initialFlags[key])),
  };
}

/**
 * Mock factory for performance monitor
 */
export function createMockPerformanceMonitor() {
  const measurements = new Map<string, { startTime: number; endTime?: number }>();

  return {
    startMeasure: vi.fn((label: string) => {
      const startTime = performance.now();
      measurements.set(label, { startTime });
      return {
        label,
        startTime,
        end: vi.fn(() => {
          const endTime = performance.now();
          measurements.set(label, { startTime, endTime });
          return {
            label,
            duration: endTime - startTime,
            startTime,
            endTime,
          };
        }),
      };
    }),
    endMeasure: vi.fn((label: string) => {
      const measurement = measurements.get(label);
      if (!measurement) {
        throw new Error(`No measurement found for label: ${label}`);
      }
      const endTime = performance.now();
      const duration = endTime - measurement.startTime;
      return { label, duration, startTime: measurement.startTime, endTime };
    }),
    getReport: vi.fn(() => {
      return Array.from(measurements.entries()).map(([label, { startTime, endTime }]) => ({
        label,
        duration: endTime ? endTime - startTime : 0,
        startTime,
        endTime: endTime || startTime,
      }));
    }),
    reset: vi.fn(() => {
      measurements.clear();
    }),
  };
}

/**
 * Mock factory for request manager
 */
export function createMockRequestManager() {
  const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    averageResponseTime: 0,
    circuitBreakerTrips: 0,
  };

  return {
    fetch: vi.fn(async (url: string, _options: Record<string, any> = {}) => {
      stats.totalRequests++;

      // Simulate response
      const response = new Response(JSON.stringify({ url, success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      stats.successfulRequests++;
      return {
        success: true,
        data: response,
        duration: Math.random() * 100,
        attempts: 1,
        fromCache: false,
      };
    }),
    getStats: vi.fn(() => ({ ...stats })),
    reset: vi.fn(() => {
      Object.assign(stats, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cachedRequests: 0,
        averageResponseTime: 0,
        circuitBreakerTrips: 0,
      });
    }),
    getInstance: vi.fn(),
  };
}

/**
 * Mock factory for environment detector
 */
export function createMockEnvironmentDetector() {
  return {
    detect: vi.fn(async () => ({
      type: 'local_dev',
      confidence: 1.0,
      indicators: ['localhost'],
      capabilities: {
        corsSupport: true,
        headRequests: true,
        maxConcurrentRequests: 20,
        customHeaders: true,
        redirectSupport: true,
        compressionSupport: false,
      },
    })),
    getCachedEnvironment: vi.fn(() => null),
    getInstance: vi.fn(),
  };
}

/**
 * Mock factory for discovery cache
 */
export function createMockDiscoveryCache<T = any>() {
  const cache = new Map<string, { value: T; expires: number }>();

  return {
    get: vi.fn((key: string): T | null => {
      const entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn((key: string, value: T, ttl = 300000) => {
      cache.set(key, {
        value,
        expires: Date.now() + ttl,
      });
    }),
    has: vi.fn((key: string): boolean => {
      const entry = cache.get(key);
      if (!entry) return false;
      if (Date.now() > entry.expires) {
        cache.delete(key);
        return false;
      }
      return true;
    }),
    delete: vi.fn((key: string) => {
      cache.delete(key);
    }),
    clear: vi.fn(() => {
      cache.clear();
    }),
  };
}

// Re-export vitest mocking utilities
export { vi } from 'vitest';
