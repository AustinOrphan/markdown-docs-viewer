# Phase 1: Essential Fixes & Demo - Detailed Breakdown

**Duration**: 3-5 days  
**Priority**: HIGH  
**Goal**: Make the project immediately usable with working demo, tests, and proper metadata

---

## Task 1.1: Create Working Demo Page

**Duration**: 1 day  
**Deliverable**: Functional demo website showcasing all viewer capabilities

### Subtask 1.1.1: Setup Demo Infrastructure

**Duration**: 2 hours

#### Step 1.1.1.1: Create Demo Directory Structure

**Deliverable**: Organized demo folder with all necessary files

```bash
demo/
├── index.html          # Main demo page
├── demo.css           # Demo-specific styling
├── demo.js            # Demo JavaScript logic
├── package.json       # Demo dependencies
├── content/           # Sample markdown files
└── assets/           # Images and resources
```

**Implementation Steps**:

1. Create `demo/` directory in project root
2. Create `demo/content/` subdirectory
3. Create `demo/assets/` subdirectory
4. Initialize file structure with empty files

#### Step 1.1.1.2: Create Demo Package Configuration

**Deliverable**: `demo/package.json`

```json
{
  "name": "markdown-docs-viewer-demo",
  "version": "1.0.0",
  "description": "Interactive demo for Markdown Documentation Viewer",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "npx http-server -p 3000 -c-1 --cors",
    "build": "npm run build --prefix ..",
    "dev": "npm run start"
  },
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
```

**Implementation Steps**:

1. Create package.json with above content
2. Test `npm install` in demo directory
3. Verify `npm start` serves files correctly
4. Confirm CORS headers for local development

### Subtask 1.1.2: Build Demo HTML Structure

**Duration**: 3 hours

#### Step 1.1.2.1: Create Main Demo Page

**Deliverable**: `demo/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Markdown Documentation Viewer - Interactive Demo</title>
    <link rel="stylesheet" href="demo.css" />
    <meta
      name="description"
      content="Interactive demo showcasing the Markdown Documentation Viewer with live examples, theme switching, and configuration options."
    />
  </head>
  <body>
    <!-- Header Section -->
    <header class="demo-header">
      <div class="demo-container">
        <h1 class="demo-title">
          <span class="demo-icon">📚</span>
          Markdown Documentation Viewer
        </h1>
        <p class="demo-subtitle">Interactive Demo & Examples</p>

        <!-- Control Panel -->
        <div class="demo-controls">
          <div class="control-group">
            <label for="theme-selector">Theme:</label>
            <select id="theme-selector" class="demo-select">
              <option value="default">Light Theme</option>
              <option value="dark">Dark Theme</option>
              <option value="custom">Custom Theme</option>
            </select>
          </div>

          <div class="control-group">
            <label for="example-selector">Example:</label>
            <select id="example-selector" class="demo-select">
              <option value="basic">Basic Documentation</option>
              <option value="github">GitHub Repository</option>
              <option value="url">Remote Content</option>
              <option value="advanced">Advanced Features</option>
              <option value="api-docs">API Documentation</option>
            </select>
          </div>

          <div class="control-group">
            <button id="reload-btn" class="demo-button">🔄 Reload</button>
            <button id="fullscreen-btn" class="demo-button">⛶ Fullscreen</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Demo Status -->
    <div class="demo-status" id="demo-status">
      <div class="demo-container">
        <span class="status-indicator" id="status-indicator">●</span>
        <span class="status-text" id="status-text">Loading demo...</span>
        <div class="loading-bar" id="loading-bar">
          <div class="loading-progress" id="loading-progress"></div>
        </div>
      </div>
    </div>

    <!-- Main Viewer Container -->
    <main class="demo-main">
      <div id="viewer-container" class="viewer-container"></div>
    </main>

    <!-- Footer -->
    <footer class="demo-footer">
      <div class="demo-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>About This Demo</h3>
            <p>
              This interactive demo showcases all features of the Markdown Documentation Viewer. Try
              different themes and examples to see the flexibility.
            </p>
          </div>
          <div class="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#" onclick="loadExample('basic')">Basic Example</a></li>
              <li><a href="#" onclick="loadExample('advanced')">Advanced Features</a></li>
              <li>
                <a href="https://github.com/[USERNAME]/markdown-docs-viewer" target="_blank"
                  >GitHub Repository</a
                >
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/@[USERNAME]/markdown-docs-viewer"
                  target="_blank"
                  >NPM Package</a
                >
              </li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Features Shown</h3>
            <ul>
              <li>✅ Multiple Document Sources</li>
              <li>✅ Theme Switching</li>
              <li>✅ Responsive Design</li>
              <li>✅ Search Functionality</li>
              <li>✅ Syntax Highlighting</li>
              <li>✅ Navigation & Categories</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Markdown Documentation Viewer. MIT License.</p>
        </div>
      </div>
    </footer>

    <script type="module" src="demo.js"></script>
  </body>
</html>
```

**Implementation Steps**:

1. Create semantic HTML structure
2. Add accessibility attributes (ARIA labels, roles)
3. Include meta tags for SEO
4. Implement responsive viewport settings
5. Add placeholder content for all sections

#### Step 1.1.2.2: Create Demo Styling

**Deliverable**: `demo/demo.css`

```css
/* Demo Page Styles */
:root {
  --demo-primary: #3b82f6;
  --demo-secondary: #10b981;
  --demo-background: #ffffff;
  --demo-surface: #f8fafc;
  --demo-text: #1e293b;
  --demo-text-light: #64748b;
  --demo-border: #e2e8f0;
  --demo-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --demo-radius: 0.5rem;
}

[data-theme='dark'] {
  --demo-background: #0f172a;
  --demo-surface: #1e293b;
  --demo-text: #f1f5f9;
  --demo-text-light: #94a3b8;
  --demo-border: #334155;
}

/* Reset and Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--demo-background);
  color: var(--demo-text);
  line-height: 1.6;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Demo Header */
.demo-header {
  background: linear-gradient(135deg, var(--demo-primary) 0%, var(--demo-secondary) 100%);
  color: white;
  padding: 2rem 0;
  box-shadow: var(--demo-shadow);
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.demo-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.demo-icon {
  font-size: 3rem;
}

.demo-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

/* Control Panel */
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: var(--demo-radius);
  backdrop-filter: blur(10px);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 500;
  white-space: nowrap;
}

.demo-select {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--demo-radius);
  background: rgba(255, 255, 255, 0.9);
  color: var(--demo-text);
  font-size: 0.875rem;
  min-width: 150px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-select:hover {
  background: white;
  transform: translateY(-1px);
}

.demo-button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--demo-radius);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* Status Bar */
.demo-status {
  background: var(--demo-surface);
  border-bottom: 1px solid var(--demo-border);
  padding: 0.75rem 0;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-indicator.loading {
  color: #f59e0b;
}
.status-indicator.success {
  color: #10b981;
}
.status-indicator.error {
  color: #ef4444;
}

.status-text {
  font-size: 0.875rem;
  color: var(--demo-text-light);
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: var(--demo-border);
  border-radius: 2px;
  overflow: hidden;
  margin-left: 1rem;
  display: inline-block;
  vertical-align: middle;
}

.loading-progress {
  height: 100%;
  background: var(--demo-primary);
  width: 0%;
  transition: width 0.3s ease;
}

/* Main Viewer */
.demo-main {
  min-height: 600px;
  background: var(--demo-background);
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Footer */
.demo-footer {
  background: var(--demo-surface);
  border-top: 1px solid var(--demo-border);
  padding: 3rem 0 1rem;
  margin-top: 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3 {
  color: var(--demo-primary);
  margin-bottom: 1rem;
  font-size: 1.125rem;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: var(--demo-text-light);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-section a:hover {
  color: var(--demo-primary);
}

.footer-bottom {
  padding-top: 1rem;
  border-top: 1px solid var(--demo-border);
  text-align: center;
  color: var(--demo-text-light);
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .demo-title {
    font-size: 2rem;
  }

  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    justify-content: space-between;
  }

  .demo-select {
    min-width: auto;
    flex: 1;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Error States */
.demo-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: var(--demo-radius);
  margin: 1rem 0;
}

.demo-error h3 {
  margin-bottom: 0.5rem;
}

/* Success States */
.demo-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: var(--demo-radius);
  margin: 1rem 0;
}
```

