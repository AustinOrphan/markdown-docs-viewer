/**
 * Comprehensive tests for the FeatureFlags system
 *
 * Tests cover localStorage persistence, runtime toggles, error handling,
 * and zero performance impact requirements.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FeatureFlags,
  FeatureFlagsImpl,
  OptimizationFlags,
  ABTestingHelpers,
  FeatureFlagsDev,
} from '../../../src/optimization/foundation/FeatureFlags';
import { PerformanceBenchmark } from '../test-helpers';

// Mock localStorage
const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.data.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockLocalStorage.data.set(key, value)),
  removeItem: vi.fn((key: string) => mockLocalStorage.data.delete(key)),
  clear: vi.fn(() => mockLocalStorage.data.clear()),
};

describe('FeatureFlags', () => {
  beforeEach(() => {
    // Reset mocks
    mockLocalStorage.data.clear();
    vi.clearAllMocks();

    // Mock window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset singleton instance
    (FeatureFlagsImpl as any).instance = undefined;

    // Reset flags to defaults
    FeatureFlags.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should start with all flags disabled by default', () => {
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(false);
    });

    it('should enable and disable flags correctly', () => {
      const flag = OptimizationFlags.SMART_CONFIG_DISCOVERY;

      expect(FeatureFlags.isEnabled(flag)).toBe(false);

      FeatureFlags.enable(flag);
      expect(FeatureFlags.isEnabled(flag)).toBe(true);

      FeatureFlags.disable(flag);
      expect(FeatureFlags.isEnabled(flag)).toBe(false);
    });

    it('should return false for unknown flags', () => {
      expect(FeatureFlags.isEnabled('nonexistent-flag')).toBe(false);
    });

    it('should get all flags', () => {
      const allFlags = FeatureFlags.getAll();

      expect(allFlags).toHaveProperty(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(allFlags).toHaveProperty(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
      expect(allFlags).toHaveProperty(OptimizationFlags.REQUEST_POOLING);
      expect(allFlags).toHaveProperty(OptimizationFlags.ENHANCED_ERROR_HANDLING);

      // All should be false initially
      Object.values(allFlags).forEach(value => {
        expect(value).toBe(false);
      });
    });

    it('should reset flags to defaults', () => {
      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      FeatureFlags.enable(OptimizationFlags.REQUEST_POOLING);

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);

      FeatureFlags.reset();

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should enable multiple flags at once', () => {
      const flags = [OptimizationFlags.SMART_CONFIG_DISCOVERY, OptimizationFlags.REQUEST_POOLING];

      FeatureFlags.enableFlags(flags);

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(false);
    });

    it('should disable multiple flags at once', () => {
      // First enable all flags
      FeatureFlagsDev.enableAll();

      const flagsToDisable = [
        OptimizationFlags.SMART_CONFIG_DISCOVERY,
        OptimizationFlags.REQUEST_POOLING,
      ];

      FeatureFlags.disableFlags(flagsToDisable);

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(true);
    });

    it('should set multiple flags at once', () => {
      const flagsToSet = {
        [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
        [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
        [OptimizationFlags.REQUEST_POOLING]: true,
        [OptimizationFlags.ENHANCED_ERROR_HANDLING]: false,
      };

      FeatureFlags.setFlags(flagsToSet);

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(false);
    });

    it('should get enabled flags only', () => {
      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      FeatureFlags.enable(OptimizationFlags.REQUEST_POOLING);

      const enabledFlags = FeatureFlags.getEnabledFlags();

      expect(enabledFlags).toHaveLength(2);
      expect(enabledFlags).toContain(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(enabledFlags).toContain(OptimizationFlags.REQUEST_POOLING);
      expect(enabledFlags).not.toContain(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save flags to localStorage when changed', () => {
      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mdv_optimization_flags',
        expect.stringContaining(OptimizationFlags.SMART_CONFIG_DISCOVERY)
      );
    });

    it('should load flags from localStorage on initialization', () => {
      const storedFlags = {
        [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
        [OptimizationFlags.REQUEST_POOLING]: false,
      };

      mockLocalStorage.data.set('mdv_optimization_flags', JSON.stringify(storedFlags));

      // Create new instance to test loading
      (FeatureFlagsImpl as any).instance = undefined;

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false);
    });

    it('should merge stored flags with defaults for new flags', () => {
      const storedFlags = {
        [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
        // Missing other flags
      };

      mockLocalStorage.data.set('mdv_optimization_flags', JSON.stringify(storedFlags));

      // Create new instance
      (FeatureFlagsImpl as any).instance = undefined;

      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false); // Default
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.data.set('mdv_optimization_flags', 'invalid-json');

      // Should not throw error
      expect(() => {
        (FeatureFlagsImpl as any).instance = undefined;
        FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      }).not.toThrow();

      // Should fall back to defaults
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
    });

    it('should work when localStorage is not available', () => {
      // Mock localStorage unavailable
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Create new instance
      (FeatureFlagsImpl as any).instance = undefined;

      // Should work without localStorage
      expect(() => {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      }).not.toThrow();
    });

    it('should handle localStorage quota exceeded', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw error when saving fails
      expect(() => {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      }).not.toThrow();

      // Flag should still be enabled in memory
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should have zero performance impact when flags are disabled', () => {
      const benchmark = new PerformanceBenchmark();

      benchmark.start();

      // Perform many flag checks
      for (let i = 0; i < 10000; i++) {
        FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING);
        FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING);
      }

      const duration = benchmark.end('flag-checks');

      // Should complete 40,000 flag checks in under 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should have minimal performance impact for flag state changes', () => {
      const benchmark = new PerformanceBenchmark();

      benchmark.start();

      // Perform many flag changes
      for (let i = 0; i < 1000; i++) {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        FeatureFlags.disable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      }

      const duration = benchmark.end('flag-changes');

      // Should complete 2,000 flag changes in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FeatureFlagsImpl.getInstance();
      const instance2 = FeatureFlagsImpl.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across instance calls', () => {
      const instance1 = FeatureFlagsImpl.getInstance();
      instance1.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);

      const instance2 = FeatureFlagsImpl.getInstance();
      expect(instance2.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
    });
  });

  describe('Static Interface', () => {
    it('should provide working static methods', () => {
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);

      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);

      FeatureFlags.disable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let instance: FeatureFlagsImpl;

    beforeEach(() => {
      instance = FeatureFlagsImpl.getInstance();
    });

    it('should check if flag exists', () => {
      expect(instance.hasFlag(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(instance.hasFlag('nonexistent-flag')).toBe(false);
    });

    it('should get enabled flags only via instance', () => {
      instance.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      instance.enable(OptimizationFlags.REQUEST_POOLING);

      const enabledFlags = instance.getEnabledFlags();

      expect(enabledFlags).toHaveLength(2);
      expect(enabledFlags).toContain(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(enabledFlags).toContain(OptimizationFlags.REQUEST_POOLING);
    });
  });
});

describe('ABTestingHelpers', () => {
  beforeEach(() => {
    FeatureFlags.reset();
    vi.clearAllMocks();
  });

  describe('enableForPercentage', () => {
    it('should enable flag for 100% of users', () => {
      ABTestingHelpers.enableForPercentage(OptimizationFlags.SMART_CONFIG_DISCOVERY, 1.0);
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
    });

    it('should not enable flag for 0% of users', () => {
      ABTestingHelpers.enableForPercentage(OptimizationFlags.SMART_CONFIG_DISCOVERY, 0.0);
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
    });

    it('should throw error for invalid percentage', () => {
      expect(() => {
        ABTestingHelpers.enableForPercentage(OptimizationFlags.SMART_CONFIG_DISCOVERY, 1.5);
      }).toThrow('Percentage must be between 0 and 1');

      expect(() => {
        ABTestingHelpers.enableForPercentage(OptimizationFlags.SMART_CONFIG_DISCOVERY, -0.1);
      }).toThrow('Percentage must be between 0 and 1');
    });

    it('should have statistical distribution over many calls', () => {
      const iterations = 1000;
      let enabledCount = 0;

      for (let i = 0; i < iterations; i++) {
        FeatureFlags.reset();
        ABTestingHelpers.enableForPercentage(OptimizationFlags.SMART_CONFIG_DISCOVERY, 0.5);
        if (FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)) {
          enabledCount++;
        }
      }

      // Should be roughly 50% (allow 10% variance for randomness)
      const percentage = enabledCount / iterations;
      expect(percentage).toBeGreaterThan(0.4);
      expect(percentage).toBeLessThan(0.6);
    });
  });

  describe('enableForUserHash', () => {
    it('should be consistent for the same user ID', () => {
      const userId = 'user123';

      ABTestingHelpers.enableForUserHash(OptimizationFlags.SMART_CONFIG_DISCOVERY, userId, 0.5);
      const firstResult = FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);

      FeatureFlags.reset();
      ABTestingHelpers.enableForUserHash(OptimizationFlags.SMART_CONFIG_DISCOVERY, userId, 0.5);
      const secondResult = FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);

      expect(firstResult).toBe(secondResult);
    });

    it('should give different results for different user IDs', () => {
      const results = new Set();

      // Use more diverse user IDs to ensure different hash values
      const userIds = [
        'user1',
        'user2',
        'user3',
        'alice',
        'bob',
        'charlie',
        'admin',
        'guest',
        'test123',
        'john.doe',
        'jane_smith',
        'a',
        'bb',
        'ccc',
        'dddd',
        'eeeee',
        'ffffff',
      ];

      for (const userId of userIds) {
        FeatureFlags.reset();
        ABTestingHelpers.enableForUserHash(OptimizationFlags.SMART_CONFIG_DISCOVERY, userId, 0.5);
        results.add(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY));

        // If we already have both results, we can stop early
        if (results.size === 2) break;
      }

      // Should have both true and false results
      expect(results.size).toBe(2);
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });

    it('should throw error for invalid percentage', () => {
      expect(() => {
        ABTestingHelpers.enableForUserHash(
          OptimizationFlags.SMART_CONFIG_DISCOVERY,
          'user123',
          1.5
        );
      }).toThrow('Percentage must be between 0 and 1');
    });
  });
});

describe('FeatureFlagsDev', () => {
  beforeEach(() => {
    FeatureFlags.reset();
    vi.clearAllMocks();
  });

  it('should enable all optimization flags', () => {
    FeatureFlagsDev.enableAll();

    expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
    expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(true);
    expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);
    expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(true);
  });

  it('should disable all optimization flags', () => {
    FeatureFlagsDev.enableAll();
    FeatureFlagsDev.disableAll();

    expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(false);
    expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(false);
    expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(false);
    expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(false);
  });

  it('should log status without throwing', () => {
    const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    expect(() => {
      FeatureFlagsDev.logStatus();
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('🚩 Feature Flags Status');
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleGroupEndSpy).toHaveBeenCalled();
  });

  it('should setup console commands when window is available', () => {
    const mockWindow = { mdvFlags: undefined };
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });

    FeatureFlagsDev.setupConsoleCommands();

    expect(mockWindow.mdvFlags).toBeDefined();
    expect(mockWindow.mdvFlags).toHaveProperty('enable');
    expect(mockWindow.mdvFlags).toHaveProperty('disable');
    expect(mockWindow.mdvFlags).toHaveProperty('isEnabled');
    expect(mockWindow.mdvFlags).toHaveProperty('getAll');
    expect(mockWindow.mdvFlags).toHaveProperty('reset');
    expect(mockWindow.mdvFlags).toHaveProperty('enableAll');
    expect(mockWindow.mdvFlags).toHaveProperty('disableAll');
    expect(mockWindow.mdvFlags).toHaveProperty('status');

    expect(consoleSpy).toHaveBeenCalledWith('🚩 Feature flags available at window.mdvFlags');
  });

  it('should not throw when window is unavailable', () => {
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    expect(() => {
      FeatureFlagsDev.setupConsoleCommands();
    }).not.toThrow();
  });
});

describe('Integration Tests', () => {
  it('should work with real localStorage behavior', () => {
    const realLocalStorage = {
      data: new Map<string, string>(),
      getItem: (key: string) => realLocalStorage.data.get(key) || null,
      setItem: (key: string, value: string) => realLocalStorage.data.set(key, value),
      removeItem: (key: string) => realLocalStorage.data.delete(key),
      clear: () => realLocalStorage.data.clear(),
    };

    // Mock window.localStorage properly
    vi.stubGlobal('window', { localStorage: realLocalStorage });

    // Reset instance
    (FeatureFlagsImpl as any).instance = undefined;

    // Enable a flag
    FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);

    // Verify it's stored
    const stored = realLocalStorage.getItem('mdv_optimization_flags');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed[OptimizationFlags.SMART_CONFIG_DISCOVERY]).toBe(true);

    // Create new instance and verify persistence
    (FeatureFlagsImpl as any).instance = undefined;
    expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
  });

  it('should maintain consistency across page reloads (simulated)', () => {
    // Simulate first page load
    FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
    FeatureFlags.enable(OptimizationFlags.REQUEST_POOLING);

    const flagsBeforeReload = FeatureFlags.getAll();

    // Simulate page reload by creating new instance
    (FeatureFlagsImpl as any).instance = undefined;

    const flagsAfterReload = FeatureFlags.getAll();

    expect(flagsAfterReload).toEqual(flagsBeforeReload);
  });

  it('should work correctly in production-like environment', () => {
    // Simulate production environment constraints
    const prodLocalStorage = {
      data: new Map<string, string>(),
      getItem: vi.fn((key: string) => {
        // Simulate occasional localStorage failures
        if (Math.random() < 0.01) throw new Error('Storage unavailable');
        return prodLocalStorage.data.get(key) || null;
      }),
      setItem: vi.fn((key: string, value: string) => {
        // Simulate occasional quota exceeded
        if (Math.random() < 0.01) throw new Error('QuotaExceededError');
        prodLocalStorage.data.set(key, value);
      }),
      removeItem: vi.fn((key: string) => prodLocalStorage.data.delete(key)),
      clear: vi.fn(() => prodLocalStorage.data.clear()),
    };

    // Mock window.localStorage properly
    vi.stubGlobal('window', { localStorage: prodLocalStorage });

    // Reset instance
    (FeatureFlagsImpl as any).instance = undefined;

    // Should work despite occasional storage failures
    expect(() => {
      for (let i = 0; i < 100; i++) {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        FeatureFlags.disable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      }
    }).not.toThrow();
  });
});
