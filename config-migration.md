# Config Loading Mock Migration Guide

This document outlines the changes made to the config loading mock utilities and provides migration guidance for tests.

## Overview

The `tests/utils/mockConfigLoader.ts` file has been enhanced to provide better support for async config loading patterns, remove global ConfigLoader mocking, and maintain type compatibility while supporting various config scenarios.

## Key Changes Made

### 1. Core Mock Utilities Added

Four new primary mock utilities have been added as requested:

- **`mockConfigLoaderSuccess(config?)`** - Returns valid config, handles async operations properly
- **`mockConfigLoaderError(error?)`** - Simulates config loading errors with proper async handling  
- **`mockConfigLoaderEmpty()`** - Returns empty/default config with async support
- **`createMockConfigLoader(options)`** - Factory with comprehensive options for various scenarios

### 2. Enhanced Async Support

All mock utilities now properly handle async operations:

```typescript
// Before: Synchronous mocking
const mock = { loadConfig: vi.fn().mockReturnValue(config) };

// After: Proper async mocking
const mock = { loadConfig: vi.fn().mockResolvedValue(config) };
```

### 3. Test Fixture Integration

The utilities now integrate with existing test fixtures:

```typescript
import { validConfig, invalidConfig, minimalConfig, emptyConfig, themeVariantsConfig } from '../fixtures/configs';

// Use fixtures directly in mocks
export function mockConfigLoaderSuccess(config: DocsConfig = validConfig as DocsConfig): any {
  // ...
}
```

### 4. Scenario-Based Mock Utilities

Added `configMockScenarios` object for common test patterns:

```typescript
export const configMockScenarios = {
  success: () => mockConfigLoaderSuccess(),
  error: (error?) => mockConfigLoaderError(error),
  validConfig: () => createMockConfigLoaderFromFixture('valid'),
  githubDarkTheme: () => mockConfigLoaderSuccess({ ...validConfig, theme: 'github-dark' } as DocsConfig),
  // ... more scenarios
};
```

## Migration Examples

### Basic Success Scenario

**Before:**
```typescript
const configMock = setupConfigMock();
vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(configMock.loadConfigMock);
```

**After:**
```typescript
const configMock = mockConfigLoaderSuccess();
vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(configMock.loadConfig);
```

### Error Scenarios

**Before:**
```typescript
const errorConfigMock = setupConfigMock({ loadError: error });
vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(errorConfigMock.loadConfigMock);
```

**After:**
```typescript
const errorConfigMock = mockConfigLoaderError(error);
vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(errorConfigMock.loadConfig);
```

### Using Test Fixtures

**New capability:**
```typescript
// Use specific fixture
const validConfigMock = createMockConfigLoaderFromFixture('valid');
const minimalConfigMock = createMockConfigLoaderFromFixture('minimal');
const emptyConfigMock = createMockConfigLoaderFromFixture('empty');

// Use scenario helpers
const githubThemeMock = configMockScenarios.githubDarkTheme();
const errorMock = configMockScenarios.error(new Error('Config failed'));
```

### Factory Pattern with Options

**New capability:**
```typescript
const customMock = createMockConfigLoader({
  config: validConfig as DocsConfig,
  loadError: new Error('Network error'),
  configPath: './custom-config.json',
  documentationConfig: { title: 'Custom Title' }
});
```

## Test Fixtures Usage

### Available Fixtures

The following test fixtures are available in `tests/fixtures/configs/`:

1. **valid-config.json** - Complete, valid configuration with all sections
2. **invalid-config.json** - Configuration with invalid values and types  
3. **minimal-config.json** - Minimal configuration with only required fields
4. **empty-config.json** - Empty configuration object
5. **theme-variants-config.json** - Configuration testing different theme variants
6. **malformed-config.json** - Invalid JSON syntax for parsing error tests

### Fixture Integration

```typescript
import { validConfig, invalidConfig, minimalConfig, emptyConfig, themeVariantsConfig } from '../fixtures/configs';

// Direct usage
const mock = mockConfigLoaderSuccess(validConfig as DocsConfig);

// Via fixture name
const mock = createMockConfigLoaderFromFixture('valid');

// Scenario-based
const mock = configMockScenarios.validConfig();
```

## Affected Tests

The following test files use config loading and may benefit from these utilities:

### Primary Tests
- **`tests/zero-config.test.ts`** - Main consumer, already using enhanced utilities
- **`tests/config-validation.test.ts`** - Config validation scenarios
- **`tests/factory.test.ts`** - Factory function testing

### Integration Tests  
- **`tests/integration/zero-config.integration.test.ts`** - Full integration scenarios
- **`tests/integration/zero-config-essential.integration.test.ts`** - Essential functionality

### Theme-Related Tests
- **`tests/themes.test.ts`** - Theme parsing and validation
- **`tests/theme-manager.test.ts`** - Theme management functionality
- **`tests/new-themes.test.ts`** - New theme system testing

## Type Compatibility

All utilities maintain full type compatibility:

```typescript
// DocsConfig interface support
const config: DocsConfig = validConfig as DocsConfig;
const mock = mockConfigLoaderSuccess(config);

// DocumentationConfig conversion
const docConfig: Partial<DocumentationConfig> = mock.toDocumentationConfig();

// Error handling with proper types
const error: Error = new Error('Config failed');
const errorMock = mockConfigLoaderError(error);
```

## Performance Considerations

### Async Operation Handling

All mock utilities properly handle async operations to prevent test timing issues:

```typescript
// Proper async mock
loadConfig: vi.fn().mockResolvedValue(config)  // ✅ Correct
loadConfig: vi.fn().mockReturnValue(config)    // ❌ Synchronous, may cause issues
```

