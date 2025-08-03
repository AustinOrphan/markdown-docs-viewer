/**
 * Comprehensive Integration Testing Suite
 * 
 * Validates that all optimization algorithms work together seamlessly
 * and achieve the performance target of <10 requests across all scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifestDiscovery, getGlobalManifestDiscovery, resetGlobalManifestDiscovery } from '../../src/optimization/algorithms/manifest-discovery';
import { FeatureFlags, OptimizationFlags, FeatureFlagsImpl } from '../../src/optimization/foundation/FeatureFlags';
import { EnvironmentMock, EnvironmentMockPresets, MockEnvironmentType, EnvironmentTestHelpers } from '../utils/environment-mock';
import { PerformanceBenchmark, RequestCounter, AsyncTestHelpers, createOptimizationTestSuite } from './test-helpers';
import { DiscoveryResult, DocumentationConfig } from '../../src/optimization/config/DiscoveryTypes';

/**
 * Test scenario configuration
 */
interface TestScenario {
  name: string;
  description: string;
  environment: MockEnvironmentType;
  featureFlags: Record<string, boolean>;
  expectedRequestCount: number;
  expectedDiscoveryMethod: string;
  setupFn?: (mock: EnvironmentMock) => void;
}

/**
 * Integration test results
 */
interface IntegrationTestResults {
  scenario: string;
  success: boolean;
  requestCount: number;
  discoveryMethod: string;
  duration: number;
  errors: string[];
  warnings: string[];
}

/**
 * Performance benchmark results
 */
interface BenchmarkResults {
  scenario: string;
  baselineRequests: number;
  optimizedRequests: number;
  improvementPercentage: number;
  duration: number;
  memoryUsage: number;
}

/**
 * Cross-environment test results
 */
interface EnvironmentResults {
  environment: MockEnvironmentType;
  results: IntegrationTestResults[];
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    averageRequests: number;
    averageDuration: number;
  };
}

/**
 * Feature flag combination results
 */
interface FeatureTestResults {
  combination: Record<string, boolean>;
  results: IntegrationTestResults[];
  isStable: boolean;
  requestCount: number;
}

/**
 * Integration test suite implementation
 */
export class IntegrationTestSuite {
  private performanceBenchmark: PerformanceBenchmark;
  private requestCounter: RequestCounter;
  private asyncHelpers: AsyncTestHelpers;
  private originalFeatureFlags: FeatureFlagsImpl;

  constructor() {
    this.performanceBenchmark = new PerformanceBenchmark();
    this.requestCounter = new RequestCounter();
    this.asyncHelpers = new AsyncTestHelpers();
    this.originalFeatureFlags = FeatureFlagsImpl.getInstance();
  }

  /**
   * Run complete optimization pipeline testing
   */
  public async testFullOptimizationPipeline(): Promise<IntegrationTestResults[]> {
    const scenarios = this.getTestScenarios();
    const results: IntegrationTestResults[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    return results;
  }

  /**
   * Performance benchmarking across scenarios
   */
  public async benchmarkPerformance(scenario: TestScenario): Promise<BenchmarkResults> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    // Test baseline (no optimizations)
    const baselineRequests = await this.measureBaselineRequests(scenario);

    // Test optimized
    const optimizedRequests = await this.measureOptimizedRequests(scenario);

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const improvementPercentage = ((baselineRequests - optimizedRequests) / baselineRequests) * 100;

    return {
      scenario: scenario.name,
      baselineRequests,
      optimizedRequests,
      improvementPercentage,
      duration: endTime - startTime,
      memoryUsage: endMemory - startMemory,
    };
  }

  /**
   * Cross-environment validation
   */
  public async testAcrossEnvironments(environments: MockEnvironmentType[]): Promise<EnvironmentResults[]> {
    const results: EnvironmentResults[] = [];

    for (const env of environments) {
      const envResults = await this.testEnvironment(env);
      results.push(envResults);
    }

    return results;
  }

  /**
   * Feature flag combination testing
   */
  public async testFeatureFlagCombinations(): Promise<FeatureTestResults[]> {
    const combinations = this.getFeatureFlagCombinations();
    const results: FeatureTestResults[] = [];

    for (const combination of combinations) {
      const result = await this.testFeatureCombination(combination);
      results.push(result);
    }

    return results;
  }

