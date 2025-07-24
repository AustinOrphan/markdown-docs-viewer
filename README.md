# Markdown Docs Viewer

[![npm version](https://badge.fury.io/js/%40austinorphan%2Fmarkdown-docs-viewer.svg)](https://badge.fury.io/js/%40austinorphan%2Fmarkdown-docs-viewer)
[![Build Status](https://github.com/AustinOrphan/markdown-docs-viewer/workflows/CI/badge.svg)](https://github.com/AustinOrphan/markdown-docs-viewer/actions)
[![Coverage Status](https://codecov.io/gh/AustinOrphan/markdown-docs-viewer/branch/main/graph/badge.svg)](https://codecov.io/gh/AustinOrphan/markdown-docs-viewer)

A powerful, themeable, and highly configurable markdown documentation viewer designed for modern web applications. Transform your markdown files into beautiful, searchable documentation sites with minimal setup.

## ✨ Key Features

- 📚 **Multiple Document Sources** - Local files, URLs, GitHub repositories, or inline content
- 🎨 **11 Built-in Themes** - Including popular themes like GitHub, Material Design, Nord, Tokyo Night, and more
- 🌓 **Automatic Dark/Light Modes** - Every theme includes both light and dark variants
- 🔍 **Powerful Search** - Full-text search with fuzzy matching and advanced filtering
- 📱 **Mobile First** - Responsive design with touch-friendly navigation
- ⚡ **Performance Optimized** - Lazy loading, caching, and efficient rendering
- 🔧 **Framework Agnostic** - Pure TypeScript/JavaScript, works with React, Vue, Angular, or vanilla JS
- ♿ **Accessibility Ready** - WCAG AA compliant with screen reader support
- 📦 **Zero Config** - Works out of the box with sensible defaults

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js

# Using yarn
yarn add @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js

# Using pnpm
pnpm add @austinorphan/markdown-docs-viewer marked marked-highlight highlight.js
```

### Basic Example

```javascript
import { createViewer } from '@austinorphan/markdown-docs-viewer';

// Create a documentation viewer
const viewer = createViewer({
  container: '#docs',
  source: {
    type: 'local',
    documents: [
      {
        id: 'intro',
        title: 'Getting Started',
        file: 'intro.md',
      },
      {
        id: 'api',
        title: 'API Reference',
        file: 'api.md',
      },
    ],
  },
});
```

### CDN Usage (No Build Step)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies -->
    <script src="https://unpkg.com/marked@latest/marked.min.js"></script>
    <script src="https://unpkg.com/highlight.js@latest/lib/core.min.js"></script>

    <!-- Load the viewer -->
    <script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@latest/dist/index.umd.cjs"></script>

    <script>
      const { createViewer } = window.MarkdownDocsViewer;

      createViewer({
        container: '#docs',
        source: {
          type: 'content',
          documents: [
            {
              id: 'welcome',
              title: 'Welcome',
              content: `
# Welcome to My Documentation

This is a **markdown** document with:

- Syntax highlighting
- Search functionality  
- Mobile-responsive design
- Beautiful themes

## Getting Started

Start exploring the documentation using the sidebar navigation.
          `,
            },
          ],
        },
      });
    </script>
  </body>
</html>
```

## 🎨 Built-in Themes

Choose from 11 professionally designed themes, each with light and dark variants:

| Theme           | Description                   | Best For                 |
| --------------- | ----------------------------- | ------------------------ |
| **Default**     | Clean, modern design          | General documentation    |
| **GitHub**      | GitHub-inspired styling       | Open source projects     |
| **Material**    | Google Material Design        | Modern applications      |
| **VS Code**     | Visual Studio Code theme      | Developer tools          |
| **Nord**        | Arctic-inspired color palette | Minimalist design        |
| **Dracula**     | Popular dark theme            | Developer documentation  |
| **Tokyo Night** | Vibrant night theme           | Modern interfaces        |
| **Solarized**   | Low-contrast, eye-friendly    | Long reading sessions    |
| **Monokai**     | Classic dark theme            | Code-heavy documentation |
| **Ayu**         | Elegant, balanced colors      | Design-focused content   |
| **Catppuccin**  | Pastel color palette          | Creative projects        |

### Theme Usage

```javascript
import { createViewer, themes } from '@austinorphan/markdown-docs-viewer';

// Using a built-in theme
const viewer = createViewer({
  container: '#docs',
  theme: themes.github.dark, // or themes.github.light
  source: {
    /* ... */
  },
});

// Custom theme
const viewer = createViewer({
  container: '#docs',
  theme: {
    name: 'my-custom-theme',
    colors: {
      primary: '#007acc',
      background: '#ffffff',
      text: '#333333',
      // ... other theme properties
    },
  },
  source: {
    /* ... */
  },
});
```

## 📖 Documentation

### Core Guides

- 📋 **[Quick Start Guide](docs/quick-start.md)** - Get up and running in 5 minutes
- ⚙️ **[Configuration Guide](docs/CONFIGURATION.md)** - Complete configuration reference
- 🎨 **[Theming Guide](docs/THEMING.md)** - Create and customize themes
- 🌐 **[Browser Usage](docs/BROWSER_USAGE.md)** - Using without a build system

### Advanced Topics

- 📚 **[API Reference](docs/API.md)** - Complete API documentation
- 🏗️ **[Architecture](docs/architecture/README.md)** - Technical architecture overview
- 🔌 **[Integration Guide](docs/INTEGRATION.md)** - Framework integration examples
- 🎯 **[Performance Guide](docs/performance.md)** - Optimization techniques

### Examples

- 🌐 **[Live Demo](https://austinorphan.github.io/markdown-docs-viewer/)** - Interactive demonstration
- 💻 **[CodePen Examples](https://codepen.io/collection/XMzKvY)** - Copy-paste examples
- 📁 **[Example Projects](examples/)** - Complete working projects

## 🔧 Configuration

### Document Sources

#### Local Files

```javascript
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

#### GitHub Repository

```javascript
{
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'owner/repo/main/README.md'
      }
    ]
  }
}
```

#### Remote URLs

```javascript
{
  source: {
    type: 'url',
    baseUrl: 'https://api.github.com/repos/user/repo/contents/docs',
    headers: { 'Authorization': 'token your-token' },
    documents: [
      { id: 'api', title: 'API Docs', file: 'api.md' }
    ]
  }
}
```

### Navigation & Search

```javascript
{
  navigation: {
    showCategories: true,
    collapsible: true,
    showTags: true,
    sortBy: 'order' // 'title' | 'order' | 'date'
  },
  search: {
    enabled: true,
    fuzzySearch: true,
    searchInTags: true,
    maxResults: 10
  }
}
```

## 🚀 Performance

Optimized for speed and efficiency:

- **Lazy Loading**: Documents loaded only when needed
- **Smart Caching**: LRU cache with localStorage persistence
- **Efficient Rendering**: Virtual scrolling for large documents
- **Bundle Size**: < 50KB gzipped (excluding peer dependencies)
- **Memory Management**: Automatic cleanup and garbage collection

## 🌍 Browser Support

- ✅ **Chrome/Edge** 88+
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Mobile Browsers** iOS Safari 14+, Chrome Mobile 88+
- ✅ **Module Support** ES2020, CommonJS, UMD

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/AustinOrphan/markdown-docs-viewer.git
cd markdown-docs-viewer

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build the project
npm run build
```

## 📄 License

[MIT License](LICENSE) - feel free to use in personal and commercial projects.

## 🙏 Acknowledgments

- [Marked](https://marked.js.org/) - Fast markdown parser
- [Highlight.js](https://highlightjs.org/) - Syntax highlighting
- Theme inspirations from GitHub, Material Design, and the developer community

---

**[⬆ Back to Top](#markdown-docs-viewer)** | **[📖 View Documentation](docs/)** | **[🎮 Try Demo](https://austinorphan.github.io/markdown-docs-viewer/)**