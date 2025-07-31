/**
 * Zero-Config Integration Test Documents
 *
 * Test markdown documents and file structures for integration testing.
 */

export interface TestDocument {
  title: string;
  filename: string;
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  size: number;
}

/**
 * Basic test documents
 */
export const basicTestDocuments: TestDocument[] = [
  {
    title: 'Getting Started',
    filename: 'getting-started.md',
    path: 'getting-started.md',
    content: `# Getting Started

Welcome to our test documentation!

## Installation

To get started, run the following command:

\`\`\`bash
npm install markdown-docs-viewer
\`\`\`

## Basic Usage

Here's how to use the zero-config API:

\`\`\`javascript
import { init } from 'markdown-docs-viewer/zero-config';

// Initialize with default settings
init();
\`\`\`

## Next Steps

- Read the [API Reference](./api-reference.md)
- Check out the [Examples](./examples.md)
- Learn about [Configuration](./configuration.md)
`,
    frontmatter: {
      title: 'Getting Started',
      description: 'Quick start guide for new users',
      tags: ['getting-started', 'installation', 'basics']
    },
    size: 456
  },
  {
    title: 'API Reference',
    filename: 'api-reference.md',
    path: 'api-reference.md',
    content: `# API Reference

Complete reference for all available functions and options.

## Zero-Config Functions

### \`init(options)\`

Initializes the documentation viewer with zero configuration.

**Parameters:**
- \`options\` (optional): Configuration options object

**Example:**
\`\`\`javascript
await init({
  container: '#docs',
  theme: 'github-dark',
  title: 'My Documentation'
});
\`\`\`

### \`getViewer()\`

Returns the current global viewer instance.

**Returns:** \`MarkdownDocsViewer | null\`

### \`reload(options)\`

Reloads the documentation with new options.

**Parameters:**
- \`options\` (optional): New configuration options

### \`setTheme(themeName)\`

Changes the current theme.

**Parameters:**
- \`themeName\` (string): Theme name (e.g., 'github-light', 'github-dark')

### \`getAvailableThemes()\`

Returns array of available theme names.

**Returns:** \`string[]\`

## Configuration Options

### Container Options
- \`container\`: String selector or HTMLElement
- Auto-detection order: \`#docs\`, \`#documentation\`, \`.docs\`, \`.documentation\`, \`body\`

### Theme Options
- \`theme\`: Theme name string
- Available themes: github-light, github-dark, default-light, default-dark

### Path Options
- \`docsPath\`: Path to documentation directory (default: './docs')
- \`configPath\`: Path to configuration file (default: './docs.config.json')
`,
    frontmatter: {
      title: 'API Reference',
      description: 'Complete API documentation',
      tags: ['api', 'reference', 'functions']
    },
    size: 1234
  },
  {
    title: 'Examples',
    filename: 'examples.md',
    path: 'examples.md',
    content: `# Examples

Real-world examples of using the markdown docs viewer.

## Basic Setup

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Documentation</title>
</head>
<body>
  <div id="docs"></div>
  <script src="markdown-docs-viewer/zero-config"></script>
  <script>
    MarkdownDocsViewer.init();
  </script>
</body>
</html>
\`\`\`

## Custom Container

\`\`\`javascript
import { init } from 'markdown-docs-viewer/zero-config';

// Use custom container
await init({ container: '.my-docs-container' });
\`\`\`

## Theme Switching

\`\`\`javascript
import { init, setTheme, getAvailableThemes } from 'markdown-docs-viewer/zero-config';

// Initialize with light theme
await init({ theme: 'github-light' });

// Get available themes
const themes = getAvailableThemes();
console.log('Available themes:', themes);

// Switch to dark theme
setTheme('github-dark');
\`\`\`

## Dynamic Loading

\`\`\`javascript
import { reload } from 'markdown-docs-viewer/zero-config';

// Reload with different documentation path
await reload({ docsPath: './v2-docs' });
\`\`\`

## Error Handling

\`\`\`javascript
import { init } from 'markdown-docs-viewer/zero-config';

try {
  await init({ container: '#docs' });
  console.log('Documentation loaded successfully!');
} catch (error) {
  console.error('Failed to load documentation:', error);
}
\`\`\`
`,
    frontmatter: {
      title: 'Examples',
      description: 'Code examples and usage patterns',
      tags: ['examples', 'code', 'usage']
    },
    size: 987
  },
  {
    title: 'Configuration',
    filename: 'configuration.md',
    path: 'configuration.md',
    content: `# Configuration

Learn how to configure the markdown docs viewer.

## Configuration File

Create a \`docs.config.json\` file in your project root:

\`\`\`json
{
  "title": "My Documentation",
  "theme": "github-light",
  "source": {
    "type": "auto",
    "path": "./docs",
    "exclude": ["**/drafts/**"],
    "include": ["**/*.md"]
  },
  "search": {
    "enabled": true,
    "placeholder": "Search docs..."
  },
  "navigation": {
    "autoSort": true,
    "collapsible": true
  },
  "features": {
    "tableOfContents": true,
    "darkMode": true,
    "codeHighlighting": true
  }
}
\`\`\`

## Runtime Options

Override configuration at runtime:

\`\`\`javascript
await init({
  title: 'Runtime Title',
  theme: 'github-dark',
  docsPath: './custom-docs'
});
\`\`\`

## Theme Configuration

Available built-in themes:
- \`github-light\`: GitHub-inspired light theme
- \`github-dark\`: GitHub-inspired dark theme  
- \`default-light\`: Clean light theme
- \`default-dark\`: Clean dark theme

## Auto-Discovery

The viewer automatically discovers markdown files in your docs directory:

- Searches recursively in \`./docs\` (or custom path)
- Includes \`*.md\` and \`*.markdown\` files
- Respects exclude/include patterns
- Generates navigation from file structure
`,
    frontmatter: {
      title: 'Configuration',
      description: 'Configuration options and setup',
      tags: ['configuration', 'setup', 'options']
    },
    size: 856
  }
];

