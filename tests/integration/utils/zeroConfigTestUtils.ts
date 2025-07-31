/**
 * Zero-Config Integration Test Utils
 *
 * Specialized utilities for testing zero-config functionality with real DOM and file operations.
 */

import { vi } from 'vitest';
import { ZeroConfigOptions } from '../../../src/zero-config';
import { MarkdownDocsViewer } from '../../../src/viewer';
import { createRealContainer, waitForElement, TestContainer } from './realDOMSetup';

export interface ZeroConfigTestResult {
  viewer: MarkdownDocsViewer;
  container: HTMLElement;
  initTime: number;
  success: boolean;
  error?: Error;
}

export interface ErrorUIValidationResult {
  hasErrorUI: boolean;
  errorType: 'setup-required' | 'viewer-creation-failed' | 'other' | 'none';
  errorMessage?: string;
  hasQuickSetup?: boolean;
  hasTechnicalDetails?: boolean;
}

/**
 * Zero-Config Test Runner
 * Handles initialization and cleanup for zero-config tests
 */
export class ZeroConfigTestRunner {
  private containers: TestContainer[] = [];
  private viewers: MarkdownDocsViewer[] = [];

  /**
   * Initialize zero-config with test tracking
   */
  async initWithTracking(options: ZeroConfigOptions = {}): Promise<ZeroConfigTestResult> {
    const startTime = performance.now();
    let viewer: MarkdownDocsViewer;
    let container: HTMLElement;
    let success = false;
    let error: Error | undefined;

    try {
      // Import here to avoid issues with module mocking
      const { init } = await import('../../../src/zero-config');
      
      viewer = await init(options);
      container = viewer.container;
      success = true;
      
      // Track for cleanup
      this.viewers.push(viewer);
    } catch (err) {
      error = err as Error;
      // Create fallback container for error testing
      container = options.container as HTMLElement || document.body;
      viewer = {} as MarkdownDocsViewer; // Placeholder
    }

    const endTime = performance.now();
    const initTime = endTime - startTime;

    return {
      viewer,
      container,
      initTime,
      success,
      error
    };
  }

  /**
   * Create a test container with specific configuration
   */
  createTestContainer(id?: string, tagName: string = 'div'): TestContainer {
    const container = createRealContainer(id, tagName);
    this.containers.push(container);
    return container;
  }

  /**
   * Clean up all tracked resources
   */
  async cleanup(): Promise<void> {
    // Destroy viewers
    await Promise.all(
      this.viewers.map(async viewer => {
        try {
          if (viewer && typeof viewer.destroy === 'function') {
            await viewer.destroy();
          }
        } catch (err) {
          console.warn('Error destroying viewer:', err);
        }
      })
    );

    // Clean up containers
    this.containers.forEach(container => {
      try {
        container.cleanup();
      } catch (err) {
        console.warn('Error cleaning up container:', err);
      }
    });

    // Clear arrays
    this.viewers.length = 0;
    this.containers.length = 0;
  }
}

/**
 * Validates error UI display and content
 */
export async function validateErrorUI(
  container: HTMLElement,
  timeout: number = 5000
): Promise<ErrorUIValidationResult> {
  try {
    // Wait for any error UI to appear
    await new Promise(resolve => setTimeout(resolve, 100));

    const innerHTML = container.innerHTML;
    
    if (!innerHTML || innerHTML.trim() === '') {
      return { hasErrorUI: false, errorType: 'none' };
    }

    let errorType: ErrorUIValidationResult['errorType'] = 'other';
    let errorMessage: string | undefined;
    let hasQuickSetup = false;
    let hasTechnicalDetails = false;

    // Check for setup required error
    if (innerHTML.includes('Setup Required') || innerHTML.includes('Quick Setup')) {
      errorType = 'setup-required';
      hasQuickSetup = innerHTML.includes('Quick Setup');
    }
    // Check for viewer creation failure
    else if (innerHTML.includes('Viewer Creation Failed') || innerHTML.includes('Failed to create')) {
      errorType = 'viewer-creation-failed';
    }

    // Extract error message
    const h2Match = innerHTML.match(/<h2[^>]*>([^<]+)</);
    if (h2Match) {
      errorMessage = h2Match[1].replace(/[^\w\s-]/g, '').trim();
    }

    // Check for technical details
    hasTechnicalDetails = innerHTML.includes('Technical Details') || innerHTML.includes('Error Details');

    return {
      hasErrorUI: true,
      errorType,
      errorMessage,
      hasQuickSetup,
      hasTechnicalDetails
    };
  } catch (err) {
    return { hasErrorUI: false, errorType: 'none' };
  }
}

/**
 * Waits for container to have specific content
 */
export async function waitForContainerContent(
  container: HTMLElement,
  expectedContent?: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkContent = () => {
      const innerHTML = container.innerHTML;
      
      if (expectedContent) {
        if (innerHTML.includes(expectedContent)) {
          resolve(true);
          return;
        }
      } else {
        // Just check if container has any content
        if (innerHTML && innerHTML.trim() !== '') {
          resolve(true);
          return;
        }
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }
      
      setTimeout(checkContent, 50);
    };
    
    checkContent();
  });
}

/**
 * Tests container selection and fallback logic
 */
export class ContainerSelectionTester {
  private testContainers: TestContainer[] = [];

  /**
   * Setup containers for testing selection logic
   */
  setupContainers() {
    // Create containers in the order zero-config looks for them
    const docs = createRealContainer('docs');
    const documentation = createRealContainer('documentation');
    const docsClass = createRealContainer('test-with-docs-class');
    docsClass.element.className = 'docs';
    const documentationClass = createRealContainer('test-with-documentation-class');
    documentationClass.element.className = 'documentation';

    this.testContainers = [docs, documentation, docsClass, documentationClass];
    
    return {
      docs: docs.element,
      documentation: documentation.element,
      docsClass: docsClass.element,
      documentationClass: documentationClass.element
    };
  }

