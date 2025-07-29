# Browser Usage Guide

This guide shows you how to use the Markdown Documentation Viewer in browser environments using git-based distribution.

## Installation Method (Git Clone/Submodule)

The library is distributed via git clone or submodule - no NPM packages required:

```bash
# Clone the repository
git clone https://github.com/AustinOrphan/markdown-docs-viewer.git
cd markdown-docs-viewer

# Install dependencies
npm install

# Build the library
npm run build

# The built files will be in dist/
# - dist/index.umd.cjs for browser usage
# - dist/index.es.js for ES modules
```

Then reference the built file in your HTML:

```html
<script src="path/to/your/built/index.umd.cjs"></script>
```

## Usage Methods

### Option 1: UMD Build (Browser Scripts)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Documentation</title>
    <!-- Optional: Add syntax highlighting styles -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css"
    />
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies -->
    <script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>
    <script src="<!-- Language files not needed - included in main bundle -->"></script>

    <!-- Load your built viewer -->
    <script src="path/to/your/built/index.umd.cjs"></script>

    <script>
      const { createViewer, themes } = window.MarkdownDocsViewer;

      const viewer = createViewer({
        container: '#docs',
        title: 'My Documentation',
        theme: themes.default.light,
        source: {
          type: 'local',
          documents: [
            {
              id: 'intro',
              title: 'Introduction',
              content: '# Welcome\n\nThis is your documentation!',
            },
          ],
        },
      });
    </script>
  </body>
</html>
```

### Option 2: ES Modules

```html
<script type="module">
  // Import from your built ES module
  import { createViewer, themes } from './path/to/your/built/index.es.js';

  const viewer = createViewer({
    container: '#docs',
    theme: themes.default.light,
    source: {
      type: 'local',
      documents: [
        /* your documents */
      ],
    },
  });
</script>
```

### Option 3: With Build Tools

```bash
# Install peer dependencies
npm install marked marked-highlight highlight.js
```

```javascript
// Import from your local build
import { createViewer, themes } from './path/to/markdown-docs-viewer/dist/index.es.js';
import 'highlight.js/styles/github.css'; // Optional styles

const viewer = createViewer({
  container: '#docs',
  theme: themes.default.light,
  source: {
    type: 'local',
    documents: [
      /* your documents */
    ],
  },
});
```

## Dependencies

The viewer requires these dependencies:

### Required

- **marked** - Markdown parser
- **DOM environment** - Browser with document/window objects

### Optional (but recommended)

- **marked-highlight** - Enhanced syntax highlighting
- **highlight.js** - Syntax highlighting engine

## Loading Dependencies

### Via CDN

```html
<!-- Required -->
<script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>

<!-- Optional: For syntax highlighting -->
<script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>

<!-- Add language support as needed -->
<script src="<!-- Language files not needed - included in main bundle -->"></script>
<script src="<!-- Language files not needed - included in main bundle -->"></script>
<script src="<!-- Language files not needed - included in main bundle -->"></script>
```

### Via NPM

```bash
npm install marked marked-highlight highlight.js
```

## Error Handling

### Graceful Degradation

The viewer handles missing dependencies gracefully:

```javascript
try {
  const viewer = createViewer({
    container: '#docs',
    source: {
      /* config */
    },
    onError: error => {
      console.error('Viewer error:', error);
      showUserFriendlyError(error);
    },
  });
} catch (error) {
  console.error('Failed to initialize:', error);
  handleInitializationError(error);
}
```

### Common Issues and Solutions

#### 1. "require is not defined"

**Problem:** Using `require()` in browser environment.

**Solution:** Use ES modules or UMD build:

```html
<!-- Instead of require(), use UMD -->
<script src="path/to/index.umd.cjs"></script>
<script>
  const { createViewer } = window.MarkdownDocsViewer;
  const viewer = createViewer(config);
</script>

<!-- Or use ES modules -->
<script type="module">
  import { MarkdownDocsViewer } from 'path/to/index.es.js';
</script>
```

#### 2. "Cannot read properties of undefined (reading 'highlightElement')"

**Problem:** highlight.js not loaded or incomplete.

**Solution:** Load highlight.js properly:

```html
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>
<script src="<!-- Language files not needed - included in main bundle -->"></script>
```

#### 3. "Container element not found"

**Problem:** Container selector doesn't match any element.

**Solution:** Ensure container exists:

```html
<div id="docs"></div>
<script>
  // Make sure container exists before creating viewer
  const container = document.getElementById('docs');
  if (container) {
    const { createViewer } = window.MarkdownDocsViewer;
    const viewer = createViewer({
      container: '#docs',
      // ...
    });
  } else {
    console.error('Container not found');
  }
