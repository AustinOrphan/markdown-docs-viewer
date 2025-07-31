# Zero-Config Test Mocking Strategy Design

**Date**: 2025-07-31  
**Agent**: A (Analysis Lead)  
**Status**: Phase 2 Foundation - Comprehensive Strategy  
**Related**: analysis-report.md, GitHub Issue #49

---

## Overview

This document provides the detailed technical specification for implementing a robust, maintainable mocking strategy that eliminates the circular dependency issues causing test hangs. The strategy emphasizes targeted, function-level mocking with independent utilities.

---

## Core Design Principles

### 1. **Targeted Function Mocking**
- Mock specific functions, not entire modules
- Use `vi.spyOn()` instead of `vi.mock()`  
- Maintain clear boundaries between real and mocked code

### 2. **Utility Independence**
- Each mock utility operates independently
- No shared state between utilities
- No circular dependencies within utilities

### 3. **Predictable Execution**
- Clear, linear execution paths
- No proxy module interference
- Deterministic test outcomes

### 4. **Maintainable Patterns**
- Consistent interfaces across utilities
- Clear documentation and examples
- Easy debugging and troubleshooting

---

## Mock Utility Architecture

### Directory Structure
```
tests/utils/
├── mockConfigLoader.ts      ✅ (Complete - Agent B reference)
├── mockAutoDiscovery.ts     ✅ (Complete - Agent C reference)  
├── mockViewer.ts           ✅ (Complete - Agent D reference)
├── mockFactory.ts          ✅ (Complete - Agent E reference)
├── mockCreateViewer.ts     ❌ (To be completed by Agent E)
└── index.ts               ✅ (Utility re-exports)
```

### Universal Utility Interface

Each utility must implement this consistent pattern:

```typescript
// Standard utility interface
export interface MockUtilityPattern<TModule, TMock> {
  // Basic setup with default behavior
  setup(): MockedFunction<TModule>;
  
  // Configurable setup with options
  setupWithOptions(options: SetupOptions): MockedFunction<TModule>;
  
  // Create mock object/instance
  createMock(overrides?: Partial<TMock>): TMock;
  
  // Common scenario shortcuts
  scenarios: {
    success: () => MockedFunction<TModule>;
    error: (error: Error) => MockedFunction<TModule>;
    empty: () => MockedFunction<TModule>;
    [key: string]: () => MockedFunction<TModule>;
  };
}
```

---

## Module-Specific Strategy

### 1. ConfigLoader Mocking Strategy

**Target Module**: `src/config-loader.ts`  
**Primary Functions**: `loadConfig()`, `toDocumentationConfig()`, `generateSampleConfig()`  
**Agent**: B (Reference implementation ✅)

#### Implementation Pattern
```typescript
// Pattern: Prototype method spying
export function setupConfigMock(options: ConfigMockOptions = {}) {
  const mockInstance = createMockConfigLoader(options);
  
  return {
    loadConfigMock: vi.spyOn(ConfigLoader.prototype, 'loadConfig')
      .mockImplementation(mockInstance.loadConfig),
    mockInstance,
    teardown: () => vi.restoreAllMocks()
  };
}
```

#### Key Scenarios
- **Success**: Valid configuration loading
- **Error**: Configuration file not found  
- **Invalid**: Malformed configuration data
- **Empty**: No configuration provided

### 2. AutoDiscovery Mocking Strategy

**Target Module**: `src/auto-discovery.ts`  
**Primary Functions**: `discoverFiles()`, `validatePath()`  
**Agent**: C (Reference implementation ✅)

#### Implementation Pattern
```typescript
// Pattern: Instance method mocking with document arrays
export function setupAutoDiscoveryMock(options: AutoDiscoveryOptions = {}) {
  const { documents = DEFAULT_TEST_DOCUMENTS } = options;
  
  return {
    discoverFilesMock: vi.spyOn(AutoDiscovery.prototype, 'discoverFiles')
      .mockResolvedValue(documents),
    cleanup: () => vi.clearAllMocks()
  };
}
```

#### Key Scenarios
- **Standard**: Returns default test documents
- **Empty**: No documents found
- **Error**: File system access failure
- **Custom**: User-provided document set

### 3. Viewer Mocking Strategy

**Target Module**: `src/viewer.ts`  
**Primary Class**: `MarkdownDocsViewer`  
**Agent**: D (Reference implementation ✅)

#### Implementation Pattern
```typescript
// Pattern: Complete interface mock with method spies
export function createMockViewer(overrides: Partial<MarkdownDocsViewer> = {}): MarkdownDocsViewer {
  return {
    container: document.createElement('div'),
    destroy: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn(),
    // ... all required interface methods
    ...overrides
  } as MarkdownDocsViewer;
}
```

