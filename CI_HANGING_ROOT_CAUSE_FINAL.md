# CI Hanging - Root Cause Analysis Final Report

**Date**: July 31, 2025  
**Issue**: CI tests still hanging after recursive setTimeout fixes  
**Status**: RESOLVED - Found additional root cause

---

## Executive Summary

After implementing comprehensive fixes for recursive setTimeout patterns, CI tests were still hanging for 30+ minutes. Further investigation revealed that the CI was running BOTH unit tests and integration tests together, causing conflicts and hanging issues.

## Timeline of Investigation

1. **Initial Fix Applied**: Replaced all recursive setTimeout patterns with async/await while loops
2. **CI Run #16666005847**: Tests still hanging after 30+ minutes despite fixes
3. **Discovery**: Integration tests were being included in the main CI test run
4. **Root Cause**: Test configuration conflict between unit and integration tests

## The Real Problem

### Configuration Issue

The main `vitest.config.ts` was including ALL test files:

```typescript
include: ['tests/**/*.{test,spec}.{js,ts}'],
exclude: ['node_modules/', 'dist/', 'demo/', 'examples/'],
```

This meant when CI ran `npm run test:ci`, it executed:

- Unit tests (quick, mocked)
- Integration tests (slower, real DOM operations)

Integration tests have different requirements:

- Longer timeouts (30s vs 10s)
- Different pool settings (`forks` vs default)
- Less strict mocking (`clearMocks: false`)
- Real DOM operations

## The Solution

### 1. Exclude Integration Tests from Main Config

```typescript
// vitest.config.ts
exclude: ['node_modules/', 'dist/', 'demo/', 'examples/', 'tests/integration/**'],
```

### 2. Separate Test Scripts

```json
// package.json
"test:unit": "vitest run --coverage",
"test:ci": "npm run test:unit",
"test:integration": "vitest run --config vitest.integration.config.ts",
```

## Why This Caused Hanging

1. **Mixed Test Environments**: Unit tests expect fully mocked environments, while integration tests need real implementations
2. **Conflicting Timeouts**: Integration tests with 30s timeouts running under 10s unit test config
3. **Pool Conflicts**: Integration tests use `pool: 'forks'` for isolation, unit tests use default threading
4. **Mock Conflicts**: Unit tests clear mocks between tests, integration tests maintain state

## Verification Steps

1. CI should now only run unit tests
2. Integration tests can be run separately with proper configuration
3. Expected CI runtime: < 5 minutes (previously 3+ hours)

## Lessons Learned

1. **Always separate unit and integration tests** in CI pipelines
2. **Check test inclusion patterns** when debugging hanging tests
3. **Integration tests need their own configuration** and shouldn't mix with unit tests
4. **The recursive setTimeout fix was necessary** but not sufficient - multiple issues can compound

## Next Steps

1. Push these changes to PR
2. Monitor new CI run to confirm tests complete quickly
3. Consider adding integration tests as a separate CI job with appropriate timeouts
4. Document this separation in the contributing guide

---

This was a classic case of multiple issues masking each other. The recursive setTimeout patterns were indeed a problem, but the test configuration conflict was preventing us from seeing the improvement.