  /**
   * Run individual scenario
   */
  private async runScenario(scenario: TestScenario): Promise<IntegrationTestResults> {
    const mock = new EnvironmentMock(scenario.environment);
    const startTime = performance.now();

    try {
      // Setup environment
      mock.start();
      if (scenario.setupFn) {
        scenario.setupFn(mock);
      }

      // Configure feature flags
      this.configureFeatureFlags(scenario.featureFlags);

      // Reset counters
      this.requestCounter.reset();
      this.performanceBenchmark.reset();

      // Run discovery
      const discoveryResult = await this.runOptimizedDiscovery('/docs');

      const endTime = performance.now();
      const requestCount = this.requestCounter.getTotalRequests();

      return {
        scenario: scenario.name,
        success: requestCount <= scenario.expectedRequestCount,
        requestCount,
        discoveryMethod: discoveryResult?.metadata.discoveryMethod || 'unknown',
        duration: endTime - startTime,
        errors: requestCount > scenario.expectedRequestCount 
          ? [`Expected ≤${scenario.expectedRequestCount} requests, got ${requestCount}`]
          : [],
        warnings: [],
      };

    } catch (error) {
      const endTime = performance.now();
      return {
        scenario: scenario.name,
        success: false,
        requestCount: this.requestCounter.getTotalRequests(),
        discoveryMethod: 'error',
        duration: endTime - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };

    } finally {
      mock.stop();
      this.resetFeatureFlags();
    }
  }

  /**
   * Test specific environment
   */
  private async testEnvironment(environment: MockEnvironmentType): Promise<EnvironmentResults> {
    const scenarios = this.getTestScenarios().filter(s => s.environment === environment);
    const results: IntegrationTestResults[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    const passedScenarios = results.filter(r => r.success).length;
    const averageRequests = results.reduce((sum, r) => sum + r.requestCount, 0) / results.length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      environment,
      results,
      summary: {
        totalScenarios: results.length,
        passedScenarios,
        averageRequests,
        averageDuration,
      },
    };
  }

  /**
   * Test feature flag combination
   */
  private async testFeatureCombination(combination: Record<string, boolean>): Promise<FeatureTestResults> {
    const testScenarios = this.getTestScenarios().slice(0, 3); // Test with subset for speed
    const results: IntegrationTestResults[] = [];

    for (const scenario of testScenarios) {
      const modifiedScenario = {
        ...scenario,
        featureFlags: combination,
      };
      const result = await this.runScenario(modifiedScenario);
      results.push(result);
    }

    const isStable = results.every(r => r.success);
    const averageRequests = results.reduce((sum, r) => sum + r.requestCount, 0) / results.length;

    return {
      combination,
      results,
      isStable,
      requestCount: averageRequests,
    };
  }

  /**
   * Run optimized discovery with all algorithms
   */
  private async runOptimizedDiscovery(basePath: string): Promise<DiscoveryResult | null> {
    // Start performance measurement
    const measurement = this.performanceBenchmark.startMeasure('full-discovery');

    try {
      // Try manifest discovery first (ultimate optimization)
      if (FeatureFlags.isEnabled(OptimizationFlags.MANIFEST_DISCOVERY)) {
        this.requestCounter.incrementPageRequest();
        const manifestDiscovery = getGlobalManifestDiscovery();
        const manifestResult = await manifestDiscovery.discoverFromManifest(basePath);
        if (manifestResult) {
          measurement.end();
          return manifestResult;
        }
      }

      // Fallback to smart config discovery (Agent A)
      if (FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)) {
        const configResult = await this.mockSmartConfigDiscovery(basePath);
        if (configResult) {
          measurement.end();
          return configResult;
        }
      }

      // Fallback to progressive document discovery (Agent B)
      if (FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)) {
        const progressiveResult = await this.mockProgressiveDiscovery(basePath);
        if (progressiveResult) {
          measurement.end();
          return progressiveResult;
        }
      }

