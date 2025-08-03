/**
 * FeatureFlags system for zero-config optimization
 *
 * Provides runtime feature flag management with localStorage persistence
 * and zero performance impact when features are disabled.
 */

export enum OptimizationFlags {
  SMART_CONFIG_DISCOVERY = 'smartConfigDiscovery',
  PROGRESSIVE_DOCUMENT_DISCOVERY = 'progressiveDocumentDiscovery',
  REQUEST_POOLING = 'requestPooling',
  ENHANCED_ERROR_HANDLING = 'enhancedErrorHandling',
  MANIFEST_DISCOVERY = 'manifestDiscovery',
  MANIFEST_GENERATION = 'manifestGeneration',
}

export interface IFeatureFlags {
  isEnabled(flag: string): boolean;
  enable(flag: string): void;
  disable(flag: string): void;
  getAll(): Record<string, boolean>;
  reset(): void;
}

/**
 * Default flag states - all disabled initially for gradual rollout
 */
const DEFAULT_FLAGS: Record<string, boolean> = {
  [OptimizationFlags.SMART_CONFIG_DISCOVERY]: false,
  [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
  [OptimizationFlags.REQUEST_POOLING]: false,
  [OptimizationFlags.ENHANCED_ERROR_HANDLING]: false,
};

const STORAGE_KEY = 'mdv_optimization_flags';

/**
 * FeatureFlags implementation with localStorage persistence
 *
 * Features:
 * - Zero performance impact when disabled
 * - Persistent across page reloads
 * - Runtime enable/disable capabilities
 * - Safe defaults for production
 */
export class FeatureFlagsImpl implements IFeatureFlags {
  private static instance: FeatureFlagsImpl;
  private flags: Record<string, boolean>;
  private storageAvailable: boolean;

  private constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    this.flags = this.loadFlags();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FeatureFlagsImpl {
    if (!FeatureFlagsImpl.instance) {
      FeatureFlagsImpl.instance = new FeatureFlagsImpl();
    }
    return FeatureFlagsImpl.instance;
  }

  /**
   * Check if a feature flag is enabled
   * Performance-optimized for frequent calls
   */
  public isEnabled(flag: string): boolean {
    return this.flags[flag] ?? false;
  }

  /**
   * Enable a feature flag
   */
  public enable(flag: string): void {
    this.flags[flag] = true;
    this.saveFlags();
  }

  /**
   * Disable a feature flag
   */
  public disable(flag: string): void {
    this.flags[flag] = false;
    this.saveFlags();
  }

  /**
   * Get all feature flags
   */
  public getAll(): Record<string, boolean> {
    return { ...this.flags };
  }

  /**
   * Reset all flags to defaults
   */
  public reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveFlags();
  }

  /**
   * Enable multiple flags at once
   */
  public enableFlags(flags: string[]): void {
    flags.forEach(flag => {
      this.flags[flag] = true;
    });
    this.saveFlags();
  }

  /**
   * Disable multiple flags at once
   */
  public disableFlags(flags: string[]): void {
    flags.forEach(flag => {
      this.flags[flag] = false;
    });
    this.saveFlags();
  }

  /**
   * Set multiple flags at once
   */
  public setFlags(flagsToSet: Record<string, boolean>): void {
    Object.assign(this.flags, flagsToSet);
    this.saveFlags();
  }

  /**
   * Check if flag exists in configuration
   */
  public hasFlag(flag: string): boolean {
    return flag in this.flags;
  }

  /**
   * Get enabled flags only
   */
  public getEnabledFlags(): string[] {
    return Object.entries(this.flags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag);
  }

  /**
   * Check localStorage availability
   */
  private checkStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const testKey = '__mdv_storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load flags from localStorage
   */
  private loadFlags(): Record<string, boolean> {
    if (!this.storageAvailable) {
      return { ...DEFAULT_FLAGS };
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { ...DEFAULT_FLAGS };
      }

      const parsed = JSON.parse(stored);

      // Merge with defaults to handle new flags
      return {
        ...DEFAULT_FLAGS,
        ...parsed,
      };
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error);
      return { ...DEFAULT_FLAGS };
    }
  }

  /**
   * Save flags to localStorage
   */
  private saveFlags(): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
      }
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error);
    }
  }
}

