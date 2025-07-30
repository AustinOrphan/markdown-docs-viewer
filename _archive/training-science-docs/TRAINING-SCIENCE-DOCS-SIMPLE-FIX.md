# Training Science Docs - Simple Fix

## The Problem

Your HTML uses old API that doesn't exist:

- `createCustomTheme` with `baseTheme` and `mode` properties
- `viewer.registerTheme()` method
- `viewer.setTheme()` method

## The Solution

Use built-in themes instead of creating custom ones.

## Step 1: Update Git Submodule

```bash
cd viewer
git pull origin main
npm install
npm run build
cd ..
```

## Step 2: Replace JavaScript Code

In both `docs/index.html` and `docs-viewer.html`, replace lines 264-335 with this:

```javascript
const { createViewer, themes } = window.MarkdownDocsViewer;

const viewer = createViewer({
  container: '#docs',
  title: 'Training Science Documentation',
  theme: themes.default.light, // Just use this instead
  source: {
    // ... keep all your existing documents array exactly as-is
  },
  navigation: {
    // ... keep all your existing navigation config exactly as-is
  },
  search: {
    // ... keep all your existing search config exactly as-is
  },
  render: {
    // ... keep all your existing render config exactly as-is
  },
});
```

## Available Themes

- `themes.default.light` / `themes.default.dark`
- `themes.github.light` / `themes.github.dark`
- `themes.material.light` / `themes.material.dark`
- `themes.nord.light` / `themes.nord.dark`

## That's It

Remove all the custom theme creation code. Use a built-in theme. Everything else stays the same.
