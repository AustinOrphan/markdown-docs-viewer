# Integration Test Framework

This directory contains a comprehensive integration testing framework designed for real-world testing without heavy mocking. The framework enables thorough testing of the markdown-docs-viewer library in realistic environments.

## Framework Overview

The integration test framework provides:

- **Real DOM Testing**: Uses actual DOM manipulation and browser APIs
- **Error Scenario Testing**: Comprehensive error condition simulation
- **Performance Testing**: Memory leak detection and performance measurement
- **Configuration Testing**: Real file operations and config validation
- **Zero-Config Testing**: Specialized utilities for zero-config API testing
- **Template System**: Reusable test templates for common scenarios

## Directory Structure

```
tests/integration/
├── README.md                    # This file - framework documentation
├── utils/                       # Core testing utilities
│   ├── index.ts                # Main exports
│   ├── realDOMSetup.ts         # Real DOM manipulation utilities
│   ├── errorScenarioHelper.ts  # Error scenario creation and validation
│   ├── containerTestUtils.ts   # Container testing utilities
│   ├── configTestUtils.ts      # Configuration testing utilities
│   ├── advancedTestUtils.ts    # Performance, memory, and async utilities
│   ├── zeroConfigTestUtils.ts  # Zero-config specific utilities
│   └── integrationTestTypes.ts # Comprehensive type definitions
├── templates/                   # Test templates
│   ├── container-test.template.ts    # Container testing template
│   ├── config-test.template.ts       # Configuration testing template
│   └── document-test.template.ts     # Document testing template
├── fixtures/                    # Test data and fixtures
│   ├── index.ts                # Fixture exports
│   ├── test-docs/              # Sample documents for testing
│   ├── invalid-configs/        # Invalid configuration files
│   ├── malformed-files/        # Malformed document files
│   ├── empty-docs/             # Empty document scenarios
│   └── zero-config/            # Zero-config specific fixtures
└── error-handling/             # Error-specific tests
    └── index.ts                # Error handling exports
```

## Key Features

### 1. Real DOM Testing

The framework uses actual DOM manipulation instead of mocking:

```typescript
import { setupRealDOM, createRealContainer, ContainerTester } from '../utils';

// Setup real DOM environment
const domEnv = setupRealDOM();
const container = new ContainerTester({
  id: 'test-container',
  styles: { width: '100px', height: '100px' }
});

// Real DOM operations
container.setContent('<h1>Test Content</h1>');
const element = await container.waitForContent('.test-class');
```

### 2. Error Scenario Testing

Comprehensive error condition simulation and validation:

```typescript
import { createErrorScenarios, waitForErrorUI, validateErrorUI } from '../utils';

// Create error scenario
const scenario = createErrorScenarios.containerNotFound();
await scenario.setup();

// Trigger error and validate UI
const error = await scenario.trigger();
const errorElement = await waitForErrorUI(container.element);
validateErrorUI(errorElement, {
  hasErrorMessage: true,
  errorMessageContains: 'not found'
});
```

### 3. Configuration Testing

Real configuration file operations and validation:

```typescript
import { ConfigTester, createConfigScenarios } from '../utils';

const configTester = new ConfigTester();

// Test configuration from file
const configPath = await configTester.createConfigFile(JSON.stringify({
  title: 'Test Docs',
  documents: [{ path: 'README.md', title: 'Test' }]
}));

const result = await configTester.testConfigFromFile(configPath);
expect(result.isValid).toBe(true);
```

### 4. Performance Testing

Memory leak detection and performance measurement:

```typescript
import { PerformanceMeasurer, MemoryLeakDetector } from '../utils';

const measurer = new PerformanceMeasurer();
const leakDetector = new MemoryLeakDetector();

// Measure performance
const { result, metrics } = await measurer.measure(async () => {
  return await initializeViewer();
});

// Detect memory leaks
const leakAnalysis = await leakDetector.detectLeaksInFunction(
  async () => await createAndDestroyViewer(),
  10, // iterations
  5   // threshold MB
);
```

