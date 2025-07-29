# Markdown Docs Viewer

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

### Method 1: Zero Configuration (Simplest)

Download the zero-config bundle and use it immediately:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.2.2/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js"></script>

    <!-- Load the zero-config viewer -->
    <script src="zero-config.umd.cjs"></script>

    <script>
      // That's it! Automatically discovers docs in ./docs/ folder
      MarkdownDocsViewer.init();
    </script>
  </body>
</html>
```

Place your markdown files in a `docs/` folder and they'll be automatically discovered and displayed!

### Method 2: Git Clone (Direct Usage)

```bash
# Clone the repository
git clone https://github.com/AustinOrphan/markdown-docs-viewer.git
cd markdown-docs-viewer

# Install dependencies and build
npm install
npm run build
```

Then copy `dist/index.umd.cjs` to your project and use it:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Documentation</title>
  </head>
  <body>
    <div id="docs"></div>

    <!-- Load dependencies from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/marked@14.1.2/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-highlight@2.1.4/lib/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/lib/highlight.min.js"></script>

    <!-- Load your built viewer -->
    <script src="index.umd.cjs"></script>

    <script>
      const { createViewer, themes } = window.MarkdownDocsViewer;

      const viewer = createViewer({
        container: '#docs',
        title: 'My Documentation',
        theme: themes.default.light,
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
    </script>
  </body>
</html>
```

### Method 3: Git Submodule (Recommended for Projects)

This is how [training-science-docs](https://github.com/AustinOrphan/training-science-docs) uses it:

```bash
# Add as git submodule
git submodule add https://github.com/AustinOrphan/markdown-docs-viewer.git viewer

# Build the viewer
cd viewer
npm install
npm run build
cd ..

# Use in your HTML
```

```html
<script src="./viewer/dist/index.umd.cjs"></script>
<script>
  const { createViewer, themes } = window.MarkdownDocsViewer;
  // ... use as above
</script>
```

## 📦 Zero Configuration API

The zero-config bundle provides a simple API for drop-in usage:

```javascript
// Initialize with auto-discovery
MarkdownDocsViewer.init({
  title: 'My Docs', // Optional: Override title
  theme: 'github-dark', // Optional: Set theme
  docsPath: './documentation', // Optional: Change docs folder (default: ./docs)
  configPath: './docs-config.json', // Optional: Use config file
});

// Runtime controls
MarkdownDocsViewer.setTheme('dracula');
MarkdownDocsViewer.reload();
MarkdownDocsViewer.getAvailableThemes();
```

### Configuration File (Optional)

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
    "showCategories": true
  },
  "search": {
    "enabled": true,
    "fuzzySearch": true
  }
}
```

## 🎨 Built-in Themes

Access themes via the `themes` object:

```javascript
const { createViewer, themes } = window.MarkdownDocsViewer;

// Available themes (each has .light and .dark variants):
themes.default.light; // Clean, modern design
themes.github.dark; // GitHub-inspired styling
themes.material.light; // Google Material Design
themes.vscode.dark; // Visual Studio Code theme
themes.nord.light; // Arctic-inspired colors
themes.dracula.dark; // Popular dark theme
themes.tokyo.dark; // Vibrant night theme
themes.solarized.light; // Eye-friendly colors
themes.monokai.dark; // Classic developer theme
themes.ayu.light; // Elegant, balanced design
themes.catppuccin.light; // Pastel color palette
```

## 📖 Configuration

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
        documents: [{
            id: 'readme',
            title: 'README',
            file: 'owner/repo/main/README.md'
        }]
    }
}
```

#### Remote URLs

```javascript
{
    source: {
        type: 'url',
        baseUrl: 'https://raw.githubusercontent.com/user/repo/main/docs',
        documents: [
            { id: 'api', title: 'API Docs', file: 'api.md' }
        ]
    }
}
```

#### Inline Content

```javascript
{
    source: {
        type: 'content',
        documents: [{
            id: 'welcome',
            title: 'Welcome',
            content: '# Welcome\n\nMarkdown content here...'
        }]
    }
}
```

## 🛠️ Development

### Development Commands

- `npm run dev` - Start Vite development server on port 5000
- `npm run build` - Build library (ES + UMD) and generate TypeScript declarations
- `npm run preview` - Preview built library
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint TypeScript files with ESLint

### Project Structure

```
src/
  ├── viewer.ts           # Main MarkdownDocsViewer class
  ├── factory.ts          # createViewer() and quickStart() functions
  ├── themes.ts           # Theme system and built-in themes
  ├── loader.ts           # Document loading from various sources
  ├── search.ts           # Search functionality
  ├── navigation.ts       # Sidebar navigation
  ├── toc.ts             # Table of contents generation
  └── types.ts           # TypeScript type definitions
```

### Build Output

The build process creates:

- `dist/index.es.js` - ES module build
- `dist/index.umd.cjs` - UMD build for browsers
- `dist/index.d.ts` - TypeScript declarations

## 🌍 Browser Support

- ✅ **Chrome/Edge** 88+
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Mobile Browsers** iOS Safari 14+, Chrome Mobile 88+

## 📄 Dependencies

The viewer requires these peer dependencies (loaded from CDN):

- [marked](https://marked.js.org/) - Markdown parser
- [marked-highlight](https://github.com/markedjs/marked-highlight) - Syntax highlighting for Marked
- [highlight.js](https://highlightjs.org/) - Syntax highlighting library

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/AustinOrphan/markdown-docs-viewer.git
cd markdown-docs-viewer
npm install
npm run dev
```

## 📄 License

[MIT License](LICENSE) - feel free to use in personal and commercial projects.

## 🙏 Acknowledgments

- [Marked](https://marked.js.org/) - Fast markdown parser
- [Highlight.js](https://highlightjs.org/) - Syntax highlighting
- Theme inspirations from GitHub, Material Design, and the developer community

---

**[📖 View Documentation](docs/)** | **[🎮 Try Demo](https://austinorphan.github.io/markdown-docs-viewer/)**
