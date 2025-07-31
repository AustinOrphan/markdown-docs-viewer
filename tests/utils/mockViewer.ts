/**
 * Mock utilities for MarkdownDocsViewer class
 * Provides targeted mocking without global vi.mock() to prevent circular dependencies
 */

import { vi } from 'vitest';
import type { MarkdownDocsViewer } from '../../src/viewer';
import type { DocumentationConfig, Document, ViewerState, Theme } from '../../src/types';
import { themes } from '../../src/themes';

/**
 * Default viewer state for testing
 */
export const DEFAULT_VIEWER_STATE: ViewerState = {
  currentDocument: null,
  documents: [],
  searchQuery: '',
  searchResults: [],
  loading: false,
  error: null,
  sidebarOpen: false,
  desktopSidebarCollapsed: false,
};

/**
 * Default test theme
 */
export const DEFAULT_TEST_THEME = themes.default.light;

/**
 * Creates a complete mock viewer instance that satisfies the MarkdownDocsViewer interface
 */
export function createMockViewer(overrides: Partial<MarkdownDocsViewer> = {}): MarkdownDocsViewer {
  const mockContainer = document.createElement('div');
  mockContainer.id = 'test-container';

  const defaultMock = {
    // Core lifecycle methods (matching actual interface)
    destroy: vi.fn().mockReturnValue(undefined), // destroy() returns void, not Promise<void>
    refresh: vi.fn().mockResolvedValue(undefined), // refresh() is async
    
    // Theme methods
    setTheme: vi.fn(),
    getTheme: vi.fn().mockReturnValue(DEFAULT_TEST_THEME),
    getAvailableThemes: vi.fn().mockReturnValue([DEFAULT_TEST_THEME]),
    registerTheme: vi.fn(),
    createCustomTheme: vi.fn().mockReturnValue(DEFAULT_TEST_THEME),
    getThemeStyles: vi.fn().mockReturnValue('/* mock styles */'),
    
    // Document methods (matching actual interface)
    getDocument: vi.fn().mockReturnValue(null),
    getAllDocuments: vi.fn().mockReturnValue([]),
    getDocuments: vi.fn().mockReturnValue([]), // Duplicate method in actual interface
    getDocumentContent: vi.fn().mockResolvedValue(''),
    
    // Search methods
    search: vi.fn().mockResolvedValue([]), // search() returns Promise<Document[]>
    
    // Configuration and state methods
    getConfig: vi.fn().mockReturnValue({
      container: mockContainer,
      source: { type: 'content', documents: [] },
      theme: DEFAULT_TEST_THEME,
    } as DocumentationConfig),
    getState: vi.fn().mockReturnValue(DEFAULT_VIEWER_STATE),
    
    ...overrides,
  };

  return defaultMock as MarkdownDocsViewer;
}

/**
 * Creates an error state viewer for fallback scenarios
 */
export function createErrorViewer(container?: HTMLElement, error?: Error): MarkdownDocsViewer {
  const errorContainer = container || document.createElement('div');
  const errorMessage = error?.message || 'Viewer initialization failed';
  
  // Display error in container
  errorContainer.innerHTML = `
    <div style="padding: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
      <h2 style="color: #dc3545; margin-bottom: 1rem;">❌ Viewer Creation Failed</h2>
      <p style="margin-bottom: 1rem;">Failed to create the documentation viewer.</p>
      <details style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 0.5rem;">
        <summary style="cursor: pointer; font-weight: 600;">🔍 Error Details</summary>
        <pre style="margin-top: 1rem; font-size: 0.875rem; white-space: pre-wrap;">${errorMessage}</pre>
      </details>
    </div>
  `;

  return createMockViewer({
    destroy: vi.fn().mockReturnValue(undefined), // destroy() is synchronous
    refresh: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn(),
    getState: vi.fn().mockReturnValue({
      ...DEFAULT_VIEWER_STATE,
      error: new Error(errorMessage),
    }),
  });
}

/**
 * Creates a mock viewer with specific failure modes
 */
export interface MockViewerFailureOptions {
  shouldDestroyFail?: boolean;
  shouldRefreshFail?: boolean;
  shouldThemeChangeFail?: boolean;
  shouldSearchFail?: boolean;
  container?: HTMLElement;
  error?: Error;
}

/**
 * Creates a mock viewer with configurable failure scenarios
 */
export function createFailingViewer(options: MockViewerFailureOptions = {}): MarkdownDocsViewer {
  const {
    shouldDestroyFail = false,
    shouldRefreshFail = false,
    shouldThemeChangeFail = false,
    shouldSearchFail = false,
    container = document.createElement('div'),
    error = new Error('Mock failure'),
  } = options;

  return createMockViewer({
    destroy: shouldDestroyFail
      ? vi.fn().mockImplementation(() => { throw error; }) // destroy() is sync and can throw
      : vi.fn().mockReturnValue(undefined),
    refresh: shouldRefreshFail
      ? vi.fn().mockRejectedValue(error) // refresh() is async
      : vi.fn().mockResolvedValue(undefined),
    setTheme: shouldThemeChangeFail
      ? vi.fn().mockImplementation(() => { throw error; })
      : vi.fn(),
    search: shouldSearchFail
      ? vi.fn().mockRejectedValue(error) // search() is async
      : vi.fn().mockResolvedValue([]),
  });
}

/**
 * Common viewer method mocks for testing
 */