#### Key Scenarios
- **Standard**: Fully functional mock viewer
- **Error**: Methods that throw errors
- **Async**: Async method success/failure
- **State**: Different viewer states

### 4. Factory Mocking Strategy

**Target Module**: `src/factory.ts`  
**Primary Functions**: `createViewer()`, `quickStart()`  
**Agent**: E (Reference implementation ✅)

#### Implementation Pattern
```typescript
// Pattern: Direct function spying
export function mockCreateViewerSuccess(viewer?: MarkdownDocsViewer): MockedFunction<typeof factory.createViewer> {
  const mockViewer = viewer || createMockViewer();
  return vi.spyOn(factory, 'createViewer').mockReturnValue(mockViewer);
}

export function mockCreateViewerError(error: Error): MockedFunction<typeof factory.createViewer> {
  return vi.spyOn(factory, 'createViewer').mockImplementation(() => {
    throw error;
  });
}
```

#### Key Scenarios
- **Success**: Returns working viewer instance
- **Error**: Throws during viewer creation
- **Async**: Promise-based creation patterns
- **Config**: Different configuration handling

---

## Migration Guidelines

### From Global Mocks to Targeted Mocking

#### ❌ Anti-Pattern: Global Module Mocking
```typescript
// DON'T: Global module mocking
vi.mock('../src/viewer');
vi.mock('../src/factory');

// This creates circular dependency risks
import { init } from '../src/zero-config';
```

#### ✅ Recommended Pattern: Targeted Function Mocking
```typescript
// DO: Import real modules, mock specific functions
import * as factory from '../src/factory';
import { ConfigLoader } from '../src/config-loader';

beforeEach(() => {
  // Target specific functions only
  vi.spyOn(factory, 'createViewer').mockReturnValue(mockViewer);
  vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockResolvedValue(config);
});
```

### Test Structure Migration

#### Before: Complex Mock Setup
```typescript
beforeEach(async () => {
  // Complex dynamic imports to work around mocks
  const configLoaderModule = await import('../src/config-loader');
  ConfigLoader = configLoaderModule.ConfigLoader;
  
  // Complex spy setup
  vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(/*...*/);
});
```

#### After: Simplified Utility Usage
```typescript
beforeEach(() => {
  // Clean utility-based setup
  const configMock = setupConfigMock({ 
    config: DEFAULT_TEST_CONFIG 
  });
  const discoveryMock = setupAutoDiscoveryMock({ 
    documents: DEFAULT_TEST_DOCUMENTS 
  });
  
  mockViewer = createMockViewer();
  mockCreateViewerSuccess(mockViewer);
});
```

---

## Error Scenario Testing Patterns

### Consistent Error Testing Structure

#### Standard Error Test Pattern
```typescript
it('should handle [specific error condition]', async () => {
  // 1. Setup error condition
  const error = new Error('Specific test error');
  mockUtilityWithError(error);
  
  // 2. Execute function under test
  const result = await functionUnderTest();
  
  // 3. Verify error handling
  expect(result).toBeDefined();
  expect(result.destroy).toBeDefined();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Expected error message'),
    error
  );
  
  // 4. Verify fallback behavior
  expect(result).toMatchExpectedFallbackBehavior();
});
```

### Specific Error Scenarios

#### Container Not Found Error
```typescript
it('should handle invalid container', async () => {
  // Mock DOM query to return null
  vi.spyOn(document, 'querySelector').mockReturnValue(null);
  
  const options = { container: '#nonexistent' };
  const viewer = await init(options);
  
  expect(viewer).toBeDefined();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Container element'),
    expect.any(Error)
  );
});
```

#### Configuration Loading Error
```typescript
it('should handle config loading failure', async () => {
  const error = new Error('Config file not found');
  setupConfigMock({ loadError: error });
  
  const viewer = await init();
  
  expect(viewer).toBeDefined();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Failed to load configuration'),
    error
  );
});
```

#### Viewer Creation Error
```typescript  
it('should handle viewer creation failure', async () => {
  const error = new Error('Viewer construction failed');
  mockCreateViewerError(error);
  
  const viewer = await init();
  
  expect(viewer).toBeDefined();
  expect(viewer.container).toBeDefined();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Failed to create viewer'),
    error
  );
});
```

---

## Best Practices Documentation

### Mock Utility Design

#### 1. **Single Responsibility**
Each utility should focus on one module or closely related set of functions.

```typescript
// Good: Focused on single module
export const mockConfigLoader = {
  setup: () => { /* ConfigLoader-specific setup */ },
  // ...
};

// Bad: Mixed responsibilities  
export const mockEverything = {
  setupConfig: () => { /* ... */ },
  setupViewer: () => { /* ... */ },
  setupDiscovery: () => { /* ... */ }
};
```

