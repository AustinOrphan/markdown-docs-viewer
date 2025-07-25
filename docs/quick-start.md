# Quick Start Guide

Get your markdown documentation site up and running in just 5 minutes!

## Overview

The Markdown Docs Viewer transforms your markdown files into a beautiful, searchable documentation website. This guide will walk you through the fastest ways to get started.

## Method 1: CDN (No Build Step) ⚡

Perfect for prototyping or simple documentation sites.

### 1. Create an HTML file

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Documentation</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #docs { height: 100vh; }
  </style>
</head>
<body>
  <div id="docs"></div>

  <!-- Dependencies -->
  <script src="https://unpkg.com/marked@12.0.0/marked.min.js"></script>
  <script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>
  <script src="https://unpkg.com/highlight.js@11.9.0/lib/languages/javascript.min.js"></script>

  <!-- Markdown Docs Viewer -->
  <script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>

  <script>
    const { createViewer, themes } = window.MarkdownDocsViewer;

    // Your documentation content
    const docs = [
      {
        id: 'welcome',
        title: '👋 Welcome',
        content: `
# Welcome to My Documentation

This documentation site was created in just **5 minutes** using the Markdown Docs Viewer!

## Features

- ✨ **Beautiful Themes** - Choose from 11 built-in themes
- 🔍 **Powerful Search** - Find content instantly
- 📱 **Mobile Ready** - Works perfectly on all devices
- ⚡ **Fast Loading** - Optimized for performance

## Getting Started

Use the sidebar to navigate between sections. Try the search bar at the top to find specific topics.

## Code Example

\`\`\`javascript
const { createViewer, themes } = window.MarkdownDocsViewer;
const viewer = createViewer({
  container: '#docs',
  theme: themes.github.dark,
  source: { type: 'content', documents: [...] }
});
\`\`\`

Happy documenting! 🚀
        `
      },
      {
        id: 'installation',
        title: '📦 Installation',
        category: 'Getting Started',
        content: `
# Installation Guide

## Package Managers

### npm
\`\`\`bash
npm install @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
\`\`\`

### yarn
\`\`\`bash
yarn add @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
\`\`\`

### pnpm
\`\`\`bash
pnpm add @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
\`\`\`

## CDN

For quick prototyping, use our CDN:

\`\`\`html
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>
\`\`\`

## Next Steps

1. [Basic Usage](api) - Learn the fundamentals
2. [Theming](theming) - Customize the appearance
3. [Advanced Features](advanced) - Explore powerful features
        `
      },
      {
        id: 'api',
        title: '🛠 Basic Usage',
        category: 'Getting Started',
        content: `
# Basic Usage

## Creating a Viewer

\`\`\`javascript
import { createViewer } from '@austinorphan/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Hello World\\n\\nWelcome to my docs!'
      }
    ]
  }
});
\`\`\`

## Document Sources

### Local Files
\`\`\`javascript
{
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'guide', title: 'Guide', file: 'guide.md' }
    ]
  }
}
\`\`\`

### GitHub Repository
\`\`\`javascript
{
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'owner/repo/branch/README.md'
      }
    ]
  }
}
\`\`\`

### Remote URLs
\`\`\`javascript
{
  source: {
    type: 'url',
    baseUrl: 'https://example.com/docs',
    documents: [
      { id: 'api', title: 'API', file: 'api.md' }
    ]
  }
}
\`\`\`

## Methods

\`\`\`javascript
// Change theme
viewer.setTheme('github-dark');

// Refresh documents
await viewer.refresh();

// Clean up
viewer.destroy();
\`\`\`
        `
      },
      {
        id: 'theming',
        title: '🎨 Theming',
        category: 'Customization',
        content: `
# Theming

## Built-in Themes

Choose from 11 beautiful themes, each with light and dark variants:

- **default** - Clean and modern
- **github** - GitHub-inspired
- **material** - Google Material Design
- **vscode** - Visual Studio Code
- **nord** - Arctic-inspired
- **dracula** - Popular dark theme
- **Tokyo Night** - Vibrant night theme
- **solarized** - Eye-friendly colors
- **monokai** - Classic developer theme
- **ayu** - Elegant and balanced
- **catppuccin** - Pastel color palette

## Using Themes

\`\`\`javascript
import { createViewer, themes } from '@austinorphan/markdown-docs-viewer';

// Light theme
const viewer = createViewer({
  container: '#docs',
  theme: themes.github.light,
  source: { /* ... */ }
});

// Dark theme
viewer.setTheme(themes.nord.dark);
\`\`\`

## Custom Themes

\`\`\`javascript
const customTheme = {
  name: 'my-theme',
  colors: {
    primary: '#007acc',
    secondary: '#28a745',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textLight: '#6c757d',
    border: '#dee2e6',
    link: '#007bff',
    linkHover: '#0056b3'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    code: 'Monaco, monospace'
  }
};

viewer.setTheme(customTheme);
\`\`\`

## Theme Switching

Add runtime theme switching:

\`\`\`javascript
import { ThemeSwitcher } from '@austinorphan/markdown-docs-viewer';

const switcher = new ThemeSwitcher(viewer.themeManager, {
  position: 'top-right',
  showPreview: true
});

switcher.attachTo('#theme-switcher');
\`\`\`
        `
      },
      {
        id: 'advanced',
        title: '⚡ Advanced Features',
        category: 'Advanced',
        content: `
# Advanced Features

## Search Configuration

\`\`\`javascript
{
  search: {
    enabled: true,
    placeholder: 'Search documentation...',
    fuzzySearch: true,        // Enable fuzzy matching
    caseSensitive: false,     // Case insensitive search
    searchInTags: true,       // Search in document tags
    maxResults: 10           // Limit results
  }
}
\`\`\`

## Navigation Options

\`\`\`javascript
{
  navigation: {
    showCategories: true,     // Group by categories
    collapsible: true,        // Collapsible sections
    showTags: true,          // Show document tags
    showDescription: true,    // Show descriptions
    sortBy: 'order'          // 'title' | 'order' | 'date'
  }
}
\`\`\`

## Performance Options

\`\`\`javascript
{
  performance: {
    lazyLoading: true,        // Load documents on demand
    cacheSize: 50,           // LRU cache size
    enablePersistence: true,  // localStorage caching
    prefetchNext: true       // Prefetch next document
  }
}
\`\`\`

## Event Handlers

\`\`\`javascript
{
  onDocumentLoad: (doc) => {
    console.log('Loaded:', doc.title);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
  onThemeChange: (theme) => {
    console.log('Theme changed:', theme.name);
  }
}
\`\`\`

## Export Features

\`\`\`javascript
import { ExportManager } from '@austinorphan/markdown-docs-viewer';

const exporter = new ExportManager(viewer);

// Export to HTML
const html = await exporter.exportHTML({
  includeTheme: true,
  embedAssets: true
});

// Export to PDF (requires html2pdf.js)
const pdf = await exporter.exportPDF({
  format: 'a4',
  orientation: 'portrait'
});
\`\`\`
        `
      }
    ];

    // Create the viewer
    createViewer({
      container: '#docs',
      title: 'My Documentation',
      source: {
        type: 'content',
        documents: docs
      },
      theme: themes.github.light, // Try: themes.github.dark, themes.material.light, themes.nord.dark, etc.
      navigation: {
        showCategories: true,
        collapsible: true
      },
      search: {
        enabled: true,
        placeholder: 'Search docs...',
        fuzzySearch: true
      }
    });
  </script>