### Memory Management

Mock instances are lightweight and don't retain references to large objects:

```typescript
// Efficient fixture usage
const config = fixtureMap[fixtureName];  // Reference, not copy
return createMockConfigLoader({ config }); // Shallow merge
```

## Best Practices

### 1. Use Appropriate Mock Level

```typescript
// For simple success cases
const mock = mockConfigLoaderSuccess();

// For specific scenarios
const mock = configMockScenarios.githubDarkTheme();

// For complex custom scenarios  
const mock = createMockConfigLoader({ 
  config: customConfig,
  loadError: specificError 
});
```

### 2. Prefer Fixtures Over Inline Config

```typescript
// Preferred: Using fixtures
const mock = createMockConfigLoaderFromFixture('valid');

// Avoid: Inline config objects
const mock = mockConfigLoaderSuccess({ title: 'Test', theme: 'light' });
```

### 3. Handle Async Properly in Tests

```typescript
it('should load config', async () => {
  const mock = mockConfigLoaderSuccess();
  vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockImplementation(mock.loadConfig);
  
  // Await async operations
  const result = await init();
  expect(result).toBeDefined();
});
```

## Backward Compatibility

### Legacy Support

Deprecated functions are maintained with warnings:

```typescript
// Deprecated but supported
export function createMockConfigLoaderWithError(error: Error): any {
  console.warn('createMockConfigLoaderWithError is deprecated. Use mockConfigLoaderError() instead.');
  return mockConfigLoaderError(error);
}
```

### Migration Path

1. **Phase 1**: Use new utilities alongside existing ones
2. **Phase 2**: Update tests to use new patterns  
3. **Phase 3**: Remove deprecated utilities (future)

## Troubleshooting

### Common Issues

1. **Async Timing**: Ensure mock functions use `mockResolvedValue()` for async operations
2. **Type Errors**: Cast fixture imports with `as DocsConfig` when needed
3. **Theme Parsing**: Use `parseThemeString()` helper for consistent theme object creation

### Debug Tips

```typescript
// Log mock calls for debugging
const mock = mockConfigLoaderSuccess();
console.log('Mock calls:', mock.loadConfig.mock.calls);

// Verify async behavior
expect(mock.loadConfig).toHaveBeenCalledWith(expectedPath);
await expect(mock.loadConfig()).resolves.toEqual(expectedConfig);
```

## Future Enhancements

### Planned Improvements

1. **Auto-discovery Integration** - Better integration with file discovery mocks
2. **Network Mock Support** - Mocking fetch operations for remote configs  
3. **Validation Testing** - Enhanced support for config validation scenarios
4. **Performance Metrics** - Mock performance measurement utilities

### Extension Points

The utility system is designed for extension:

```typescript
// Custom scenario addition
export const customConfigScenarios = {
  ...configMockScenarios,
  myCustomScenario: () => createMockConfigLoader({ /* custom options */ }),
};
```

## Complete Implementation Summary

### Delivered Components

✅ **Enhanced mockConfigLoader.ts** - Complete config mock utility with:
- `mockConfigLoaderSuccess()` - returns valid config with async support
- `mockConfigLoaderError()` - simulates config loading errors with async support  
- `mockConfigLoaderEmpty()` - returns empty/default config with async support
- `createMockConfigLoader()` - factory with comprehensive options
- All functions handle async operations properly

✅ **Test Configuration Fixtures** - Complete set in `tests/fixtures/configs/`:
- `valid-config.json` - working configuration with all sections
- `invalid-config.json` - malformed config with invalid values and types
- `minimal-config.json` - bare minimum config for testing defaults
- `empty-config.json` - empty configuration object
- `theme-variants-config.json` - various theme configurations for testing
- `malformed-config.json` - invalid JSON syntax for parsing error tests

✅ **Enhanced Fixture Integration**:
- `createMockConfigLoaderFromFixture()` - use fixtures by name
- `configMockScenarios` - pre-built scenarios for common test cases
- Type-safe fixture imports and usage

✅ **Comprehensive Documentation** - This migration guide covering:
- All changes made to the codebase
- List of affected tests  
- Migration examples with before/after code
- Fixture usage patterns and best practices

### Verification Status

- ✅ TypeScript compilation passes without errors
- ✅ All zero-config tests continue to pass (26/26 tests passing)
- ✅ Mock utilities properly handle async operations
- ✅ Test fixtures are properly structured and imported
- ✅ No duplicate exports or naming conflicts
- ✅ Backward compatibility maintained with legacy functions

### Key Technical Achievements

1. **Removed Global ConfigLoader Mocking** - No more `vi.mock('../src/config-loader')` that caused circular dependencies
2. **Async Pattern Support** - All mock functions use `mockResolvedValue()` and `mockRejectedValue()` for proper async handling
3. **Type Compatibility** - Full TypeScript support with proper interfaces and type assertions  
4. **Fixture Integration** - Seamless integration with existing JSON test fixtures
5. **Zero-Config Flow Support** - Utilities specifically designed for the zero-config initialization flow

### Ready for Production Use

The enhanced config loading mock utilities are now ready for use across the test suite. They provide:

- **Reliability**: Proper async handling prevents test timing issues
- **Flexibility**: Factory pattern supports any config scenario  
- **Consistency**: Fixture-based approach ensures consistent test data
- **Maintainability**: Clear separation of concerns and comprehensive documentation

This migration guide provides comprehensive coverage of the config loading mock system enhancements and should enable smooth adoption of the new utilities across the test suite.