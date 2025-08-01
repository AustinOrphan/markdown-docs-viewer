# Mock Utilities Guide for Zero-Config Testing

**Date**: 2025-07-31  
**Version**: 1.0  
**Target Audience**: Developers working on zero-config tests

## Overview

This guide provides comprehensive documentation for the mock utilities system created to resolve the zero-config test hanging issues. The utilities replace problematic global `vi.mock()` patterns with targeted, maintainable mocking approaches.

## Architecture Overview

### Design Principles

1. **No Global Mocking**: Eliminate `vi.mock()` at module level to prevent circular dependencies
2. **Targeted Function Mocking**: Mock only specific functions needed for each test
3. **Centralized Utilities**: Reusable patterns across all zero-config tests
4. **Circular Dependency Prevention**: Clean import/export structure

### File Structure

```
tests/utils/
├── index.ts                 # Central export hub (prevents circular deps)
├── mockFactory.ts           # Factory function mocking utilities
├── mockConfigLoader.ts      # Configuration loading mocks
├── mockAutoDiscovery.ts     # Document discovery mocks
├── mockViewer.ts           # Viewer instance creation utilities
└── mockCreateViewer.ts     # Legacy compatibility utilities
```

## Core Mock Utilities

### 1. Central Export Hub (`tests/utils/index.ts`)

**Purpose**: Provide single import point to prevent circular dependencies

```typescript
/**
 * Mock utilities index
 * Centralized exports for all mock utilities to prevent circular dependencies
 */

// Factory mock utilities
export * from './mockFactory';

// ConfigLoader mock utilities
export * from './mockConfigLoader';

// AutoDiscovery mock utilities
export * from './mockAutoDiscovery';

// Viewer mock utilities
export * from './mockViewer';

// CreateViewer utilities (legacy compatibility)
export * from './mockCreateViewer';
```

**Usage**:

```typescript
// ✅ Import from central hub
import {
  mockCreateViewerSuccess,
  setupConfigMock,
  setupAutoDiscoveryMockWithOptions,
  createMockViewer,
} from './utils';

// ❌ Don't import directly from individual files (can cause circular deps)
import { mockCreateViewerSuccess } from './utils/mockFactory';
```

### 2. Factory Mocking (`tests/utils/mockFactory.ts`)

**Purpose**: Mock the `createViewer` factory function with different scenarios

#### Key Functions

##### `mockCreateViewerSuccess(mockViewer)`

Mock successful viewer creation:

```typescript
import * as factory from '../../src/factory';

export function mockCreateViewerSuccess(mockViewer: MarkdownDocsViewer): void {
  const createViewerSpy = vi.spyOn(factory, 'createViewer');
  createViewerSpy.mockResolvedValue(mockViewer);
}
```

**Usage Example**:

```typescript
it('should initialize successfully', async () => {
  const mockViewer = createMockViewer();
  mockCreateViewerSuccess(mockViewer);

  const result = await init();
  expect(result).toBe(mockViewer);
});
```

##### `mockCreateViewerError(error)`

Mock viewer creation failure:

```typescript
export function mockCreateViewerError(error: Error): void {
  const createViewerSpy = vi.spyOn(factory, 'createViewer');
  createViewerSpy.mockRejectedValue(error);
}
```

**Usage Example**:

```typescript
it('should handle creation errors gracefully', async () => {
  mockCreateViewerError(new Error('Creation failed'));

  const result = await init();
  expect(result).toBeTruthy(); // Should return error viewer
  expect(result.container).toBeTruthy();
});
```

##### `createMockViewer(overrides?)`

Create mock viewer instance with customizable properties:

```typescript
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
      searchTerm: '',
      isLoading: false,
      error: null,
    }),
  };

  return { ...defaultMock, ...overrides } as MarkdownDocsViewer;
}
```

**Usage Example**:

```typescript
it('should handle theme switching', async () => {
  const mockSetTheme = vi.fn();
  const mockViewer = createMockViewer({ setTheme: mockSetTheme });
  mockCreateViewerSuccess(mockViewer);

  const viewer = await init();
  await setTheme('dark');

  expect(mockSetTheme).toHaveBeenCalledWith('dark');
});
```

