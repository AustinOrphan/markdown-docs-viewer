# Plan 000 - Phase 4: Advanced Features

## Overview

This phase introduces advanced features that provide users with more control over the discovery process. It implements manifest-based discovery for zero HTTP requests, comprehensive configuration options, and tools for optimizing documentation loading.

## Timeline

**Duration**: Week 4 (5 days)  
**Priority**: Medium (Enhancement features)

## Objectives

1. Implement manifest-based discovery system
2. Add comprehensive user configuration options
3. Create manifest generation tooling
4. Provide environment-specific configuration presets
5. Enable debug mode and telemetry options

## Issue Implementation

### Issue #6: Manifest-Based Discovery System

**Priority**: Medium | **Type**: Feature Enhancement | **Effort**: 3-4 days

#### Implementation Details

**Step 1: Manifest Schema and Types** (Day 1)

```typescript
// src/manifest/types.ts
export interface DocsManifest {
  version: '1.0' | '1.1';
  generated?: string; // ISO timestamp
  generator?: string; // Tool that generated manifest
  basePath: string;
  documents: ManifestDocument[];
  categories?: ManifestCategory[];
  settings?: ManifestSettings;
}

export interface ManifestDocument {
  id: string;
  title: string;
  file: string; // Relative to basePath
  category?: string;
  order?: number;
  tags?: string[];
  description?: string;
  lastModified?: string; // ISO timestamp
  size?: number; // File size in bytes
  hash?: string; // Content hash for caching
}

export interface ManifestCategory {
  id: string;
  title: string;
  order?: number;
  description?: string;
  icon?: string; // Emoji or icon identifier
}

export interface ManifestSettings {
  searchEnabled?: boolean;
  syntaxHighlighting?: boolean;
  tableOfContents?: boolean;
  navigation?: {
    collapsible?: boolean;
    showCategories?: boolean;
    showTags?: boolean;
  };
}

// Validation schema
export const ManifestSchema = {
  validate(manifest: any): manifest is DocsManifest {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be an object');
    }

    if (!['1.0', '1.1'].includes(manifest.version)) {
      throw new Error('Manifest version must be 1.0 or 1.1');
    }

    if (typeof manifest.basePath !== 'string') {
      throw new Error('Manifest basePath must be a string');
    }

    if (!Array.isArray(manifest.documents)) {
      throw new Error('Manifest documents must be an array');
    }

    // Validate each document
    manifest.documents.forEach((doc: any, index: number) => {
      if (!doc.id || !doc.title || !doc.file) {
        throw new Error(`Document at index ${index} missing required fields`);
      }

      if (doc.tags && !Array.isArray(doc.tags)) {
        throw new Error(`Document ${doc.id} tags must be an array`);
      }
    });

    return true;
  },
};
```

**Step 2: Manifest Loader Implementation** (Day 1-2)

