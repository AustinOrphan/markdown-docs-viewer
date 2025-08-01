# Getting Started

Welcome to the markdown documentation viewer integration tests!

## Installation

```bash
npm install markdown-docs-viewer
```

## Basic Usage

```javascript
import { init } from 'markdown-docs-viewer/zero-config';

// Initialize with default settings
await init();
```

## Configuration

You can customize the viewer with options:

```javascript
await init({
  container: '#my-docs',
  theme: 'github-dark',
  title: 'My Documentation',
});
```

## Next Steps

- Read the [API Reference](./api/reference.md)
- Check out [Configuration Options](./configuration.md)
- Explore [Advanced Features](./advanced.md)
