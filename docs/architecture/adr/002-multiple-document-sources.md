# ADR-002: Support Multiple Document Sources

## Status

Accepted

## Context

Documentation can exist in various locations - local files during development, remote URLs for hosted docs, GitHub repositories, or even inline in the application. We need a flexible system that can handle all these sources seamlessly.

## Decision

We will implement a strategy pattern with four document source types:

1. **local**: Files served from the same origin
2. **url**: Remote files via HTTP/HTTPS
3. **github**: GitHub repository files via API
4. **content**: Inline markdown content

## Consequences

### Positive

- **Flexibility**: Users can load docs from any source
- **Development**: Easy local file testing
- **Integration**: Works with various hosting solutions
- **Offline**: Inline content works without network
- **GitHub**: Direct integration with popular platform

### Negative

- **Complexity**: Multiple code paths to maintain
- **Testing**: Each strategy needs separate tests
- **Error Handling**: Different error types per source
- **CORS**: URL source subject to CORS restrictions

### Neutral

- **Configuration**: Each source has different config options
- **Performance**: Different caching strategies per source

## Implementation

```typescript
interface DocumentSource {
  type: 'local' | 'url' | 'github' | 'content';
}

interface LocalSource extends DocumentSource {
  type: 'local';
  basePath: string;
}

interface UrlSource extends DocumentSource {
  type: 'url';
  baseUrl: string;
  headers?: Record<string, string>;
}

interface GitHubSource extends DocumentSource {
  type: 'github';
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}

interface ContentSource extends DocumentSource {
  type: 'content';
  documents: Document[];
}
```

## Examples

### Local Development

```javascript
createViewer({
  source: {
    type: 'local',
    basePath: '/docs',
  },
});
```

### GitHub Integration

```javascript
createViewer({
  source: {
    type: 'github',
    owner: 'microsoft',
    repo: 'typescript',
    branch: 'main',
  },
});
```

## References

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [GitHub API Documentation](https://docs.github.com/en/rest)