```typescript
// src/manifest/loader.ts
import { DocsManifest, ManifestSchema } from './types';
import { RequestManager } from '../request-manager';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { DiscoveryCache } from '../utils/discovery-cache';

export class ManifestLoader {
  private static readonly MANIFEST_FILES = [
    'docs-manifest.json',
    '.docs-manifest.json',
    'manifest.json',
    'docs.manifest.json',
  ];

  private static cache = new DiscoveryCache<DocsManifest>();
  private requestManager = RequestManager.getInstance();
  private performanceMonitor = new PerformanceMonitor();

  async load(basePath: string = './'): Promise<DocsManifest | null> {
    this.performanceMonitor.startMeasure('manifest-loading');

    try {
      // Check cache first
      const cached = ManifestLoader.cache.get(`manifest:${basePath}`);
      if (cached) {
        console.log('📋 Using cached manifest');
        return cached;
      }

      // Try each manifest file
      for (const filename of ManifestLoader.MANIFEST_FILES) {
        const url = `${basePath}/${filename}`.replace(/\/+/g, '/');
        const manifest = await this.tryLoadManifest(url);

        if (manifest) {
          // Cache successful load
          ManifestLoader.cache.set(`manifest:${basePath}`, manifest, 3600000); // 1 hour

          const report = this.performanceMonitor.endMeasure('manifest-loading');
          console.log(`📋 Loaded manifest from ${filename} in ${report.duration}ms`);

          return manifest;
        }
      }

      console.log('📋 No manifest file found');
      return null;
    } catch (error) {
      console.error('Failed to load manifest:', error);
      return null;
    }
  }

  private async tryLoadManifest(url: string): Promise<DocsManifest | null> {
    const result = await this.requestManager.fetch(url);

    if (!result.success || !result.data?.ok) {
      return null;
    }

    try {
      const data = await result.data.json();

      // Validate manifest
      if (ManifestSchema.validate(data)) {
        return this.processManifest(data);
      }

      return null;
    } catch (error) {
      console.warn(`Invalid manifest at ${url}:`, error);
      return null;
    }
  }

  private processManifest(manifest: DocsManifest): DocsManifest {
    // Add generated timestamp if missing
    if (!manifest.generated) {
      manifest.generated = new Date().toISOString();
    }

    // Process documents
    manifest.documents = manifest.documents.map((doc, index) => ({
      ...doc,
      // Ensure order is set
      order: doc.order ?? index,
      // Normalize file paths
      file: doc.file.replace(/\\/g, '/'),
    }));

    // Sort by order
    manifest.documents.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return manifest;
  }

  /**
   * Generate a manifest from discovered documents
   */
  static generate(
    documents: Document[],
    basePath: string,
    options: {
      includeMetadata?: boolean;
      prettify?: boolean;
    } = {}
  ): string {
    const manifest: DocsManifest = {
      version: '1.1',
      generated: new Date().toISOString(),
      generator: 'markdown-docs-viewer',
      basePath,
      documents: documents.map((doc, index) => {
        const manifestDoc: ManifestDocument = {
          id: doc.id,
          title: doc.title,
          file: doc.file || `${doc.id}.md`,
          order: doc.order ?? index,
        };

        // Add optional fields
        if (doc.category) manifestDoc.category = doc.category;
        if (doc.tags) manifestDoc.tags = doc.tags;
        if (doc.description) manifestDoc.description = doc.description;

        // Add metadata if requested
        if (options.includeMetadata && doc.file) {
          // In a real implementation, would get actual file stats
          manifestDoc.lastModified = new Date().toISOString();
          manifestDoc.size = doc.content?.length || 0;
        }

        return manifestDoc;
      }),
    };

    // Extract unique categories
    const categories = new Set<string>();
    manifest.documents.forEach(doc => {
      if (doc.category) categories.add(doc.category);
    });

    if (categories.size > 0) {
      manifest.categories = Array.from(categories).map((cat, index) => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        title: cat,
        order: index,
      }));
    }

    return JSON.stringify(manifest, null, options.prettify ? 2 : 0);
  }
}
```

**Step 3: Integration with Auto-Discovery** (Day 2-3)

```typescript
// src/auto-discovery.ts (manifest-aware updates)
import { ManifestLoader } from './manifest/loader';
import { ManifestDocument } from './manifest/types';

export class AutoDiscovery {
  private manifestLoader = new ManifestLoader();

  async discoverFiles(): Promise<Document[]> {
    // Try manifest-based discovery first
    const manifest = await this.manifestLoader.load(this.options.basePath);

    if (manifest) {
      console.log(`📋 Using manifest-based discovery (${manifest.documents.length} documents)`);
      return this.convertManifestDocuments(manifest.documents, manifest.basePath);
    }

    // Fall back to regular discovery
    console.log('📂 No manifest found, using file-based discovery');
    return this.performProgressiveDiscovery();
  }

  private async convertManifestDocuments(
    manifestDocs: ManifestDocument[],
    basePath: string
  ): Promise<Document[]> {
    const documents: Document[] = [];

    for (const manifestDoc of manifestDocs) {
      const doc = await this.loadManifestDocument(manifestDoc, basePath);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  private async loadManifestDocument(
    manifestDoc: ManifestDocument,
    basePath: string
  ): Promise<Document | null> {
    const fullPath = `${basePath}/${manifestDoc.file}`.replace(/\/+/g, '/');

    try {
      const result = await this.requestManager.fetch(fullPath);

      if (!result.success || !result.data?.ok) {
        console.warn(`Failed to load document: ${manifestDoc.file}`);
        return null;
      }

      const content = await result.data.text();

      return {
        id: manifestDoc.id,
        title: manifestDoc.title,
        file: fullPath,
        content,
        category: manifestDoc.category,
        order: manifestDoc.order,
        tags: manifestDoc.tags,
        description: manifestDoc.description || this.extractDescription(content),
      };
    } catch (error) {
      console.error(`Error loading document ${manifestDoc.file}:`, error);
      return null;
    }
  }
}
```

