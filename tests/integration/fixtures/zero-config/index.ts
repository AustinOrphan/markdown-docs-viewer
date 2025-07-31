/**
 * Zero-Config Integration Test Fixtures
 *
 * Centralized exports for all zero-config integration test fixtures.
 */

export * from './test-configs';
export * from './test-documents';

/**
 * Re-export commonly used types and utilities
 */
export type { TestConfigFile, ZeroConfigTestOptions } from './test-configs';
export type { TestDocument } from './test-documents';

/**
 * Quick access to common test data
 */
export {
  validConfigs,
  invalidConfigs,
  testScenarios,
  errorScenarios,
  containerConfigs,
  themeTestConfigs
} from './test-configs';

export {
  basicTestDocuments,
  specialTestDocuments,
  allTestDocuments,
  testDirectoryStructures,
  searchTestData,
  createVirtualFileSystem
} from './test-documents';