/**
 * Test documents with special cases
 */
export const specialTestDocuments: TestDocument[] = [
  {
    title: 'Empty Document',
    filename: 'empty.md',
    path: 'empty.md',
    content: '',
    size: 0
  },
  {
    title: 'Large Document',
    filename: 'large.md',
    path: 'large.md',
    content: `# Large Document\n\n${Array(1000).fill('This is a test paragraph with some content to make the document large. ').join('')}`,
    size: 50000
  },
  {
    title: 'Special Characters',
    filename: 'special-chars.md',
    path: 'special-chars.md',
    content: `# Special Characters Test

This document tests various special characters and Unicode:

## Symbols
- © Copyright
- ™ Trademark  
- ® Registered
- § Section
- ¶ Paragraph

## Mathematical
- ∑ Summation
- ∆ Delta
- ∞ Infinity
- ≈ Approximately
- ≠ Not equal

## Currency
- $ Dollar
- € Euro
- £ Pound
- ¥ Yen
- ₿ Bitcoin

## Emojis
- 📚 Books
- 🚀 Rocket
- ⚡ Lightning
- 🎯 Target
- 💡 Light bulb

## Code with Special Characters
\`\`\`javascript
const special = "Test with quotes: 'single' and \\"double\\"";
const unicode = "Unicode: café, naïve, résumé";
const symbols = "Symbols: <>&'\\"";
\`\`\`
`,
    size: 742
  },
  {
    title: 'Malformed Markdown',
    filename: 'malformed.md',
    path: 'malformed.md',
    content: `# Malformed Markdown Test

This document contains intentionally malformed markdown:

## Unclosed Code Block
\`\`\`javascript
function test() {
  console.log('This code block is never closed');

## Bad Links
[Link with no URL]()
[Link with malformed URL](not-a-url
[Unclosed link text

## Bad Images
![Alt text with no src]()
![Malformed image](broken-image.jpg "unclosed quote

## Bad Tables
| Column 1 | Column 2
| Missing separator

Column without header
| Data | More Data |

## Bad Lists
- Item 1
  - Nested item
    Bad nesting
- Item 2
  1. Mixed list types
  - Back to bullets

## Bad Headings
### Header with no text above it

Text without proper spacing
## Another header

##### Skipped header levels (h5 after h2)
`,
    size: 845
  }
];

/**
 * Directory structures for testing
 */
export const testDirectoryStructures = {
  basic: {
    name: 'basic',
    description: 'Basic flat structure',
    files: basicTestDocuments
  },
  nested: {
    name: 'nested',
    description: 'Nested directory structure',
    files: [
      { ...basicTestDocuments[0], path: 'getting-started/index.md' },
      { ...basicTestDocuments[1], path: 'api/reference.md' },
      { ...basicTestDocuments[2], path: 'api/examples.md' },
      { ...basicTestDocuments[3], path: 'guides/configuration.md' }
    ]
  },
  mixed: {
    name: 'mixed',
    description: 'Mixed files and directories',
    files: [
      basicTestDocuments[0], // Root level
      { ...basicTestDocuments[1], path: 'api/reference.md' }, // Nested
      basicTestDocuments[2], // Root level
      { ...basicTestDocuments[3], path: 'guides/configuration.md' }, // Nested
      ...specialTestDocuments // Root level specials
    ]
  },
  empty: {
    name: 'empty',
    description: 'Empty directory',
    files: []
  }
};

/**
 * Helper to get total size of documents
 */
export function getTotalSize(documents: TestDocument[]): number {
  return documents.reduce((total, doc) => total + doc.size, 0);
}

/**
 * Helper to filter documents by tag
 */
export function getDocumentsByTag(documents: TestDocument[], tag: string): TestDocument[] {
  return documents.filter(doc => 
    doc.frontmatter?.tags && doc.frontmatter.tags.includes(tag)
  );
}

/**
 * Helper to create a virtual file system structure
 */
export function createVirtualFileSystem(structure: typeof testDirectoryStructures.basic) {
  const fileMap = new Map<string, TestDocument>();
  
  structure.files.forEach(doc => {
    fileMap.set(doc.path, doc);
  });
  
  return {
    name: structure.name,
    description: structure.description,
    files: fileMap,
    getFile: (path: string) => fileMap.get(path),
    getAllFiles: () => Array.from(fileMap.values()),
    getFilePaths: () => Array.from(fileMap.keys()),
    size: getTotalSize(structure.files)
  };
}

/**
 * All test documents combined
 */
export const allTestDocuments = [...basicTestDocuments, ...specialTestDocuments];

/**
 * Document search test data
 */
export const searchTestData = {
  queries: [
    { term: 'getting started', expectedResults: ['getting-started.md'] },
    { term: 'API', expectedResults: ['api-reference.md'] },
    { term: 'configuration', expectedResults: ['configuration.md', 'api-reference.md'] },
    { term: 'theme', expectedResults: ['api-reference.md', 'configuration.md'] },
    { term: 'example', expectedResults: ['examples.md', 'api-reference.md'] },
    { term: 'nonexistent', expectedResults: [] }
  ],
  tags: [
    { tag: 'getting-started', expectedDocs: 1 },
    { tag: 'api', expectedDocs: 1 },
    { tag: 'examples', expectedDocs: 1 },
    { tag: 'configuration', expectedDocs: 1 },
    { tag: 'nonexistent', expectedDocs: 0 }
  ]
};