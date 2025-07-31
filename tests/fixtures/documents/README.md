# Project Documentation

Welcome to our comprehensive documentation system. This documentation viewer provides a modern, responsive interface for browsing markdown documentation.

## Overview

This project is a TypeScript library that creates themeable markdown documentation viewers with zero-configuration setup and powerful customization options.

### Key Features

- **Zero-Configuration**: Get started instantly with automatic document discovery
- **Theme System**: Built-in themes (default, github, material, nord) with light/dark variants
- **Search Functionality**: Full-text search with advanced filtering options
- **Mobile Responsive**: Optimized experience across all device sizes
- **Performance Optimized**: LRU caching, lazy loading, and memory management
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation

## Quick Start

```javascript
import { init } from 'markdown-docs-viewer/zero-config';

// Initialize with default settings
await init();

// Or with custom options
await init({
  container: '#docs',
  theme: 'github-dark',
  title: 'My Documentation'
});
```

## Architecture

The library follows a modular architecture with clear separation of concerns:

- **Core Components**: Main viewer class and zero-config API
- **Document Loading**: Support for local, URL, GitHub, and inline content sources
- **Theme System**: Comprehensive theming with CSS custom properties
- **Search Engine**: Advanced search with filtering and categorization
- **Navigation**: Sidebar navigation with table of contents

## Getting Started

1. [Installation Guide](./getting-started.md) - Step-by-step setup instructions
2. [Configuration Options](./configuration.md) - Detailed configuration reference
3. [API Documentation](./api/reference.md) - Complete API reference
4. [Theme Customization](./themes.md) - Learn about themes and customization

## Support

For issues, questions, or contributions, please visit our GitHub repository or check the troubleshooting section in our documentation.