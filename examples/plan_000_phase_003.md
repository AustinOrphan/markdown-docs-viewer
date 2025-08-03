# Plan 000 - Phase 3: Cross-Environment Compatibility

## Overview

This phase addresses the critical need for the zero-config system to work reliably across different hosting environments. It implements environment detection, platform-specific adaptations, and ensures compatibility with GitHub Pages, Netlify, Vercel, and other common hosting solutions.

## Timeline

**Duration**: Week 3 (5 days)  
**Priority**: High (Critical for real-world usage)

## Objectives

1. Auto-detect hosting environment and adapt behavior accordingly
2. Handle CORS restrictions on GitHub Pages
3. Support redirect-based routing on Netlify/Vercel
4. Implement environment-specific request strategies
5. Provide fallback mechanisms for restrictive environments

## Issue Implementation

### Issue #5: Hosting Environment Compatibility

**Priority**: High | **Type**: Compatibility | **Effort**: 4-5 days

#### Implementation Details

**Step 1: Environment Detection System** (Day 1)

```typescript
// src/environment/detector.ts
export enum HostingEnvironment {
  GITHUB_PAGES = 'github_pages',
  NETLIFY = 'netlify',
  VERCEL = 'vercel',
  GITLAB_PAGES = 'gitlab_pages',
  SURGE = 'surge',
  FIREBASE = 'firebase',
  AWS_S3 = 'aws_s3',
  STATIC_SERVER = 'static_server',
  LOCAL_DEV = 'local_dev',
  UNKNOWN = 'unknown',
}

export interface EnvironmentInfo {
  type: HostingEnvironment;
  confidence: number; // 0-1
  indicators: string[];
  capabilities: EnvironmentCapabilities;
}

export interface EnvironmentCapabilities {
  corsSupport: boolean;
  headRequests: boolean;
  redirectSupport: boolean;
  customHeaders: boolean;
  http2Support: boolean;
  compressionSupport: boolean;
  maxConcurrentRequests: number;
  hasServiceWorker: boolean;
  hasSPA404Handling: boolean;
}

export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private cachedInfo?: EnvironmentInfo;

  private constructor() {}

  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  async detect(): Promise<EnvironmentInfo> {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    const indicators: string[] = [];
    let environment = HostingEnvironment.UNKNOWN;
    let confidence = 0;

    // Check URL patterns
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // GitHub Pages detection
    if (this.isGitHubPages(hostname, pathname)) {
      environment = HostingEnvironment.GITHUB_PAGES;
      confidence = 0.9;
      indicators.push('GitHub Pages hostname pattern');
    }

    // Netlify detection
    else if (this.isNetlify(hostname)) {
      environment = HostingEnvironment.NETLIFY;
      confidence = 0.9;
      indicators.push('Netlify hostname pattern');
    }

    // Vercel detection
    else if (this.isVercel(hostname)) {
      environment = HostingEnvironment.VERCEL;
      confidence = 0.9;
      indicators.push('Vercel hostname pattern');
    }

    // Local development detection
    else if (this.isLocalDev(hostname)) {
      environment = HostingEnvironment.LOCAL_DEV;
      confidence = 1.0;
      indicators.push('Localhost hostname');
    }

    // Additional detection via headers and behavior
    if (environment === HostingEnvironment.UNKNOWN) {
      const behaviorInfo = await this.detectByBehavior();
      environment = behaviorInfo.environment;
      confidence = behaviorInfo.confidence;
      indicators.push(...behaviorInfo.indicators);
    }

    // Get environment-specific capabilities
    const capabilities = this.getCapabilities(environment);

    this.cachedInfo = {
      type: environment,
      confidence,
      indicators,
      capabilities,
    };

    console.log(`🌍 Detected environment: ${environment} (confidence: ${confidence})`);
    console.log(`   Indicators: ${indicators.join(', ')}`);

    return this.cachedInfo;
  }

  private isGitHubPages(hostname: string, pathname: string): boolean {
    return (
      hostname.endsWith('.github.io') ||
      hostname.includes('github.') ||
      // Check for custom domain with GitHub Pages CNAME
      (pathname.includes('/') && this.hasGitHubPagesStructure())
    );
  }

  private isNetlify(hostname: string): boolean {
    return (
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.netlify.com') ||
      hostname.includes('netlify')
    );
  }

  private isVercel(hostname: string): boolean {
    return (
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.now.sh') ||
      hostname.includes('vercel')
    );
  }

  private isLocalDev(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    );
  }

  private hasGitHubPagesStructure(): boolean {
    // Check for common GitHub Pages indicators
    try {
      // GitHub Pages often has a 404.html file
      const has404 = document.querySelector('link[href*="404.html"]') !== null;

      // Check meta tags
      const generator = document.querySelector('meta[name="generator"]');
      if (generator?.getAttribute('content')?.includes('Jekyll')) {
        return true;
      }

      return has404;
    } catch {
      return false;
    }
  }

  private async detectByBehavior(): Promise<{
    environment: HostingEnvironment;
    confidence: number;
    indicators: string[];
  }> {
    const indicators: string[] = [];

    // Test CORS behavior
    const corsTest = await this.testCorsCapability();
    if (!corsTest.supported) {
      indicators.push('Restrictive CORS policy');
    }

    // Test redirect behavior
    const redirectTest = await this.testRedirectBehavior();
    if (redirectTest.spaMode) {
      indicators.push('SPA-style 404 handling');
    }

    // Test response headers
    const headerTest = await this.testResponseHeaders();

    // Analyze results
    if (!corsTest.supported && headerTest.headers['x-github-request-id']) {
      return {
        environment: HostingEnvironment.GITHUB_PAGES,
        confidence: 0.7,
        indicators: [...indicators, 'GitHub-specific headers'],
      };
    }

    if (headerTest.headers['x-nf-request-id']) {
      return {
        environment: HostingEnvironment.NETLIFY,
        confidence: 0.8,
        indicators: [...indicators, 'Netlify headers'],
      };
    }

    if (headerTest.headers['x-vercel-id']) {
      return {
        environment: HostingEnvironment.VERCEL,
        confidence: 0.8,
        indicators: [...indicators, 'Vercel headers'],
      };
    }

    return {
      environment: HostingEnvironment.STATIC_SERVER,
      confidence: 0.5,
      indicators,
    };
  }

  private async testCorsCapability(): Promise<{ supported: boolean }> {
    try {
      // Try to fetch from a different path
      const testUrl = new URL('/test-cors', window.location.origin);
      const response = await fetch(testUrl.toString(), {
        method: 'HEAD',
        mode: 'cors',
      }).catch(() => null);

      return { supported: response !== null };
    } catch {
      return { supported: false };
    }
  }

  private async testRedirectBehavior(): Promise<{ spaMode: boolean }> {
    try {
      // Test if 404s return the index page (SPA mode)
      const response = await fetch('/definitely-does-not-exist-12345.html');
      const text = await response.text();

      // Check if we got HTML instead of a proper 404
      const spaMode = response.ok && text.includes('<!DOCTYPE html');

      return { spaMode };
    } catch {
      return { spaMode: false };
    }
  }

  private async testResponseHeaders(): Promise<{ headers: Record<string, string> }> {
    try {
      const response = await fetch(window.location.pathname, { method: 'HEAD' });
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      return { headers };
    } catch {
      return { headers: {} };
    }
  }

  private getCapabilities(environment: HostingEnvironment): EnvironmentCapabilities {
    const capabilities: Record<HostingEnvironment, EnvironmentCapabilities> = {
      [HostingEnvironment.GITHUB_PAGES]: {
        corsSupport: false,
        headRequests: false, // Often blocked
        redirectSupport: false,
        customHeaders: false,
        http2Support: true,
        compressionSupport: true,
        maxConcurrentRequests: 3,
        hasServiceWorker: false,
        hasSPA404Handling: false,
      },

      [HostingEnvironment.NETLIFY]: {
        corsSupport: true,
        headRequests: true,
        redirectSupport: true,
        customHeaders: true,
        http2Support: true,
        compressionSupport: true,
        maxConcurrentRequests: 6,
        hasServiceWorker: true,
        hasSPA404Handling: true,
      },

      [HostingEnvironment.VERCEL]: {
        corsSupport: true,
        headRequests: true,
        redirectSupport: true,
        customHeaders: true,
        http2Support: true,
        compressionSupport: true,
        maxConcurrentRequests: 6,
        hasServiceWorker: true,
        hasSPA404Handling: true,
      },

      [HostingEnvironment.LOCAL_DEV]: {
        corsSupport: true,
        headRequests: true,
        redirectSupport: true,
        customHeaders: true,
        http2Support: false,
        compressionSupport: false,
        maxConcurrentRequests: 10,
        hasServiceWorker: true,
        hasSPA404Handling: false,
      },

      [HostingEnvironment.STATIC_SERVER]: {
        corsSupport: true,
        headRequests: true,
        redirectSupport: false,
        customHeaders: false,
        http2Support: false,
        compressionSupport: true,
        maxConcurrentRequests: 6,
        hasServiceWorker: false,
        hasSPA404Handling: false,
      },

      // ... other environments

      [HostingEnvironment.UNKNOWN]: {
        corsSupport: true,
        headRequests: true,
        redirectSupport: false,
        customHeaders: false,
        http2Support: false,
        compressionSupport: false,
        maxConcurrentRequests: 4,
        hasServiceWorker: false,
        hasSPA404Handling: false,
      },
    };

    return capabilities[environment] || capabilities[HostingEnvironment.UNKNOWN];
  }
}
```

