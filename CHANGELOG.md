# Changelog

All notable changes to the Markdown Docs Viewer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with unit tests and DOM integration tests
- Interactive demo application with multiple examples and theme switching
- Support for multiple document sources (local, URL, GitHub, content)
- Built-in theme system with light and dark themes
- Search functionality with configurable options
- Responsive design with mobile-friendly sidebar
- Code syntax highlighting with copy-to-clipboard functionality
- TypeScript support throughout the codebase
- Extensive documentation and examples
- **Export functionality** for PDF and HTML formats
- **Internationalization (i18n)** support with multi-language capabilities
- **Advanced search** with filters, highlighting, and search history
- **Table of Contents** auto-generation with scroll spy
- **Print-friendly styles** with optimized layout for printing
- **Performance optimizations** including LRU cache, persistent cache, and lazy loading
- **CI/CD pipeline** with GitHub Actions for testing, publishing, and security scanning

### Changed
- Improved package.json metadata with proper author and repository information
- Enhanced README.md with comprehensive usage examples and API documentation
- Restructured project with better separation of concerns
- Enhanced error handling with custom error types and retry logic
- Improved performance with caching strategies and lazy loading

### Documentation
- Added comprehensive README.md with installation and usage instructions
- Created CONTRIBUTING.md with detailed contribution guidelines
- Added example documentation files covering all major features
- Included API reference documentation with TypeScript types
- Added documentation for all advanced features

### Developer Experience
- Set up Vitest testing framework with jsdom environment
- Configured comprehensive test coverage reporting
- Added development scripts for building, testing, and demo
- Implemented proper TypeScript configuration
- Added GitHub Actions workflows for CI/CD
- Created issue templates for better project management

## [1.0.0] - 2025-01-19

### Added
- Initial release of Markdown Docs Viewer
- Core `MarkdownDocsViewer` class with essential functionality
- Basic theme support with default and dark themes
- Document loading and rendering capabilities
- Search functionality
- Navigation system with sidebar
- Factory functions for easy instantiation
- TypeScript type definitions
- Mobile-responsive design

### Features
- **Multiple Document Sources**: Support for local files, remote URLs, GitHub repositories, and inline content
- **Theming System**: Customizable themes with CSS custom properties
- **Search**: Built-in search across document titles, content, and tags
- **Responsive Design**: Mobile-friendly with collapsible sidebar
- **Code Highlighting**: Syntax highlighting for code blocks
- **Copy to Clipboard**: Easy code copying functionality
- **Navigation**: Organized document navigation with categories
- **Performance**: Efficient document loading and caching

### API
- `MarkdownDocsViewer` - Main viewer class
- `createViewer()` - Factory function for creating viewer instances
- `createCustomTheme()` - Theme creation utility
- `defaultTheme` and `darkTheme` - Built-in themes

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest) 
- Safari (latest)
- Mobile browsers

---

## Release Notes Format

Each version follows this structure:

### Added
- New features and capabilities

### Changed  
- Changes to existing functionality

### Fixed
- Bug fixes and issue resolutions

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Security
- Security-related improvements

---

## Version History

### Pre-1.0 Development
- **Phase 1**: Essential fixes and demo implementation
- **Phase 2**: Documentation and polish
- **Phase 3**: Production readiness
- **Phase 4**: Future enhancements

### Contribution Guidelines
For information about contributing to this project, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Migration Guides
When breaking changes are introduced, migration guides will be provided in this section.

### Known Issues
Current known issues and their workarounds will be documented here.

### Planned Features
Upcoming features and enhancements will be tracked in the project's GitHub issues.