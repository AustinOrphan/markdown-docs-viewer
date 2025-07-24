# Getting Started with Markdown Documentation Viewer

Welcome to the Markdown Documentation Viewer! This comprehensive guide will help you quickly set up and customize your documentation site.

## Quick Installation

### NPM Installation

```bash
npm install @austinorphan/markdown-docs-viewer
```

### CDN Usage

```html
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>
```

## Basic Setup

Here's a minimal example to get you started:

```javascript
import { MarkdownDocsViewer } from '@austinorphan/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
  container: '#documentation',
  source: {
    type: 'local',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Welcome\n\nThis is your first document!',
      },
    ],
  },
});
```

## Key Features

### 📚 Multiple Document Sources

- **Local documents**: Embedded in your application
- **Remote URLs**: Load from any web source
- **GitHub repositories**: Direct integration with GitHub repos

### 🎨 Customizable Themes

- Built-in light and dark themes
- Fully customizable color schemes
- Typography and spacing controls

### 🔍 Powerful Search

- Full-text search across all documents
- Configurable search options
- Real-time filtering

### 📱 Responsive Design

- Mobile-first approach
- Touch-friendly navigation
- Adaptive layouts

## Document Configuration

Documents can be configured with rich metadata:

```javascript
{
    id: 'advanced-guide',
    title: 'Advanced Configuration',
    description: 'Learn advanced configuration options',
    category: 'Guides',
    tags: ['advanced', 'configuration'],
    order: 2,
    content: '# Advanced Guide\n\n...'
}
```

## Navigation Options

Customize the navigation experience:

```javascript
navigation: {
    showCategories: true,    // Group by categories
    showTags: true,         // Display document tags
    collapsible: true,      // Collapsible navigation sections
    showDescription: true   // Show document descriptions
}
```

## Next Steps

1. **[Configuration Guide](./configuration.md)** - Learn about all configuration options
2. **[Theming Guide](./theming.md)** - Customize the appearance
3. **[API Reference](./api-reference.md)** - Complete API documentation
4. **[Examples](./examples.md)** - See real-world examples

## Need Help?

- 📖 [Full Documentation](https://github.com/AustinOrphan/markdown-docs-viewer#readme)
- 🐛 [Report Issues](https://github.com/AustinOrphan/markdown-docs-viewer/issues)
- 💬 [Discussions](https://github.com/AustinOrphan/markdown-docs-viewer/discussions)

---

> **Pro Tip**: Start with the basic setup and gradually add more features as your documentation grows!