**Step 4: CLI Tool for Manifest Generation** (Day 3)

```typescript
// scripts/generate-manifest.ts
#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import { program } from 'commander';
import { ManifestLoader } from '../src/manifest/loader';

interface FileInfo {
  path: string;
  title: string;
  category?: string;
  order?: number;
  size: number;
  lastModified: Date;
}

async function scanDirectory(
  dir: string,
  basePath: string,
  options: {
    exclude?: string[];
    maxDepth?: number;
  },
  currentDepth = 0
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];

  if (currentDepth >= (options.maxDepth || 3)) {
    return files;
  }

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(basePath, fullPath);

    // Check exclusions
    if (options.exclude?.some(pattern => relativePath.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await scanDirectory(
        fullPath,
        basePath,
        options,
        currentDepth + 1
      );
      files.push(...subFiles);
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      const stats = await stat(fullPath);
      const content = await readFile(fullPath, 'utf-8');

      files.push({
        path: relativePath,
        title: extractTitle(content, entry.name),
        category: extractCategory(relativePath),
        order: extractOrder(content, entry.name),
        size: stats.size,
        lastModified: stats.mtime
      });
    }
  }

  return files;
}

function extractTitle(content: string, filename: string): string {
  // Try to extract from first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Try frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
    if (titleMatch) return titleMatch[1].trim().replace(/['"]/g, '');
  }

  // Fallback to filename
  return filename
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function extractCategory(path: string): string | undefined {
  const parts = path.split('/');
  if (parts.length > 1) {
    return parts[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return undefined;
}

function extractOrder(content: string, filename: string): number | undefined {
  // Check frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const orderMatch = frontmatterMatch[1].match(/^order:\s*(\d+)$/m);
    if (orderMatch) return parseInt(orderMatch[1]);
  }

  // Check filename for numeric prefix
  const numericMatch = filename.match(/^(\d+)[-_.]/);
  if (numericMatch) return parseInt(numericMatch[1]);

  return undefined;
}

// CLI setup
program
  .name('generate-manifest')
  .description('Generate a docs-manifest.json file for your documentation')
  .version('1.0.0')
  .argument('<directory>', 'Documentation directory to scan')
  .option('-o, --output <file>', 'Output file', 'docs-manifest.json')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude', ['node_modules', '.*', '_*'])
  .option('-d, --max-depth <number>', 'Maximum directory depth', '3')
  .option('-m, --metadata', 'Include file metadata', false)
  .option('-p, --prettify', 'Pretty print JSON', true)
  .action(async (directory, options) => {
    try {
      console.log(`📂 Scanning ${directory}...`);

      const files = await scanDirectory(directory, directory, {
        exclude: options.exclude,
        maxDepth: parseInt(options.maxDepth)
      });

      console.log(`📄 Found ${files.length} markdown files`);

      // Convert to manifest documents
      const documents = files.map((file, index) => ({
        id: file.path.replace(/[/\\]/g, '-').replace(/\.md$/, ''),
        title: file.title,
        file: file.path,
        category: file.category,
        order: file.order ?? index,
        size: options.metadata ? file.size : undefined,
        lastModified: options.metadata ? file.lastModified.toISOString() : undefined
      }));

      // Generate manifest
      const manifest = ManifestLoader.generate(
        documents as any,
        directory,
        {
          includeMetadata: options.metadata,
          prettify: options.prettify
        }
      );

      // Write to file
      await writeFile(options.output, manifest);
      console.log(`✅ Generated ${options.output}`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

---

### Issue #7: User-Configurable Discovery Behavior

**Priority**: Medium | **Type**: Configuration | **Effort**: 2-3 days

#### Implementation Details

**Step 1: Configuration Schema** (Day 4)

```typescript
// src/config/discovery-config.ts
export interface DiscoveryConfig {
  // Request limits
  maxDiscoveryRequests?: number; // Default: 10
  maxDocuments?: number; // Default: 5
  maxConcurrentRequests?: number; // Default: 5

