# API Reference

Complete reference for the Markdown Documentation Viewer API.

## MarkdownDocsViewer Class

### Constructor

```typescript
new MarkdownDocsViewer(config: DocumentationConfig)
```

Creates a new documentation viewer instance.

**Parameters:**

- `config` - Configuration object (see [Configuration](#configuration))

**Example:**

```javascript
const viewer = new MarkdownDocsViewer({
    container: '#docs',
    source: {
        type: 'local',
        documents: [...]
    }
});
```

### Methods

#### setTheme(theme)

```typescript
setTheme(theme: Theme): void
```

Changes the current theme.

**Parameters:**

- `theme` - Theme object (see [Theming Guide](./theming.md))

**Example:**

```javascript
import { darkTheme } from '../dist/markdown-docs-viewer.js';
viewer.setTheme(darkTheme);
```

#### refresh()

```typescript
refresh(): Promise<void>
```

Reloads all documents from the source.

**Example:**

```javascript
await viewer.refresh();
```

#### loadDocument(documentId)

```typescript
loadDocument(documentId: string): Promise<void>
```

Loads a specific document by ID.

**Parameters:**

- `documentId` - The ID of the document to load

**Example:**

```javascript
await viewer.loadDocument('getting-started');
```

#### getDocument(documentId)

```typescript
getDocument(documentId: string): Document | null
```

Retrieves a document by ID without loading it.

**Parameters:**

- `documentId` - The ID of the document to retrieve

**Returns:**

- Document object or `null` if not found

#### getAllDocuments()

```typescript
getAllDocuments(): Document[]
```

Returns all available documents.

**Returns:**

- Array of document objects

#### search(query)

```typescript
search(query: string): Promise<Document[]>
```

Performs a search across all documents.

**Parameters:**

- `query` - Search query string

**Returns:**

- Promise resolving to array of matching documents

**Example:**

```javascript
const results = await viewer.search('configuration');
console.log(`Found ${results.length} documents`);
```

#### destroy()

```typescript
destroy(): void
```

Destroys the viewer instance and cleans up resources.

**Example:**

```javascript
viewer.destroy();
```

### Properties

#### state

```typescript
readonly state: ViewerState
```

Current state of the viewer.

```typescript
interface ViewerState {
  currentDocument: Document | null;
  documents: Document[];
  searchQuery: string;
  searchResults: Document[];
  loading: boolean;
  error: Error | null;
  sidebarOpen: boolean;
}
```

#### config

```typescript
readonly config: DocumentationConfig
```

Current configuration object.

## Configuration Types

### DocumentationConfig

```typescript
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
```

### DocumentSource

```typescript
type DocumentSource = LocalDocumentSource | UrlDocumentSource | GitHubDocumentSource;

interface LocalDocumentSource {
  type: 'local';
  documents: Document[];
}

interface UrlDocumentSource {
  type: 'url';
  baseUrl: string;
  documents: DocumentReference[];
}

interface GitHubDocumentSource {
  type: 'github';
  repository: string;
  branch?: string;
  docsPath?: string;
  token?: string;
}
```

### Document

```typescript
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
  metadata?: Record<string, any>;
  lastModified?: Date;
}
```

### NavigationConfig

```typescript
interface NavigationConfig {
  showCategories?: boolean;
  showTags?: boolean;
  collapsible?: boolean;
  showDescription?: boolean;
  maxDepth?: number;
  sortBy?: 'order' | 'title' | 'date';
}
```

### SearchConfig

```typescript
interface SearchConfig {
  enabled?: boolean;
  placeholder?: string;
  maxResults?: number;
  minLength?: number;
  debounceTime?: number;
  highlightResults?: boolean;
  searchFields?: string[];
}
```

### RenderConfig

```typescript
interface RenderConfig {
  syntaxHighlighting?: boolean;
  copyCodeButton?: boolean;
  linkTarget?: '_self' | '_blank';
  mathSupport?: boolean;
  mermaidSupport?: boolean;
  tableOfContents?: boolean;
  headingAnchors?: boolean;
}
```

### Theme

```typescript
interface Theme {
  colors: {
    primary: string;
    secondary?: string;
    background: string;
    surface: string;
    text: string;
    textLight: string;
    border: string;
    code: string;
    codeBackground: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  fonts: {
    body: string;
    heading: string;
    code: string;
  };
  spacing?: {
    content: string;
    navigation: string;
    section?: string;
  };
  radius?: {
    small: string;
    medium: string;
    large: string;
  };
  shadows?: {
    small: string;
    medium: string;
    large: string;
  };
}
```

## Factory Functions

### createViewer(config)

```typescript
function createViewer(config: DocumentationConfig): MarkdownDocsViewer;
```

Factory function for creating viewer instances.

**Example:**

```javascript
import { createViewer } from '../dist/markdown-docs-viewer.js';

const viewer = createViewer({
    container: '#docs',
    source: { ... }
});
```

### parseMarkdown(content, options)

```typescript
function parseMarkdown(content: string, options?: ParseOptions): string;
```

Parse markdown content to HTML.

**Parameters:**

- `content` - Markdown content string
- `options` - Optional parsing options

**Returns:**

- HTML string

**Example:**

```javascript
import { parseMarkdown } from '../dist/markdown-docs-viewer.js';

const html = parseMarkdown('# Hello World\n\nThis is **bold** text.');
```

## Utility Functions

### loadGitHubDocs(repository, options)

```typescript
async function loadGitHubDocs(repository: string, options?: GitHubOptions): Promise<Document[]>;
```

Helper for loading documentation from GitHub repositories.

**Parameters:**

- `repository` - Repository in format 'owner/repo'
- `options` - Optional GitHub-specific options

**Example:**

```javascript
import { loadGitHubDocs } from '../dist/markdown-docs-viewer.js';

const docs = await loadGitHubDocs('microsoft/typescript', {
  branch: 'main',
  docsPath: 'doc',
});
```

### validateConfig(config)

```typescript
function validateConfig(config: DocumentationConfig): ValidationResult;
```

Validates configuration object.

**Returns:**

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Events

The viewer emits custom events that you can listen to:

### document:load

```javascript
viewer.addEventListener('document:load', event => {
  console.log('Document loaded:', event.detail.document);
});
```

### document:error

```javascript
viewer.addEventListener('document:error', event => {
  console.error('Document error:', event.detail.error);
});
```

### search:query

```javascript
viewer.addEventListener('search:query', event => {
  console.log('Search performed:', event.detail.query);
});
```

### theme:change

```javascript
viewer.addEventListener('theme:change', event => {
  console.log('Theme changed:', event.detail.theme);
});
```

## Error Handling

### Common Errors

#### ConfigurationError

Thrown when configuration is invalid.

```javascript
try {
  const viewer = new MarkdownDocsViewer(invalidConfig);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

#### DocumentLoadError

Thrown when document loading fails.

```javascript
viewer.addEventListener('document:error', event => {
  const error = event.detail.error;
  if (error instanceof DocumentLoadError) {
    console.error('Failed to load document:', error.documentId);
  }
});
```

#### NetworkError

Thrown when network requests fail.

```javascript
try {
  await viewer.refresh();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

## TypeScript Support

The library is written in TypeScript and provides full type definitions:

```typescript
import { MarkdownDocsViewer, DocumentationConfig, Document, Theme } from '../dist/markdown-docs-viewer.js';

const config: DocumentationConfig = {
  container: '#docs',
  source: {
    type: 'local',
    documents: [],
  },
};

const viewer: MarkdownDocsViewer = new MarkdownDocsViewer(config);
```

## Browser Compatibility

| Browser | Version | Notes         |
| ------- | ------- | ------------- |
| Chrome  | 70+     | Full support  |
| Firefox | 65+     | Full support  |
| Safari  | 12+     | Full support  |
| Edge    | 79+     | Full support  |
| IE      | ❌      | Not supported |

## Bundle Information

| Format    | Size (gzipped) | Notes                |
| --------- | -------------- | -------------------- |
| ES Module | ~45KB          | Modern browsers      |
| UMD       | ~48KB          | Legacy compatibility |
| CommonJS  | ~47KB          | Node.js environments |

## Performance Tips

### Lazy Loading

```javascript
{
    performance: {
        lazyLoad: true,          // Load documents on demand
        preloadNext: true,       // Preload next document
        cacheDocuments: true     // Cache loaded documents
    }
}
```

### Virtual Scrolling

```javascript
{
    navigation: {
        virtualScroll: true,     // For large document lists
        itemHeight: 40          // Fixed item height
    }
}
```

### Code Splitting

```javascript
// Dynamically import the viewer
const { MarkdownDocsViewer } = await import('../dist/markdown-docs-viewer.js');
```

## Migration Guide

### From v0.x to v1.0

- `theme` property is now required
- `DocumentSource` interface has changed
- Event names have been updated

See the [Migration Guide](./migration.md) for detailed instructions.

---

> **Need Help?** Check out the [examples](./examples.md) or [open an issue](https://github.com/AustinOrphan/markdown-docs-viewer/issues) on GitHub.
