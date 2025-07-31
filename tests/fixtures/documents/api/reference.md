---
title: API Reference
description: Complete API reference for the markdown documentation viewer
tags: ['api', 'reference', 'typescript', 'interfaces']
order: 10
category: reference
---

# API Reference

Complete TypeScript API reference for the markdown documentation viewer.

## Zero-Config API

### init(options?)

Initializes the documentation viewer with zero-configuration setup.

```typescript
function init(options?: ZeroConfigOptions): Promise<MarkdownDocsViewer>
```

**Parameters:**

- `options` (optional): Configuration options

**Returns:** `Promise<MarkdownDocsViewer>` - The initialized viewer instance

**Example:**

```typescript
import { init } from 'markdown-docs-viewer/zero-config';

// Default initialization
const viewer = await init();

// With options
const viewer = await init({
  container: '#docs',
  theme: 'github-dark',
  title: 'My Docs'
});
```

### getViewer()

Returns the current viewer instance if one exists.

```typescript
function getViewer(): MarkdownDocsViewer | null
```

**Returns:** The current viewer instance or null if not initialized

### reload(options?)

Destroys the current viewer and reinitializes with new options.

```typescript
function reload(options?: ZeroConfigOptions): Promise<MarkdownDocsViewer>
```

**Parameters:**

- `options` (optional): New configuration options

**Returns:** `Promise<MarkdownDocsViewer>` - The new viewer instance

### setTheme(themeName)

Sets the theme on the current viewer instance.

```typescript
function setTheme(themeName: string): void
```

**Parameters:**

- `themeName`: Theme name (e.g., 'github-dark', 'material-light')

### getAvailableThemes()

Returns all available theme names.

```typescript
function getAvailableThemes(): string[]
```

**Returns:** Array of available theme names

### generateConfig()

Generates a sample configuration file content.

```typescript
function generateConfig(): string
```

**Returns:** JSON string with sample configuration

## Full API

### createViewer(config)

Creates a new documentation viewer instance.

```typescript
function createViewer(config: DocumentationConfig): MarkdownDocsViewer
```

**Parameters:**

- `config`: Complete configuration object

**Returns:** `MarkdownDocsViewer` instance

### quickStart(options?)

Quick initialization with simplified options.

```typescript
function quickStart(options?: QuickStartOptions): Promise<MarkdownDocsViewer>
```

## Types and Interfaces

### ZeroConfigOptions

```typescript
interface ZeroConfigOptions {
  container?: string | HTMLElement;
  configPath?: string;
  docsPath?: string;
  theme?: string;
  title?: string;
}
```

### DocumentationConfig

```typescript
interface DocumentationConfig {
  container: string | HTMLElement;
  source: DocumentSource;
  theme?: Theme;
  search?: SearchOptions;
  navigation?: NavigationOptions;
  render?: RenderOptions;
  errorHandling?: ErrorHandlingOptions;
  performance?: PerformanceOptions;
  mobile?: MobileOptions;
  title?: string;
  logo?: string;
  footer?: string;
  onDocumentLoad?: (doc: Document) => void;
  onError?: (error: Error) => void;
  onPerformanceMetrics?: (metrics: Record<string, any>) => void;
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
    textSecondary: string;
    border: string;
    hover: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    codeFontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  spacing: {
    unit: string;
    container: string;
    sidebar: string;
  };
  borderRadius: string;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}
```

### SearchOptions

```typescript
interface SearchOptions {
  enabled?: boolean;
  placeholder?: string;
  highlightResults?: boolean;
  caseSensitive?: boolean;
  wholeWords?: boolean;
  includeContent?: boolean;
  categories?: string[];
  tags?: string[];
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}
```

### NavigationOptions

```typescript
interface NavigationOptions {
  showCategories?: boolean;
  expandable?: boolean;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  collapsible?: boolean;
  width?: string;
  position?: 'left' | 'right';
}
```

### RenderOptions

