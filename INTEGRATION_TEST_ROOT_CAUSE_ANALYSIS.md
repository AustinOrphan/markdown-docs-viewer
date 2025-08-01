# Integration Test Root Cause Analysis - 5 Why's

**Date**: August 1, 2025  
**Issue**: Integration tests failing and running slowly  
**Methodology**: 5 Why's analysis to find root causes

---

## Problem Statement

Integration tests are failing with "expected 'Choose Theme' to contain 'Setup Required'" and taking too long to run.

## 5 Why's Analysis

### Why #1: Why are integration tests failing?

**Answer**: Tests expect "Setup Required" error UI text but are getting "Choose Theme" text instead.

**Evidence**:

- config-errors.spec.ts: 17 failed tests with "Expected error message to contain 'Setup Required' but got: Choose Theme"
- container-errors.spec.ts: 13 failed tests with "expected 'Choose Theme' to contain 'Setup Required'"

### Why #2: Why are tests expecting "Setup Required" but getting "Choose Theme"?

**Answer**: The tests were written expecting error scenarios to show error UI, but the zero-config implementation is actually succeeding and showing the normal theme switcher UI.

**Evidence**:

- "Choose Theme" text comes from theme-switcher.ts:97 in normal successful viewer initialization
- Tests assume error conditions but zero-config creates working viewers with theme switchers

### Why #3: Why is zero-config succeeding when tests expect it to fail?

**Answer**: The zero-config implementation has robust fallback mechanisms that create working viewers even in error conditions, but the tests expect complete failures.

**Evidence**:

- zero-config.ts fallback logic: Uses document.body if specified container not found
- Error handling in zero-config.ts:129-177 creates fallback viewers in test environments
- Tests expect exceptions but get working viewer instances

### Why #4: Why do some tests take 38+ seconds while others take <2 seconds?

**Answer**: The slow tests use waitForErrorUI() with 3000ms timeouts waiting for error UI that never appears, while fast tests don't wait for non-existent error states.

**Evidence**:

- container-errors.spec.ts has multiple waitForErrorUI(container, 3000) calls
- Failed tests show 6058ms actual duration (timeout + retry logic)
- config-errors.spec.ts is faster (1.77s) because it doesn't use long waitForErrorUI calls

### Why #5: Why were these tests written with incorrect expectations?

**Answer**: The tests were written for an earlier version of the error handling implementation that showed different error UI, and they weren't updated when the zero-config error handling was improved.

**Evidence**:

- Tests expect "Setup Required" but current implementation shows "Viewer Creation Failed"
- Current zero-config.ts:150 shows "Viewer Creation Failed" error message
- Test patterns suggest they were written for a different error UI design

### Why #6: Why does waitForErrorUI hang for 6+ seconds?

**Answer**: The waitForErrorUI function uses a while loop with 30 attempts at 100ms intervals, but when no error UI appears (because viewer succeeds), it runs the full timeout duration before failing.

**Evidence**:

- errorScenarioHelper.ts:125 shows the polling loop with attempts counter
- In CI: false (non-CI environment), so uses full 3000ms timeout
- 30 attempts × 100ms = 3000ms, then timeout logic adds more time

---

## Root Cause Summary

The core issue is **test expectation mismatch**:

1. **Tests expect failures** → Zero-config creates successful viewers with fallbacks
2. **Tests expect "Setup Required" UI** → Implementation shows "Choose Theme" (success) or "Viewer Creation Failed" (actual errors)
3. **Tests wait for error UI that doesn't exist** → Long timeouts cause 6+ second hangs

This is a classic case of tests becoming outdated when implementation improved.

---

## Solution Strategy

### Fix #1: Update Test Expectations

- Change assertions from "Setup Required" to actual UI text
- Verify what error UI actually appears in each scenario
- Update tests to match current zero-config behavior

### Fix #2: Reduce Timeouts

- Change 3000ms waits to 500-1000ms
- Add CI-specific shorter timeouts
- Remove unnecessary waitForErrorUI calls where success is expected

### Fix #3: Fix Test Logic

- Update tests that expect failures but get successes
- Properly test the fallback behavior instead of assuming failures
- Test both success and actual failure scenarios

### Fix #4: Update Error Scenarios

- Create actual error conditions that produce the expected error UI
- Test real failure cases, not cases with fallback behavior
- Ensure error scenarios actually fail instead of falling back

---

## Implementation Plan

1. **Phase 1**: Fix UI text expectations in both test files
2. **Phase 2**: Reduce timeouts and optimize waiting logic
3. **Phase 3**: Update test scenarios to match current implementation behavior
4. **Phase 4**: Verify all tests pass quickly (<5s total)
