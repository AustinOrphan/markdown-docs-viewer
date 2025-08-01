/**
 * Integration Test Type Definitions
 *
 * Comprehensive type definitions for the integration test framework.
 * Provides type safety and IntelliSense support for all test utilities.
 */

import { DocumentationConfig } from '../../../src/types';
import { MarkdownDocsViewer } from '../../../src/viewer';

// Base Types
export interface TestResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  duration?: number;
  timestamp?: number;
}

export interface TestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

// DOM Testing Types
export interface TestContainer {
  element: HTMLElement;
  id: string;
  cleanup: () => void;
}

export interface DOMTestEnvironment {
  containers: TestContainer[];
  cleanup: () => void;
}

export interface ContainerTestOptions {
  id?: string;
  className?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  innerHTML?: string;
}

export interface ContainerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  element: HTMLElement;
}

export interface ContainerSnapshot {
  innerHTML: string;
  outerHTML: string;
  classList: string[];
  styles: Record<string, string>;
  attributes: Record<string, string>;
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
}

// Error Testing Types
export type ErrorType =
  | 'container-not-found'
  | 'container-invalid'
  | 'config-malformed'
  | 'config-missing'
  | 'document-not-found'
  | 'document-malformed'
  | 'network-error'
  | 'permission-denied';

export interface ErrorScenario {
  type: ErrorType;
  description: string;
  setup: () => Promise<void> | void;
  trigger: () => Promise<Error> | Error;
  cleanup?: () => Promise<void> | void;
}

export interface ErrorUIExpectations {
  hasErrorMessage: boolean;
  errorMessageContains?: string;
  hasRetryButton?: boolean;
  hasErrorClass?: boolean;
  errorClassName?: string;
}

export interface ErrorTestSuite {
  scenario: ErrorScenario;
  expectations: ErrorUIExpectations;
  runTest: (container: Element) => Promise<{
    error: Error;
    errorElement: Element;
    inspection: ErrorInspection;
  }>;
}

export interface ErrorInspection {
  outerHTML: string;
  textContent: string;
  classList: string[];
  attributes: Record<string, string>;
  childElementCount: number;
}

// Configuration Testing Types
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

export interface ConfigTestReport {
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
}

// Zero-Config Testing Types
export interface ZeroConfigOptions {
  container?: string | HTMLElement;
  configPath?: string;
  theme?: string;
  autoInit?: boolean;
  [key: string]: any;
}

export interface ZeroConfigTestResult {
  viewer: MarkdownDocsViewer;
  container: HTMLElement;
  initTime: number;
  success: boolean;
  error?: Error;
}

export interface ErrorUIValidationResult {
  hasErrorUI: boolean;
  errorType: 'setup-required' | 'viewer-creation-failed' | 'other' | 'none';
  errorMessage?: string;
  hasQuickSetup?: boolean;
  hasTechnicalDetails?: boolean;
}

// Performance Testing Types
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

export interface PerformanceTestResult {
  averageTime: number;
  minTime: number;
  maxTime: number;
  measurements: number[];
  memoryUsage?: {
    initial: number;
    final: number;
    peak: number;
    growthMB: number;
  };
}

export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryLeakAnalysis {
  hasLeak: boolean;
  memoryGrowthMB: number;
  snapshots: MemorySnapshot[];
  leakThreshold?: number;
}

// Retry and Async Testing Types
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface AsyncTestOptions {
  timeout?: number;
  interval?: number;
  retries?: number;
  condition?: () => boolean | Promise<boolean>;
}

// Document Testing Types
export interface DocumentTestScenario {
  name: string;
  description: string;
  documentContent: string;
  expectedResult: 'success' | 'error' | 'warning';
  expectedIssues?: string[];
  setup?: () => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}

export interface DocumentValidationResult {
  isValid: boolean;
  hasContent: boolean;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
  metadata?: {
    wordCount: number;
    headingCount: number;
    codeBlockCount: number;
    linkCount: number;
  };
}

// Theme Testing Types
export interface ThemeTestResult {
  applied: boolean;
  themeName: string;
  cssVariables?: Record<string, string>;
  error?: Error;
}

export interface ThemeValidationResult {
  themes: string[];
  hasBasicThemes: boolean;
  themeCount: number;
  customThemeSupport: boolean;
}

// Network and Environment Simulation Types
export interface NetworkSimulationOptions {
  delay?: number;
  errorRate?: number;
  timeoutRate?: number;
  slowConnectionSpeed?: number;
}

export interface EnvironmentSimulationOptions {
  memoryPressure?: number; // MB
  slowCPU?: boolean;
  networkConditions?: NetworkSimulationOptions;
  viewport?: { width: number; height: number };
}

