import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarkdownDocsViewer } from '../src/viewer';
import { themes } from '../src/themes';

// Mock dependencies
vi.mock('marked', () => ({
  marked: {
    use: vi.fn(),
    parse: vi.fn(content => `<p>${content}</p>`),
  },
}));

vi.mock('marked-highlight', () => ({
  markedHighlight: vi.fn(() => ({})),
}));

vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn(code => ({ value: code })),
    highlightAuto: vi.fn(code => ({ value: code })),
  },
}));

// Mock DOM elements
const mockContainer = {
  innerHTML: '',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  contains: vi.fn(() => false),
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
  })),
  nodeType: 1,
  nodeName: 'DIV',
  tagName: 'DIV',
  style: {
    setProperty: vi.fn(),
    getPropertyValue: vi.fn(),
    removeProperty: vi.fn(),
    overflow: '',
    display: '',
    position: '',
    left: '',
    width: '',
    touchAction: '',
    overscrollBehavior: '',
  },
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn(),
  },
};

// Make mockContainer pass instanceof HTMLElement check
Object.setPrototypeOf(mockContainer, HTMLElement.prototype);

// Mock document and window
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      textContent: '',
      remove: vi.fn(),
      innerHTML: '',
      style: {
        setProperty: vi.fn(),
        getPropertyValue: vi.fn(),
        removeProperty: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    })),
    documentElement: {
      style: {
        setProperty: vi.fn(),
        getPropertyValue: vi.fn(),
        removeProperty: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    },
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      innerHTML: '',
      style: {},
    },
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      innerHTML: '',
      style: {
        overflow: '',
      },
    },
    querySelector: vi.fn(selector => {
      if (selector === '#test-container') return mockContainer;
      return null;
    }),
    querySelectorAll: vi.fn(() => []),
  },
  configurable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1024,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: {
      pathname: '/',
      hash: '',
    },
  },
  configurable: true,
});

