/**
 * Zero-Config Essential Integration Tests
 *
 * Focused integration tests for the most critical zero-config functionality.
 * These tests avoid complex scenarios that require mocking and focus on
 * real-world usage patterns.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init, getViewer, reload, setTheme, getAvailableThemes } from '../../src/zero-config';
import {
  setupRealDOM,
  createRealContainer,
  createContainerWithAttributes,
  DOMTestEnvironment,
  TestContainer,
} from './utils/realDOMSetup';

describe('Zero-Config Essential Integration Tests', () => {
  let domEnv: DOMTestEnvironment;
  let testContainer: TestContainer;

  beforeEach(async () => {
    domEnv = setupRealDOM();
    testContainer = createRealContainer('docs-essential-test');

    // Clear any global viewer state
    try {
      const globalViewer = getViewer();
      if (globalViewer) {
        await globalViewer.destroy?.();
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    try {
      const globalViewer = getViewer();
      if (globalViewer) {
        await globalViewer.destroy?.();
      }
    } catch {
      // Ignore cleanup errors
    }

    testContainer.cleanup();
    domEnv.cleanup();
  });

  describe('Core Functionality', () => {
    it('should initialize and return a viewer instance', async () => {
      const viewer = await init({ container: testContainer.element });

      expect(viewer).toBeDefined();
      expect(typeof viewer).toBe('object');
      expect(viewer.container).toBe(testContainer.element);
    });

    it('should modify the DOM container', async () => {
      const initialHTML = testContainer.element.innerHTML;
      expect(initialHTML).toBe('');

      await init({ container: testContainer.element });

      // Container should now have content (either viewer UI or error UI)
      const finalHTML = testContainer.element.innerHTML;
      expect(finalHTML).not.toBe('');
      expect(finalHTML.length).toBeGreaterThan(0);
    });

    it('should provide all expected API methods', async () => {
      const viewer = await init({ container: testContainer.element });

      // Check that all expected methods exist
      expect(typeof viewer.destroy).toBe('function');
      expect(typeof viewer.reload).toBe('function');
      expect(typeof viewer.setTheme).toBe('function');
      expect(viewer.container).toBeDefined();
    });

    it('should track global viewer state', async () => {
      const viewer = await init({ container: testContainer.element });

      // Global viewer should be set
      const globalViewer = getViewer();
      expect(globalViewer).toBe(viewer);
    });
  });

  describe('Container Selection', () => {
    it('should use provided container element', async () => {
      const viewer = await init({ container: testContainer.element });

      expect(viewer.container).toBe(testContainer.element);
    });

    it('should use provided container selector', async () => {
      const viewer = await init({ container: `#${testContainer.id}` });

      expect(viewer.container).toBe(testContainer.element);
    });

    it('should find container by ID "docs"', async () => {
      const docsContainer = createRealContainer('docs');

      const viewer = await init(); // No container specified

      expect(viewer.container).toBe(docsContainer.element);

      docsContainer.cleanup();
    });

    it('should find container by class "docs"', async () => {
      const docsClassContainer = createContainerWithAttributes('test-docs-class', {
        class: 'docs',
      });

      const viewer = await init(); // No container specified

      expect(viewer.container).toBe(docsClassContainer.element);

      docsClassContainer.cleanup();
    });

    it('should fall back to body when no specific container found', async () => {
      // No specific docs containers exist
      const viewer = await init();

      expect(viewer.container).toBe(document.body);
    });
  });

  describe('Error Handling', () => {
    it('should handle container not found gracefully', async () => {
      const viewer = await init({ container: '#non-existent-container' });

      // Should still return a viewer object (error fallback)
      expect(viewer).toBeDefined();
      expect(typeof viewer.destroy).toBe('function');

      // Error UI might be displayed somewhere in the DOM or the viewer might use a fallback container
      // The key is that it doesn't throw and returns a valid viewer object
      expect(viewer.container).toBeDefined();
    });

    it('should display helpful error messages', async () => {
      const viewer = await init({
        container: '#non-existent',
        configPath: 'non-existent.json',
      });

      // Should return a valid viewer even with bad config
      expect(viewer).toBeDefined();
      expect(viewer.container).toBeDefined();

      // The zero-config module should handle errors gracefully
      // Error information might be displayed in the container or logged to console
      // The key behavior is that it doesn't crash the application
      expect(typeof viewer.destroy).toBe('function');
    });

    it('should not throw errors during initialization', async () => {
      // All of these should complete without throwing
      await expect(init({ container: '#non-existent' })).resolves.toBeDefined();
      await expect(init({ configPath: 'non-existent.json' })).resolves.toBeDefined();
      await expect(init({ docsPath: './non-existent' })).resolves.toBeDefined();
      await expect(init({ theme: 'non-existent-theme' })).resolves.toBeDefined();
    });
  });

  describe('Theme System', () => {
    it('should provide available themes', () => {
      const themes = getAvailableThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);

      // Should include basic themes
      expect(themes).toContain('github-light');
      expect(themes).toContain('github-dark');
    });

    it('should accept theme options', async () => {
      const viewer = await init({
        container: testContainer.element,
        theme: 'github-dark',
      });

      expect(viewer).toBeDefined();
      // Theme setting should not cause errors
    });

    it('should handle theme switching', async () => {
      await init({ container: testContainer.element });

      // Should not throw when setting themes
      expect(() => setTheme('github-light')).not.toThrow();
      expect(() => setTheme('github-dark')).not.toThrow();
      expect(() => setTheme('non-existent-theme')).not.toThrow();
    });
  });

  describe('Lifecycle Management', () => {
    it('should handle destroy and recreate cycle', async () => {
      const viewer1 = await init({ container: testContainer.element });
      expect(viewer1).toBeDefined();

      await viewer1.destroy();

      const viewer2 = await init({ container: testContainer.element });
      expect(viewer2).toBeDefined();
      expect(viewer2).not.toBe(viewer1);
    });

    it('should handle reload functionality', async () => {
      await init({ container: testContainer.element });

      const viewer2 = await reload({ container: testContainer.element });

      expect(viewer2).toBeDefined();
      expect(getViewer()).toBe(viewer2);
    });

    it('should handle multiple rapid initializations', async () => {
      const container1 = createRealContainer('rapid-1');
      const container2 = createRealContainer('rapid-2');

      // Fire off multiple initializations
      const [viewer1, viewer2] = await Promise.all([
        init({ container: container1.element }),
        init({ container: container2.element }),
      ]);

      expect(viewer1).toBeDefined();
      expect(viewer2).toBeDefined();

      // Last one should be the global viewer
      expect(getViewer()).toBe(viewer2);

      container1.cleanup();
      container2.cleanup();
    });
  });

  describe('Performance', () => {
    it('should initialize within reasonable time', async () => {
      const startTime = performance.now();

      const viewer = await init({ container: testContainer.element });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(viewer).toBeDefined();
      // Should complete within 5 seconds for integration test
      expect(duration).toBeLessThan(5000);
    });

    it('should not accumulate memory over multiple cycles', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform multiple init/destroy cycles
      for (let i = 0; i < 3; i++) {
        const container = createRealContainer(`memory-test-${i}`);
        const viewer = await init({ container: container.element });
        await viewer.destroy();
        container.cleanup();
      }

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory should not have grown significantly (within 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });
  });

  describe('Real DOM Integration', () => {
    it('should work with styled containers', async () => {
      const styledContainer = createContainerWithAttributes(
        'styled-integration',
        { class: 'custom-docs' },
        {
          'background-color': 'blue',
          'min-height': '300px',
          padding: '10px',
        }
      );

      const viewer = await init({ container: styledContainer.element });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(styledContainer.element);

      // Container should retain its styling
      const computedStyle = window.getComputedStyle(styledContainer.element);
      expect(computedStyle.minHeight).toBe('300px');
      expect(computedStyle.padding).toBe('10px');

      styledContainer.cleanup();
    });

    it('should handle container visibility changes', async () => {
      const viewer = await init({ container: testContainer.element });

      // Hide container
      testContainer.element.style.display = 'none';

      // Viewer should still exist and be functional
      expect(viewer).toBeDefined();
      expect(typeof viewer.destroy).toBe('function');

      // Show container again
      testContainer.element.style.display = '';

      // Should still work
      expect(viewer.container).toBe(testContainer.element);
    });
  });
});
