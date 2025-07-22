# Markdown Docs Viewer

A generic, themeable, and highly configurable markdown documentation viewer that can be used as a standalone component or integrated into any web application.

## Features

- 📚 **Multiple Document Sources**: Local files, URLs, GitHub repos, or inline content
- 🎨 **Themeable**: Built-in light/dark themes with full customization
- 🔍 **Search**: Built-in search functionality with configurable options
- 📱 **Responsive**: Mobile-friendly with collapsible sidebar
- 🎯 **Framework Agnostic**: Pure TypeScript/JavaScript, works anywhere
- ⚡ **Fast**: Efficient document loading with caching
- 🔧 **Configurable**: Extensive configuration options
- 📦 **Small**: Minimal dependencies, tree-shakeable

## Installation

### NPM (Recommended for build tools)

```bash
npm install @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
```

### CDN (Quick start for browsers)

```html
<!-- Load dependencies -->
<script src="https://unpkg.com/marked@12.0.0/marked.min.js"></script>
<script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>

<!-- Load the viewer -->
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>
```

### ES Modules (Modern browsers)

```html
<script type="module">
  import { MarkdownDocsViewer } from 'https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.es.js';
</script>
```

## Quick Start

### NPM/Bundler Usage

```javascript
import { MarkdownDocsViewer, defaultTheme } from '@austinorphan/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
  container: '#docs',
  theme: defaultTheme,
  source: {
    type: 'local',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Welcome\n\nThis is the introduction.',
      },
      {
        id: 'guide',
        title: 'User Guide',
        content: '# User Guide\n\nLearn how to use the system.',
      },
    ],
  },
});
```

### CDN/Browser Usage

```html
<div id="docs"></div>

<script>
  const { MarkdownDocsViewer, defaultTheme } = window.MarkdownDocsViewer;

  const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: defaultTheme,
    source: {
      type: 'local',
      documents: [
        {
          id: 'intro',
          title: 'Introduction',
          content: '# Welcome\n\nThis is the introduction.',
        },
      ],
    },
  });
</script>
```

## Configuration

### Document Sources

#### Local Files (served by your web server)

```javascript
{
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' },
      { id: 'guide', title: 'Guide', file: 'guide.md' }
    ]
  }
}
```

#### Remote URLs

```javascript
{
  source: {
    type: 'url',
    baseUrl: 'https://example.com/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' }
    ],
    headers: {
      'Authorization': 'Bearer token'
    }
  }
}
```

#### GitHub Repository

```javascript
{
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'microsoft/vscode/main/README.md'
      }
    ]
  }
}
```

#### Inline Content

```javascript
{
  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Introduction\n\nContent here...'
      }
    ]
  }
}
```

### Themes

#### Using Built-in Themes

```javascript
import { createViewer, darkTheme } from '@austinorphan/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  theme: darkTheme,
  // ... other config
});
```

#### Custom Theme

```javascript
import { createCustomTheme } from '@austinorphan/markdown-docs-viewer';

const myTheme = createCustomTheme({
  name: 'my-theme',
  colors: {
    primary: '#007acc',
    background: '#1e1e1e',
    // ... other colors
  },
});
```

### Navigation Options

```javascript
{
  navigation: {
    showCategories: true,      // Group by categories
    showTags: true,           // Display document tags
    collapsible: true,        // Collapsible categories
    showDescription: true,    // Show document descriptions
    sortBy: 'order'          // 'title' | 'order' | 'date'
  }
}
```

### Search Options

```javascript
{
  search: {
    enabled: true,
    placeholder: 'Search docs...',
    caseSensitive: false,
    fuzzySearch: false,
    searchInTags: true,
    maxResults: 10
  }
}
```

### Render Options

```javascript
{
  render: {
    syntaxHighlighting: true,
    highlightTheme: 'github-dark',
    copyCodeButton: true,
    linkTarget: '_blank',
    sanitizeHtml: true
  }
}
```

## Document Structure

```typescript
interface Document {
  id: string; // Unique identifier
  title: string; // Display title
  file?: string; // File path (for external sources)
  content?: string; // Inline content
  description?: string; // Short description
  category?: string; // Category for grouping
  tags?: string[]; // Tags for filtering
  order?: number; // Sort order
}
```

## API

### Methods

```javascript
// Create viewer
const viewer = createViewer(config);

// Change theme dynamically
viewer.setTheme(newTheme);

// Refresh documents
await viewer.refresh();

// Clean up
viewer.destroy();
```

### Events

```javascript
{
  onDocumentLoad: (doc) => {
    console.log('Loaded:', doc.title);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
}
```

## Styling

The viewer uses CSS custom properties that can be overridden:

```css
.mdv-app {
  --mdv-primary: #3b82f6;
  --mdv-background: #ffffff;
  /* ... other variables */
}
```

Or provide custom CSS in the theme:

```javascript
{
  theme: {
    customCSS: `
      .mdv-app { font-size: 16px; }
      .mdv-nav-link { padding: 1rem; }
    `;
  }
}
```

## Examples

### Basic Documentation Site

```javascript
createViewer({
  container: '#app',
  title: 'My Project Docs',
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md', order: 1 },
      { id: 'install', title: 'Installation', file: 'install.md', order: 2 },
      { id: 'api', title: 'API Reference', file: 'api.md', order: 3 },
    ],
  },
});
```

### Multi-Category Documentation

