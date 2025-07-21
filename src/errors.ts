/**
 * Enhanced error handling system for MarkdownDocsViewer
 * Provides categorized errors, retry mechanisms, and detailed error context
 */

export enum ErrorCode {
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  INVALID_SOURCE = 'INVALID_SOURCE',
  
  // Document loading errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_LOAD_FAILED = 'DOCUMENT_LOAD_FAILED',
  DOCUMENT_PARSE_FAILED = 'DOCUMENT_PARSE_FAILED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // GitHub API errors
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  GITHUB_RATE_LIMIT = 'GITHUB_RATE_LIMIT',
  GITHUB_NOT_FOUND = 'GITHUB_NOT_FOUND',
  
  // Search errors
  SEARCH_FAILED = 'SEARCH_FAILED',
  SEARCH_TIMEOUT = 'SEARCH_TIMEOUT',
  
  // Rendering errors
  MARKDOWN_PARSE_ERROR = 'MARKDOWN_PARSE_ERROR',
  SYNTAX_HIGHLIGHT_ERROR = 'SYNTAX_HIGHLIGHT_ERROR',
  
  // Theme errors
  THEME_LOAD_ERROR = 'THEME_LOAD_ERROR',
  INVALID_THEME = 'INVALID_THEME',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  timestamp: Date;
  userAgent?: string;
  url?: string;
  documentId?: string;
  operation?: string;
  retryCount?: number;
  originalError?: unknown;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
  missingDependencies?: string[];
  warnings?: string[];
}

export class MarkdownDocsError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable: boolean = false,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    this.name = 'MarkdownDocsError';
    this.code = code;
    this.severity = severity;
    this.userMessage = userMessage;
    this.isRetryable = isRetryable;
    this.context = {
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' && window.location ? window.location.href : undefined,
      stackTrace: this.stack,
      ...context
    };

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, MarkdownDocsError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      isRetryable: this.isRetryable,
      context: this.context
    };
  }
}

// Specific error classes for better error categorization
export class ConfigurationError extends MarkdownDocsError {
  constructor(message: string, userMessage: string, context?: Partial<ErrorContext>) {
    super(
      ErrorCode.INVALID_CONFIG,
      message,
      userMessage,
      ErrorSeverity.HIGH,
      false,
      context
    );
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends MarkdownDocsError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    isRetryable: boolean = true,
    context?: Partial<ErrorContext>
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, isRetryable, context);
    this.name = 'NetworkError';
  }
}

export class DocumentError extends MarkdownDocsError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    isRetryable: boolean = false,
    context?: Partial<ErrorContext>
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, isRetryable, context);
    this.name = 'DocumentError';
  }
}

export class GitHubError extends MarkdownDocsError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    isRetryable: boolean = false,
    context?: Partial<ErrorContext>
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, isRetryable, context);
    this.name = 'GitHubError';
  }
}

// Error factory functions for common scenarios
export const ErrorFactory = {
  containerNotFound(selector: string): ConfigurationError {
    return new ConfigurationError(
      `Container element not found: ${selector}`,
      'Unable to find the container element. Please check your configuration.',
      { operation: 'initialization', additionalData: { selector } }
    );
  },

  documentNotFound(docId: string): DocumentError {
    return new DocumentError(
      ErrorCode.DOCUMENT_NOT_FOUND,
      `Document not found: ${docId}`,
      'The requested document could not be found.',
      false,
      { operation: 'loadDocument', documentId: docId }
    );
  },

  networkError(url: string, status?: number, statusText?: string): NetworkError {
    const message = status 
      ? `Network request failed: ${status} ${statusText}`
      : 'Network request failed';
    
    return new NetworkError(
      ErrorCode.NETWORK_ERROR,
      message,
      'Unable to load content due to a network error. Please check your connection and try again.',
      true,
      { 
        operation: 'networkRequest',
        additionalData: { url, status, statusText }
      }
    );
  },

  githubApiError(path: string, status: number, message: string): GitHubError {
    const code = status === 404 
      ? ErrorCode.GITHUB_NOT_FOUND 
      : status === 403 
        ? ErrorCode.GITHUB_RATE_LIMIT 
        : ErrorCode.GITHUB_API_ERROR;

    const userMessage = status === 404
      ? 'The requested GitHub file was not found.'
      : status === 403
        ? 'GitHub API rate limit reached. Please try again later.'
        : 'Unable to load content from GitHub. Please try again later.';

    return new GitHubError(
      code,
      `GitHub API error: ${message}`,
      userMessage,
      status === 403,
      {
        operation: 'githubRequest',
        additionalData: { path, status, responseMessage: message }
      }
    );
  },

  parseError(content: string, originalError: unknown): DocumentError {
    return new DocumentError(
      ErrorCode.MARKDOWN_PARSE_ERROR,
      'Failed to parse markdown content',
      'Unable to render the document content. The document may contain invalid formatting.',
      false,
      {
        operation: 'parseMarkdown',
        originalError,
        additionalData: { contentLength: content.length }
      }
    );
  }
};

// Retry configuration interface
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryableErrorCodes: ErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
  retryableErrorCodes: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.RATE_LIMITED,
    ErrorCode.GITHUB_RATE_LIMIT
  ]
};

// Utility function for retrying operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Only retry if the error is a MarkdownDocsError AND is retryable
      if (error instanceof MarkdownDocsError) {
        if (!error.isRetryable || !retryConfig.retryableErrorCodes.includes(error.code)) {
          break;
        }
      } else {
        // Don't retry non-MarkdownDocsError exceptions
        break;
      }

      // Calculate delay for next attempt
      const delay = retryConfig.exponentialBackoff
        ? Math.min(retryConfig.baseDelay * Math.pow(2, attempt - 1), retryConfig.maxDelay)
        : retryConfig.baseDelay;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Error boundary utility for graceful degradation
export class ErrorBoundary {
  private errorHandler?: (error: MarkdownDocsError) => void;

  constructor(errorHandler?: (error: MarkdownDocsError) => void) {
    this.errorHandler = errorHandler;
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const wrappedError = this.wrapError(error, context);
      
      if (this.errorHandler) {
        this.errorHandler(wrappedError);
      }

      return fallback();
    }
  }

  private wrapError(error: unknown, context: Partial<ErrorContext>): MarkdownDocsError {
    if (error instanceof MarkdownDocsError) {
      return error;
    }

    if (error instanceof Error) {
      return new MarkdownDocsError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        'An unexpected error occurred. Please try again.',
        ErrorSeverity.MEDIUM,
        false,
        { ...context, originalError: error }
      );
    }

    return new MarkdownDocsError(
      ErrorCode.UNKNOWN_ERROR,
      'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
      ErrorSeverity.MEDIUM,
      false,
      { ...context, originalError: error }
    );
  }
}

// Logger interface for structured error logging
export interface ErrorLogger {
  log(error: MarkdownDocsError): void;
  debug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleErrorLogger implements ErrorLogger {
  private isDevelopment: boolean;

  constructor(isDevelopment: boolean = false) {
    this.isDevelopment = isDevelopment;
  }

  log(error: MarkdownDocsError): void {
    const logMethod = this.getLogMethod(error.severity);
    
    if (this.isDevelopment) {
      logMethod('MarkdownDocsViewer Error:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        severity: error.severity,
        context: error.context,
        stack: error.stack
      });
    } else {
      logMethod(`[${error.code}] ${error.userMessage}`);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.debug('MarkdownDocsViewer Debug:', message, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn('MarkdownDocsViewer Warning:', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error('MarkdownDocsViewer Error:', message, context);
  }

  private getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}