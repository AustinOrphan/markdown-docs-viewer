import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarkdownDocsViewer } from '../src/viewer';
import { escapeHtml } from '../src/utils';
import type { DocumentationConfig } from '../src/types';

describe('XSS Prevention', () => {
  let container: HTMLDivElement;
  let config: DocumentationConfig;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create a base config
    config = {
      container: '#test-container',
      source: {
        type: 'content',
        documents: [
          {
            id: 'test-doc',
            title: 'Test Document',
            content: '# Test Content',
          },
        ],
      },
    };
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe('Error Message XSS Prevention', () => {
    it('should escape script tags in error messages', async () => {
      // Create an error with XSS attempt
      const xssError = new Error('<script>alert("XSS")</script>');

      // Mock the document loader to throw the error
      const viewer = new MarkdownDocsViewer(config);

      // Override the loader to throw our XSS error
      vi.spyOn(viewer['loader'], 'loadDocument').mockRejectedValue(xssError);

      // Try to navigate to trigger the error
      await viewer.navigateTo('test-doc');

      // Wait for error to be displayed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that the error message is escaped in the DOM
      const errorContainer = container.querySelector('.mdv-error-message');
      expect(errorContainer).toBeTruthy();

      // The error message should be escaped, not executed
      const html = container.innerHTML;
      expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<script>alert("XSS")</script>');

      // Verify no actual script tags were created
      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    it('should escape error stack traces with HTML content', async () => {
      // Create an error with stack trace containing HTML
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at <img src=x onerror=alert("XSS")>';

      const viewer = new MarkdownDocsViewer(config);
      vi.spyOn(viewer['loader'], 'loadDocument').mockRejectedValue(error);

      await viewer.navigateTo('test-doc');
      await new Promise(resolve => setTimeout(resolve, 100));

      const html = container.innerHTML;
      expect(html).toContain('&lt;img src=x onerror=alert(&quot;XSS&quot;)&gt;');
      expect(html).not.toContain('<img src=x onerror=alert("XSS")>');

      // Verify no img tags were created
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(0);
    });

    it('should handle complex XSS payloads in error messages', async () => {
      // Test various XSS payloads
      const xssPayloads = [
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<body onload=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
        '<keygen onfocus=alert("XSS") autofocus>',
        '<video><source onerror="alert(\'XSS\')">',
      ];

      for (const payload of xssPayloads) {
        const viewer = new MarkdownDocsViewer(config);
        const error = new Error(payload);

        vi.spyOn(viewer['loader'], 'loadDocument').mockRejectedValue(error);

        await viewer.navigateTo('test-doc');
        await new Promise(resolve => setTimeout(resolve, 50));

        const html = container.innerHTML;

        // Verify the payload is escaped
        expect(html).toContain(escapeHtml(payload));
        expect(html).not.toContain(payload);

        // Clear container for next test
        container.innerHTML = '';
      }
    });
  });

  describe('Utility Function Tests', () => {
    it('should properly escape all HTML entities', () => {
      const testCases = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '&', expected: '&amp;' },
        { input: '"', expected: '&quot;' },
        { input: "'", expected: '&#039;' },
        {
          input: '<script>alert("XSS")</script>',
          expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
        },
      ];

      for (const { input, expected } of testCases) {
        expect(escapeHtml(input)).toBe(expected);
      }
    });

    it('should handle null and undefined gracefully', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(escapeHtml(123 as any)).toBe('123');
      expect(escapeHtml({} as any)).toBe('[object Object]');
      expect(escapeHtml([] as any)).toBe('');
    });
  });

  describe('Integration with Error Display', () => {
    it('should prevent XSS in configuration validation errors', () => {
      // Try to create viewer with invalid config containing XSS
      const xssConfig = {
        container: '<script>alert("XSS")</script>',
        source: {
          type: 'content' as const,
          documents: [
            {
              id: 'test',
              title: 'Test',
              content: 'Test',
            },
          ],
        },
      };

      // This should throw a validation error
      expect(() => new MarkdownDocsViewer(xssConfig)).toThrow();

      // The error should not execute any scripts
      const scripts = document.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    it('should safely display error messages in error boundaries', async () => {
      const viewer = new MarkdownDocsViewer(config);

      // Mock a rendering error with XSS attempt
      const renderError = new Error('<img src=x onerror=alert("XSS")>');
      vi.spyOn(viewer as any, 'renderContent').mockImplementation(() => {
        throw renderError;
      });

      await viewer.navigateTo('test-doc');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that error is displayed safely
      const errorElement = container.querySelector('.mdv-error-message');
      expect(errorElement).toBeTruthy();

      // No actual img tags should be created
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(0);
    });
  });
});
