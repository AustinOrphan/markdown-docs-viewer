# Viewer Mock Migration Guide

This document describes the changes made to the viewer mocking utilities and how to migrate existing tests.

## Overview

The viewer mocking system has been updated to provide comprehensive utilities for testing the `MarkdownDocsViewer` interface while avoiding global mocking that caused circular dependencies and hanging tests.

## Key Changes Made

### 1. Updated `tests/utils/mockViewer.ts`

#### Interface Alignment
- **Fixed `destroy()` method**: Now returns `void` instead of `Promise<void>` to match actual interface
- **Replaced `reload()` with `refresh()`**: The actual interface has `refresh()`, not `reload()`
- **Updated `search()` method**: Now returns `Promise<Document[]>` instead of synchronous array
- **Added missing methods**: `registerTheme()`, `createCustomTheme()`, `getThemeStyles()`, `getDocumentContent()`
- **Removed non-existent methods**: `getCurrentDocument()`, `navigateToDocument()`, export methods

#### Method Signatures Fixed
```typescript
// Before (incorrect)
destroy: vi.fn().mockResolvedValue(undefined),
reload: vi.fn().mockResolvedValue(undefined),
search: vi.fn().mockReturnValue([]),

// After (correct)
destroy: vi.fn().mockReturnValue(undefined),      // sync void
refresh: vi.fn().mockResolvedValue(undefined),    // async
search: vi.fn().mockResolvedValue([]),            // async Promise<Document[]>
```

#### New Export Functions
- `mockViewerWithError(error?: Error)`: Creates error state viewer
- `mockViewerLoading()`: Creates loading state viewer  
- `mockViewerWithTheme(theme: Theme)`: Creates viewer with specific theme

### 2. Created `tests/utils/viewer-states.ts`

#### State Constants
Predefined common viewer states:
- `VIEWER_STATES.INITIAL`: Empty initial state
- `VIEWER_STATES.LOADING`: Loading state
- `VIEWER_STATES.ERROR`: Error state
- `VIEWER_STATES.READY`: Ready with documents
- `VIEWER_STATES.WITH_DOCUMENT`: Active document loaded
- `VIEWER_STATES.WITH_SEARCH`: Search results displayed
- `VIEWER_STATES.MOBILE_SIDEBAR_OPEN`: Mobile sidebar open
- `VIEWER_STATES.DESKTOP_SIDEBAR_COLLAPSED`: Desktop sidebar collapsed

#### State Factories
Factory functions for creating states:
```typescript
stateFactories.createInitialState()
stateFactories.createLoadingState()
stateFactories.createErrorState(error)
stateFactories.createReadyState(documents)
stateFactories.createStateWithDocument(document, documents)
stateFactories.createStateWithSearch(query, results, allDocuments)
```

#### State Transitions
Helper functions for state transitions:
```typescript
stateTransitions.toLoading(currentState)
stateTransitions.toError(currentState, error)
stateTransitions.toReady(currentState, documents)
stateTransitions.toDocumentLoaded(currentState, document)
stateTransitions.toSearch(currentState, query, results)
```

#### State Utilities
Utility functions for state inspection:
```typescript
stateUtils.isLoading(state)
stateUtils.hasError(state)
stateUtils.isReady(state)
stateUtils.hasActiveDocument(state)
stateUtils.hasActiveSearch(state)
```

#### Test Documents
Predefined test document fixtures:
- `TEST_DOCUMENTS.GETTING_STARTED`
- `TEST_DOCUMENTS.API_REFERENCE`
- `TEST_DOCUMENTS.EXAMPLES`
- `TEST_DOCUMENTS.FAQ`

## Migration Examples

### Before: Incorrect Method Mocking
```typescript
// Old approach with incorrect interface
const mockViewer = {
  destroy: vi.fn().mockResolvedValue(undefined), // Wrong: destroy is sync
  reload: vi.fn().mockResolvedValue(undefined),  // Wrong: method doesn't exist
  search: vi.fn().mockReturnValue([]),           // Wrong: search is async
  getCurrentDocument: vi.fn(),                   // Wrong: method doesn't exist
};
```