**Implementation Steps**:

1. Define CSS custom properties for theming
2. Create responsive layout styles
3. Implement component-specific styling
4. Add animation and transition effects
5. Test across different screen sizes

### Subtask 1.1.3: Implement Demo JavaScript Logic

**Duration**: 4 hours

#### Step 1.1.3.1: Create Demo Controller

**Deliverable**: `demo/demo.js`

```javascript
// Import the viewer library
import { createViewer, defaultTheme, darkTheme, createCustomTheme } from '../dist/index.es.js';

// Demo configuration and state
class DemoController {
  constructor() {
    this.currentViewer = null;
    this.currentExample = 'basic';
    this.currentTheme = 'default';
    this.isLoading = false;

    // Example configurations
    this.examples = {
      basic: {
        title: 'Basic Documentation',
        description: 'Simple documentation with multiple pages',
        config: {
          container: '#viewer-container',
          title: 'Basic Documentation',
          source: {
            type: 'local',
            basePath: './content',
            documents: [
              {
                id: 'getting-started',
                title: 'Getting Started',
                file: 'getting-started.md',
                order: 1,
                category: 'Introduction',
                description: 'Learn the basics of using this viewer',
              },
              {
                id: 'installation',
                title: 'Installation',
                file: 'installation.md',
                order: 2,
                category: 'Introduction',
                description: 'How to install and setup',
              },
              {
                id: 'configuration',
                title: 'Configuration',
                file: 'configuration.md',
                order: 3,
                category: 'Guide',
                description: 'Configure the viewer for your needs',
              },
              {
                id: 'api-reference',
                title: 'API Reference',
                file: 'api-reference.md',
                order: 4,
                category: 'Reference',
                description: 'Complete API documentation',
              },
            ],
          },
          search: {
            enabled: true,
            placeholder: 'Search documentation...',
            caseSensitive: false,
            fuzzySearch: false,
          },
          navigation: {
            showCategories: true,
            showTags: false,
            collapsible: true,
            showDescription: true,
            sortBy: 'order',
          },
          render: {
            syntaxHighlighting: true,
            copyCodeButton: true,
            linkTarget: '_blank',
          },
          onDocumentLoad: doc => {
            this.updateStatus('success', `Loaded: ${doc.title}`);
            console.log('Document loaded:', doc);
          },
          onError: error => {
            this.updateStatus('error', `Error: ${error.message}`);
            console.error('Viewer error:', error);
          },
        },
      },

      github: {
        title: 'GitHub Repository',
        description: 'Load documentation directly from GitHub',
        config: {
          container: '#viewer-container',
          title: 'GitHub Documentation',
          source: {
            type: 'github',
            documents: [
              {
                id: 'readme',
                title: 'README',
                file: 'microsoft/vscode/main/README.md',
                order: 1,
                description: 'VS Code README from GitHub',
              },
              {
                id: 'contributing',
                title: 'Contributing',
                file: 'microsoft/vscode/main/CONTRIBUTING.md',
                order: 2,
                description: 'How to contribute to VS Code',
              },
            ],
          },
          search: { enabled: true },
          navigation: { showCategories: false },
        },
      },

      url: {
        title: 'Remote Content',
        description: 'Load documentation from remote URLs',
        config: {
          container: '#viewer-container',
          title: 'Remote Documentation',
          source: {
            type: 'url',
            baseUrl: 'https://raw.githubusercontent.com/microsoft/vscode/main',
            documents: [
              {
                id: 'remote-readme',
                title: 'Remote README',
                file: 'README.md',
                order: 1,
              },
            ],
          },
        },
      },

      advanced: {
        title: 'Advanced Features',
        description: 'Showcase advanced functionality',
        config: {
          container: '#viewer-container',
          title: 'Advanced Documentation Demo',
          logo: './assets/logo.svg',
          footer: 'Powered by Markdown Documentation Viewer',
          source: {
            type: 'content',
            documents: [
              {
                id: 'features',
                title: 'Advanced Features',
                category: 'Features',
                tags: ['advanced', 'demo'],
                content: this.getAdvancedContent(),
                order: 1,
                description: 'Demonstration of advanced features',
              },
              {
                id: 'syntax-highlighting',
                title: 'Syntax Highlighting',
                category: 'Features',
                tags: ['code', 'highlighting'],
                content: this.getSyntaxHighlightingContent(),
                order: 2,
                description: 'Code syntax highlighting examples',
              },
              {
                id: 'tables-lists',
                title: 'Tables & Lists',
                category: 'Elements',
                tags: ['tables', 'lists'],
                content: this.getTablesListsContent(),
                order: 3,
                description: 'Table and list formatting',
              },
            ],
          },
          search: {
            enabled: true,
            searchInTags: true,
            maxResults: 15,
          },
          navigation: {
            showCategories: true,
            showTags: true,
            showDescription: true,
            collapsible: true,
          },
          render: {
            syntaxHighlighting: true,
            copyCodeButton: true,
            linkTarget: '_blank',
          },
          responsive: true,
          routing: 'hash',
        },
      },

      'api-docs': {
        title: 'API Documentation',
        description: 'Structured API documentation example',
        config: {
          container: '#viewer-container',
          title: 'API Documentation',
          source: {
            type: 'content',
            documents: [
              {
                id: 'overview',
                title: 'API Overview',
                category: 'Getting Started',
                content: this.getAPIOverviewContent(),
                order: 1,
              },
              {
                id: 'authentication',
                title: 'Authentication',
                category: 'Getting Started',
                content: this.getAuthenticationContent(),
                order: 2,
              },
              {
                id: 'endpoints',
                title: 'Endpoints',
                category: 'Reference',
                content: this.getEndpointsContent(),
                order: 3,
              },
              {
                id: 'errors',
                title: 'Error Codes',
                category: 'Reference',
                content: this.getErrorCodesContent(),
                order: 4,
              },
            ],
          },
          navigation: {
            showCategories: true,
            collapsible: false,
          },
        },
      },
    };

    // Theme configurations
    this.themes = {
      default: defaultTheme,
      dark: darkTheme,
      custom: createCustomTheme({
        name: 'custom-demo',
        colors: {
          primary: '#8b5cf6',
          secondary: '#06b6d4',
          background: '#fefefe',
          surface: '#f8fafc',
          textPrimary: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          codeBackground: '#f1f5f9',
          link: '#8b5cf6',
          linkHover: '#7c3aed',
        },
        fonts: {
          body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          code: '"Fira Code", "JetBrains Mono", monospace',
        },
        borderRadius: '0.75rem',
      }),
    };
  }

  // Initialize the demo
  async init() {
    try {
      this.updateStatus('loading', 'Initializing demo...');

      // Setup event listeners
      this.setupEventListeners();

      // Load initial example
      await this.loadExample(this.currentExample);

      this.updateStatus('success', 'Demo ready');
    } catch (error) {
      this.updateStatus('error', `Initialization failed: ${error.message}`);
      console.error('Demo initialization error:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    themeSelector?.addEventListener('change', e => {
      this.changeTheme(e.target.value);
    });

    // Example selector
    const exampleSelector = document.getElementById('example-selector');
    exampleSelector?.addEventListener('change', e => {
      this.loadExample(e.target.value);
    });

    // Reload button
    const reloadBtn = document.getElementById('reload-btn');
    reloadBtn?.addEventListener('click', () => {
      this.reloadCurrentExample();
    });

    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Global error handler
    window.addEventListener('error', e => {
      this.updateStatus('error', `JavaScript error: ${e.message}`);
    });

    // Handle hash changes for routing demo
    window.addEventListener('hashchange', () => {
      if (this.currentExample === 'advanced') {
        // Let the viewer handle routing
      }
    });
  }

  // Load a specific example
  async loadExample(exampleId) {
    if (!this.examples[exampleId]) {
      this.updateStatus('error', `Example '${exampleId}' not found`);
      return;
    }

    try {
      this.updateStatus('loading', `Loading ${this.examples[exampleId].title}...`);
      this.setLoading(true);

      // Destroy existing viewer
      if (this.currentViewer) {
        this.currentViewer.destroy();
        this.currentViewer = null;
      }

      // Clear container
      const container = document.getElementById('viewer-container');
      if (container) {
        container.innerHTML = '';
      }

      // Create new viewer with current theme
      const config = { ...this.examples[exampleId].config };
      config.theme = this.themes[this.currentTheme];

      // Add demo-specific callbacks
      const originalOnLoad = config.onDocumentLoad;
      config.onDocumentLoad = doc => {
        if (originalOnLoad) originalOnLoad(doc);
        this.updateProgress(100);
      };

      const originalOnError = config.onError;
      config.onError = error => {
        if (originalOnError) originalOnError(error);
        this.setLoading(false);
      };

      // Simulate loading progress
      this.simulateProgress();

      // Create viewer
      this.currentViewer = createViewer(config);
      this.currentExample = exampleId;

      // Update UI
      this.updateExampleSelector(exampleId);
      this.updateStatus('success', `Loaded ${this.examples[exampleId].title}`);

      setTimeout(() => this.setLoading(false), 1000);
    } catch (error) {
      this.updateStatus('error', `Failed to load example: ${error.message}`);
      this.setLoading(false);
      console.error('Example loading error:', error);
    }
  }

  // Change theme
  changeTheme(themeId) {
    if (!this.themes[themeId]) {
      this.updateStatus('error', `Theme '${themeId}' not found`);
      return;
    }

    this.currentTheme = themeId;

    if (this.currentViewer) {
      this.currentViewer.setTheme(this.themes[themeId]);
      this.updateStatus('success', `Applied ${themeId} theme`);
    }

    // Update demo page theme
    if (themeId === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  // Reload current example
  async reloadCurrentExample() {
    await this.loadExample(this.currentExample);
  }

  // Toggle fullscreen mode
  toggleFullscreen() {
    const container = document.getElementById('viewer-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        this.updateStatus('error', `Fullscreen failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Update status display
  updateStatus(type, message) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');

    if (indicator) {
      indicator.className = `status-indicator ${type}`;
    }

    if (text) {
      text.textContent = message;
    }
  }

  // Set loading state
  setLoading(loading) {
    this.isLoading = loading;
    const loadingBar = document.getElementById('loading-bar');

    if (loadingBar) {
      loadingBar.style.display = loading ? 'inline-block' : 'none';
    }

    if (!loading) {
      this.updateProgress(0);
    }
  }

  // Update progress bar
  updateProgress(percent) {
    const progress = document.getElementById('loading-progress');
    if (progress) {
      progress.style.width = `${percent}%`;
    }
  }

  // Simulate loading progress
  simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      this.updateProgress(progress);
    }, 200);
  }

  // Update example selector
  updateExampleSelector(exampleId) {
    const selector = document.getElementById('example-selector');
    if (selector) {
      selector.value = exampleId;
    }
  }

  // Content generators for examples
  getAdvancedContent() {
    return `# Advanced Features Demo

This demo showcases the advanced capabilities of the Markdown Documentation Viewer.

## Features Demonstrated

### 🎨 Theme System
- Multiple built-in themes (light, dark)
- Custom theme creation
- Real-time theme switching
- CSS custom properties

### 🔍 Search Functionality
- Full-text search across all documents
- Tag-based filtering
- Case-sensitive/insensitive options
- Configurable result limits

### 📱 Responsive Design
- Mobile-first approach
- Collapsible navigation
- Touch-friendly interactions
- Adaptive layouts

### 🚀 Performance Features
- Lazy loading of content
- Efficient document caching
- Virtual scrolling for large lists
- Optimized rendering

## Code Example

\`\`\`javascript
import { createViewer, darkTheme } from '@yourusername/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  theme: darkTheme,
  source: {
    type: 'github',
    documents: [
      {
        id: 'readme',
        title: 'README',
        file: 'owner/repo/main/README.md'
      }
    ]
  },
  search: {
    enabled: true,
    fuzzySearch: true
  },
  navigation: {
    showCategories: true,
    collapsible: true
  }
});
\`\`\`

## Interactive Elements

Try the following:
- Switch between themes using the controls above
- Use the search functionality
- Navigate between different document categories
- Resize your browser window to see responsive behavior

> **Tip**: This viewer supports all GitHub Flavored Markdown features including tables, task lists, and syntax highlighting.
`;
  }

  getSyntaxHighlightingContent() {
    return `# Syntax Highlighting Examples

The viewer supports syntax highlighting for over 180 programming languages.

## JavaScript

\`\`\`javascript
class MarkdownViewer {
  constructor(config) {
    this.config = config;
    this.documents = new Map();
  }
  
  async loadDocument(id) {
    if (this.documents.has(id)) {
      return this.documents.get(id);
    }
    
    const doc = await this.fetchDocument(id);
    this.documents.set(id, doc);
    return doc;
  }
}
\`\`\`

## Python

\`\`\`python
from typing import Dict, List, Optional
import asyncio

class DocumentLoader:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.cache: Dict[str, str] = {}
    
    async def load_document(self, path: str) -> Optional[str]:
        if path in self.cache:
            return self.cache[path]
        
        content = await self._fetch_content(path)
        self.cache[path] = content
        return content
    
    async def _fetch_content(self, path: str) -> str:
        # Implementation here
        pass
\`\`\`

## TypeScript

\`\`\`typescript
interface DocumentConfig {
  id: string;
  title: string;
  file?: string;
  content?: string;
  category?: string;
  tags?: string[];
  order?: number;
}

interface ViewerState {
  currentDocument: DocumentConfig | null;
  documents: DocumentConfig[];
  searchQuery: string;
  loading: boolean;
}

class TypedViewer<T extends DocumentConfig> {
  private state: ViewerState;
  
  constructor(private config: T[]) {
    this.state = {
      currentDocument: null,
      documents: config,
      searchQuery: '',
      loading: false
    };
  }
  
  public getDocument(id: string): T | undefined {
    return this.config.find(doc => doc.id === id);
  }
}
\`\`\`

## CSS

\`\`\`css
.markdown-viewer {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --background: #ffffff;
  --text-color: #1e293b;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
}

.viewer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  
  & h1, h2, h3 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  & code {
    background: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-family: 'Fira Code', monospace;
  }
}
\`\`\`

## JSON

\`\`\`json
{
  "name": "@username/markdown-docs-viewer",
  "version": "1.0.0",
  "description": "A themeable markdown documentation viewer",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "vite build && tsc",
    "test": "vitest",
    "dev": "vite dev"
  },
  "dependencies": {
    "marked": "^12.0.0",
    "highlight.js": "^11.9.0"
  },
  "peerDependencies": {
    "marked": ">=12.0.0",
    "highlight.js": ">=11.0.0"
  }
}
\`\`\`

## Bash

\`\`\`bash
#!/bin/bash

# Install the markdown viewer
npm install @username/markdown-docs-viewer

# Build the project
npm run build

# Run tests with coverage
npm test -- --coverage

# Start development server
npm run dev

# Deploy to production
npm run build && npm run deploy
\`\`\`

## Additional Languages

The viewer supports many more languages including:
- Go, Rust, Java, C++, C#
- Ruby, PHP, Swift, Kotlin
- SQL, YAML, TOML, XML
- And many more...
`;
  }

  getTablesListsContent() {
    return `# Tables & Lists Examples

## Tables

### Basic Table

| Feature | Supported | Notes |
|---------|-----------|-------|
| Syntax Highlighting | ✅ | 180+ languages |
| Theme Switching | ✅ | Light, dark, custom |
| Search | ✅ | Full-text search |
| Mobile Responsive | ✅ | Touch-friendly |
| GitHub Integration | ✅ | Direct repo access |

### Aligned Table

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Content | Content | Content |
| More content | More content | More content |
| Even more | Even more | Even more |

### Complex Table

| Component | Description | Status | Version |
|-----------|-------------|--------|---------|
| **Viewer** | Main component for rendering | 🟢 Stable | 1.0.0 |
| **Loader** | Document loading system | 🟢 Stable | 1.0.0 |
| **Router** | URL routing functionality | 🟡 Beta | 0.9.0 |
| **Search** | Full-text search engine | 🟢 Stable | 1.0.0 |
| **Themes** | Theming system | 🟢 Stable | 1.0.0 |

## Lists

### Unordered Lists

- **Core Features**
  - Document loading from multiple sources
  - Theme customization
  - Responsive design
  - Search functionality

- **Advanced Features**
  - Syntax highlighting
  - Code copy buttons
  - Navigation with categories
  - Hash-based routing

- **Technical Details**
  - TypeScript implementation
  - Vite build system
  - Vitest testing
  - ESM/UMD output

### Ordered Lists

1. **Installation**
   1. Install via npm: \`npm install @username/markdown-docs-viewer\`
   2. Import in your project: \`import { createViewer } from '...'\`
   3. Create viewer instance with configuration

2. **Configuration**
   1. Define document sources
   2. Set theme preferences
   3. Configure navigation options
   4. Setup search parameters

3. **Customization**
   1. Create custom themes
   2. Override CSS variables
   3. Add custom renderers
   4. Implement event handlers

### Task Lists

- [x] ✅ Core viewer implementation
- [x] ✅ Document loading system
- [x] ✅ Theme system with light/dark modes
- [x] ✅ Search functionality
- [x] ✅ Responsive design
- [x] ✅ Syntax highlighting
- [ ] 🔄 Plugin system (planned)
- [ ] 🔄 Advanced search filters (planned)
- [ ] 🔄 Real-time collaboration (future)

### Mixed Lists

1. **Development Setup**
   - Clone the repository
   - Install dependencies: \`npm install\`
   - Start development server: \`npm run dev\`
   
2. **Testing**
   - Run unit tests: \`npm test\`
   - Check coverage: \`npm run test:coverage\`
   - Run specific test: \`npm test -- viewer.test.ts\`

3. **Building**
   - Build for production: \`npm run build\`
   - Check bundle size
   - Verify types are generated

### Nested Lists with Code

- **Frontend Technologies**
  - TypeScript
    \`\`\`typescript
    interface Config {
      theme: Theme;
      source: DocumentSource;
    }
    \`\`\`
  - Modern CSS
    \`\`\`css
    .viewer { --primary: #3b82f6; }
    \`\`\`
  - ES6 Modules
    \`\`\`javascript
    export { createViewer };
    \`\`\`

- **Build Tools**
  - Vite (bundling)
  - TypeScript compiler
  - Vitest (testing)

## Definition Lists

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Another definition for term 2

**Markdown Viewer**
: A component that renders markdown content with navigation, search, and theming capabilities.

**Document Source**
: The origin of markdown content, which can be local files, remote URLs, GitHub repositories, or inline content.

**Theme**
: A configuration object that defines the visual appearance including colors, fonts, spacing, and custom CSS.
`;
  }

  getAPIOverviewContent() {
    return `# API Documentation Overview

Welcome to the Markdown Documentation Viewer API reference.

## Getting Started

\`\`\`javascript
import { createViewer } from '@yourusername/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs',
  source: {
    type: 'content',
    documents: [...]
  }
});
\`\`\`

## Base URL

All API endpoints are relative to: \`https://api.example.com/v1\`

## Authentication

This API uses Bearer token authentication. Include your token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Response Format

All responses are in JSON format:

\`\`\`json
{
  "success": true,
  "data": {...},
  "meta": {
    "version": "1.0.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
\`\`\`
`;
  }

  getAuthenticationContent() {
    return `# Authentication

## Overview

The API uses Bearer token authentication for secure access.

## Getting a Token

\`\`\`bash
curl -X POST https://api.example.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "your_username", "password": "your_password"}'
\`\`\`

## Using the Token

\`\`\`javascript
fetch('https://api.example.com/v1/documents', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});
\`\`\`
`;
  }

  getEndpointsContent() {
    return `# API Endpoints

## Documents

### GET /documents

Retrieve all documents.

**Parameters:**
- \`category\` (optional): Filter by category
- \`limit\` (optional): Number of results (default: 10)

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "documents": [...],
    "total": 25
  }
}
\`\`\`

### GET /documents/:id

Retrieve a specific document.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "doc-1",
    "title": "Document Title",
    "content": "...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
\`\`\`
`;
  }

  getErrorCodesContent() {
    return `# Error Codes

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Error Response Format

\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided token is invalid or expired",
    "details": {...}
  }
}
\`\`\`

## Common Error Codes

- \`INVALID_TOKEN\`: Authentication token is invalid
- \`DOCUMENT_NOT_FOUND\`: Requested document does not exist
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
`;
  }
}

