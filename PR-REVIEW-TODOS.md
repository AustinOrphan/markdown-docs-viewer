# PR Review Todos

This document tracks all action items from PR review comments across PRs #36, #37, and #38.

## High Priority Issues

### PR #38 - Mobile Theme Enhancements

- [ ] **Fix innerHTML destroying event listeners** (pr38-fix-innerhtml)
  - File: `src/mobile-theme-quick-switcher.ts:203`
  - Issue: Using `innerHTML` in `updateUI()` removes event listeners attached to `.mdv-mobile-quick-themes-scroll`
  - Solution: Re-attach event listeners after re-rendering or use DOM manipulation instead

- [ ] **Define mobile breakpoint as constant** (pr38-mobile-breakpoint)
  - File: `src/theme-switcher.ts:585`
  - Issue: Hardcoded `768` breakpoint value
  - Solution: Create a shared constant for mobile breakpoint

### PR #37 - Accessibility Improvements

- [ ] **Fix useless assignment to targetIndex** (pr37-fix-targetindex)
  - File: `src/viewer.ts:1055`
  - Issue: Initial value of targetIndex is unused
  - Solution: Remove unnecessary initialization

### PR #36 - Documentation Overhaul

- [ ] **Fix theme string inconsistency** (pr36-theme-string)
  - Files: `docs/README.md:159`, `docs/quick-start.md:581`
  - Issue: Documentation contradicts CDN examples about using string vs object for themes
  - Solution: Clarify correct usage for CDN vs NPM contexts

### All PRs

- [ ] **Fix broken documentation links** (all-prs-broken-links)
  - Issue: CI reports multiple broken links in generated documentation
  - Files: Various TypeDoc-generated files
  - Solution: Update TypeDoc configuration or fix link generation

## Medium Priority Issues

### PR #38 - Mobile Theme Enhancements

- [ ] **Make popular themes list configurable** (pr38-configurable-themes)
  - File: `src/mobile-theme-quick-switcher.ts:81`
  - Issue: Hardcoded list of popular themes
  - Solution: Make themes configurable via options

- [ ] **Remove custom touch scroll implementation** (pr38-native-scroll)
  - File: `src/mobile-theme-quick-switcher.ts:180`
  - Issue: Custom JavaScript scroll may be unnecessary
  - Solution: Use native CSS `-webkit-overflow-scrolling: touch`

- [ ] **Define swipe-to-close threshold as constant** (pr38-swipe-threshold)
  - File: `src/theme-switcher.ts:334`
  - Issue: Magic number `100` for swipe threshold
  - Solution: Define as named constant

- [ ] **Consolidate touch feedback effects** (pr38-touch-feedback)
  - Files: `src/theme-switcher.ts:935,981`
  - Issue: Multiple redundant touch feedback implementations
  - Solution: Keep only the JavaScript ripple effect

### PR #37 - Accessibility Improvements

- [ ] **Use semantic HTML nav element** (pr37-semantic-nav)
  - File: `src/navigation.ts:24`
  - Issue: Using `<div>` instead of `<nav>`
  - Solution: Replace with `<nav>` element and add `role="list"` to `<ul>`

- [ ] **Use button element for collapsible categories** (pr37-button-categories)
  - File: `src/navigation.ts:69`
  - Issue: Using `<div>` for interactive element
  - Solution: Replace with `<button>` element

- [ ] **Implement aria-autocomplete functionality** (pr37-aria-autocomplete)
  - File: `src/search.ts:28`
  - Issue: `aria-autocomplete` needs JavaScript support
  - Solution: Ensure `aria-expanded` and `aria-activedescendant` are managed

- [ ] **Remove redundant title attribute** (pr37-remove-title)
  - File: `src/theme-switcher.ts:77`
  - Issue: `title` duplicates `aria-label`
  - Solution: Remove `title` attribute

- [ ] **Add visible focus indicators** (pr37-focus-indicators)
  - File: `src/theme-switcher.ts:158`
  - Issue: Focus state needs visual indication
  - Solution: Add CSS for `:focus` states

- [ ] **Change TOC live region to polite** (pr37-toc-polite)
  - File: `src/toc.ts:156`
  - Issue: Using `assertive` for non-urgent updates
  - Solution: Change to `aria-live="polite"`

- [ ] **Add passive event listeners** (pr37-passive-listeners)
  - File: `src/viewer.ts:735`
  - Issue: Better scrolling performance with passive listeners
  - Solution: Add `{ passive: true }` to scroll event listeners

- [ ] **Fix collapse icon rotation logic** (pr37-collapse-icon)
  - File: `src/viewer.ts:1123`
  - Issue: Counter-intuitive rotation direction
  - Solution: Rotate -90deg when collapsed for ▶ effect

- [ ] **Refactor announceToScreenReader to utility** (pr37-announce-utility)
  - File: `src/viewer.ts:1155`
  - Issue: Duplicated live region logic across components
  - Solution: Create shared utility function

### PR #36 - Documentation Overhaul

- [ ] **Pin CDN dependency versions** (pr36-pin-versions)
  - Files: `README.md:78`, `docs/quick-start.md:35`
  - Issue: Using `@latest` can cause breaking changes
  - Solution: Pin to specific versions

- [ ] **Simplify remote URL example** (pr36-simplify-url)
  - File: `README.md:234`
  - Issue: GitHub API example is too specific
  - Solution: Use generic example.com URL

- [ ] **Include JavaScript language pack** (pr36-js-highlight)
  - File: `docs/quick-start.md:32`
  - Issue: Missing language pack for syntax highlighting
  - Solution: Add highlight.js JavaScript language pack

- [ ] **Fix theme naming consistency** (pr36-theme-naming)
  - File: `docs/quick-start.md`
  - Issue: Inconsistent naming "tokyo" vs "Tokyo Night"
  - Solution: Use consistent naming throughout docs

## Summary

- **Total Issues:** 23
- **High Priority:** 5
- **Medium Priority:** 18

## Notes

- All PR comments from Gemini Code Assist and GitHub Advanced Security have been captured
- CI failures related to broken documentation links affect all three PRs
- Focus on high priority items first, especially the critical innerHTML issue in PR #38
