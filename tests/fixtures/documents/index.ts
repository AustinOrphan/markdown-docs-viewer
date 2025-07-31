/**
 * Document fixtures for testing
 */

export interface TestDocument {
  id: string;
  title: string;
  path: string;
  content?: string;
}

export const testDocuments: TestDocument[] = [
  {
    id: 'readme',
    title: 'Getting Started',
    path: 'README.md',
    content: '# Getting Started\n\nThis is the getting started guide.'
  },
  {
    id: 'api',
    title: 'API Reference', 
    path: 'api/reference.md',
    content: '# API Reference\n\nThis is the API documentation.'
  },
  {
    id: 'guide',
    title: 'User Guide',
    path: 'guide.md',
    content: '# User Guide\n\nThis is the user guide.'
  }
];

export const emptyDocument: TestDocument = {
  id: 'empty',
  title: 'Empty Document',
  path: 'empty.md',
  content: ''
};

export const markdownDocument: TestDocument = {
  id: 'markdown',
  title: 'Markdown Examples',
  path: 'markdown.md',
  content: `# Markdown Examples

## Headers

### Level 3 Header

## Lists

- Item 1
- Item 2
- Item 3

## Code

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

## Links

[Example Link](https://example.com)
`
};