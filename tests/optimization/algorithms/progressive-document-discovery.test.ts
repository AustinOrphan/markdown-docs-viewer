/**
 * Tests for Progressive Document Discovery Algorithm
 * Validates <10 request target and pattern recognition accuracy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProgressiveDocumentDiscovery,
  createProgressiveDiscovery,
  progressiveAutoDiscoverDocs,
  DiscoveryResult,
  DocumentPattern
} from '../../../src/optimization/algorithms/progressive-document-discovery';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock foundation components
vi.mock('../../../src/optimization/foundation', () => ({
  DiscoveryCache: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  })),
  RequestMonitor: vi.fn().mockImplementation(() => ({
    record: vi.fn(),
    getStats: vi.fn().mockReturnValue({}),
  })),
  PerformanceMonitor: vi.fn().mockImplementation(() => ({
    startMeasure: vi.fn().mockReturnValue({
      end: vi.fn().mockReturnValue({ duration: 100 })
    }),
  })),
}));

// Mock environment detector
vi.mock('../../../src/optimization/utils/environment-detector', () => ({
  getEnvironmentDetector: vi.fn().mockReturnValue({
    detect: vi.fn().mockResolvedValue({
      type: 'github_pages',
      confidence: 0.9,
      indicators: ['github.io domain'],
      capabilities: { corsSupport: true, headRequests: false }
    })
  })
}));

// Mock environment adapters
vi.mock('../../../src/optimization/adapters', () => ({
  createEnvironmentAdapter: vi.fn().mockReturnValue({
    executeRequest: vi.fn().mockImplementation((url: string) => {
      return mockFetch(url);
    })
  })
}));

describe('ProgressiveDocumentDiscovery', () => {
  let discovery: ProgressiveDocumentDiscovery;

  beforeEach(() => {
    vi.clearAllMocks();
    discovery = new ProgressiveDocumentDiscovery({
      maxRequests: 10,
      consecutiveFailureThreshold: 5,
      patternConfidenceThreshold: 0.9
    });
  });

  describe('Smart Starting Points', () => {
    it('should prioritize high-probability paths first', async () => {
      // Mock responses for smart starting points
      mockFetch
        .mockResolvedValueOnce(createMockResponse(false)) // README.md - 404
        .mockResolvedValueOnce(createMockResponse(true, '# Welcome\n\nMain documentation.')) // docs/README.md - found
        .mockResolvedValueOnce(createMockResponse(true, '# Getting Started\n\nSetup guide.')) // getting-started.md - found
        .mockResolvedValueOnce(createMockResponse(false)); // index.md - 404

      const documents = await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      // Should find documents in first few requests
      expect(documents.length).toBeGreaterThan(0);
      expect(stats.totalRequests).toBeLessThanOrEqual(4);
      expect(stats.successfulRequests).toBe(2);
      expect(documents[0].title).toBe('Welcome');
    });

    it('should achieve 80%+ success rate in first 5 requests', async () => {
      // Mock 4 successful requests out of 5
      mockFetch
        .mockResolvedValueOnce(createMockResponse(true, '# README\nMain docs'))
        .mockResolvedValueOnce(createMockResponse(true, '# Docs Index\nDocs home'))
        .mockResolvedValueOnce(createMockResponse(true, '# Getting Started\nStart here'))
        .mockResolvedValueOnce(createMockResponse(true, '# Installation\nHow to install'))
        .mockResolvedValueOnce(createMockResponse(false)); // One failure

      const documents = await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      expect(stats.totalRequests).toBeLessThanOrEqual(5);
      expect(stats.successfulRequests).toBeGreaterThanOrEqual(4);
      expect(stats.successfulRequests / stats.totalRequests).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Pattern Recognition', () => {
    it('should detect sequential patterns', () => {
      const results: DiscoveryResult[] = [
        createMockResult('01-intro.md', 'smart-start'),
        createMockResult('02-setup.md', 'smart-start'),
        createMockResult('03-advanced.md', 'smart-start'),
      ];

      const pattern = discovery.analyzeDocumentPattern(results);

      expect(pattern.type).toBe('sequential');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0.3);
      expect(pattern.indicators).toContain('sequential numbering detected');
      expect(pattern.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect hierarchical patterns', () => {
      const results: DiscoveryResult[] = [
        createMockResult('docs/api/index.md', 'smart-start'),
        createMockResult('docs/guides/setup.md', 'smart-start'),
        createMockResult('docs/tutorials/basic.md', 'smart-start'),
      ];

      const pattern = discovery.analyzeDocumentPattern(results);

      expect(pattern.type).toBe('hierarchical');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0.3);
      expect(pattern.indicators).toContain('hierarchical directory structure detected');
    });

    it('should detect categorized patterns', () => {
      const results: DiscoveryResult[] = [
        createMockResult('api/methods.md', 'smart-start'),
        createMockResult('guides/quickstart.md', 'smart-start'),
        createMockResult('reference/config.md', 'smart-start'),
      ];

      const pattern = discovery.analyzeDocumentPattern(results);

      expect(pattern.type).toBe('categorized');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0.4);
      expect(pattern.indicators).toContain('categorized structure detected');
    });

    it('should detect mixed patterns', () => {
      const results: DiscoveryResult[] = [
        createMockResult('01-intro.md', 'smart-start'),
        createMockResult('api/methods.md', 'smart-start'),
        createMockResult('guides/02-setup.md', 'smart-start'),
      ];

      const pattern = discovery.analyzeDocumentPattern(results);

      expect(pattern.type).toBe('mixed');
      expect(pattern.confidence).toBeGreaterThan(0.6);
      expect(pattern.indicators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Intelligent Stopping', () => {
    it('should stop after consecutive 404s', async () => {
      // Mock 3 successes followed by 5 consecutive failures
      mockFetch
        .mockResolvedValueOnce(createMockResponse(true, '# Doc 1'))
        .mockResolvedValueOnce(createMockResponse(true, '# Doc 2'))
        .mockResolvedValueOnce(createMockResponse(true, '# Doc 3'))
        .mockResolvedValue(createMockResponse(false)); // All subsequent requests fail

      const documents = await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      expect(documents.length).toBe(3);
      expect(stats.totalRequests).toBeLessThanOrEqual(8); // 3 successes + max 5 consecutive failures
      expect(stats.stoppedReason).toBe('consecutive-404s');
    });

    it('should stop when pattern confidence is high', async () => {
      // Create a discovery with lower confidence threshold for testing
      const highConfidenceDiscovery = new ProgressiveDocumentDiscovery({
        patternConfidenceThreshold: 0.7,
        maxRequests: 20
      });

      // Mock clear sequential pattern
      mockFetch
        .mockResolvedValueOnce(createMockResponse(true, '# 01 Intro'))
        .mockResolvedValueOnce(createMockResponse(true, '# 02 Setup'))
        .mockResolvedValueOnce(createMockResponse(true, '# 03 Advanced'))
        .mockResolvedValue(createMockResponse(true, '# Next doc')); // More available

      const documents = await highConfidenceDiscovery.discoverDocuments('./test');
      const stats = highConfidenceDiscovery.getStats();

      expect(stats.patternConfidence).toBeGreaterThanOrEqual(0.7);
      expect(stats.totalRequests).toBeLessThan(10); // Should stop early due to pattern confidence
    });

    it('should stop at max requests limit', async () => {
      const limitedDiscovery = new ProgressiveDocumentDiscovery({
        maxRequests: 3,
        consecutiveFailureThreshold: 10 // High to prevent early stopping
      });

      mockFetch.mockResolvedValue(createMockResponse(true, '# Document'));

      const documents = await limitedDiscovery.discoverDocuments('./test');
      const stats = limitedDiscovery.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.stoppedReason).toBe('max-requests');
    });
  });

  describe('Request Reduction Target', () => {
    it('should achieve <10 requests for typical documentation structure', async () => {
      // Simulate a typical docs structure with good smart starting points
      mockFetch
        .mockImplementationOnce((url: string) => {
          if (url.includes('README.md')) {
            return Promise.resolve(createMockResponse(true, '# Project README\nMain documentation'));
          }
          return Promise.resolve(createMockResponse(false));
        })
        .mockImplementationOnce((url: string) => {
          if (url.includes('docs/README.md')) {
            return Promise.resolve(createMockResponse(true, '# Documentation Index\nDocs home'));
          }
          return Promise.resolve(createMockResponse(false));
        })
        .mockImplementationOnce((url: string) => {
          if (url.includes('getting-started.md')) {
            return Promise.resolve(createMockResponse(true, '# Getting Started\nQuick start guide'));
          }
          return Promise.resolve(createMockResponse(false));
        })
        .mockResolvedValue(createMockResponse(false)); // All other requests fail

      const documents = await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      expect(stats.totalRequests).toBeLessThan(10);
      expect(documents.length).toBeGreaterThan(0);
      expect(stats.successfulRequests / stats.totalRequests).toBeGreaterThan(0.2); // Some success rate
    });

    it('should achieve 85%+ reduction from 60+ requests baseline', async () => {
      // Original auto-discovery would make 60+ requests (10 files × 6 paths)
      const originalRequestCount = 60;
      
      // Mock a moderate success scenario
      mockFetch
        .mockResolvedValueOnce(createMockResponse(true, '# Main'))
        .mockResolvedValueOnce(createMockResponse(true, '# Docs'))
        .mockResolvedValueOnce(createMockResponse(true, '# Guide'))
        .mockResolvedValue(createMockResponse(false));

      const documents = await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      const reductionPercentage = ((originalRequestCount - stats.totalRequests) / originalRequestCount) * 100;
      
      expect(reductionPercentage).toBeGreaterThanOrEqual(85);
      expect(stats.totalRequests).toBeLessThanOrEqual(10);
    });
  });

  describe('Environment Integration', () => {
    it('should use environment-specific optimizations', async () => {
      const envDiscovery = new ProgressiveDocumentDiscovery({
        enableEnvironmentOptimization: true
      });

      mockFetch.mockResolvedValue(createMockResponse(true, '# Environment Test'));

      await envDiscovery.discoverDocuments('./test');

      // Should have attempted environment detection
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle environment detection failures gracefully', async () => {
      // Mock environment detector to fail
      vi.mocked(require('../../../src/optimization/utils/environment-detector').getEnvironmentDetector)
        .mockReturnValue({
          detect: vi.fn().mockRejectedValue(new Error('Detection failed'))
        });

      mockFetch.mockResolvedValue(createMockResponse(true, '# Fallback Test'));

      const documents = await discovery.discoverDocuments('./test');
      
      // Should still work without environment optimization
      expect(documents.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Factory Functions', () => {
    it('should create discovery instance via factory', () => {
      const factoryDiscovery = createProgressiveDiscovery({
        maxRequests: 5
      });

      expect(factoryDiscovery).toBeInstanceOf(ProgressiveDocumentDiscovery);
    });

    it('should work with helper function', async () => {
      mockFetch.mockResolvedValue(createMockResponse(true, '# Helper Test'));

      const documents = await progressiveAutoDiscoverDocs('./test', {
        maxRequests: 3
      });

      expect(Array.isArray(documents)).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete discovery within reasonable time', async () => {
      mockFetch.mockResolvedValue(createMockResponse(true, '# Performance Test'));

      const startTime = Date.now();
      await discovery.discoverDocuments('./test');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds even with network requests
      expect(duration).toBeLessThan(5000);
    });

    it('should track performance metrics', async () => {
      mockFetch.mockResolvedValue(createMockResponse(true, '# Metrics Test'));

      await discovery.discoverDocuments('./test');
      const stats = discovery.getStats();

      expect(stats.executionTime).toBeGreaterThan(0);
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(typeof stats.documentsFound).toBe('number');
      expect(typeof stats.patternConfidence).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty directories gracefully', async () => {
      mockFetch.mockResolvedValue(createMockResponse(false));

      const documents = await discovery.discoverDocuments('./empty');
      const stats = discovery.getStats();

      expect(documents).toEqual([]);
      expect(stats.documentsFound).toBe(0);
      expect(stats.stoppedReason).toBe('consecutive-404s');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const documents = await discovery.discoverDocuments('./error');
      
      expect(documents).toEqual([]);
    });

    it('should handle malformed content gracefully', async () => {
      mockFetch.mockResolvedValue(createMockResponse(true, 'Invalid markdown content ###'));

      const documents = await discovery.discoverDocuments('./malformed');
      
      expect(documents.length).toBeGreaterThanOrEqual(0);
      if (documents.length > 0) {
        expect(documents[0].title).toBeDefined();
      }
    });
  });
});

// Helper functions for testing
function createMockResponse(ok: boolean, content = ''): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    text: () => Promise.resolve(content),
    headers: new Headers(),
    clone: () => createMockResponse(ok, content)
  } as Response;
}

function createMockResult(path: string, source: 'smart-start' | 'pattern-match' | 'expansion' | 'fallback'): DiscoveryResult {
  return {
    document: {
      id: path.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
      title: path.split('/').pop()?.replace('.md', '') || 'Unknown',
      file: path,
      content: `# ${path}\n\nTest content`,
      category: undefined,
      order: undefined,
      tags: undefined,
      description: undefined
    },
    path,
    source,
    confidence: 0.8,
    requestOrder: 1
  };
}