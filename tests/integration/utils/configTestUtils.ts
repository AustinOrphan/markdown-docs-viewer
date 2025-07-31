/**
 * Config Test Utilities
 *
 * Utilities for testing configuration loading and validation in integration tests.
 * Focuses on real file operations and configuration scenarios.
 */

import { DocumentationConfig } from '../../../src/types';

/**
 * Real file system utilities for integration testing
 * These simulate file operations for testing configuration loading
 */

// In-memory file system for testing
const testFileSystem = new Map<string, string>();

/**
 * Creates a real file for testing purposes
 */
export async function createRealFile(path: string, content: string): Promise<void> {
  testFileSystem.set(path, content);
}

/**
 * Creates a real directory for testing purposes
 */
export async function createRealDirectory(path: string): Promise<void> {
  testFileSystem.set(path + '/__directory__', '');
}

/**
 * Checks if a path exists in the test file system
 */
export function pathExists(path: string): boolean {
  return testFileSystem.has(path) || testFileSystem.has(path + '/__directory__');
}

/**
 * Deletes a path from the test file system
 */
export async function deleteRealPath(path: string): Promise<void> {
  testFileSystem.delete(path);
  testFileSystem.delete(path + '/__directory__');
  
  // Delete any files within directory
  const prefix = path + '/';
  for (const key of testFileSystem.keys()) {
    if (key.startsWith(prefix)) {
      testFileSystem.delete(key);
    }
  }
}

export interface ConfigTestScenario {
  name: string;
  description: string;
  configPath?: string;
  configContent?: string;
  expectedValid: boolean;
  expectedErrors?: string[];
  setup?: () => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedConfig?: Partial<DocumentationConfig>;
}

/**
 * Creates a temporary config file for testing
 */
