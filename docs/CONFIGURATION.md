# Configuration Guide

Comprehensive guide to configuring the Markdown Documentation Viewer.

## Basic Configuration

The simplest configuration requires only a title and document sources:

```typescript
const config = {
  title: 'My Documentation',
  sources: [{ type: 'local', path: './docs/' }],
};
```

## Document Sources

### Local Files

Load markdown files from a local directory:

```typescript
{
  type: 'local',
  path: './docs/'  // Path to directory containing markdown files
}
```

### Remote URLs

Load markdown files from URLs:

```typescript
{
  type: 'url',
  url: 'https://example.com/docs/api.md'
}
```

### GitHub Repository

Load documentation directly from a GitHub repository:

```typescript
{
  type: 'github',
  owner: 'username',
  repo: 'repository-name',
  branch: 'main',  // Optional, defaults to 'main'
  path: 'docs/'    // Optional, defaults to repository root
}
```

### Inline Content

Provide markdown content directly:

```typescript
{
  type: 'content',
  content: '# Welcome\n\nThis is inline markdown content.',
  metadata: {
    id: 'welcome',
    title: 'Welcome Page',
    path: 'welcome.md'
  }
}
```

### Multiple Sources

Combine different source types:

```typescript
{
  sources: [
    { type: 'local', path: './docs/' },
    { type: 'github', owner: 'company', repo: 'api-docs' },
    { type: 'url', url: 'https://external.com/integration.md' },
  ];
}
```

## Theme Configuration

### Basic Theme Setup

**NPM Usage:**

```typescript
import { createViewer, darkTheme } from '@austinorphan/markdown-docs-viewer';

{
  theme: darkTheme,      // Use theme object (recommended)
  // OR
  theme: 'dark',         // Use theme name string (NPM only)
}
```

**CDN Usage:**

```javascript
const { MarkdownDocsViewer, darkTheme } = window.MarkdownDocsViewer;

{
  theme: darkTheme,      // Must use theme object in CDN context
}
```

### Custom Themes

Define custom themes using the theme builder:

```typescript
import { createCustomTheme } from '@austinorphan/markdown-docs-viewer';

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
    enabled: true,
    showSearch: true,
    showThemeToggle: true,
    position: 'left'  // 'left', 'right', or 'top'
  }
}
```

### Custom Navigation Items

Add custom links and sections:

```typescript
{
  navigation: {
    enabled: true,
    customItems: [
      {
        type: 'link',
        title: 'API Reference',
        url: 'https://api.example.com'
      },
      {
        type: 'separator'
      },
      {
        type: 'section',
        title: 'External Resources',
        items: [
          { title: 'GitHub', url: 'https://github.com/user/repo' },
          { title: 'Issues', url: 'https://github.com/user/repo/issues' }
        ]
      }
    ]
  }
}
```

### Hide Navigation

For embedded use cases:

