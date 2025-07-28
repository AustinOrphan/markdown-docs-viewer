# Immediate Fixes for Training Science Docs

## Current Issues in the Files

The training-science-docs project has two main files with API issues:

1. `/docs/index.html` - Uses old API
2. `/docs-viewer.html` - Uses old API

## Required Changes

### 1. Fix docs/index.html

Replace this broken code (around line 265):

```javascript
// BROKEN - DON'T USE
const trainingLightTheme = createCustomTheme('training-science-light', {
  baseTheme: 'default',
  mode: 'light',
  colors: {
    /* ... */
  },
});
```

With this working code:

```javascript
// FIXED - USE THIS
const trainingLightTheme = createCustomTheme('default', 'light', {
  name: 'training-science-light',
  colors: {
    /* ... */
  },
});
```

### 2. Fix docs-viewer.html

Replace this broken code (around line 157):

```javascript
// BROKEN - DON'T USE
const trainingLightTheme = createCustomTheme('training-science-light', {
  baseTheme: 'default',
  mode: 'light',
  colors: {
    /* ... */
  },
});
```

With this working code:

```javascript
// FIXED - USE THIS
const trainingLightTheme = createCustomTheme('default', 'light', {
  name: 'training-science-light',
  colors: {
    /* ... */
  },
});
```

### 3. Remove .registerTheme() and .setTheme() calls

The training-science-docs files also call:

```javascript
// BROKEN - REMOVE THESE
viewer.registerTheme(trainingLightTheme);
viewer.registerTheme(trainingDarkTheme);
viewer.setTheme('training-science-light');
```

These method calls are not needed with the new API. Just pass the theme directly to createViewer:

```javascript
// FIXED - USE THIS
const viewer = createViewer({
  container: '#docs',
  theme: trainingLightTheme, // Pass theme directly
  // ... other config
});
```

## Complete Working Examples

### Fixed docs/index.html (Key Section)

```javascript
const { createViewer, themes, createCustomTheme } = window.MarkdownDocsViewer;

// Create custom themes using correct API
const trainingLightTheme = createCustomTheme('default', 'light', {
  name: 'training-science-light',
  colors: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    text: '#374151',
    textLight: '#6b7280',
    textSecondary: '#6b7280',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    code: '#7c3aed',
    codeBackground: '#f3f4f6',
    link: '#2563eb',
    linkHover: '#1d4ed8',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
});

const trainingDarkTheme = createCustomTheme('default', 'dark', {
  name: 'training-science-dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    text: '#e5e7eb',
    textLight: '#9ca3af',
    textSecondary: '#d1d5db',
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    code: '#a78bfa',
    codeBackground: '#1f2937',
    link: '#60a5fa',
    linkHover: '#93bbfc',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
  },
});

// Configuration for the training science documentation
const viewer = createViewer({
  container: '#docs',
  title: 'Training Science Documentation',
  theme: trainingLightTheme, // Use theme directly
  source: {
    type: 'url',
    baseUrl: 'https://raw.githubusercontent.com/AustinOrphan/training-science-docs/main',
    documents: [
      // ... document configuration
    ],
  },
  // ... other configuration
});
```

### Fixed docs-viewer.html (Key Section)

```javascript
const { createViewer, themes, createCustomTheme } = MarkdownDocsViewer;

// Same createCustomTheme calls as above...

// Configuration for the training science documentation
const viewer = createViewer({
  container: '#docs',
  title: 'Training Science Documentation',
  theme: trainingLightTheme, // Use theme directly
  source: {
    type: 'local',
    basePath: '.',
    documents: [
      // ... document configuration
    ],
  },
  // ... other configuration
});
```

## Summary of Changes

1. **Use correct createCustomTheme signature**: `createCustomTheme(baseName, mode, overrides)`
2. **Include name in overrides**: `{ name: 'your-theme-name', colors: {...} }`
3. **Remove .registerTheme() calls**: Not needed with new API
4. **Remove .setTheme() calls**: Pass theme directly to createViewer
5. **Pass themes directly to createViewer**: `theme: yourThemeObject`

These changes will make the training-science-docs project work correctly with the current markdown-docs-viewer API.
