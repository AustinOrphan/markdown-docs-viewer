# Training Science Docs - Console Errors Fix Guide

## Issues Found

1. **highlight.js dependency missing** - Training-science-docs issue
2. **Saved theme "training-science-light" not found** - Training-science-docs issue
3. **Syntax highlighting dependencies** - Training-science-docs issue
4. **aria-hidden focus trap** - markdown-docs-viewer issue (FIXED)

## Fixes for training-science-docs

### Fix 1: Ensure highlight.js is loaded before viewer

Replace the current script loading in `docs/index.html`:

```javascript
// CURRENT PROBLEMATIC CODE:
window.addEventListener('DOMContentLoaded', function () {
  // Ensure hljs is available globally
  if (typeof hljs !== 'undefined') {
    window.hljs = hljs;
    console.log('highlight.js version:', hljs.versionString);
  }

  // Load the viewer after dependencies are ready
  const script = document.createElement('script');
  script.src = 'markdown-docs-viewer.umd.js';
  script.onload = function () {
    initializeViewer();
  };
  document.head.appendChild(script);
});
```

With this improved version that waits for all scripts:

```javascript
// FIXED CODE:
// Wait for all external scripts to load
let scriptsLoaded = 0;
const totalScripts = 3; // marked, marked-highlight, highlight.js

function checkAllScriptsLoaded() {
  scriptsLoaded++;
  if (scriptsLoaded === totalScripts) {
    // All dependencies loaded, now load the viewer
    const script = document.createElement('script');
    script.src = 'markdown-docs-viewer.umd.js';
    script.onload = function () {
      initializeViewer();
    };
    document.head.appendChild(script);
  }
}

// Add load handlers to dependency scripts
document.querySelector('script[src*="marked.umd.js"]').onload = checkAllScriptsLoaded;
document.querySelector('script[src*="marked-highlight"]').onload = checkAllScriptsLoaded;
document.querySelector('script[src*="highlight.js"]').onload = checkAllScriptsLoaded;
```

### Fix 2: Clear old saved themes

The `initializeViewer` function already tries to clear old themes, but it needs to be more thorough:

```javascript
function initializeViewer() {
  // Clear ALL old theme references
  const storageKey = 'training-docs-theme';
  localStorage.removeItem(storageKey);

  // Also clear any viewer-specific theme storage
  localStorage.removeItem('mdv-theme');
  localStorage.removeItem('mdv-selected-theme');

  const { createViewer, themes } = window.MarkdownDocsViewer;

  // Rest of your viewer configuration...
}
```

### Fix 3: Complete Working Solution

Here's the complete fixed `docs/index.html` script section:

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

    <script>
      // Track script loading
      let depsLoaded = 0;

      function dependencyLoaded() {
        depsLoaded++;
        if (depsLoaded === 3) {
          // All dependencies ready, load viewer
          loadViewer();
        }
      }

      function loadViewer() {
        const script = document.createElement('script');
        script.src = 'markdown-docs-viewer.umd.js';
        script.onload = function () {
          // Clear any stale theme data
          localStorage.removeItem('training-docs-theme');
          localStorage.removeItem('mdv-theme');
          localStorage.removeItem('mdv-selected-theme');

          // Initialize viewer
          const { createViewer, themes } = window.MarkdownDocsViewer;

          const viewer = createViewer({
            container: '#docs',
            title: 'Training Science Documentation',
            theme: themes.default.light, // Use built-in theme
            source: {
              // ... your document configuration
            },
            // ... rest of your config
          });

          console.log('Viewer initialized successfully');
        };
        script.onerror = function () {
          console.error('Failed to load markdown-docs-viewer.umd.js');
        };
        document.head.appendChild(script);
      }

      // Monitor dependency loading
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        if (script.src.includes('marked') || script.src.includes('highlight')) {
          script.addEventListener('load', dependencyLoaded);
          script.addEventListener('error', () => {
            console.error('Failed to load dependency:', script.src);
          });
        }
      });

      // Fallback if scripts already loaded
      window.addEventListener('DOMContentLoaded', function () {
        setTimeout(() => {
          if (
            typeof marked !== 'undefined' &&
            typeof hljs !== 'undefined' &&
            typeof markedHighlight !== 'undefined'
          ) {
            if (depsLoaded < 3) {
              loadViewer();
            }
          }
        }, 100);
      });
    </script>
  </body>
</html>
```

## Summary

1. **Dependency Loading**: Fixed by ensuring all scripts are loaded before initializing the viewer
2. **Theme Resolution**: Fixed by clearing old localStorage entries for non-existent themes
3. **aria-hidden Issue**: Fixed in markdown-docs-viewer by moving focus before setting aria-hidden

The training-science-docs site should update their HTML file with the improved script loading logic to eliminate these console errors.