**Step 2: Environment-Specific Request Strategies** (Day 2-3)

```typescript
// src/environment/request-strategy.ts
import { EnvironmentInfo, HostingEnvironment } from './detector';
import { RequestManager, RequestManagerOptions } from '../request-manager';

export interface RequestStrategy {
  configureRequestManager(options: RequestManagerOptions): RequestManagerOptions;
  adaptRequest(url: string, init?: RequestInit): { url: string; init?: RequestInit };
  handleFailure(error: Error, url: string): { retry: boolean; fallbackUrl?: string };
  getDiscoveryStrategy(): 'aggressive' | 'conservative' | 'manifest-only';
}

export class RequestStrategyFactory {
  static create(environment: EnvironmentInfo): RequestStrategy {
    switch (environment.type) {
      case HostingEnvironment.GITHUB_PAGES:
        return new GitHubPagesStrategy(environment);

      case HostingEnvironment.NETLIFY:
        return new NetlifyStrategy(environment);

      case HostingEnvironment.VERCEL:
        return new VercelStrategy(environment);

      case HostingEnvironment.LOCAL_DEV:
        return new LocalDevStrategy(environment);

      default:
        return new DefaultStrategy(environment);
    }
  }
}

// GitHub Pages specific strategy
class GitHubPagesStrategy implements RequestStrategy {
  constructor(private environment: EnvironmentInfo) {}

  configureRequestManager(options: RequestManagerOptions): RequestManagerOptions {
    return {
      ...options,
      maxConcurrent: 3, // GitHub Pages performs better with fewer concurrent requests
      timeout: 15000, // Longer timeout for slower responses
      circuitBreakerThreshold: 5, // More lenient due to HEAD request issues
      retryAttempts: 1, // Fewer retries to avoid rate limiting
    };
  }

  adaptRequest(url: string, init?: RequestInit): { url: string; init?: RequestInit } {
    // GitHub Pages often has issues with HEAD requests
    if (init?.method === 'HEAD') {
      console.log(`🔄 Converting HEAD to GET for GitHub Pages: ${url}`);

      return {
        url,
        init: {
          ...init,
          method: 'GET',
          // Add range header to minimize data transfer
          headers: {
            ...init.headers,
            Range: 'bytes=0-1023', // Just get first 1KB
          },
        },
      };
    }

    return { url, init };
  }

  handleFailure(error: Error, url: string): { retry: boolean; fallbackUrl?: string } {
    // GitHub Pages returns 404 as HTML page, not proper error
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      // Don't retry 404s
      return { retry: false };
    }

    // CORS errors are common on GitHub Pages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // Try with index.html appended
      if (!url.endsWith('.html') && !url.endsWith('.md')) {
        return {
          retry: true,
          fallbackUrl: url + '/index.html',
        };
      }
    }

    return { retry: false };
  }

  getDiscoveryStrategy(): 'conservative' {
    return 'conservative'; // GitHub Pages needs conservative approach
  }
}

// Netlify specific strategy
class NetlifyStrategy implements RequestStrategy {
  constructor(private environment: EnvironmentInfo) {}

  configureRequestManager(options: RequestManagerOptions): RequestManagerOptions {
    return {
      ...options,
      maxConcurrent: 6, // Netlify can handle more concurrent requests
      timeout: 10000,
      circuitBreakerThreshold: 10,
      retryAttempts: 2,
    };
  }

  adaptRequest(url: string, init?: RequestInit): { url: string; init?: RequestInit } {
    // Netlify handles requests normally
    return { url, init };
  }

  handleFailure(error: Error, url: string): { retry: boolean; fallbackUrl?: string } {
    // Netlify might have _redirects file affecting paths
    if (error.message.includes('404')) {
      // Try without .html extension (pretty URLs)
      if (url.endsWith('.html')) {
        return {
          retry: true,
          fallbackUrl: url.replace(/\.html$/, ''),
        };
      }
    }

    return { retry: true }; // Netlify is generally reliable, retry is safe
  }

  getDiscoveryStrategy(): 'aggressive' {
    return 'aggressive'; // Netlify can handle aggressive discovery
  }
}

// Default strategy for unknown environments
class DefaultStrategy implements RequestStrategy {
  constructor(private environment: EnvironmentInfo) {}

  configureRequestManager(options: RequestManagerOptions): RequestManagerOptions {
    const { capabilities } = this.environment;

    return {
      ...options,
      maxConcurrent: capabilities.maxConcurrentRequests,
      timeout: 10000,
      circuitBreakerThreshold: 10,
      retryAttempts: capabilities.corsSupport ? 2 : 1,
    };
  }

  adaptRequest(url: string, init?: RequestInit): { url: string; init?: RequestInit } {
    const { capabilities } = this.environment;

    // Adapt HEAD requests if not supported
    if (init?.method === 'HEAD' && !capabilities.headRequests) {
      return {
        url,
        init: {
          ...init,
          method: 'GET',
          headers: {
            ...init.headers,
            Range: 'bytes=0-511', // Minimal data
          },
        },
      };
    }

    return { url, init };
  }

  handleFailure(error: Error, url: string): { retry: boolean; fallbackUrl?: string } {
    // Conservative approach for unknown environments
    return { retry: false };
  }

  getDiscoveryStrategy(): 'conservative' {
    return 'conservative';
  }
}
```