### 3. Configuration Mocking (`tests/utils/mockConfigLoader.ts`)

**Purpose**: Mock configuration loading with various scenarios

#### Key Functions

##### `setupConfigMock(config)`

Mock successful configuration loading:

```typescript
import * as configLoader from '../../src/config-loader';

export function setupConfigMock(config: Partial<DocumentationConfig>): void {
  const loadConfigSpy = vi.spyOn(configLoader, 'loadConfig');
  loadConfigSpy.mockResolvedValue({ success: true, config });
}
```

**Usage Example**:

```typescript
it('should apply theme from config', async () => {
  setupConfigMock({ theme: 'github-dark' });

  const viewer = await init();
  expect(viewer.getTheme()).toMatchObject({ name: 'github-dark' });
});
```

##### `createMockConfigLoaderWithError(error)`

Mock configuration loading failure:

```typescript
export function createMockConfigLoaderWithError(error: Error): void {
  const loadConfigSpy = vi.spyOn(configLoader, 'loadConfig');
  loadConfigSpy.mockResolvedValue({ success: false, error });
}
```

**Usage Example**:

```typescript
it('should handle config loading errors', async () => {
  createMockConfigLoaderWithError(new Error('Config not found'));

  const viewer = await init();
  expect(viewer).toBeTruthy(); // Should fall back to defaults
});
```

##### Predefined Configurations

```typescript
export const DEFAULT_TEST_CONFIG = {
  title: 'Test Documentation',
  theme: 'default-light',
  search: { enabled: true },
  navigation: { enabled: true },
};

export const MINIMAL_TEST_CONFIG = {
  title: 'Minimal Test',
};

export const THEME_TEST_CONFIGS = {
  light: { theme: 'default-light' },
  dark: { theme: 'default-dark' },
  github: { theme: 'github-light' },
  invalid: { theme: 'nonexistent-theme' },
};
```

### 4. Auto-Discovery Mocking (`tests/utils/mockAutoDiscovery.ts`)

**Purpose**: Mock document discovery with various document sets and error conditions

#### Key Functions

##### `setupAutoDiscoveryMockWithOptions(options)`

Flexible auto-discovery mocking:

```typescript
import * as autoDiscovery from '../../src/auto-discovery';

export function setupAutoDiscoveryMockWithOptions(options: {
  documents?: Document[];
  directory?: string;
  error?: Error;
  timeout?: boolean;
}): void {
  const discoverSpy = vi.spyOn(autoDiscovery, 'discoverDocuments');

  if (options.error) {
    discoverSpy.mockRejectedValue(options.error);
  } else if (options.timeout) {
    // Simulate timeout scenario
    discoverSpy.mockImplementation(
      () =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Discovery timeout')), 100))
    );
  } else {
    discoverSpy.mockResolvedValue(options.documents || []);
  }
}
```

**Usage Examples**:

```typescript
// Test with documents
it('should load discovered documents', async () => {
  setupAutoDiscoveryMockWithOptions({
    documents: DEFAULT_TEST_DOCUMENTS,
  });

  const viewer = await init();
  expect(viewer.getDocuments()).toHaveLength(2);
});

// Test with no documents
it('should handle empty document set', async () => {
  setupAutoDiscoveryMockWithOptions({ documents: [] });

  const viewer = await init();
  expect(viewer.getDocuments()).toHaveLength(0);
});

// Test with discovery error
it('should handle discovery errors', async () => {
  setupAutoDiscoveryMockWithOptions({
    error: new Error('Directory not accessible'),
  });

  const viewer = await init();
  expect(viewer).toBeTruthy(); // Should handle gracefully
});
```

##### Predefined Document Sets