### 5. Zero-Config Testing

Specialized utilities for zero-config API testing:

```typescript
import { ZeroConfigTestRunner, validateErrorUI } from '../utils';

const runner = new ZeroConfigTestRunner();

// Test zero-config initialization
const result = await runner.initWithTracking({
  container: '#test-container'
});

if (!result.success) {
  const errorUI = await validateErrorUI(result.container);
  expect(errorUI.hasErrorUI).toBe(true);
}
```

## Configuration

### Vitest Configuration

The framework uses a workspace configuration in `vitest.config.ts`:

```typescript
workspace: [
  'vitest.config.ts', // Unit tests
  {
    test: {
      name: 'integration',
      environment: 'jsdom',
      include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
      testTimeout: 30000, // Longer timeout for integration tests
      isolate: true,      // Test isolation
      pool: 'forks',      // Separate processes
      coverage: {
        reportsDirectory: './coverage/integration'
      }
    }
  }
]
```

### Running Integration Tests

```bash
# Run all integration tests
npm test -- --project integration

# Run specific integration test file
npm test tests/integration/zero-config.integration.test.ts

# Run integration tests with coverage
npm test -- --project integration --coverage

# Watch mode for integration tests
npm test -- --project integration --watch
```

## Usage Examples

### Container Error Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  setupRealDOM, 
  ContainerTester, 
  createErrorScenarios,
  waitForErrorUI 
} from '../utils';

describe('Container Error Integration Tests', () => {
  let domEnv;
  let containerTester;

  beforeEach(() => {
    domEnv = setupRealDOM();
  });

  afterEach(() => {
    if (containerTester) containerTester.cleanup();
    domEnv.cleanup();
  });

  it('should handle container not found error', async () => {
    const scenario = createErrorScenarios.containerNotFound();
    await scenario.setup();
    
    // Test actual error handling
    const error = await scenario.trigger();
    expect(error.message).toContain('not found');
  });
});
```

### Configuration Testing

```typescript
import { ConfigTester, parseAndValidateConfig } from '../utils';

describe('Config Integration Tests', () => {
  let configTester;

  beforeEach(() => {
    configTester = new ConfigTester();
  });

  afterEach(() => {
    configTester.cleanup();
  });

  it('should validate configuration structure', () => {
    const result = parseAndValidateConfig(JSON.stringify({
      title: 'Test Docs',
      documents: [{ path: 'test.md', title: 'Test' }]
    }));
    
    expect(result.isValid).toBe(true);
    expect(result.parsedConfig?.title).toBe('Test Docs');
  });
});
```

### Performance Testing

```typescript
import { PerformanceMeasurer, MemoryLeakDetector } from '../utils';

