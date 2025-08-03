/**
 * Integration tests for the complete optimization system
 * 
 * Tests all optimization algorithms working together to achieve
 * the <10 request target across different environments and scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IntegrationTestRunner, IntegrationTestSuite } from './integration-suite';
import { resetGlobalManifestDiscovery } from '../../src/optimization/algorithms/manifest-discovery';
import { FeatureFlags } from '../../src/optimization/foundation/FeatureFlags';

describe('Optimization Integration Tests', () => {
  let testRunner: IntegrationTestRunner;
  let testSuite: IntegrationTestSuite;

  beforeEach(() => {
    testRunner = new IntegrationTestRunner();
    testSuite = new IntegrationTestSuite();
    
    // Reset all global state
    resetGlobalManifestDiscovery();
    FeatureFlags.reset();
  });

  afterEach(() => {
    // Clean up after each test
    resetGlobalManifestDiscovery();
    FeatureFlags.reset();
  });

  describe('Full Optimization Pipeline', () => {
    it('should achieve <10 requests across all optimization scenarios', async () => {
      const results = await testSuite.testFullOptimizationPipeline();
      
      // All scenarios should pass their individual targets
      const failedScenarios = results.filter(r => !r.success);
      expect(failedScenarios).toHaveLength(0);
      
      // Average should be well under 10 requests
      const averageRequests = results.reduce((sum, r) => sum + r.requestCount, 0) / results.length;
      expect(averageRequests).toBeLessThan(10);
      
      // Manifest discovery should achieve 1 request when available
      const manifestScenario = results.find(r => r.discoveryMethod === 'manifest');
      if (manifestScenario) {
        expect(manifestScenario.requestCount).toBeLessThanOrEqual(1);
      }
      
      // Progressive discovery should achieve <8 requests
      const progressiveScenarios = results.filter(r => r.discoveryMethod === 'progressive');
      progressiveScenarios.forEach(scenario => {
        expect(scenario.requestCount).toBeLessThan(8);
      });
    }, 10000); // 10 second timeout for comprehensive test

    it('should complete all tests within 2 seconds each', async () => {
      const results = await testSuite.testFullOptimizationPipeline();
      
      results.forEach(result => {
        expect(result.duration).toBeLessThan(2000);
      });
    });
  });

  describe('Cross-Environment Validation', () => {
    it('should work correctly on GitHub Pages with limitations', async () => {
      const environmentResults = await testSuite.testAcrossEnvironments(['github_pages']);
      const githubResults = environmentResults[0];
      
      expect(githubResults.summary.passedScenarios).toBeGreaterThan(0);
      expect(githubResults.summary.averageRequests).toBeLessThan(10);
    });

    it('should work optimally on Netlify and Vercel', async () => {
      const environmentResults = await testSuite.testAcrossEnvironments(['netlify', 'vercel']);
      
      environmentResults.forEach(envResult => {
        expect(envResult.summary.passedScenarios).toBe(envResult.summary.totalScenarios);
        expect(envResult.summary.averageRequests).toBeLessThan(5); // Should be very optimized
      });
    });

    it('should handle all environments without errors', async () => {
      const environmentResults = await testSuite.testAcrossEnvironments([
        'github_pages',
        'netlify', 
        'vercel',
        'local_dev'
      ]);
      
      environmentResults.forEach(envResult => {
        expect(envResult.results.length).toBeGreaterThan(0);
        // At least 80% of scenarios should pass
        const passRate = envResult.summary.passedScenarios / envResult.summary.totalScenarios;
        expect(passRate).toBeGreaterThanOrEqual(0.8);
      });
    });
  });

  describe('Feature Flag Combinations', () => {
    it('should be stable across all feature flag combinations', async () => {
      const featureResults = await testSuite.testFeatureFlagCombinations();
      
      // At least 90% of combinations should be stable
      const stableCombinations = featureResults.filter(r => r.isStable);
      const stabilityRate = stableCombinations.length / featureResults.length;
      expect(stabilityRate).toBeGreaterThanOrEqual(0.9);
    });

    it('should respect feature flag priorities', async () => {
      const featureResults = await testSuite.testFeatureFlagCombinations();
      
      // Find combinations with manifest discovery enabled
      const manifestEnabled = featureResults.filter(r => 
        r.combination.manifestDiscovery === true
      );
      
      // These should have the lowest request counts
      manifestEnabled.forEach(result => {
        expect(result.requestCount).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Performance Benchmarking', () => {
    it('should show significant improvement over baseline', async () => {
      const scenarios = [
        {
          name: 'Manifest Available',
          environment: 'local_dev' as const,
          featureFlags: { manifestDiscovery: true, smartConfigDiscovery: true },
          expectedRequestCount: 1,
          expectedDiscoveryMethod: 'manifest',
        },
      ];
      
      for (const scenario of scenarios) {
        const benchmark = await testSuite.benchmarkPerformance(scenario);
        
        // Should show at least 85% improvement
        expect(benchmark.improvementPercentage).toBeGreaterThanOrEqual(85);
        
        // Optimized should be <10 requests
        expect(benchmark.optimizedRequests).toBeLessThan(10);
        
        // Baseline should be significantly higher
        expect(benchmark.baselineRequests).toBeGreaterThan(50);
      }
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should gracefully fallback when optimizations fail', async () => {
      // Test with a scenario designed to trigger fallbacks
      const results = await testSuite.testFullOptimizationPipeline();
      
      // Even fallback scenarios should complete successfully
      const fallbackScenarios = results.filter(r => r.discoveryMethod === 'fallback');
      fallbackScenarios.forEach(scenario => {
        expect(scenario.success).toBe(true);
        expect(scenario.errors).toHaveLength(0);
      });
    });

    it('should maintain backward compatibility', async () => {
      const results = await testSuite.testFullOptimizationPipeline();
      
      // Find the "all optimizations disabled" scenario
      const compatibilityScenario = results.find(r => 
        r.scenario.includes('All Optimizations Disabled')
      );
      
      if (compatibilityScenario) {
        expect(compatibilityScenario.success).toBe(true);
        expect(compatibilityScenario.discoveryMethod).toBe('fallback');
      }
    });
  });

  describe('Comprehensive Suite', () => {
    it('should pass the complete integration test suite', async () => {
      const suiteResults = await testRunner.runFullSuite();
      
      // Overall suite should pass
      expect(suiteResults.passed).toBe(true);
      
      // Should achieve optimization target
      expect(suiteResults.summary.optimizationTarget).toBe(true);
      
      // Should have comprehensive coverage
      expect(suiteResults.results.length).toBeGreaterThanOrEqual(5);
      expect(suiteResults.environmentResults.length).toBeGreaterThanOrEqual(4);
      expect(suiteResults.featureResults.length).toBeGreaterThanOrEqual(8);
      expect(suiteResults.benchmarks.length).toBeGreaterThanOrEqual(3);
      
      // All environments should have some passing scenarios
      suiteResults.environmentResults.forEach(envResult => {
        expect(envResult.summary.passedScenarios).toBeGreaterThan(0);
      });
    }, 30000); // 30 second timeout for full suite
  });

  describe('Regression Prevention', () => {
    it('should not break existing API when optimizations are enabled', async () => {
      const results = await testSuite.testFullOptimizationPipeline();
      
      // All discovery methods should return valid results
      results.forEach(result => {
        expect(result.discoveryMethod).toMatch(/^(manifest|smart-config|progressive|fallback)$/);
        expect(result.requestCount).toBeGreaterThan(0);
        expect(result.duration).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent behavior across runs', async () => {
      // Run the same scenario multiple times
      const scenario = {
        name: 'Consistency Test',
        environment: 'local_dev' as const,
        featureFlags: { manifestDiscovery: true },
        expectedRequestCount: 1,
        expectedDiscoveryMethod: 'manifest',
      };
      
      const results = [];
      for (let i = 0; i < 3; i++) {
        const benchmark = await testSuite.benchmarkPerformance(scenario);
        results.push(benchmark.optimizedRequests);
      }
      
      // Results should be consistent (within 20% variance)
      const avg = results.reduce((sum, r) => sum + r, 0) / results.length;
      results.forEach(result => {
        const variance = Math.abs(result - avg) / avg;
        expect(variance).toBeLessThan(0.2);
      });
    });
  });
});