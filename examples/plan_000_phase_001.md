# Plan 000 - Phase 1: Core Performance Fixes

## Overview

This phase implements the fundamental performance optimizations that will provide immediate relief from the excessive HTTP request problem. These changes focus on smart config discovery and progressive document discovery with early termination.

## Timeline

**Duration**: Week 1 (5 days)  
**Priority**: High (Critical performance fixes)

## Objectives

1. Reduce config file discovery from 4 requests to 1-2 requests
2. Reduce document discovery from 60+ requests to 5-10 requests
3. Implement caching for negative results
4. Add early termination logic
5. Maintain 100% backward compatibility

## Issue Implementation

### Issue #1: Smart Config File Discovery with Request Optimization

**Priority**: High | **Type**: Performance Bug | **Effort**: 2-3 days

#### Implementation Details

**Step 1: Create Cache System** (Day 1)

```typescript
// src/utils/discovery-cache.ts
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class DiscoveryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

**Step 2: Enhance ConfigLoader** (Day 1-2)

```typescript
// src/config-loader.ts (enhanced version)
import { DiscoveryCache } from './utils/discovery-cache';
import { PerformanceMonitor } from './utils/performance-monitor';
import { RequestMonitor } from './utils/request-monitor';
import { FeatureFlags, FeatureFlag } from './utils/feature-flags';

export class ConfigLoader {
  private static configCache = new DiscoveryCache<boolean>();
  private static readonly CONFIG_FILES = [
    'docs-config.json', // Most common first
    'docs.config.json',
    '.docs.json',
    'markdown-docs.json',
  ];

  private config: DocsConfig;
  private configPath?: string;
  private performanceMonitor = new PerformanceMonitor();

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  async loadConfig(configPath?: string): Promise<DocsConfig> {
    this.performanceMonitor.startMeasure('config-discovery');

    try {
      if (configPath) {
        await this.loadConfigFile(configPath);
      } else {
        if (FeatureFlags.isEnabled(FeatureFlag.SMART_CONFIG_DISCOVERY)) {
          await this.smartAutoDiscoverConfig();
        } else {
          await this.autoDiscoverConfig(); // Legacy behavior
        }
      }

      this.validateConfig();
      return this.config;
    } finally {
      const report = this.performanceMonitor.endMeasure('config-discovery');
      console.log(
        `📊 Config discovery completed: ${report.requestCount} requests in ${report.duration}ms`
      );
    }
  }

  private async smartAutoDiscoverConfig(): Promise<void> {
    // Check for cached negative results first
    const allCached = ConfigLoader.CONFIG_FILES.every(
      file => ConfigLoader.configCache.get(`not-found:${file}`) === true
    );

    if (allCached) {
      console.log('📋 Using cached config discovery results - no config files found');
      return;
    }

    // Try each config file with caching
    for (const filename of ConfigLoader.CONFIG_FILES) {
      // Check negative cache
      if (ConfigLoader.configCache.get(`not-found:${filename}`) === true) {
        continue;
      }

      const metrics = RequestMonitor.recordRequest(filename, 'HEAD');

      try {
        const exists = await this.checkFileExists(filename);

        if (exists) {
          RequestMonitor.recordResponse(metrics, 200);
          await this.loadConfigFile(filename);
          this.configPath = filename;
          console.log(`📋 Loaded config from: ${filename}`);
          return; // Early termination on success
        } else {
          RequestMonitor.recordResponse(metrics, 404);
          // Cache negative result
          ConfigLoader.configCache.set(`not-found:${filename}`, true, 300000); // 5 min
        }
      } catch (error) {
        RequestMonitor.recordError(metrics, error as Error);
        // Cache negative result for shorter duration
        ConfigLoader.configCache.set(`not-found:${filename}`, true, 60000); // 1 min
      }

      this.performanceMonitor.recordRequest('config-discovery');
    }

    console.log('📋 No config file found, using defaults');
  }

