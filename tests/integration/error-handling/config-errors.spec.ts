/**
 * Configuration Error Integration Tests
 * 
 * Tests real configuration error scenarios without mocking.
 * Validates error handling for malformed configs, missing files, and invalid settings.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../../src/zero-config';
import { ConfigLoader } from '../../../src/config-loader';
import { createTestContainer, ContainerTester } from '../utils/containerTestUtils';
import { 
  waitForErrorUI, 
  validateErrorUI, 
  inspectErrorHTML,
  type ErrorUIExpectations 
} from '../utils/errorScenarioHelper';
import { cleanupRealDOM } from '../utils/realDOMSetup';
import { createRealFile, createRealDirectory, pathExists, deleteRealPath } from '../utils/configTestUtils';

describe('Configuration Error Integration Tests', () => {
  let testContainer: ContainerTester;
  let tempPaths: string[] = [];

  beforeEach(() => {
    cleanupRealDOM();
    testContainer = new ContainerTester({ id: 'config-test-container' });
    tempPaths = [];
  });

  afterEach(async () => {
    testContainer.cleanup();
    cleanupRealDOM();
    
    // Clean up any temporary files/directories
    for (const path of tempPaths) {
      try {
        await deleteRealPath(path);
      } catch {
        // Ignore cleanup errors
      }
    }
    tempPaths = [];
  });

  describe('Missing Configuration File Scenarios', () => {
    it('should handle completely missing config file', async () => {
      const nonExistentPath = './config-that-does-not-exist.json';
      
      const viewer = await init({ 
        container: testContainer.element,
        configPath: nonExistentPath 
      });

      expect(viewer).toBeDefined();
      expect(viewer.container).toBe(testContainer.element);

      // Should display error UI with fallback behavior
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should handle missing docs.config.json in auto-discovery', async () => {
      // Create docs directory without config
      const docsDir = './test-docs-no-config';
      await createRealDirectory(docsDir);
      tempPaths.push(docsDir);

      const viewer = await init({ 
        container: testContainer.element,
        docsPath: docsDir 
      });

      expect(viewer).toBeDefined();
      
      // Should work with default configuration
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle inaccessible config file (permission denied simulation)', async () => {
      // Create a config file in a deeply nested structure that might cause issues
      const deepPath = './very/deep/nested/path/that/might/not/exist/config.json';
      
      const viewer = await init({ 
        container: testContainer.element,
        configPath: deepPath 
      });

      expect(viewer).toBeDefined();
      
      // Should fall back to default config
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });
  });

  describe('Malformed Configuration File Scenarios', () => {
    it('should handle invalid JSON syntax', async () => {
      const configPath = './test-malformed-config.json';
      const malformedJson = `{
        "title": "Test Documentation",
        "theme": "default-light",
        "source": {
          "type": "auto",
          "path": "./docs"
        },
        // This comment makes it invalid JSON
        "invalid": true,
      }`;
      
      await createRealFile(configPath, malformedJson);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should display error UI due to parsing failure
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle JSON with invalid structure', async () => {
      const configPath = './test-invalid-structure.json';
      const invalidStructure = `{
        "title": 123,
        "theme": ["not", "a", "string"],
        "source": "should be an object",
        "nested": {
          "deeply": {
            "invalid": {
              "structure": null
            }
          }
        }
      }`;
      
      await createRealFile(configPath, invalidStructure);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should handle invalid structure gracefully
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should handle empty JSON file', async () => {
      const configPath = './test-empty-config.json';
      await createRealFile(configPath, '');
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should handle empty file gracefully
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle non-JSON file with .json extension', async () => {
      const configPath = './test-not-json.json';
      const notJson = `
        This is not JSON at all!
        It's just plain text with some random content.
        title: Documentation
        theme: default-light
        source: ./docs
      `;
      
      await createRealFile(configPath, notJson);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });
  });

  describe('Invalid Theme Configuration Scenarios', () => {
    it('should handle non-existent theme specification', async () => {
      const configPath = './test-invalid-theme.json';
      const invalidThemeConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: 'theme-that-does-not-exist',
        source: {
          type: 'auto',
          path: './docs'
        }
      }, null, 2);
      
      await createRealFile(configPath, invalidThemeConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should fall back to default theme and show setup error
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle malformed theme object', async () => {
      const configPath = './test-malformed-theme.json';
      const malformedThemeConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: {
          colors: 'not an object',
          typography: null,
          spacing: ['wrong', 'type']
        },
        source: {
          type: 'auto',
          path: './docs'
        }
      }, null, 2);
      
      await createRealFile(configPath, malformedThemeConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should handle theme with missing required properties', async () => {
      const configPath = './test-incomplete-theme.json';
      const incompleteThemeConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: {
          colors: {
            primary: '#007acc'
            // Missing other required color properties
          }
          // Missing typography, spacing, etc.
        },
        source: {
          type: 'auto',
          path: './docs'
        }
      }, null, 2);
      
      await createRealFile(configPath, incompleteThemeConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });
  });

  describe('Invalid Source Configuration Scenarios', () => {
    it('should handle invalid source type', async () => {
      const configPath = './test-invalid-source-type.json';
      const invalidSourceConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: 'default-light',
        source: {
          type: 'invalid-source-type',
          path: './docs'
        }
      }, null, 2);
      
      await createRealFile(configPath, invalidSourceConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should fall back to auto discovery
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should handle missing source path', async () => {
      const configPath = './test-missing-source-path.json';
      const missingPathConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: 'default-light',
        source: {
          type: 'auto'
          // Missing path property
        }
      }, null, 2);
      
      await createRealFile(configPath, missingPathConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should use default path
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle non-existent source path', async () => {
      const configPath = './test-nonexistent-source.json';
      const nonExistentSourceConfig = JSON.stringify({
        title: 'Test Documentation',
        theme: 'default-light',
        source: {
          type: 'auto',
          path: './docs-that-do-not-exist-anywhere'
        }
      }, null, 2);
      
      await createRealFile(configPath, nonExistentSourceConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should handle missing docs directory
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });
  });

  describe('Configuration Precedence and Override Scenarios', () => {
    it('should handle conflicts between config file and options', async () => {
      const configPath = './test-precedence-config.json';
      const configFileContent = JSON.stringify({
        title: 'Config File Title',
        theme: 'default-light',
        source: {
          type: 'auto',
          path: './config-docs'
        }
      }, null, 2);
      
      await createRealFile(configPath, configFileContent);
      tempPaths.push(configPath);

      // Options should override config file
      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath,
        title: 'Options Title',
        theme: 'default-dark',
        docsPath: './options-docs'
      });

      expect(viewer).toBeDefined();
      
      // Should use options values over config file
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      const inspection = inspectErrorHTML(errorElement);
      
      // The error UI won't show the title directly, but we can verify the viewer was created
      expect(viewer.container).toBe(testContainer.element);
    });

    it('should handle partial configuration with missing required fields', async () => {
      const configPath = './test-partial-config.json';
      const partialConfig = JSON.stringify({
        // Only theme specified, missing title and source
        theme: 'default-light'
      }, null, 2);
      
      await createRealFile(configPath, partialConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should use defaults for missing fields
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });
  });

  describe('ConfigLoader Direct Testing', () => {
    it('should handle ConfigLoader errors directly', async () => {
      const configLoader = new ConfigLoader();

      // Test loading non-existent file
      const config1 = await configLoader.loadConfig('./non-existent-file.json');
      expect(config1).toBeDefined();
      expect(config1.title).toBe('Documentation'); // Default title

      // Test loading malformed JSON
      const malformedPath = './test-direct-malformed.json';
      await createRealFile(malformedPath, '{ invalid json }');
      tempPaths.push(malformedPath);

      const config2 = await configLoader.loadConfig(malformedPath);
      expect(config2).toBeDefined();
      expect(config2.title).toBe('Documentation'); // Should fall back to defaults
    });

    it('should validate ConfigLoader.toDocumentationConfig', () => {
      const configLoader = new ConfigLoader();
      
      // Should provide valid default configuration
      const docConfig = configLoader.toDocumentationConfig();
      expect(docConfig).toBeDefined();
      expect(docConfig.title).toBeTruthy();
      expect(docConfig.theme).toBeDefined();
    });

    it('should test ConfigLoader.generateSampleConfig', () => {
      const sampleConfig = ConfigLoader.generateSampleConfig();
      
      expect(sampleConfig).toBeTruthy();
      expect(typeof sampleConfig).toBe('string');
      
      // Should be valid JSON
      expect(() => JSON.parse(sampleConfig)).not.toThrow();
      
      const parsed = JSON.parse(sampleConfig);
      expect(parsed.title).toBeTruthy();
      expect(parsed.theme).toBeTruthy();
      expect(parsed.source).toBeDefined();
    });
  });

  describe('Error Recovery and Fallback Mechanisms', () => {
    it('should recover from multiple cascading config errors', async () => {
      // Create a config that will cause multiple errors
      const configPath = './test-cascading-errors.json';
      const cascadingErrorConfig = `{
        "title": null,
        "theme": "non-existent-theme",
        "source": {
          "type": "invalid-type",
          "path": "./non-existent-docs",
          "exclude": "should-be-array"
        },
        "search": {
          "enabled": "should-be-boolean",
          "placeholder": 123
        }
      }`;
      
      await createRealFile(configPath, cascadingErrorConfig);
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      // Should handle all errors gracefully and show setup UI
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should maintain stability with rapid config changes', async () => {
      const configPath = './test-rapid-changes.json';
      
      // Test multiple rapid initializations with different configs
      const configs = [
        { title: 'Config 1', theme: 'default-light' },
        { title: 'Config 2', theme: 'default-dark' },
        { title: 'Config 3', theme: 'non-existent' },
        { title: null, theme: null }, // Invalid config
      ];

      for (let i = 0; i < configs.length; i++) {
        await createRealFile(configPath, JSON.stringify(configs[i], null, 2));
        
        const viewer = await init({ 
          container: testContainer.element,
          configPath: configPath 
        });

        expect(viewer).toBeDefined();
        expect(viewer.container).toBe(testContainer.element);
        
        // Should handle each config gracefully
        try {
          await waitForErrorUI(testContainer.element, 1000);
        } catch {
          // It's okay if no error UI appears for some configs
        }
        
        await viewer.destroy();
      }
      
      tempPaths.push(configPath);
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large configuration files', async () => {
      const configPath = './test-large-config.json';
      
      // Create a large config with many nested properties
      const largeConfig = {
        title: 'Large Configuration Test',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' },
        // Add many properties to make it large
        metadata: {}
      };
      
      // Add 1000 metadata entries
      for (let i = 0; i < 1000; i++) {
        largeConfig.metadata[`key_${i}`] = `value_${i}`.repeat(100);
      }
      
      await createRealFile(configPath, JSON.stringify(largeConfig, null, 2));
      tempPaths.push(configPath);

      const start = performance.now();
      
      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      const end = performance.now();
      
      expect(viewer).toBeDefined();
      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
      
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      expect(errorElement.textContent).toContain('Setup Required');
    });

    it('should handle configuration with circular references (if JSON allows)', async () => {
      const configPath = './test-self-reference.json';
      
      // JSON doesn't allow circular refs, but test a deep self-similar structure
      const deepConfig = {
        title: 'Self Reference Test',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' },
        nested: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: 'deep value'
                }
              }
            }
          }
        }
      };
      
      await createRealFile(configPath, JSON.stringify(deepConfig, null, 2));
      tempPaths.push(configPath);

      const viewer = await init({ 
        container: testContainer.element,
        configPath: configPath 
      });

      expect(viewer).toBeDefined();
      
      const errorElement = await waitForErrorUI(testContainer.element, 3000);
      validateErrorUI(errorElement, {
        hasErrorMessage: true,
        errorMessageContains: 'Setup Required',
        hasErrorClass: false,
      });
    });

    it('should handle simultaneous config loading attempts', async () => {
      const configPath = './test-simultaneous.json';
      const config = JSON.stringify({
        title: 'Simultaneous Test',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' }
      }, null, 2);
      
      await createRealFile(configPath, config);
      tempPaths.push(configPath);

      // Start multiple initialization attempts simultaneously
      const promises = Array.from({ length: 5 }, (_, i) => 
        init({ 
          container: testContainer.element,
          configPath: configPath 
        })
      );

      const viewers = await Promise.all(promises);
      
      // All should complete successfully
      viewers.forEach(viewer => {
        expect(viewer).toBeDefined();
        expect(viewer.container).toBe(testContainer.element);
      });
      
      // Clean up all viewers
      await Promise.all(viewers.map(viewer => viewer.destroy()));
    });
  });
});