</body>
</html>
```

### 2. Open in browser

Save the file as `index.html` and open it in your browser. You'll see a fully functional documentation site!

### 3. Customize themes

Try different themes by changing the `theme` property:

- `themes.github.light` or `themes.github.dark`
- `themes.material.light` or `themes.material.dark`
- `themes.nord.light` or `themes.nord.dark`
- `themes.tokyo.light` or `themes.tokyo.dark`
- And 7 more theme variants!

## Method 2: NPM/Build Tool 🛠️

For production applications or when using a build system.

### 1. Install dependencies

```bash
npm install @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
```

### 2. Create your viewer

```javascript
// main.js
import { createViewer, themes } from '@austinorphan/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  theme: themes.github.light,
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        file: 'intro.md',
        category: 'Getting Started',
      },
      {
        id: 'api',
        title: 'API Reference',
        file: 'api.md',
        category: 'Reference',
      },
    ],
  },
  navigation: {
    showCategories: true,
    collapsible: true,
  },
  search: {
    enabled: true,
    fuzzySearch: true,
  },
});
```

### 3. Add to your HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Docs</title>
    <style>
      body {
        margin: 0;
      }
      #docs {
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="docs"></div>
    <script type="module" src="main.js"></script>
  </body>
</html>
```

## Method 3: Existing Markdown Files 📁