**Step 3: Integration with Discovery System** (Day 3-4)

```typescript
// src/config-loader.ts (environment-aware updates)
import { EnvironmentDetector } from './environment/detector';
import { RequestStrategyFactory } from './environment/request-strategy';

export class ConfigLoader {
  private requestManager: RequestManager;
  private requestStrategy?: RequestStrategy;

  async loadConfig(configPath?: string): Promise<DocsConfig> {
    // Detect environment first
    const detector = EnvironmentDetector.getInstance();
    const environment = await detector.detect();

    // Create appropriate request strategy
    this.requestStrategy = RequestStrategyFactory.create(environment);

    // Configure request manager for environment
    const requestOptions = this.requestStrategy.configureRequestManager({});
    this.requestManager = RequestManager.getInstance(requestOptions);

    // Continue with environment-aware loading
    return super.loadConfig(configPath);
  }

  private async checkFileExists(filename: string): Promise<boolean> {
    // Adapt request for environment
    const { url, init } = this.requestStrategy!.adaptRequest(filename, {
      method: 'HEAD',
    });

    const result = await this.requestManager.fetch(url, init);

    if (!result.success && result.error) {
      // Handle environment-specific failures
      const { retry, fallbackUrl } = this.requestStrategy!.handleFailure(result.error, filename);

      if (retry && fallbackUrl) {
        const fallbackResult = await this.requestManager.fetch(fallbackUrl, init);
        return fallbackResult.success && fallbackResult.data?.ok === true;
      }
    }

    return result.success && result.data?.ok === true;
  }
}
```