  /**
   * Test specific container selection
   */
  async testContainerSelection(selector: string): Promise<HTMLElement | null> {
    const { init } = await import('../../../src/zero-config');
    
    try {
      const viewer = await init({ container: selector });
      return viewer.container;
    } catch {
      return null;
    }
  }

  /**
   * Cleanup test containers
   */
  cleanup() {
    this.testContainers.forEach(container => container.cleanup());
    this.testContainers.length = 0;
  }
}

/**
 * Configuration file testing utilities
 */
export class ConfigFileTester {
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  /**
   * Mock config file response
   */
  mockConfigFile(filename: string, content: string | null, status: number = 200) {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes(filename)) {
        if (content === null) {
          return Promise.reject(new Error(`Failed to fetch ${filename}`));
        }
        
        return Promise.resolve({
          ok: status === 200,
          status,
          text: () => Promise.resolve(content),
          json: () => Promise.resolve(content ? JSON.parse(content) : null)
        } as Response);
      }
      
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  }

  /**
   * Test config loading with different scenarios
   */
  async testConfigLoading(configPath: string, configContent: string): Promise<{
    success: boolean;
    error?: Error;
    loadTime: number;
  }> {
    const startTime = performance.now();
    
    try {
      this.mockConfigFile(configPath, configContent);
      
      const { init } = await import('../../../src/zero-config');
      const container = createRealContainer('config-test');
      
      await init({ 
        container: container.element,
        configPath 
      });
      
      const endTime = performance.now();
      container.cleanup();
      
      return {
        success: true,
        loadTime: endTime - startTime
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        error: error as Error,
        loadTime: endTime - startTime
      };
    }
  }

  /**
   * Restore original fetch
   */
  restore() {
    global.fetch = this.originalFetch;
  }
}

/**
 * Theme testing utilities
 */
export class ThemeTester {
  /**
   * Test theme application and switching
   */
  async testThemeApplication(
    themeName: string,
    container: HTMLElement
  ): Promise<{
    applied: boolean;
    error?: Error;
  }> {
    try {
      const { init, setTheme } = await import('../../../src/zero-config');
      
      // Initialize with theme
      await init({ container, theme: themeName });
      
      // Test theme switching
      setTheme(themeName);
      
      return { applied: true };
    } catch (error) {
      return { applied: false, error: error as Error };
    }
  }

  /**
   * Validate available themes
   */
  async validateAvailableThemes(): Promise<{
    themes: string[];
    hasBasicThemes: boolean;
    themeCount: number;
  }> {
    const { getAvailableThemes } = await import('../../../src/zero-config');
    
    const themes = getAvailableThemes();
    const hasBasicThemes = themes.includes('github-light') && themes.includes('github-dark');
    
    return {
      themes,
      hasBasicThemes,
      themeCount: themes.length
    };
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceTester {
  private measurements: Array<{ name: string; duration: number; timestamp: number }> = [];

  /**
   * Measure initialization performance
   */
  async measureInitPerformance(
    options: ZeroConfigOptions = {},
    iterations: number = 1
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    measurements: number[];
  }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const container = createRealContainer(`perf-test-${i}`);
      const startTime = performance.now();
      
      try {
        const { init } = await import('../../../src/zero-config');
        const viewer = await init({ 
          container: container.element,
          ...options 
        });
        
        if (viewer && typeof viewer.destroy === 'function') {
          await viewer.destroy();
        }
      } catch {
        // Ignore errors for performance testing
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      this.measurements.push({
        name: `init-${i}`,
        duration,
        timestamp: Date.now()
      });
      
      container.cleanup();
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      measurements: times
    };
  }

  /**
   * Get all measurements
   */
  getMeasurements() {
    return [...this.measurements];
  }

  /**
   * Clear measurements
   */
  clearMeasurements() {
    this.measurements.length = 0;
  }
}

/**
 * Memory leak detection utilities
 */
export class MemoryLeakDetector {
  private initialMemory: number = 0;
  private measurements: Array<{ stage: string; memory: number; timestamp: number }> = [];

  /**
   * Take initial memory snapshot
   */
  takeInitialSnapshot() {
    this.initialMemory = this.getCurrentMemoryUsage();
    this.measurements.push({
      stage: 'initial',
      memory: this.initialMemory,
      timestamp: Date.now()
    });
  }

  /**
   * Take memory snapshot at specific stage
   */
  takeSnapshot(stage: string) {
    const memory = this.getCurrentMemoryUsage();
    this.measurements.push({
      stage,
      memory,
      timestamp: Date.now()
    });
  }

  /**
   * Detect potential memory leaks
   */
  detectLeaks(): {
    hasLeak: boolean;
    memoryGrowth: number;
    leakThreshold: number;
    measurements: typeof this.measurements;
  } {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryGrowth = currentMemory - this.initialMemory;
    const leakThreshold = 10 * 1024 * 1024; // 10MB threshold
    
    return {
      hasLeak: memoryGrowth > leakThreshold,
      memoryGrowth,
      leakThreshold,
      measurements: [...this.measurements]
    };
  }

  /**
   * Get current memory usage (if available)
   */
  private getCurrentMemoryUsage(): number {
    if ((performance as any).memory?.usedJSHeapSize) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Fallback for environments without memory API
    return 0;
  }

  /**
   * Clear measurements
   */
  clearMeasurements() {
    this.measurements.length = 0;
    this.initialMemory = 0;
  }
}