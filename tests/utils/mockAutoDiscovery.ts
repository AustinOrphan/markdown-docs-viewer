/**
 * Mock utilities for AutoDiscovery class
 * Provides targeted mocking without global vi.mock() to prevent circular dependencies
 */

import { vi, type MockedFunction } from 'vitest';
import type { Document } from '../../src/types';

/**
 * Default test documents for successful scenarios
 */
export const DEFAULT_TEST_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    title: 'Getting Started',
    content: '# Getting Started\n\nThis is the getting started guide.',
    order: 1,
    category: 'Guides',
  },
  {
    id: 'doc2',
    title: 'API Reference',
    content: '# API Reference\n\nThis is the API reference.',
    order: 2,
    category: 'Reference',
  },
];

/**
 * Creates a mock AutoDiscovery instance
 */
export function createMockAutoDiscovery(documents: Document[] = DEFAULT_TEST_DOCUMENTS) {
  return {
    discoverFiles: vi.fn().mockResolvedValue(documents),
  };
}

/**
 * Creates a mock AutoDiscovery instance that throws errors
 */
export function createMockAutoDiscoveryWithError(error: Error) {
  return {
    discoverFiles: vi.fn().mockRejectedValue(error),
  };
}

/**
 * Creates a mock AutoDiscovery instance that returns empty results
 */
export function createMockAutoDiscoveryEmpty() {
  return {
    discoverFiles: vi.fn().mockResolvedValue([]),
  };
}

/**
 * Mocks the discoverFiles method to return successful results
 */
export function mockDiscoverFiles(
  documents: Document[] = DEFAULT_TEST_DOCUMENTS
): MockedFunction<() => Promise<Document[]>> {
  return vi.fn().mockResolvedValue(documents);
}

/**
 * Sets up AutoDiscovery constructor mock with success scenario
 */
export function setupAutoDiscoveryMock(documents: Document[] = DEFAULT_TEST_DOCUMENTS) {
  const mockInstance = createMockAutoDiscovery(documents);
  return mockInstance;
}

/**
 * Sets up discovery error scenario
 */
export function setupDiscoveryError(error: Error) {
  const mockInstance = createMockAutoDiscoveryWithError(error);
  return mockInstance;
}

/**
 * Sets up empty discovery scenario (no documents found)
 */
export function setupEmptyDiscovery() {
  const mockInstance = createMockAutoDiscoveryEmpty();
  return mockInstance;
}

/**
 * Creates test documents with custom properties
 */
export function createTestDocuments(overrides: Partial<Document>[] = []): Document[] {
  return overrides.map((override, index) => ({
    id: `test-doc-${index + 1}`,
    title: `Test Document ${index + 1}`,
    content: `# Test Document ${index + 1}\n\nThis is test content.`,
    order: index + 1,
    category: 'Test',
    ...override,
  }));
}

/**
 * Mock utilities for specific discovery scenarios
 */
export const mockDiscoveryScenarios = {
  /**
   * Success scenario with default documents
   */
  success: (documents: Document[] = DEFAULT_TEST_DOCUMENTS) => {
    return setupAutoDiscoveryMock(documents);
  },

  /**
   * Error scenario during file discovery
   */
  error: (error: Error = new Error('Discovery failed')) => {
    return setupDiscoveryError(error);
  },

  /**
   * Empty scenario (no documents found)
   */
  empty: () => {
    return setupEmptyDiscovery();
  },

  /**
   * Timeout scenario
   */
  timeout: () => {
    return setupDiscoveryError(new Error('File discovery timeout'));
  },

  /**
   * Permission error scenario
   */
  permissionError: () => {
    return setupDiscoveryError(new Error('Permission denied'));
  },

  /**
   * Network error scenario
   */
  networkError: () => {
    return setupDiscoveryError(new Error('Network error during discovery'));
  },
};

/**
 * Utility to create custom AutoDiscovery mock with options
 */
export interface AutoDiscoveryMockOptions {
  documents?: Document[];
  error?: Error;
  delay?: number;
  shouldTimeout?: boolean;
}

/**
 * Sets up comprehensive AutoDiscovery mock with options
 */
