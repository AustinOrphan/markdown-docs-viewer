# Configuration Guide

Comprehensive guide to configuring the Markdown Documentation Viewer.

## Basic Configuration

The simplest configuration requires only a container and document source:

```typescript
import { createViewer, themes } from './dist/index.es.js';

const viewer = createViewer({
  container: '#docs',
  title: 'My Documentation',
  theme: themes.github.light,
  source: {
    type: 'content',
    documents: [
      {
        id: 'welcome',
        title: 'Welcome',
        content: '# Welcome\n\nThis is your documentation!',
      },
    ],
  },
});
```

## Document Sources

### Local Files

Load markdown files from your web server:

```typescript
{
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' },
      { id: 'guide', title: 'User Guide', file: 'guide.md', category: 'Guides' }
    ]
  }
}
```

### Remote URLs

Load markdown files from URLs:

```typescript
{
  source: {
    type: 'url',
    baseUrl: 'https://raw.githubusercontent.com/user/repo/main/docs',
    documents: [
      { id: 'readme', title: 'README', file: 'README.md' },
      { id: 'api', title: 'API Docs', file: 'api.md' }
    ]
  }
}
```

### GitHub Repository

Load documentation directly from a GitHub repository:

```typescript
{
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'owner/repo/main/README.md'
      },
      {
        id: 'api',
        title: 'API Guide',
        file: 'owner/repo/main/docs/api.md'
      }
    ]
  }
}
```

### Inline Content

Provide markdown content directly:

```typescript
{
  source: {
    type: 'content',
    documents: [
      {
        id: 'welcome',
        title: 'Welcome',
        content: '# Welcome\n\nThis is inline markdown content.',
        category: 'Getting Started'
      },
      {
        id: 'guide',
        title: 'User Guide',
        content: '# User Guide\n\n## Getting Started...',
        category: 'Guides'
      }
    ]
  }
}
```

### Documents Organization

Organize documents with categories and tags:

```typescript
{
  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Introduction...',
        category: 'Getting Started',
        tags: ['beginner', 'overview'],
        order: 1
      },
      {
        id: 'advanced',
        title: 'Advanced Topics',
        content: '# Advanced...',
        category: 'Guides',
        tags: ['advanced', 'technical'],
        order: 10
      }
    ]
  }
}
```

## Theme Configuration

### Basic Theme Setup

**NPM Usage:**

```typescript
import { createViewer, themes } from './dist/index.es.js';

const viewer = createViewer({
  container: '#docs',
  theme: themes.github.dark, // Use built-in theme
  // ... other config
});
```

**CDN Usage:**

```javascript
const { createViewer, themes } = window.MarkdownDocsViewer;

const viewer = createViewer({
  container: '#docs',
  theme: themes.github.dark, // Use built-in theme
  // ... other config
});
```

**Available Built-in Themes:**

```javascript
themes.github.light / themes.github.dark;
themes.material.light / themes.material.dark;
themes.nord.light / themes.nord.dark;
themes.solarized.light / themes.solarized.dark;
themes.dracula.dark;
themes.monokai.dark;
themes.atomOne.light;
```

### Custom Themes

Define custom themes using the theme builder:

```typescript
import { createCustomTheme } from './dist/index.es.js';

const corporateTheme = createCustomTheme({
  name: 'corporate',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    accent: '#3b82f6',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    code: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  spacing: {
    unit: 4,
    containerMaxWidth: '1200px',
    sidebarWidth: '280px',
  },
});

// Use the custom theme
const viewer = createViewer({
  container: '#docs',
  theme: corporateTheme,
  // ... other config
});
```

### Brand Colors

Create a branded theme:

```typescript
{
  theme: {
    custom: {
      brand: {
        colors: {
          primary: '#ff6b35',     // Your brand primary
          secondary: '#f7931e',   // Your brand secondary
          background: '#fefefe',
          surface: '#f9f9f9',
          text: '#2d3748',
          textSecondary: '#718096',
          border: '#e2e8f0',
          accent: '#ff8c42'
        }
      }
    }
  }
}
```

## Navigation Configuration

### Basic Navigation

```typescript
{
  navigation: {
    showCategories: true,
    showTags: true,
    collapsible: true,
    showDescription: true,
    sortBy: 'title'  // 'title', 'order', or 'date'
  }
}
```

### Navigation Display Options

```typescript
{
  navigation: {
    showCategories: true,    // Group documents by category
    showTags: false,         // Show document tags
    collapsible: true,       // Allow collapsing categories
    showDescription: true,   // Show document descriptions
    sortBy: 'order'          // Sort by order property
  }
}
```

### Minimal Navigation

For simple documentation:

```typescript
{
  navigation: {
    showCategories: false,   // Flat document list
    showTags: false,
    collapsible: false,
    showDescription: false
  }
}
```

## Search Configuration

### Basic Search

```typescript
{
  search: {
    enabled: true,
    placeholder: 'Search documentation...',
    caseSensitive: false,
    fuzzySearch: true,
    searchInTags: true,
    maxResults: 50
  }
}
```

### Advanced Search Options