**Step 4: Environment-Specific UI Hints** (Day 4-5)

```typescript
// src/components/environment-banner.ts
export class EnvironmentBanner {
  static show(environment: EnvironmentInfo): void {
    // Only show for problematic environments
    if (environment.type === HostingEnvironment.GITHUB_PAGES) {
      this.showGitHubPagesHint();
    }
  }

  private static showGitHubPagesHint(): void {
    const banner = document.createElement('div');
    banner.className = 'mdv-env-banner';
    banner.innerHTML = `
      <div class="mdv-env-banner-content">
        <strong>GitHub Pages Detected:</strong> 
        For best performance, consider adding a 
        <code>docs-manifest.json</code> file to avoid discovery requests.
        <a href="#" onclick="EnvironmentBanner.showManifestHelp(); return false;">
          Learn more
        </a>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="mdv-env-banner-close">×</button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
    this.injectBannerStyles();
  }

  static showManifestHelp(): void {
    const modal = document.createElement('div');
    modal.className = 'mdv-modal';
    modal.innerHTML = `
      <div class="mdv-modal-content">
        <h2>Using Manifest Files on GitHub Pages</h2>
        <p>GitHub Pages has CORS restrictions that can slow down document discovery. 
           You can speed up loading by creating a manifest file.</p>
        
        <h3>1. Create <code>docs-manifest.json</code></h3>
        <pre><code>{
  "version": "1.0",
  "basePath": "./docs",
  "documents": [
    {
      "id": "readme",
      "title": "Getting Started",
      "file": "README.md"
    },
    {
      "id": "api",
      "title": "API Reference",
      "file": "api/reference.md",
      "category": "API"
    }
  ]
}</code></pre>
        
        <h3>2. Generate Automatically</h3>
        <pre><code>npx markdown-docs-viewer generate-manifest ./docs</code></pre>
        
        <button onclick="this.parentElement.parentElement.remove()" 
                class="mdv-button mdv-button-primary">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  private static injectBannerStyles(): void {
    if (document.getElementById('mdv-env-banner-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mdv-env-banner-styles';
    styles.textContent = `
      .mdv-env-banner {
        background: #fff3cd;
        border-bottom: 1px solid #ffeaa7;
        padding: 0.75rem;
        font-size: 0.875rem;
        position: relative;
      }
      
      .mdv-env-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .mdv-env-banner code {
        background: rgba(0, 0, 0, 0.05);
        padding: 0.125rem 0.25rem;
        border-radius: 3px;
      }
      
      .mdv-env-banner-close {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.5;
      }
      
      .mdv-env-banner-close:hover {
        opacity: 1;
      }
      
      .mdv-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .mdv-modal-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-modal-content pre {
        background: #f6f8fa;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
      }
    `;

    document.head.appendChild(styles);
  }
}
```

## Testing Requirements

### Environment Simulation Tests

```typescript
// tests/environment/github-pages-simulation.test.ts
import { EnvironmentMock } from '../utils/environment-mock';

describe('GitHub Pages Environment', () => {
  let envMock: EnvironmentMock;

  beforeEach(() => {
    envMock = new EnvironmentMock('github-pages');
    envMock.setup();
  });

  afterEach(() => {
    envMock.teardown();
  });

  it('should handle HEAD request conversion', async () => {
    const loader = new ConfigLoader();
    await loader.loadConfig();

    // Verify HEAD requests were converted to GET
    const fetchCalls = vi.mocked(fetch).mock.calls;
    expect(
      fetchCalls.some(
        call => call[1]?.method === 'GET' && call[1]?.headers?.['Range'] === 'bytes=0-1023'
      )
    ).toBe(true);
  });

  it('should use conservative discovery', async () => {
    const discovery = new AutoDiscovery({ basePath: './docs' });
    const docs = await discovery.discoverFiles();

    // Should make fewer requests on GitHub Pages
    expect(RequestMonitor.getMetrics().length).toBeLessThan(10);
  });
});
```

### Cross-Browser Testing

```typescript
// tests/integration/cross-browser.test.ts
describe('Cross-Browser Compatibility', () => {
  it('should work without fetch API', async () => {
    // Simulate older browser
    const originalFetch = global.fetch;
    delete (global as any).fetch;

    // Should fall back to XHR
    const viewer = await init();
    expect(viewer).toBeDefined();

    global.fetch = originalFetch;
  });

  it('should handle Safari CORS quirks', async () => {
    // Simulate Safari's stricter CORS
    global.fetch = vi.fn().mockImplementation((url, init) => {
      if (init?.mode === 'cors' && !url.startsWith(window.location.origin)) {
        throw new TypeError('Cross-origin request blocked');
      }
      return Promise.resolve({ ok: true });
    });

    const viewer = await init();
    expect(viewer).toBeDefined();
  });
});
```

## Success Metrics

1. **Environment Detection**
   - [ ] 95% accuracy in detecting hosting environment
   - [ ] Detection completes in <100ms
   - [ ] Works across all major browsers

2. **Compatibility**
   - [ ] GitHub Pages: 100% success rate with adapted requests
   - [ ] Netlify/Vercel: Optimal performance maintained
   - [ ] Unknown environments: Graceful degradation

3. **Performance Impact**
   - [ ] No performance regression on modern platforms
   - [ ] GitHub Pages load time improved by 50%
   - [ ] Reduced failed requests by 80%

4. **User Experience**
   - [ ] Clear guidance for environment-specific optimizations
   - [ ] Automatic adaptations require no user configuration
   - [ ] Helpful hints for manual optimizations

## Rollout Strategy

### Week 3 Schedule

**Monday**: Environment Detection Implementation

- Build detection system
- Create capability mappings

**Tuesday-Wednesday**: Request Strategy System

- Implement platform-specific strategies
- Create request adaptation layer

**Thursday**: Integration

- Integrate with ConfigLoader and AutoDiscovery
- Add environment-aware error handling

**Friday**: Testing and Documentation

- Cross-environment testing
- Performance validation
- Documentation updates

## Next Steps

After completing Phase 3:

- Full cross-environment compatibility achieved
- Platform-specific optimizations in place
- Ready for Phase 4: Advanced features (manifest support, user configuration)