describe('Performance Integration Tests', () => {
  let measurer;
  let leakDetector;

  beforeEach(() => {
    measurer = new PerformanceMeasurer();
    leakDetector = new MemoryLeakDetector();
  });

  it('should measure initialization performance', async () => {
    const { metrics } = await measurer.measure(async () => {
      // Initialize viewer
      return await createViewer();
    });
    
    expect(metrics.duration).toBeLessThan(5000); // Should init within 5s
  });

  it('should detect memory leaks', async () => {
    const analysis = await leakDetector.detectLeaksInFunction(
      async () => {
        const viewer = await createViewer();
        await viewer.destroy();
      },
      5 // iterations
    );
    
    expect(analysis.hasLeak).toBe(false);
  });
});
```

## Test Templates

The framework provides ready-to-use templates for common testing scenarios:

### Container Test Template

Located at `templates/container-test.template.ts`, provides comprehensive container testing patterns including:

- Container validation
- Error UI testing
- User interaction simulation
- State change handling
- Snapshot comparisons

### Config Test Template

Located at `templates/config-test.template.ts`, covers:

- Configuration validation
- JSON parsing
- File loading
- Error scenarios
- Nested configuration testing

### Document Test Template

Located at `templates/document-test.template.ts`, includes:

- Document parsing
- Malformed content handling
- Security validation
- Performance testing
- Unicode support

## Best Practices

### 1. Real Environment Testing

- **Avoid Mocking Core Functionality**: Use real implementations whenever possible
- **Use Actual DOM Operations**: Leverage real browser APIs and DOM manipulation
- **Test Real File Operations**: Use actual file system operations where applicable

### 2. Proper Cleanup

```typescript
afterEach(async () => {
  // Clean up containers
  if (containerTester) {
    containerTester.cleanup();
  }
  
  // Clean up DOM environment
  domEnv.cleanup();
  
  // Clean up config tester
  configTester.cleanup();
});
```

### 3. Error Handling

```typescript
try {
  const result = await testFunction();
  expect(result.success).toBe(true);
} catch (error) {
  // Validate error is expected
  expect(error.message).toContain('expected error pattern');
}
```

### 4. Performance Considerations

- Use appropriate timeouts for integration tests (30s default)
- Measure performance when relevant
- Monitor memory usage in long-running tests
- Use test isolation to prevent interference

### 5. Async Operations

```typescript
// Use proper async/await patterns
const result = await asyncOperation();
expect(result).toBeDefined();

// Wait for DOM changes
const element = await waitForElement('.target-class', 5000);
expect(element).toBeDefined();

// Use retry mechanisms for flaky operations
const finalResult = await withRetry(
  async () => await flakyOperation(),
  { maxAttempts: 3, delay: 1000 }
);
```

## Debugging Integration Tests

### 1. Enable Verbose Logging

```typescript
// Add to test setup
beforeEach(() => {
  // Enable detailed logging for debugging
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    if (process.env.DEBUG_TESTS) {
      console.log('[TEST]', ...args);
    }
  });
});
```

### 2. Inspect DOM State

```typescript
// Take snapshots for debugging
const snapshot = containerTester.snapshot();
console.log('Container state:', snapshot);

// Inspect error elements
const errorInspection = inspectErrorHTML(errorElement);
console.log('Error element details:', errorInspection);
```

### 3. Performance Debugging

```typescript
// Monitor memory usage
leakDetector.takeSnapshot('before-operation');
await performOperation();
leakDetector.takeSnapshot('after-operation');

const analysis = leakDetector.analyzeLeaks();
if (analysis.hasLeak) {
  console.log('Memory leak detected:', analysis);
}
```

## Contributing

When adding new integration tests:

1. **Follow the Template Pattern**: Use existing templates as starting points
2. **Add Comprehensive Types**: Update `integrationTestTypes.ts` for new utilities
3. **Include Cleanup Logic**: Ensure all resources are properly cleaned up
4. **Test Error Scenarios**: Include both success and failure cases
5. **Document New Utilities**: Add JSDoc comments and usage examples
6. **Consider Performance**: Monitor test execution time and memory usage

## Troubleshooting

### Common Issues

1. **Tests Hanging**: Usually caused by missing cleanup or infinite loops
   - Check cleanup logic in `afterEach`
   - Verify timeout configurations
   - Monitor for unhandled promises

2. **Memory Leaks**: Often from improper resource cleanup
   - Use `MemoryLeakDetector` to identify leaks
   - Ensure viewers are destroyed properly
   - Check for event listener cleanup

3. **DOM Access Errors**: Missing DOM environment setup
   - Ensure `setupRealDOM()` is called in `beforeEach`
   - Verify jsdom environment is configured
   - Check element existence before operations

4. **Timing Issues**: Race conditions in async operations
   - Use appropriate waiting utilities
   - Increase timeouts for slow operations
   - Use retry mechanisms for flaky tests

### Getting Help

- Check existing test files for usage patterns
- Review type definitions in `integrationTestTypes.ts`
- Look at template files for comprehensive examples
- Monitor console output for debugging information