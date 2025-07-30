# Training Science Docs - Actual Working Fix

## Current Situation

Training-science-docs uses markdown-docs-viewer as a **git submodule** (the correct approach). However, both HTML files use **wrong API calls** that don't match the actual built library.

## What Actually Works Right Now

### Step 1: Update and Build the Submodule

```bash
cd /path/to/training-science-docs

# Update the viewer submodule to latest
cd viewer
git pull origin main
npm install
npm run build
cd ..
```

### Step 2: Fix the API Usage

Both `docs/index.html` and `docs-viewer.html` need these fixes:

#### ❌ Remove This Broken Code:

```javascript
// This is WRONG - these properties don't exist
const trainingLightTheme = createCustomTheme('training-science-light', {
  baseTheme: 'default', // ❌ Property doesn't exist
  mode: 'light', // ❌ Property doesn't exist
  colors: {
    /* ... */
  },
});

// These methods don't exist
viewer.registerTheme(trainingLightTheme); // ❌ Method doesn't exist
viewer.setTheme('training-science-light'); // ❌ Wrong usage
```

#### ✅ Replace With This Working Code:

```javascript
const { createViewer, themes } = window.MarkdownDocsViewer;

// Just use built-in themes - they work perfectly
const viewer = createViewer({
  container: '#docs',
  title: 'Training Science Documentation',
  theme: themes.default.light, // This actually exists
  source: {
    // ... your existing document config
  },
  // ... your existing navigation/search config
});
```

## Complete Working Examples

### Fixed `docs/index.html`:

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

    <!-- Dependencies from CDN -->
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

      const { createViewer, themes } = window.MarkdownDocsViewer;

      const viewer = createViewer({
        container: '#docs',
        title: 'Training Science Documentation',
        theme: themes.default.light, // Use built-in theme
        source: {
          type: 'url',
          baseUrl: 'https://raw.githubusercontent.com/AustinOrphan/training-science-docs/main',
          documents: [
            // ... your existing documents array
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

      console.log('Training Science Docs viewer initialized successfully!');
    </script>
  </body>
</html>
```

### Fixed `docs-viewer.html`:

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

    <!-- Dependencies from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/marked@14.1.2/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.1.4/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/lib/highlight.min.js"></script>
  </head>
  <body>
    <div id="docs"></div>

    <script src="./viewer/dist/markdown-docs-viewer.umd.cjs"></script>
    <script>
      // Ensure hljs is available globally
      if (typeof hljs !== 'undefined') {
        window.hljs = hljs;
      }

      const { createViewer, themes } = window.MarkdownDocsViewer;

      const viewer = createViewer({
        container: '#docs',
        title: 'Training Science Documentation',
        theme: themes.default.light, // Use built-in theme
        source: {
          type: 'local',
          basePath: '.',
          documents: [
            // ... your existing documents array
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

      console.log('Training Science Docs viewer initialized successfully!');
    </script>
  </body>
</html>
```

## Available Built-in Themes

Instead of creating custom themes, you can use any of these:

```javascript
themes.default.light; // Clean, modern light
themes.default.dark; // Clean, modern dark
themes.github.light; // GitHub light
themes.github.dark; // GitHub dark
themes.material.light; // Material Design light
themes.material.dark; // Material Design dark
themes.nord.light; // Nord light
themes.nord.dark; // Nord dark
themes.tokyo.light; // Tokyo Night light
themes.tokyo.dark; // Tokyo Night dark
// ... and more
```

## Summary of Required Changes

1. **Update submodule**: `cd viewer && git pull origin main && npm run build`
2. **Remove all `createCustomTheme` calls** - they use wrong API
3. **Remove all `registerTheme` calls** - method doesn't exist
4. **Remove all `setTheme` calls** - wrong usage pattern
5. **Use `themes.default.light`** or any other built-in theme
6. **Keep all your document configuration** - that part works fine

This approach uses **only what actually exists** in the built library and follows the proven git submodule pattern.
