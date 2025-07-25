# Quick Start Guide

Get up and running with the Markdown Documentation Viewer in minutes.

## Installation

### NPM (Recommended)

```bash
npm install @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
```

### CDN

```html
<!-- Load dependencies -->
<script src="https://unpkg.com/marked@15.0.12/marked.min.js"></script>
<script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>

<!-- Load the viewer -->
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>
```

## Basic Usage

### NPM/Module Import

```javascript
import { createViewer, defaultTheme } from '@austinorphan/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Getting Started',
        content: `
# Welcome to Our Documentation

This is your first document. You can add more documents by modifying the \`documents\` array.

## Features

- 📚 Multiple document sources
- 🎨 Themeable interface
- 🔍 Built-in search
- 📱 Mobile responsive
- ⚡ Fast performance

## Next Steps

1. Add more documents to the \`documents\` array
2. Customize the theme
3. Configure navigation options
        `,
      },
    ],
  },
});
```

### CDN/Browser

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Dependencies -->
    <script src="https://unpkg.com/marked@15.0.12/marked.min.js"></script>
    <script src="https://unpkg.com/highlight.js@11.9.0/lib/core.min.js"></script>

    <!-- Viewer -->
    <script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>

    <script>
      const { MarkdownDocsViewer, defaultTheme } = window.MarkdownDocsViewer;

      const viewer = new MarkdownDocsViewer({
        container: '#docs',
        theme: defaultTheme,
        source: {
          type: 'content',
          documents: [
            {
              id: 'intro',
              title: 'Getting Started',
              content: `
# Welcome to Our Documentation

This is your first document using the CDN version.

## CDN Usage Notes

- Always use theme objects (\`defaultTheme\`, \`darkTheme\`)
- Access components via \`window.MarkdownDocsViewer\`
- Load all dependencies before the viewer script
            `,
            },
          ],
        },
      });
    </script>
  </body>
</html>
```

## Adding More Documents

### From Local Files

```javascript
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' },
      { id: 'guide', title: 'User Guide', file: 'guide.md' },
      { id: 'api', title: 'API Reference', file: 'api.md' },
    ],
  },
});
```

### From GitHub Repository

```javascript
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'owner/repo/main/README.md',
      },
    ],
  },
});
```

## Theming

### Built-in Themes

```javascript
import { createViewer, darkTheme, defaultTheme } from '@austinorphan/markdown-docs-viewer';

// Light theme
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  // ... other config
});

// Dark theme
const viewer = createViewer({
  container: '#docs',
  theme: darkTheme,
  // ... other config
});
```

### Custom Theme

```javascript
import { createCustomTheme } from '@austinorphan/markdown-docs-viewer';

const myTheme = createCustomTheme({
  name: 'my-theme',
  colors: {
    primary: '#007acc',
    background: '#ffffff',
    text: '#333333',
    // ... other colors
  },
});

const viewer = createViewer({
  container: '#docs',
  theme: myTheme,
  // ... other config
});
```

## Configuration Options

### Navigation

```javascript
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  navigation: {
    showCategories: true, // Group documents by category
    showTags: true, // Show document tags
    collapsible: true, // Collapsible navigation groups
    showDescription: true, // Show document descriptions
    sortBy: 'order', // Sort by: 'title', 'order', 'date'
  },
  // ... other config
});
```

### Search

```javascript
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme,
  search: {
    enabled: true,
    placeholder: 'Search documentation...',
    caseSensitive: false,
    fuzzySearch: true,
    searchInTags: true,
    maxResults: 10,
  },
  // ... other config
});
```

## Next Steps

- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [Theming System](./THEMING.md) - Theme customization and creation
- [API Reference](./API.md) - Complete API documentation
- [Browser Usage](./BROWSER_USAGE.md) - Browser-specific usage guidelines
- [Integration Guide](./INTEGRATION.md) - Framework integration examples

## Troubleshooting

### Common Issues

1. **CDN Theme Errors**: Always use theme objects (`defaultTheme`, `darkTheme`) in CDN context, not strings
2. **Missing Dependencies**: Ensure `marked` and `highlight.js` are loaded before the viewer
3. **Local File Loading**: Local files must be served by a web server (not `file://` protocol)

### Getting Help

- Check the [examples](../examples/) directory for working examples
- Review the [configuration guide](./CONFIGURATION.md) for detailed options
- Create an issue on GitHub for bugs or feature requests