### After: Correct Interface Mocking
```typescript
import { createMockViewer, mockViewerWithError } from './utils/mockViewer';

// Correct approach with proper interface
const mockViewer = createMockViewer({
  destroy: vi.fn().mockReturnValue(undefined),    // Correct: sync void
  refresh: vi.fn().mockResolvedValue(undefined),  // Correct: async
  search: vi.fn().mockResolvedValue([]),          // Correct: async Promise<Document[]>
  getDocument: vi.fn().mockReturnValue(null),     // Correct: actual method name
});

// Or use convenience functions
const errorViewer = mockViewerWithError(new Error('Test error'));
```

### Before: Manual State Creation
```typescript
// Old manual state creation
const mockState = {
  currentDocument: null,
  documents: [],
  searchQuery: '',
  searchResults: [],
  loading: true,
  error: null,
  sidebarOpen: false,
  desktopSidebarCollapsed: false,
};
```

### After: Using State Factories
```typescript
import { stateFactories, stateTransitions } from './utils/viewer-states';

// Use factories for common states
const loadingState = stateFactories.createLoadingState();
const errorState = stateFactories.createErrorState(new Error('Test error'));

// Use transitions for state changes
const newState = stateTransitions.toError(currentState, error);
```

### Before: Hard-coded Test Documents
```typescript
// Old manual document creation
const testDocs = [
  { id: 'doc1', title: 'Doc 1', content: 'Content 1' },
  { id: 'doc2', title: 'Doc 2', content: 'Content 2' },
];
```

### After: Using Document Fixtures
```typescript
import { TEST_DOCUMENTS, createTestDocumentCollection } from './utils/viewer-states';

// Use predefined documents
const singleDoc = TEST_DOCUMENTS.GETTING_STARTED;
const multipleaDocs = createTestDocumentCollection(3);

// Create custom documents
const customDoc = createTestDocument('my-doc', 'My Document', {
  category: 'Custom',
  tags: ['test'],
});
```

## Affected Tests

The following test files were affected by these changes:

### `tests/zero-config.test.ts`
- Updated viewer mock creation to use new interface-compliant methods
- Fixed async/sync method call expectations
- Replaced `reload` with `refresh` references

### Migration Required For:
- Any tests that directly mock the `MarkdownDocsViewer` class
- Tests that rely on `destroy()` returning a Promise
- Tests that use the non-existent `reload()` method
- Tests that mock `search()` as synchronous

## Benefits

1. **Interface Compliance**: Mocks now match the actual `MarkdownDocsViewer` interface exactly
2. **Type Safety**: TypeScript will catch mismatches between mocks and real interface
3. **No Global Mocking**: Eliminates circular dependency issues and hanging tests
4. **Comprehensive States**: Rich set of predefined states for common test scenarios
5. **Reusable Utilities**: Consistent state management across all tests
6. **Better Error Handling**: Proper error state modeling and transitions

## Best Practices

1. **Use Factory Functions**: Prefer `createMockViewer()` over manual mock creation
2. **Use State Factories**: Use predefined states instead of manual state objects
3. **Use State Transitions**: Use transition helpers for state changes
4. **Use Test Documents**: Use predefined document fixtures for consistency
5. **Avoid Global Mocks**: Use targeted mocking to prevent circular dependencies

## Testing Lifecycle Patterns

### Common Test Pattern
```typescript
import { createMockViewer, stateFactories, TEST_DOCUMENTS } from './utils';

describe('Feature Tests', () => {
  let mockViewer: MarkdownDocsViewer;
  
  beforeEach(() => {
    mockViewer = createMockViewer({
      getState: vi.fn().mockReturnValue(stateFactories.createReadyState([
        TEST_DOCUMENTS.GETTING_STARTED,
        TEST_DOCUMENTS.API_REFERENCE,
      ])),
    });
  });
  
  it('should handle document loading', async () => {
    await mockViewer.refresh();
    expect(mockViewer.refresh).toHaveBeenCalled();
  });
  
  it('should handle destruction', () => {
    mockViewer.destroy(); // No await needed - sync method
    expect(mockViewer.destroy).toHaveBeenCalled();
  });
});
```

This migration ensures that all viewer mocks properly satisfy the interface while providing rich utilities for testing various viewer states and scenarios.