Already have markdown files? Point the viewer to them:

### File structure

```
docs/
├── intro.md
├── installation.md
├── api/
│   ├── overview.md
│   └── reference.md
└── guides/
    ├── getting-started.md
    └── advanced.md
```

### Configuration

```javascript
createViewer({
  container: '#docs',
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' },
      { id: 'install', title: 'Installation', file: 'installation.md' },
      { id: 'api-overview', title: 'API Overview', file: 'api/overview.md', category: 'API' },
      { id: 'api-ref', title: 'API Reference', file: 'api/reference.md', category: 'API' },
      {
        id: 'getting-started',
        title: 'Getting Started',
        file: 'guides/getting-started.md',
        category: 'Guides',
      },
      { id: 'advanced', title: 'Advanced Usage', file: 'guides/advanced.md', category: 'Guides' },
    ],
  },
});
```

## Next Steps

🎉 **Congratulations!** You now have a working documentation site. Here's what to explore next:

### 📖 Learn More

- **[Configuration Guide](CONFIGURATION.md)** - Complete options reference
- **[Theming Guide](THEMING.md)** - Customize appearance and create themes
- **[API Reference](API.md)** - Full API documentation

### 🎨 Customize

- Try different [built-in themes](THEMING.md#built-in-themes)
- Create a [custom theme](THEMING.md#custom-themes)
- Add [theme switching](THEMING.md#theme-switcher)

### ⚡ Optimize

- Enable [performance features](CONFIGURATION.md#performance-options)
- Configure [advanced search](CONFIGURATION.md#search-options)
- Add [export functionality](API.md#export-manager)

### 🔌 Integrate

- [React integration](INTEGRATION.md#react)
- [Vue integration](INTEGRATION.md#vue)
- [Angular integration](INTEGRATION.md#angular)

## Troubleshooting

### Common Issues

**"Container element not found"**

```javascript
// Make sure the element exists
document.addEventListener('DOMContentLoaded', () => {
  createViewer({ container: '#docs' /* ... */ });
});
```

**"require is not defined" in browser**

```html
<!-- Use UMD build for browser -->
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer/dist/index.umd.cjs"></script>
```

**Syntax highlighting not working**

```html
<!-- Load highlight.js -->
<script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>
<!-- Load language-specific modules -->
<script src="https://unpkg.com/highlight.js@11.9.0/lib/languages/javascript.min.js"></script>
```

**Themes not loading**

```javascript
// For initial configuration, use theme objects:
import { createViewer, themes } from '@austinorphan/markdown-docs-viewer';
createViewer({
  theme: themes.github.dark, // ✅ Theme object required
});

// For runtime switching, both work:
viewer.setTheme(themes.github.dark); // ✅ Theme object
viewer.setTheme('github-dark'); // ✅ Theme name string
```

Need more help? Check the [Browser Usage Guide](BROWSER_USAGE.md) or [open an issue](https://github.com/AustinOrphan/markdown-docs-viewer/issues).

---

**[⬅ Back to README](../README.md)** | **[➡ Configuration Guide](CONFIGURATION.md)**
