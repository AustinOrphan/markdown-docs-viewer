// Demo Controller for Markdown Documentation Viewer
import { MarkdownDocsViewer, ThemeSwitcher, ThemeManager } from '../dist/index.es.js';

class DemoController {
  constructor() {
    this.viewer = null;
    this.themeManager = null;
    this.themeSwitcher = null;
    this.currentExample = 'basic';
    this.examples = this.getExampleConfigs();

    this.init();
  }

  init() {
    // Initialize theme manager
    this.initializeThemeManager();

    // Initialize controls
    this.setupControls();

    // Load initial example
    this.loadExample('basic');

    // Set initial status
    this.updateStatus('ready', 'Demo loaded successfully');
  }

  initializeThemeManager() {
    // Create theme manager with demo-specific options
    this.themeManager = new ThemeManager({
      enablePersistence: true,
      storageKey: 'mdv-demo-theme',
      onThemeChange: theme => {
        // Update body theme attribute for demo styling
        const mode = theme.name.includes('-dark') ? 'dark' : 'light';
        document.body.setAttribute('data-theme', mode);

        // Update viewer theme if viewer exists
        if (this.viewer) {
          this.viewer.setTheme(theme);
        }

        // Update status
        this.updateStatus('success', `Theme changed to ${theme.name}`);
      },
    });

    // Create theme switcher
    this.themeSwitcher = new ThemeSwitcher(this.themeManager, {
      position: 'header',
      showDarkModeToggle: true,
      allowCustomThemes: true,
      showPreview: true,
      showDescription: true,
    });
  }

