/**
 * Error handling system for zero-config optimization
 * Week 1 deliverables - Agent B
 */

// Base error classes
export {
  OptimizationErrorType,
  OptimizationErrorContext,
  ConfigLoadError,
  DocumentLoadError,
  NetworkError
} from './base-errors';

// Error factory
export {
  IErrorFactory,
  AnalyzedError,
  ErrorFactory,
  getErrorFactory,
  OptimizationErrors
} from './error-factory';

// Re-export relevant types from base error system for convenience
export {
  MarkdownDocsError,
  ErrorCode,
  ErrorSeverity,
  ErrorContext
} from '../../errors';