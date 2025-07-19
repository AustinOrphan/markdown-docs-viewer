# API Reference

Complete reference for the Markdown Documentation Viewer library.

## MarkdownDocsViewer Class

### Constructor

```typescript
new MarkdownDocsViewer(container: HTMLElement, config: DocumentationConfig)
```

**Parameters:**
- `container` - HTML element where the viewer will be mounted
- `config` - Configuration object (see [Configuration Guide](./CONFIGURATION.md))

**Example:**
```typescript
const viewer = new MarkdownDocsViewer(
  document.getElementById('docs-container'),
  {
    title: 'My Documentation',
    sources: [
      { type: 'local', path: './docs/' }
    ]
  }
);
```

### Methods

#### initialize()
```typescript
async initialize(): Promise<void>
```
Initializes the viewer and loads the initial document set.

**Returns:** Promise that resolves when initialization is complete

**Example:**
```typescript
await viewer.initialize();
```

#### loadDocument()
```typescript
async loadDocument(path: string): Promise<void>
```
Loads and displays a specific document.

**Parameters:**
- `path` - Document path or identifier

**Example:**
```typescript
await viewer.loadDocument('getting-started.md');
```

#### setTheme()
```typescript
setTheme(theme: string): void
```
Changes the current theme.

**Parameters:**
- `theme` - Theme name ('light', 'dark', or custom theme name)

**Example:**
```typescript
viewer.setTheme('dark');
```

#### updateConfig()
```typescript
updateConfig(newConfig: Partial<DocumentationConfig>): Promise<void>
```
Updates configuration dynamically.

**Parameters:**
- `newConfig` - Partial configuration to merge with existing config

**Example:**
```typescript
await viewer.updateConfig({
  search: { enabled: false }
});
```

#### search()
```typescript
search(query: string): SearchResult[]
```
Performs a search across all loaded documents.

**Parameters:**
- `query` - Search query string

**Returns:** Array of search results

**Example:**
```typescript
const results = viewer.search('installation');
```

#### getCurrentDocument()
```typescript
getCurrentDocument(): DocumentMetadata | null
```
Gets metadata for the currently displayed document.

**Returns:** Current document metadata or null

#### getAllDocuments()
```typescript
getAllDocuments(): DocumentMetadata[]
```
Gets metadata for all loaded documents.

**Returns:** Array of document metadata

#### destroy()
```typescript
destroy(): void
```
Cleans up the viewer instance and removes all event listeners.

**Example:**
```typescript
viewer.destroy();
```

## Configuration Types

### DocumentationConfig
```typescript
interface DocumentationConfig {
  title: string;
  sources: DocumentSource[];
  theme?: ThemeConfig;
  navigation?: NavigationConfig;
  search?: SearchConfig;
  features?: FeatureConfig;
  callbacks?: CallbackConfig;
}
```

### DocumentSource
```typescript
interface DocumentSource {
  type: 'local' | 'url' | 'github' | 'content';
  path?: string;
  url?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  content?: string;
  metadata?: DocumentMetadata;
}
```

### ThemeConfig
```typescript
interface ThemeConfig {
  default: 'light' | 'dark';
  custom?: {
    [themeName: string]: ThemeDefinition;
  };
  allowUserToggle?: boolean;
}
```

### NavigationConfig
```typescript
interface NavigationConfig {
  enabled: boolean;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  customItems?: NavigationItem[];
  position?: 'left' | 'right' | 'top';
}
```

### SearchConfig
```typescript
interface SearchConfig {
  enabled: boolean;
  placeholder?: string;
  minQueryLength?: number;
  maxResults?: number;
  highlightResults?: boolean;
  fuzzySearch?: boolean;
}
```

### FeatureConfig
```typescript
interface FeatureConfig {
  codeHighlighting?: boolean;
  mathRendering?: boolean;
  mermaidDiagrams?: boolean;
  tableOfContents?: boolean;
  printMode?: boolean;
  responsiveDesign?: boolean;
}
```

## Event System

### Callbacks
```typescript
interface CallbackConfig {
  onDocumentLoad?: (document: DocumentMetadata) => void;
  onThemeChange?: (theme: string) => void;
  onSearchQuery?: (query: string, results: SearchResult[]) => void;
  onError?: (error: Error, context: string) => void;
  onNavigationChange?: (path: string) => void;
}
```

### Example Usage
```typescript
const viewer = new MarkdownDocsViewer(container, {
  title: 'API Docs',
  sources: [{ type: 'local', path: './docs/' }],
  callbacks: {
    onDocumentLoad: (doc) => {
      console.log(`Loaded: ${doc.title}`);
    },
    onError: (error, context) => {
      console.error(`Error in ${context}:`, error);
    }
  }
});
```

## Data Types

### DocumentMetadata
```typescript
interface DocumentMetadata {
  id: string;
  title: string;
  path: string;
  source: DocumentSource;
  lastModified?: Date;
  size?: number;
  tags?: string[];
  description?: string;
}
```

### SearchResult
```typescript
interface SearchResult {
  document: DocumentMetadata;
  matches: SearchMatch[];
  score: number;
}

interface SearchMatch {
  line: number;
  column: number;
  text: string;
  context: string;
}
```

### ThemeDefinition
```typescript
interface ThemeDefinition {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  fonts: {
    body: string;
    heading: string;
    code: string;
  };
  spacing: {
    unit: number;
    small: string;
    medium: string;
    large: string;
  };
}
```

## Error Handling

### Error Types
```typescript
enum ViewerErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  DOCUMENT_LOAD_FAILED = 'document_load_failed',
  SEARCH_FAILED = 'search_failed',
  THEME_LOAD_FAILED = 'theme_load_failed',
  INVALID_CONFIG = 'invalid_config'
}

class ViewerError extends Error {
  type: ViewerErrorType;
  context?: string;
  originalError?: Error;
}
```

### Error Handling Example
```typescript
try {
  await viewer.initialize();
} catch (error) {
  if (error instanceof ViewerError) {
    console.error(`${error.type}: ${error.message}`);
    if (error.context) {
      console.error(`Context: ${error.context}`);
    }
  }
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## TypeScript Support

The library is written in TypeScript and includes comprehensive type definitions. All interfaces and types are exported for use in TypeScript projects.

```typescript
import { 
  MarkdownDocsViewer, 
  DocumentationConfig, 
  DocumentSource 
} from 'markdown-docs-viewer';
```