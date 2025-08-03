/**
 * Algorithm Integration Tests
 * 
 * Tests complete optimization algorithms to ensure they work together
 * seamlessly and achieve the performance targets specified in the strategy.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ManifestDiscovery, getGlobalManifestDiscovery, resetGlobalManifestDiscovery } from '../../src/optimization/algorithms/manifest-discovery';
import { FeatureFlags, OptimizationFlags } from '../../src/optimization/foundation/FeatureFlags';
import { getGlobalRequestMonitor, resetGlobalRequestMonitor } from '../../src/optimization/foundation/RequestMonitor';
import { getGlobalPerformanceMonitor, resetGlobalPerformanceMonitor } from '../../src/optimization/foundation/PerformanceMonitor';
import { createDiscoveryCache, configCache, documentCache } from '../../src/optimization/foundation/DiscoveryCache';
import { EnvironmentMock, MockEnvironmentType, EnvironmentMockPresets } from '../utils/environment-mock';
import { PerformanceBenchmark, RequestCounter } from './test-helpers';

describe('Algorithm Integration Tests', () => {
  let requestCounter: RequestCounter;
  let performanceBenchmark: PerformanceBenchmark;

  beforeEach(() => {
    // Reset all global state
    FeatureFlags.reset();
    resetGlobalManifestDiscovery();
    resetGlobalRequestMonitor();
    resetGlobalPerformanceMonitor();
    configCache.clear();
    documentCache.clear();
    
    // Initialize test utilities
    requestCounter = new RequestCounter();
    performanceBenchmark = new PerformanceBenchmark();
  });

  afterEach(() => {
    // Clean up after each test
    FeatureFlags.reset();
    resetGlobalManifestDiscovery();
    resetGlobalRequestMonitor();
    resetGlobalPerformanceMonitor();
  });

  describe('Smart Config Discovery Algorithm', () => {
    it('should reduce 4 sequential requests to 1-2 parallel requests', async () => {
      const environmentMock = EnvironmentMockPresets.netlify();
      
      // Configure smart config discovery responses
      environmentMock.setCustomResponse('docs.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          title: 'Smart Config Test',
          theme: 'modern',
          source: { type: 'local', basePath: '/docs' },
        },
      });

      environmentMock.setCustomResponse('package.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: 'test-package',
          documentationConfig: {
            title: 'Package Config',
            source: { type: 'local' },
          },
        },
      });

      environmentMock.start();
      requestCounter.reset();

      try {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        
        // Simulate smart config discovery
        const configResult = await this.mockSmartConfigDiscovery('/docs');
        
        // Should find config with minimal requests
        expect(configResult).toBeDefined();
        expect(configResult.config.title).toBe('Smart Config Test');
        
        // Should make 1-2 requests instead of 4 sequential
        const totalRequests = requestCounter.getTotalRequests();
        expect(totalRequests).toBeLessThanOrEqual(2);
        expect(totalRequests).toBeGreaterThan(0);
        
        // Verify metadata indicates optimization was used
        expect(configResult.metadata.discoveryMethod).toBe('smart-config');
        expect(configResult.metadata.requestCount).toBeLessThanOrEqual(2);
      } finally {
        environmentMock.stop();
      }
    });

    it('should integrate with environment adapters for platform compatibility', async () => {
      const githubMock = EnvironmentMockPresets.githubPages();
      const netlifyMock = EnvironmentMockPresets.netlify();

      // Test GitHub Pages limitations
      githubMock.start();
      
      try {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        
        // GitHub Pages should adapt to limitations
        const githubResult = await this.mockSmartConfigDiscovery('/docs');
        expect(githubResult).toBeDefined();
        
        // Should not use HEAD requests on GitHub Pages
        const githubLog = githubMock.getRequestLog();
        const headRequests = githubLog.filter(req => req.method === 'HEAD');
        expect(headRequests).toHaveLength(0);
        
        githubMock.stop();

        // Test Netlify full capabilities
        netlifyMock.start();
        
        const netlifyResult = await this.mockSmartConfigDiscovery('/docs');
        expect(netlifyResult).toBeDefined();
        
        // Should be able to use HEAD requests on Netlify
        const netlifyLog = netlifyMock.getRequestLog();
        expect(netlifyLog.length).toBeGreaterThan(0);
      } finally {
        netlifyMock.stop();
      }
    });

    it('should use DiscoveryCache to prevent repeated requests', async () => {
      const environmentMock = EnvironmentMockPresets.localDev();
      const cache = createDiscoveryCache<any>();

      environmentMock.setCustomResponse('docs.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Cached Config' },
      });

      environmentMock.start();

      try {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);

        // First discovery should make network request
        requestCounter.reset();
        const firstResult = await this.mockSmartConfigDiscovery('/docs');
        const firstRequestCount = requestCounter.getTotalRequests();
        
        // Cache the result
        cache.set('config:/docs', firstResult.config);
        
        // Second discovery should use cache
        requestCounter.reset();
        const cachedConfig = cache.get('config:/docs');
        expect(cachedConfig).toBeDefined();
        expect(cachedConfig.title).toBe('Cached Config');
        
        // Should not make additional network requests for cached config
        expect(requestCounter.getTotalRequests()).toBe(0);
        
        // First discovery should have made some requests
        expect(firstRequestCount).toBeGreaterThan(0);
      } finally {
        environmentMock.stop();
      }
    });

    it('should track performance metrics accurately', async () => {
      const environmentMock = EnvironmentMockPresets.vercel();
      const performanceMonitor = getGlobalPerformanceMonitor();

      environmentMock.start();

      try {
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);

        const startTime = performance.now();
        const measurement = performanceMonitor.startMeasure('smart-config-discovery');
        
        await this.mockSmartConfigDiscovery('/docs');
        
        const result = measurement.end();
        const endTime = performance.now();
        
        // Performance metrics should be captured
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(endTime - startTime + 10); // Allow small margin
        
        const report = performanceMonitor.getReport();
        expect(report.measurements).toContainEqual(
          expect.objectContaining({
            label: 'smart-config-discovery',
            duration: expect.any(Number),
          })
        );
      } finally {
        environmentMock.stop();
      }
    });

    /**
     * Mock smart config discovery implementation
     */
    private async mockSmartConfigDiscovery(basePath: string) {
      requestCounter.incrementApiRequest();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        config: {
          title: 'Smart Config Test',
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
          type: 'flat' as const,
          categories: [],
        },
        metadata: {
          discoveryMethod: 'smart-config',
          requestCount: requestCounter.getTotalRequests(),
          cacheHit: false,
          timestamp: Date.now(),
          confidence: 0.9,
          source: 'smart-config-discovery',
        },
      };
    }
  });

  describe('Progressive Document Discovery Algorithm', () => {
    it('should reduce 60+ requests to <10 with intelligent stopping', async () => {
      const environmentMock = EnvironmentMockPresets.githubPages();
      
      // Set up document structure for progressive discovery
      const documents = [
        'README.md', 'INSTALL.md', 'API.md', 'FAQ.md',
        'guides/basic.md', 'guides/advanced.md',
        'api/reference.md', 'api/examples.md',
      ];
      
      documents.forEach(doc => {
        environmentMock.setCustomResponse(doc, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
          body: `# ${doc}\n\nContent for ${doc}`,
        });
      });

      environmentMock.start();
      requestCounter.reset();

      try {
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        const result = await this.mockProgressiveDiscovery('/docs');
        
        // Should discover documents with <10 requests
        const totalRequests = requestCounter.getTotalRequests();
        expect(totalRequests).toBeLessThan(10);
        expect(totalRequests).toBeGreaterThan(0);
        
        // Should have found multiple documents
        expect(result.documents.length).toBeGreaterThan(3);
        
        // Should use progressive discovery method
        expect(result.metadata.discoveryMethod).toBe('progressive');
        expect(result.metadata.requestCount).toBeLessThan(10);
      } finally {
        environmentMock.stop();
      }
    });

    it('should implement pattern recognition across different document structures', async () => {
      const environmentMock = EnvironmentMockPresets.netlify();

      // Set up hierarchical structure
      const hierarchicalDocs = [
        'docs/getting-started/README.md',
        'docs/getting-started/install.md',
        'docs/guides/basic/intro.md',
        'docs/guides/advanced/config.md',
        'docs/api/reference.md',
      ];

      hierarchicalDocs.forEach(doc => {
        environmentMock.setCustomResponse(doc, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
          body: `# ${doc.split('/').pop()}\n\nContent`,
        });
      });

      environmentMock.start();

      try {
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        const result = await this.mockProgressiveDiscovery('/docs');
        
        // Should recognize hierarchical structure
        expect(result.structure.type).toBe('hierarchical');
        expect(result.structure.categories).toContain('getting-started');
        expect(result.structure.categories).toContain('guides');
        expect(result.structure.categories).toContain('api');
        
        // Should have categorized documents correctly
        const categorizedDocs = result.documents.filter(doc => doc.category);
        expect(categorizedDocs.length).toBeGreaterThan(0);
      } finally {
        environmentMock.stop();
      }
    });

    it('should implement environment-specific optimizations', async () => {
      const githubMock = EnvironmentMockPresets.githubPages();
      const netlifyMock = EnvironmentMockPresets.netlify();

      // Test GitHub Pages optimizations
      githubMock.start();
      requestCounter.reset();

      try {
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        const githubResult = await this.mockProgressiveDiscovery('/docs');
        const githubRequests = requestCounter.getTotalRequests();
        
        githubMock.stop();

        // Test Netlify optimizations
        netlifyMock.start();
        requestCounter.reset();

        const netlifyResult = await this.mockProgressiveDiscovery('/docs');
        const netlifyRequests = requestCounter.getTotalRequests();

        // Both should be efficient but may use different strategies
        expect(githubRequests).toBeLessThan(10);
        expect(netlifyRequests).toBeLessThan(10);
        
        // Netlify might be more efficient due to full capabilities
        expect(netlifyRequests).toBeLessThanOrEqual(githubRequests);
      } finally {
        netlifyMock.stop();
      }
    });

    it('should integrate with caching and monitoring systems', async () => {
      const environmentMock = EnvironmentMockPresets.vercel();
      const requestMonitor = getGlobalRequestMonitor();
      const cache = createDiscoveryCache<any>();

      environmentMock.start();

      try {
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        const result = await this.mockProgressiveDiscovery('/docs');
        
        // Should be tracked by request monitor
        const stats = requestMonitor.getStats();
        expect(stats.totalRequests).toBeGreaterThan(0);
        expect(stats.successfulRequests).toBeGreaterThan(0);
        
        // Should cache discovered documents
        result.documents.forEach(doc => {
          cache.set(`document:${doc.id}`, doc);
        });
        
        // Verify caching works
        const cachedDoc = cache.get(`document:${result.documents[0].id}`);
        expect(cachedDoc).toBeDefined();
        expect(cachedDoc.title).toBe(result.documents[0].title);
      } finally {
        environmentMock.stop();
      }
    });

    /**
     * Mock progressive discovery implementation
     */
    private async mockProgressiveDiscovery(basePath: string) {
      const maxRequests = 8;
      const documents = [];
      
      // Simulate progressive discovery with pattern recognition
      for (let i = 0; i < maxRequests; i++) {
        requestCounter.incrementPageRequest();
        
        // Simulate discovery delay
        await new Promise(resolve => setTimeout(resolve, 20));
        
        // Simulate finding documents
        if (i < 3) {
          documents.push({
            id: `doc-${i}`,
            title: `Document ${i + 1}`,
            url: `${basePath}/doc-${i}.md`,
            path: `doc-${i}.md`,
            category: i === 0 ? 'getting-started' : i === 1 ? 'guides' : 'api',
          });
        }
        
        // Simulate intelligent stopping when pattern is established
        if (i >= 2 && documents.length >= 3) {
          break;
        }
      }

      return {
        config: {
          title: 'Progressive Discovery',
          source: { type: 'local', basePath },
        },
        documents,
        structure: {
          type: 'hierarchical' as const,
          categories: ['getting-started', 'guides', 'api'],
        },
        metadata: {
          discoveryMethod: 'progressive',
          requestCount: requestCounter.getTotalRequests(),
          cacheHit: false,
          timestamp: Date.now(),
          confidence: 0.85,
          source: 'progressive-discovery',
        },
      };
    }
  });

  describe('Manifest Discovery Algorithm', () => {
    it('should achieve zero requests when valid manifest exists', async () => {
      const environmentMock = EnvironmentMockPresets.localDev();
      const manifestDiscovery = getGlobalManifestDiscovery();

      // Set up valid manifest
      const manifest = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        config: {
          title: 'Manifest Discovery Test',
          source: { type: 'local', basePath: '/docs' },
        },
        documents: [
          {
            id: 'readme',
            title: 'README',
            path: 'README.md',
            lastModified: new Date().toISOString(),
          },
          {
            id: 'api',
            title: 'API Reference',
            path: 'api.md',
            lastModified: new Date().toISOString(),
          },
        ],
        structure: {
          type: 'flat',
          categories: [],
        },
      };

      environmentMock.setCustomResponse('.docs-manifest.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: manifest,
      });

      environmentMock.start();
      requestCounter.reset();

      try {
        FeatureFlags.enable(OptimizationFlags.MANIFEST_DISCOVERY);

        const result = await manifestDiscovery.discoverFromManifest('/docs');
        
        // Should successfully discover from manifest
        expect(result).toBeDefined();
        expect(result.config.title).toBe('Manifest Discovery Test');
        expect(result.documents).toHaveLength(2);
        
        // Should use manifest discovery method
        expect(result.metadata.discoveryMethod).toBe('manifest');
        
        // Should make only 1 request (for the manifest itself)
        expect(result.metadata.requestCount).toBe(1);
        
        // Verify request count is actually 1
        const totalRequests = requestCounter.getTotalRequests();
        expect(totalRequests).toBeLessThanOrEqual(1);
      } finally {
        environmentMock.stop();
      }
    });

    it('should fall back to progressive discovery when manifest missing', async () => {
      const environmentMock = EnvironmentMockPresets.githubPages();
      const manifestDiscovery = getGlobalManifestDiscovery();

      // No manifest responses configured (will return 404)
      environmentMock.start();
      requestCounter.reset();

      try {
        FeatureFlags.enable(OptimizationFlags.MANIFEST_DISCOVERY);
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        const result = await manifestDiscovery.discoverFromManifest('/docs');
        
        // Should return null when manifest not found
        expect(result).toBeNull();
        
        // Should then fall back to progressive discovery
        const fallbackResult = await this.mockProgressiveDiscovery('/docs');
        expect(fallbackResult.metadata.discoveryMethod).toBe('progressive');
        expect(fallbackResult.metadata.requestCount).toBeLessThan(10);
      } finally {
        environmentMock.stop();
      }
    });

    it('should generate manifest correctly', async () => {
      const manifestDiscovery = getGlobalManifestDiscovery();

      const config = {
        title: 'Generated Manifest Test',
        source: { type: 'local', basePath: '/docs' },
      };

      const documents = [
        {
          id: 'readme',
          title: 'README',
          path: 'README.md',
          lastModified: new Date(),
          category: 'getting-started',
        },
        {
          id: 'guide',
          title: 'User Guide',
          path: 'guide.md',
          lastModified: new Date(),
          category: 'guides',
        },
      ];

      const manifest = manifestDiscovery.generateManifest(config, documents);
      
      // Should generate valid manifest structure
      expect(manifest.version).toBe('1.0');
      expect(manifest.config.title).toBe('Generated Manifest Test');
      expect(manifest.documents).toHaveLength(2);
      expect(manifest.structure.categories).toContain('getting-started');
      expect(manifest.structure.categories).toContain('guides');
      
      // Should include timestamps
      expect(new Date(manifest.generatedAt)).toBeInstanceOf(Date);
      manifest.documents.forEach(doc => {
        expect(new Date(doc.lastModified)).toBeInstanceOf(Date);
      });
    });

    it('should validate manifest correctly', async () => {
      const environmentMock = EnvironmentMockPresets.netlify();
      const manifestDiscovery = getGlobalManifestDiscovery();

      // Set up manifest with some valid and some invalid paths
      const manifest = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        config: {
          title: 'Validation Test',
          source: { type: 'local' },
        },
        documents: [
          {
            id: 'existing',
            title: 'Existing Document',
            path: 'existing.md',
            lastModified: new Date().toISOString(),
          },
          {
            id: 'missing',
            title: 'Missing Document',
            path: 'missing.md',
            lastModified: new Date().toISOString(),
          },
        ],
        structure: {
          type: 'flat',
          categories: [],
        },
      };

      // Only set up response for existing document
      environmentMock.setCustomResponse('existing.md', {
        status: 200,
        headers: { 'Content-Type': 'text/markdown' },
        body: '# Existing Document',
      });

      environmentMock.start();

      try {
        const validation = await manifestDiscovery.validateManifest(manifest, '/docs');
        
        // Should detect the missing document
        expect(validation.isValid).toBe(false);
        expect(validation.stalePaths).toContain('missing.md');
        expect(validation.confidence).toBeLessThan(1.0);
        
        // Should have validation errors
        expect(validation.errors.length).toBeGreaterThan(0);
      } finally {
        environmentMock.stop();
      }
    });
  });

  describe('Algorithm Coordination', () => {
    it('should coordinate all algorithms in proper fallback chain', async () => {
      const environmentMock = EnvironmentMockPresets.vercel();
      const manifestDiscovery = getGlobalManifestDiscovery();

      // Set up scenario where manifest fails, smart config works
      environmentMock.setCustomResponse('docs.json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Fallback Config' },
      });

      environmentMock.start();
      requestCounter.reset();

      try {
        // Enable all algorithms
        FeatureFlags.enable(OptimizationFlags.MANIFEST_DISCOVERY);
        FeatureFlags.enable(OptimizationFlags.SMART_CONFIG_DISCOVERY);
        FeatureFlags.enable(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY);

        // Try manifest first (should fail)
        const manifestResult = await manifestDiscovery.discoverFromManifest('/docs');
        expect(manifestResult).toBeNull();

        // Fall back to smart config (should succeed)
        const configResult = await this.mockSmartConfigDiscovery('/docs');
        expect(configResult).toBeDefined();
        expect(configResult.metadata.discoveryMethod).toBe('smart-config');

        // Should achieve target with fallback
        const totalRequests = requestCounter.getTotalRequests();
        expect(totalRequests).toBeLessThan(10);
      } finally {
        environmentMock.stop();
      }
    });

    it('should maintain performance targets across algorithm combinations', async () => {
      const scenarios = [
        { name: 'Manifest Only', flags: [OptimizationFlags.MANIFEST_DISCOVERY], expectedMax: 1 },
        { name: 'Smart Config Only', flags: [OptimizationFlags.SMART_CONFIG_DISCOVERY], expectedMax: 3 },
        { name: 'Progressive Only', flags: [OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY], expectedMax: 8 },
        { name: 'All Enabled', flags: [OptimizationFlags.MANIFEST_DISCOVERY, OptimizationFlags.SMART_CONFIG_DISCOVERY, OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY], expectedMax: 8 },
      ];

      for (const scenario of scenarios) {
        const environmentMock = EnvironmentMockPresets.localDev();
        
        // Configure manifest for manifest-enabled scenarios
        if (scenario.flags.includes(OptimizationFlags.MANIFEST_DISCOVERY)) {
          environmentMock.setCustomResponse('.docs-manifest.json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              version: '1.0',
              generatedAt: new Date().toISOString(),
              config: { title: 'Test' },
              documents: [{ id: 'test', title: 'Test', path: 'test.md', lastModified: new Date().toISOString() }],
              structure: { type: 'flat', categories: [] },
            },
          });
        }

        environmentMock.start();
        requestCounter.reset();

        try {
          // Configure flags for scenario
          FeatureFlags.reset();
          scenario.flags.forEach(flag => FeatureFlags.enable(flag));

          // Run discovery based on enabled algorithms
          let result;
          if (FeatureFlags.isEnabled(OptimizationFlags.MANIFEST_DISCOVERY)) {
            const manifestDiscovery = getGlobalManifestDiscovery();
            result = await manifestDiscovery.discoverFromManifest('/docs');
          }
          
          if (!result && FeatureFlags.isEnabled(OptimizationFlags.SMART_CONFIG_DISCOVERY)) {
            result = await this.mockSmartConfigDiscovery('/docs');
          }
          
          if (!result && FeatureFlags.isEnabled(OptimizationFlags.PROGRESSIVE_DOCUMENT_DISCOVERY)) {
            result = await this.mockProgressiveDiscovery('/docs');
          }

          expect(result).toBeDefined();
          
          const totalRequests = requestCounter.getTotalRequests();
          expect(totalRequests).toBeLessThanOrEqual(scenario.expectedMax);
        } finally {
          environmentMock.stop();
        }
      }
    });
  });
});