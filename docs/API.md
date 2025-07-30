# API Reference

Complete API reference for the Markdown Documentation Viewer library.

## Factory Functions

### createViewer()

Creates a new viewer instance with the provided configuration.

```typescript
function createViewer(config: DocumentationConfig): MarkdownDocsViewer;
```

**Parameters:**

- `config` - Configuration object (see [Configuration Guide](./CONFIGURATION.md))

**Example:**

```typescript
import { createViewer, themes } from './dist/markdown-docs-viewer.js';

const viewer = createViewer({
  container: '#docs',
  title: 'My Documentation',
  theme: themes.github.light,
  source: {
    type: 'content',
    documents: [
      {
        id: 'intro',
        title: 'Introduction',
        content: '# Welcome to my docs!',
      },
    ],
  },
});
```

### quickStart()

Quick start function that creates a viewer with minimal configuration.

```typescript
function quickStart(container: string | HTMLElement, documents: Document[]): MarkdownDocsViewer;
```

**Parameters:**

- `container` - CSS selector or HTML element
- `documents` - Array of documents to display

**Example:**

```typescript
import { quickStart } from './dist/markdown-docs-viewer.js';

const viewer = quickStart('#docs', [
  {
    id: 'home',
    title: 'Home',
    content: '# Welcome',
  },
]);
```

## MarkdownDocsViewer Class

### Constructor

```typescript
new MarkdownDocsViewer(config: DocumentationConfig)
```

**Note:** It's recommended to use `createViewer()` instead of instantiating directly.

### Methods

#### loadDocument()

```typescript
loadDocument(documentId: string): void
```

Loads and displays a specific document by ID.

**Parameters:**

- `documentId` - The ID of the document to load

**Example:**

```typescript
viewer.loadDocument('getting-started');
```

#### updateConfig()

```typescript
updateConfig(newConfig: Partial<DocumentationConfig>): void
```

Updates the viewer configuration dynamically.

**Parameters:**

- `newConfig` - Partial configuration to merge

**Example:**

```typescript
viewer.updateConfig({
  theme: themes.github.dark,
  search: { enabled: false },
});
```

#### destroy()

```typescript
destroy(): void
```

Cleans up the viewer instance and removes all event listeners.

**Example:**

```typescript
viewer.destroy();
```

#### getState()

```typescript
getState(): ViewerState
```

Gets the current state of the viewer.

**Returns:** Current viewer state including active document, theme, etc.

## Zero Configuration API

The zero-config bundle provides additional convenience methods:

### MarkdownDocsViewer.init()

```typescript
MarkdownDocsViewer.init(options?: ZeroConfigOptions): Promise<MarkdownDocsViewer>
```

Initializes the viewer with auto-discovery of markdown files.

**Parameters:**

- `options` - Optional configuration overrides

**Options:**

- `container` - Container element or selector (default: `#docs`)
- `configPath` - Path to configuration file (default: auto-discover)
- `docsPath` - Path to documents folder (default: `./docs`)
- `theme` - Theme name (default: from config or `github-light`)
- `title` - Documentation title (default: from config or `Documentation`)

**Example:**

```typescript
// Minimal - auto-discovers everything
MarkdownDocsViewer.init();

// With options
MarkdownDocsViewer.init({
  title: 'My Docs',
  theme: 'material-dark',
  docsPath: './documentation',
});
```

### MarkdownDocsViewer.setTheme()

```typescript
MarkdownDocsViewer.setTheme(themeName: string): void
```

Changes the current theme.

**Parameters:**

- `themeName` - Name of the theme to apply

**Example:**

```typescript
MarkdownDocsViewer.setTheme('dracula');
```

### MarkdownDocsViewer.reload()

```typescript
MarkdownDocsViewer.reload(): Promise<void>
```

Reloads the documentation, re-discovering files if using auto-discovery.

### MarkdownDocsViewer.getAvailableThemes()

```typescript
MarkdownDocsViewer.getAvailableThemes(): string[]
```

Returns an array of available theme names.

## Theme Functions

### createCustomTheme()

```typescript
function createCustomTheme(options: {
  name: string;
  colors: ThemeColors;
  fonts?: ThemeFonts;
  spacing?: ThemeSpacing;
}): Theme;
```

Creates a custom theme.

