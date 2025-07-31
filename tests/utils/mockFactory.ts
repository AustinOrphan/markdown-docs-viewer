/**
 * Mock utilities for factory module functions
 * Provides targeted mocking without global vi.mock() to prevent circular dependencies
 */

import { vi, type MockedFunction } from 'vitest';
import type { MarkdownDocsViewer } from '../../src/viewer';
import * as factory from '../../src/factory';

/**
 * Creates a mock viewer instance with all required methods
 */
export function createMockViewer(overrides: Partial<MarkdownDocsViewer> = {}): MarkdownDocsViewer {
  const defaultMock = {
    container: document.createElement('div'),
    destroy: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn(),
    getTheme: vi.fn().mockReturnValue({}),
    getCurrentDocument: vi.fn().mockReturnValue(null),
    getDocuments: vi.fn().mockReturnValue([]),
    navigateToDocument: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    clearSearch: vi.fn(),
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToHTML: vi.fn().mockReturnValue(''),
    updateConfig: vi.fn(),
    getState: vi.fn().mockReturnValue({
      currentDocument: null,
      documents: [],
      searchQuery: '',
      searchResults: [],
      loading: false,
      error: null,
      sidebarOpen: false,
      desktopSidebarCollapsed: false,
    }),
    ...overrides,
  };

  return defaultMock as MarkdownDocsViewer;
}

/**
 * Mocks createViewer to return a successful viewer instance
 */
export function mockCreateViewerSuccess(viewer?: MarkdownDocsViewer): MockedFunction<typeof factory.createViewer> {
  const mockViewer = viewer || createMockViewer();
  return vi.spyOn(factory, 'createViewer').mockReturnValue(mockViewer);
}

/**
 * Mocks createViewer to throw an error
 */
export function mockCreateViewerError(error: Error): MockedFunction<typeof factory.createViewer> {
  return vi.spyOn(factory, 'createViewer').mockImplementation(() => {
    throw error;
  });
}

/**
 * Creates an error state viewer for fallback scenarios
 */
export function createErrorViewer(container?: HTMLElement): MarkdownDocsViewer {
  return createMockViewer({
    container: container || document.createElement('div'),
    destroy: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn(),
  });
}

/**
 * Sets up factory mock with custom behavior
 */
export function setupFactoryMock(config: {
  shouldSucceed?: boolean;
  viewer?: MarkdownDocsViewer;
  error?: Error;
} = {}): MockedFunction<typeof factory.createViewer> {
  const { shouldSucceed = true, viewer, error } = config;

  if (shouldSucceed) {
    return mockCreateViewerSuccess(viewer);
  } else {
    return mockCreateViewerError(error || new Error('Mock viewer creation error'));
  }
}

/**
 * Creates a spy on quickStart function
 */
export function mockQuickStart(viewer?: MarkdownDocsViewer): MockedFunction<typeof factory.quickStart> {
  const mockViewer = viewer || createMockViewer();
  return vi.spyOn(factory, 'quickStart').mockReturnValue(mockViewer);
}

/**
 * Mock viewer with specific methods for testing
 */
export interface MockViewerOptions {
  shouldDestroyFail?: boolean;
  shouldReloadFail?: boolean;
  shouldThemeChangeFail?: boolean;
  container?: HTMLElement;
}

/**
 * Creates a mock viewer with configurable failure modes
 */
export function createTestViewer(options: MockViewerOptions = {}): MarkdownDocsViewer {
  const {
    shouldDestroyFail = false,
    shouldReloadFail = false,
    shouldThemeChangeFail = false,
    container = document.createElement('div'),
  } = options;

  return createMockViewer({
    container,
    destroy: shouldDestroyFail
      ? vi.fn().mockRejectedValue(new Error('Destroy failed'))
      : vi.fn().mockResolvedValue(undefined),
    reload: shouldReloadFail
      ? vi.fn().mockRejectedValue(new Error('Reload failed'))
      : vi.fn().mockResolvedValue(undefined),
    setTheme: shouldThemeChangeFail
      ? vi.fn().mockImplementation(() => {
          throw new Error('Theme change failed');
        })
      : vi.fn(),
  });
}