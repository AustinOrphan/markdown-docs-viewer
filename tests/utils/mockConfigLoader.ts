/**
 * Mock utilities for ConfigLoader class
 * Provides targeted mocking without global vi.mock() to prevent circular dependencies
 * Supports async operations and various config scenarios (success, error, empty)
 */

import { vi } from 'vitest';
import type { DocsConfig } from '../../src/config-loader';
import type { DocumentationConfig } from '../../src/types';
import { themes } from '../../src/themes';

// Import test fixtures for consistent config objects
import {
  validConfig,
  invalidConfig,
  minimalConfig,
  emptyConfig,
  themeVariantsConfig,
} from '../fixtures/configs';

// ==========================================
// CORE MOCK UTILITIES (As requested by Agent C)
// ==========================================

/**
 * Mock config loader that returns valid config - handles async operations properly
 */
export function mockConfigLoaderSuccess(config: DocsConfig = validConfig as DocsConfig): any {
  return {
    loadConfig: vi.fn().mockResolvedValue(config),
    toDocumentationConfig: vi.fn().mockReturnValue(createDocumentationConfigFromDocsConfig(config)),
    getConfig: vi.fn().mockReturnValue(config),
    getConfigPath: vi.fn().mockReturnValue('./docs.config.json'),
  };
}

/**
 * Mock config loader that simulates config loading errors - handles async operations properly
 */
export function mockConfigLoaderError(error: Error = new Error('Failed to load config')): any {
  return {
    loadConfig: vi.fn().mockRejectedValue(error),
    toDocumentationConfig: vi.fn().mockReturnValue(createDocumentationConfigFromDocsConfig(DEFAULT_TEST_CONFIG)),
    getConfig: vi.fn().mockReturnValue(DEFAULT_TEST_CONFIG),
    getConfigPath: vi.fn().mockReturnValue(undefined),
  };
}

/**
 * Mock config loader that returns empty/default config - handles async operations properly
 */
export function mockConfigLoaderEmpty(): any {
  const emptyConfigData = emptyConfig as DocsConfig;
  return {
    loadConfig: vi.fn().mockResolvedValue(emptyConfigData),
    toDocumentationConfig: vi.fn().mockReturnValue(createDocumentationConfigFromDocsConfig(emptyConfigData)),
    getConfig: vi.fn().mockReturnValue(emptyConfigData),
    getConfigPath: vi.fn().mockReturnValue(undefined),
  };
}

/**
 * Factory with options for creating mock config loaders - supports various config scenarios
 */
export interface MockConfigLoaderOptions {
  config?: DocsConfig;
  loadError?: Error;
  configPath?: string;
  documentationConfig?: Partial<DocumentationConfig>;
}

