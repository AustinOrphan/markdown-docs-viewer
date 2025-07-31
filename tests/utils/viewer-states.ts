/**
 * Viewer state utilities and factories for testing
 * Provides common viewer states and state transition helpers
 */

import type { ViewerState, Document } from '../../src/types';

/**
 * Common viewer states for testing
 */
export const VIEWER_STATES = {
  /**
   * Initial empty state
   */
  INITIAL: {
    currentDocument: null,
    documents: [],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * Loading state
   */
  LOADING: {
    currentDocument: null,
    documents: [],
    searchQuery: '',
    searchResults: [],
    loading: true,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * Error state
   */
  ERROR: {
    currentDocument: null,
    documents: [],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: new Error('Test error'),
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * Ready state with documents loaded
   */
  READY: {
    currentDocument: null,
    documents: [
      {
        id: 'doc1',
        title: 'Getting Started',
        content: '# Getting Started\n\nWelcome to the documentation.',
        order: 1,
      },
      {
        id: 'doc2',
        title: 'API Reference',
        content: '# API Reference\n\nAPI documentation here.',
        order: 2,
      },
    ],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * State with active document
   */
  WITH_DOCUMENT: {
    currentDocument: {
      id: 'doc1',
      title: 'Getting Started',
      content: '# Getting Started\n\nWelcome to the documentation.',
      order: 1,
    },
    documents: [
      {
        id: 'doc1',
        title: 'Getting Started',
        content: '# Getting Started\n\nWelcome to the documentation.',
        order: 1,
      },
      {
        id: 'doc2',
        title: 'API Reference',
        content: '# API Reference\n\nAPI documentation here.',
        order: 2,
      },
    ],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * State with search results
   */
  WITH_SEARCH: {
    currentDocument: null,
    documents: [
      {
        id: 'doc1',
        title: 'Getting Started',
        content: '# Getting Started\n\nWelcome to the documentation.',
        order: 1,
      },
      {
        id: 'doc2',
        title: 'API Reference',
        content: '# API Reference\n\nAPI documentation here.',
        order: 2,
      },
    ],
    searchQuery: 'getting started',
    searchResults: [
      {
        id: 'doc1',
        title: 'Getting Started',
        content: '# Getting Started\n\nWelcome to the documentation.',
        order: 1,
      },
    ],
    loading: false,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * Mobile state with sidebar open
   */
  MOBILE_SIDEBAR_OPEN: {
    currentDocument: null,
    documents: [],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: null,
    sidebarOpen: true,
    desktopSidebarCollapsed: false,
  } as ViewerState,

  /**
   * Desktop state with sidebar collapsed
   */
  DESKTOP_SIDEBAR_COLLAPSED: {
    currentDocument: null,
    documents: [],
    searchQuery: '',
    searchResults: [],
    loading: false,
    error: null,
    sidebarOpen: false,
    desktopSidebarCollapsed: true,
  } as ViewerState,
} as const;

/**
 * State factory functions
 */
export const stateFactories = {
  /**
   * Creates initial empty state
   */
  createInitialState(): ViewerState {
    return { ...VIEWER_STATES.INITIAL };
  },

  /**
   * Creates loading state
   */
  createLoadingState(): ViewerState {
    return { ...VIEWER_STATES.LOADING };
  },

  /**
   * Creates error state with custom error
   */
  createErrorState(error: Error = new Error('Test error')): ViewerState {
    return {
      ...VIEWER_STATES.ERROR,
      error,
    };
  },

  /**
   * Creates ready state with custom documents
   */
  createReadyState(documents: Document[] = []): ViewerState {
    return {
      ...VIEWER_STATES.READY,
      documents,
    };
  },

  /**
   * Creates state with active document
   */
  createStateWithDocument(document: Document, documents: Document[] = [document]): ViewerState {
    return {
      ...VIEWER_STATES.WITH_DOCUMENT,
      currentDocument: document,
      documents,
    };
  },

  /**
   * Creates state with search results
   */
  createStateWithSearch(
    query: string,
    results: Document[] = [],
    allDocuments: Document[] = results
  ): ViewerState {
    return {
      ...VIEWER_STATES.WITH_SEARCH,
      searchQuery: query,
      searchResults: results,
      documents: allDocuments,
    };
  },

  /**
   * Creates mobile state with sidebar open
   */
  createMobileSidebarOpenState(): ViewerState {
    return { ...VIEWER_STATES.MOBILE_SIDEBAR_OPEN };
  },

  /**
   * Creates desktop state with sidebar collapsed
   */
  createDesktopSidebarCollapsedState(): ViewerState {
    return { ...VIEWER_STATES.DESKTOP_SIDEBAR_COLLAPSED };
  },
} as const;

/**
 * State transition helpers
 */
export const stateTransitions = {
  /**
   * Transition to loading state
   */
  toLoading(currentState: ViewerState): ViewerState {
    return {
      ...currentState,
      loading: true,
      error: null,
    };
  },

  /**
   * Transition to error state
   */
  toError(currentState: ViewerState, error: Error): ViewerState {
    return {
      ...currentState,
      loading: false,
      error,
    };
  },

  /**
   * Transition to ready state
   */
  toReady(currentState: ViewerState, documents: Document[] = []): ViewerState {
    return {
      ...currentState,
      loading: false,
      error: null,
      documents,
    };
  },

  /**
   * Transition to document loaded state
   */
  toDocumentLoaded(currentState: ViewerState, document: Document): ViewerState {
    return {
      ...currentState,
      currentDocument: document,
      loading: false,
      error: null,
    };
  },

  /**
   * Transition to search state
   */
  toSearch(currentState: ViewerState, query: string, results: Document[]): ViewerState {
    return {
      ...currentState,
      searchQuery: query,
      searchResults: results,
    };
  },

  /**
   * Clear search state
   */
  clearSearch(currentState: ViewerState): ViewerState {
    return {
      ...currentState,
      searchQuery: '',
      searchResults: [],
    };
  },

  /**
   * Toggle sidebar state
   */
  toggleSidebar(currentState: ViewerState): ViewerState {
    return {
      ...currentState,
      sidebarOpen: !currentState.sidebarOpen,
    };
  },

  /**
   * Toggle desktop sidebar collapsed state
   */
  toggleDesktopSidebar(currentState: ViewerState): ViewerState {
    return {
      ...currentState,
      desktopSidebarCollapsed: !currentState.desktopSidebarCollapsed,
    };
  },
} as const;

/**
 * Utility functions for working with states
 */
export const stateUtils = {
  /**
   * Check if state is loading
   */
  isLoading(state: ViewerState): boolean {
    return state.loading;
  },

  /**
   * Check if state has error
   */
  hasError(state: ViewerState): boolean {
    return state.error !== null;
  },

  /**
   * Check if state is ready (has documents and not loading/error)
   */
  isReady(state: ViewerState): boolean {
    return !state.loading && !state.error && state.documents.length > 0;
  },

  /**
   * Check if state has active document
   */
  hasActiveDocument(state: ViewerState): boolean {
    return state.currentDocument !== null;
  },

  /**
   * Check if state has search active
   */
  hasActiveSearch(state: ViewerState): boolean {
    return state.searchQuery.trim() !== '';
  },

  /**
   * Check if sidebar is open
   */
  isSidebarOpen(state: ViewerState): boolean {
    return state.sidebarOpen;
  },

  /**
   * Check if desktop sidebar is collapsed
   */
  isDesktopSidebarCollapsed(state: ViewerState): boolean {
    return state.desktopSidebarCollapsed;
  },

  /**
   * Get current document from state
   */
  getCurrentDocument(state: ViewerState): Document | null {
    return state.currentDocument;
  },

  /**
   * Get all documents from state
   */
  getDocuments(state: ViewerState): Document[] {
    return [...state.documents];
  },

  /**
   * Get search results from state
   */
  getSearchResults(state: ViewerState): Document[] {
    return [...state.searchResults];
  },

  /**
   * Clone state for mutations
   */
  cloneState(state: ViewerState): ViewerState {
    return {
      ...state,
      documents: [...state.documents],
      searchResults: [...state.searchResults],
    };
  },
} as const;

/**
 * Common document fixtures for testing
 */
export const TEST_DOCUMENTS = {
  GETTING_STARTED: {
    id: 'getting-started',
    title: 'Getting Started',
    content: '# Getting Started\n\nWelcome to the documentation viewer.',
    description: 'Learn how to get started',
    category: 'Guide',
    tags: ['intro', 'guide'],
    order: 1,
  } as Document,

  API_REFERENCE: {
    id: 'api-reference',
    title: 'API Reference',
    content: '# API Reference\n\nComplete API documentation.',
    description: 'API methods and interfaces',
    category: 'Reference',
    tags: ['api', 'reference'],
    order: 2,
  } as Document,

  EXAMPLES: {
    id: 'examples',
    title: 'Examples',
    content: '# Examples\n\nCode examples and usage patterns.',
    description: 'Practical examples',
    category: 'Examples',
    tags: ['examples', 'code'],
    order: 3,
  } as Document,

  FAQ: {
    id: 'faq',
    title: 'FAQ',
    content: '# Frequently Asked Questions\n\nCommon questions and answers.',
    description: 'Common questions',
    category: 'Help',
    tags: ['faq', 'help'],
    order: 4,
  } as Document,
} as const;

/**
 * Create test document collections
 */
export function createTestDocumentCollection(count: number = 4): Document[] {
  const documents = Object.values(TEST_DOCUMENTS);
  return documents.slice(0, Math.min(count, documents.length));
}

/**
 * Create custom test document
 */
export function createTestDocument(
  id: string,
  title: string,
  overrides: Partial<Document> = {}
): Document {
  return {
    id,
    title,
    content: `# ${title}\n\nContent for ${title}.`,
    description: `Description for ${title}`,
    order: 1,
    ...overrides,
  };
}