export function mockViewerMethods() {
  return {
    destroy: vi.fn().mockReturnValue(undefined), // void return
    refresh: vi.fn().mockResolvedValue(undefined), // async
    setTheme: vi.fn(),
    getTheme: vi.fn().mockReturnValue(DEFAULT_TEST_THEME),
    getAvailableThemes: vi.fn().mockReturnValue([DEFAULT_TEST_THEME]),
    registerTheme: vi.fn(),
    createCustomTheme: vi.fn().mockReturnValue(DEFAULT_TEST_THEME),
    getThemeStyles: vi.fn().mockReturnValue('/* mock styles */'),
    getDocument: vi.fn().mockReturnValue(null),
    getAllDocuments: vi.fn().mockReturnValue([]),
    getDocuments: vi.fn().mockReturnValue([]),
    getDocumentContent: vi.fn().mockResolvedValue(''),
    search: vi.fn().mockResolvedValue([]), // async
    getState: vi.fn().mockReturnValue(DEFAULT_VIEWER_STATE),
    getConfig: vi.fn().mockReturnValue({
      container: document.createElement('div'),
      source: { type: 'content', documents: [] },
      theme: DEFAULT_TEST_THEME,
    } as DocumentationConfig),
  };
}

/**
 * Creates a mock viewer with custom documents
 */
export function createViewerWithDocuments(documents: Document[]): MarkdownDocsViewer {
  return createMockViewer({
    getDocuments: vi.fn().mockReturnValue(documents),
    getAllDocuments: vi.fn().mockReturnValue(documents),
    getDocument: vi.fn().mockImplementation((id: string) => 
      documents.find(doc => doc.id === id) || null
    ),
    getState: vi.fn().mockReturnValue({
      ...DEFAULT_VIEWER_STATE,
      documents,
      currentDocument: documents[0] || null,
    }),
  });
}

/**
 * Creates a mock viewer with custom theme
 */
export function createViewerWithTheme(theme: Theme): MarkdownDocsViewer {
  return createMockViewer({
    getTheme: vi.fn().mockReturnValue(theme),
    getConfig: vi.fn().mockReturnValue({
      container: document.createElement('div'),
      source: { type: 'content', documents: [] },
      theme,
    } as DocumentationConfig),
  });
}

/**
 * Creates a mock viewer in loading state
 */
export function createLoadingViewer(): MarkdownDocsViewer {
  return createMockViewer({
    getState: vi.fn().mockReturnValue({
      ...DEFAULT_VIEWER_STATE,
      loading: true,
    }),
  });
}

/**
 * Creates a mock viewer with search results
 */
export function createViewerWithSearchResults(searchResults: Document[], query: string = 'test'): MarkdownDocsViewer {
  return createMockViewer({
    search: vi.fn().mockReturnValue(searchResults),
    getState: vi.fn().mockReturnValue({
      ...DEFAULT_VIEWER_STATE,
      searchQuery: query,
      searchResults,
    }),
  });
}

/**
 * Utility to create test documents
 */
export function createTestDocuments(count: number = 3): Document[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `test-doc-${index + 1}`,
    title: `Test Document ${index + 1}`,
    content: `# Test Document ${index + 1}\n\nThis is test content for document ${index + 1}.`,
    order: index + 1,
    category: 'Test',
  }));
}

/**
 * Mock viewer scenarios for common test cases
 */
export const mockViewerScenarios = {
  /**
   * Default successful viewer
   */
  success: (overrides?: Partial<MarkdownDocsViewer>) => createMockViewer(overrides),

  /**
   * Error state viewer
   */
  error: (error?: Error, container?: HTMLElement) => createErrorViewer(container, error),

  /**
   * Viewer with documents loaded
   */
  withDocuments: (documents?: Document[]) => 
    createViewerWithDocuments(documents || createTestDocuments()),

  /**
   * Viewer in loading state
   */
  loading: () => createLoadingViewer(),

  /**
   * Viewer with search results
   */
  withSearch: (results?: Document[], query?: string) => 
    createViewerWithSearchResults(results || createTestDocuments(2), query),

  /**
   * Viewer that fails operations
   */
  failing: (options?: MockViewerFailureOptions) => createFailingViewer(options),
};

/**
 * Creates a viewer mock that can be destroyed and refreshed
 */
export function mockViewerWithError(error?: Error): MarkdownDocsViewer {
  return createErrorViewer(undefined, error);
}

/**
 * Creates a viewer mock in loading state
 */
export function mockViewerLoading(): MarkdownDocsViewer {
  return createLoadingViewer();
}

/**
 * Creates a viewer mock with specific theme
 */
export function mockViewerWithTheme(theme: Theme): MarkdownDocsViewer {
  return createViewerWithTheme(theme);
}

/**
 * Utility for testing viewer configuration updates
 */
export function createConfigurableViewer(initialConfig?: Partial<DocumentationConfig>): MarkdownDocsViewer {
  let currentConfig = {
    container: document.createElement('div'),
    source: { type: 'content' as const, documents: [] },
    theme: DEFAULT_TEST_THEME,
    ...initialConfig,
  };

  return createMockViewer({
    getConfig: vi.fn().mockImplementation(() => currentConfig),
    updateConfig: vi.fn().mockImplementation((newConfig: Partial<DocumentationConfig>) => {
      currentConfig = { ...currentConfig, ...newConfig };
    }),
  });
}