#### 2. **Clear Interface Contracts**
Mock objects must fully satisfy TypeScript interfaces.

```typescript
// Good: Complete interface implementation
export function createMockViewer(): MarkdownDocsViewer {
  return {
    container: document.createElement('div'),
    destroy: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    // ... ALL required methods
  } as MarkdownDocsViewer;
}

// Bad: Incomplete interface
export function createMockViewer() {
  return {
    destroy: vi.fn()
    // Missing required methods
  };
}
```

#### 3. **Predictable State Management**
Utilities should not maintain internal state between tests.

```typescript
// Good: Stateless utility functions
export function setupConfigMock(options) {
  return {
    loadConfigMock: vi.spyOn(ConfigLoader.prototype, 'loadConfig')
      .mockImplementation(() => options.config),
    cleanup: () => vi.restoreAllMocks()
  };
}

// Bad: Stateful utility with shared state
let currentConfig;
export function setupConfigMock(options) {
  currentConfig = options.config; // Shared state risk
  // ...
}
```

### Test Organization

#### 1. **Consistent Setup Patterns**
```typescript
describe('Feature tests', () => {
  let mockViewer: MarkdownDocsViewer;
  let mockCreateViewerFn: MockedFunction<typeof createViewer>;
  
  beforeEach(() => {
    // 1. Setup DOM
    document.body.innerHTML = '<div id="docs"></div>';
    
    // 2. Setup mocks
    mockViewer = createMockViewer();
    mockCreateViewerFn = mockCreateViewerSuccess(mockViewer);
    
    // 3. Setup console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // 1. Clean DOM
    document.body.innerHTML = '';
    
    // 2. Clear mocks
    vi.clearAllMocks();
  });
});
```

#### 2. **Isolated Test Cases**
Each test should be completely independent.

```typescript
// Good: Self-contained test
it('should handle specific scenario', async () => {
  // Setup specific to this test
  const specificMock = setupSpecificMock();
  
  // Test execution
  const result = await functionUnderTest();
  
  // Verification
  expect(result).toMatchExpectedOutcome();
});

// Bad: Dependent on previous test state
it('should handle scenario B after scenario A', async () => {
  // Depends on state from previous test
  expect(globalState).toBe(expectedFromPreviousTest);
});
```

---

## Implementation Checklist

### For Each Mock Utility

#### Core Requirements
- [ ] Implements standard interface pattern
- [ ] Provides setup/setupWithOptions methods
- [ ] Includes createMock function  
- [ ] Defines common scenarios object
- [ ] Has proper TypeScript types
- [ ] Includes cleanup mechanisms

#### Quality Requirements
- [ ] Complete JSDoc documentation
- [ ] Code examples for each scenario
- [ ] Error handling demonstrations
- [ ] TypeScript interface compliance
- [ ] Independent operation (no shared state)

#### Testing Requirements
- [ ] Unit tests for utility itself
- [ ] Integration tests with real code
- [ ] Error scenario validation
- [ ] Performance verification (<2s test execution)
- [ ] Consistency checks across multiple runs

### For Test Migration

#### Structural Changes
- [ ] Remove global `vi.mock()` calls
- [ ] Replace with utility-based setup
- [ ] Implement consistent beforeEach/afterEach
- [ ] Add proper cleanup procedures

#### Functional Changes
- [ ] Convert hanging tests to new patterns
- [ ] Remove timeout protections (temporary fixes)
- [ ] Verify all error scenarios work
- [ ] Maintain or improve test coverage

#### Validation Requirements
- [ ] All tests pass consistently (10+ runs)
- [ ] Test execution time <2 seconds per test
- [ ] No hanging or timeout issues
- [ ] Clear error messages for failures

---

## Success Metrics

### Immediate Success Criteria
- **Test Stability**: 100% pass rate over 10 consecutive runs
- **Performance**: <2 seconds execution time per test
- **Reliability**: No hanging or timeout issues
- **Maintainability**: Clear, understandable test patterns

### Long-term Quality Metrics
- **Coverage**: Maintained or improved test coverage
- **Documentation**: Clear examples and patterns
- **Consistency**: Uniform approach across all tests
- **Debugging**: Easy to troubleshoot test failures

---

## Conclusion

This strategy provides a comprehensive roadmap for implementing robust, maintainable mocking utilities that eliminate circular dependency issues while improving test reliability and maintainability. The pattern-based approach ensures consistency and makes future test development more predictable and less error-prone.

**Implementation Priority**: High - Foundation for all subsequent agent work  
**Risk Level**: Low - Well-defined patterns with proven approaches  
**Success Confidence**: High - Clear specifications with validation criteria