**Example:**

```typescript
import { createCustomTheme } from './dist/markdown-docs-viewer.js';

const myTheme = createCustomTheme({
  name: 'my-theme',
  colors: {
    primary: '#007acc',
    secondary: '#40a9ff',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    accent: '#1890ff',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
    code: 'Consolas, Monaco, monospace',
  },
});
```

## Type Definitions

### DocumentationConfig

```typescript
interface DocumentationConfig {
  container: string | HTMLElement;
  title?: string;
  source: DocumentSource;
  theme?: Theme;
  navigation?: NavigationOptions;
  search?: SearchOptions;
  render?: RenderOptions;
  tableOfContents?: TableOfContentsOptions;
  performance?: PerformanceOptions;
  mobile?: MobileOptions;
  errorHandling?: ErrorHandlingOptions;
}
```

### Document

```typescript
interface Document {
  id: string;
  title: string;
  file?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  order?: number;
}
```

### DocumentSource

```typescript
interface DocumentSource {
  type: 'local' | 'url' | 'github' | 'content';
  basePath?: string;
  baseUrl?: string;
  documents: Document[];
  headers?: Record<string, string>;
}
```

### Theme

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textPrimary: string;
    textLight: string;
    textSecondary: string;
    border: string;
    code: string;
    codeBackground: string;
    link: string;
    linkHover: string;
    error: string;
    warning: string;
    success: string;
  };
  fonts: {
    body: string;
    heading: string;
    code: string;
  };
  spacing: {
    unit: number;
    containerMaxWidth: string;
    sidebarWidth: string;
  };
  borderRadius: string;
}
```

### SearchOptions

```typescript
interface SearchOptions {
  enabled: boolean;
  placeholder?: string;
  caseSensitive?: boolean;
  fuzzySearch?: boolean;
  searchInTags?: boolean;
  maxResults?: number;
}
```

### NavigationOptions

```typescript
interface NavigationOptions {
  showCategories: boolean;
  showTags: boolean;
  collapsible: boolean;
  showDescription: boolean;
  sortBy?: 'title' | 'order' | 'date';
}
```

### RenderOptions

```typescript
interface RenderOptions {
  syntaxHighlighting: boolean;
  highlightTheme?: string;
  copyCodeButton: boolean;
  linkTarget?: '_blank' | '_self';
  sanitizeHtml?: boolean;
}
```

## Built-in Themes

The library includes several built-in themes, each with light and dark variants:

```typescript
import { themes } from './dist/markdown-docs-viewer.js';

// Available themes:
themes.github.light;
themes.github.dark;
themes.material.light;
themes.material.dark;
themes.nord.light;
themes.nord.dark;
themes.solarized.light;
themes.solarized.dark;
themes.dracula.dark;
themes.monokai.dark;
themes.atomOne.light;
```

## Error Handling

### MarkdownDocsError

```typescript
class MarkdownDocsError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CONTAINER = 'MISSING_CONTAINER',
  INVALID_SOURCE = 'INVALID_SOURCE',

  // Document errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_LOAD_FAILED = 'DOCUMENT_LOAD_FAILED',

  // Theme errors
  THEME_NOT_FOUND = 'THEME_NOT_FOUND',
  INVALID_THEME = 'INVALID_THEME',

  // Search errors
  SEARCH_FAILED = 'SEARCH_FAILED',

  // General errors
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Error Handling Example

```typescript
import { createViewer, MarkdownDocsError, ErrorCode } from './dist/markdown-docs-viewer.js';

try {
  const viewer = createViewer(config);
} catch (error) {
  if (error instanceof MarkdownDocsError) {
    switch (error.code) {
      case ErrorCode.MISSING_CONTAINER:
        console.error('Container element not found');
        break;
      case ErrorCode.INVALID_CONFIG:
        console.error('Invalid configuration:', error.userMessage);
        break;
      default:
        console.error('Viewer error:', error.message);
    }
  }
}
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 88+)

## TypeScript Support

The library is written in TypeScript and includes comprehensive type definitions. All interfaces and types are exported for use in TypeScript projects.

```typescript
import {
  MarkdownDocsViewer,
  DocumentationConfig,
  Document,
  Theme,
  createViewer,
  themes,
} from './dist/markdown-docs-viewer.js';
```
