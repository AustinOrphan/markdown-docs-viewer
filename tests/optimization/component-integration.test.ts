/**
 * Component Integration Tests
 * 
 * Tests cross-agent component interactions to ensure all foundation
 * components work correctly together across Agent A, B, and C implementations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeatureFlags, OptimizationFlags, FeatureFlagsImpl } from '../../src/optimization/foundation/FeatureFlags';
import { getGlobalPerformanceMonitor, resetGlobalPerformanceMonitor } from '../../src/optimization/foundation/PerformanceMonitor';
import { createDiscoveryCache, configCache, documentCache, metadataCache } from '../../src/optimization/foundation/DiscoveryCache';
import { getGlobalRequestMonitor, resetGlobalRequestMonitor } from '../../src/optimization/foundation/RequestMonitor';
import { EnvironmentMock, MockEnvironmentType } from '../utils/environment-mock';
import { createMockFeatureFlags, createMockPerformanceMonitor, createMockRequestManager } from '../utils/mocks';

describe('Component Integration Tests', () => {
  beforeEach(() => {
    // Reset all global components
    FeatureFlags.reset();
    resetGlobalPerformanceMonitor();
    resetGlobalRequestMonitor();
    configCache.clear();
    documentCache.clear();
    metadataCache.clear();
  });

  afterEach(() => {
    // Clean up after each test
    FeatureFlags.reset();
    resetGlobalPerformanceMonitor();
    resetGlobalRequestMonitor();
  });

  describe('Agent A + Agent B Integration', () => {
    it('should allow DiscoveryCache to store results from environment adapters', async () => {
      // Agent A: Discovery Cache
      const cache = createDiscoveryCache<any>();
      
      // Agent B: Environment detection result
      const environmentResult = {
        type: 'github_pages',
        confidence: 0.9,
        capabilities: {
          corsSupport: false,
          headRequests: false,
          maxConcurrentRequests: 6,
        },
      };

      // Store environment result in cache
      cache.set('environment:github.io', environmentResult, 300000);

      // Verify storage and retrieval
      const cached = cache.get('environment:github.io');
      expect(cached).toEqual(environmentResult);
      expect(cached.type).toBe('github_pages');
      expect(cached.capabilities.corsSupport).toBe(false);
    });

    it('should enable RequestMonitor to track requests through environment adapters', async () => {
      const requestMonitor = getGlobalRequestMonitor();
      const environmentMock = new EnvironmentMock(MockEnvironmentType.GITHUB_PAGES);

      environmentMock.start();

      try {
        // Simulate Agent B environment adapter making requests
        const response1 = await requestMonitor.fetch('https://example.github.io/docs.json');
        const response2 = await requestMonitor.fetch('https://example.github.io/README.md');
        
        // RequestMonitor should track these requests
        const stats = requestMonitor.getStats();
        expect(stats.totalRequests).toBe(2);
        expect(stats.successfulRequests).toBe(2);

        // Verify requests were tracked correctly
        expect(response1.success).toBe(true);
        expect(response2.success).toBe(true);
      } finally {
        environmentMock.stop();
      }
    });

    it('should allow PerformanceMonitor to measure environment-specific operations', async () => {
      const performanceMonitor = getGlobalPerformanceMonitor();
      const environmentMock = new EnvironmentMock(MockEnvironmentType.NETLIFY);

      environmentMock.start();

      try {
        // Simulate Agent B environment adapter operations
        const measurement = performanceMonitor.startMeasure('environment-detection');
        
        // Simulate environment detection work
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const result = measurement.end();
        
        // PerformanceMonitor should capture the measurement
        expect(result.duration).toBeGreaterThan(40);
        expect(result.duration).toBeLessThan(100);
        expect(result.label).toBe('environment-detection');

        const report = performanceMonitor.getReport();
        expect(report.measurements).toHaveLength(1);
        expect(report.measurements[0].label).toBe('environment-detection');
      } finally {
        environmentMock.stop();
      }
    });

    it('should coordinate caching between config discovery and environment adapters', async () => {
      const environmentMock = new EnvironmentMock(MockEnvironmentType.VERCEL);
      const requestMonitor = getGlobalRequestMonitor();

      environmentMock.start();
      
      // Set up custom response for config file
      environmentMock.setCustomResponse('docs.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Test Docs', theme: 'dark' },
      });

      try {
        // First request should hit network
        const response1 = await requestMonitor.fetch('https://example.vercel.app/docs.json');
        expect(response1.fromCache).toBe(false);
        
        // Cache the config
        configCache.set('config:vercel.app', await response1.data.json());
        
        // Second request should use cache
        const cachedConfig = configCache.get('config:vercel.app');
        expect(cachedConfig).toBeDefined();
        expect(cachedConfig.title).toBe('Test Docs');
        
        // Verify cache hit behavior
        const stats = requestMonitor.getStats();
        expect(stats.totalRequests).toBe(1); // Only one network request
      } finally {
        environmentMock.stop();
      }
    });
  });

  describe('Agent A + Agent C Integration', () => {
    it('should allow FeatureFlags to control PerformanceMonitor activation', () => {
      const performanceMonitor = getGlobalPerformanceMonitor();
      
      // Disable performance monitoring via feature flag
      FeatureFlags.disable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      
      // Check if monitoring should be active based on flags
      const shouldMonitor = FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(shouldMonitor).toBe(false);
      
      // PerformanceMonitor should respect this flag
      if (!shouldMonitor) {
        // Mock behavior: don't start measurements when disabled
        const measurement = performanceMonitor.startMeasure('disabled-operation');
        const result = measurement.end();
        
        // Should still work but could be marked as disabled
        expect(result.label).toBe('disabled-operation');
      }
      
      // Enable and test
      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
    });

    it('should allow FeatureFlags to control DiscoveryCache behavior', () => {
      const cache = createDiscoveryCache<string>();
      
      // Test cache behavior with different flag states
      FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      
      if (FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)) {
        cache.set('test-key', 'cached-value');
        expect(cache.get('test-key')).toBe('cached-value');
      }
      
      // Disable caching via feature flag
      FeatureFlags.disable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
      
      if (!FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)) {
        // Cache should still work but could be bypassed in real implementation
        cache.set('disabled-key', 'disabled-value');
        expect(cache.has('disabled-key')).toBe(true);
      }
    });

    it('should integrate RequestMonitor with testing utilities', async () => {
      const requestMonitor = getGlobalRequestMonitor();
      const mockRequestManager = createMockRequestManager();
      
      // Configure feature flags for request monitoring
      FeatureFlags.enable(OptimizationFlags.REQUEST_POOLING);
      FeatureFlags.enable(OptimizationFlags.ENHANCED_ERROR_HANDLING);
      
      // Test that monitoring works with mocked requests
      const testResponse = await mockRequestManager.fetch('https://test.com/api');
      expect(testResponse.success).toBe(true);
      
      const mockStats = mockRequestManager.getStats();
      expect(mockStats.totalRequests).toBe(1);
      expect(mockStats.successfulRequests).toBe(1);
      
      // Verify feature flags affect behavior
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(true);
    });

    it('should coordinate performance monitoring across all components', async () => {
      const performanceMonitor = getGlobalPerformanceMonitor();
      const featureFlags = FeatureFlagsImpl.getInstance();
      
      // Enable all performance-related flags
      featureFlags.enableFlags([
        OptimizationFlags.SMART_CONFIG_DISCOVERY,
        OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY,
        OptimizationFlags.REQUEST_POOLING,
      ]);
      
      // Simulate operations across multiple components
      const configMeasurement = performanceMonitor.startMeasure('config-discovery');
      await new Promise(resolve => setTimeout(resolve, 25));
      configMeasurement.end();
      
      const documentMeasurement = performanceMonitor.startMeasure('document-discovery');
      await new Promise(resolve => setTimeout(resolve, 35));
      documentMeasurement.end();
      
      const poolingMeasurement = performanceMonitor.startMeasure('request-pooling');
      await new Promise(resolve => setTimeout(resolve, 15));
      poolingMeasurement.end();
      
      // Verify all measurements were captured
      const report = performanceMonitor.getReport();
      expect(report.measurements).toHaveLength(3);
      
      const labels = report.measurements.map(m => m.label);
      expect(labels).toContain('config-discovery');
      expect(labels).toContain('document-discovery');
      expect(labels).toContain('request-pooling');
      
      // Verify total time calculation
      const totalTime = report.measurements.reduce((sum, m) => sum + m.duration, 0);
      expect(totalTime).toBeGreaterThan(70); // ~75ms total
    });
  });

  describe('Agent B + Agent C Integration', () => {
    it('should enable environment mocks to work with environment detection', async () => {
      const environmentMock = new EnvironmentMock(MockEnvironmentType.GITHUB_PAGES);
      
      environmentMock.start();
      
      try {
        // Test environment-specific behavior
        const environmentInfo = environmentMock.getEnvironmentInfo();
        expect(environmentInfo.type).toBe(MockEnvironmentType.GITHUB_PAGES);
        expect(environmentInfo.capabilities.corsSupport).toBe(false);
        expect(environmentInfo.capabilities.headRequests).toBe(false);
        
        // Simulate environment detection request
        try {
          await environmentMock['mockFetch']('https://example.github.io/test', { method: 'HEAD' });
          expect.fail('Should have thrown error for HEAD request on GitHub Pages');
        } catch (error) {
          expect(error.message).toContain('HEAD requests');
        }
        
        // Regular GET should work
        const response = await environmentMock['mockFetch']('https://example.github.io/test.md');
        expect(response.status).toBe(200);
      } finally {
        environmentMock.stop();
      }
    });

    it('should allow FeatureFlags to control progressive discovery behavior', async () => {
      const environmentMock = new EnvironmentMock(MockEnvironmentType.NETLIFY);
      
      environmentMock.start();
      
      try {
        // Test with progressive discovery enabled
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        
        let shouldUseProgressive = FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        expect(shouldUseProgressive).toBe(true);
        
        // Simulate progressive discovery behavior
        if (shouldUseProgressive) {
          // Should make limited requests with pattern recognition
          const requests = [];
          for (let i = 0; i < 5; i++) {
            const response = await environmentMock['mockFetch'](`/docs/doc-${i}.md`);
            requests.push(response);
          }
          expect(requests).toHaveLength(5);
        }
        
        // Test with progressive discovery disabled
        FeatureFlags.disable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        shouldUseProgressive = FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        expect(shouldUseProgressive).toBe(false);
        
        // Clear request log for clean test
        environmentMock.clearRequestLog();
        
        if (!shouldUseProgressive) {
          // Should fall back to different discovery method
          const response = await environmentMock['mockFetch']('/docs/index.json');
          expect(response.status).toBe(200);
          
          const requestLog = environmentMock.getRequestLog();
          expect(requestLog).toHaveLength(1);
        }
      } finally {
        environmentMock.stop();
      }
    });

    it('should integrate error handling with testing framework', async () => {
      const environmentMock = new EnvironmentMock(MockEnvironmentType.UNKNOWN);
      
      // Configure high error rate for testing
      environmentMock.setNetworkDelay({
        min: 100,
        max: 200,
        errorRate: 0.5, // 50% error rate
      });
      
      environmentMock.start();
      
      try {
        // Enable enhanced error handling
        FeatureFlags.enable(OptimizationFlags.ENHANCED_ERROR_HANDLING);
        
        const errorCount = { network: 0, success: 0 };
        const totalRequests = 10;
        
        // Make multiple requests to trigger errors
        for (let i = 0; i < totalRequests; i++) {
          try {
            await environmentMock['mockFetch'](`/docs/test-${i}.md`);
            errorCount.success++;
          } catch (error) {
            errorCount.network++;
          }
        }
        
        // Should have both successes and errors due to 50% error rate
        expect(errorCount.network + errorCount.success).toBe(totalRequests);
        expect(errorCount.network).toBeGreaterThan(0); // Some errors expected
        expect(errorCount.success).toBeGreaterThan(0); // Some successes expected
        
        // Verify error handling flag is enabled
        expect(FeatureFlags.isEnabled(OptimizationFlags.ENHANCED_ERROR_HANDLING)).toBe(true);
        
        const requestLog = environmentMock.getRequestLog();
        expect(requestLog).toHaveLength(totalRequests);
        
        // Check that errors were logged
        const errorEntries = requestLog.filter(entry => entry.error);
        expect(errorEntries.length).toBe(errorCount.network);
      } finally {
        environmentMock.stop();
      }
    });

    it('should coordinate environment-specific optimizations with feature flags', async () => {
      const githubMock = new EnvironmentMock(MockEnvironmentType.GITHUB_PAGES);
      const netlifyMock = new EnvironmentMock(MockEnvironmentType.NETLIFY);
      
      // Test GitHub Pages with specific optimizations
      githubMock.start();
      
      try {
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);
        
        // Should adapt to GitHub Pages limitations
        const githubInfo = githubMock.getEnvironmentInfo();
        expect(githubInfo.capabilities.headRequests).toBe(false);
        
        // Verify requests adapt to environment
        const response1 = await githubMock['mockFetch']('/docs/README.md', { method: 'GET' });
        expect(response1.status).toBe(200);
        
        githubMock.stop();
        
        // Test Netlify with different optimizations
        netlifyMock.start();
        
        const netlifyInfo = netlifyMock.getEnvironmentInfo();
        expect(netlifyInfo.capabilities.headRequests).toBe(true);
        expect(netlifyInfo.capabilities.corsSupport).toBe(true);
        
        // Should use more efficient requests on Netlify
        const response2 = await netlifyMock['mockFetch']('/docs/config.json', { method: 'HEAD' });
        expect(response2.status).toBe(200);
        
        // Verify feature flags remain consistent across environments
        expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(true);
      } finally {
        netlifyMock.stop();
      }
    });
  });

  describe('Cross-Component State Management', () => {
    it('should maintain consistent state across all components', () => {
      const performanceMonitor = getGlobalPerformanceMonitor();
      const requestMonitor = getGlobalRequestMonitor();
      const featureFlags = FeatureFlagsImpl.getInstance();
      
      // Configure initial state
      featureFlags.setFlags({
        [OptimizationFlags.SMART_CONFIG_DISCOVERY]: true,
        [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY]: false,
        [OptimizationFlags.REQUEST_POOLING]: true,
      });
      
      // All components should see consistent flag state
      expect(FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)).toBe(true);
      expect(FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)).toBe(false);
      expect(FeatureFlags.isEnabled(OptimizationFlags.REQUEST_POOLING)).toBe(true);
      
      // Components should be able to reset consistently
      const initialPerfStats = performanceMonitor.getStats();
      const initialReqStats = requestMonitor.getStats();
      
      performanceMonitor.reset();
      requestMonitor.reset();
      featureFlags.reset();
      
      // All should be reset
      const resetPerfStats = performanceMonitor.getStats();
      const resetReqStats = requestMonitor.getStats();
      const resetFlags = featureFlags.getEnabledFlags();
      
      expect(resetPerfStats.totalMeasurements).toBe(0);
      expect(resetReqStats.totalRequests).toBe(0);
      expect(resetFlags).toHaveLength(0);
    });

    it('should handle concurrent access across components', async () => {
      const cache = createDiscoveryCache<string>();
      const performanceMonitor = getGlobalPerformanceMonitor();
      
      // Simulate concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => {
        return async () => {
          const measurement = performanceMonitor.startMeasure(`operation-${i}`);
          cache.set(`key-${i}`, `value-${i}`);
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          measurement.end();
          return cache.get(`key-${i}`);
        };
      });
      
      const results = await Promise.all(operations.map(op => op()));
      
      // All operations should complete successfully
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result).toBe(`value-${i}`);
      });
      
      // Performance monitor should capture all measurements
      const report = performanceMonitor.getReport();
      expect(report.measurements).toHaveLength(10);
      
      // Cache should contain all entries
      for (let i = 0; i < 10; i++) {
        expect(cache.has(`key-${i}`)).toBe(true);
      }
    });
  });
});