export function setupAutoDiscoveryMockWithOptions(options: AutoDiscoveryMockOptions = {}) {
  const { documents = DEFAULT_TEST_DOCUMENTS, error, delay = 0, shouldTimeout = false } = options;

  let discoverFilesMock: MockedFunction<() => Promise<Document[]>>;

  if (error) {
    discoverFilesMock = vi.fn().mockRejectedValue(error);
  } else if (shouldTimeout) {
    discoverFilesMock = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('File discovery timeout')), 30000);
      });
    });
  } else if (delay > 0) {
    discoverFilesMock = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(documents), delay);
      });
    });
  } else {
    discoverFilesMock = vi.fn().mockResolvedValue(documents);
  }

  const mockInstance = {
    discoverFiles: discoverFilesMock,
  };

  return {
    mockInstance,
    discoverFilesMock,
  };
}

/**
 * Helper to create documents with specific categories
 */
export function createDocumentsByCategory(categories: Record<string, number>): Document[] {
  const documents: Document[] = [];
  let id = 1;

  Object.entries(categories).forEach(([category, count]) => {
    for (let i = 0; i < count; i++) {
      documents.push({
        id: `doc-${id}`,
        title: `${category} Document ${i + 1}`,
        content: `# ${category} Document ${i + 1}\n\nContent for ${category}.`,
        order: id,
        category,
      });
      id++;
    }
  });

  return documents;
}

/**
 * Helper to create documents with specific file extensions
 */
export function createDocumentsWithExtensions(extensions: string[]): Document[] {
  return extensions.map((ext, index) => ({
    id: `doc-${index + 1}`,
    title: `Document ${index + 1}`,
    content: `# Document ${index + 1}\n\nContent for ${ext} file.`,
    order: index + 1,
    file: `./docs/doc-${index + 1}.${ext}`,
  }));
}

/**
 * Complete discovery mock utility functions
 */

/**
 * Mock successful discovery with custom documents
 */
export function mockDiscoverSuccess(
  documents: Document[] = DEFAULT_TEST_DOCUMENTS
): MockedFunction<() => Promise<Document[]>> {
  return vi.fn().mockResolvedValue(documents);
}

/**
 * Mock discovery that returns empty array
 */
export function mockDiscoverEmpty(): MockedFunction<() => Promise<Document[]>> {
  return vi.fn().mockResolvedValue([]);
}

/**
 * Mock discovery that throws an error
 */
export function mockDiscoverError(
  error: Error = new Error('Discovery failed')
): MockedFunction<() => Promise<Document[]>> {
  return vi.fn().mockRejectedValue(error);
}

/**
 * Mock discovery that simulates timeout
 */
export function mockDiscoverTimeout(
  timeoutMs: number = 30000
): MockedFunction<() => Promise<Document[]>> {
  return vi.fn().mockImplementation(() => {
    return new Promise<Document[]>((_, reject) => {
      setTimeout(() => reject(new Error('File discovery timeout')), timeoutMs);
    });
  });
}

/**
 * Factory function to create AutoDiscovery mock with various options
 */
export interface AutoDiscoveryMockFactoryOptions {
  scenario?: 'success' | 'error' | 'empty' | 'timeout' | 'slow';
  documents?: Document[];
  error?: Error;
  delay?: number;
  timeoutMs?: number;
}

export function createMockAutoDiscoveryFactory(options: AutoDiscoveryMockFactoryOptions = {}) {
  const {
    scenario = 'success',
    documents = DEFAULT_TEST_DOCUMENTS,
    error = new Error('Discovery failed'),
    delay = 0,
    timeoutMs = 30000,
  } = options;

  let discoverFiles: MockedFunction<() => Promise<Document[]>>;

  switch (scenario) {
    case 'success':
      discoverFiles =
        delay > 0
          ? vi
              .fn()
              .mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(documents), delay))
              )
          : mockDiscoverSuccess(documents);
      break;
    case 'error':
      discoverFiles = mockDiscoverError(error);
      break;
    case 'empty':
      discoverFiles = mockDiscoverEmpty();
      break;
    case 'timeout':
      discoverFiles = mockDiscoverTimeout(timeoutMs);
      break;
    case 'slow':
      discoverFiles = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(documents), delay || 2000);
        });
      });
      break;
    default:
      discoverFiles = mockDiscoverSuccess(documents);
  }

  return {
    discoverFiles,
    mockInstance: { discoverFiles },
  };
}

/**
 * Helper to create realistic document sets for testing
 */
