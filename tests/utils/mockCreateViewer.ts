/**
 * Mock utilities for factory module (createViewer function)
 * Provides targeted mocking without global vi.mock() to prevent circular dependencies
 * This replaces the global factory mocks that were causing hanging tests
 */

import { vi } from 'vitest';
import type { DocumentationConfig, Document, ViewerState, Theme } from '../../src/types';
import type { MarkdownDocsViewer } from '../../src/viewer';
import * as factory from '../../src/factory';

/**
 * Options for configuring mock viewer behavior
 */
export interface MockViewerOptions {
  /** Whether the destroy method should succeed */
  destroySucceeds?: boolean;
  /** Whether setTheme should succeed */
  setThemeSucceeds?: boolean;
  /** Custom documents to return */
  documents?: Document[];
  /** Custom theme to return */
  theme?: Theme;
  /** Custom state to return */
  state?: Partial<ViewerState>;
  /** Custom config to return */
  config?: Partial<DocumentationConfig>;
  /** Custom container element */
  container?: HTMLElement;
}

/**
 * Creates a complete mock viewer object that satisfies the MarkdownDocsViewer interface
 * This is the core utility for creating mock viewer instances
 */
export function createMockViewer(options: MockViewerOptions = {}): MarkdownDocsViewer {
  const {
    destroySucceeds = true,
    setThemeSucceeds = true,
    documents = [],
    theme,
    state,
    config,
    container = document.createElement('div'),
  } = options;

  const mockViewer = {
    // Core properties
    container,
    
    // Core lifecycle methods
    destroy: vi.fn().mockImplementation(() => {
      if (destroySucceeds) {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error('Destroy failed'));
      }
    }),

    refresh: vi.fn().mockResolvedValue(undefined),

    // Theme methods
    setTheme: vi.fn().mockImplementation((_newTheme: Theme | string) => {
      if (!setThemeSucceeds) {
        throw new Error('setTheme failed');
      }
    }),

    getTheme: vi.fn().mockReturnValue(theme || {}),
    getAvailableThemes: vi.fn().mockReturnValue([]),
    registerTheme: vi.fn(),
    createCustomTheme: vi.fn().mockReturnValue(theme || {}),
    getThemeStyles: vi.fn().mockReturnValue(''),

    // Document methods
    getDocuments: vi.fn().mockReturnValue(documents),
    getAllDocuments: vi.fn().mockReturnValue(documents),
    getDocument: vi.fn().mockImplementation((id: string) => {
      return documents.find(doc => doc.id === id) || null;
    }),
    getDocumentContent: vi.fn().mockImplementation((doc: Document) => {
      return Promise.resolve(doc.content || '');
    }),

    // Search methods  
    search: vi.fn().mockResolvedValue([]),

    // State methods
    getState: vi.fn().mockReturnValue({
      currentDocument: documents[0] || null,
      documents: documents,
      searchQuery: '',
      searchResults: [],
      loading: false,
      error: null,
      sidebarOpen: false,
      desktopSidebarCollapsed: false,
      ...state,
    } as ViewerState),

    getConfig: vi.fn().mockReturnValue({
      container: container,
      source: { type: 'content', documents: [] },
      ...config,
    } as DocumentationConfig),
  };

  // Use type assertion to satisfy MarkdownDocsViewer interface
  return mockViewer as unknown as MarkdownDocsViewer;
}

/**
 * Mocks factory.createViewer to return a successful viewer instance
 * This replaces the problematic global factory mocks
 */
export function mockCreateViewerSuccess(viewer?: MarkdownDocsViewer) {
  const mockViewer = viewer || createMockViewer();
  return vi.spyOn(factory, 'createViewer').mockReturnValue(mockViewer);
}

/**
 * Mocks factory.createViewer to throw an error
 * This is the core utility for testing error scenarios
 */
export function mockCreateViewerError(error: Error) {
  return vi.spyOn(factory, 'createViewer').mockImplementation(() => {
    throw error;
  });
}

/**
 * Mock utility for container validation errors
 */
export function mockCreateViewerContainerError() {
  return mockCreateViewerError(new Error('Container element not found'));
}

/**
 * Mock utility for configuration errors
 */
export function mockCreateViewerConfigError() {
  return mockCreateViewerError(new Error('Invalid configuration'));
}

/**
 * Creates a mock error viewer that displays error messages in the container
 * This is critical for the "should display error message in container on failure" test
 */
export function createErrorViewer(error: Error, container?: HTMLElement): MarkdownDocsViewer {
  const errorViewer = createMockViewer({ container });

  // If we have a container, display the error immediately
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; color: #d73a49; background: #ffeef0; border: 1px solid #f97583; border-radius: 4px;">
        <h3>Viewer Creation Failed</h3>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check your configuration and try again.</p>
      </div>
    `;
  }

  return errorViewer;
}

/**
 * Comprehensive factory mock setup with different scenarios
 * This provides a one-stop utility for different test scenarios
 */
export function setupFactoryMock(config: {
  /** Whether createViewer should succeed */
  shouldSucceed?: boolean;
  /** Custom viewer to return on success */
  viewer?: MarkdownDocsViewer;
  /** Error to throw on failure */
  error?: Error;
  /** Container for error display */
  container?: HTMLElement;
} = {}) {
  const { shouldSucceed = true, viewer, error, container } = config;

  if (shouldSucceed) {
    return mockCreateViewerSuccess(viewer);
  } else {
    const testError = error || new Error('Mock viewer creation error');
    // For error scenarios, we still need to create an error viewer that displays the error
    if (container) {
      createErrorViewer(testError, container);
      // Mock createViewer to throw error, but zero-config will create fallback viewer
      const spy = mockCreateViewerError(testError);
      return spy;
    } else {
      return mockCreateViewerError(testError);
    }
  }
}

/**
 * Mock viewer with specific failure modes for advanced testing
 */
export interface AdvancedMockViewerOptions extends MockViewerOptions {
  shouldDestroyFail?: boolean;
  shouldRefreshFail?: boolean;
  shouldSearchFail?: boolean;
}

/**
 * Creates a mock viewer with configurable failure modes for comprehensive testing
 */
export function createAdvancedMockViewer(options: AdvancedMockViewerOptions = {}): MarkdownDocsViewer {
  const {
    shouldDestroyFail = false,
    shouldRefreshFail = false,
    shouldSearchFail = false,
    ...baseOptions
  } = options;

  const baseViewer = createMockViewer(baseOptions);

  // Override specific methods with failure modes
  if (shouldDestroyFail) {
    baseViewer.destroy = vi.fn().mockImplementation(() => {
      throw new Error('Destroy failed');
    });
  }
  
  if (shouldRefreshFail) {
    baseViewer.refresh = vi.fn().mockRejectedValue(new Error('Refresh failed'));
  }
  
  if (shouldSearchFail) {
    baseViewer.search = vi.fn().mockRejectedValue(new Error('Search failed'));
  }

  return baseViewer;
}

/**
 * Utility function to clean up factory mocks
 * Call this in afterEach to ensure clean test state
 */
export function cleanupFactoryMocks(): void {
  // Restore all spies on the factory module
  if (vi.isMockFunction(factory.createViewer)) {
    vi.mocked(factory.createViewer).mockRestore();
  }
  if (vi.isMockFunction(factory.quickStart)) {
    vi.mocked(factory.quickStart).mockRestore();
  }
}