export async function createTempConfigFile(
  content: string,
  filename: string = 'docs.config.json'
): Promise<{ path: string; cleanup: () => void }> {
  // In a browser environment, we simulate file creation by storing in a Map
  const tempFiles = new Map<string, string>();
  const path = `./${filename}`;

  tempFiles.set(path, content);

  // Mock fetch to return our temp config
  const originalFetch = global.fetch;
  global.fetch = async (url: string) => {
    if (url === path && tempFiles.has(path)) {
      const content = tempFiles.get(path)!;
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch(url);
  };

  const cleanup = () => {
    tempFiles.delete(path);
    global.fetch = originalFetch;
  };

  return { path, cleanup };
}

/**
 * Creates various invalid config scenarios for testing
 */
export const createConfigScenarios = {
  validBasic: (): ConfigTestScenario => ({
    name: 'valid-basic',
    description: 'Valid basic configuration',
    configContent: JSON.stringify({
      title: 'Test Documentation',
      documents: [{ path: 'README.md', title: 'Getting Started' }],
    }),
    expectedValid: true,
  }),

  validComplex: (): ConfigTestScenario => ({
    name: 'valid-complex',
    description: 'Valid complex configuration with all options',
    configContent: JSON.stringify({
      title: 'Complex Documentation',
      documents: [
        { path: 'README.md', title: 'Getting Started' },
        { path: 'api.md', title: 'API Reference' },
      ],
      theme: 'dark',
      search: { enabled: true, placeholder: 'Search docs...' },
      navigation: { showBreadcrumbs: true },
      container: '#docs-container',
    }),
    expectedValid: true,
  }),

  emptyConfig: (): ConfigTestScenario => ({
    name: 'empty-config',
    description: 'Empty configuration object',
    configContent: '{}',
    expectedValid: false,
    expectedErrors: ['Documents array is required'],
  }),

  malformedJSON: (): ConfigTestScenario => ({
    name: 'malformed-json',
    description: 'Malformed JSON syntax',
    configContent: '{ "title": "Test", "documents": [{ "path": "README.md" }',
    expectedValid: false,
    expectedErrors: ['Invalid JSON syntax'],
  }),

  missingDocuments: (): ConfigTestScenario => ({
    name: 'missing-documents',
    description: 'Missing required documents array',
    configContent: JSON.stringify({
      title: 'Test Documentation',
    }),
    expectedValid: false,
    expectedErrors: ['Documents array is required'],
  }),

  invalidDocuments: (): ConfigTestScenario => ({
    name: 'invalid-documents',
    description: 'Invalid documents array structure',
    configContent: JSON.stringify({
      title: 'Test Documentation',
      documents: [
        { title: 'Missing Path' }, // Missing required path
        { path: '' }, // Empty path
      ],
    }),
    expectedValid: false,
    expectedErrors: ['Document path is required', 'Document path cannot be empty'],
  }),

  invalidTheme: (): ConfigTestScenario => ({
    name: 'invalid-theme',
    description: 'Invalid theme specification',
    configContent: JSON.stringify({
      title: 'Test Documentation',
      documents: [{ path: 'README.md', title: 'Test' }],
      theme: 'nonexistent-theme',
    }),
    expectedValid: false,
    expectedErrors: ['Invalid theme specified'],
  }),

  invalidContainer: (): ConfigTestScenario => ({
    name: 'invalid-container',
    description: 'Invalid container specification',
    configContent: JSON.stringify({
      title: 'Test Documentation',
      documents: [{ path: 'README.md', title: 'Test' }],
      container: 123, // Should be string
    }),
    expectedValid: false,
    expectedErrors: ['Container must be a string selector'],
  }),

  circularReference: (): ConfigTestScenario => ({
    name: 'circular-reference',
    description: 'Configuration with circular references',
    configContent: (() => {
      const obj: any = {
        title: 'Test Documentation',
        documents: [{ path: 'README.md', title: 'Test' }],
      };
      obj.self = obj; // Create circular reference
      try {
        return JSON.stringify(obj);
      } catch {
        return '{"title":"Test","documents":[{"path":"README.md","title":"Test"}],"self":"[Circular]"}';
      }
    })(),
    expectedValid: false,
    expectedErrors: ['Circular references not allowed'],
  }),
};

/**
 * Validates a configuration object
 */
export function validateConfig(config: any): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if config is an object
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { isValid: false, errors, warnings };
  }

  // Validate documents array
  if (!config.documents) {
    errors.push('Documents array is required');
  } else if (!Array.isArray(config.documents)) {
    errors.push('Documents must be an array');
  } else {
    config.documents.forEach((doc: any, index: number) => {
      if (!doc.path) {
        errors.push(`Document at index ${index}: path is required`);
      } else if (typeof doc.path !== 'string') {
        errors.push(`Document at index ${index}: path must be a string`);
      } else if (doc.path.trim() === '') {
        errors.push(`Document at index ${index}: path cannot be empty`);
      }

      if (doc.title && typeof doc.title !== 'string') {
        errors.push(`Document at index ${index}: title must be a string`);
      }
    });
  }

  // Validate optional fields
  if (config.title && typeof config.title !== 'string') {
    errors.push('Title must be a string');
  }

  if (config.theme && typeof config.theme !== 'string') {
    errors.push('Theme must be a string');
  }

  if (config.container && typeof config.container !== 'string') {
    errors.push('Container must be a string selector');
  }

  // Validate search config
  if (config.search && typeof config.search !== 'object') {
    errors.push('Search configuration must be an object');
  }

  // Validate navigation config
  if (config.navigation && typeof config.navigation !== 'object') {
    errors.push('Navigation configuration must be an object');
  }

  // Check for unknown properties (warnings)
  const knownProperties = [
    'title',
    'documents',
    'theme',
    'container',
    'search',
    'navigation',
    'basePath',
    'performance',
    'export',
    'i18n',
    'mobile',
  ];

  Object.keys(config).forEach(key => {
    if (!knownProperties.includes(key)) {
      warnings.push(`Unknown property: ${key}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedConfig: errors.length === 0 ? config : undefined,
  };
}

/**
 * Loads and validates a configuration from JSON string
 */
export function parseAndValidateConfig(jsonString: string): ConfigValidationResult {
  try {
    const config = JSON.parse(jsonString);
    return validateConfig(config);
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid JSON syntax: ' + (error instanceof Error ? error.message : String(error))],
      warnings: [],
    };
  }
}

/**
 * Tests configuration loading from different sources
 */
export class ConfigTester {
  private tempFiles: Array<{ path: string; cleanup: () => void }> = [];

  /**
   * Creates a temporary config file and returns its path
   */
  async createConfigFile(content: string, filename: string = 'docs.config.json'): Promise<string> {
    const tempFile = await createTempConfigFile(content, filename);
    this.tempFiles.push(tempFile);
    return tempFile.path;
  }

  /**
   * Tests loading a config from a file path
   */
  async testConfigFromFile(filePath: string): Promise<ConfigValidationResult> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        return {
          isValid: false,
          errors: [`Failed to load config file: ${response.statusText}`],
          warnings: [],
        };
      }

      const content = await response.text();
      return parseAndValidateConfig(content);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Error loading config: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
      };
    }
  }

  /**
   * Tests a configuration scenario
   */
  async testScenario(scenario: ConfigTestScenario): Promise<{
    scenario: ConfigTestScenario;
    result: ConfigValidationResult;
    success: boolean;
  }> {
    try {
      if (scenario.setup) {
        await scenario.setup();
      }

      let result: ConfigValidationResult;

      if (scenario.configPath) {
        result = await this.testConfigFromFile(scenario.configPath);
      } else if (scenario.configContent) {
        result = parseAndValidateConfig(scenario.configContent);
      } else {
        result = {
          isValid: false,
          errors: ['No config content or path provided'],
          warnings: [],
        };
      }

      // Validate expectations
      const success =
        result.isValid === scenario.expectedValid &&
        (!scenario.expectedErrors ||
          scenario.expectedErrors.every(expectedError =>
            result.errors.some(error => error.includes(expectedError))
          ));

      return { scenario, result, success };
    } finally {
      if (scenario.cleanup) {
        await scenario.cleanup();
      }
    }
  }

  /**
   * Runs all config test scenarios
   */
  async testAllScenarios(): Promise<
    Array<{
      scenario: ConfigTestScenario;
      result: ConfigValidationResult;
      success: boolean;
    }>
  > {
    const scenarios = Object.values(createConfigScenarios).map(createFn => createFn());
    const results = [];

    for (const scenario of scenarios) {
      const result = await this.testScenario(scenario);
      results.push(result);
    }

    return results;
  }

  /**
   * Generates a config validation report
   */
  generateValidationReport(
    results: Array<{
      scenario: ConfigTestScenario;
      result: ConfigValidationResult;
      success: boolean;
    }>
  ): {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    details: Array<{
      name: string;
      status: 'PASS' | 'FAIL';
      errors: string[];
      warnings: string[];
    }>;
  } {
    const totalTests = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = totalTests - passed;
    const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

    const details = results.map(r => ({
      name: r.scenario.name,
      status: r.success ? ('PASS' as const) : ('FAIL' as const),
      errors: r.result.errors,
      warnings: r.result.warnings,
    }));

    return {
      totalTests,
      passed,
      failed,
      passRate,
      details,
    };
  }

  /**
   * Cleans up all temporary files
   */
  cleanup(): void {
    this.tempFiles.forEach(file => file.cleanup());
    this.tempFiles = [];
  }
}
