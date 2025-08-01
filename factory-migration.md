# Factory Mock Migration Documentation

## Overview

This document outlines the changes made to factory mocking utilities to resolve hanging tests in the zero-config test suite. The root cause was problematic global `vi.mock()` calls that created circular dependencies and prevented proper test execution.

## Changes Made

### 1. Enhanced `tests/utils/mockCreateViewer.ts`

**Previous Issues:**

- Basic mock utilities that didn't provide comprehensive factory mocking
- Missing critical methods needed for zero-config tests
- No direct factory module mocking capabilities

**New Implementation:**

- Complete factory mock utilities with targeted spying instead of global mocks
- Enhanced mock viewer creation with all required MarkdownDocsViewer methods
- Specialized error handling utilities for container error display
- Comprehensive cleanup utilities to prevent test interference

### 2. Key New Utilities

#### Core Mock Functions

```typescript
// Creates complete mock viewer with all required methods
createMockViewer(options?: MockViewerOptions): MarkdownDocsViewer

// Mocks factory.createViewer to return successful viewer
mockCreateViewerSuccess(viewer?: MarkdownDocsViewer): MockedFunction

// Mocks factory.createViewer to throw errors
mockCreateViewerError(error: Error): MockedFunction

// Specialized error scenarios
mockCreateViewerContainerError(): MockedFunction
mockCreateViewerConfigError(): MockedFunction
```

#### Advanced Testing Utilities

```typescript
// Creates error viewer with container error display
createErrorViewer(error: Error, container?: HTMLElement): MarkdownDocsViewer

// Comprehensive setup with different scenarios
setupFactoryMock(config: {
  shouldSucceed?: boolean;
  viewer?: MarkdownDocsViewer;
  error?: Error;
  container?: HTMLElement;
}): MockedFunction

// Advanced mock with configurable failure modes
createAdvancedMockViewer(options: AdvancedMockViewerOptions): MarkdownDocsViewer

// Cleanup utility for afterEach
cleanupFactoryMocks(): void
```

## Migration Guide for Agent F

### Current Problem Tests

The following tests in `tests/zero-config.test.ts` are experiencing hanging issues:

1. **"should return error viewer for invalid container string"** (line 144)
2. **"should display error message in container on failure"** (line 260)
3. **"should handle error with custom container"** (line 288)
4. **"should handle container query failure in error state"** (line 453)

### Root Cause Analysis

**Problem:** Global `vi.mock('../src/factory')` creates circular dependencies when zero-config module tries to import factory functions during error handling.

**Solution:** Replace global mocks with targeted spying using `vi.spyOn(factory, 'createViewer')`.

### Migration Steps for Agent F

#### 1. Replace Global Factory Mock Imports

**Before:**

```typescript
// Remove these problematic imports
vi.mock('../src/factory'); // Global mock causing issues

// Old import pattern from mockFactory
import { mockCreateViewerSuccess } from './utils/mockFactory';
```

**After:**

```typescript
// Use enhanced utilities - import from main index or specific file
import {
  mockCreateViewerSuccess,
  mockCreateViewerError,
  createFactoryErrorViewer,
  setupFactoryMock,
  cleanupFactoryMocks,
} from './utils/mockCreateViewer';

// OR use the centralized index (recommended)
import {
  mockCreateViewerSuccess,
  mockCreateViewerError,
  createFactoryErrorViewer,
  setupFactoryMock,
  cleanupFactoryMocks,
} from './utils';
```

#### 2. Update Test Setup

**Before:**

```typescript
beforeEach(() => {
  // Global mock setup
  mockCreateViewerFn = mockCreateViewerSuccess(mockViewer);
});
```

**After:**

```typescript
beforeEach(() => {
  // Targeted spying setup
  mockCreateViewerFn = mockCreateViewerSuccess(mockViewer);
});

afterEach(() => {
  // Clean up to prevent test interference
  cleanupFactoryMocks();
  vi.clearAllMocks();
});
```

#### 3. Fix Error Display Tests

**Critical Fix for "should display error message in container on failure":**

```typescript
it('should display error message in container on failure', async () => {
  const error = new Error('Test error');

  // Set up error scenario - createViewer will throw
  mockCreateViewerError(error);

  // The zero-config init() will catch the error and create a fallback error viewer
  const viewer = await init();

  // Verify error display in container (zero-config handles this internally)
  expect(mockContainer.innerHTML).toContain('Viewer Creation Failed');
  expect(mockContainer.innerHTML).toContain('Test error');
  expect(viewer).toBeDefined();
  expect(viewer.destroy).toBeDefined();
});
```

