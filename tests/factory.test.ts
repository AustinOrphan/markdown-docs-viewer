import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createViewer, quickStart } from '../src/factory';
import { MarkdownDocsViewer } from '../src/viewer';
import type { DocumentationConfig } from '../src/types';

// Mock the viewer
vi.mock('../src/viewer');

describe('Factory Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createViewer', () => {
    it('should create a new MarkdownDocsViewer instance with config', () => {
      const config: DocumentationConfig = {
        container: '#test',
        source: {
          type: 'content',
          documents: [{ id: 'doc1', title: 'Test Document', content: '# Test' }],
        },
      };

      const viewer = createViewer(config);

      expect(MarkdownDocsViewer).toHaveBeenCalledWith(config);
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });

    it('should pass through all configuration options', () => {
      const config: DocumentationConfig = {
        container: '#test',
        title: 'My Docs',
        logo: '/logo.png',
        footer: 'Footer text',
        source: {
          type: 'local',
          basePath: '/docs',
          documents: [],
        },
        search: {
          enabled: true,
          placeholder: 'Search...',
        },
        navigation: {
          showCategories: true,
          collapsible: true,
        },
        render: {
          syntaxHighlighting: true,
          copyCodeButton: true,
        },
        routing: 'hash',
        onDocumentLoad: vi.fn(),
        onError: vi.fn(),
      };

      createViewer(config);

      expect(MarkdownDocsViewer).toHaveBeenCalledWith(config);
    });
  });

  describe('quickStart', () => {
    it('should create viewer with minimal configuration using string container', () => {
      const documents = [
        { id: 'doc1', title: 'Document 1', content: '# Doc 1' },
        { id: 'doc2', title: 'Document 2', content: '# Doc 2' },
      ];

      const viewer = quickStart('#app', documents);

      expect(MarkdownDocsViewer).toHaveBeenCalledWith({
        container: '#app',
        source: {
          type: 'content',
          documents,
        },
      });
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });

    it('should create viewer with minimal configuration using HTMLElement container', () => {
      const containerElement = document.createElement('div');
      const documents = [{ id: 'doc1', title: 'Document 1', content: '# Doc 1' }];

      const viewer = quickStart(containerElement, documents);

      expect(MarkdownDocsViewer).toHaveBeenCalledWith({
        container: containerElement,
        source: {
          type: 'content',
          documents,
        },
      });
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });

    it('should handle empty documents array', () => {
      const viewer = quickStart('#app', []);

      expect(MarkdownDocsViewer).toHaveBeenCalledWith({
        container: '#app',
        source: {
          type: 'content',
          documents: [],
        },
      });
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });
  });
});
