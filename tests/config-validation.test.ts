import { describe, it, expect, beforeEach } from 'vitest';
import { validateConfig, DocumentationConfig } from '../src/types';

describe('Config Validation', () => {
  let baseConfig: DocumentationConfig;

  beforeEach(() => {
    // Set up a valid base configuration for tests
    baseConfig = {
      container: '#test-container',
      source: {
        type: 'content',
        documents: [
          {
            id: 'doc1',
            title: 'Test Document',
            content: '# Test Content',
          },
        ],
      },
    };
  });

  describe('Container Validation', () => {
    it('should throw error when container is missing', () => {
      const config = { ...baseConfig };
      delete (config as any).container;

      expect(() => validateConfig(config)).toThrow(
        'Container is required: Please provide either a CSS selector string'
      );
    });

    it('should throw error when container selector is empty string', () => {
      const config = { ...baseConfig, container: '' };

      expect(() => validateConfig(config)).toThrow(
        'Container is required: Please provide either a CSS selector string'
      );
    });

    it('should throw error when container selector is whitespace only', () => {
      const config = { ...baseConfig, container: '   ' };

      expect(() => validateConfig(config)).toThrow(
        'Container selector cannot be empty: Please provide a valid CSS selector string'
      );
    });

    it('should throw error for invalid CSS selector syntax', () => {
      const config = { ...baseConfig, container: '#invalid[' };

      // CSS selector validation happens even in test environment
      expect(() => validateConfig(config)).toThrow('Invalid CSS selector "#invalid["');
    });

    it('should throw error for malformed CSS selectors with brackets', () => {
      const invalidSelectors = [
        '#invalid[unclosed',
        '.class[attr=value',
        'div[missing-quote="value',
        'element[attr="unclosed',
      ];

      invalidSelectors.forEach(selector => {
        const config = { ...baseConfig, container: selector };
        // These selectors will be caught by CSS selector validation
        expect(() => validateConfig(config)).toThrow('Invalid CSS selector');
      });
    });

    it('should throw error for invalid character sequences in selectors', () => {
      const invalidSelectors = [
        '##double-hash',
        '..double-dot',
        'element..double-dot-class',
        '#id##double-hash',
      ];

      invalidSelectors.forEach(selector => {
        const config = { ...baseConfig, container: selector };
        // These malformed selectors should be caught by validation
        expect(() => validateConfig(config)).toThrow('Invalid CSS selector');
      });
    });

    it('should throw error for CSS selectors with invalid pseudo-classes', () => {
      const invalidSelectors = [
        ':invalid-pseudo',
        '::invalid-pseudo-element',
        'div:unknown-state',
        '.class:not-a-real-pseudo',
      ];

      invalidSelectors.forEach(selector => {
        const config = { ...baseConfig, container: selector };
        // These would fail querySelector validation in browser environment
        expect(() => validateConfig(config)).toThrow('Invalid CSS selector');
      });
    });

    it('should validate null and undefined containers throw appropriate errors', () => {
      const config1 = { ...baseConfig, container: null as any };
      const config2 = { ...baseConfig, container: undefined as any };

      expect(() => validateConfig(config1)).toThrow(
        'Container is required: Please provide either a CSS selector string'
      );

      expect(() => validateConfig(config2)).toThrow(
        'Container is required: Please provide either a CSS selector string'
      );
    });

    it('should throw error for non-string non-HTMLElement containers', () => {
      const invalidContainers = [123, true, [], {}, () => {}, Symbol('test')];

      invalidContainers.forEach(container => {
        const config = { ...baseConfig, container: container as any };

        if (typeof container === 'object' && container !== null && !Array.isArray(container)) {
          // Objects go through HTMLElement validation
          expect(() => validateConfig(config)).toThrow('Container must be an HTMLElement');
        } else {
          // Other types should be handled appropriately
          expect(() => validateConfig(config)).toThrow();
        }
      });
    });

    it('should validate CSS selector format (DOM elements must exist)', () => {
      const validSelectors = [
        '#my-id',
        '.my-class',
        'div',
        'div.class',
        '#id.class',
        '[data-attr="value"]',
        'body > div',
        'div:first-child',
      ];

      validSelectors.forEach(selector => {
        const config = { ...baseConfig, container: selector };
        // In test environment, valid selectors will fail DOM existence check
        expect(() => validateConfig(config)).toThrow('Container element not found');
      });
    });

    it('should validate HTMLElement when not a string', () => {
      // In test environment without HTMLElement, proper HTMLElement objects will fail validation
      const config = { ...baseConfig, container: { tagName: 'DIV', appendChild: () => {} } as any };

      expect(() => validateConfig(config)).toThrow('Container must be an HTMLElement');
    });

    it('should throw error for invalid HTMLElement-like object', () => {
      const config = { ...baseConfig, container: { notAnElement: true } as any };

      expect(() => validateConfig(config)).toThrow('Container must be an HTMLElement');
    });
  });

  describe('Source Validation', () => {
    it('should throw error when source is missing', () => {
      const config = { ...baseConfig };
      delete (config as any).source;

      expect(() => validateConfig(config)).toThrow('Configuration Error: Source is required');
    });

    it('should throw error for invalid source type', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          type: 'invalid' as any,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Invalid source type "invalid"'
      );
    });

    it('should accept valid source types', () => {
      const validTypes = ['local', 'url', 'github', 'content'];

      validTypes.forEach(type => {
        const config = {
          ...baseConfig,
          source: {
            ...baseConfig.source,
            type: type as any,
            basePath: type === 'local' ? '/path' : undefined,
            baseUrl: type === 'url' || type === 'github' ? 'https://example.com' : undefined,
          },
        };

        // Adjust document properties based on type
        if (type !== 'content') {
          config.source.documents[0] = {
            ...config.source.documents[0],
            file: 'test.md',
            content: undefined,
          };
        }

        if (type === 'github') {
          config.source.baseUrl = 'https://github.com/user/repo';
        }

        expect(() => validateConfig(config)).not.toThrow();
      });
    });

    it('should throw error when documents is not an array', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: 'not-an-array' as any,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Source documents must be an array'
      );
    });

    it('should throw error when documents array is empty', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: [],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Source documents array cannot be empty'
      );
    });

    it('should throw error for invalid document object', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: [null as any],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document at index 0 is invalid'
      );
    });

    it('should throw error for document missing id', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: [
            {
              title: 'Test',
              content: 'Content',
            } as any,
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document at index 0 is missing a valid id'
      );
    });

    it('should throw error for document with empty id', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: [
            {
              id: '',
              title: 'Test',
              content: 'Content',
            },
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document at index 0 is missing a valid id'
      );
    });

    it('should throw error for document missing title', () => {
      const config = {
        ...baseConfig,
        source: {
          ...baseConfig.source,
          documents: [
            {
              id: 'doc1',
              content: 'Content',
            } as any,
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document "doc1" is missing a valid title'
      );
    });

    it('should throw error for content source missing content property', () => {
      const config = {
        ...baseConfig,
        source: {
          type: 'content' as const,
          documents: [
            {
              id: 'doc1',
              title: 'Test',
              file: 'test.md',
            } as any,
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document "doc1" of content source type must have content property'
      );
    });

    it('should throw error for non-content source missing file property', () => {
      const config = {
        container: '#test',
        source: {
          type: 'local' as const,
          basePath: '/path',
          documents: [
            {
              id: 'doc1',
              title: 'Test',
              content: 'Content',
            } as any,
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Document "doc1" of local source type must have file property'
      );
    });

    it('should throw error for local source missing basePath', () => {
      const config = {
        container: '#test',
        source: {
          type: 'local' as const,
          documents: [
            {
              id: 'doc1',
              title: 'Test',
              file: 'test.md',
            },
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Local source type requires basePath property'
      );
    });

    it('should throw error for url source missing baseUrl', () => {
      const config = {
        container: '#test',
        source: {
          type: 'url' as const,
          documents: [
            {
              id: 'doc1',
              title: 'Test',
              file: 'test.md',
            },
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: URL source type requires baseUrl property'
      );
    });

    it('should throw error for github source with invalid baseUrl', () => {
      const config = {
        container: '#test',
        source: {
          type: 'github' as const,
          baseUrl: 'https://example.com',
          documents: [
            {
              id: 'doc1',
              title: 'Test',
              file: 'test.md',
            },
          ],
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: GitHub source type requires baseUrl property pointing to a GitHub repository'
      );
    });
  });

  describe('Theme Validation', () => {
    it('should accept config without theme', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });

    it('should throw error for theme missing name', () => {
      const config = {
        ...baseConfig,
        theme: {
          colors: {},
          fonts: {},
          spacing: {},
        } as any,
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Theme must have a valid name property'
      );
    });

    it('should throw error for theme missing colors', () => {
      const config = {
        ...baseConfig,
        theme: {
          name: 'custom',
          fonts: {},
          spacing: {},
        } as any,
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Theme must have a colors object'
      );
    });

    it('should throw error for theme missing required color properties', () => {
      const config = {
        ...baseConfig,
        theme: {
          name: 'custom',
          colors: {
            primary: '#000',
          },
          fonts: {
            body: 'Arial',
            heading: 'Arial',
            code: 'monospace',
          },
          spacing: {},
        } as any,
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Theme colors must include background property'
      );
    });
  });

  describe('Search Options Validation', () => {
    it('should accept config without search options', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });

    it('should throw error for non-boolean enabled property', () => {
      const config = {
        ...baseConfig,
        search: {
          enabled: 'yes' as any,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Search enabled property must be a boolean'
      );
    });

    it('should throw error for invalid maxResults', () => {
      const config = {
        ...baseConfig,
        search: {
          enabled: true,
          maxResults: -5,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Search maxResults must be a positive number'
      );
    });
  });

  describe('Navigation Options Validation', () => {
    it('should accept config without navigation options', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });

    it('should throw error for non-boolean navigation properties', () => {
      const config = {
        ...baseConfig,
        navigation: {
          showCategories: 'yes' as any,
          showTags: true,
          collapsible: true,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Navigation showCategories property must be a boolean'
      );
    });

    it('should throw error for invalid sortBy option', () => {
      const config = {
        ...baseConfig,
        navigation: {
          showCategories: true,
          showTags: true,
          collapsible: true,
          sortBy: 'invalid' as any,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Invalid navigation sortBy "invalid"'
      );
    });
  });

  describe('Render Options Validation', () => {
    it('should accept config without render options', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });

    it('should throw error for non-boolean render properties', () => {
      const config = {
        ...baseConfig,
        render: {
          syntaxHighlighting: 'yes' as any,
          copyCodeButton: true,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Render syntaxHighlighting property must be a boolean'
      );
    });

    it('should throw error for invalid linkTarget', () => {
      const config = {
        ...baseConfig,
        render: {
          syntaxHighlighting: true,
          copyCodeButton: true,
          linkTarget: '_parent' as any,
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Invalid render linkTarget "_parent"'
      );
    });
  });

  describe('Routing Validation', () => {
    it('should accept config without routing option', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });

    it('should throw error for invalid routing type', () => {
      const config = {
        ...baseConfig,
        routing: 'invalid' as any,
      };

      expect(() => validateConfig(config)).toThrow(
        'Configuration Error: Invalid routing type "invalid"'
      );
    });

    it('should accept valid routing types', () => {
      const validTypes = ['hash', 'memory', 'none'];

      validTypes.forEach(type => {
        const config = {
          ...baseConfig,
          routing: type as any,
        };

        expect(() => validateConfig(config)).not.toThrow();
      });
    });
  });

  describe('Complete Valid Configuration', () => {
    it('should accept a fully specified valid configuration', () => {
      const completeConfig: DocumentationConfig = {
        container: '#docs',
        source: {
          type: 'github',
          baseUrl: 'https://github.com/user/repo',
          documents: [
            {
              id: 'readme',
              title: 'README',
              file: 'README.md',
              category: 'Getting Started',
              tags: ['intro', 'guide'],
              order: 1,
            },
            {
              id: 'api',
              title: 'API Reference',
              file: 'docs/api.md',
              category: 'Reference',
              tags: ['api', 'reference'],
              order: 2,
            },
          ],
        },
        theme: {
          name: 'custom',
          colors: {
            primary: '#007bff',
            background: '#ffffff',
            text: '#333333',
            textPrimary: '#000000',
          },
          fonts: {
            body: 'Arial, sans-serif',
            heading: 'Georgia, serif',
            code: 'Consolas, monospace',
          },
          spacing: {
            base: 16,
            small: 8,
            medium: 16,
            large: 24,
          },
        },
        search: {
          enabled: true,
          maxResults: 50,
          placeholder: 'Search documentation...',
          hotkey: 'cmd+k',
        },
        navigation: {
          showCategories: true,
          showTags: true,
          collapsible: true,
          sortBy: 'order',
        },
        render: {
          syntaxHighlighting: true,
          copyCodeButton: true,
          linkTarget: '_blank',
        },
        routing: 'hash',
      };

      expect(() => validateConfig(completeConfig)).not.toThrow();
    });
  });
});
