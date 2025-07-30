# Welcome to My Documentation

This is an example documentation site that demonstrates the **zero-config** setup of the Markdown Docs Viewer.

## 🚀 Quick Start

Getting started is incredibly simple:

1. **Place your markdown files** in a `docs/` folder
2. **Include the viewer** in your HTML page
3. **Call `MarkdownDocsViewer.init()`** - that's it!

## ✨ Features

- **Auto-discovery** - Automatically finds and organizes your markdown files
- **Zero configuration** - Works out of the box with sensible defaults
- **Fully customizable** - Override any setting via config file or options
- **Modern themes** - 11 built-in themes with light/dark variants
- **Responsive design** - Works perfectly on desktop and mobile
- **Search functionality** - Fast, fuzzy search across all content
- **Table of contents** - Auto-generated navigation within documents

## 📁 File Structure

This example demonstrates the recommended file structure:

```
your-project/
├── docs/                    # Your markdown files
│   ├── README.md           # Overview (this file)
│   ├── getting-started.md  # Getting started guide
│   └── api/                # Organized in folders
│       └── reference.md    # API documentation
├── docs-config.json        # Optional configuration
└── index.html             # Your HTML page
```

## 🎨 Customization

You can customize the viewer in several ways:

### Option 1: Configuration File

Create a `docs-config.json` file:

```json
{
  "title": "My Documentation",
  "theme": "github-light",
  "search": {
    "placeholder": "Search my docs..."
  }
}
```

### Option 2: JavaScript Options

Pass options directly to the `init()` function:

```javascript
MarkdownDocsViewer.init({
  title: 'My Documentation',
  theme: 'material-dark',
  docsPath: './documentation',
});
```

## 🔄 Updates

Updating the viewer is as simple as replacing the component files. No configuration changes needed - your content and settings are preserved.

## 📖 Next Steps

- Explore the [Getting Started](getting-started.md) guide
- Check out the [API Reference](api/reference.md)
- Browse the available themes and customization options

---

_This documentation was generated using the Markdown Docs Viewer zero-config setup._
