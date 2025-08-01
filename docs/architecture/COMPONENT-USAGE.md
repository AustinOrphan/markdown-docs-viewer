# Component Usage Guide

This guide explains how to use the Markdown Docs Viewer as a drop-in component that can be easily updated without breaking your implementation.

## 🚀 Quick Start (Zero Configuration)

The simplest way to get started requires just these files:

```
your-project/
├── docs/                    # Your markdown files (auto-discovered)
│   ├── README.md
│   └── guide.md
├── zero-config.umd.cjs      # The viewer component
└── index.html               # Your HTML page
```

### Basic HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>

    <!-- Load the zero-config viewer -->
    <script src="./zero-config.umd.cjs"></script>

    <script>
      // That's it! Auto-initializes and discovers docs in ./docs/
      MarkdownDocsViewer.init({
        title: 'My Documentation',
        theme: 'github-light',
      });
    </script>
  </body>
</html>
```

## 📋 Configuration Options

### Option 1: JavaScript Configuration

Pass options directly to the `init()` function:

```javascript
MarkdownDocsViewer.init({
  title: 'My Documentation',
  theme: 'material-dark',
  docsPath: './documentation',
  container: '#my-docs-container',
});
```

### Option 2: Configuration File

Create a `docs-config.json` file in your project root:

```json
{
  "title": "My Documentation",
  "theme": "github-light",
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

## 🔄 Update Mechanism

### Automatic Updates (Recommended)

To ensure seamless updates without breaking your setup:

1. **Use the UMD bundle**: Always use `zero-config.umd.cjs` for maximum compatibility
2. **Keep config separate**: Store your configuration in `docs-config.json` or pass it to `init()`
3. **Use stable API**: The `MarkdownDocsViewer.init()` API is guaranteed to remain stable

### Update Process

When a new version is released:

1. **Replace the component file**:

   ```bash
   # Download new version
   curl -o zero-config.umd.cjs https://github.com/AustinOrphan/markdown-docs-viewer/releases/latest/download/zero-config.umd.cjs
   ```

2. **No configuration changes needed** - your existing config will work

3. **Test the update**:
   ```javascript
   // Optional: Check component version
   console.log('Viewer version:', MarkdownDocsViewer.version);
   ```

### Version Compatibility

- **Breaking changes**: Only occur in major versions (1.x → 2.x)
- **New features**: Added in minor versions (1.1 → 1.2) - fully backward compatible
- **Bug fixes**: Released in patch versions (1.1.1 → 1.1.2) - no API changes

## 📁 File Organization

### Recommended Structure

```
your-project/
├── docs/                          # Your content
│   ├── README.md                 # Landing page
│   ├── getting-started.md        # Getting started guide
│   └── api/                      # Organized by category
│       ├── authentication.md
│       └── endpoints.md
├── assets/                       # Optional: images, etc.
│   └── logo.png
├── docs-config.json              # Configuration
├── zero-config.umd.cjs          # Component (replace to update)
└── index.html                   # Your page
```

### Auto-Discovery Rules

The component automatically discovers markdown files using these rules:

1. **Scans the docs directory** (configurable via `source.path`)
2. **Extracts metadata** from frontmatter:

   ```markdown
   ---
   title: 'Custom Title'
   category: 'API'
   order: 1
   tags: ['important', 'beginner']
   description: 'A brief description'
   ---

   # Your content here
   ```

3. **Organizes by category** based on folder structure or frontmatter
4. **Excludes files** matching patterns in `source.exclude`

## 🎨 Theming

### Built-in Themes

```javascript
// Available themes
const themes = [
  'github-light',
  'github-dark',
  'material-light',
  'material-dark',
  'nord-light',
  'nord-dark',
  'solarized-light',
  'solarized-dark',
  'dracula',
  'monokai',
  'atom-one-light',
];

// Set theme
MarkdownDocsViewer.setTheme('dracula');
```

### Runtime Theme Switching

```javascript
// Get available themes
const availableThemes = MarkdownDocsViewer.getAvailableThemes();

// Allow users to switch themes
document.getElementById('theme-selector').addEventListener('change', e => {
  MarkdownDocsViewer.setTheme(e.target.value);
});
```

## 🛠 Advanced Usage

### Custom Container

```javascript
MarkdownDocsViewer.init({
  container: document.getElementById('my-custom-container'),
  // ... other options
});
```

### Manual Document Loading

```javascript
// Disable auto-discovery and provide documents manually
MarkdownDocsViewer.init({
  source: {
    type: 'content',
    documents: [
      {
        id: 'welcome',
        title: 'Welcome',
        content: '# Welcome\n\nHello world!',
        category: 'Getting Started',
      },
    ],
  },
});
```

### Event Handling

```javascript
MarkdownDocsViewer.init({
  // ... config
}).then(viewer => {
  // Listen for document changes
  viewer.on('document:loaded', doc => {
    console.log('Loaded:', doc.title);
  });

  // Listen for theme changes
  viewer.on('theme:changed', theme => {
    console.log('Theme changed to:', theme);
  });
});
```

## 🔒 Security Best Practices

1. **Serve files over HTTPS** in production
2. **Validate markdown content** if accepting user input
3. **Use Content Security Policy** headers:
   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';"
   />
   ```
   Note: The 'unsafe-inline' directives are required for the viewer's dynamic styling and initialization. For enhanced security in production, consider using CSP nonces or hashes instead.

## 🐛 Troubleshooting

### Common Issues

1. **Documents not loading**:

   ```javascript
   // Check the docs path
   MarkdownDocsViewer.init({ docsPath: './docs' });
   ```

2. **Theme not applying**:

   ```javascript
   // Ensure theme name is correct
   console.log(MarkdownDocsViewer.getAvailableThemes());
   ```

3. **Configuration not loading**:
   ```javascript
   // Specify config path explicitly
   MarkdownDocsViewer.init({ configPath: './my-config.json' });
   ```

### Debug Mode

```javascript
// Enable debug logging
MarkdownDocsViewer.init({
  debug: true, // Shows detailed console logs
  // ... other options
});
```

## 📞 Support

- **Documentation**: [Full API Reference](https://github.com/AustinOrphan/markdown-docs-viewer)
- **Issues**: [GitHub Issues](https://github.com/AustinOrphan/markdown-docs-viewer/issues)
- **Examples**: See the `examples/` directory in the repository

## 🔮 Migration Guide

### From v1.x to v2.x (Future)

When major updates occur, this section will provide step-by-step migration instructions to ensure smooth transitions.