```typescript
interface RenderOptions {
  highlightCode?: boolean;
  highlightTheme?: string;
  mathRendering?: boolean;
  mermaidDiagrams?: boolean;
  linkTarget?: '_blank' | '_self';
  sanitizeHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}
```

### ErrorHandlingOptions

```typescript
interface ErrorHandlingOptions {
  showErrors?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  fallbackContent?: string;
  onError?: (error: Error, context: string) => void;
}
```

### PerformanceOptions

```typescript
interface PerformanceOptions {
  lazyLoading?: boolean;
  cacheSize?: number;
  preloadNext?: boolean;
  virtualScrolling?: boolean;
  debounceSearch?: number;
  throttleScroll?: number;
}
```

### MobileOptions

```typescript
interface MobileOptions {
  responsive?: boolean;
  breakpoint?: string;
  collapseSidebar?: boolean;
  swipeNavigation?: boolean;
  touchGestures?: boolean;
}
```

## MarkdownDocsViewer Class

### Properties

```typescript
class MarkdownDocsViewer {
  readonly config: DocumentationConfig;
  readonly container: HTMLElement;
  readonly theme: Theme;
}
```

### Methods

#### setTheme(theme)

```typescript
setTheme(theme: Theme | string): void
```

Sets the viewer theme.

#### loadDocument(documentId)

```typescript
loadDocument(documentId: string): Promise<void>
```

Loads and displays a specific document.

#### search(query, options?)

```typescript
search(query: string, options?: SearchOptions): Promise<SearchResult[]>
```

Performs a search across all documents.

#### export(format, options?)

```typescript
export(format: 'pdf' | 'html', options?: ExportOptions): Promise<Blob>
```

Exports the current document or all documents.

#### destroy()

```typescript
destroy(): void
```

Cleans up the viewer and removes all event listeners.

#### reload(config?)

```typescript
reload(config?: Partial<DocumentationConfig>): Promise<void>
```

Reloads the viewer with new configuration.

#### getCurrentDocument()

```typescript
getCurrentDocument(): Document | null
```

Returns the currently displayed document.

#### getDocuments()

```typescript
getDocuments(): Document[]
```

Returns all available documents.

#### updateConfig(config)

```typescript
updateConfig(config: Partial<DocumentationConfig>): void
```

Updates the viewer configuration.

### Events

The viewer emits custom events that you can listen to:

```typescript
viewer.addEventListener('documentLoaded', (event) => {
  const document = event.detail.document;
  console.log('Document loaded:', document.title);
});

viewer.addEventListener('themeChanged', (event) => {
  const theme = event.detail.theme;
  console.log('Theme changed to:', theme.name);
});

viewer.addEventListener('searchCompleted', (event) => {
  const results = event.detail.results;
  console.log('Search found', results.length, 'results');
});

viewer.addEventListener('error', (event) => {
  const error = event.detail.error;
  console.error('Viewer error:', error);
});
```

## Utility Functions

### themes

Object containing all built-in themes:

```typescript
const themes: Record<string, { light: Theme; dark: Theme }>
```

### parseThemeName(themeName)

```typescript
function parseThemeName(themeName: string): { name: string; mode: 'light' | 'dark' }
```

Parses a theme name string (e.g., 'github-dark') into name and mode.

### validateConfig(config)

```typescript
function validateConfig(config: DocumentationConfig): ValidationResult
```

Validates a configuration object and returns any errors.

### autoDiscoverDocs(basePath?)

```typescript
function autoDiscoverDocs(basePath?: string): Promise<Document[]>
```

Automatically discovers markdown files in a directory.

## Error Handling

All API functions handle errors gracefully and provide meaningful error messages. Common error scenarios include:

- Invalid configuration
- Missing container element
- Network errors loading documents
- Theme parsing errors
- Search index failures

Errors are logged to the console and can be handled through error callbacks or event listeners.

## TypeScript Support

The library includes comprehensive TypeScript definitions. Import types as needed:

```typescript
import type {
  DocumentationConfig,
  ZeroConfigOptions,
  Document,
  Theme,
  SearchOptions
} from 'markdown-docs-viewer';
```