  // Timeout settings
  discoveryTimeout?: number; // Default: 30000ms
  requestTimeout?: number; // Default: 10000ms

  // Discovery strategy
  discoveryStrategy?: 'aggressive' | 'conservative' | 'manifest-only';
  priorityFiles?: string[];
  excludePatterns?: string[];

  // Caching
  cacheEnabled?: boolean; // Default: true
  cacheTTL?: number; // Default: 3600000 (1 hour)

  // Debug and monitoring
  debugMode?: boolean; // Default: false
  telemetryEnabled?: boolean; // Default: false
  logLevel?: 'error' | 'warn' | 'info' | 'debug';

  // Environment overrides
  environmentPresets?: {
    [env: string]: Partial<DiscoveryConfig>;
  };

  // Advanced options
  retryAttempts?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
  manifestPreference?: 'always' | 'fallback' | 'never';
}

export const DEFAULT_DISCOVERY_CONFIG: Required<DiscoveryConfig> = {
  maxDiscoveryRequests: 10,
  maxDocuments: 5,
  maxConcurrentRequests: 5,
  discoveryTimeout: 30000,
  requestTimeout: 10000,
  discoveryStrategy: 'progressive',
  priorityFiles: ['README.md', 'index.md'],
  excludePatterns: ['**/node_modules/**', '**/.*', '**/_*'],
  cacheEnabled: true,
  cacheTTL: 3600000,
  debugMode: false,
  telemetryEnabled: false,
  logLevel: 'warn',
  environmentPresets: {
    github_pages: {
      maxConcurrentRequests: 3,
      discoveryStrategy: 'conservative',
      requestTimeout: 15000,
    },
    netlify: {
      maxConcurrentRequests: 6,
      discoveryStrategy: 'aggressive',
    },
  },
  retryAttempts: 2,
  retryDelay: 1000,
  circuitBreakerThreshold: 10,
  manifestPreference: 'fallback',
};

export class DiscoveryConfigManager {
  private config: Required<DiscoveryConfig>;

  constructor(userConfig: DiscoveryConfig = {}) {
    // Merge with defaults
    this.config = this.mergeConfig(DEFAULT_DISCOVERY_CONFIG, userConfig);

    // Apply environment preset if detected
    this.applyEnvironmentPreset();

    // Apply debug mode from localStorage
    this.applyDebugMode();
  }

  private mergeConfig(
    defaults: Required<DiscoveryConfig>,
    user: DiscoveryConfig
  ): Required<DiscoveryConfig> {
    const merged = { ...defaults };

    // Deep merge
    Object.keys(user).forEach(key => {
      const value = user[key as keyof DiscoveryConfig];
      if (value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          merged[key as keyof DiscoveryConfig] = {
            ...(defaults[key as keyof DiscoveryConfig] as any),
            ...value,
          };
        } else {
          merged[key as keyof DiscoveryConfig] = value as any;
        }
      }
    });

    return merged;
  }

  private applyEnvironmentPreset(): void {
    const detector = EnvironmentDetector.getInstance();
    const environment = detector.getCachedEnvironment();

    if (environment && this.config.environmentPresets[environment.type]) {
      const preset = this.config.environmentPresets[environment.type];
      console.log(`📋 Applying ${environment.type} environment preset`);

      Object.assign(this.config, preset);
    }
  }

  private applyDebugMode(): void {
    const debugMode = localStorage.getItem('mdv_debug_mode') === 'true';
    if (debugMode) {
      this.config.debugMode = true;
      this.config.logLevel = 'debug';
      console.log('🐛 Debug mode enabled');
    }
  }

  get<K extends keyof DiscoveryConfig>(key: K): Required<DiscoveryConfig>[K] {
    return this.config[key];
  }

  getAll(): Required<DiscoveryConfig> {
    return { ...this.config };
  }

  update(updates: Partial<DiscoveryConfig>): void {
    Object.assign(this.config, updates);
  }
}
```

**Step 2: Configuration UI Component** (Day 4-5)

```typescript
// src/components/config-panel.ts
export class ConfigPanel {
  private container: HTMLElement;
  private configManager: DiscoveryConfigManager;
  private onUpdate: (config: DiscoveryConfig) => void;

