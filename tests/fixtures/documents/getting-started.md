---
title: Getting Started Guide
description: Learn how to install, configure, and use the markdown documentation viewer
tags: ['installation', 'setup', 'quickstart', 'guide']
order: 1
---

# Getting Started

This guide will help you get up and running with the markdown documentation viewer in just a few minutes.

## Installation

### Via npm

```bash
npm install markdown-docs-viewer
```

### Via yarn

```bash
yarn add markdown-docs-viewer
```

### Via CDN

```html
<script src="https://unpkg.com/markdown-docs-viewer/dist/zero-config.umd.cjs"></script>
```

## Basic Usage

### Zero-Configuration Setup

The simplest way to get started is with the zero-config API:

```javascript
import { init } from 'markdown-docs-viewer/zero-config';

// This will automatically:
// 1. Look for a container element (#docs, #documentation, or document.body)
// 2. Discover markdown files in ./docs/ directory
// 3. Load configuration from ./docs.config.json if it exists
// 4. Apply sensible defaults for everything else
await init();
```

### Custom Configuration

For more control, you can provide options:

```javascript
import { init } from 'markdown-docs-viewer/zero-config';

await init({
  container: '#my-docs',           // CSS selector or HTML element
  configPath: './my-config.json', // Custom config file path
  docsPath: './documentation',    // Custom docs directory
  theme: 'github-dark',           // Theme selection
  title: 'My Project Docs'        // Documentation title
});
```

### Full API Usage

For complete control, use the full API:

```javascript
import { createViewer } from 'markdown-docs-viewer';

const viewer = createViewer({
  container: document.getElementById('docs'),
  source: {
    type: 'local',
    basePath: './docs',
    documents: [
      {
        id: 'readme',
        title: 'Overview',
        file: 'README.md'
      },
      {
        id: 'guide',
        title: 'User Guide',
        file: 'guide.md'
      }
    ]
  },
  theme: 'material-light',
  search: {
    enabled: true,
    placeholder: 'Search documentation...'
  }
});
```

## Document Sources

The viewer supports multiple document sources:

### Local Files

```javascript
{
  source: {
    type: 'local',
    basePath: './docs',
    documents: [/* document list */]
  }
}
```

### Remote URLs

```javascript
{
  source: {
    type: 'url',
    baseUrl: 'https://example.com/docs',
    documents: [/* document list */],
    headers: {
      'Authorization': 'Bearer token'
    }
  }
}
```

### GitHub Repository

```javascript
{
  source: {
    type: 'github',
    owner: 'username',
    repo: 'repository',
    branch: 'main', // Optional, defaults to main
    path: 'docs',   // Optional, defaults to root
    documents: [/* document list */]
  }
}
```

### Inline Content

```javascript
{
  source: {
    type: 'content',
    documents: [
      {
        id: 'welcome',
        title: 'Welcome',
        content: '# Welcome\n\nWelcome to our docs!'
      }
    ]
  }
}
```

## Configuration File

Create a `docs.config.json` file for persistent configuration:

```json
{
  "title": "My Documentation",
  "theme": "github-light",
  "search": {
    "enabled": true,
    "placeholder": "Search docs..."
  },
  "navigation": {
    "showCategories": true,
    "expandable": true
  },
  "source": {
    "type": "local",
    "basePath": "./docs"
  }
}
```

## Directory Structure

Organize your documentation like this:

```
project/
├── docs/
│   ├── README.md
│   ├── getting-started.md
│   ├── api/
│   │   ├── reference.md
│   │   └── examples.md
│   └── guides/
│       ├── installation.md
│       └── configuration.md
├── docs.config.json
└── index.html
```

## HTML Setup

Create a simple HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation</title>
</head>
<body>
    <div id="docs"></div>
    <script type="module">
        import { init } from './node_modules/markdown-docs-viewer/dist/zero-config.es.js';
        init();
    </script>
</body>
</html>
```

## Next Steps

- [Configuration Options](./configuration.md) - Learn about all available options
- [Theme System](./themes.md) - Customize the appearance
- [API Reference](./api/reference.md) - Detailed API documentation
- [Advanced Features](./advanced.md) - Export, search, and performance features

## Troubleshooting

### Documents Not Loading

1. Check that your web server is serving the docs directory
2. Verify file paths are correct relative to your HTML file
3. Check browser console for network errors

### Theme Not Applying

1. Ensure theme name is spelled correctly
2. Check that theme exists in available themes
3. Verify CSS is not being overridden by other stylesheets

### Search Not Working

1. Confirm search is enabled in configuration
2. Check that documents have been loaded successfully
3. Verify search index has been built

For more help, see our [Troubleshooting Guide](./troubleshooting.md).