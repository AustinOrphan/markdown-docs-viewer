# Architecture Documentation

This directory contains detailed technical documentation about the internal architecture of the Markdown Documentation Viewer library.

## Core Architecture

The library follows a modular architecture with clear separation of concerns:

### Core Components

- **MarkdownDocsViewer** - Main viewer class that orchestrates functionality
- **Factory Functions** - Easy instantiation helpers
- **Type System** - Comprehensive TypeScript interfaces

### Feature Modules

- **Document Loading** - Handles multiple document sources
- **Search System** - Basic and advanced search capabilities
- **Navigation** - Sidebar navigation and routing
- **Table of Contents** - Auto-generated TOC with scroll spy

### Theming System

- **Theme Manager** - Runtime theme management
- **Theme Switcher** - UI for theme selection
- **Built-in Themes** - Default, GitHub, and Material Design themes

## Component Documentation

Detailed documentation for individual components:

- [Advanced Search](./components/advanced-search.md)
- [Export System](./components/export.md)
- [Internationalization](./components/i18n.md)
- [Navigation](./components/navigation.md)
- [Router](./components/router.md)
- [Theme Builder](./components/theme-builder.md)
- [Theme Switcher](./components/theme-switcher.md)
- [Table of Contents](./components/toc.md)

## Design Principles

1. **Modularity** - Each feature is self-contained and independently testable
2. **Extensibility** - Easy to add new themes, document sources, and features
3. **Performance** - Optimized with caching, lazy loading, and memory management
4. **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
5. **Type Safety** - Comprehensive TypeScript coverage for better developer experience
