/**
 * Environment mocking for testing optimization features
 *
 * Simulates different hosting environments (GitHub Pages, Netlify, Vercel)
 * with realistic network behaviors, CORS policies, and response patterns.
 */

import { vi } from 'vitest';

/**
 * Environment types for simulation
 */
export enum MockEnvironmentType {
  GITHUB_PAGES = 'github_pages',
  NETLIFY = 'netlify',
  VERCEL = 'vercel',
  LOCAL_DEV = 'local_dev',
  UNKNOWN = 'unknown',
}

/**
 * Environment capabilities for different platforms
 */
export interface MockEnvironmentCapabilities {
  corsSupport: boolean;
  headRequests: boolean;
  maxConcurrentRequests: number;
  customHeaders: boolean;
  redirectSupport: boolean;
  compressionSupport: boolean;
}

/**
 * Network delay configuration
 */
export interface NetworkDelayConfig {
  min: number;
  max: number;
  errorRate: number; // 0-1, percentage of requests that should fail
}

/**
 * Response configuration for specific URLs
 */
export interface ResponseConfig {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  delay?: number;
}

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS: Record<MockEnvironmentType, MockEnvironmentCapabilities> = {
  [MockEnvironmentType.GITHUB_PAGES]: {
    corsSupport: false, // Limited CORS support
    headRequests: false, // GitHub Pages blocks HEAD requests
    maxConcurrentRequests: 6,
    customHeaders: false,
    redirectSupport: true,
    compressionSupport: true,
  },
  [MockEnvironmentType.NETLIFY]: {
    corsSupport: true,
    headRequests: true,
    maxConcurrentRequests: 12,
    customHeaders: true,
    redirectSupport: true,
    compressionSupport: true,
  },
  [MockEnvironmentType.VERCEL]: {
    corsSupport: true,
    headRequests: true,
    maxConcurrentRequests: 10,
    customHeaders: true,
    redirectSupport: true,
    compressionSupport: true,
  },
  [MockEnvironmentType.LOCAL_DEV]: {
    corsSupport: true,
    headRequests: true,
    maxConcurrentRequests: 20,
    customHeaders: true,
    redirectSupport: true,
    compressionSupport: false,
  },
  [MockEnvironmentType.UNKNOWN]: {
    corsSupport: false,
    headRequests: false,
    maxConcurrentRequests: 2,
    customHeaders: false,
    redirectSupport: false,
    compressionSupport: false,
  },
};

/**
 * Default network delays for different environments
 */
const DEFAULT_NETWORK_DELAYS: Record<MockEnvironmentType, NetworkDelayConfig> = {
  [MockEnvironmentType.GITHUB_PAGES]: { min: 200, max: 800, errorRate: 0.05 },
  [MockEnvironmentType.NETLIFY]: { min: 100, max: 400, errorRate: 0.02 },
  [MockEnvironmentType.VERCEL]: { min: 80, max: 300, errorRate: 0.01 },
  [MockEnvironmentType.LOCAL_DEV]: { min: 10, max: 50, errorRate: 0 },
  [MockEnvironmentType.UNKNOWN]: { min: 500, max: 2000, errorRate: 0.15 },
};

/**
 * Environment mock class for testing different hosting scenarios
 */
export class EnvironmentMock {
  private originalFetch: typeof fetch;
  private environment: MockEnvironmentType;
  private capabilities: MockEnvironmentCapabilities;
  private networkDelay: NetworkDelayConfig;
  private customResponses: Map<string, ResponseConfig> = new Map();
  private requestLog: Array<{
    url: string;
    method: string;
    timestamp: number;
    environment: MockEnvironmentType;
    blocked?: boolean;
    error?: string;
  }> = [];
  private activeRequests = 0;

  constructor(environment: MockEnvironmentType = MockEnvironmentType.LOCAL_DEV) {
    this.originalFetch = global.fetch;
    this.environment = environment;
    this.capabilities = { ...ENVIRONMENT_CONFIGS[environment] };
    this.networkDelay = { ...DEFAULT_NETWORK_DELAYS[environment] };
  }

  /**
   * Start mocking the environment
   */
  public start(): void {
    global.fetch = vi.fn().mockImplementation(this.mockFetch.bind(this));
  }

  /**
   * Stop mocking and restore original fetch
   */
  public stop(): void {
    global.fetch = this.originalFetch;
  }

  /**
   * Change the environment type
   */
  public setEnvironment(environment: MockEnvironmentType): void {
    this.environment = environment;
    this.capabilities = { ...ENVIRONMENT_CONFIGS[environment] };
    this.networkDelay = { ...DEFAULT_NETWORK_DELAYS[environment] };
  }

  /**
   * Override capabilities for custom testing
   */
  public setCapabilities(capabilities: Partial<MockEnvironmentCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }

  /**
   * Set network delay configuration
   */
  public setNetworkDelay(config: Partial<NetworkDelayConfig>): void {
    this.networkDelay = { ...this.networkDelay, ...config };
  }