**Note:** The enhanced `mockCreateViewerError` properly integrates with zero-config's error handling to ensure the error display works correctly.

#### 4. Handle Container Query Failures

**For container validation errors:**

```typescript
it('should return error viewer for invalid container string', async () => {
  // Mock querySelector to return null
  vi.spyOn(document, 'querySelector').mockReturnValue(null);

  const options: ZeroConfigOptions = {
    container: '#nonexistent',
  };

  const viewer = await init(options);

  expect(viewer).toBeDefined();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Failed to initialize'),
    expect.objectContaining({ message: 'Container element "#nonexistent" not found' })
  );
});
```

## Type Safety Improvements

### Enhanced MockViewerOptions

```typescript
interface MockViewerOptions {
  destroySucceeds?: boolean;
  setThemeSucceeds?: boolean;
  documents?: Document[];
  theme?: Theme;
  state?: Partial<ViewerState>;
  config?: Partial<DocumentationConfig>;
  container?: HTMLElement; // NEW: Container element support
}
```

### Advanced Mock Options

```typescript
interface AdvancedMockViewerOptions extends MockViewerOptions {
  shouldDestroyFail?: boolean;
  shouldRefreshFail?: boolean;
  shouldSearchFail?: boolean;
}
```

## Export Structure and Naming Conflicts

### Resolved Conflicts

The existing `mockFactory.ts` and new `mockCreateViewer.ts` had naming conflicts. The solution:

**Enhanced exports (recommended):**

```typescript
import {
  mockCreateViewerSuccess, // Primary factory mock utilities
  mockCreateViewerError,
  createFactoryErrorViewer, // Renamed from createErrorViewer
  createEnhancedMockViewer, // Renamed from createMockViewer
  setupFactoryMock,
  cleanupFactoryMocks,
} from './utils';
```

**Legacy exports (deprecated):**

```typescript
import {
  createLegacyMockViewer, // Old mockFactory.createMockViewer
  createLegacyErrorViewer, // Old mockFactory.createErrorViewer
  createTestViewer,
  mockQuickStart,
} from './utils';
```

### When to Use Which Utilities

- **Use Enhanced (mockCreateViewer.ts):** For zero-config tests and any new factory mocking
- **Use Legacy (mockFactory.ts):** Only if existing tests specifically need the old interface
- **Migrate gradually:** Replace legacy imports with enhanced ones as tests are updated

## Key Benefits

1. **No Circular Dependencies:** Targeted spying prevents module resolution issues
2. **Complete Interface Coverage:** All MarkdownDocsViewer methods properly mocked
3. **Error Display Testing:** Proper container error display for UI testing
4. **Reusable Utilities:** Common scenarios packaged as reusable functions
5. **Type Safety:** Full TypeScript support with proper interfaces
6. **Test Isolation:** Cleanup utilities prevent test interference
7. **Clear Export Structure:** Resolves naming conflicts with legacy utilities

## Testing the Migration

After Agent F applies these changes:

1. **Run Specific Tests:**

   ```bash
   npm test -- --testNamePattern="should display error message in container on failure"
   npm test -- --testNamePattern="should return error viewer for invalid container string"
   ```

2. **Run Full Zero-Config Suite:**

   ```bash
   npm test tests/zero-config.test.ts
   ```

3. **Verify No Hanging:**
   Tests should complete within normal timeframes (< 10 seconds each)

## Files Modified

- ✅ `/tests/utils/mockCreateViewer.ts` - Complete rewrite with factory mocking
- 📝 `/factory-migration.md` - This documentation file

## Files to be Updated by Agent F

- 🔄 `/tests/zero-config.test.ts` - Replace factory mock usage
- 🔄 Any other test files using problematic factory mocks

## Notes for Future Development

1. **Always use targeted spying** instead of global `vi.mock()` for factory functions
2. **Use `cleanupFactoryMocks()`** in `afterEach` to prevent test interference
3. **Test error scenarios** with proper container error display
4. **Avoid circular imports** between test utilities and source modules

This migration should resolve the hanging test issues and provide a robust foundation for factory mocking in all test suites.