  private async checkFileExists(filename: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(filename, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Timeout checking ${filename}`);
      }
      return false;
    }
  }
}
```

**Step 3: Add Tests** (Day 2-3)

```typescript
// tests/config-loader-performance.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigLoader } from '../src/config-loader';
import { FeatureFlags, FeatureFlag } from '../src/utils/feature-flags';
import { RequestMonitor } from '../src/utils/request-monitor';

describe('ConfigLoader Performance', () => {
  beforeEach(() => {
    RequestMonitor.reset();
    FeatureFlags.enable(FeatureFlag.SMART_CONFIG_DISCOVERY);

    // Mock fetch
    global.fetch = vi.fn().mockImplementation(url => {
      if (url === 'docs-config.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ title: 'Test Docs' }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  it('should stop after finding first config file', async () => {
    const loader = new ConfigLoader();
    await loader.loadConfig();

    const metrics = RequestMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].url).toBe('docs-config.json');
  });

  it('should cache negative results', async () => {
    const loader1 = new ConfigLoader();
    await loader1.loadConfig();

    const loader2 = new ConfigLoader();
    await loader2.loadConfig();

    const metrics = RequestMonitor.getMetrics();
    // Should not make additional requests due to caching
    expect(metrics.filter(m => m.url === '.docs.json')).toHaveLength(1);
  });
});
```

---

### Issue #2: Progressive Document Discovery with Early Termination

**Priority**: High | **Type**: Performance Bug | **Effort**: 3-4 days

#### Implementation Details

**Step 1: Create Progressive Discovery Options** (Day 3)

```typescript
// src/types.ts (additions)
export interface ProgressiveDiscoveryOptions {
  maxDocuments?: number; // Default: 5
  maxRequests?: number; // Default: 10
  priorityFiles?: string[]; // Default: ['README.md', 'index.md']
  discoveryTimeout?: number; // Default: 30000ms
  earlyTermination?: boolean; // Default: true
}

export interface AutoDiscoveryOptions {
  basePath: string;
  exclude?: string[];
  titleStrategy?: 'heading' | 'frontmatter' | 'filename';
  sortStrategy?: 'alphabetical' | 'date' | 'custom';
  categoryStrategy?: 'folder' | 'frontmatter' | 'none';
  progressive?: ProgressiveDiscoveryOptions; // New addition
}
```

**Step 2: Implement Progressive AutoDiscovery** (Day 3-4)

```typescript
// src/auto-discovery.ts (enhanced version)
import { DiscoveryCache } from './utils/discovery-cache';
import { PerformanceMonitor } from './utils/performance-monitor';
import { RequestMonitor } from './utils/request-monitor';
import { FeatureFlags, FeatureFlag } from './utils/feature-flags';

export class AutoDiscovery {
  private options: Required<AutoDiscoveryOptions>;
  private static fileExistenceCache = new DiscoveryCache<boolean>();
  private performanceMonitor = new PerformanceMonitor();
  private requestCount = 0;
  private discoveredDocuments: Document[] = [];

  constructor(options: AutoDiscoveryOptions) {
    this.options = {
      basePath: options.basePath,
      exclude: options.exclude || ['**/node_modules/**', '**/.*', '**/_*'],
      titleStrategy: options.titleStrategy || 'heading',
      sortStrategy: options.sortStrategy || 'alphabetical',
      categoryStrategy: options.categoryStrategy || 'folder',
      progressive: {
        maxDocuments: 5,
        maxRequests: 10,
        priorityFiles: ['README.md', 'index.md'],
        discoveryTimeout: 30000,
        earlyTermination: true,
        ...options.progressive,
      },
    };
  }

  async discoverFiles(): Promise<Document[]> {
    if (!FeatureFlags.isEnabled(FeatureFlag.PROGRESSIVE_DOCUMENT_DISCOVERY)) {
      return this.legacyDiscoverFiles();
    }

    this.performanceMonitor.startMeasure('document-discovery');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Document discovery timeout')),
          this.options.progressive.discoveryTimeout
        );
      });

      const discoveryPromise = this.performProgressiveDiscovery();

      const documents = await Promise.race([discoveryPromise, timeoutPromise]);

      const report = this.performanceMonitor.endMeasure('document-discovery');
      console.log(
        `📚 Document discovery completed: ${documents.length} documents found with ${report.requestCount} requests in ${report.duration}ms`
      );

      return documents;
    } catch (error) {
      console.warn('Document discovery failed:', error);
      return this.discoveredDocuments; // Return what we found so far
    }
  }

  private async performProgressiveDiscovery(): Promise<Document[]> {
    const { maxDocuments, maxRequests, priorityFiles } = this.options.progressive;

    // Phase 1: Check priority files in root directory
    console.log('📂 Phase 1: Checking priority files...');
    for (const file of priorityFiles) {
      if (this.shouldStopDiscovery()) break;

      const doc = await this.tryDiscoverFile('', file);
      if (doc) {
        this.discoveredDocuments.push(doc);
        console.log(`  ✓ Found: ${file}`);
      }
    }

    // Early termination if we found enough
    if (
      this.discoveredDocuments.length >= maxDocuments &&
      this.options.progressive.earlyTermination
    ) {
      console.log(`📚 Early termination: Found ${this.discoveredDocuments.length} documents`);
      return this.sortDocuments(this.discoveredDocuments);
    }

    // Phase 2: Common files in root
    console.log('📂 Phase 2: Checking common files in root...');
    const commonFiles = [
      'getting-started.md',
      'installation.md',
      'configuration.md',
      'api.md',
      'examples.md',
      'troubleshooting.md',
    ].filter(f => !priorityFiles.includes(f));

    for (const file of commonFiles) {
      if (this.shouldStopDiscovery()) break;

      const doc = await this.tryDiscoverFile('', file);
      if (doc) {
        this.discoveredDocuments.push(doc);
        console.log(`  ✓ Found: ${file}`);
      }
    }

    // Phase 3: Subdirectories (only if needed)
    if (this.discoveredDocuments.length < maxDocuments && this.requestCount < maxRequests) {
      console.log('📂 Phase 3: Checking subdirectories...');
      const subdirs = ['guides/', 'docs/', 'api/', 'reference/'];

      for (const dir of subdirs) {
        if (this.shouldStopDiscovery()) break;

        // First check if directory exists
        const dirExists = await this.checkDirectoryExists(dir);
        if (!dirExists) continue;

        for (const file of [...priorityFiles, ...commonFiles].slice(0, 3)) {
          if (this.shouldStopDiscovery()) break;

          const doc = await this.tryDiscoverFile(dir, file);
          if (doc) {
            this.discoveredDocuments.push(doc);
            console.log(`  ✓ Found: ${dir}${file}`);
          }
        }
      }
    }

    return this.sortDocuments(this.discoveredDocuments);
  }

  private shouldStopDiscovery(): boolean {
    const { maxDocuments, maxRequests, earlyTermination } = this.options.progressive;

    if (this.requestCount >= maxRequests) {
      console.log(`⚠️  Request limit reached (${maxRequests})`);
      return true;
    }

    if (earlyTermination && this.discoveredDocuments.length >= maxDocuments) {
      console.log(`✓ Document limit reached (${maxDocuments})`);
      return true;
    }

    return false;
  }

  private async tryDiscoverFile(dir: string, filename: string): Promise<Document | null> {
    const fullPath = `${this.options.basePath}/${dir}${filename}`.replace(/\/+/g, '/');

    // Check cache first
    const cacheKey = `exists:${fullPath}`;
    const cached = AutoDiscovery.fileExistenceCache.get(cacheKey);
    if (cached === false) {
      return null; // We know it doesn't exist
    }

    this.requestCount++;
    this.performanceMonitor.recordRequest('document-discovery');

    const metrics = RequestMonitor.recordRequest(fullPath, 'HEAD');

    try {
      const response = await fetch(fullPath, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        RequestMonitor.recordResponse(metrics, response.status);
        AutoDiscovery.fileExistenceCache.set(cacheKey, true, 3600000); // 1 hour

        // Fetch and process the file
        return await this.processFile({
          path: fullPath,
          name: filename,
          category: dir ? dir.replace('/', '') : 'root',
        });
      } else {
        RequestMonitor.recordResponse(metrics, response.status);
        AutoDiscovery.fileExistenceCache.set(cacheKey, false, 300000); // 5 minutes
        return null;
      }
    } catch (error) {
      RequestMonitor.recordError(metrics, error as Error);
      AutoDiscovery.fileExistenceCache.set(cacheKey, false, 60000); // 1 minute
      return null;
    }
  }

  private async checkDirectoryExists(dir: string): Promise<boolean> {
    // Try to fetch a likely file to check if directory is accessible
    const testFile = `${this.options.basePath}/${dir}README.md`;
    const response = await fetch(testFile, { method: 'HEAD' }).catch(() => null);
    return response?.ok || false;
  }
}
```

**Step 3: Integration Tests** (Day 4-5)

```typescript
// tests/integration/progressive-discovery.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoDiscovery } from '../../src/auto-discovery';
import { FeatureFlags, FeatureFlag } from '../../src/utils/feature-flags';
import { RequestMonitor } from '../../src/utils/request-monitor';

describe('Progressive Document Discovery', () => {
  beforeEach(() => {
    RequestMonitor.reset();
    FeatureFlags.enable(FeatureFlag.PROGRESSIVE_DOCUMENT_DISCOVERY);

    // Mock fetch to simulate file existence
    global.fetch = vi.fn().mockImplementation(url => {
      const exists = [
        './docs/README.md',
        './docs/index.md',
        './docs/getting-started.md',
        './docs/guides/tutorial.md',
      ].includes(url);

      if (exists) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('# Test Document\nContent here.'),
        });
      }

      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  it('should discover priority files first', async () => {
    const discovery = new AutoDiscovery({
      basePath: './docs',
      progressive: {
        maxDocuments: 2,
        priorityFiles: ['README.md', 'index.md'],
      },
    });

    const documents = await discovery.discoverFiles();

    expect(documents).toHaveLength(2);
    expect(documents[0].id).toMatch(/readme|index/);
    expect(documents[1].id).toMatch(/readme|index/);
  });

  it('should respect request limits', async () => {
    const discovery = new AutoDiscovery({
      basePath: './docs',
      progressive: {
        maxRequests: 5,
      },
    });

    await discovery.discoverFiles();

    const metrics = RequestMonitor.getMetrics();
    expect(metrics.length).toBeLessThanOrEqual(5);
  });

  it('should use cached results', async () => {
    const discovery1 = new AutoDiscovery({ basePath: './docs' });
    await discovery1.discoverFiles();

    const discovery2 = new AutoDiscovery({ basePath: './docs' });
    await discovery2.discoverFiles();

    const metrics = RequestMonitor.getMetrics();
    const uniqueUrls = new Set(metrics.map(m => m.url));

    // Second discovery should use cached results
    expect(metrics.length).toBe(uniqueUrls.size);
  });
});
```

## Rollout Strategy

### Week 1 Schedule

**Monday-Tuesday**: Issue #1 (Smart Config Discovery)

- Day 1: Implement caching system and enhanced ConfigLoader
- Day 2: Complete testing and integration

**Wednesday-Friday**: Issue #2 (Progressive Document Discovery)

- Day 3: Implement progressive discovery logic
- Day 4: Complete implementation and testing
- Day 5: Integration testing and performance validation

### Feature Flag Rollout

1. **Internal Testing** (End of Week 1)
   - Enable features for development team
   - Monitor performance metrics
   - Validate backward compatibility

2. **Beta Release** (Week 2)
   - Enable for 10% of users via feature flags
   - Monitor error rates and performance
   - Gather user feedback

3. **General Availability** (Week 3)
   - Enable for all users
   - Keep feature flags for emergency rollback
   - Continue monitoring

## Testing Requirements

### Performance Benchmarks

Create automated benchmarks to measure improvement:

```typescript
// tests/benchmarks/discovery-performance.bench.ts
import { bench, describe } from 'vitest';
import { ConfigLoader } from '../src/config-loader';
import { AutoDiscovery } from '../src/auto-discovery';

describe('Discovery Performance', () => {
  bench('Config discovery - legacy', async () => {
    FeatureFlags.disable(FeatureFlag.SMART_CONFIG_DISCOVERY);
    const loader = new ConfigLoader();
    await loader.loadConfig();
  });

  bench('Config discovery - optimized', async () => {
    FeatureFlags.enable(FeatureFlag.SMART_CONFIG_DISCOVERY);
    const loader = new ConfigLoader();
    await loader.loadConfig();
  });

  bench('Document discovery - legacy', async () => {
    FeatureFlags.disable(FeatureFlag.PROGRESSIVE_DOCUMENT_DISCOVERY);
    const discovery = new AutoDiscovery({ basePath: './docs' });
    await discovery.discoverFiles();
  });

  bench('Document discovery - optimized', async () => {
    FeatureFlags.enable(FeatureFlag.PROGRESSIVE_DOCUMENT_DISCOVERY);
    const discovery = new AutoDiscovery({ basePath: './docs' });
    await discovery.discoverFiles();
  });
});
```

### Success Metrics

1. **Request Reduction**
   - [ ] Config discovery: 4 → 1-2 requests (75% reduction)
   - [ ] Document discovery: 60+ → 5-10 requests (85% reduction)

2. **Performance Improvement**
   - [ ] Config discovery: <500ms (from 2-3s)
   - [ ] Document discovery: <1s (from 3-5s)

3. **Cache Effectiveness**
   - [ ] 90% cache hit rate on subsequent loads
   - [ ] Negative result caching prevents repeated 404s

4. **Backward Compatibility**
   - [ ] Zero breaking changes
   - [ ] Feature flags allow instant rollback
   - [ ] All existing configurations work

## Risks & Mitigations

### Risk: Cache Invalidation Issues

**Mitigation**: Conservative TTL values, clear cache on errors

### Risk: Early Termination Missing Important Files

**Mitigation**: Prioritize common files, configurable limits

### Risk: Performance Regression in Edge Cases

**Mitigation**: Comprehensive benchmarking, feature flag rollback

## Next Steps

After completing Phase 1:

- 90% reduction in HTTP requests achieved
- Foundation laid for further optimizations
- Ready for Phase 2: Infrastructure improvements (Request pooling, enhanced error handling)