// Test Suite Configuration Types
export interface IntegrationTestConfig {
  timeout: number;
  retries: number;
  parallel: boolean;
  cleanup: boolean;
  performance: {
    measureMemory: boolean;
    measureTiming: boolean;
    leakDetection: boolean;
  };
  environment: {
    browser: string;
    viewport: { width: number; height: number };
    userAgent?: string;
  };
  coverage: {
    enabled: boolean;
    threshold: number;
    include: string[];
    exclude: string[];
  };
}

// Test State and Context Types
export interface TestContext {
  testName: string;
  suiteName: string;
  startTime: number;
  containers: TestContainer[];
  viewers: MarkdownDocsViewer[];
  tempFiles: Array<{ path: string; cleanup: () => void }>;
  mockRestore: Array<() => void>;
}

export interface TestExecutionContext extends TestContext {
  metrics: TestMetrics;
  snapshots: MemorySnapshot[];
  errors: Error[];
  warnings: string[];
}

// Utility Function Types
export type TestAssertion<T> = (actual: T, expected: T, message?: string) => void | Promise<void>;

export type TestSetupFunction = () => Promise<void> | void;
export type TestCleanupFunction = () => Promise<void> | void;
export type TestFunction<T = any> = () => Promise<T> | T;

export type ErrorHandler = (error: Error, context: TestExecutionContext) => void | Promise<void>;
export type WarningHandler = (warning: string, context: TestExecutionContext) => void;

// Template Types
export interface TestTemplate<TOptions = any, TResult = any> {
  name: string;
  description: string;
  setup: TestSetupFunction;
  execute: (options: TOptions) => Promise<TResult>;
  cleanup: TestCleanupFunction;
  validate: (result: TResult) => boolean | Promise<boolean>;
}

export interface ContainerTestTemplate
  extends TestTemplate<ContainerTestOptions, ContainerValidationResult> {
  containerTypes: string[];
  errorScenarios: ErrorType[];
}

export interface ConfigTestTemplate
  extends TestTemplate<ConfigTestScenario, ConfigValidationResult> {
  configTypes: string[];
  validationRules: string[];
}

export interface DocumentTestTemplate
  extends TestTemplate<DocumentTestScenario, DocumentValidationResult> {
  documentTypes: string[];
  securityChecks: boolean;
}

// Export utility class types
export interface TestUtilityClass {
  setup(): Promise<void> | void;
  cleanup(): Promise<void> | void;
}

export interface ContainerTesterInterface extends TestUtilityClass {
  element: HTMLElement;
  id: string;
  validate(): ContainerValidationResult;
  snapshot(): ContainerSnapshot;
  simulateUserInteraction(selector: string, eventType?: string): void;
  waitForContent(selector: string, timeout?: number): Promise<Element>;
}

export interface ConfigTesterInterface extends TestUtilityClass {
  createConfigFile(content: string, filename?: string): Promise<string>;
  testConfigFromFile(filePath: string): Promise<ConfigValidationResult>;
  testScenario(scenario: ConfigTestScenario): Promise<TestResult<ConfigValidationResult>>;
  generateValidationReport(results: TestResult<ConfigValidationResult>[]): ConfigTestReport;
}

export interface PerformanceTesterInterface extends TestUtilityClass {
  measureInitPerformance(options?: any, iterations?: number): Promise<PerformanceTestResult>;
  getMeasurements(): Array<{ name: string; duration: number; timestamp: number }>;
  clearMeasurements(): void;
}

export interface MemoryLeakDetectorInterface extends TestUtilityClass {
  takeSnapshot(label?: string): MemorySnapshot;
  analyzeLeaks(thresholdMB?: number): MemoryLeakAnalysis;
  detectLeaksInFunction<T>(
    fn: () => Promise<T>,
    iterations?: number,
    thresholdMB?: number
  ): Promise<{ result: T; hasLeak: boolean; memoryGrowthMB: number }>;
}

// Advanced Types for Complex Scenarios
export interface MultiContainerTestScenario {
  containers: ContainerTestOptions[];
  interactions: Array<{
    containerId: string;
    action: string;
    parameters?: any;
    expectedResult?: any;
  }>;
  validation: (containers: ContainerTesterInterface[]) => Promise<boolean>;
}

export interface CrossBrowserTestScenario {
  browsers: string[];
  testFunction: TestFunction;
  expectedDifferences?: Record<string, any>;
}

export interface StressTestScenario {
  name: string;
  description: string;
  load: {
    documents?: number;
    containerOperations?: number;
    memoryUsageMB?: number;
    concurrentUsers?: number;
  };
  duration: number;
  acceptableLimits: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    minSuccessRate: number;
  };
}

// Union Types for Common Patterns
export type TestResultStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'timeout';

export type TestCategory =
  | 'container'
  | 'config'
  | 'document'
  | 'theme'
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'integration';

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

export type TestEnvironment = 'jsdom' | 'happy-dom' | 'browser' | 'node';

// Re-export commonly used types from main codebase
export type { DocumentationConfig } from '../../../src/types';
export type { MarkdownDocsViewer } from '../../../src/viewer';