```typescript
{
  search: {
    enabled: true,
    placeholder: 'Search docs...',
    caseSensitive: true,      // Case-sensitive search
    fuzzySearch: false,       // Exact matching only
    searchInTags: true,       // Include tags in search
    maxResults: 25
  }
}
```

### Disable Search

```typescript
{
  search: {
    enabled: false;
  }
}
```

## Render Options

### Basic Render Configuration

```typescript
{
  render: {
    syntaxHighlighting: true,     // Enable code highlighting
    highlightTheme: 'github',     // Highlight.js theme
    copyCodeButton: true,         // Show copy button on code blocks
    linkTarget: '_blank',         // Open links in new tab
    sanitizeHtml: true            // Sanitize HTML content
  }
}
```

### Table of Contents

```typescript
{
  tableOfContents: {
    enabled: true,
    container: '#toc',           // Container for TOC
    minHeadingLevel: 2,          // Minimum heading level
    maxHeadingLevel: 4,          // Maximum heading level
    scrollSmooth: true,          // Smooth scrolling
    scrollOffset: 80,            // Offset for fixed header
    highlightOnScroll: true      // Highlight current section
  }
}
```

## Performance Options

### Performance Configuration

```typescript
{
  performance: {
    cacheSize: 50,                     // LRU cache size
    enablePersistentCache: true,       // Use localStorage cache
    enablePerformanceMonitoring: false, // Performance metrics
    enableMemoryManagement: true,       // Memory optimization
    preloadStrategy: 'adjacent',        // 'none', 'visible', 'adjacent', 'all'
    lazyLoading: {
      enabled: true,
      threshold: 0.1,                  // Intersection threshold
      rootMargin: '50px'               // Root margin
    }
  }
}
```

## Complete Configuration Example

```typescript
import { createViewer, themes, createCustomTheme } from './dist/index.es.js';

// Create a custom theme
const corporateTheme = createCustomTheme({
  name: 'corporate',
  colors: {
    primary: '#1e40af',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    accent: '#3b82f6',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
    code: 'JetBrains Mono, monospace',
  },
});

// Create the viewer
const viewer = createViewer({
  container: '#docs',
  title: 'Acme Corp Documentation',

  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Welcome to Acme Corp...',
        category: 'Getting Started',
        tags: ['overview', 'beginner'],
        order: 1,
      },
      {
        id: 'api',
        title: 'API Reference',
        content: '# API Documentation...',
        category: 'Reference',
        tags: ['api', 'technical'],
        order: 10,
      },
    ],
  },

  theme: corporateTheme,

  navigation: {
    showCategories: true,
    showTags: true,
    collapsible: true,
    showDescription: true,
    sortBy: 'order',
  },

  search: {
    enabled: true,
    placeholder: 'Search Acme documentation...',
    fuzzySearch: true,
    caseSensitive: false,
    searchInTags: true,
    maxResults: 30,
  },

  render: {
    syntaxHighlighting: true,
    highlightTheme: 'github',
    copyCodeButton: true,
    linkTarget: '_blank',
    sanitizeHtml: true,
  },

  tableOfContents: {
    enabled: true,
    minHeadingLevel: 2,
    maxHeadingLevel: 4,
    scrollSmooth: true,
    highlightOnScroll: true,
  },

  performance: {
    cacheSize: 100,
    enablePersistentCache: true,
    preloadStrategy: 'adjacent',
    lazyLoading: {
      enabled: true,
    },
  },
});
```

## Zero Configuration Setup

For the simplest possible setup, use the zero-config bundle:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies -->
    <script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>

    <!-- Load zero-config viewer -->
    <script src="zero-config.umd.cjs"></script>

    <script>
      // Auto-discovers markdown files in ./docs/ folder
      MarkdownDocsViewer.init();
    </script>
  </body>
</html>
```

### Zero-Config Options

```javascript
MarkdownDocsViewer.init({
  title: 'My Docs', // Optional: Override title
  theme: 'github-dark', // Optional: Set theme
  docsPath: './documentation', // Optional: Change docs folder
  configPath: './docs-config.json', // Optional: Use config file
});
```

### Configuration File

Create a `docs-config.json` file for persistent configuration:

```json
{
  "title": "My Documentation",
  "theme": "material-light",
  "source": {
    "path": "./docs",
    "exclude": ["**/drafts/**", "**/_*"]
  },
  "navigation": {
    "autoSort": true,
    "showCategories": true,
    "collapsible": true
  },
  "search": {
    "enabled": true,
    "placeholder": "Search docs...",
    "fuzzySearch": true
  },
  "features": {
    "tableOfContents": true,
    "codeHighlighting": true,
    "darkMode": true
  }
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  createViewer,
  DocumentationConfig,
  Document,
  Theme,
  SearchOptions,
  NavigationOptions,
} from './dist/index.es.js';

const config: DocumentationConfig = {
  container: '#docs',
  title: 'My Documentation',
  // TypeScript will provide autocomplete for all options
};

const viewer = createViewer(config);
```

## Minimal Configuration

The simplest possible configuration:

```javascript
const viewer = createViewer({
  container: '#docs',
  source: {
    type: 'content',
    documents: [
      {
        id: 'home',
        title: 'Home',
        content: '# Welcome',
      },
    ],
  },
});
```

All other options will use sensible defaults.