export function createRealisticTestDocuments(): Document[] {
  return [
    {
      id: 'readme',
      title: 'Overview',
      file: './docs/README.md',
      content:
        '# Project Overview\n\nWelcome to our documentation. This project provides a comprehensive markdown documentation viewer.\n\n## Features\n\n- Zero-configuration setup\n- Auto-discovery\n- Theme switching\n- Search functionality',
      description:
        'Welcome to our documentation. This project provides a comprehensive markdown documentation viewer.',
      order: 1,
      category: 'getting-started',
      tags: ['overview', 'introduction'],
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      file: './docs/getting-started.md',
      content:
        '# Getting Started\n\n## Installation\n\n```bash\nnpm install markdown-docs-viewer\n```\n\n## Basic Usage\n\n```javascript\nimport { init } from "markdown-docs-viewer/zero-config";\nawait init();\n```',
      description: 'Learn how to install and set up the markdown documentation viewer.',
      order: 2,
      category: 'getting-started',
      tags: ['installation', 'setup', 'quickstart'],
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      file: './docs/api/reference.md',
      content:
        '# API Reference\n\n## Core Functions\n\n### init(options?)\n\nInitializes the documentation viewer.\n\n**Parameters:**\n\n- `options` (optional): Configuration options\n\n**Returns:** Promise<MarkdownDocsViewer>',
      description:
        'Complete API reference documentation for all available functions and interfaces.',
      order: 10,
      category: 'reference',
      tags: ['api', 'reference', 'functions'],
    },
    {
      id: 'configuration',
      title: 'Configuration',
      file: './docs/configuration.md',
      content:
        '# Configuration\n\n## Zero-Config Options\n\n```typescript\ninterface ZeroConfigOptions {\n  container?: string | HTMLElement;\n  configPath?: string;\n  docsPath?: string;\n  theme?: string;\n  title?: string;\n}\n```',
      description: 'Detailed configuration options and customization guide.',
      order: 5,
      category: 'guides',
      tags: ['configuration', 'options', 'customization'],
    },
  ];
}

/**
 * Helper to create large document set for performance testing
 */
export function createLargeDocumentSet(count: number = 100): Document[] {
  const documents: Document[] = [];
  const categories = ['guides', 'reference', 'tutorials', 'examples', 'api'];

  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length];
    documents.push({
      id: `doc-${i}`,
      title: `Document ${i}`,
      file: `./docs/${category}/doc-${i}.md`,
      content: `# Document ${i}\n\nThis is document number ${i} in the ${category} category.\n\n## Content\n\n${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20)}`,
      description: `This is document number ${i} in the ${category} category.`,
      order: i,
      category,
      tags: [category, 'test', `doc${i}`],
    });
  }

  return documents;
}

/**
 * Helper to create documents with various edge cases
 */
export function createEdgeCaseDocuments(): Document[] {
  return [
    {
      id: 'empty-content',
      title: 'Empty Document',
      file: './docs/empty.md',
      content: '',
      description: 'A document with no content',
      category: 'edge-cases',
    },
    {
      id: 'no-title',
      title: 'untitled',
      file: './docs/no-title.md',
      content: 'This document has no title heading.',
      category: 'edge-cases',
    },
    {
      id: 'special-chars',
      title: 'Special Characters: @#$%^&*()',
      file: './docs/special-chars.md',
      content:
        '# Special Characters: @#$%^&*()\n\nThis document has special characters in its title.',
      category: 'edge-cases',
      tags: ['special', 'characters', 'encoding'],
    },
    {
      id: 'very-long-title',
      title:
        'This is a very long title that might cause layout issues in some scenarios and should be handled gracefully by the viewer',
      file: './docs/long-title.md',
      content: '# This is a very long title that might cause layout issues\n\nTesting long titles.',
      category: 'edge-cases',
    },
    {
      id: 'unicode-content',
      title: 'Unicode & Emoji Content 🚀',
      file: './docs/unicode.md',
      content:
        '# Unicode & Emoji Content 🚀\n\n## Testing Unicode\n\n- Japanese: こんにちは\n- German: Müller\n- Emoji: 🎉🔥💻\n- Math: ∑ ∆ ∞',
      category: 'edge-cases',
      tags: ['unicode', 'emoji', 'internationalization'],
    },
  ];
}