export function createMockConfigLoader(options: MockConfigLoaderOptions = {}): any {
  const {
    config = validConfig as DocsConfig,
    loadError,
    configPath = './docs.config.json',
    documentationConfig,
  } = options;

  const loadConfigImpl = loadError
    ? vi.fn().mockRejectedValue(loadError)
    : vi.fn().mockResolvedValue(config);

  const docConfig = documentationConfig 
    ? { ...createDocumentationConfigFromDocsConfig(config), ...documentationConfig }
    : createDocumentationConfigFromDocsConfig(config);

  return {
    loadConfig: loadConfigImpl,
    toDocumentationConfig: vi.fn().mockReturnValue(docConfig),
    getConfig: vi.fn().mockReturnValue(config),
    getConfigPath: vi.fn().mockReturnValue(loadError ? undefined : configPath),
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Converts DocsConfig to DocumentationConfig (mirrors actual ConfigLoader logic)
 */
function createDocumentationConfigFromDocsConfig(config: DocsConfig): Partial<DocumentationConfig> {
  return {
    title: config.title || 'Documentation',
    source: {
      type: config.source?.type === 'auto' ? 'local' : (config.source?.type as any) || 'local',
      basePath: config.source?.path || './docs',
      documents: [],
    },
    theme: parseThemeString(config.theme || 'default-light'),
    navigation: {
      showCategories: config.navigation?.showCategories ?? true,
      collapsible: config.navigation?.collapsible ?? true,
      showTags: config.navigation?.showTags ?? false,
      showDescription: config.navigation?.showDescription ?? true,
      sortBy: config.navigation?.autoSort ? 'order' : 'title',
    },
    search: {
      enabled: config.search?.enabled ?? true,
      placeholder: config.search?.placeholder || 'Search documentation...',
      fuzzySearch: config.search?.fuzzySearch ?? true,
      caseSensitive: config.search?.caseSensitive ?? false,
    },
    performance: {
      lazyLoading: {
        enabled: config.performance?.lazyLoading ?? true,
      },
      cacheSize: config.performance?.cacheSize ?? 50,
      preloadStrategy: config.performance?.prefetchNext ? 'adjacent' : 'none',
    },
  };
}

/**
 * Parses theme string to theme object (mirrors zero-config.ts logic)
 */
function parseThemeString(themeString: string): any {
  if (!themeString || !themeString.includes('-')) {
    return themes.default?.light || themes.default;
  }

  const [themeName, mode] = themeString.split('-');
  const themeFamily = themes[themeName as keyof typeof themes];
  
  if (!themeFamily) {
    return themes.default?.light || themes.default;
  }

  if (typeof themeFamily === 'object' && 'light' in themeFamily) {
    return themeFamily[mode as 'light' | 'dark'] || themeFamily.light;
  }

  return themeFamily;
}

/**
 * Default test config for successful scenarios
 */
export const DEFAULT_TEST_CONFIG: DocsConfig = {
  title: 'Test Docs',
  theme: 'default-light',
  source: {
    type: 'auto',
    path: './docs',
    exclude: ['**/node_modules/**', '**/.*'],
  },
  navigation: {
    autoSort: true,
    showCategories: true,
    collapsible: true,
    showTags: false,
    showDescription: true,
  },
  search: {
    enabled: true,
    placeholder: 'Search documentation...',
    fuzzySearch: true,
    caseSensitive: false,
  },
  features: {
    tableOfContents: true,
    codeHighlighting: true,
    darkMode: true,
    print: true,
    export: false,
  },
  performance: {
    lazyLoading: true,
    cacheSize: 50,
    prefetchNext: true,
  },
};



/**
 * Helper to mock ConfigLoader methods on the prototype
 * Following Agent A's strategy for targeted prototype spying
 */
export function mockConfigLoaderMethods(methods: Record<string, any> = {}) {
  const { ConfigLoader } = require('../../src/config-loader');

  Object.entries(methods).forEach(([method, implementation]) => {
    vi.spyOn(ConfigLoader.prototype, method).mockImplementation(implementation);
  });
}

/**
 * Helper to mock static ConfigLoader methods
 */
export function mockConfigLoaderStatic(methods: Record<string, any> = {}) {
  const { ConfigLoader } = require('../../src/config-loader');

  Object.entries(methods).forEach(([method, implementation]) => {
    vi.spyOn(ConfigLoader, method).mockImplementation(implementation);
  });
}

/**
 * Scenario builder for config error testing
 */
export function setupConfigErrorScenario(errorType: 'load' | 'parse' | 'validation' = 'load') {
  const errors = {
    load: new Error('Failed to load config file'),
    parse: new Error('Invalid JSON in config file'),
    validation: new Error('Config validation failed'),
  };

  mockConfigLoaderMethods({
    loadConfig: vi.fn().mockRejectedValue(errors[errorType]),
  });
}

/**
 * Scenario builder for successful config loading with specific themes
 */
export function setupConfigWithTheme(themeName: string) {
  const config = {
    ...DEFAULT_TEST_CONFIG,
    theme: themeName,
  };

  mockConfigLoaderMethods({
    loadConfig: vi.fn().mockResolvedValue(config),
    toDocumentationConfig: vi.fn().mockReturnValue({
      title: config.title,
      theme: themeName.includes('-')
        ? themes[themeName.split('-')[0]]?.[themeName.split('-')[1]]
        : themes[themeName]?.light,
    }),
  });
}

/**
 * Configuration factory for test fixtures
 */
export function createTestConfig(overrides: Partial<DocsConfig> = {}): DocsConfig {
  return { ...DEFAULT_TEST_CONFIG, ...overrides };
}

/**
 * Creates a default documentation config for testing
 */
export function createTestDocumentationConfig(overrides: Partial<DocumentationConfig> = {}): DocumentationConfig {
  return {
    container: document.createElement('div'),
    title: 'Test Documentation',
    theme: themes.default.light,
    source: {
      type: 'content',
      documents: [],
    },
    ...overrides,
  };
}

/**
 * Sets up ConfigLoader constructor mock with comprehensive options
 * This uses the same pattern as the original test file to avoid vi.mocked() issues
 */
export function setupConfigLoaderMock(overrides: Partial<DocsConfig> = {}) {
  const mockInstance = createMockConfigLoader(overrides);
  
  return mockInstance;
}

/**
 * Utility to mock config loading with specific options
 */
export interface ConfigMockOptions {
  config?: DocsConfig;
  documentationConfig?: DocumentationConfig;
  loadError?: Error;
  generateSampleConfig?: string;
}

/**
 * Sets up comprehensive config loader mock with options
 */
export function setupConfigMock(options: ConfigMockOptions = {}) {
  const {
    config = DEFAULT_TEST_CONFIG,
    documentationConfig = createTestDocumentationConfig(),
    loadError,
    generateSampleConfig = 'sample config',
  } = options;

  const loadConfigMock = loadError
    ? vi.fn().mockRejectedValue(loadError)
    : vi.fn().mockResolvedValue(config);

  const mockInstance = {
    loadConfig: loadConfigMock,
    toDocumentationConfig: vi.fn().mockReturnValue(documentationConfig),
    getConfig: vi.fn().mockReturnValue(config),
    getConfigPath: vi.fn().mockReturnValue(undefined),
    generateSampleConfig: vi.fn().mockReturnValue(generateSampleConfig),
  };

  return {
    mockInstance,
    loadConfigMock,
    config,
    documentationConfig,
  };
}

// ==========================================
// FIXTURE-BASED UTILITIES
// ==========================================

/**
 * Create mock config loader using test fixtures
 */
export function createMockConfigLoaderFromFixture(
  fixtureName: 'valid' | 'invalid' | 'minimal' | 'empty' | 'themeVariants',
  options: { loadError?: Error; configPath?: string } = {}
): any {
  const fixtureMap = {
    valid: validConfig as DocsConfig,
    invalid: invalidConfig as DocsConfig,
    minimal: minimalConfig as DocsConfig,
    empty: emptyConfig as DocsConfig,
    themeVariants: themeVariantsConfig as DocsConfig,
  };

  const config = fixtureMap[fixtureName];
  return createMockConfigLoader({
    config,
    loadError: options.loadError,
    configPath: options.configPath,
  });
}

/**
 * Scenario-specific mock creators for common test cases
 */
export const configMockScenarios = {
  success: () => mockConfigLoaderSuccess(),
  error: (error?: Error) => mockConfigLoaderError(error),
  empty: () => mockConfigLoaderEmpty(),
  
  // Fixture-based scenarios
  validConfig: () => createMockConfigLoaderFromFixture('valid'),
  invalidConfig: () => createMockConfigLoaderFromFixture('invalid'),
  minimalConfig: () => createMockConfigLoaderFromFixture('minimal'),
  emptyConfig: () => createMockConfigLoaderFromFixture('empty'),
  themeVariantsConfig: () => createMockConfigLoaderFromFixture('themeVariants'),
  
  // Error scenarios with specific fixtures
  validConfigLoadError: (error?: Error) => createMockConfigLoaderFromFixture('valid', { loadError: error }),
  minimalConfigLoadError: (error?: Error) => createMockConfigLoaderFromFixture('minimal', { loadError: error }),
  
  // Theme-specific scenarios
  githubDarkTheme: () => mockConfigLoaderSuccess({ ...validConfig, theme: 'github-dark' } as DocsConfig),
  materialLightTheme: () => mockConfigLoaderSuccess({ ...validConfig, theme: 'material-light' } as DocsConfig),
  invalidTheme: () => mockConfigLoaderSuccess({ ...validConfig, theme: 'nonexistent-theme' } as DocsConfig),
};

// ==========================================
// MIGRATION HELPERS (for updating existing tests)
// ==========================================

/**
 * Legacy support for existing test patterns
 * @deprecated Use the new core utilities instead
 */
export function createMockConfigLoaderWithError(error: Error): any {
  console.warn('createMockConfigLoaderWithError is deprecated. Use mockConfigLoaderError() instead.');
  return mockConfigLoaderError(error);
}