```typescript
export const DEFAULT_TEST_DOCUMENTS = [
  {
    id: 'readme',
    title: 'README',
    content: '# Test Documentation\n\nThis is a test document.',
    path: 'README.md',
  },
  {
    id: 'api',
    title: 'API Reference',
    content: '# API\n\n## Functions\n\n### init()',
    path: 'api/README.md',
  },
];

export const EMPTY_DOCUMENTS = [];

export const LARGE_DOCUMENT_SET = Array.from({ length: 50 }, (_, i) => ({
  id: `doc-${i}`,
  title: `Document ${i}`,
  content: `# Document ${i}\n\nContent for document ${i}`,
  path: `docs/doc-${i}.md`,
}));
```

##### Mock Scenarios

```typescript
export const mockDiscoveryScenarios = {
  success: (docs: Document[]) => setupAutoDiscoveryMockWithOptions({ documents: docs }),

  empty: () => setupAutoDiscoveryMockWithOptions({ documents: [] }),

  error: (error: Error) => setupAutoDiscoveryMockWithOptions({ error }),

  timeout: () => setupAutoDiscoveryMockWithOptions({ timeout: true }),
};
```

### 5. Viewer Instance Mocking (`tests/utils/mockViewer.ts`)

**Purpose**: Create and configure mock viewer instances for testing

#### Key Functions

##### `createMockViewer(overrides?)`

Create comprehensive mock viewer (detailed implementation shown in Factory section above)

##### `createErrorViewer(error, container?)`

Create viewer that simulates error state:

```typescript
export function createErrorViewer(error: Error, container?: HTMLElement): MarkdownDocsViewer {
  const errorContainer = container || document.createElement('div');
  errorContainer.innerHTML = `
    <div class="error-message">
      <h3>Error: ${error.message}</h3>
      <p>Unable to initialize documentation viewer.</p>
    </div>
  `;

  return createMockViewer({
    container: errorContainer,
    getState: vi.fn().mockReturnValue({
      currentDocument: null,
      searchTerm: '',
      isLoading: false,
      error: error.message,
    }),
  });
}
```

**Usage Example**:

```typescript
it('should display error in container', async () => {
  const error = new Error('Initialization failed');
  const container = document.createElement('div');
  const errorViewer = createErrorViewer(error, container);

  mockCreateViewerSuccess(errorViewer);

  const viewer = await init({ container });
  expect(container.textContent).toContain('Initialization failed');
});
```

##### Mock Viewer Scenarios

```typescript
export const mockViewerScenarios = {
  /**
   * Successful viewer with standard functionality
   */
  success: (overrides?: Partial<MarkdownDocsViewer>) => createMockViewer(overrides),

  /**
   * Viewer with theme switching capability
   */
  withThemeSupport: (initialTheme: string = 'default-light') =>
    createMockViewer({
      getTheme: vi.fn().mockReturnValue({ name: initialTheme }),
      setTheme: vi.fn(),
    }),

  /**
   * Viewer with document navigation
   */
  withDocuments: (documents: Document[]) =>
    createMockViewer({
      getDocuments: vi.fn().mockReturnValue(documents),
      getCurrentDocument: vi.fn().mockReturnValue(documents[0] || null),
    }),

  /**
   * Viewer that simulates slow operations
   */
  slow: (delay: number = 1000) =>
    createMockViewer({
      destroy: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, delay))),
      reload: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, delay))),
    }),
};
```

## Usage Patterns

### Basic Test Setup Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init, getViewer } from '../src/zero-config';
import {
  mockCreateViewerSuccess,
  setupConfigMock,
  setupAutoDiscoveryMockWithOptions,
  createMockViewer,
  DEFAULT_TEST_CONFIG,
  DEFAULT_TEST_DOCUMENTS,
} from './utils';

describe('Zero Config Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mocks
    setupConfigMock(DEFAULT_TEST_CONFIG);
    setupAutoDiscoveryMockWithOptions({ documents: DEFAULT_TEST_DOCUMENTS });
    mockCreateViewerSuccess(createMockViewer());
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  // Tests go here...
});
```

### Error Testing Pattern

