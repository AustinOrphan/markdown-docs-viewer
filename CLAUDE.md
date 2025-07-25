# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development

- `npm run dev` - Start Vite development server on port 5000
- `npm run build` - Build library (ES + UMD) and generate TypeScript declarations
- `npm run preview` - Preview built library

### Testing

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI with coverage

### Code Quality

- `npm run lint` - Lint TypeScript files with ESLint and auto-fix
- `npm run typecheck` - Type check without emitting files

### Demo

- `npm run demo:dev` - Start demo development server
- `npm run demo:build` - Build demo application
- `npm run demo:preview` - Preview built demo

## Architecture Overview

This is a TypeScript library that creates themeable markdown documentation viewers. The codebase follows a modular architecture with clear separation of concerns:

### Core Components

- **MarkdownDocsViewer** (`src/viewer.ts`) - Main viewer class that orchestrates all functionality
- **Factory Functions** (`src/factory.ts`) - `createViewer()` and `quickStart()` for easy instantiation
- **Type System** (`src/types.ts`) - Comprehensive TypeScript interfaces for all configuration options

### Feature Modules

- **Document Loading** (`src/loader.ts`) - Handles multiple document sources (local, URL, GitHub, content)
- **Search System** (`src/search.ts`, `src/advanced-search.ts`) - Basic and advanced search with filtering
- **Navigation** (`src/navigation.ts`, `src/router.ts`) - Sidebar navigation and client-side routing
- **Table of Contents** (`src/toc.ts`) - Auto-generated TOC with scroll spy

### Theming Architecture

- **Theme System** (`src/themes.ts`, `src/theme-manager.ts`) - Comprehensive theming with built-in and custom themes
- **Theme Switcher** (`src/theme-switcher.ts`) - Runtime theme switching UI
- **Styles** (`src/styles.ts`, `src/mobile-styles.ts`) - CSS generation and mobile responsiveness

### Advanced Features

- **Performance** (`src/performance.ts`) - LRU caching, lazy loading, memory management
- **Export** (`src/export.ts`) - PDF and HTML export functionality
- **I18n** (`src/i18n.ts`) - Internationalization support
- **Error Handling** (`src/errors.ts`) - Robust error management with retry logic

### Build Configuration

- **Vite** (`vite.config.ts`) - Library build with ES/UMD formats, external dependencies for marked/highlight.js
- **TypeScript** (`tsconfig.json`) - ES2020 target, strict mode, declaration generation
- **Testing** (`vitest.config.ts`) - Vitest with jsdom, 80% coverage thresholds, comprehensive mocking

### Document Sources

The library supports four document source types:

- **local** - Files served by web server with basePath
- **url** - Remote files with optional headers
- **github** - GitHub repository files
- **content** - Inline markdown content

### Theme System

Uses CSS custom properties with comprehensive theme objects containing:

- Colors (primary, background, text variations, semantic colors)
- Typography (body, heading, code fonts)
- Spacing and layout dimensions
- Border radius and shadows

### Configuration Pattern

All functionality is driven by a single `DocumentationConfig` interface that supports:

- Document source configuration
- Theme selection and customization
- Search options and filtering
- Navigation behavior
- Mobile responsiveness settings
- Performance optimizations

## Testing Strategy

Uses Vitest with jsdom environment and comprehensive mocking:

- Browser APIs (ResizeObserver, IntersectionObserver)
- localStorage/sessionStorage
- DOM manipulation and events
- Network requests for document loading

Tests are organized by feature module with `tests/setup.ts` providing global configuration.

## Key Dependencies

- **marked** - Markdown parsing
- **marked-highlight** - Syntax highlighting integration
- **highlight.js** - Code syntax highlighting

These are peer dependencies, allowing consumers to control versions.

## Accessibility Implementation

### WCAG 2.1 AA Compliance

The library implements comprehensive accessibility features:

- **Theme Switcher** - Automatically focuses first menu item when dropdown opens via `focusFirstMenuItem()`
- **Focus Trapping** - Implemented in theme switcher dropdown with Tab/Shift+Tab cycling
- **ARIA Attributes** - Proper roles, states, and properties for all interactive components
- **Keyboard Navigation** - Full keyboard support for navigation, search, and theme switching
- **Screen Reader Support** - Live regions for dynamic content announcements

### Testing Considerations

When writing tests for components with accessibility features:

- Theme switcher dropdown always has a focused element when open
- Navigation links support arrow key navigation with announcements
- Search component implements ARIA combobox pattern
- TOC (Table of Contents) announces active section changes

### Mobile Enhancements

- Theme switcher uses bottom sheet pattern on mobile
- Swipe-to-close gesture for theme dropdown
- Touch feedback with ripple effects
- Safe area handling for iOS devices