  constructor(
    container: HTMLElement,
    configManager: DiscoveryConfigManager,
    onUpdate: (config: DiscoveryConfig) => void
  ) {
    this.container = container;
    this.configManager = configManager;
    this.onUpdate = onUpdate;
  }

  render(): void {
    const config = this.configManager.getAll();

    this.container.innerHTML = `
      <div class="mdv-config-panel">
        <h3>Discovery Configuration</h3>
        
        <div class="mdv-config-section">
          <h4>Discovery Strategy</h4>
          <select id="discovery-strategy" class="mdv-config-select">
            <option value="aggressive" ${config.discoveryStrategy === 'aggressive' ? 'selected' : ''}>
              Aggressive (Fast, more requests)
            </option>
            <option value="conservative" ${config.discoveryStrategy === 'conservative' ? 'selected' : ''}>
              Conservative (Slower, fewer requests)
            </option>
            <option value="manifest-only" ${config.discoveryStrategy === 'manifest-only' ? 'selected' : ''}>
              Manifest Only (No discovery)
            </option>
          </select>
        </div>
        
        <div class="mdv-config-section">
          <h4>Request Limits</h4>
          <label>
            Max Discovery Requests:
            <input type="number" id="max-requests" value="${config.maxDiscoveryRequests}" min="1" max="100">
          </label>
          <label>
            Max Documents:
            <input type="number" id="max-documents" value="${config.maxDocuments}" min="1" max="50">
          </label>
          <label>
            Max Concurrent Requests:
            <input type="number" id="max-concurrent" value="${config.maxConcurrentRequests}" min="1" max="10">
          </label>
        </div>
        
        <div class="mdv-config-section">
          <h4>Debug Options</h4>
          <label>
            <input type="checkbox" id="debug-mode" ${config.debugMode ? 'checked' : ''}>
            Enable Debug Mode
          </label>
          <label>
            <input type="checkbox" id="telemetry" ${config.telemetryEnabled ? 'checked' : ''}>
            Enable Telemetry (Anonymous)
          </label>
        </div>
        
        <div class="mdv-config-section">
          <h4>Priority Files</h4>
          <textarea id="priority-files" rows="3">${config.priorityFiles.join('\n')}</textarea>
          <small>One file per line. These files are checked first.</small>
        </div>
        
        <div class="mdv-config-actions">
          <button class="mdv-button mdv-button-primary" onclick="ConfigPanel.save()">
            Apply Changes
          </button>
          <button class="mdv-button mdv-button-secondary" onclick="ConfigPanel.reset()">
            Reset to Defaults
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.injectStyles();
  }

  private attachEventListeners(): void {
    // Strategy change
    this.container.querySelector('#discovery-strategy')?.addEventListener('change', e => {
      const strategy = (e.target as HTMLSelectElement)
        .value as DiscoveryConfig['discoveryStrategy'];
      this.updateConfig({ discoveryStrategy: strategy });
    });

    // Number inputs
    ['max-requests', 'max-documents', 'max-concurrent'].forEach(id => {
      this.container.querySelector(`#${id}`)?.addEventListener('change', e => {
        const value = parseInt((e.target as HTMLInputElement).value);
        const key = id
          .replace(/-/g, '_')
          .replace('_requests', 'DiscoveryRequests')
          .replace('_documents', 'Documents')
          .replace('_concurrent', 'ConcurrentRequests');

        this.updateConfig({ [key]: value });
      });
    });

    // Debug options
    this.container.querySelector('#debug-mode')?.addEventListener('change', e => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.updateConfig({ debugMode: enabled });
      localStorage.setItem('mdv_debug_mode', enabled.toString());
    });

    this.container.querySelector('#telemetry')?.addEventListener('change', e => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.updateConfig({ telemetryEnabled: enabled });
    });

    // Priority files
    this.container.querySelector('#priority-files')?.addEventListener('change', e => {
      const files = (e.target as HTMLTextAreaElement).value
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      this.updateConfig({ priorityFiles: files });
    });
  }

  private updateConfig(updates: Partial<DiscoveryConfig>): void {
    this.configManager.update(updates);
    this.onUpdate(updates);
  }

  static save(): void {
    // Save to localStorage
    const config = this.configManager.getAll();
    localStorage.setItem('mdv_discovery_config', JSON.stringify(config));
    console.log('💾 Configuration saved');
  }

  static reset(): void {
    localStorage.removeItem('mdv_discovery_config');
    window.location.reload();
  }

  private injectStyles(): void {
    // ... styles for config panel
  }
}
```

**Step 3: Integration with Zero-Config** (Day 5)

```typescript
// src/zero-config.ts (configuration integration)
export interface ZeroConfigOptions {
  container?: string | HTMLElement;
  configPath?: string;
  docsPath?: string;
  theme?: string;
  title?: string;
  discovery?: DiscoveryConfig; // New option
}

