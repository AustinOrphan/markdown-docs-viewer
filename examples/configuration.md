# Configuration Guide

This guide covers all available configuration options for the Markdown Documentation Viewer.

## Core Configuration

The main configuration object accepts the following properties:

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

## Document Sources

### Local Documents

Perfect for embedded documentation:

```javascript
source: {
    type: 'local',
    documents: [
        {
            id: 'welcome',
            title: 'Welcome',
            description: 'Getting started guide',
            category: 'Introduction',
            tags: ['basics', 'setup'],
            content: '# Welcome\n\nYour content here...',
            order: 1
        },
        {
            id: 'advanced',
            title: 'Advanced Topics',
            category: 'Guides',
            content: '# Advanced Features\n\n...',
            order: 2
        }
    ]
}
```

### URL-based Sources

Load documents from remote URLs:

```javascript
source: {
    type: 'url',
    baseUrl: 'https://raw.githubusercontent.com/yourusername/docs/main',
    documents: [
        { file: '/introduction.md', title: 'Introduction' },
        { file: '/guides/setup.md', title: 'Setup Guide' },
        { file: '/api/reference.md', title: 'API Reference' }
    ]
}
```

### GitHub Repository

Direct integration with GitHub repositories:

```javascript
source: {
    type: 'github',
    repository: 'username/repository',
    branch: 'main',           // optional, defaults to 'main'
    docsPath: 'docs',         // optional, path to docs folder
    token: 'your_token'       // optional, for private repos
}
```

## Navigation Configuration

Customize the navigation experience:

```javascript
navigation: {
    showCategories: true,     // Group documents by category
    showTags: false,         // Display document tags
    collapsible: true,       // Allow collapsing sections
    showDescription: true,   // Show document descriptions
    maxDepth: 3,            // Maximum nesting depth
    sortBy: 'order'         // 'order', 'title', 'date'
}
```

### Category Configuration

When using categories, documents are automatically grouped:

```javascript
// Documents with categories will be grouped together
{
    id: 'intro',
    title: 'Introduction',
    category: 'Getting Started',  // Groups with other "Getting Started" docs
    content: '...'
}
```

## Search Configuration

Enable and customize search functionality:

```javascript
search: {
    enabled: true,
    placeholder: 'Search documentation...',
    maxResults: 10,
    minLength: 2,
    debounceTime: 300,       // ms to wait before searching
    highlightResults: true,
    searchFields: ['title', 'content', 'description', 'tags']
}
```

### Search Indexing

The search system automatically indexes:

- Document titles
- Document content (markdown)
- Document descriptions
- Document tags
- Custom metadata

## Render Configuration

Control how markdown is rendered:

```javascript
render: {
    syntaxHighlighting: true,    // Enable code syntax highlighting
    copyCodeButton: true,        // Add copy buttons to code blocks
    linkTarget: '_blank',        // Target for external links
    mathSupport: false,          // Enable math rendering (requires plugin)
    mermaidSupport: false,       // Enable Mermaid diagrams
    tableOfContents: true,       // Auto-generate TOC
    headingAnchors: true         // Add anchor links to headings
}
```

### Code Highlighting

Syntax highlighting is powered by Highlight.js:

```markdown
\`\`\`javascript
const viewer = new MarkdownDocsViewer({
container: '#docs',
// ... configuration
});
\`\`\`
```

Supported languages include JavaScript, TypeScript, Python, Java, C++, and 180+ others.

## Routing Configuration

Control URL routing behavior:

```javascript
routing: 'hash'; // Use hash-based routing (#/document-id)
routing: 'history'; // Use HTML5 history API (/document-id)
routing: 'none'; // Disable routing
```

### Hash Routing

- URLs like `#/getting-started`
- Works without server configuration
- Compatible with static hosting

### History Routing

- Clean URLs like `/getting-started`
- Requires server configuration for SPA
- Better SEO and user experience

## Event Handlers

React to viewer events:

```javascript
{
    onDocumentLoad: (document) => {
        console.log('Loaded:', document.title);
        // Track analytics, update UI, etc.
    },

    onError: (error) => {
        console.error('Viewer error:', error);
        // Handle errors gracefully
    },

    onSearchQuery: (query, results) => {
        console.log(`Search for "${query}" returned ${results.length} results`);
    }
}
```

## Advanced Configuration

### Custom CSS Classes

Add custom CSS classes to elements:

```javascript
{
    classes: {
        container: 'my-docs-container',
        navigation: 'my-nav',
        content: 'my-content'
    }
}
```

### Performance Options

Optimize for large documentation sets:

```javascript
{
    performance: {
        lazyLoad: true,          // Load documents on demand
        virtualScroll: true,     // Virtual scrolling for large lists
        cacheDocuments: true,    // Cache loaded documents
        preloadNext: true        // Preload next document
    }
}
```

### Accessibility

Ensure accessibility compliance:

```javascript
{
    accessibility: {
        skipLinks: true,         // Add skip navigation links
        announceChanges: true,   // Announce page changes
        focusManagement: true,   // Manage focus on navigation
        ariaLabels: {           // Custom ARIA labels
            navigation: 'Documentation navigation',
            search: 'Search documentation',
            content: 'Document content'
        }
    }
}
```

## Environment-Specific Configuration

### Development

```javascript
{
    debug: true,                 // Enable debug logging
    hotReload: true,            // Hot reload documents
    devTools: true              // Enable development tools
}
```

### Production

```javascript
{
    minified: true,             // Use minified assets
    analytics: {                // Analytics integration
        provider: 'google',
        trackingId: 'GA-XXXXX-X'
    },
    serviceWorker: true         // Enable offline support
}
```

## Migration from Other Systems

### From GitBook

```javascript
// GitBook-style configuration
{
    source: {
        type: 'github',
        repository: 'username/gitbook-docs',
        docsPath: '.',
        summaryFile: 'SUMMARY.md'  // GitBook summary file
    }
}
```

### From Docsify

```javascript
// Docsify-style configuration
{
    source: {
        type: 'url',
        baseUrl: './docs',
        indexFile: 'README.md',
        sidebarFile: '_sidebar.md'
    }
}
```

## Validation

The viewer includes built-in configuration validation:

```javascript
// Invalid configuration will throw helpful errors
try {
  const viewer = new MarkdownDocsViewer({
    // invalid config
  });
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## Next Steps

- **[Theming Guide](./theming.md)** - Customize the visual appearance
- **[API Reference](./api-reference.md)** - Complete method documentation
- **[Plugin Development](./plugins.md)** - Extend functionality

---

> **Best Practice**: Start with minimal configuration and add features incrementally as your documentation needs grow.