  /**
   * Set custom response for specific URL
   */
  public setCustomResponse(urlPattern: string, config: ResponseConfig): void {
    this.customResponses.set(urlPattern, config);
  }

  /**
   * Clear all custom responses
   */
  public clearCustomResponses(): void {
    this.customResponses.clear();
  }

  /**
   * Get request log
   */
  public getRequestLog(): typeof this.requestLog {
    return [...this.requestLog];
  }

  /**
   * Clear request log
   */
  public clearRequestLog(): void {
    this.requestLog = [];
  }

  /**
   * Get current environment info
   */
  public getEnvironmentInfo(): {
    type: MockEnvironmentType;
    capabilities: MockEnvironmentCapabilities;
    networkDelay: NetworkDelayConfig;
  } {
    return {
      type: this.environment,
      capabilities: { ...this.capabilities },
      networkDelay: { ...this.networkDelay },
    };
  }

  /**
   * Mock fetch implementation
   */
  private async mockFetch(url: string, options: Record<string, any> = {}): Promise<Response> {
    const method = options.method || 'GET';
    const startTime = Date.now();

    // Log the request
    const logEntry = {
      url,
      method,
      timestamp: startTime,
      environment: this.environment,
    };

    // Check concurrent request limit
    if (this.activeRequests >= this.capabilities.maxConcurrentRequests) {
      const error = 'Too many concurrent requests';
      this.requestLog.push({ ...logEntry, blocked: true, error });
      throw new Error(error);
    }

    this.activeRequests++;

    try {
      // Check for environment-specific blocking
      this.checkEnvironmentBlocking(method, url);

      // Check for custom responses
      const customResponse = this.findCustomResponse(url);
      if (customResponse) {
        await this.simulateNetworkDelay(customResponse.delay);
        this.requestLog.push(logEntry);
        return this.createResponse(customResponse);
      }

      // Simulate network delay and potential errors
      await this.simulateNetworkDelay();
      this.checkForNetworkError();

      // Generate default response based on URL
      const response = this.generateDefaultResponse(url, method);
      this.requestLog.push(logEntry);
      return response;
    } catch (error) {
      this.requestLog.push({
        ...logEntry,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Check for environment-specific request blocking
   */
  private checkEnvironmentBlocking(method: string, url: string): void {
    // GitHub Pages blocks HEAD requests
    if (this.environment === MockEnvironmentType.GITHUB_PAGES && method === 'HEAD') {
      throw new Error('GitHub Pages does not support HEAD requests');
    }

    // Simulate CORS blocking for cross-origin requests
    if (!this.capabilities.corsSupport && this.isCrossOrigin(url)) {
      throw new Error('CORS policy blocks this request');
    }

    // Block custom headers if not supported
    if (!this.capabilities.customHeaders && this.hasCustomHeaders(url)) {
      throw new Error('Custom headers not supported in this environment');
    }
  }

  /**
   * Check if URL is cross-origin (simplified check)
   */
  private isCrossOrigin(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1';
    } catch {
      return false;
    }
  }

  /**
   * Check if request has custom headers (simplified)
   */
  private hasCustomHeaders(url: string): boolean {
    // Simplified check - in real implementation, this would check request headers
    return url.includes('api.') || url.includes('custom-header');
  }

  /**
   * Find custom response for URL
   */
  private findCustomResponse(url: string): ResponseConfig | null {
    for (const [pattern, config] of this.customResponses) {
      if (url.includes(pattern) || new RegExp(pattern).test(url)) {
        return config;
      }
    }
    return null;
  }

  /**
   * Simulate network delay
   */
  private async simulateNetworkDelay(customDelay?: number): Promise<void> {
    const delay = customDelay ?? this.calculateNetworkDelay();
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Calculate random network delay
   */
  private calculateNetworkDelay(): number {
    const { min, max } = this.networkDelay;
    return Math.random() * (max - min) + min;
  }

  /**
   * Check for simulated network errors
   */
  private checkForNetworkError(): void {
    if (Math.random() < this.networkDelay.errorRate) {
      const errors = [
        'Network error',
        'Connection timeout',
        'DNS resolution failed',
        'Connection refused',
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
  }

  /**
   * Generate default response based on URL pattern
   */
  private generateDefaultResponse(url: string, _method: string): Response {
    // Handle common file types
    if (url.endsWith('.md')) {
      return this.createMarkdownResponse(url);
    }

    if (url.endsWith('.json') || url.includes('config')) {
      return this.createJsonResponse(url);
    }

    if (url.endsWith('.html')) {
      return this.createHtmlResponse(url);
    }

    // Handle 404s for unknown paths
    if (url.includes('nonexistent') || url.includes('404')) {
      return this.create404Response();
    }

    // Default successful response
    return new Response('OK', { status: 200 });
  }

  /**
   * Create markdown file response
   */
  private createMarkdownResponse(url: string): Response {
    const filename = url.split('/').pop() || 'unknown.md';
    const content = `# ${filename.replace('.md', '')}\n\nThis is a mock markdown file.`;

    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  /**
   * Create JSON response
   */
  private createJsonResponse(_url: string): Response {
    const defaultConfig = {
      title: 'Mock Documentation',
      basePath: '/docs',
      theme: 'light',
    };

    return new Response(JSON.stringify(defaultConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create HTML response
   */
  private createHtmlResponse(_url: string): Response {
    // GitHub Pages returns HTML for 404s
    if (this.environment === MockEnvironmentType.GITHUB_PAGES) {
      return new Response('<html><body><h1>404 - Page Not Found</h1></body></html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('<html><body><h1>OK</h1></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  /**
   * Create 404 response
   */
  private create404Response(): Response {
    if (this.environment === MockEnvironmentType.GITHUB_PAGES) {
      // GitHub Pages returns HTML 404s
      return new Response('<html><body><h1>404 - Page Not Found</h1></body></html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create response from config
   */
  private createResponse(config: ResponseConfig): Response {
    return new Response(
      typeof config.body === 'string' ? config.body : JSON.stringify(config.body),
      {
        status: config.status,
        headers: config.headers || {},
      }
    );
  }
}

/**
 * Pre-configured environment mocks for common testing scenarios
 */
export class EnvironmentMockPresets {
  /**
   * Create GitHub Pages environment with realistic constraints
   */
  public static githubPages(): EnvironmentMock {
    const mock = new EnvironmentMock(MockEnvironmentType.GITHUB_PAGES);

    // Add typical GitHub Pages responses
    mock.setCustomResponse('docs.json', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body><h1>404 - Page Not Found</h1></body></html>',
    });

    mock.setCustomResponse('README.md', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: '# Documentation\n\nWelcome to the docs!',
    });

    return mock;
  }

  /**
   * Create Netlify environment with full capabilities
   */
  public static netlify(): EnvironmentMock {
    const mock = new EnvironmentMock(MockEnvironmentType.NETLIFY);

    // Netlify supports redirects and custom headers
    mock.setCustomResponse('_redirects', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: '/docs/* /docs/index.html 200',
    });

    return mock;
  }

  /**
   * Create Vercel environment
   */
  public static vercel(): EnvironmentMock {
    const mock = new EnvironmentMock(MockEnvironmentType.VERCEL);

    // Vercel supports serverless functions
    mock.setCustomResponse('/api/', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Hello from Vercel API' },
    });

    return mock;
  }

  /**
   * Create local development environment
   */
  public static localDev(): EnvironmentMock {
    const mock = new EnvironmentMock(MockEnvironmentType.LOCAL_DEV);

    // Local dev has fast responses and full capabilities
    mock.setNetworkDelay({ min: 1, max: 10, errorRate: 0 });

    return mock;
  }

  /**
   * Create hostile environment for stress testing
   */
  public static hostile(): EnvironmentMock {
    const mock = new EnvironmentMock(MockEnvironmentType.UNKNOWN);

    // Very limited capabilities and high error rates
    mock.setCapabilities({
      corsSupport: false,
      headRequests: false,
      maxConcurrentRequests: 1,
      customHeaders: false,
      redirectSupport: false,
      compressionSupport: false,
    });

    mock.setNetworkDelay({
      min: 1000,
      max: 5000,
      errorRate: 0.3,
    });

    return mock;
  }
}

/**
 * Helper functions for testing with environment mocks
 */
export class EnvironmentTestHelpers {
  /**
   * Test function against multiple environments
   */
  public static async testAcrossEnvironments<T>(
    testFn: (mock: EnvironmentMock) => Promise<T>,
    environments: MockEnvironmentType[] = [
      MockEnvironmentType.GITHUB_PAGES,
      MockEnvironmentType.NETLIFY,
      MockEnvironmentType.VERCEL,
    ]
  ): Promise<Record<MockEnvironmentType, T>> {
    const results: Record<string, T> = {};

    for (const env of environments) {
      const mock = new EnvironmentMock(env);
      mock.start();

      try {
        results[env] = await testFn(mock);
      } finally {
        mock.stop();
      }
    }

    return results as Record<MockEnvironmentType, T>;
  }

  /**
   * Assert that optimization works across all environments
   */
  public static async assertOptimizationWorksEverywhere(
    testFn: (mock: EnvironmentMock) => Promise<void>
  ): Promise<void> {
    const environments = [
      MockEnvironmentType.GITHUB_PAGES,
      MockEnvironmentType.NETLIFY,
      MockEnvironmentType.VERCEL,
      MockEnvironmentType.LOCAL_DEV,
    ];

    for (const env of environments) {
      const mock = new EnvironmentMock(env);
      mock.start();

      try {
        await testFn(mock);
      } catch (error) {
        throw new Error(`Optimization failed in ${env}: ${error}`);
      } finally {
        mock.stop();
      }
    }
  }
}