```typescript
{
  navigation: {
    enabled: false;
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
    minQueryLength: 2,
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
    minQueryLength: 3,
    maxResults: 25,
    highlightResults: true,
    fuzzySearch: true,  // Enable fuzzy matching
    searchFields: ['title', 'content', 'tags']  // Fields to search
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

## Feature Configuration

### Enable/Disable Features

```typescript
{
  features: {
    codeHighlighting: true,     // Syntax highlighting
    mathRendering: true,        // LaTeX math support
    mermaidDiagrams: true,      // Mermaid diagram support
    tableOfContents: true,      // Auto-generated TOC
    printMode: true,            // Print-friendly styling
    responsiveDesign: true      // Mobile-responsive layout
  }
}
```

### Code Highlighting

```typescript
{
  features: {
    codeHighlighting: {
      enabled: true,
      theme: 'github',  // highlight.js theme
      languages: ['javascript', 'typescript', 'python', 'bash']
    }
  }
}
```

## Callback Configuration

### Event Handlers

```typescript
{
  callbacks: {
    onDocumentLoad: (document) => {
      console.log(`Loaded: ${document.title}`);
      // Update page title
      document.title = `${document.title} - My Docs`;
    },

    onThemeChange: (theme) => {
      console.log(`Theme changed to: ${theme}`);
      // Store user preference
      localStorage.setItem('docs-theme', theme);
    },

    onSearchQuery: (query, results) => {
      console.log(`Search: "${query}" (${results.length} results)`);
      // Analytics tracking
      analytics.track('documentation_search', { query, resultCount: results.length });
    },

    onError: (error, context) => {
      console.error(`Error in ${context}:`, error);
      // Error reporting
      errorReporting.captureException(error, { context });
    },

    onNavigationChange: (path) => {
      console.log(`Navigated to: ${path}`);
      // Update URL without page reload
      history.pushState(null, '', `#${path}`);
    }
  }
}
```

## Complete Configuration Example

```typescript
const config = {
  title: 'Acme Corp Documentation',

  sources: [
    { type: 'local', path: './docs/' },
    {
      type: 'github',
      owner: 'acmecorp',
      repo: 'api-docs',
      branch: 'main',
    },
  ],

  theme: {
    default: 'corporate',
    allowUserToggle: true,
    custom: {
      corporate: {
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
      },
    },
  },

  navigation: {
    enabled: true,
    showSearch: true,
    showThemeToggle: true,
    position: 'left',
    customItems: [
      {
        type: 'link',
        title: 'API Reference',
        url: 'https://api.acmecorp.com',
      },
      {
        type: 'separator',
      },
      {
        type: 'section',
        title: 'Support',
        items: [
          { title: 'Help Center', url: 'https://help.acmecorp.com' },
          { title: 'Contact Us', url: 'mailto:support@acmecorp.com' },
        ],
      },
    ],
  },

  search: {
    enabled: true,
    placeholder: 'Search Acme documentation...',
    minQueryLength: 2,
    maxResults: 30,
    highlightResults: true,
    fuzzySearch: true,
  },

  features: {
    codeHighlighting: true,
    mathRendering: false,
    mermaidDiagrams: true,
    tableOfContents: true,
    printMode: true,
    responsiveDesign: true,
  },

  callbacks: {
    onDocumentLoad: document => {
      document.title = `${document.title} - Acme Docs`;
      // Google Analytics page view
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href,
      });
    },

    onThemeChange: theme => {
      localStorage.setItem('acme-docs-theme', theme);
    },

    onSearchQuery: (query, results) => {
      // Track search analytics
      gtag('event', 'search', {
        search_term: query,
        number_of_results: results.length,
      });
    },

    onError: (error, context) => {
      console.error(`Docs error in ${context}:`, error);
      // Send to error tracking service
      Sentry.captureException(error, {
        tags: { context },
        extra: { timestamp: new Date().toISOString() },
      });
    },
  },
};
```

## Environment-Specific Configurations

### Development

```typescript
const devConfig = {
  ...baseConfig,
  features: {
    ...baseConfig.features,
    debugMode: true,
  },
  callbacks: {
    ...baseConfig.callbacks,
    onError: (error, context) => {
      console.error(`DEV ERROR in ${context}:`, error);
      // Show detailed error in development
      throw error;
    },
  },
};
```

### Production

```typescript
const prodConfig = {
  ...baseConfig,
  features: {
    ...baseConfig.features,
    debugMode: false,
  },
  callbacks: {
    ...baseConfig.callbacks,
    onError: (error, context) => {
      // Silent error handling in production
      errorReporting.captureException(error, { context });
    },
  },
};
```

## Validation and Defaults

The library validates all configuration options and provides sensible defaults:

```typescript
// Minimal valid configuration
const minConfig = {
  title: 'Documentation',
  sources: [{ type: 'local', path: './docs/' }],
};

// All other options will use defaults:
// - theme: { default: 'light', allowUserToggle: true }
// - navigation: { enabled: true, showSearch: true, showThemeToggle: true }
// - search: { enabled: true, minQueryLength: 2, maxResults: 50 }
// - features: all enabled
```
