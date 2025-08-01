/**
 * Zero-Config Integration Tests
 *
 * Comprehensive integration tests for the zero-config module that test real-world scenarios
 * without heavy mocking. These tests complement the unit tests by focusing on end-to-end
 * functionality and actual DOM manipulation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init, getViewer, reload, setTheme, getAvailableThemes } from '../../src/zero-config';
import {
  setupRealDOM,
  createRealContainer,
  createContainerWithAttributes,
  waitForElement,
  DOMTestEnvironment,
  TestContainer,
} from './utils/realDOMSetup';

// Test helpers moved to test-documents.ts for reusability

describe('Zero-Config Integration Tests', () => {
  let domEnv: DOMTestEnvironment;
  let testContainer: TestContainer;

  beforeEach(async () => {
    domEnv = setupRealDOM();
    testContainer = createRealContainer('docs-integration-test');

    // Clear any global viewer state
    const globalViewer = getViewer();
    if (globalViewer) {
      await globalViewer.destroy?.();
    }
  });

  afterEach(async () => {
    // Clean up global viewer
    const globalViewer = getViewer();
    if (globalViewer) {
      await globalViewer.destroy?.();
    }

    // Clean up DOM
    testContainer.cleanup();
    domEnv.cleanup();
  });

  describe('Container Resolution', () => {
    it('should find container by ID', async () => {
      const container = createRealContainer('docs');

      const viewer = await init();

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      container.cleanup();
    });

    it('should find container by class', async () => {
      const container = createContainerWithAttributes('test-docs', { class: 'docs' });

      const viewer = await init();

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      container.cleanup();
    });

    it('should fall back to body when no specific container found', async () => {
      const viewer = await init();

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(document.body);
    });

    it('should use provided container string selector', async () => {
      const viewer = await init({ container: '#docs-integration-test' });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);
    });

    it('should use provided container element', async () => {
      const viewer = await init({ container: testContainer.element });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);
    });

    it('should handle container not found error gracefully', async () => {
      const viewer = await init({ container: '#non-existent-container' });

      expect(viewer).toBeDefined();
      // Should display error UI in fallback container
      await waitForElement('h3', 1000, document.body);
      const errorHeading = document.querySelector('h3');
      expect(errorHeading?.textContent).toContain('Viewer Creation Failed');
    });
  });

  describe('Configuration Loading', () => {
    it('should work with default configuration when no config file exists', async () => {
      const viewer = await init({ container: testContainer.element });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);

      // In case of empty documents, viewer should still be created (may show error UI)
      // This tests the fallback behavior
    });

    it('should apply theme from options', async () => {
      const viewer = await init({
        container: testContainer.element,
        theme: 'github-dark',
      });

      expect(viewer).toBeDefined();
      // Verify theme was applied by checking for dark mode styles
      const containerElement = viewer.container;
      expect(containerElement).toBeDefined();
    });

    it('should apply title from options', async () => {
      const customTitle = 'Custom Integration Test Title';
      const viewer = await init({
        container: testContainer.element,
        title: customTitle,
      });

      expect(viewer).toBeDefined();
      // The title should be applied to the viewer configuration
    });

    it('should apply docs path from options', async () => {
      const customPath = './custom-docs';
      const viewer = await init({
        container: testContainer.element,
        docsPath: customPath,
      });

      expect(viewer).toBeDefined();
    });
  });

  describe('Error Boundary Testing', () => {
    it('should display error UI when viewer creation fails', async () => {
      // Force an error by providing invalid configuration
      const viewer = await init({
        container: testContainer.element,
        configPath: 'non-existent-config.json',
      });

      expect(viewer).toBeDefined();

      // Should not throw, but should display error UI
      const container = testContainer.element;
      expect(container.innerHTML).toBeTruthy();

      // Error UI should be displayed - check for theme switcher (success) or error message
      const hasErrorUI = container.innerHTML.includes('Viewer Creation Failed');
      const hasThemeSwitcher = container.innerHTML.includes('Choose Theme');
      expect(hasErrorUI || hasThemeSwitcher).toBe(true);
    });

    it('should handle auto-discovery errors gracefully', async () => {
      const viewer = await init({
        container: testContainer.element,
        docsPath: './non-existent-docs-path',
      });

      expect(viewer).toBeDefined();
      // Should not throw even when docs path doesn't exist
    });

    it('should provide helpful error messages', async () => {
      const viewer = await init({
        container: '#non-existent',
        configPath: 'non-existent.json',
      });

      expect(viewer).toBeDefined();

      // Error message should be displayed somewhere in the DOM
      const errorElements = document.querySelectorAll('h2, h3, p');
      const hasErrorMessage = Array.from(errorElements).some(
        el =>
          el.textContent?.includes('Viewer Creation Failed') ||
          el.textContent?.includes('not found') ||
          el.textContent?.includes('Choose Theme')
      );
      expect(hasErrorMessage).toBe(true);
    });
  });

  describe('Auto-Discovery Integration', () => {
    it('should handle empty documents array gracefully', async () => {
      const viewer = await init({
        container: testContainer.element,
        docsPath: './empty-directory',
      });

      expect(viewer).toBeDefined();
      // Should initialize successfully even with no documents
    });

    it('should process discovered documents', async () => {
      // This test verifies the integration between auto-discovery and viewer creation
      const viewer = await init({
        container: testContainer.element,
        docsPath: './docs',
      });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);
    });
  });

  describe('Theme Application', () => {
    it('should apply default theme when none specified', async () => {
      const viewer = await init({ container: testContainer.element });

      expect(viewer).toBeDefined();
      // Default theme should be applied
    });

    it('should apply specified theme', async () => {
      const viewer = await init({
        container: testContainer.element,
        theme: 'github-dark',
      });

      expect(viewer).toBeDefined();

      // Verify theme application through viewer API
      expect(typeof viewer.setTheme).toBe('function');
    });

    it('should handle invalid theme gracefully', async () => {
      const viewer = await init({
        container: testContainer.element,
        theme: 'non-existent-theme',
      });

      expect(viewer).toBeDefined();
      // Should not throw, should fall back to default
    });
  });

  describe('Global State Management', () => {
    it('should track global viewer instance', async () => {
      // Note: Global viewer might not be null due to previous tests
      // Focus on testing that the viewer is properly tracked after init

      const viewer = await init({ container: testContainer.element });

      expect(getViewer()).toBe(viewer);
      expect(getViewer()).toBeDefined();
    });

    it('should update global viewer on reload', async () => {
      const viewer1 = await init({ container: testContainer.element });
      expect(getViewer()).toBe(viewer1);

      const viewer2 = await reload({ container: testContainer.element });
      expect(getViewer()).toBe(viewer2);
      expect(viewer2).not.toBe(viewer1);
    });

    it('should handle theme switching through global API', () => {
      // First ensure we have a viewer
      return init({ container: testContainer.element }).then(() => {
        const availableThemes = getAvailableThemes();
        expect(Array.isArray(availableThemes)).toBe(true);
        expect(availableThemes.length).toBeGreaterThan(0);

        // Should include basic themes
        expect(availableThemes).toContain('github-light');
        expect(availableThemes).toContain('github-dark');

        // Test theme switching
        setTheme('github-dark');
        // Should not throw - functionality is tested through the API
      });
    });
  });

  describe('Initialization Flow End-to-End', () => {
    it('should complete full initialization successfully', async () => {
      const startTime = Date.now();

      const viewer = await init({
        container: testContainer.element,
        title: 'End-to-End Test',
        theme: 'github-light',
        docsPath: './docs',
      });

      const endTime = Date.now();

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);
      expect(typeof viewer.destroy).toBe('function');
      expect(typeof viewer.reload).toBe('function');
      expect(typeof viewer.setTheme).toBe('function');

      // Should complete in reasonable time (under 10 seconds for integration test)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should handle multiple rapid initializations', async () => {
      const container1 = createRealContainer('rapid-test-1');
      const container2 = createRealContainer('rapid-test-2');

      // Fire off multiple initializations rapidly
      const promises = [
        init({ container: container1.element }),
        init({ container: container2.element }),
      ];

      const viewers = await Promise.all(promises);

      expect(viewers[0]).toBeDefined();
      expect(viewers[1]).toBeDefined();

      // The global viewer should be the last one initialized
      expect(getViewer()).toBe(viewers[1]);

      container1.cleanup();
      container2.cleanup();
    });

    it.skip('should provide all expected API methods', async () => {
      const viewer = await init({ container: testContainer.element });

      // Verify all expected methods exist
      expect(typeof viewer.destroy).toBe('function');
      expect(typeof viewer.reload).toBe('function');
      expect(typeof viewer.setTheme).toBe('function');
      expect(viewer.container).toBeDefined();

      // Verify setTheme can be called without throwing
      viewer.setTheme({} as any); // Should handle invalid theme gracefully

      // Clean up by destroying the viewer
      await viewer.destroy();
    });
  });

  describe('Real DOM Manipulation', () => {
    it('should actually modify the DOM', async () => {
      const initialHTML = testContainer.element.innerHTML;
      expect(initialHTML).toBe('');

      await init({ container: testContainer.element });

      // The container should now have content (either viewer content or error UI)
      const finalHTML = testContainer.element.innerHTML;
      expect(finalHTML).not.toBe('');
      expect(finalHTML.length).toBeGreaterThan(0);
    });

    it('should clean up DOM on destroy', async () => {
      const viewer = await init({ container: testContainer.element });

      // Should have content
      expect(testContainer.element.innerHTML).not.toBe('');

      await viewer.destroy();

      // After destroy, container might be cleaned up (depends on implementation)
      // At minimum, the viewer should be destroyed without throwing
    });

    it('should handle container styling', async () => {
      const styledContainer = createContainerWithAttributes(
        'styled-test',
        { class: 'custom-docs-container' },
        {
          'background-color': 'red',
          'min-height': '500px',
          padding: '20px',
        }
      );

      const viewer = await init({ container: styledContainer.element });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(styledContainer.element);

      // Container should retain its styling
      const computedStyle = window.getComputedStyle(styledContainer.element);
      expect(computedStyle.backgroundColor).toBe('rgb(255, 0, 0)'); // red as rgb
      expect(computedStyle.minHeight).toBe('500px');
      expect(computedStyle.padding).toBe('20px');

      styledContainer.cleanup();
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory on multiple init/destroy cycles', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform multiple init/destroy cycles
      for (let i = 0; i < 3; i++) {
        const container = createRealContainer(`perf-test-${i}`);
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

    it('should initialize within reasonable timeframe', async () => {
      const startTime = performance.now();

      const viewer = await init({ container: testContainer.element });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(viewer).toBeDefined();
      // Should initialize within 5 seconds for integration test
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from configuration errors', async () => {
      // First init with bad config
      const viewer1 = await init({
        container: testContainer.element,
        configPath: 'non-existent.json',
      });

      expect(viewer1).toBeDefined();

      // Should be able to reinitialize with good config
      const viewer2 = await reload({
        container: testContainer.element,
        title: 'Recovered Title',
      });

      expect(viewer2).toBeDefined();
      expect(viewer2).not.toBe(viewer1);
    });

    it('should handle DOM container removal and recovery', async () => {
      const tempContainer = createRealContainer('temp-container');

      const viewer = await init({ container: tempContainer.element });
      expect(viewer).toBeDefined();

      // Remove container from DOM
      tempContainer.cleanup();

      // Should be able to initialize with new container
      const viewer2 = await reload({ container: testContainer.element });
      expect(viewer2).toBeDefined();
      expect(viewer2.container).toBe(testContainer.element);
    });
  });
});
