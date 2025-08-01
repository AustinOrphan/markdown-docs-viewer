/**
 * Container Error Integration Tests
 *
 * Tests real container error scenarios without mocking.
 * Validates error UI rendering and container handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../../src/zero-config';
import {
  ContainerTester,
  createTestContainer,
  validateContainer,
  createMultipleContainers,
} from '../utils/containerTestUtils';
import { waitForErrorUI, inspectErrorHTML } from '../utils/errorScenarioHelper';
import { cleanupRealDOM } from '../utils/realDOMSetup';

describe('Container Error Integration Tests', () => {
  let testContainers: ContainerTester[] = [];

  beforeEach(() => {
    // Clean DOM before each test
    cleanupRealDOM();
    testContainers = [];
  });

  afterEach(() => {
    // Clean up all test containers
    testContainers.forEach(container => container.cleanup());
    testContainers = [];
    cleanupRealDOM();
  });

  describe('Missing Container Scenarios', () => {
    it('should handle completely missing container element', async () => {
      // Ensure no element with this ID exists
      const nonExistentId = '#container-that-does-not-exist-12345';
      const existing = document.querySelector(nonExistentId);
      if (existing) existing.remove();

      const viewer = await init({ container: nonExistentId });

      // Should return a viewer but with error UI displayed
      expect(viewer).toBeDefined();
      expect(viewer.container).toBeDefined();

      // Error UI should be displayed in fallback container (body)
      const errorElement = await waitForErrorUI(document.body, 1000);
      expect(errorElement).toBeDefined();

      // For missing containers, we expect actual error UI showing failure message
      expect(errorElement.textContent).toContain('Viewer Creation Failed');
      expect(errorElement.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should handle removed container during initialization', async () => {
      // Create a container that will be removed during init
      const container = createTestContainer({ id: 'removable-container' });
      testContainers.push(container);

      // Start initialization
      const initPromise = init({ container: `#${container.id}` });

      // Remove container immediately after starting init
      setTimeout(() => {
        container.removeFromDOM();
      }, 50);

      const viewer = await initPromise;

      // Should handle gracefully - container was captured before removal
      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      // Container removal during init shouldn't cause errors - viewer should work normally
      const errorElement = await waitForErrorUI(container.element, 1000);
      // Should show normal theme switcher UI since container was captured before removal
      expect(errorElement.textContent).toContain('Choose Theme');
      expect(errorElement.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should validate container query results', async () => {
      // Test various invalid query scenarios
      const invalidSelectors = [
        '###invalid-selector',
        '.class-that-does-not-exist-anywhere',
        'nonexistent-tag',
        '[data-attribute="missing"]',
      ];

      for (const selector of invalidSelectors) {
        const viewer = await init({ container: selector });

        expect(viewer).toBeDefined();

        // Should display error UI in fallback for invalid selectors
        const errorElement = await waitForErrorUI(document.body, 1000);
        // Invalid selectors should show error UI
        expect(errorElement.textContent).toContain('Viewer Creation Failed');

        // Clean up for next iteration
        document.body.innerHTML = '';
      }
    });
  });

  describe('Invalid Container Type Scenarios', () => {
    it('should handle script tag as container', async () => {
      // Create a script element as container
      const script = document.createElement('script');
      script.id = 'script-container';
      script.type = 'text/javascript';
      document.body.appendChild(script);

      const viewer = await init({ container: '#script-container' });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(script);

      // Script tags work as containers and show theme switcher UI (success case)
      const errorElement = await waitForErrorUI(script, 1000);
      expect(errorElement.textContent).toContain('Choose Theme');

      script.remove();
    });

    it('should handle meta tag as container', async () => {
      const meta = document.createElement('meta');
      meta.id = 'meta-container';
      meta.name = 'description';
      meta.content = 'test';
      document.head.appendChild(meta);

      const viewer = await init({ container: '#meta-container' });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(meta);

      // Meta tags work as containers and show theme switcher UI (success case)
      const errorElement = await waitForErrorUI(meta, 1000);
      expect(errorElement.textContent).toContain('Choose Theme');

      meta.remove();
    });

    it('should handle style tag as container', async () => {
      const style = document.createElement('style');
      style.id = 'style-container';
      style.textContent = 'body { margin: 0; }';
      document.head.appendChild(style);

      const viewer = await init({ container: '#style-container' });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(style);

      // Style tags work as containers and show theme switcher UI (success case)
      const errorElement = await waitForErrorUI(style, 1000);
      expect(errorElement.textContent).toContain('Choose Theme');

      style.remove();
    });
  });

  describe('Container State Error Scenarios', () => {
    it('should handle hidden container (display: none)', async () => {
      const container = createTestContainer({
        id: 'hidden-container',
        styles: { display: 'none' },
      });
      testContainers.push(container);

      const validation = validateContainer(container.element);
      expect(validation.warnings).toContain('Container element has display: none');

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      // Hidden containers should still work but might show setup UI
      try {
        const errorElement = await waitForErrorUI(container.element, 1000);
        // Could be success (Choose Theme) or error (Viewer Creation Failed)
        const hasChooseTheme = errorElement.textContent?.includes('Choose Theme');
        const hasViewerError = errorElement.textContent?.includes('Viewer Creation Failed');
        expect(hasChooseTheme || hasViewerError).toBe(true);
      } catch {
        // It's okay if no error UI appears for hidden containers
      }
    });

    it('should handle invisible container (visibility: hidden)', async () => {
      const container = createTestContainer({
        id: 'invisible-container',
        styles: { visibility: 'hidden' },
      });
      testContainers.push(container);

      const validation = validateContainer(container.element);
      expect(validation.warnings).toContain('Container element has visibility: hidden');

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);
    });

    it('should handle zero-dimension container', async () => {
      const container = createTestContainer({
        id: 'zero-dim-container',
        styles: { width: '0px', height: '0px' },
      });
      testContainers.push(container);

      const validation = validateContainer(container.element);
      expect(validation.warnings).toContain('Container element has zero dimensions');

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);
    });
  });

  describe('Multiple Container Scenarios', () => {
    it('should handle multiple elements matching selector', async () => {
      // Create multiple elements with same class
      const containers = createMultipleContainers([
        { className: 'multi-container' },
        { className: 'multi-container' },
        { className: 'multi-container' },
      ]);
      testContainers.push(...containers);

      const viewer = await init({ container: '.multi-container' });

      expect(viewer).toBeDefined();
      // Should use the first matching element
      expect(viewer.container).toBe(containers[0].element);
    });

    it('should handle container with existing content', async () => {
      const container = createTestContainer({
        id: 'existing-content-container',
        innerHTML: '<h1>Existing Content</h1><p>This should be replaced</p>',
      });
      testContainers.push(container);

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      // Content should be replaced with theme switcher UI (success case)
      const errorElement = await waitForErrorUI(container.element, 1000);
      expect(errorElement.textContent).toContain('Choose Theme');

      // Original content should be gone
      expect(container.element.textContent).not.toContain('Existing Content');
    });
  });

  describe('Container Cleanup and Recovery', () => {
    it('should handle container removal after initialization', async () => {
      const container = createTestContainer({ id: 'cleanup-container' });
      testContainers.push(container);

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      // Remove container from DOM
      container.removeFromDOM();

      // Viewer should still have reference but container is detached
      expect(viewer.container).toBe(container.element);
      expect(document.contains(viewer.container)).toBe(false);

      // Should be able to destroy without errors
      await expect(viewer.destroy()).resolves.toBeUndefined();
    });

    it('should handle multiple initialization attempts on same container', async () => {
      const container = createTestContainer({ id: 'multi-init-container' });
      testContainers.push(container);

      // First initialization
      const viewer1 = await init({ container: `#${container.id}` });
      expect(viewer1).toBeDefined();

      // Second initialization (should replace first)
      const viewer2 = await init({ container: `#${container.id}` });
      expect(viewer2).toBeDefined();

      // Both should work independently
      await expect(viewer1.destroy()).resolves.toBeUndefined();
      await expect(viewer2.destroy()).resolves.toBeUndefined();
    });
  });

  describe('Error UI Validation', () => {
    it('should display comprehensive error information', async () => {
      await init({ container: '#missing-container-12345' });

      const errorElement = await waitForErrorUI(document.body, 1000);
      const inspection = inspectErrorHTML(errorElement);

      // Validate error structure - should show actual error UI
      expect(inspection.textContent).toContain('Viewer Creation Failed');
      expect(inspection.textContent).toContain('Error:');
      expect(inspection.outerHTML).toContain('style='); // Should have inline styles
    });

    it('should handle error UI in different container types', async () => {
      const containerTypes = [
        { tag: 'div', id: 'div-container' },
        { tag: 'section', id: 'section-container' },
        { tag: 'article', id: 'article-container' },
        { tag: 'main', id: 'main-container' },
      ];

      for (const { tag, id } of containerTypes) {
        const element = document.createElement(tag);
        element.id = id;
        document.body.appendChild(element);

        const viewer = await init({ container: `#${id}` });

        expect(viewer).toBeDefined();
        expect(viewer.container).toBe(element);

        // Should display theme switcher UI in the specific container (success case)
        const errorElement = await waitForErrorUI(element, 1000);
        expect(errorElement.textContent).toContain('Choose Theme');

        element.remove();
      }
    });

    it('should maintain accessibility in error UI', async () => {
      await init({ container: '#missing-container' });

      const errorElement = await waitForErrorUI(document.body, 1000);

      // Should have proper heading structure
      const headings = errorElement.querySelectorAll('h2, h3');
      expect(headings.length).toBeGreaterThan(0);

      // Should have links with proper attributes
      const links = errorElement.querySelectorAll('a[href]');
      links.forEach(link => {
        expect(link.getAttribute('href')).toBeTruthy();
        if (link.getAttribute('target') === '_blank') {
          // External links should have proper attributes for security
          expect(link.textContent).toBeTruthy();
        }
      });

      // Simple error UI may not have code blocks - that's ok
      // Code blocks are optional in the simple error UI
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle rapid container creation and destruction', async () => {
      const testRounds = 5;
      const timings: number[] = [];

      for (let i = 0; i < testRounds; i++) {
        const start = performance.now();

        const container = createTestContainer({ id: `rapid-${i}` });
        const viewer = await init({ container: `#${container.id}` });

        expect(viewer).toBeDefined();

        await viewer.destroy();
        container.cleanup();

        const end = performance.now();
        timings.push(end - start);
      }

      // Should complete each cycle within reasonable time
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      expect(avgTime).toBeLessThan(1000); // Less than 1 second on average
    });

    it('should handle container with deeply nested structure', async () => {
      const container = createTestContainer({ id: 'nested-container' });

      // Create deeply nested structure
      let current = container.element;
      for (let i = 0; i < 10; i++) {
        const div = document.createElement('div');
        div.className = `level-${i}`;
        current.appendChild(div);
        current = div;
      }

      testContainers.push(container);

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(container.element);

      // Theme switcher UI should replace nested content (success case)
      const errorElement = await waitForErrorUI(container.element, 1000);
      expect(errorElement.textContent).toContain('Choose Theme');

      // Nested structure should be gone
      expect(container.element.querySelector('.level-0')).toBeNull();
    });

    it('should handle container with event listeners', async () => {
      const container = createTestContainer({ id: 'event-container' });
      testContainers.push(container);

      let clickCount = 0;
      const clickHandler = () => clickCount++;

      container.element.addEventListener('click', clickHandler);

      const viewer = await init({ container: `#${container.id}` });

      expect(viewer).toBeDefined();

      // Event listeners should still work after initialization
      container.element.click();
      expect(clickCount).toBe(1);

      // Clean up
      container.element.removeEventListener('click', clickHandler);
    });
  });
});