</script>
```

## Complete Example

Here's a complete, working example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Documentation Viewer</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css"
    />
  </head>
  <body>
    <div id="app">
      <div id="error-container" style="display: none;"></div>
      <div id="docs-container"></div>
    </div>

    <!-- Dependencies -->
    <script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>
    <script src="<!-- Language files not needed - included in main bundle -->"></script>
    <script src="<!-- Language files not needed - included in main bundle -->"></script>
    <script src="<!-- Language files not needed - included in main bundle -->"></script>
    <script src="<!-- Language files not needed - included in main bundle -->"></script>

    <!-- Your built viewer -->
    <script src="path/to/your/built/index.umd.cjs"></script>

    <script>
      function showError(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        errorContainer.style.display = 'block';
      }

      function hideError() {
        document.getElementById('error-container').style.display = 'none';
      }

      // Check dependencies
      if (typeof marked === 'undefined') {
        showError('marked library is not loaded');
      } else if (!document.getElementById('docs-container')) {
        showError('Container element not found');
      } else {
        hideError();

        try {
          const { createViewer, themes } = window.MarkdownDocsViewer;

          const viewer = createViewer({
            container: '#docs-container',
            title: 'My Documentation',
            theme: themes.default.light,
            source: {
              type: 'local',
              documents: [
                {
                  id: 'intro',
                  title: 'Introduction',
                  category: 'Getting Started',
                  content: `# Welcome to Your Documentation

This is a complete example of the Markdown Documentation Viewer running in a browser.

## Features

- ✅ Syntax highlighting
- ✅ Search functionality  
- ✅ Responsive design
- ✅ Error handling
- ✅ Theme support

## Code Example

\`\`\`javascript
const { createViewer } = window.MarkdownDocsViewer;
const viewer = createViewer({
    container: '#docs',
    source: {
        type: 'local',
        documents: [
            { id: 'intro', title: 'Introduction', content: '# Hello World' }
        ]
    }
});
\`\`\`

Try searching for content or switching themes!
`,
                },
                {
                  id: 'api',
                  title: 'API Reference',
                  category: 'Reference',
                  content: `# API Reference

## MarkdownDocsViewer

Main class for creating documentation viewers.

### Constructor

\`\`\`typescript
import { createViewer } from './dist/index.es.js';
createViewer(config: DocumentationConfig)
\`\`\`

### Methods

#### setTheme(theme: Theme): void

Changes the current theme.

\`\`\`javascript
viewer.setTheme(darkTheme);
\`\`\`

#### destroy(): void

Destroys the viewer and cleans up resources.

\`\`\`javascript
viewer.destroy();
\`\`\`
`,
                },
              ],
            },
            navigation: {
              showCategories: true,
              collapsible: true,
            },
            search: {
              enabled: true,
              placeholder: 'Search documentation...',
            },
            render: {
              syntaxHighlighting: true,
              copyCodeButton: true,
            },
            onDocumentLoad: doc => {
              console.log('Loaded:', doc.title);
            },
            onError: error => {
              console.error('Viewer error:', error);
              showError(error.userMessage || error.message);
            },
          });

          // Add theme switcher
          const themeSwitcher = document.createElement('button');
          themeSwitcher.textContent = 'Switch to Dark Theme';
          themeSwitcher.style.cssText =
            'position: fixed; top: 20px; right: 20px; padding: 8px 16px; border: none; border-radius: 4px; background: #0969da; color: white; cursor: pointer; z-index: 1000;';

          let isDark = false;
          themeSwitcher.addEventListener('click', () => {
            isDark = !isDark;
            viewer.setTheme(isDark ? themes.default.dark : themes.default.light);
            themeSwitcher.textContent = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
          });

          document.body.appendChild(themeSwitcher);

          console.log('Documentation viewer loaded successfully!');
        } catch (error) {
          console.error('Failed to initialize viewer:', error);
          showError(error.message);
        }
      }
    </script>
  </body>
</html>
```

## Best Practices

1. **Load dependencies in order**: marked → highlight.js → marked-highlight → viewer
2. **Check for required dependencies** before initializing
3. **Use error handlers** to provide user feedback
4. **Test on different browsers** and devices
5. **Include fallbacks** for missing features
6. **Monitor console** for warnings about missing dependencies

## Browser Support

- **Modern browsers**: Full ES module support
- **Legacy browsers**: Use UMD build with polyfills if needed
- **Mobile browsers**: Fully responsive design
- **Node.js**: Not supported (browser-only library)

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify all dependencies are loaded
3. Ensure container element exists
4. Check network connectivity for CDN resources
5. Review the error handling examples above

For more help, see the [examples](../examples/) directory or create an issue on GitHub.