// Global functions for demo
window.loadExample = function (exampleId) {
  if (window.demoController) {
    window.demoController.loadExample(exampleId);
  }
};

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  window.demoController = new DemoController();
  await window.demoController.init();
});

// Export for module usage
export { DemoController };
```

**Implementation Steps**:

1. Create DemoController class with state management
2. Implement example configurations for different use cases
3. Add theme switching functionality
4. Create progress tracking and status updates
5. Implement error handling and recovery
6. Add responsive behavior and accessibility

### Subtask 1.1.4: Create Sample Content

**Duration**: 2 hours

#### Step 1.1.4.1: Create Getting Started Content

**Deliverable**: `demo/content/getting-started.md`

````markdown
---
title: Getting Started
description: Learn how to use the Markdown Documentation Viewer
category: Introduction
order: 1
tags: [getting-started, basics, tutorial]
---

# Getting Started

Welcome to the **Markdown Documentation Viewer**! This guide will help you get up and running quickly with this powerful, themeable documentation component.

## What is it?

The Markdown Documentation Viewer is a lightweight, flexible component that transforms markdown content into beautiful, interactive documentation websites. Whether you're building API docs, user guides, or technical documentation, this viewer provides everything you need.

## ✨ Key Features

- 📚 **Multiple Document Sources**: Load from local files, remote URLs, GitHub repositories, or inline content
- 🎨 **Fully Themeable**: Built-in light/dark themes with complete customization options
- 🔍 **Powerful Search**: Full-text search with configurable options and filters
- 📱 **Mobile-First**: Responsive design that works perfectly on all devices
- ⚡ **High Performance**: Fast loading with intelligent caching and lazy loading
- 🎯 **Framework Agnostic**: Works with any web framework or vanilla JavaScript
- 🛠️ **Developer Friendly**: TypeScript support with comprehensive type definitions

## Quick Start

Get started in just a few lines of code:

```javascript
import { createViewer } from '@yourusername/markdown-docs-viewer';