```typescript
describe('Error Handling', () => {
  it('should handle configuration errors', async () => {
    // Setup error scenario
    createMockConfigLoaderWithError(new Error('Config not found'));

    // Test should not throw
    const viewer = await init();

    // Verify graceful handling
    expect(viewer).toBeTruthy();
    expect(viewer.container).toBeTruthy();
  });

  it('should handle viewer creation errors', async () => {
    // Setup factory error
    mockCreateViewerError(new Error('Creation failed'));

    // Should return error viewer
    const viewer = await init();

    // Verify error viewer functionality
    expect(viewer).toBeTruthy();
    await expect(viewer.destroy()).resolves.toBeUndefined();
  });
});
```

### Container Testing Pattern

```typescript
describe('Container Handling', () => {
  it('should use provided container', async () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const mockViewer = createMockViewer({ container });
    mockCreateViewerSuccess(mockViewer);

    const viewer = await init({ container });

    expect(viewer.container).toBe(container);
  });
});
```

### Theme Testing Pattern

```typescript
describe('Theme System', () => {
  it('should apply theme from configuration', async () => {
    // Setup theme configuration
    setupConfigMock({ theme: 'github-dark' });

    // Create viewer with theme support
    const mockViewer = mockViewerScenarios.withThemeSupport('github-dark');
    mockCreateViewerSuccess(mockViewer);

    const viewer = await init();

    expect(viewer.getTheme()).toMatchObject({ name: 'github-dark' });
  });
});
```

## Common Anti-Patterns to Avoid

### ❌ Don't Use Global Module Mocking

```typescript
// ❌ This causes circular dependencies and test hangs
vi.mock('../src/factory');
vi.mock('../src/config-loader');
vi.mock('../src/auto-discovery');
```

### ❌ Don't Import Utilities Directly

```typescript
// ❌ Can cause circular dependency issues
import { mockCreateViewerSuccess } from './utils/mockFactory';
import { setupConfigMock } from './utils/mockConfigLoader';

// ✅ Import from central hub instead
import { mockCreateViewerSuccess, setupConfigMock } from './utils';
```

### ❌ Don't Mix Mock Strategies

```typescript
// ❌ Don't mix vi.mock() with targeted mocking
vi.mock('../src/factory');
mockCreateViewerSuccess(mockViewer); // This won't work properly
```

### ❌ Don't Forget Mock Cleanup

```typescript
// ❌ Missing cleanup can cause test interference
it('test 1', () => {
  mockCreateViewerError(new Error('Test'));
  // Test logic
}); // Mock persists to next test!

// ✅ Proper cleanup
afterEach(() => {
  vi.clearAllMocks();
});
```

## Advanced Usage

### Custom Mock Configurations

```typescript
// Create specialized mock for specific test needs
const createSlowConfigLoader = (delay: number) => {
  const loadConfigSpy = vi.spyOn(configLoader, 'loadConfig');
  loadConfigSpy.mockImplementation(
    () =>
      new Promise(resolve =>
        setTimeout(() => resolve({ success: true, config: DEFAULT_TEST_CONFIG }), delay)
      )
  );
};

it('should handle slow config loading', async () => {
  createSlowConfigLoader(500);

  const start = performance.now();
  await init();
  const duration = performance.now() - start;

  expect(duration).toBeGreaterThan(500);
});
```

### Mock Chaining for Complex Scenarios

```typescript
it('should handle complex initialization scenario', async () => {
  // Chain multiple mock setups
  setupConfigMock({ theme: 'custom-theme' });
  setupAutoDiscoveryMockWithOptions({
    documents: LARGE_DOCUMENT_SET,
  });

  const mockViewer = mockViewerScenarios.withDocuments(LARGE_DOCUMENT_SET);
  mockCreateViewerSuccess(mockViewer);

  const viewer = await init();

  expect(viewer.getDocuments()).toHaveLength(50);
  expect(viewer.getTheme().name).toBe('custom-theme');
});
```

### Conditional Mocking

