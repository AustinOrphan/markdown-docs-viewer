/**
 * Mock utilities index
 * Centralized exports for all mock utilities to prevent circular dependencies
 */

// ConfigLoader mock utilities  
export * from './mockConfigLoader';

// AutoDiscovery mock utilities
export * from './mockAutoDiscovery';

// Viewer mock utilities
export * from './mockViewer';

// Viewer state utilities
export * from './viewer-states';

// Enhanced Factory Mock utilities (primary - replaces mockFactory)
export {
  // Core factory mocking
  mockCreateViewerSuccess,
  mockCreateViewerError,
  mockCreateViewerContainerError,
  mockCreateViewerConfigError,
  setupFactoryMock,
  cleanupFactoryMocks,
  
  // Enhanced viewer creation
  createMockViewer as createEnhancedMockViewer,
  createErrorViewer as createFactoryErrorViewer,
  createAdvancedMockViewer,
  
  // Types
  type MockViewerOptions,
  type AdvancedMockViewerOptions,
} from './mockCreateViewer';

// Legacy Factory utilities (deprecated - use mockCreateViewer instead)
export {
  createMockViewer as createLegacyMockViewer,
  createErrorViewer as createLegacyErrorViewer,
  createTestViewer,
  mockQuickStart,
  type MockViewerOptions as LegacyMockViewerOptions,
} from './mockFactory';