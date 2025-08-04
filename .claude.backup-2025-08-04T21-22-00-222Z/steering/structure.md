# Project Structure - Markdown Docs Viewer

## File Organization Philosophy

### Separation of Concerns
- **Feature-based modules**: Each core feature in its own file
- **Clear boundaries**: Well-defined interfaces between modules
- **Single responsibility**: Each file handles one primary concern
- **Logical grouping**: Related functionality grouped in directories

### Naming Conventions
- **Files**: kebab-case for multi-word files (`theme-switcher.ts`)
- **Classes**: PascalCase (`MarkdownDocsViewer`)
- **Functions**: camelCase (`createViewer`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_THEME`)
- **Types/Interfaces**: PascalCase (`DocumentationConfig`)

## Core Directory Structure

```
src/
├── index.ts                    # Main library entry point
├── types.ts                    # TypeScript type definitions
├── viewer.ts                   # Core MarkdownDocsViewer class
├── factory.ts                  # createViewer() and quickStart() functions
├── zero-config.ts              # Zero-configuration initialization
├── config-loader.ts            # Configuration loading utilities
├── auto-discovery.ts           # Automatic document discovery
│
├── [Core Components]
├── loader.ts                   # Document loading from various sources
├── search.ts                   # Basic search functionality
├── advanced-search.ts          # Advanced search with filtering
├── navigation.ts               # Sidebar navigation
├── router.ts                   # Client-side routing
├── toc.ts                      # Table of contents generation
│
├── [Theming System]
├── themes.ts                   # Built-in themes and theme definitions
├── theme-manager.ts            # Theme management and switching
├── theme-switcher.ts           # Theme switcher UI component
├── theme-builder.ts            # Custom theme creation utilities
├── styles.ts                   # CSS generation and injection
├── mobile-styles.ts            # Mobile-specific styling
├── print-styles.ts             # Print media styles
│
├── [Advanced Features]
├── performance.ts              # Caching, lazy loading, optimization
├── export.ts                   # PDF and HTML export functionality
├── i18n.ts                     # Internationalization support
├── errors.ts                   # Error handling and management
│
├── [Mobile Enhancements]
├── mobile-theme-quick-switcher.ts  # Mobile theme switching UI
├── dark-mode-toggle.ts         # Standalone dark mode toggle
│
├── [Utility Files]
├── utils.ts                    # Shared utility functions
├── font-mappings.json          # Theme font mappings
└── theme-descriptions.json     # Theme metadata and descriptions
```

## Optimization System Structure

```
src/optimization/
├── algorithms/                 # Discovery and optimization algorithms
│   ├── smart-config-discovery.ts
│   ├── progressive-document-discovery.ts
│   ├── content-aware-discovery.ts
│   ├── predictive-loading.ts
│   └── mobile-optimization.ts
│
├── foundation/                 # Core optimization infrastructure
│   ├── PerformanceMonitor.ts
│   ├── RequestMonitor.ts
│   ├── DiscoveryCache.ts
│   ├── FeatureFlags.ts
│   └── environment-utils.ts
│
├── production/                 # Production-ready optimization features
│   ├── performance-optimizer.ts
│   ├── production-monitoring.ts
│   ├── cache-optimizer.ts
│   ├── memory-optimizer.ts
│   └── network-optimizer.ts
│
├── environment/               # Environment detection and adaptation
│   ├── EnvironmentDetector.ts
│   ├── RequestStrategy.ts
│   └── strategies/
│
├── rollout/                   # A/B testing and feature rollout
│   ├── ab-testing-framework.ts
│   ├── production-rollout.ts
│   └── rollout-utils.ts
│
├── errors/                    # Optimization-specific error handling
│   ├── base-errors.ts
│   ├── error-factory.ts
│   └── production-error-handling.ts
│
└── validation/               # Performance and production validation
    ├── performance-validation.ts
    └── production-validation.ts
```

## Testing Structure

```
tests/
├── setup.ts                   # Global test configuration
├── utils/                     # Testing utilities and mocks
│   ├── mockFactory.ts
│   ├── mockConfigLoader.ts
│   ├── mockAutoDiscovery.ts
│   ├── mockViewer.ts
│   └── index.ts
│
├── [Unit Tests]
├── zero-config.test.ts        # Zero-config functionality tests
├── viewer.test.ts             # Core viewer functionality
├── themes.test.ts             # Theme system tests
├── search.test.ts             # Search functionality tests
└── [other feature tests]
│
└── integration/               # Integration tests
    ├── zero-config-essential.integration.test.ts
    ├── zero-config.integration.test.ts
    └── [other integration tests]
```

## Configuration Files Structure

```
.
├── package.json               # npm configuration and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── vite.zero-config.ts       # Zero-config bundle build
├── vitest.config.ts          # Unit test configuration
├── vitest.integration.config.ts  # Integration test configuration
├── eslint.config.js          # ESLint configuration
├── .prettierrc               # Prettier configuration
│
├── demo/                     # Demo application
│   ├── index.html
│   ├── main.ts
│   └── vite.config.ts
│
├── docs/                     # Project documentation
├── scripts/                  # Build and utility scripts
└── .claude/                  # Claude Code configuration
    ├── steering/             # Steering documents (this directory)
    ├── specs/               # Feature specifications
    └── commands/            # Custom commands
```

## Code Organization Patterns

### Import Organization
```typescript
// 1. Node.js built-ins (if any)
import { readFileSync } from 'fs';

// 2. External dependencies
import { marked } from 'marked';

// 3. Internal imports - utilities first
import { debounce, escapeHtml } from './utils';

// 4. Internal imports - types
import type { DocumentationConfig, Theme } from './types';

// 5. Internal imports - components
import { ThemeManager } from './theme-manager';
```

### Export Patterns
```typescript
// Default export for main classes
export default class MarkdownDocsViewer { }

// Named exports for utilities and types
export { createViewer, quickStart } from './factory';
export type { DocumentationConfig, Theme } from './types';

// Re-exports for convenience
export { themes } from './themes';
```

### Error Handling Patterns
```typescript
// Consistent error handling with typed errors
import { DocumentLoadError, ConfigurationError } from './errors';

try {
  // Operation
} catch (error) {
  if (error instanceof DocumentLoadError) {
    // Handle document loading errors
  } else {
    // Handle unexpected errors
    throw new DocumentLoadError('Failed to load document', { cause: error });
  }
}
```

## Coding Standards

### TypeScript Usage
- **Strict Mode**: All strict TypeScript checks enabled
- **Type Annotations**: Explicit return types for public methods
- **Interface Definitions**: Comprehensive interfaces for all configuration
- **Generic Types**: Use generics for reusable components
- **Utility Types**: Leverage TypeScript utility types (Partial, Pick, etc.)

### Function Patterns
```typescript
// Public API functions - full type annotations
export function createViewer(config: DocumentationConfig): MarkdownDocsViewer {
  // Implementation
}

// Internal functions - inferred return types OK
function processDocument(content: string) {
  // Implementation with clear return type
}

// Async functions - explicit Promise types
async function loadDocument(url: string): Promise<DocumentContent> {
  // Implementation
}
```

### Class Patterns
```typescript
export default class MarkdownDocsViewer {
  private readonly config: DocumentationConfig;
  private container: HTMLElement | null = null;
  
  constructor(config: DocumentationConfig) {
    this.config = { ...defaultConfig, ...config };
  }
  
  // Public methods first, private methods last
  public async initialize(): Promise<void> { }
  private setupEventListeners(): void { }
}
```

### Constants and Configuration
```typescript
// Constants in separate section or file
export const DEFAULT_THEME = 'default-light';
export const SUPPORTED_EXTENSIONS = ['.md', '.markdown'] as const;

// Configuration objects
const defaultConfig: Partial<DocumentationConfig> = {
  theme: DEFAULT_THEME,
  search: { enabled: true },
  // ...
};
```

## Development Workflow Patterns

### Feature Development Process
1. **Design Phase**: Create specification in `.claude/specs/`
2. **Implementation**: Follow established file organization
3. **Testing**: Unit tests + integration tests
4. **Documentation**: Update relevant documentation files
5. **Quality Check**: Lint, format, type check

### Code Review Standards
- **Type Safety**: No `any` types without explicit justification
- **Error Handling**: Comprehensive error handling with typed errors
- **Performance**: Consider lazy loading and caching implications  
- **Accessibility**: Ensure WCAG AA compliance for UI components
- **Mobile**: Test mobile responsiveness and touch interactions

### Release Process
1. **Version Bump**: Update package.json version
2. **Build**: Generate distribution files
3. **Test**: Run full test suite including integration tests
4. **Documentation**: Update README and documentation
5. **Git Tag**: Tag release with version number