```typescript
const setupMockByScenario = (scenario: 'success' | 'error' | 'empty') => {
  switch (scenario) {
    case 'success':
      setupConfigMock(DEFAULT_TEST_CONFIG);
      setupAutoDiscoveryMockWithOptions({ documents: DEFAULT_TEST_DOCUMENTS });
      mockCreateViewerSuccess(createMockViewer());
      break;

    case 'error':
      createMockConfigLoaderWithError(new Error('Config error'));
      mockCreateViewerError(new Error('Viewer error'));
      break;

    case 'empty':
      setupConfigMock(DEFAULT_TEST_CONFIG);
      setupAutoDiscoveryMockWithOptions({ documents: [] });
      mockCreateViewerSuccess(createMockViewer());
      break;
  }
};

['success', 'error', 'empty'].forEach(scenario => {
  it(`should handle ${scenario} scenario`, async () => {
    setupMockByScenario(scenario as any);

    const viewer = await init();
    expect(viewer).toBeTruthy();
  });
});
```

## Debugging Mock Issues

### Common Problems and Solutions

#### Problem: Mock not being called

```typescript
// Check if spy is properly set up
it('debug mock calls', async () => {
  const spy = vi.spyOn(factory, 'createViewer');
  mockCreateViewerSuccess(createMockViewer());

  await init();

  // Debug: Check if spy was called
  console.log('Spy call count:', spy.mock.calls.length);
  console.log('Spy calls:', spy.mock.calls);

  expect(spy).toHaveBeenCalled();
});
```

#### Problem: Mock interference between tests

```typescript
// Ensure proper cleanup
afterEach(() => {
  vi.clearAllMocks(); // Clear call history
  vi.restoreAllMocks(); // Restore original implementations
});
```

#### Problem: Mock not returning expected value

```typescript
// Verify mock implementation
it('debug mock return value', async () => {
  const mockViewer = createMockViewer();
  mockCreateViewerSuccess(mockViewer);

  const spy = vi.spyOn(factory, 'createViewer');

  const result = await init();

  // Debug: Check mock implementation
  console.log('Mock implementation:', spy.getMockImplementation());
  console.log('Expected:', mockViewer);
  console.log('Actual:', result);

  expect(result).toBe(mockViewer);
});
```

## Testing the Mock Utilities

### Unit Tests for Mock Utilities

The mock utilities themselves should be tested to ensure reliability:

```typescript
// tests/utils/mockFactory.test.ts
describe('mockFactory utilities', () => {
  it('should create valid mock viewer', () => {
    const mockViewer = createMockViewer();

    expect(mockViewer.container).toBeInstanceOf(HTMLElement);
    expect(typeof mockViewer.destroy).toBe('function');
    expect(typeof mockViewer.reload).toBe('function');
    // ... test all required methods
  });

  it('should apply overrides correctly', () => {
    const customContainer = document.createElement('section');
    const mockViewer = createMockViewer({ container: customContainer });

    expect(mockViewer.container).toBe(customContainer);
  });
});
```

## Migration Checklist

When migrating existing tests to use the new mock utilities:

- [ ] Remove all `vi.mock()` statements at module level
- [ ] Import utilities from `./utils` instead of individual files
- [ ] Replace manual mock setup with utility function calls
- [ ] Add proper mock cleanup in `afterEach` hooks
- [ ] Update test assertions to work with new mock structure
- [ ] Test the migration by running the full test suite
- [ ] Verify no test hangs or timeouts occur
- [ ] Document any custom mock patterns created

## Conclusion

The mock utilities system provides a robust, maintainable foundation for testing zero-config functionality. By following the patterns and guidelines in this document, developers can:

- ✅ **Avoid circular dependencies** that caused test hangs
- ✅ **Write reliable tests** that execute quickly and predictably
- ✅ **Maintain clear test code** with reusable utility patterns
- ✅ **Debug issues easily** with targeted mocking approaches
- ✅ **Scale testing efforts** with modular, extensible utilities

This system serves as a model for testing complex JavaScript modules while avoiding the pitfalls of over-mocking and circular dependency issues.