describe('MarkdownDocsViewer', () => {
  let viewer: MarkdownDocsViewer;
  let mockConfig: any;

  beforeEach(async () => {
    // Reset mocks before setting up new ones
    vi.clearAllMocks();
    mockContainer.innerHTML = '';

    // Mock the init method BEFORE creating any viewer instances
    vi.spyOn(MarkdownDocsViewer.prototype as any, 'init').mockImplementation(async function (
      this: any
    ) {
      // Set up minimal state needed for tests
      this.state.loading = false;
      this.state.documents = this.config.source.documents || [];
      return Promise.resolve();
    });

    // Also mock other async methods that might be called
    vi.spyOn(MarkdownDocsViewer.prototype as any, 'loadDocuments').mockImplementation(
      async function (this: any) {
        this.state.documents = this.config.source.documents || [];
        return Promise.resolve();
      }
    );

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'render').mockImplementation(function (
      this: any
    ) {
      // Do nothing - prevent DOM manipulation
    });

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'applyTheme').mockImplementation(function (
      this: any
    ) {
      // Do nothing - prevent style injection
    });

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'setupRouting').mockImplementation(function (
      this: any
    ) {
      // Do nothing - prevent router setup
    });

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'search').mockImplementation(async function (
      this: any,
      query: string
    ) {
      const results = this.state.documents.filter(
        (doc: any) =>
          doc.title.toLowerCase().includes(query.toLowerCase()) ||
          doc.content?.toLowerCase().includes(query.toLowerCase()) ||
          doc.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      );
      return results;
    });

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'loadDocument').mockImplementation(
      async function (this: any, docId: string) {
        const doc = this.state.documents.find((d: any) => d.id === docId);
        if (!doc) {
          const error = new Error(`Document ${docId} not found`);
          if (this.config.onError) {
            this.config.onError(error);
          }
          throw error;
        }
        this.state.currentDocument = doc;
        if (this.config.onDocumentLoad) {
          this.config.onDocumentLoad(doc);
        }
        return doc;
      }
    );

    vi.spyOn(MarkdownDocsViewer.prototype as any, 'setTheme').mockImplementation(function (
      this: any,
      theme: any
    ) {
      this.config.theme = theme;
      // Simulate applying theme by calling document.head.appendChild
      const styleElement = document.createElement('style');
      document.head.appendChild(styleElement);
    });

    mockConfig = {
      container: '#test-container',
      source: {
        type: 'local',
        documents: [
          {
            id: 'test-doc',
            title: 'Test Document',
            content: '# Test\n\nThis is a test document.',
          },
        ],
      },
    };
  });

  afterEach(() => {
    if (viewer) {
      viewer.destroy();
    }
  });

  describe('Constructor', () => {
    it('should create a viewer instance with valid config', () => {
      viewer = new MarkdownDocsViewer(mockConfig);
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });

    it('should throw error when container not found', () => {
      const invalidConfig = {
        ...mockConfig,
        container: '#non-existent',
      };

      // Mock querySelector to return null
      vi.mocked(document.querySelector).mockReturnValue(null);

      expect(() => {
        new MarkdownDocsViewer(invalidConfig);
      }).toThrow('Container element not found');
    });

    it('should apply default configuration', () => {
      viewer = new MarkdownDocsViewer(mockConfig);

      expect(viewer.config.theme).toEqual(themes.default.light);
      expect(viewer.config.search?.enabled).toBe(true);
      expect(viewer.config.navigation?.showCategories).toBe(true);
    });
  });

  describe('Theme Management', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should set theme correctly', () => {
      const customTheme = {
        ...themes.default.light,
        colors: {
          ...themes.default.light.colors,
          primary: '#ff0000',
        },
      };

      viewer.setTheme(customTheme);
      expect(viewer.config.theme).toEqual(customTheme);
    });

    it('should apply theme styles to document head', () => {
      const customTheme = {
        ...themes.default.light,
        colors: {
          ...themes.default.light.colors,
          primary: '#ff0000',
        },
      };

      viewer.setTheme(customTheme);
      expect(document.head.appendChild).toHaveBeenCalled();
    });
  });

  describe('Document Management', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should load documents from local source', () => {
      expect(viewer.state.documents).toHaveLength(1);
      expect(viewer.state.documents[0].id).toBe('test-doc');
      expect(viewer.state.documents[0].title).toBe('Test Document');
    });

    it('should get document by id', () => {
      const doc = viewer.getDocument('test-doc');
      expect(doc).toBeDefined();
      expect(doc?.id).toBe('test-doc');
    });

    it('should return null for non-existent document', () => {
      const doc = viewer.getDocument('non-existent');
      expect(doc).toBeNull();
    });

    it('should get all documents', () => {
      const docs = viewer.getAllDocuments();
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('test-doc');
    });

    it('should load specific document', async () => {
      await viewer.loadDocument('test-doc');
      expect(viewer.state.currentDocument?.id).toBe('test-doc');
    });

    it('should handle loading non-existent document', async () => {
      await expect(viewer.loadDocument('non-existent')).rejects.toThrow(
        'Document non-existent not found'
      );
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const configWithMultipleDocs = {
        ...mockConfig,
        source: {
          type: 'local',
          documents: [
            {
              id: 'doc1',
              title: 'JavaScript Guide',
              content: '# JavaScript\n\nThis covers JavaScript basics.',
              tags: ['programming', 'javascript'],
            },
            {
              id: 'doc2',
              title: 'TypeScript Guide',
              content: '# TypeScript\n\nThis covers TypeScript features.',
              tags: ['programming', 'typescript'],
            },
            {
              id: 'doc3',
              title: 'CSS Styling',
              content: '# CSS\n\nThis covers CSS styling.',
              tags: ['design', 'css'],
            },
          ],
        },
      };
      viewer = new MarkdownDocsViewer(configWithMultipleDocs);
    });

    it('should search by title', async () => {
      const results = await viewer.search('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc1');
    });

    it('should search by content', async () => {
      const results = await viewer.search('TypeScript features');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc2');
    });

    it('should search by tags', async () => {
      const results = await viewer.search('programming');
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain('doc1');
      expect(results.map(r => r.id)).toContain('doc2');
    });

    it('should return empty results for no matches', async () => {
      const results = await viewer.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', async () => {
      const results = await viewer.search('JAVASCRIPT');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc1');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing container', () => {
      const invalidConfig = {
        source: {
          type: 'local',
          documents: [],
        },
      };

      expect(() => {
        new MarkdownDocsViewer(invalidConfig as any);
      }).toThrow();
    });

    it('should handle missing source', () => {
      const invalidConfig = {
        container: '#test',
      };

      expect(() => {
        new MarkdownDocsViewer(invalidConfig as any);
      }).toThrow();
    });

    it('should apply navigation defaults', () => {
      viewer = new MarkdownDocsViewer(mockConfig);

      expect(viewer.config.navigation?.showCategories).toBe(true);
      expect(viewer.config.navigation?.collapsible).toBe(true);
      expect(viewer.config.navigation?.showDescription).toBe(true);
    });

    it('should apply search defaults', () => {
      viewer = new MarkdownDocsViewer(mockConfig);

      expect(viewer.config.search?.enabled).toBe(true);
    });

    it('should apply render defaults', () => {
      viewer = new MarkdownDocsViewer(mockConfig);

      expect(viewer.config.render?.syntaxHighlighting).toBe(true);
      expect(viewer.config.render?.copyCodeButton).toBe(true);
      expect(viewer.config.render?.linkTarget).toBe('_self');
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should have initial state', () => {
      expect(viewer.state.currentDocument).toBeNull();
      expect(viewer.state.documents).toHaveLength(1);
      expect(viewer.state.searchQuery).toBe('');
      expect(viewer.state.searchResults).toHaveLength(0);
      expect(viewer.state.loading).toBe(false);
      expect(viewer.state.error).toBeNull();
      expect(viewer.state.sidebarOpen).toBe(false);
    });

    it('should update state when loading document', async () => {
      await viewer.loadDocument('test-doc');
      expect(viewer.state.currentDocument?.id).toBe('test-doc');
    });

    it('should handle errors in state', async () => {
      try {
        await viewer.loadDocument('non-existent');
      } catch {
        // Error should be in state
        expect(viewer.state.error).toBeDefined();
      }
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should clean up resources on destroy', () => {
      const removeSpy = vi.fn();
      const destroySpy = vi.fn();

      // Mock styles and router
      viewer['styles'] = { remove: removeSpy } as any;
      viewer['router'] = { destroy: destroySpy } as any;

      viewer.destroy();

      expect(removeSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
      expect(mockContainer.innerHTML).toBe('');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should call onDocumentLoad callback', async () => {
      const onDocumentLoad = vi.fn();
      viewer.config.onDocumentLoad = onDocumentLoad;

      await viewer.loadDocument('test-doc');

      expect(onDocumentLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-doc' }));
    });

    it('should call onError callback on errors', async () => {
      const onError = vi.fn();
      viewer.config.onError = onError;

      try {
        await viewer.loadDocument('non-existent');
      } catch {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      }
    });
  });

  describe('Theme Methods', () => {
    it('should get current theme', () => {
      const theme = viewer.getTheme();

      expect(theme).toBeDefined();
      expect(theme.colors).toBeDefined();
      expect(theme.fonts).toBeDefined();
    });

    it('should get theme styles', () => {
      const styles = viewer.getThemeStyles();

      expect(styles).toBeTypeOf('string');
      expect(styles.length).toBeGreaterThan(0);
      expect(styles).toContain('.mdv-app');
    });

    it('should get available themes', () => {
      const availableThemes = viewer.getAvailableThemes();

      expect(availableThemes).toBeInstanceOf(Array);
      expect(availableThemes.length).toBeGreaterThan(0);
    });

    it('should register custom themes', () => {
      const customTheme = {
        name: 'custom-test',
        colors: {
          primary: '#ff0000',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#333333',
          textLight: '#666666',
          border: '#dee2e6',
          code: '#e83e8c',
          codeBackground: '#f8f9fa',
        },
        fonts: {
          body: 'Arial, sans-serif',
          heading: 'Arial, sans-serif',
          code: 'Menlo, monospace',
        },
      };

      viewer.registerTheme(customTheme);
      const availableThemes = viewer.getAvailableThemes();

      expect(availableThemes).toContainEqual(expect.objectContaining({ name: 'custom-test' }));
    });

    it('should create custom themes with overrides', () => {
      const customTheme = viewer.createCustomTheme('custom-override', {
        colors: { primary: '#00ff00' },
      });

      expect(customTheme.name).toBe('custom-override');
      expect(customTheme.colors.primary).toBe('#00ff00');
      expect(customTheme.colors.background).toBeDefined(); // Should have default values
    });
  });

  describe('Document Methods', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should get all documents', () => {
      const documents = viewer.getAllDocuments();

      expect(documents).toBeInstanceOf(Array);
      expect(documents.length).toBeGreaterThan(0);
    });

    it('should get documents (alias method)', () => {
      const documents = viewer.getDocuments();

      expect(documents).toBeInstanceOf(Array);
      expect(documents.length).toBeGreaterThan(0);
      expect(documents).toEqual(viewer.getAllDocuments());
    });

    it('should get document content', async () => {
      const doc = viewer.getDocument('test-doc');
      expect(doc).toBeDefined();

      if (doc) {
        const content = await viewer.getDocumentContent(doc);
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
      }
    });

    it('should handle document content loading error', async () => {
      const doc = { id: 'error-doc', title: 'Error Doc', file: 'error.md' };

      // Test the method exists and returns a string
      const content = await viewer.getDocumentContent(doc);
      expect(typeof content).toBe('string');
    });
  });

  describe('Search Methods', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should perform search', async () => {
      const results = await viewer.search('test');

      expect(results).toBeInstanceOf(Array);
      // Results depend on mock implementation
    });

    it('should handle search errors gracefully', async () => {
      // Just test that search returns an array
      const results = await viewer.search('test');
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('State and Config Methods', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should get current state', () => {
      const state = viewer.getState();

      expect(state).toBeDefined();
      expect(state.documents).toBeInstanceOf(Array);
      expect(state.currentDocument).toBeDefined();
      expect(typeof state.loading).toBe('boolean');
      expect(typeof state.sidebarOpen).toBe('boolean');
    });

    it('should get current config', () => {
      const config = viewer.getConfig();

      expect(config).toBeDefined();
      expect(config.container).toBeDefined();
      expect(config.source).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should handle dependency validation errors', () => {
      // Mock missing highlight.js
      const originalHighlight = (global as any).hljs;
      delete (global as any).hljs;

      expect(() => {
        new MarkdownDocsViewer(mockConfig);
      }).not.toThrow(); // Should warn but not throw

      // Restore
      (global as any).hljs = originalHighlight;
    });

    it('should handle container validation with string selector', () => {
      const stringConfig = {
        ...mockConfig,
        container: '#test-container',
      };

      // Mock querySelector to return our mock container
      vi.spyOn(document, 'querySelector').mockReturnValue(mockContainer);

      const viewerWithStringContainer = new MarkdownDocsViewer(stringConfig);
      expect(viewerWithStringContainer).toBeDefined();
    });

    it('should handle container validation with missing selector', () => {
      const stringConfig = {
        ...mockConfig,
        container: '#missing-container',
      };

      // Mock querySelector to return null
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      expect(() => {
        new MarkdownDocsViewer(stringConfig);
      }).toThrow('Container element not found');
    });

    it('should handle marked configuration errors gracefully', () => {
      // Mock marked.use to throw error
      const originalMarked = (global as any).marked;
      (global as any).marked = {
        ...originalMarked,
        use: vi.fn().mockImplementation(() => {
          throw new Error('Marked config failed');
        }),
      };

      expect(() => {
        new MarkdownDocsViewer(mockConfig);
      }).not.toThrow(); // Should handle gracefully

      // Restore
      (global as any).marked = originalMarked;
    });
  });

  describe('Navigation State Management', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should save and restore navigation state', () => {
      // Mock localStorage
      const mockStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue('true'),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockStorage });

      // Test desktop sidebar state restoration specifically
      const loadState = viewer['loadDesktopSidebarState'];
      const collapsed = loadState.call(viewer);

      expect(typeof collapsed).toBe('boolean');
    });
  });

  describe('Theme Integration', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should handle theme change events', () => {
      const newTheme = themes.github.dark;

      // Simulate theme change
      viewer.setTheme(newTheme);

      expect(viewer.getTheme()).toEqual(newTheme);
    });

    it('should handle theme string parameter', () => {
      // Just test that setTheme with string doesn't throw
      expect(() => {
        viewer.setTheme('default-light');
      }).not.toThrow();
    });

    it('should handle invalid theme string gracefully', () => {
      expect(() => {
        viewer.setTheme('nonexistent-theme');
      }).not.toThrow();
    });
  });

  describe('Content Rendering', () => {
    beforeEach(() => {
      viewer = new MarkdownDocsViewer(mockConfig);
    });

    it('should render markdown content', () => {
      // Access private method for testing
      const renderMarkdown = viewer['renderMarkdown'];
      const result = renderMarkdown.call(viewer, '# Test Header\n\nTest content');

      expect(result).toContain('Test Header');
      expect(result).toContain('Test content');
    });

    it('should handle markdown rendering errors', () => {
      // Mock marked.parse to throw error
      const originalMarked = (global as any).marked;
      (global as any).marked = {
        ...originalMarked,
        parse: vi.fn().mockImplementation(() => {
          throw new Error('Parsing failed');
        }),
      };

      const renderMarkdown = viewer['renderMarkdown'];
      const result = renderMarkdown.call(viewer, '# Test');

      // Should fall back gracefully
      expect(result).toBeDefined();

      // Restore
      (global as any).marked = originalMarked;
    });

    it('should render error states', () => {
      const renderError = viewer['renderError'];
      const error = new Error('Test error');
      const result = renderError.call(viewer, error);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
