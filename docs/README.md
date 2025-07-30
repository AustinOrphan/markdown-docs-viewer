# Documentation

> **⚠️ Package Availability Notice**: This package is not yet published to NPM or CDN. Please follow the build-from-source instructions in individual guides.

Welcome to the comprehensive documentation for the Markdown Documentation Viewer library.

## 🚀 Getting Started

New to the library? Start here for the fastest path to success:

- **[Quick Start Guide](quick-start.md)** - Get up and running in 5 minutes
- **[Browser Usage Guide](BROWSER_USAGE.md)** - Using without a build system
- **[Configuration Guide](CONFIGURATION.md)** - Essential configuration options

## 📚 Core Documentation

### Essential Guides

- **[API Reference](API.md)** - Complete API documentation with examples
- **[Theming System](THEMING.md)** - Comprehensive theming and customization guide
- **[Integration Guide](INTEGRATION.md)** - Framework integration (React, Vue, Angular)

### Advanced Topics

- **[Architecture Overview](architecture/README.md)** - Technical architecture and design decisions
- **[Performance Guide](architecture/components/performance.md)** - Optimization techniques and best practices
- **[Theming Visual Guide](THEMING-VISUAL-GUIDE.md)** - Visual examples and theme showcase

## 🎯 Quick Reference

### Installation

```bash
# Not yet available on NPM - build from source required
# This library is distributed via Git - build from source:

# Clone and build instead:
git clone https://github.com/AustinOrphan/markdown-docs-viewer.git
cd markdown-docs-viewer
npm install
npm run build
```

### Basic Usage

```javascript
import { createViewer } from './dist/index.es.js';

const viewer = createViewer({
  container: '#docs',
  source: {
    type: 'local',
    documents: [{ id: 'intro', title: 'Introduction', file: 'intro.md' }],
  },
});
```

### CDN Usage (Not Yet Available)

```html
<!-- Not yet available on CDN -->
<!-- This library is distributed via Git, not CDN -->

<!-- Use your locally built file instead -->
<script src="path/to/your/built/index.umd.cjs"></script>
<script>
  const { createViewer } = window.MarkdownDocsViewer;
  // ... use createViewer
</script>
```

## 🎨 Theme Gallery

The library includes 11 built-in themes with light/dark variants:

| Theme           | Description              | Preview                                                                                  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| **Default**     | Clean, modern design     | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=default-light)    |
| **GitHub**      | GitHub-inspired styling  | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=github-light)     |
| **Material**    | Google Material Design   | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=material-light)   |
| **VS Code**     | Visual Studio Code theme | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=vscode-light)     |
| **Nord**        | Arctic-inspired colors   | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=nord-light)       |
| **Dracula**     | Popular dark theme       | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=dracula-dark)     |
| **Tokyo Night** | Vibrant night theme      | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=tokyo-dark)       |
| **Solarized**   | Eye-friendly colors      | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=solarized-light)  |
| **Monokai**     | Classic developer theme  | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=monokai-dark)     |
| **Ayu**         | Elegant, balanced design | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=ayu-light)        |
| **Catppuccin**  | Pastel color palette     | [View Demo](https://austinorphan.github.io/markdown-docs-viewer/?theme=catppuccin-light) |

## 📖 Document Structure

### Basic Document

```javascript
{
  id: 'unique-id',
  title: 'Document Title',
  file: 'path/to/file.md', // or use 'content' for inline
  category: 'Category Name', // optional
  tags: ['tag1', 'tag2'], // optional
  description: 'Short description', // optional
  order: 1 // optional, for sorting
}
```

### Document Sources

| Source Type | Use Case                   | Example                                   |
| ----------- | -------------------------- | ----------------------------------------- |
| **local**   | Files served by web server | `{ type: 'local', basePath: '/docs' }`    |
| **url**     | Remote files via HTTP      | `{ type: 'url', baseUrl: 'https://...' }` |
| **github**  | GitHub repository files    | `{ type: 'github' }`                      |
| **content** | Inline markdown content    | `{ type: 'content' }`                     |

## 🛠 Development

### Auto-Generated API Documentation

The `api/` directory contains automatically generated TypeDoc documentation:

- **[Classes](api/classes/)** - Core classes and their methods
- **[Interfaces](api/interfaces/)** - TypeScript interfaces and types
- **[API Documentation](api/README.md)** - Complete API reference

### Contributing

1. **[Architecture Guide](architecture/README.md)** - Understand the codebase structure
2. **[Component Guide](architecture/components/)** - Individual component documentation
3. **[ADR Documents](architecture/adr/)** - Architecture decision records

## 🔗 External Resources

### Dependencies

- **[Marked](https://marked.js.org/)** - Markdown parser and compiler
- **[marked-highlight](https://github.com/markedjs/marked-highlight)** - Syntax highlighting for Marked
- **[Highlight.js](https://highlightjs.org/)** - Syntax highlighting library

### Community

- **[GitHub Repository](https://github.com/AustinOrphan/markdown-docs-viewer)** - Source code and issues
<!-- Library is distributed via Git, not NPM -->
- **[Live Demo](https://austinorphan.github.io/markdown-docs-viewer/)** - Interactive demonstration

## 🆘 Troubleshooting

### Common Issues

**Installation Problems**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Browser Compatibility**

- Ensure you're using a supported browser (Chrome 88+, Firefox 85+, Safari 14+)
- Check console for JavaScript errors
- Verify all dependencies are loaded

**Theme Not Loading**

```javascript
// For initial configuration (when available on NPM):
// Import from local build:

// Currently - import from local build:
import { createViewer, themes } from './path/to/built/index.es.js';
createViewer({
  theme: themes.github.light, // ✅ Theme object required
});

// For initial configuration (CDN):
const { createViewer, themes } = window.MarkdownDocsViewer;
createViewer({
  theme: themes.github.light, // ✅ Theme object required
});

// For runtime theme switching (both NPM and CDN):
viewer.setTheme(themes.github.light); // ✅ Theme object
viewer.setTheme('github-light'); // ✅ Theme name string (also works)
```

**Search Not Working**

- Verify search is enabled in configuration
- Check that documents have searchable content
- Ensure fuzzy search settings match your needs

### Getting Help

1. **Review [examples](../examples/)** for working code
2. **Search [existing issues](https://github.com/AustinOrphan/markdown-docs-viewer/issues)**
3. **Create a [new issue](https://github.com/AustinOrphan/markdown-docs-viewer/issues/new)** with a minimal reproduction

## 📄 License

This project is licensed under the MIT License (see LICENSE file in the root directory).

---

**[⬅ Back to Main README](../README.md)** | **[🚀 Quick Start](quick-start.md)** | **[🎮 Try Demo](https://austinorphan.github.io/markdown-docs-viewer/)**