const viewer = createViewer({
  container: '#documentation',
  source: {
    type: 'content',
    documents: [
      {
        id: 'welcome',
        title: 'Welcome',
        content: '# Welcome\n\nThis is your first document!',
      },
    ],
  },
});
```
````

## Installation

### NPM

```bash
npm install @yourusername/markdown-docs-viewer
```

### CDN

```html
<script type="module">
  import { createViewer } from 'https://unpkg.com/@yourusername/markdown-docs-viewer@latest/dist/index.es.js';
  // Your code here...
</script>
```

### Download

Download the latest release from [GitHub Releases](https://github.com/yourusername/markdown-docs-viewer/releases).

## Basic Usage

### 1. Create HTML Container

```html
<div id="docs-container"></div>
```

### 2. Initialize the Viewer

```javascript
import { createViewer } from '@yourusername/markdown-docs-viewer';

const viewer = createViewer({
  container: '#docs-container',
  title: 'My Documentation',
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'intro', title: 'Introduction', file: 'intro.md' },
      { id: 'guide', title: 'User Guide', file: 'guide.md' },
    ],
  },
});
```

### 3. Add Styling (Optional)

The viewer includes default styling, but you can customize it:

```css
.mdv-app {
  --mdv-primary: #your-brand-color;
  --mdv-font-body: 'Your Font', sans-serif;
}
```

## Document Sources

The viewer supports multiple ways to load content:

### Local Files

```javascript
{
  source: {
    type: 'local',
    basePath: '/docs',
    documents: [
      { id: 'getting-started', title: 'Getting Started', file: 'getting-started.md' }
    ]
  }
}
```

### Remote URLs

```javascript
{
  source: {
    type: 'url',
    baseUrl: 'https://api.example.com/docs',
    headers: { 'Authorization': 'Bearer token' },
    documents: [
      { id: 'api', title: 'API Reference', file: 'api.md' }
    ]
  }
}
```

### GitHub Repository

```javascript
{
  source: {
    type: 'github',
    documents: [
      { id: 'readme', title: 'README', file: 'owner/repo/main/README.md' }
    ]
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
        content: '# Welcome\n\nYour markdown content here...'
      }
    ]
  }
}
```

## Next Steps

Now that you have the basics, explore these topics:

- **[Installation Guide](installation.md)** - Detailed installation instructions
- **[Configuration Options](configuration.md)** - Complete configuration reference
- **[API Reference](api-reference.md)** - Full API documentation
- **[Theming Guide](theming-guide.md)** - Create custom themes

## Need Help?

- 📖 Browse the [full documentation](configuration.md)
- 🐛 Report issues on [GitHub](https://github.com/yourusername/markdown-docs-viewer/issues)
- 💬 Join the discussion in [GitHub Discussions](https://github.com/yourusername/markdown-docs-viewer/discussions)
- 📧 Email support: support@example.com

---

> **Pro Tip**: Try switching between the light and dark themes using the controls above to see how the viewer adapts to different color schemes!

````

**Implementation Steps**:
1. Create comprehensive getting started guide
2. Include code examples for all major features
3. Add clear navigation to next steps
4. Include troubleshooting and support information
5. Use engaging formatting with emojis and callouts

#### Step 1.1.4.2: Create Additional Content Files
**Deliverable**: Multiple content files

Create the following additional files:
- `demo/content/installation.md` - Detailed installation guide
- `demo/content/configuration.md` - Configuration options reference
- `demo/content/api-reference.md` - Complete API documentation
- `demo/content/theming-guide.md` - Theme customization guide
- `demo/content/advanced-usage.md` - Advanced features and examples

**Implementation Steps**:
1. Create each content file with proper frontmatter
2. Include comprehensive examples and code snippets
3. Add cross-references between documents
4. Use consistent formatting and style
5. Include practical examples and use cases

---

## Task 1.2: Add Basic Test Suite
**Duration**: 1 day
**Deliverable**: Comprehensive test suite with >80% coverage

### Subtask 1.2.1: Setup Test Infrastructure
**Duration**: 2 hours

#### Step 1.2.1.1: Create Test Configuration
**Deliverable**: `vitest.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'demo/**',
      'examples/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        'demo/**',
        'examples/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/viewer.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/loader.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    // Test timeout for async operations
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});
````

**Implementation Steps**:

1. Configure Vitest with proper TypeScript support
2. Set up happy-dom environment for DOM testing
3. Configure coverage thresholds and reporting
4. Set up path aliases for easier imports
5. Configure test timeouts for async operations

#### Step 1.2.1.2: Create Test Setup File

**Deliverable**: `tests/setup.ts`

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

// Mock DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for testing document loading
global.fetch = vi.fn();

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn((code: string, { language }: { language: string }) => ({
      value: `<span class="hljs-${language}">${code}</span>`,
    })),
    getLanguage: vi.fn((lang: string) => lang !== 'invalid'),
  },
}));

// Mock marked-highlight
vi.mock('marked-highlight', () => ({
  markedHighlight: vi.fn(options => (marked: any) => marked),
}));

// Setup and cleanup for each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset fetch mock
  (fetch as any).mockReset();

  // Clear document body
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  }

  // Reset localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();

  // Remove any added styles
  if (typeof document !== 'undefined') {
    const styles = document.querySelectorAll('style[data-test]');
    styles.forEach(style => style.remove());
  }
});

// Helper functions for tests
export const createTestContainer = (id = 'test-container'): HTMLElement => {
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);
  return container;
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForElement = (selector: string, timeout = 1000): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(check, 50);
      }
    };

    check();
  });
};

export const mockSuccessfulFetch = (content: string) => {
  (fetch as any).mockResolvedValueOnce({
    ok: true,
    text: () => Promise.resolve(content),
    json: () => Promise.resolve({ content }),
    status: 200,
    statusText: 'OK',
  });
};

export const mockFailedFetch = (status = 404, statusText = 'Not Found') => {
  (fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    text: () => Promise.reject(new Error(statusText)),
  });
};

// Common test data
export const testDocuments = [
  {
    id: 'doc1',
    title: 'Document 1',
    content: '# Document 1\n\nThis is the first document.',
    category: 'Getting Started',
    order: 1,
  },
  {
    id: 'doc2',
    title: 'Document 2',
    content: '# Document 2\n\nThis is the second document.',
    category: 'Advanced',
    order: 2,
  },
];

export const testTheme = {
  name: 'test-theme',
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    surface: '#f8fafc',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    codeBackground: '#f1f5f9',
    link: '#3b82f6',
    linkHover: '#2563eb',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    code: 'Monaco, monospace',
  },
  spacing: {
    unit: 8,
    containerMaxWidth: '1200px',
    sidebarWidth: '300px',
  },
  borderRadius: '0.5rem',
};
```

**Implementation Steps**:

1. Set up DOM mocking with happy-dom
2. Create fetch mocking utilities
3. Mock external dependencies (highlight.js, marked-highlight)
4. Create test helper functions
5. Set up cleanup between tests

### Subtask 1.2.2: Create Core Tests

**Duration**: 4 hours

#### Step 1.2.2.1: Create Viewer Tests

**Deliverable**: `tests/viewer.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownDocsViewer } from '@/viewer';
import { DocumentationConfig } from '@/types';
import { createTestContainer, waitFor, waitForElement, testDocuments, testTheme } from './setup';

describe('MarkdownDocsViewer', () => {
  let container: HTMLElement;
  let basicConfig: DocumentationConfig;

  beforeEach(() => {
    container = createTestContainer();
    basicConfig = {
      container,
      source: {
        type: 'content',
        documents: testDocuments,
      },
    };
  });

  describe('Constructor', () => {
    it('should create viewer instance with valid config', () => {
      const viewer = new MarkdownDocsViewer(basicConfig);
      expect(viewer).toBeInstanceOf(MarkdownDocsViewer);
    });

    it('should throw error with invalid container', () => {
      const invalidConfig = {
        ...basicConfig,
        container: '#non-existent',
      };

      expect(() => new MarkdownDocsViewer(invalidConfig)).toThrow('Container element not found');
    });

    it('should apply default configuration', () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      // Access private config through reflection for testing
      const config = (viewer as any).config;

      expect(config.theme).toBeDefined();
      expect(config.search?.enabled).toBe(true);
      expect(config.navigation?.showCategories).toBe(true);
      expect(config.render?.syntaxHighlighting).toBe(true);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        ...basicConfig,
        search: { enabled: false },
        navigation: { showCategories: false },
      };

      const viewer = new MarkdownDocsViewer(customConfig);
      const config = (viewer as any).config;

      expect(config.search.enabled).toBe(false);
      expect(config.navigation.showCategories).toBe(false);
      expect(config.render?.syntaxHighlighting).toBe(true); // Should keep default
    });
  });

  describe('Initialization', () => {
    it('should render initial UI structure', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitFor(100); // Wait for async init

      expect(container.querySelector('.mdv-app')).toBeTruthy();
      expect(container.querySelector('.mdv-header')).toBeTruthy();
      expect(container.querySelector('.mdv-sidebar')).toBeTruthy();
      expect(container.querySelector('.mdv-content')).toBeTruthy();
    });

    it('should load and display documents', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-nav-link');

      const navLinks = container.querySelectorAll('.mdv-nav-link');
      expect(navLinks).toHaveLength(2);
      expect(navLinks[0].textContent).toContain('Document 1');
      expect(navLinks[1].textContent).toContain('Document 2');
    });

    it('should display loading state initially', async () => {
      new MarkdownDocsViewer(basicConfig);

      // Should show loading immediately
      const loading = container.querySelector('.mdv-loading');
      expect(loading).toBeTruthy();
      expect(loading?.textContent).toContain('Loading');
    });

    it('should handle initialization errors gracefully', async () => {
      const errorConfig = {
        ...basicConfig,
        source: {
          type: 'local' as const,
          basePath: '/invalid',
          documents: [{ id: 'test', title: 'Test', file: 'invalid.md' }],
        },
      };

      const onError = vi.fn();
      const viewer = new MarkdownDocsViewer({
        ...errorConfig,
        onError,
      });

      await waitFor(200);

      expect(onError).toHaveBeenCalled();
      const errorElement = container.querySelector('.mdv-error');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Document Loading', () => {
    it('should load initial document automatically', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-document-content');

      const content = container.querySelector('.mdv-document-content');
      expect(content?.textContent).toContain('This is the first document');
    });

    it('should switch documents when navigation is clicked', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-nav-link');

      // Click second document
      const secondLink = container.querySelectorAll('.mdv-nav-link')[1];
      (secondLink as HTMLElement).click();

      await waitFor(100);

      const content = container.querySelector('.mdv-document-content');
      expect(content?.textContent).toContain('This is the second document');
    });

    it('should update active navigation state', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-nav-link');

      const links = container.querySelectorAll('.mdv-nav-link');
      expect(links[0]).toHaveClass('active');
      expect(links[1]).not.toHaveClass('active');

      // Click second document
      (links[1] as HTMLElement).click();
      await waitFor(100);

      expect(links[0]).not.toHaveClass('active');
      expect(links[1]).toHaveClass('active');
    });

    it('should call onDocumentLoad callback', async () => {
      const onDocumentLoad = vi.fn();

      new MarkdownDocsViewer({
        ...basicConfig,
        onDocumentLoad,
      });

      await waitFor(200);

      expect(onDocumentLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'doc1',
          title: 'Document 1',
        })
      );
    });
  });

  describe('Theme Management', () => {
    it('should apply default theme', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitFor(100);

      const style = document.querySelector('style');
      expect(style?.textContent).toContain('--mdv-primary');
    });

    it('should change theme dynamically', async () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      await waitFor(100);

      viewer.setTheme(testTheme);

      const style = document.querySelector('style');
      expect(style?.textContent).toContain('#3b82f6'); // Test theme primary color
    });

    it('should remove old theme styles when changing theme', async () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      await waitFor(100);

      const initialStyles = document.querySelectorAll('style').length;

      viewer.setTheme(testTheme);

      const finalStyles = document.querySelectorAll('style').length;
      expect(finalStyles).toBe(initialStyles); // Should replace, not add
    });
  });

  describe('Search Functionality', () => {
    it('should render search input when enabled', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-search-input');

      const searchInput = container.querySelector('.mdv-search-input');
      expect(searchInput).toBeTruthy();
    });

    it('should not render search when disabled', async () => {
      const configWithoutSearch = {
        ...basicConfig,
        search: { enabled: false },
      };

      new MarkdownDocsViewer(configWithoutSearch);

      await waitFor(100);

      const searchInput = container.querySelector('.mdv-search-input');
      expect(searchInput).toBeFalsy();
    });

    it('should filter documents on search input', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-search-input');

      const searchInput = container.querySelector('.mdv-search-input') as HTMLInputElement;

      // Simulate search
      searchInput.value = 'first';
      searchInput.dispatchEvent(new Event('input'));

      await waitFor(100);

      // Should show filtered results
      const navLinks = container.querySelectorAll('.mdv-nav-link');
      expect(navLinks).toHaveLength(1);
      expect(navLinks[0].textContent).toContain('Document 1');
    });
  });

  describe('Responsive Behavior', () => {
    it('should add mobile toggle button', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-mobile-toggle');

      const toggle = container.querySelector('.mdv-mobile-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should toggle sidebar on mobile', async () => {
      new MarkdownDocsViewer(basicConfig);

      await waitForElement('.mdv-mobile-toggle');

      const toggle = container.querySelector('.mdv-mobile-toggle') as HTMLElement;
      const sidebar = container.querySelector('.mdv-sidebar') as HTMLElement;

      expect(sidebar).not.toHaveClass('open');

      toggle.click();

      expect(sidebar).toHaveClass('open');
    });
  });

  describe('Error Handling', () => {
    it('should display error state on document load failure', async () => {
      const errorConfig = {
        ...basicConfig,
        source: {
          type: 'local' as const,
          basePath: '/nonexistent',
          documents: [{ id: 'error', title: 'Error Doc', file: 'missing.md' }],
        },
      };

      new MarkdownDocsViewer(errorConfig);

      await waitFor(200);

      const errorElement = container.querySelector('.mdv-error');
      expect(errorElement).toBeTruthy();
    });

    it('should call onError callback on errors', async () => {
      const onError = vi.fn();
      const errorConfig = {
        ...basicConfig,
        source: {
          type: 'local' as const,
          basePath: '/nonexistent',
          documents: [{ id: 'error', title: 'Error Doc', file: 'missing.md' }],
        },
        onError,
      };

      new MarkdownDocsViewer(errorConfig);

      await waitFor(200);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      await waitFor(100);

      const initialStyles = document.querySelectorAll('style').length;

      viewer.destroy();

      const finalStyles = document.querySelectorAll('style').length;
      expect(finalStyles).toBeLessThan(initialStyles);
      expect(container.innerHTML).toBe('');
    });

    it('should remove event listeners on destroy', async () => {
      const viewer = new MarkdownDocsViewer({
        ...basicConfig,
        routing: 'hash',
      });

      await waitFor(100);

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      viewer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    });
  });

  describe('Public API', () => {
    it('should expose refresh method', async () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      expect(typeof viewer.refresh).toBe('function');

      await expect(viewer.refresh()).resolves.not.toThrow();
    });

    it('should expose setTheme method', () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      expect(typeof viewer.setTheme).toBe('function');
      expect(() => viewer.setTheme(testTheme)).not.toThrow();
    });

    it('should expose destroy method', () => {
      const viewer = new MarkdownDocsViewer(basicConfig);

      expect(typeof viewer.destroy).toBe('function');
      expect(() => viewer.destroy()).not.toThrow();
    });
  });
});
```

**Implementation Steps**:

1. Test constructor and initialization
2. Test document loading and navigation
3. Test theme management
4. Test search functionality
5. Test responsive behavior
6. Test error handling and cleanup

#### Step 1.2.2.2: Create Loader Tests

**Deliverable**: `tests/loader.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentLoader } from '@/loader';
import { DocumentSource } from '@/types';
import { mockSuccessfulFetch, mockFailedFetch, testDocuments } from './setup';

describe('DocumentLoader', () => {
  describe('Content Source', () => {
    let loader: DocumentLoader;
    let source: DocumentSource;

    beforeEach(() => {
      source = {
        type: 'content',
        documents: testDocuments,
      };
      loader = new DocumentLoader(source);
    });

    it('should return documents for content source', async () => {
      const documents = await loader.loadAll();
      expect(documents).toEqual(testDocuments);
    });

    it('should return document content directly', async () => {
      const content = await loader.loadDocument(testDocuments[0]);
      expect(content).toBe(testDocuments[0].content);
    });

    it('should cache loaded content', async () => {
      const doc = testDocuments[0];

      const content1 = await loader.loadDocument(doc);
      const content2 = await loader.loadDocument(doc);

      expect(content1).toBe(content2);
      // Should not make additional calls for same document
    });

    it('should clear cache when requested', async () => {
      const doc = testDocuments[0];
      await loader.loadDocument(doc);

      loader.clearCache();

      // Should be able to load again after cache clear
      const content = await loader.loadDocument(doc);
      expect(content).toBe(doc.content);
    });
  });

  describe('Local Source', () => {
    let loader: DocumentLoader;
    let source: DocumentSource;

    beforeEach(() => {
      source = {
        type: 'local',
        basePath: '/docs',
        documents: [{ id: 'test', title: 'Test', file: 'test.md' }],
      };
      loader = new DocumentLoader(source);
    });

    it('should fetch local files correctly', async () => {
      const expectedContent = '# Test Document\n\nContent here';
      mockSuccessfulFetch(expectedContent);

      const content = await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('/docs/test.md');
      expect(content).toBe(expectedContent);
    });

    it('should handle basePath correctly', async () => {
      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('/docs/test.md');
    });

    it('should handle missing basePath', async () => {
      const sourceWithoutBasePath = {
        ...source,
        basePath: undefined,
      };
      loader = new DocumentLoader(sourceWithoutBasePath);

      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('test.md');
    });

    it('should handle fetch errors', async () => {
      mockFailedFetch(404, 'Not Found');

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow(
        'Failed to load local file'
      );
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow(
        'Failed to load local file'
      );
    });
  });

  describe('URL Source', () => {
    let loader: DocumentLoader;
    let source: DocumentSource;

    beforeEach(() => {
      source = {
        type: 'url',
        baseUrl: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
        documents: [{ id: 'remote', title: 'Remote', file: 'remote.md' }],
      };
      loader = new DocumentLoader(source);
    });

    it('should fetch remote URLs correctly', async () => {
      const expectedContent = '# Remote Document';
      mockSuccessfulFetch(expectedContent);

      const content = await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/remote.md', {
        headers: { Authorization: 'Bearer token' },
      });
      expect(content).toBe(expectedContent);
    });

    it('should handle baseUrl correctly', async () => {
      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/remote.md', expect.any(Object));
    });

    it('should handle missing baseUrl', async () => {
      const sourceWithoutBaseUrl = {
        ...source,
        baseUrl: undefined,
      };
      loader = new DocumentLoader(sourceWithoutBaseUrl);

      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith('remote.md', expect.any(Object));
    });

    it('should include custom headers', async () => {
      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        })
      );
    });

    it('should handle missing headers', async () => {
      const sourceWithoutHeaders = {
        ...source,
        headers: undefined,
      };
      loader = new DocumentLoader(sourceWithoutHeaders);

      mockSuccessfulFetch('content');

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith(expect.any(String), { headers: {} });
    });

    it('should handle HTTP errors', async () => {
      mockFailedFetch(500, 'Internal Server Error');

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow(
        'Failed to load from URL'
      );
    });
  });

  describe('GitHub Source', () => {
    let loader: DocumentLoader;
    let source: DocumentSource;

    beforeEach(() => {
      source = {
        type: 'github',
        headers: { Authorization: 'token github_pat_123' },
        documents: [{ id: 'readme', title: 'README', file: 'owner/repo/main/README.md' }],
      };
      loader = new DocumentLoader(source);
    });

    it('should fetch GitHub files correctly', async () => {
      const base64Content = btoa('# GitHub README\n\nContent from GitHub');
      mockSuccessfulFetch(JSON.stringify({ content: base64Content }));

      const content = await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/main/README.md',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: 'token github_pat_123',
          },
        }
      );
      expect(content).toBe('# GitHub README\n\nContent from GitHub');
    });

    it('should parse GitHub file paths correctly', async () => {
      const base64Content = btoa('content');
      mockSuccessfulFetch(JSON.stringify({ content: base64Content }));

      await loader.loadDocument(source.documents[0]);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/main/README.md',
        expect.any(Object)
      );
    });

    it('should handle nested file paths', async () => {
      const docWithNestedPath = {
        id: 'nested',
        title: 'Nested',
        file: 'owner/repo/branch/docs/guide/advanced.md',
      };

      const base64Content = btoa('nested content');
      mockSuccessfulFetch(JSON.stringify({ content: base64Content }));

      await loader.loadDocument(docWithNestedPath);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/branch/docs/guide/advanced.md',
        expect.any(Object)
      );
    });

    it('should handle invalid GitHub paths', async () => {
      const invalidDoc = {
        id: 'invalid',
        title: 'Invalid',
        file: 'invalid-path',
      };

      await expect(loader.loadDocument(invalidDoc)).rejects.toThrow('Invalid GitHub path format');
    });

    it('should handle GitHub API errors', async () => {
      mockFailedFetch(404, 'Not Found');

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow(
        'Failed to load from GitHub'
      );
    });

    it('should handle missing content in GitHub response', async () => {
      mockSuccessfulFetch(JSON.stringify({ message: 'No content' }));

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow(
        'No content found in GitHub response'
      );
    });

    it('should decode base64 content correctly', async () => {
      const originalContent = 'Special chars: áéíóú\n\n# Title with émojis 🚀';
      const base64Content = btoa(originalContent);
      mockSuccessfulFetch(JSON.stringify({ content: base64Content }));

      const content = await loader.loadDocument(source.documents[0]);

      expect(content).toBe(originalContent);
    });
  });

  describe('Edge Cases', () => {
    it('should handle documents without content or file', async () => {
      const source: DocumentSource = {
        type: 'content',
        documents: [
          { id: 'empty', title: 'Empty' }, // No content or file
        ],
      };
      const loader = new DocumentLoader(source);

      const content = await loader.loadDocument(source.documents[0]);

      expect(content).toBe('');
    });

    it('should handle unknown source types', async () => {
      const source = {
        type: 'unknown' as any,
        documents: [{ id: 'test', title: 'Test', file: 'test.md' }],
      };
      const loader = new DocumentLoader(source);

      await expect(loader.loadDocument(source.documents[0])).rejects.toThrow('Unknown source type');
    });

    it('should maintain separate caches for different loaders', async () => {
      const source1: DocumentSource = {
        type: 'content',
        documents: [{ id: 'test', title: 'Test', content: 'Content 1' }],
      };

      const source2: DocumentSource = {
        type: 'content',
        documents: [{ id: 'test', title: 'Test', content: 'Content 2' }],
      };

      const loader1 = new DocumentLoader(source1);
      const loader2 = new DocumentLoader(source2);

      const content1 = await loader1.loadDocument(source1.documents[0]);
      const content2 = await loader2.loadDocument(source2.documents[0]);

      expect(content1).toBe('Content 1');
      expect(content2).toBe('Content 2');
    });
  });
});
```

**Implementation Steps**:

1. Test all document source types (content, local, URL, GitHub)
2. Test caching functionality
3. Test error handling for network failures
4. Test edge cases and invalid inputs
5. Test GitHub API integration specifics

---

**Acceptance Criteria for Task 1.1**:

- [ ] Demo page loads without errors in all major browsers
- [ ] All 5 example configurations work correctly
- [ ] Theme switching functions properly
- [ ] Mobile responsive design works on devices <768px width
- [ ] All document source types (local, URL, GitHub, content) tested
- [ ] Status indicators and loading states function
- [ ] Demo content is comprehensive and engaging
- [ ] No console errors during normal operation
- [ ] Demo package.json and scripts work correctly

**Acceptance Criteria for Task 1.2**:

- [ ] Test suite achieves >80% code coverage
- [ ] All core functionality tested (viewer, loader, themes)
- [ ] Tests run successfully with `npm test`
- [ ] Coverage reports generated correctly
- [ ] Tests include both unit and integration scenarios
- [ ] Mock implementations work correctly
- [ ] Test setup and teardown function properly
- [ ] Edge cases and error conditions tested
- [ ] Tests are maintainable and well-documented

This detailed breakdown provides specific deliverables, implementation steps, and acceptance criteria for each subtask in Phase 1. The same level of detail should be applied to the remaining tasks (1.3 and 1.4) to complete the phase successfully.
