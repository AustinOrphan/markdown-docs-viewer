/**
 * Zero-Config Integration Test Configurations
 *
 * Test configuration files and data for zero-config integration testing.
 */

export interface TestConfigFile {
  filename: string;
  content: string;
  description: string;
  isValid: boolean;
}

/**
 * Valid configuration files for testing
 */
export const validConfigs: TestConfigFile[] = [
  {
    filename: 'basic-config.json',
    content: JSON.stringify(
      {
        title: 'Basic Test Documentation',
        theme: 'github-light',
        source: {
          type: 'auto',
          path: './docs',
        },
      },
      null,
      2
    ),
    description: 'Basic valid configuration',
    isValid: true,
  },
  {
    filename: 'complete-config.json',
    content: JSON.stringify(
      {
        title: 'Complete Test Documentation',
        theme: 'github-dark',
        source: {
          type: 'auto',
          path: './docs',
          exclude: ['**/drafts/**', '**/_*'],
          include: ['**/*.md', '**/*.markdown'],
        },
        navigation: {
          autoSort: true,
          collapsible: true,
        },
        search: {
          enabled: true,
          placeholder: 'Search documentation...',
        },
        features: {
          tableOfContents: true,
          codeHighlighting: true,
          darkMode: true,
        },
      },
      null,
      2
    ),
    description: 'Complete configuration with all options',
    isValid: true,
  },
  {
    filename: 'minimal-config.json',
    content: JSON.stringify(
      {
        title: 'Minimal Documentation',
      },
      null,
      2
    ),
    description: 'Minimal configuration with just title',
    isValid: true,
  },
];

/**
 * Invalid configuration files for error testing
 */
export const invalidConfigs: TestConfigFile[] = [
  {
    filename: 'malformed.json',
    content: '{ "title": "Malformed Config", "theme": "github-light" // missing closing brace',
    description: 'Malformed JSON syntax',
    isValid: false,
  },
  {
    filename: 'empty.json',
    content: '',
    description: 'Empty configuration file',
    isValid: false,
  },
  {
    filename: 'invalid-json.json',
    content: 'not json at all',
    description: 'Non-JSON content',
    isValid: false,
  },
  {
    filename: 'wrong-structure.json',
    content: JSON.stringify(
      {
        wrongField: 'value',
        anotherWrongField: 123,
      },
      null,
      2
    ),
    description: 'Valid JSON but wrong structure',
    isValid: false,
  },
];

/**
 * All test configurations combined
 */
export const allTestConfigs: TestConfigFile[] = [...validConfigs, ...invalidConfigs];

/**
 * Helper to get configuration by filename
 */
export function getConfigByFilename(filename: string): TestConfigFile | undefined {
  return allTestConfigs.find(config => config.filename === filename);
}

/**
 * Helper to create temporary config file in memory
 */
export function createTempConfigFile(config: TestConfigFile): Blob {
  return new Blob([config.content], { type: 'application/json' });
}

/**
 * Zero-config initialization options for testing
 */
export interface ZeroConfigTestOptions {
  container?: string | HTMLElement;
  configPath?: string;
  docsPath?: string;
  theme?: string;
  title?: string;
}

/**
 * Test scenarios for zero-config initialization
 */
export const testScenarios = {
  defaultInit: {
    description: 'Default initialization with no options',
    options: {},
  },
  customContainer: {
    description: 'Initialization with custom container',
    options: { container: '#custom-container' },
  },
  customTheme: {
    description: 'Initialization with custom theme',
    options: { theme: 'github-dark' },
  },
  customTitle: {
    description: 'Initialization with custom title',
    options: { title: 'Custom Test Title' },
  },
  customDocsPath: {
    description: 'Initialization with custom docs path',
    options: { docsPath: './custom-docs' },
  },
  allOptions: {
    description: 'Initialization with all options',
    options: {
      container: '#test-container',
      configPath: './test-config.json',
      docsPath: './test-docs',
      theme: 'github-light',
      title: 'Full Test Documentation',
    },
  },
} as const;

/**
 * Expected error scenarios
 */
export const errorScenarios = {
  containerNotFound: {
    description: 'Container element not found',
    options: { container: '#non-existent-container' },
    expectedError: 'not found',
  },
  invalidConfigPath: {
    description: 'Invalid configuration file path',
    options: { configPath: './non-existent-config.json' },
    expectedError: 'Failed to load configuration',
  },
  invalidDocsPath: {
    description: 'Invalid documents path',
    options: { docsPath: './non-existent-docs' },
    expectedError: 'Failed to discover documents',
  },
  invalidTheme: {
    description: 'Invalid theme name',
    options: { theme: 'non-existent-theme' },
    expectedError: 'Theme "non-existent-theme" not found',
  },
} as const;

/**
 * Container test configurations
 */
export const containerConfigs = {
  byId: {
    id: 'docs',
    attributes: {},
    expectedSelector: '#docs',
  },
  byClass: {
    id: 'test-docs',
    attributes: { class: 'docs' },
    expectedSelector: '.docs',
  },
  byDataAttribute: {
    id: 'test-documentation',
    attributes: { 'data-docs': 'true', class: 'documentation' },
    expectedSelector: '.documentation',
  },
  custom: {
    id: 'custom-container',
    attributes: { class: 'custom-docs-viewer' },
    expectedSelector: '#custom-container',
  },
} as const;

/**
 * Theme test configurations
 */
export const themeTestConfigs = {
  light: {
    theme: 'github-light',
    expectedMode: 'light',
    description: 'Light theme configuration',
  },
  dark: {
    theme: 'github-dark',
    expectedMode: 'dark',
    description: 'Dark theme configuration',
  },
  defaultLight: {
    theme: 'default-light',
    expectedMode: 'light',
    description: 'Default light theme',
  },
  defaultDark: {
    theme: 'default-dark',
    expectedMode: 'dark',
    description: 'Default dark theme',
  },
  invalid: {
    theme: 'non-existent-theme',
    expectedMode: 'light', // Should fall back to light
    description: 'Invalid theme should fallback',
  },
} as const;