export async function init(options: ZeroConfigOptions = {}): Promise<MarkdownDocsViewer> {
  // Initialize configuration manager
  const configManager = new DiscoveryConfigManager(options.discovery);

  // Log configuration if debug mode
  if (configManager.get('debugMode')) {
    console.group('🔧 Discovery Configuration');
    console.table(configManager.getAll());
    console.groupEnd();
  }

  // Apply configuration to components
  RequestManager.getInstance({
    maxConcurrent: configManager.get('maxConcurrentRequests'),
    timeout: configManager.get('requestTimeout'),
    circuitBreakerThreshold: configManager.get('circuitBreakerThreshold'),
    retryAttempts: configManager.get('retryAttempts'),
    retryDelay: configManager.get('retryDelay'),
  });

  // Continue with initialization...
}
```

## Testing Requirements

### Manifest System Tests

```typescript
// tests/manifest/loader.test.ts
describe('Manifest Loader', () => {
  it('should load valid manifest', async () => {
    const manifest = {
      version: '1.0',
      basePath: './docs',
      documents: [{ id: 'intro', title: 'Introduction', file: 'intro.md' }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(manifest),
    });

    const loader = new ManifestLoader();
    const result = await loader.load('./docs');

    expect(result).toEqual(
      expect.objectContaining({
        version: '1.0',
        documents: expect.arrayContaining([expect.objectContaining({ id: 'intro' })]),
      })
    );
  });

  it('should validate manifest schema', () => {
    const invalid = { version: '2.0', documents: 'not-an-array' };

    expect(() => ManifestSchema.validate(invalid)).toThrow();
  });
});
```

### Configuration Tests

```typescript
// tests/config/discovery-config.test.ts
describe('Discovery Configuration', () => {
  it('should merge user config with defaults', () => {
    const config = new DiscoveryConfigManager({
      maxDocuments: 10,
      debugMode: true,
    });

    expect(config.get('maxDocuments')).toBe(10);
    expect(config.get('debugMode')).toBe(true);
    expect(config.get('maxDiscoveryRequests')).toBe(10); // Default
  });

  it('should apply environment presets', () => {
    // Mock GitHub Pages environment
    vi.mocked(EnvironmentDetector.getInstance).mockReturnValue({
      getCachedEnvironment: () => ({
        type: HostingEnvironment.GITHUB_PAGES,
      }),
    });

    const config = new DiscoveryConfigManager();

    expect(config.get('maxConcurrentRequests')).toBe(3);
    expect(config.get('discoveryStrategy')).toBe('conservative');
  });
});
```

## Success Metrics

1. **Manifest Adoption**
   - [ ] Zero HTTP requests when manifest present
   - [ ] 100% backward compatibility
   - [ ] Manifest generation tool usage

2. **Configuration Flexibility**
   - [ ] All discovery behavior configurable
   - [ ] Environment-specific presets working
   - [ ] Debug mode provides useful insights

3. **Performance Impact**
   - [ ] Manifest loading <100ms
   - [ ] No performance regression without manifest
   - [ ] Configuration changes apply instantly

4. **Developer Experience**
   - [ ] Clear configuration documentation
   - [ ] Intuitive configuration UI
   - [ ] Helpful debug output

## Rollout Strategy

### Week 4 Schedule

**Monday-Tuesday**: Manifest System

- Implement manifest loader
- Create generation tooling
- Integration with discovery

**Wednesday-Thursday**: Configuration System

- Build configuration manager
- Create configuration UI
- Environment preset system

**Friday**: Testing and Polish

- Integration testing
- Documentation updates
- Performance validation

## Next Steps

After completing Phase 4:

- Advanced features fully implemented
- Users have complete control over discovery
- Ready for Phase 5: Testing and validation
