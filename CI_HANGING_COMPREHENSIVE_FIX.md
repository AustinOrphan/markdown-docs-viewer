# CI Hanging Comprehensive Fix Plan

**Date**: July 31, 2025  
**Issue**: Tests hanging for 3+ hours in CI across multiple platforms  
**Root Cause**: Multiple recursive setTimeout patterns without safety mechanisms

---

## Critical Findings from CI Analysis

### Test Duration Evidence

- Ubuntu 20.17.0: **3h 42m 2s** - FAILED
- Windows 20.17.0: FAILED
- Windows 22: FAILED
- Others: Still running after hours

### Root Causes Identified

#### 1. **Recursive setTimeout Anti-Pattern** (CRITICAL)

Found in multiple test utilities:

- `waitForErrorUI` - tests/integration/utils/errorScenarioHelper.ts
- `waitForContent` - tests/integration/utils/containerTestUtils.ts
- `waitForContainerContent` - tests/integration/utils/zeroConfigTestUtils.ts
- `waitForContainerContent` - tests/integration/utils/realDOMSetup.ts

**Problem**: These create infinite loops if conditions aren't met

#### 2. **Network Operations Without Timeouts**

- fetch() calls in CI can hang indefinitely
- No AbortController implementation
- CI network behavior differs from local

#### 3. **Error UI Never Appears**

- Tests wait for error UI that might not render
- Selector mismatches between test expectations and actual UI
- 3000ms timeouts turn into hours due to recursive loops

---

## Comprehensive Fix Strategy

### 1. Replace ALL Recursive setTimeout Patterns

**BEFORE** (Hanging Pattern):

```typescript
const check = () => {
  if (condition) {
    resolve(element);
    return;
  }
  if (Date.now() - startTime > timeout) {
    reject(new Error(`Timeout`));
    return;
  }
  setTimeout(check, 100); // PROBLEM: Can hang forever
};
```

**AFTER** (Safe Pattern):

```typescript
const pollInterval = 100;
const maxAttempts = Math.ceil(timeout / pollInterval);
let attempts = 0;

while (attempts < maxAttempts) {
  if (condition) {
    return element;
  }
  attempts++;
  await new Promise(resolve => setTimeout(resolve, pollInterval));
}
throw new Error(`Timeout after ${attempts} attempts`);
```

### 2. Add AbortController to ALL Fetch Operations

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ... handle response
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw error;
}
```

### 3. CI-Specific Configuration

Add environment detection and shorter timeouts:

```typescript
const IS_CI = process.env.CI === 'true';
const DEFAULT_TIMEOUT = IS_CI ? 1000 : 5000; // Shorter in CI
const MAX_POLL_ATTEMPTS = IS_CI ? 10 : 50; // Fewer attempts in CI
```

---

## Files Requiring Immediate Fixes

### Priority 1: Test Utilities with Recursive setTimeout

1. `/tests/integration/utils/errorScenarioHelper.ts` - `waitForErrorUI`
2. `/tests/integration/utils/containerTestUtils.ts` - `waitForContent`
3. `/tests/integration/utils/zeroConfigTestUtils.ts` - `waitForContainerContent`
4. `/tests/integration/utils/realDOMSetup.ts` - `waitForContainerContent`

### Priority 2: Network Operations

1. `/src/config-loader.ts` - Add AbortController to fetch
2. `/src/auto-discovery.ts` - Add AbortController to fetch
3. `/src/loader.ts` - Check for fetch operations

### Priority 3: Test Configuration

1. Add CI detection to test setup
2. Configure shorter timeouts for CI environment
3. Add maximum attempt limits to all polling operations

---

## Implementation Plan

### Step 1: Fix All waitFor\* Functions

Replace recursive setTimeout with async while loops in:

- errorScenarioHelper.ts
- containerTestUtils.ts
- zeroConfigTestUtils.ts
- realDOMSetup.ts

### Step 2: Add Fetch Timeouts

Implement AbortController pattern for all fetch operations

### Step 3: Add Safety Mechanisms

- Maximum attempt counters
- CI environment detection
- Shorter timeouts in CI

### Step 4: Test and Verify

- Run tests locally to ensure they still pass
- Push to CI and monitor execution time
- Verify no tests run longer than 5 minutes

---

## Expected Outcome

- Tests complete in < 5 minutes instead of 3+ hours
- Clear timeout errors instead of hanging
- Reliable CI pipeline across all platforms

The recursive setTimeout pattern is the smoking gun - fixing this will resolve the hanging issues.