/**
 * Static interface for convenience
 */
export class FeatureFlagsStatic {
  private static get instance(): FeatureFlagsImpl {
    return FeatureFlagsImpl.getInstance();
  }

  public static isEnabled(flag: string): boolean {
    return this.instance.isEnabled(flag);
  }

  public static enable(flag: string): void {
    this.instance.enable(flag);
  }

  public static disable(flag: string): void {
    this.instance.disable(flag);
  }

  public static getAll(): Record<string, boolean> {
    return this.instance.getAll();
  }

  public static reset(): void {
    this.instance.reset();
  }

  public static enableFlags(flags: string[]): void {
    this.instance.enableFlags(flags);
  }

  public static disableFlags(flags: string[]): void {
    this.instance.disableFlags(flags);
  }

  public static setFlags(flags: Record<string, boolean>): void {
    this.instance.setFlags(flags);
  }

  public static hasFlag(flag: string): boolean {
    return this.instance.hasFlag(flag);
  }

  public static getEnabledFlags(): string[] {
    return this.instance.getEnabledFlags();
  }
}

// Export both the class and static interface
export const FeatureFlags = FeatureFlagsStatic;

/**
 * A/B Testing helpers
 */
export class ABTestingHelpers {
  /**
   * Randomly enable a flag for A/B testing
   * @param flag Flag to test
   * @param percentage Percentage of users (0-1)
   */
  public static enableForPercentage(flag: string, percentage: number): void {
    if (percentage < 0 || percentage > 1) {
      throw new Error('Percentage must be between 0 and 1');
    }

    const shouldEnable = Math.random() < percentage;
    if (shouldEnable) {
      FeatureFlags.enable(flag);
    } else {
      FeatureFlags.disable(flag);
    }
  }

  /**
   * Enable flag based on user ID hash for consistent A/B testing
   */
  public static enableForUserHash(flag: string, userId: string, percentage: number): void {
    if (percentage < 0 || percentage > 1) {
      throw new Error('Percentage must be between 0 and 1');
    }

    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) + hash + userId.charCodeAt(i);
    }

    // Make hash positive and normalize to 0-1
    const positiveHash = Math.abs(hash);
    const normalizedHash = (positiveHash % 1000000) / 1000000;
    const shouldEnable = normalizedHash < percentage;

    if (shouldEnable) {
      FeatureFlags.enable(flag);
    } else {
      FeatureFlags.disable(flag);
    }
  }
}

/**
 * Development utilities for testing
 */
export class FeatureFlagsDev {
  /**
   * Enable all optimization flags for development
   */
  public static enableAll(): void {
    Object.values(OptimizationFlags).forEach(flag => {
      FeatureFlags.enable(flag);
    });
  }

  /**
   * Disable all optimization flags
   */
  public static disableAll(): void {
    Object.values(OptimizationFlags).forEach(flag => {
      FeatureFlags.disable(flag);
    });
  }

  /**
   * Log current flag status
   */
  public static logStatus(): void {
    const flags = FeatureFlags.getAll();
    console.group('🚩 Feature Flags Status');
    Object.entries(flags).forEach(([flag, enabled]) => {
      console.log(`${enabled ? '✅' : '❌'} ${flag}`);
    });
    console.groupEnd();
  }

  /**
   * Set up console commands for debugging
   */
  public static setupConsoleCommands(): void {
    if (typeof window !== 'undefined') {
      (window as any).mdvFlags = {
        enable: FeatureFlags.enable.bind(FeatureFlags),
        disable: FeatureFlags.disable.bind(FeatureFlags),
        isEnabled: FeatureFlags.isEnabled.bind(FeatureFlags),
        getAll: FeatureFlags.getAll.bind(FeatureFlags),
        reset: FeatureFlags.reset.bind(FeatureFlags),
        enableAll: this.enableAll.bind(this),
        disableAll: this.disableAll.bind(this),
        status: this.logStatus.bind(this),
      };
      console.info('🚩 Feature flags available at window.mdvFlags');
    }
  }
}