```javascript
createViewer({
  container: '#app',
  source: {
    type: 'content',
    documents: [
      // Getting Started
      { id: 'intro', title: 'Introduction', category: 'Getting Started', order: 1 },
      { id: 'install', title: 'Installation', category: 'Getting Started', order: 2 },

      // API Reference
      { id: 'api-overview', title: 'Overview', category: 'API Reference', order: 1 },
      { id: 'api-methods', title: 'Methods', category: 'API Reference', order: 2 },

      // Examples
      { id: 'example-basic', title: 'Basic Example', category: 'Examples', order: 1 },
      { id: 'example-advanced', title: 'Advanced Example', category: 'Examples', order: 2 },
    ],
  },
  navigation: {
    showCategories: true,
    collapsible: true,
  },
});
```

## Advanced Features

### Export Documentation

Export your documentation to PDF or HTML:

```javascript
import { ExportManager, createExportOptions } from '@austinorphan/markdown-docs-viewer';

const exportManager = new ExportManager(viewer);

// Export to PDF (requires html2pdf.js)
const pdfOptions = createExportOptions({
  format: 'pdf',
  filename: 'documentation.pdf',
  includeTheme: true,
  includeTOC: true,
  pdfOptions: {
    format: 'a4',
    orientation: 'portrait',
  },
});

const pdfBlob = await exportManager.export(pdfOptions);

// Export to HTML
const htmlOptions = createExportOptions({
  format: 'html',
  includeTheme: true,
  embedAssets: true,
});

const htmlString = await exportManager.export(htmlOptions);
```

### Internationalization (i18n)

Add multi-language support:

```javascript
import { I18nManager, createI18nConfig } from '@austinorphan/markdown-docs-viewer';

const i18nConfig = createI18nConfig({
  locale: 'es',
  fallbackLocale: 'en',
  messages: {
    es: {
      app: {
        title: 'Documentación',
        loading: 'Cargando...',
        welcome: 'Bienvenido a la Documentación',
      },
    },
  },
});

const i18n = new I18nManager(i18nConfig);

// Use in your app
const title = i18n.t('app.title');
i18n.setLocale('en'); // Switch languages
```

### Table of Contents

Auto-generate table of contents:

```javascript
import { TableOfContents } from '@austinorphan/markdown-docs-viewer';

const toc = new TableOfContents({
  enabled: true,
  maxDepth: 3,
  sticky: true,
  scrollSpy: true,
  position: 'right',
});

// Generate TOC from markdown
const tocItems = toc.generate(markdownContent);
const tocHtml = toc.render();

// Initialize scroll spy
toc.initScrollSpy(contentContainer);
```

### Advanced Search

Enhanced search with filters and highlighting:

```javascript
import { AdvancedSearchManager } from '@austinorphan/markdown-docs-viewer';

const searchManager = new AdvancedSearchManager(documents, {
  highlighting: true,
  searchHistory: true,
  filters: {
    categories: ['Guides', 'API'],
    tags: ['javascript', 'typescript'],
    dateRange: {
      from: new Date('2024-01-01'),
      to: new Date(),
    },
  },
});

// Search with filters
const results = searchManager.search('async functions');

// Get search suggestions
const suggestions = searchManager.getSuggestions('java');

// Access search history
const history = searchManager.getSearchHistory();
```

### Print Styles

Optimized printing support:

```javascript
import { generatePrintStyles, addPrintUtilities } from '@austinorphan/markdown-docs-viewer';

// Add print styles to your theme
const printStyles = generatePrintStyles(theme);

// Add print utilities (print button, page breaks)
addPrintUtilities(container);

// Generate print preview
const preview = generatePrintPreview(content, theme);
```

## Performance Features

### Caching

```javascript
import { LRUCache, PersistentCache } from '@austinorphan/markdown-docs-viewer';

// LRU Cache for in-memory caching
const cache = new LRUCache(50); // 50 items max
cache.set('key', 'value');

// Persistent cache with localStorage
const persistentCache = new PersistentCache('docs-cache');
persistentCache.set('key', 'value');
```

### Lazy Loading

```javascript
import { LazyLoader } from '@austinorphan/markdown-docs-viewer';

const lazyLoader = new LazyLoader({
  threshold: 0.1,
  rootMargin: '50px',
});

lazyLoader.observe(element, () => {
  // Load content when element is visible
});
```

### Performance Monitoring

```javascript
import { PerformanceMonitor } from '@austinorphan/markdown-docs-viewer';

const monitor = PerformanceMonitor.getInstance();
monitor.startMeasure('operation');
// ... do work
monitor.endMeasure('operation');

const metrics = monitor.getMetrics();
```

## Documentation

- 📖 **[Browser Usage Guide](docs/BROWSER_USAGE.md)** - Complete guide for using in browsers
- 🎨 **[Theming Guide](docs/THEMING.md)** - Comprehensive theming documentation
- 🎯 **[Theming Visual Guide](docs/THEMING-VISUAL-GUIDE.md)** - Visual examples and customization
- 🌐 **[CDN Example](examples/cdn-example.html)** - Working CDN example
- 💻 **[Browser Examples](examples/browser-usage.html)** - Multiple usage examples
- 🎨 **[Theme Demo](examples/theming-demo.html)** - Interactive theme demonstration
- ⚙️ **[Configuration Guide](docs/CONFIGURATION.md)** - Detailed configuration options
- 📚 **[API Reference](docs/API.md)** - Complete API documentation

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ ES Modules and UMD support

## Troubleshooting

### Common Issues

**"require is not defined"** - Use UMD build or ES modules in browser:

```html
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer/dist/index.umd.cjs"></script>
```

**"Cannot read properties of undefined (reading 'highlightElement')"** - Load highlight.js:

```html
<script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>
```

**"Container element not found"** - Ensure container exists:

```javascript
// Wait for DOM or ensure element exists
const viewer = new MarkdownDocsViewer({ container: '#existing-element' });
```

See the [Browser Usage Guide](docs/BROWSER_USAGE.md) for more troubleshooting.

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