  setupControls() {
    // Initialize built-in theme switcher
    this.setupThemeSwitcher();

    // Example selector
    const exampleSelector = document.getElementById('example-selector');
    exampleSelector.addEventListener('change', e => {
      this.loadExample(e.target.value);
    });

    // Reload button
    const reloadBtn = document.getElementById('reload-btn');
    reloadBtn.addEventListener('click', () => {
      this.reloadViewer();
    });

    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });
  }

  setupThemeSwitcher() {
    // Render the theme switcher in the theme controls container
    const themeControlsContainer = document.getElementById('theme-controls');
    if (themeControlsContainer) {
      // Inject CSS styles for the theme switcher
      this.injectThemeSwitcherStyles();

      // Render and attach the theme switcher
      themeControlsContainer.innerHTML = this.themeSwitcher.render();
      this.themeSwitcher.attachTo(themeControlsContainer);
    }
  }

  injectThemeSwitcherStyles() {
    // Check if styles are already injected
    if (document.getElementById('theme-switcher-styles')) {
      return;
    }

    // Create and inject theme switcher styles
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-switcher-styles';
    styleElement.textContent = this.themeSwitcher.getStyles();
    document.head.appendChild(styleElement);
  }

  getExampleConfigs() {
    return {
      basic: {
        title: 'Basic Documentation',
        source: {
          type: 'local',
          documents: [
            {
              id: 'getting-started',
              title: 'Getting Started',
              description: 'Quick start guide for the documentation viewer',
              content: this.getBasicContent(),
              category: 'Introduction',
              tags: ['setup', 'installation'],
            },
            {
              id: 'configuration',
              title: 'Configuration',
              description: 'Learn how to configure the viewer',
              content: this.getConfigContent(),
              category: 'Guide',
              tags: ['config', 'options'],
            },
            {
              id: 'theming',
              title: 'Theming',
              description: 'Customize the appearance',
              content: this.getThemingContent(),
              category: 'Guide',
              tags: ['themes', 'customization'],
            },
          ],
        },
        navigation: {
          showCategories: true,
          showTags: true,
          collapsible: true,
        },
        search: {
          enabled: true,
          placeholder: 'Search documentation...',
        },
      },
      github: {
        title: 'GitHub Repository Docs',
        source: {
          type: 'github',
          repository: 'microsoft/typescript',
          branch: 'main',
          docsPath: 'doc',
        },
        navigation: {
          showCategories: true,
          collapsible: true,
        },
        search: {
          enabled: true,
        },
      },
      url: {
        title: 'Remote Documentation',
        source: {
          type: 'url',
          baseUrl: 'https://raw.githubusercontent.com/markdown-it/markdown-it/master',
          documents: [
            { file: '/README.md' },
            { file: '/docs/architecture.md' },
            { file: '/docs/development.md' },
          ],
        },
        navigation: {
          showCategories: false,
        },
      },
      advanced: {
        title: 'Advanced Features Demo',
        source: {
          type: 'local',
          documents: this.getAdvancedDocuments(),
        },
        navigation: {
          showCategories: true,
          showTags: true,
          collapsible: true,
          showDescription: true,
        },
        search: {
          enabled: true,
          maxResults: 20,
          placeholder: 'Search advanced features...',
        },
        render: {
          syntaxHighlighting: true,
          copyCodeButton: true,
          linkTarget: '_blank',
        },
        onDocumentLoad: doc => {
          this.updateStatus('success', `Loaded: ${doc.title}`);
        },
      },
      'api-docs': {
        title: 'API Documentation',
        source: {
          type: 'local',
          documents: this.getApiDocuments(),
        },
        navigation: {
          showCategories: true,
          collapsible: true,
        },
        search: {
          enabled: true,
        },
        render: {
          syntaxHighlighting: true,
          copyCodeButton: true,
        },
      },
    };
  }

  loadExample(exampleName) {
    this.updateStatus('loading', 'Loading example...');
    this.setProgress(30);

    // Destroy existing viewer
    if (this.viewer) {
      this.viewer.destroy();
    }

    // Get example config
    const config = this.examples[exampleName];
    if (!config) {
      this.updateStatus('error', `Example "${exampleName}" not found`);
      return;
    }

    this.setProgress(60);

    try {
      // Get current theme from theme manager
      const currentTheme = this.themeManager.getCurrentTheme();

      // Create new viewer
      this.viewer = new MarkdownDocsViewer({
        ...config,
        container: '#viewer-container',
        theme: currentTheme,
        onError: error => {
          this.updateStatus('error', error.message);
        },
      });

      this.currentExample = exampleName;
      this.setProgress(100);

      setTimeout(() => {
        this.updateStatus('success', `Loaded "${config.title}"`);
        this.hideProgress();
      }, 500);
    } catch (error) {
      this.updateStatus('error', error.message);
      this.hideProgress();
    }
  }

  reloadViewer() {
    this.loadExample(this.currentExample);
  }

  toggleFullscreen() {
    const container = document.getElementById('viewer-container');

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          this.updateStatus('success', 'Entered fullscreen mode');
        })
        .catch(err => {
          this.updateStatus('error', `Fullscreen error: ${err.message}`);
        });
    } else {
      document.exitFullscreen();
      this.updateStatus('success', 'Exited fullscreen mode');
    }
  }

  updateStatus(type, message) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');

    indicator.className = `status-indicator ${type}`;
    text.textContent = message;
  }

  setProgress(percent) {
    const progressBar = document.getElementById('loading-progress');
    const loadingBar = document.getElementById('loading-bar');

    loadingBar.style.display = 'inline-block';
    progressBar.style.width = `${percent}%`;
  }

  hideProgress() {
    const loadingBar = document.getElementById('loading-bar');
    setTimeout(() => {
      loadingBar.style.display = 'none';
    }, 300);
  }

  // Content generators
  getBasicContent() {
    return `# Getting Started

Welcome to the Markdown Documentation Viewer! This guide will help you get up and running quickly.

## Installation

Install the package via npm:

\`\`\`bash
npm install @your-username/markdown-docs-viewer
\`\`\`

Or via CDN:

\`\`\`html
<script src="https://unpkg.com/@your-username/markdown-docs-viewer"></script>
\`\`\`

## Basic Usage

Here's a simple example to get you started:

\`\`\`javascript
import { MarkdownDocsViewer } from '@your-username/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
    container: '#docs',
    source: {
        type: 'local',
        documents: [
            {
                id: 'intro',
                title: 'Introduction',
                content: '# Welcome\\n\\nThis is your documentation.'
            }
        ]
    }
});
\`\`\`

## Features

- 📚 Multiple document sources (local, URL, GitHub)
- 🎨 Customizable themes
- 🔍 Built-in search functionality
- 📱 Responsive design
- ⚡ Fast and lightweight

## Next Steps

- Check out the [Configuration Guide](#configuration)
- Learn about [Theming](#theming)
- Explore [Advanced Features](#advanced)
`;
  }

  getConfigContent() {
    return `# Configuration

The Markdown Documentation Viewer is highly configurable. Here are all available options:

## Core Configuration

\`\`\`typescript
interface DocumentationConfig {
    container: string | HTMLElement;
    source: DocumentSource;
    theme?: Theme;
    title?: string;
    logo?: string;
    footer?: string;
    navigation?: NavigationConfig;
    search?: SearchConfig;
    render?: RenderConfig;
    responsive?: boolean;
    routing?: 'hash' | 'history' | 'none';
    onDocumentLoad?: (doc: Document) => void;
    onError?: (error: Error) => void;
}
\`\`\`

## Document Sources

### Local Documents

\`\`\`javascript
source: {
    type: 'local',
    documents: [
        {
            id: 'doc1',
            title: 'Document 1',
            content: '# Content here'
        }
    ]
}
\`\`\`

### URL-based Documents

\`\`\`javascript
source: {
    type: 'url',
    baseUrl: 'https://example.com/docs',
    documents: [
        { file: '/introduction.md' },
        { file: '/guide.md' }
    ]
}
\`\`\`

### GitHub Repository

\`\`\`javascript
source: {
    type: 'github',
    repository: 'owner/repo',
    branch: 'main',
    docsPath: 'docs'
}
\`\`\`

## Navigation Options

\`\`\`javascript
navigation: {
    showCategories: true,
    showTags: false,
    collapsible: true,
    showDescription: true
}
\`\`\`

## Search Configuration

\`\`\`javascript
search: {
    enabled: true,
    placeholder: 'Search docs...',
    maxResults: 10,
    minLength: 3
}
\`\`\`
`;
  }

  getThemingContent() {
    return `# Theming

Customize the appearance of your documentation with themes.

## Built-in Themes

The viewer comes with two built-in themes:

### Default Theme
\`\`\`javascript
import { defaultTheme } from '@your-username/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
    theme: defaultTheme,
    // ... other options
});
\`\`\`

### Dark Theme
\`\`\`javascript
import { darkTheme } from '@your-username/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
    theme: darkTheme,
    // ... other options
});
\`\`\`

## Custom Themes

Create your own theme by defining colors, fonts, and spacing:

\`\`\`javascript
const customTheme = {
    colors: {
        primary: '#3b82f6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textLight: '#64748b',
        border: '#e2e8f0',
        code: '#8b5cf6',
        codeBackground: '#f1f5f9'
    },
    fonts: {
        body: '-apple-system, BlinkMacSystemFont, sans-serif',
        heading: 'Georgia, serif',
        code: 'Menlo, Monaco, monospace'
    },
    spacing: {
        content: '2rem',
        navigation: '1.5rem'
    },
    radius: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem'
    }
};
\`\`\`

## Dynamic Theme Switching

Switch themes at runtime:

\`\`\`javascript
// Switch to dark theme
viewer.setTheme(darkTheme);

// Switch to custom theme
viewer.setTheme(customTheme);
\`\`\`

## CSS Variables

The viewer uses CSS custom properties that you can override:

\`\`\`css
.mdv-app {
    --mdv-color-primary: #3b82f6;
    --mdv-color-background: #ffffff;
    --mdv-font-body: system-ui, sans-serif;
}
\`\`\`
`;
  }

  getAdvancedDocuments() {
    return [
      {
        id: 'advanced-features',
        title: 'Advanced Features',
        category: 'Advanced',
        tags: ['features', 'advanced'],
        content: `# Advanced Features

## Code Syntax Highlighting

The viewer supports syntax highlighting for over 180 languages:

\`\`\`javascript
// JavaScript example
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

\`\`\`python
# Python example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
\`\`\`

## Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
\`\`\`

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown Parsing | ✅ Complete | High |
| Theming | ✅ Complete | High |
| Search | ✅ Complete | Medium |
| Plugins | 🚧 In Progress | Low |

## Task Lists

- [x] Basic markdown support
- [x] Syntax highlighting
- [x] Theme system
- [ ] Plugin architecture
- [ ] Export functionality
`,
      },
      {
        id: 'plugins',
        title: 'Plugin System',
        category: 'Advanced',
        tags: ['plugins', 'extensibility'],
        content: `# Plugin System

Extend the viewer with custom plugins:

## Creating a Plugin

\`\`\`javascript
const myPlugin = {
    name: 'my-plugin',
    install(viewer) {
        // Access viewer instance
        viewer.on('document:load', (doc) => {
            console.log('Document loaded:', doc.title);
        });

        // Add custom renderer
        viewer.addRenderer('custom', (content) => {
            return \`<div class="custom">\${content}</div>\`;
        });
    }
};

// Use the plugin
const viewer = new MarkdownDocsViewer({
    plugins: [myPlugin],
    // ... other options
});
\`\`\`

## Available Hooks

- \`viewer:init\` - Viewer initialized
- \`document:load\` - Document loaded
- \`document:render\` - Before rendering
- \`search:query\` - Search performed
- \`theme:change\` - Theme changed
`,
      },
      {
        id: 'performance',
        title: 'Performance Optimization',
        category: 'Advanced',
        tags: ['performance', 'optimization'],
        content: `# Performance Optimization

## Lazy Loading

Documents are loaded on-demand to improve initial load time:

\`\`\`javascript
source: {
    type: 'url',
    baseUrl: 'https://api.example.com/docs',
    documents: [
        { file: '/intro.md', preload: true },  // Preload this
        { file: '/guide.md' },                 // Load on demand
        { file: '/api.md' }                    // Load on demand
    ]
}
\`\`\`

## Virtual Scrolling

For large document lists, enable virtual scrolling:

\`\`\`javascript
navigation: {
    virtualScroll: true,
    itemHeight: 40
}
\`\`\`

## Caching

Enable document caching:

\`\`\`javascript
cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
    storage: 'localStorage'
}
\`\`\`
`,
      },
    ];
  }

  getApiDocuments() {
    return [
      {
        id: 'api-viewer',
        title: 'MarkdownDocsViewer',
        category: 'API Reference',
        content: `# MarkdownDocsViewer

The main class for creating a documentation viewer.

## Constructor

\`\`\`typescript
new MarkdownDocsViewer(config: DocumentationConfig)
\`\`\`

### Parameters

- \`config\` - Configuration object

## Methods

### setTheme(theme: Theme): void

Changes the current theme.

\`\`\`javascript
viewer.setTheme(darkTheme);
\`\`\`

### refresh(): Promise<void>

Reloads all documents.

\`\`\`javascript
await viewer.refresh();
\`\`\`

### destroy(): void

Destroys the viewer and cleans up resources.

\`\`\`javascript
viewer.destroy();
\`\`\`

## Events

### document:load

Fired when a document is loaded.

\`\`\`javascript
viewer.on('document:load', (doc) => {
    console.log('Loaded:', doc.title);
});
\`\`\`
`,
      },
      {
        id: 'api-types',
        title: 'Type Definitions',
        category: 'API Reference',
        content: `# Type Definitions

## DocumentationConfig

\`\`\`typescript
interface DocumentationConfig {
    container: string | HTMLElement;
    source: DocumentSource;
    theme?: Theme;
    title?: string;
    logo?: string;
    footer?: string;
    navigation?: NavigationConfig;
    search?: SearchConfig;
    render?: RenderConfig;
    responsive?: boolean;
    routing?: 'hash' | 'history' | 'none';
    onDocumentLoad?: (doc: Document) => void;
    onError?: (error: Error) => void;
}
\`\`\`

## Document

\`\`\`typescript
interface Document {
    id: string;
    title: string;
    content?: string;
    file?: string;
    description?: string;
    category?: string;
    tags?: string[];
    order?: number;
    hidden?: boolean;
}
\`\`\`

## Theme

\`\`\`typescript
interface Theme {
    colors: {
        primary: string;
        background: string;
        surface: string;
        text: string;
        textLight: string;
        border: string;
        code: string;
        codeBackground: string;
    };
    fonts: {
        body: string;
        heading: string;
        code: string;
    };
    spacing?: {
        content: string;
        navigation: string;
    };
    radius?: {
        small: string;
        medium: string;
        large: string;
    };
}
\`\`\`
`,
      },
      {
        id: 'api-utilities',
        title: 'Utility Functions',
        category: 'API Reference',
        content: `# Utility Functions

## createViewer

Factory function for creating viewers.

\`\`\`typescript
function createViewer(config: DocumentationConfig): MarkdownDocsViewer
\`\`\`

### Example

\`\`\`javascript
import { createViewer } from '@your-username/markdown-docs-viewer';

const viewer = createViewer({
    container: '#docs',
    source: { type: 'local', documents: [...] }
});
\`\`\`

## parseMarkdown

Parse markdown content with options.

\`\`\`typescript
function parseMarkdown(content: string, options?: ParseOptions): string
\`\`\`

## loadGitHubDocs

Helper for loading GitHub documentation.

\`\`\`typescript
async function loadGitHubDocs(
    repository: string,
    options?: GitHubOptions
): Promise<Document[]>
\`\`\`
`,
      },
    ];
  }
}

// Initialize demo when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.demoController = new DemoController();
  });
} else {
  window.demoController = new DemoController();
}

// Make loadExample available globally for footer links
window.loadExample = function (exampleName) {
  if (window.demoController) {
    window.demoController.loadExample(exampleName);
  }
};
