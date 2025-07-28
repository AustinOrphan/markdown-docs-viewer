# Migration Guide: Training Science Docs API Update

## 🚨 Current Status

The training-science-docs project is currently using **outdated API patterns** that will not work with the current markdown-docs-viewer build. This guide provides step-by-step instructions to fix the implementation.

## Issues Identified

1. **Using old API**: `const { defaultTheme, darkTheme }` (no longer exists)
2. **Incorrect createCustomTheme**: Using invalid signature with `baseTheme` and `mode` properties
3. **Outdated method calls**: `viewer.createCustomTheme()` and `viewer.registerTheme()`
4. **Missing build**: Using old submodule build files

# Complete Setup Instructions for Training Science Docs

## Step-by-Step Migration

### Step 1: Update the Markdown Docs Viewer Build

The training-science-docs project needs the latest build:

First, build the latest version:

#### Option A: Direct Build Integration (Recommended)

1. **Build the Latest markdown-docs-viewer**

   ```bash
   cd /path/to/markdown-docs-viewer
   npm install
   npm run build
   ```

2. **Copy the Built Files**

   ```bash
   # Copy the UMD build file
   cp dist/index.umd.cjs /path/to/training-science-docs/docs/markdown-docs-viewer.umd.js

   # Copy type definitions if needed
   cp dist/*.d.ts /path/to/training-science-docs/docs/
   ```

### Step 2: Fix the API Usage in Training Science Docs

The current training-science-docs files use outdated API patterns. Here's how to fix them:

#### Fix docs/index.html

**Current broken code:**

```javascript
const { createViewer, defaultTheme, darkTheme } = window.MarkdownDocsViewer;
const trainingLightTheme = viewer.createCustomTheme('training-science-light', {
  baseTheme: 'default',
  mode: 'light',
  colors: {
    /* ... */
  },
});
```

**Fixed code:**

```javascript
const { createViewer, themes, createCustomTheme } = window.MarkdownDocsViewer;
const trainingLightTheme = createCustomTheme('default', 'light', {
  name: 'training-science-light',
  colors: {
    /* ... */
  },
});
```

#### Fix docs-viewer.html

Same fixes as above, but also update the script source path.

### Step 3: Verify the Fix

After making these changes:

1. **Test locally**:

   ```bash
   cd training-science-docs/docs
   python -m http.server 8000
   # Open http://localhost:8000
   ```

2. **Check browser console** - should see no errors
3. **Test theme switching** - themes should load properly
4. **Test search functionality** - should work correctly

## Quick Reference: Complete Fixed Files

Both `docs-viewer.html` and `docs/index.html` need to be updated to use the new API:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Training Science Documentation</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #docs {
        height: 100vh;
      }
    </style>

    <!-- Dependencies for UMD build -->
    <script src="https://cdn.jsdelivr.net/npm/marked@14.1.2/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.1.4/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/lib/highlight.min.js"></script>
  </head>
  <body>
    <div id="docs"></div>

    <script src="markdown-docs-viewer.umd.js"></script>
    <script>
      // Ensure hljs is available globally
      if (typeof hljs !== 'undefined') {
        window.hljs = hljs;
      }

      // Use the NEW API - themes object instead of defaultTheme/darkTheme
      const { createViewer, themes, createCustomTheme } = window.MarkdownDocsViewer;

      // Configuration for the training science documentation
      const viewer = createViewer({
        container: '#docs',
        title: 'Training Science Documentation',
        theme: themes.default.light, // Use the new themes object
        source: {
          type: 'url', // or 'local' for docs-viewer.html
          baseUrl: 'https://raw.githubusercontent.com/AustinOrphan/training-science-docs/main',
          documents: [
            // ... your documents config ...
          ],
        },
        navigation: {
          showCategories: true,
          collapsible: true,
          showDescription: true,
          sortBy: 'order',
        },
        search: {
          enabled: true,
          placeholder: 'Search training science docs...',
          searchInTags: true,
          maxResults: 10,
        },
        render: {
          syntaxHighlighting: true,
          highlightTheme: 'github',
          copyCodeButton: true,
          linkTarget: '_blank',
        },
      });

      // Create custom themes using createCustomTheme
      // Using the new signature with explicit base theme and mode
      const trainingLightTheme = createCustomTheme('default', 'light', {
        name: 'training-science-light',
        colors: {
          primary: '#2563eb',
          secondary: '#3b82f6',
          text: '#374151',
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

      // Set the initial theme
      viewer.setTheme('training-science-light');
    </script>
  </body>
</html>
```

### Method 2: CDN-based Setup (Future Option)

Once we publish to a CDN, the setup would be:

```html
<!-- In the future when published to CDN -->
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer/dist/index.umd.cjs"></script>
```

### Method 3: Git Submodule (Current but Not Recommended)

If continuing with submodules:

```bash
# Update the submodule to latest
cd training-science-docs
git submodule update --remote viewer

# Build the viewer
cd viewer
npm install
npm run build

# Copy build output
cp dist/index.umd.cjs ../docs/markdown-docs-viewer.umd.js
```

## Key API Changes to Update

### Old API (No longer works):

```javascript
const { defaultTheme, darkTheme } = MarkdownDocsViewer;
viewer.createCustomTheme('name', {
  /* full theme object */
});
viewer.registerTheme(theme);
```

### New API (Use this):

```javascript
const { themes, createCustomTheme } = MarkdownDocsViewer;
// themes.default.light, themes.default.dark, etc.

// Create custom themes - Option 1: new signature with explicit base
const customTheme = createCustomTheme('default', 'light', {
  name: 'my-custom-theme',
  colors: {
    /* color overrides */
  },
});

// Create custom themes - Option 2: legacy signature (still supported)
const customTheme = createCustomTheme({
  name: 'my-custom-theme',
  colors: {
    /* complete theme object */
  },
});
```

## README Updates Needed

Remove these false claims from training-science-docs README:

````markdown
### As NPM Package

```bash
npm install @yourusername/training-science-docs
```
````

````

Replace with:

```markdown
### Installation

Currently, this documentation viewer uses the markdown-docs-viewer library which must be built from source:

1. Clone this repository
2. The viewer is included in the `docs/` directory
3. Open `docs/index.html` in a web browser or serve via GitHub Pages
````

## Deployment for GitHub Pages

1. Ensure `docs/` directory contains:
   - `index.html` (with correct API usage)
   - `markdown-docs-viewer.umd.js` (built file)
   - All markdown files are accessible via raw.githubusercontent.com

2. Enable GitHub Pages from `docs/` directory in repository settings

## Testing the Setup

1. Test locally:

   ```bash
   cd training-science-docs/docs
   python -m http.server 8000
   # Open http://localhost:8000
   ```

2. Verify:
   - Theme switcher works
   - Navigation loads all documents
   - Search functionality works
   - No console errors

## Common Issues and Solutions

### Issue: "defaultTheme is not defined"

**Solution**: Update to use `themes.default.light` instead

### Issue: "viewer.createCustomTheme is not a function"

**Solution**: Use the global `createCustomTheme` function instead

### Issue: Documents not loading from GitHub

**Solution**: Ensure CORS is handled by using raw.githubusercontent.com URLs

### Issue: Styles not applying correctly

**Solution**: Make sure the theme object structure matches the new format