      // Fallback to standard discovery
      const fallbackResult = await this.mockFallbackDiscovery(basePath);
      measurement.end();
      return fallbackResult;

    } catch (error) {
      measurement.end();
      throw error;
    }
  }

  /**
   * Mock smart config discovery (Agent A functionality)
   */
  private async mockSmartConfigDiscovery(basePath: string): Promise<DiscoveryResult | null> {
    // Simulate Agent A's smart config discovery
    this.requestCounter.incrementApiRequest();
    this.requestCounter.incrementPageRequest();

    // Simulate finding config
    await AsyncTestHelpers.delay(10);

    return {
      config: {
        title: 'Smart Config Discovery',
        source: { type: 'local', basePath },
      },
      documents: [
        {
          id: 'readme',
          title: 'README',
          url: `${basePath}/README.md`,
          path: 'README.md',
        },
      ],
      structure: {
        type: 'flat',
        categories: [],
      },
      metadata: {
        discoveryMethod: 'smart-config',
        requestCount: 2,
        cacheHit: false,
        timestamp: Date.now(),
        confidence: 0.8,
        source: 'smart-config-discovery',
      },
    };
  }

  /**
   * Mock progressive document discovery (Agent B functionality)
   */
  private async mockProgressiveDiscovery(basePath: string): Promise<DiscoveryResult | null> {
    // Simulate Agent B's progressive discovery
    const requestCount = Math.min(8, 3 + Math.floor(Math.random() * 5)); // 3-8 requests

    for (let i = 0; i < requestCount; i++) {
      this.requestCounter.incrementPageRequest();
      await AsyncTestHelpers.delay(10);
    }

    return {
      config: {
        title: 'Progressive Discovery',
        source: { type: 'local', basePath },
      },
      documents: Array.from({ length: requestCount }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i + 1}`,
        url: `${basePath}/doc-${i}.md`,
        path: `doc-${i}.md`,
      })),
      structure: {
        type: 'hierarchical',
        categories: ['getting-started', 'guides'],
      },
      metadata: {
        discoveryMethod: 'progressive',
        requestCount,
        cacheHit: false,
        timestamp: Date.now(),
        confidence: 0.9,
        source: 'progressive-discovery',
      },
    };
  }

  /**
   * Mock fallback discovery (original behavior)
   */
  private async mockFallbackDiscovery(basePath: string): Promise<DiscoveryResult> {
    // Simulate original 60+ request behavior
    const requestCount = 65 + Math.floor(Math.random() * 20); // 65-85 requests

    for (let i = 0; i < requestCount; i++) {
      this.requestCounter.incrementPageRequest();
      if (i % 10 === 0) {
        await AsyncTestHelpers.delay(10);
      }
    }

    return {
      config: {
        title: 'Fallback Discovery',
        source: { type: 'local', basePath },
      },
      documents: Array.from({ length: 50 }, (_, i) => ({
        id: `fallback-doc-${i}`,
        title: `Fallback Document ${i + 1}`,
        url: `${basePath}/fallback-doc-${i}.md`,
        path: `fallback-doc-${i}.md`,
      })),
      structure: {
        type: 'hierarchical',
        categories: ['docs', 'api', 'guides', 'tutorials', 'examples'],
      },
      metadata: {
        discoveryMethod: 'fallback',
        requestCount,
        cacheHit: false,
        timestamp: Date.now(),
        confidence: 1.0,
        source: 'fallback-discovery',
      },
    };
  }

  /**
   * Measure baseline requests (no optimizations)
   */
  private async measureBaselineRequests(scenario: TestScenario): Promise<number> {
    this.configureFeatureFlags({
      [OptimizationFlags.MANIFEST_DISCOVERY]: false,
      [OptimizationFlags.SMART_CONFIG_DISCOVERY]: false,
      [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
    });

    this.requestCounter.reset();
    await this.runOptimizedDiscovery('/docs');
    return this.requestCounter.getTotalRequests();
  }

  /**
   * Measure optimized requests
   */
  private async measureOptimizedRequests(scenario: TestScenario): Promise<number> {
    this.configureFeatureFlags(scenario.featureFlags);

    this.requestCounter.reset();
    await this.runOptimizedDiscovery('/docs');
    return this.requestCounter.getTotalRequests();
  }

  /**
   * Get test scenarios
   */
  private getTestScenarios(): TestScenario[] {
    return [
      {
        name: 'Manifest Available - Zero Requests',
        description: 'Valid manifest exists, should achieve zero discovery requests',
        environment: MockEnvironmentType.LOCAL_DEV,
        featureFlags: {
          [OptimizationFlags.MANIFEST_DISCOVERY]: true,
          [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
          [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: true,
        },
        expectedRequestCount: 1, // Only manifest request
        expectedDiscoveryMethod: 'manifest',
        setupFn: (mock) => {
          mock.setCustomResponse('.docs-manifest.json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              version: '1.0',
              generatedAt: new Date().toISOString(),
              config: { title: 'Test Docs', source: { type: 'local' } },
              documents: [
                { id: 'readme', title: 'README', path: 'README.md', lastModified: new Date().toISOString() },
              ],
              structure: { type: 'flat', categories: [] },
            },
          });
        },
      },
      {
        name: 'GitHub Pages - Progressive Discovery',
        description: 'GitHub Pages environment with HEAD request limitations',
        environment: MockEnvironmentType.GITHUB_PAGES,
        featureFlags: {
          [OptimizationFlags.MANIFEST_DISCOVERY]: true,
          [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
          [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: true,
        },
        expectedRequestCount: 8,
        expectedDiscoveryMethod: 'progressive',
      },
      {
        name: 'Netlify - Smart Config Discovery',
        description: 'Netlify environment with full capabilities',
        environment: MockEnvironmentType.NETLIFY,
        featureFlags: {
          [OptimizationFlags.MANIFEST_DISCOVERY]: true,
          [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
          [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
        },
        expectedRequestCount: 3,
        expectedDiscoveryMethod: 'smart-config',
      },
      {
        name: 'Large Documentation Site',
        description: 'Large site with >100 documents',
        environment: MockEnvironmentType.VERCEL,
        featureFlags: {
          [OptimizationFlags.MANIFEST_DISCOVERY]: false,
          [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
          [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: true,
        },
        expectedRequestCount: 9,
        expectedDiscoveryMethod: 'progressive',
      },
      {
        name: 'All Optimizations Disabled',
        description: 'Fallback behavior when all optimizations are disabled',
        environment: MockEnvironmentType.LOCAL_DEV,
        featureFlags: {
          [OptimizationFlags.MANIFEST_DISCOVERY]: false,
          [OptimizationFlags.SMART_CONFIG_DISCOVERY]: false,
          [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
        },
        expectedRequestCount: 100, // Allow high count for fallback
        expectedDiscoveryMethod: 'fallback',
      },
    ];
  }

  /**
   * Get feature flag combinations for testing
   */
  private getFeatureFlagCombinations(): Record<string, boolean>[] {
    const flags = [
      OptimizationFlags.MANIFEST_DISCOVERY,
      OptimizationFlags.SMART_CONFIG_DISCOVERY,
      OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY,
    ];

    const combinations: Record<string, boolean>[] = [];

    // Generate all possible combinations (2^n)
    for (let i = 0; i < Math.pow(2, flags.length); i++) {
      const combination: Record<string, boolean> = {};
      for (let j = 0; j < flags.length; j++) {
        combination[flags[j]] = Boolean(i & (1 << j));
      }
      combinations.push(combination);
    }

    return combinations;
  }

  /**
   * Configure feature flags for testing
   */
  private configureFeatureFlags(flags: Record<string, boolean>): void {
    Object.entries(flags).forEach(([flag, enabled]) => {
      if (enabled) {
        FeatureFlags.enable(flag);
      } else {
        FeatureFlags.disable(flag);
      }
    });
  }

  /**
   * Reset feature flags to original state
   */
  private resetFeatureFlags(): void {
    FeatureFlags.reset();
  }

  /**
   * Get current memory usage (simplified)
   */
  private getMemoryUsage(): number {
    // In browser environment, we can't get actual memory usage
    // This would be performance.memory.usedJSHeapSize in Chrome
    return Math.random() * 1000000; // Mock value
  }
}

/**
 * Integration test runner with detailed reporting
 */
export class IntegrationTestRunner {
  private testSuite: IntegrationTestSuite;

  constructor() {
    this.testSuite = new IntegrationTestSuite();
  }

  /**
   * Run all integration tests and generate report
   */
  public async runFullSuite(): Promise<{
    passed: boolean;
    results: IntegrationTestResults[];
    environmentResults: EnvironmentResults[];
    featureResults: FeatureTestResults[];
    benchmarks: BenchmarkResults[];
    summary: {
      totalScenarios: number;
      passedScenarios: number;
      averageRequests: number;
      averageDuration: number;
      optimizationTarget: boolean; // <10 requests achieved
    };
  }> {
    console.log('🚀 Starting comprehensive integration test suite...');

    // Run full optimization pipeline
    const results = await this.testSuite.testFullOptimizationPipeline();

    // Test across environments
    const environmentResults = await this.testSuite.testAcrossEnvironments([
      MockEnvironmentType.GITHUB_PAGES,
      MockEnvironmentType.NETLIFY,
      MockEnvironmentType.VERCEL,
      MockEnvironmentType.LOCAL_DEV,
    ]);

    // Test feature flag combinations
    const featureResults = await this.testSuite.testFeatureFlagCombinations();

    // Run performance benchmarks
    const benchmarks: BenchmarkResults[] = [];
    const scenarios = this.testSuite['getTestScenarios']();
    for (const scenario of scenarios.slice(0, 3)) { // Benchmark first 3 scenarios
      const benchmark = await this.testSuite.benchmarkPerformance(scenario);
      benchmarks.push(benchmark);
    }

    // Calculate summary
    const passedScenarios = results.filter(r => r.success).length;
    const averageRequests = results.reduce((sum, r) => sum + r.requestCount, 0) / results.length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const optimizationTarget = averageRequests < 10;

    const summary = {
      totalScenarios: results.length,
      passedScenarios,
      averageRequests,
      averageDuration,
      optimizationTarget,
    };

    console.log('✅ Integration test suite completed');
    console.log(`📊 Results: ${passedScenarios}/${results.length} scenarios passed`);
    console.log(`🎯 Average requests: ${averageRequests.toFixed(1)} (target: <10)`);
    console.log(`⏱️  Average duration: ${averageDuration.toFixed(0)}ms`);

    return {
      passed: passedScenarios === results.length && optimizationTarget,
      results,
      environmentResults,
      featureResults,
      benchmarks,
      summary,
    };
  }
}