/**
 * Integration Test Utils
 *
 * This module exports all integration testing utilities for easy import.
 * Provides a comprehensive suite of tools for real-world testing without heavy mocking.
 */

// Core utilities
export * from './realDOMSetup';
export * from './errorScenarioHelper';
export * from './containerTestUtils';
export * from './configTestUtils';
export * from './advancedTestUtils';
export * from './zeroConfigTestUtils';

// Type definitions
export * from './integrationTestTypes';

// Convenience re-exports for common patterns
export {
  // DOM utilities
  setupRealDOM,
  createRealContainer,
  waitForElement,
  waitForElementToDisappear,
  simulateClick,
  simulateUserInteraction,
  getComputedStyles,
  isElementVisible,
  waitForContainerContent
} from './realDOMSetup';

export {
  // Error testing utilities
  createErrorScenarios,
  triggerErrorScenario,
  waitForErrorUI,
  validateErrorUI,
  simulateErrorRecovery,
  createErrorTestSuite
} from './errorScenarioHelper';

export {
  // Container testing utilities
  ContainerTester,
  validateContainer,
  createTestContainer,
  createMultipleContainers,
  testContainerWithViewerStates
} from './containerTestUtils';

export {
  // Config testing utilities
  ConfigTester,
  createConfigScenarios,
  validateConfig,
  parseAndValidateConfig,
  createTempConfigFile
} from './configTestUtils';

export {
  // Advanced testing utilities
  PerformanceMeasurer,
  withRetry,
  MemoryLeakDetector,
  TestDataGenerator,
  AsyncTestHelpers,
  TestEnvironmentUtils
} from './advancedTestUtils';

export {
  // Zero-config testing utilities
  ZeroConfigTestRunner,
  validateErrorUI as validateZeroConfigErrorUI,
  waitForContainerContent as waitForZeroConfigContent,
  ContainerSelectionTester,
  ConfigFileTester,
  ThemeTester,
  PerformanceTester,
  MemoryLeakDetector as ZeroConfigMemoryLeakDetector
} from './zeroConfigTestUtils';
