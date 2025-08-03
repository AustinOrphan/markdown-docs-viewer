/**
 * Base error classes for zero-config optimization system
 * Extends the existing error system with optimization-specific error types
 */

import { MarkdownDocsError, ErrorCode, ErrorSeverity, ErrorContext } from '../../errors';

/**
 * Error types specific to the optimization system
 */
export enum OptimizationErrorType {
  CONFIG_LOAD = 'config_load',
  DOCUMENT_LOAD = 'document_load', 
  NETWORK = 'network',
  CORS = 'cors',
  TIMEOUT = 'timeout',
  NOT_FOUND = 'not_found',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMITED = 'rate_limited',
  ENVIRONMENT_DETECTION = 'environment_detection',
  CACHE_ERROR = 'cache_error',
  REQUEST_FAILED = 'request_failed',
  MANIFEST_PARSE = 'manifest_parse',
  DISCOVERY_FAILED = 'discovery_failed',
}

/**
 * Interface for optimization-specific error context
 */
export interface OptimizationErrorContext extends ErrorContext {
  requestUrl?: string;
  requestMethod?: string;
  httpStatus?: number;
  httpStatusText?: string;
  environment?: string;
  adapterType?: string;
  cacheKey?: string;
  retryAttempt?: number;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Base class for configuration loading errors
 */
export class ConfigLoadError extends MarkdownDocsError {
  public readonly type: OptimizationErrorType;
  public readonly suggestions: string[];

  constructor(
    message: string,
    userMessage: string,
    suggestions: string[] = [],
    context: Partial<OptimizationErrorContext> = {}
  ) {
    super(
      ErrorCode.INVALID_CONFIG,
      message,
      userMessage,
      ErrorSeverity.HIGH,
      false,
      context
    );
    
    this.name = 'ConfigLoadError';
    this.type = OptimizationErrorType.CONFIG_LOAD;
    this.suggestions = suggestions;
    
    Object.setPrototypeOf(this, ConfigLoadError.prototype);
  }

  static fileNotFound(filePath: string): ConfigLoadError {
    return new ConfigLoadError(
      `Configuration file not found: ${filePath}`,
      'Configuration file could not be found. The system will use default settings.',
      [
        'Create a markdown-docs.json file in your project root',
        'Check if the file path is correct',
        'Verify file permissions allow reading'
      ],
      { additionalData: { filePath } }
    );
  }

  static parseError(filePath: string, parseError: Error): ConfigLoadError {
    return new ConfigLoadError(
      `Failed to parse configuration file: ${filePath}`,
      'Configuration file contains invalid JSON. Using default settings.',
      [
        'Check JSON syntax in your configuration file',
        'Validate JSON using an online JSON validator',
        'Remove any comments from the JSON file'
      ],
      { 
        additionalData: { filePath, parseError: parseError.message },
        originalError: parseError
      }
    );
  }

  static invalidSchema(filePath: string, validationErrors: string[]): ConfigLoadError {
    return new ConfigLoadError(
      `Configuration file has invalid schema: ${filePath}`,
      'Configuration file structure is invalid. Using default settings.',
      [
        'Check the configuration documentation for valid options',
        'Compare your config with the sample configuration',
        ...validationErrors.map(err => `Fix: ${err}`)
      ],
      { 
        additionalData: { filePath, validationErrors }
      }
    );
  }
}

/**
 * Base class for document loading errors
 */
export class DocumentLoadError extends MarkdownDocsError {
  public readonly type: OptimizationErrorType;
  public readonly suggestions: string[];

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    suggestions: string[] = [],
    isRetryable: boolean = false,
    context: Partial<OptimizationErrorContext> = {}
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, isRetryable, context);
    
    this.name = 'DocumentLoadError';
    this.type = OptimizationErrorType.DOCUMENT_LOAD;
    this.suggestions = suggestions;
    
    Object.setPrototypeOf(this, DocumentLoadError.prototype);
  }

  static notFound(documentPath: string): DocumentLoadError {
    return new DocumentLoadError(
      ErrorCode.DOCUMENT_NOT_FOUND,
      `Document not found: ${documentPath}`,
      'The requested document could not be found.',
      [
        'Check if the file exists at the specified path',
        'Verify the file extension is .md or .markdown',
        'Check if the file has been moved or renamed'
      ],
      false,
      { additionalData: { documentPath } }
    );
  }

  static loadFailed(documentPath: string, error: Error): DocumentLoadError {
    return new DocumentLoadError(
      ErrorCode.DOCUMENT_LOAD_FAILED,
      `Failed to load document: ${documentPath}`,
      'Document could not be loaded due to a network or permission error.',
      [
        'Check your internet connection',
        'Verify file permissions',
        'Try refreshing the page'
      ],
      true,
      { 
        additionalData: { documentPath },
        originalError: error
      }
    );
  }

  static parseFailed(documentPath: string, parseError: Error): DocumentLoadError {
    return new DocumentLoadError(
      ErrorCode.DOCUMENT_PARSE_FAILED,
      `Failed to parse document: ${documentPath}`,
      'Document contains invalid markdown and could not be rendered.',
      [
        'Check markdown syntax in the document',
        'Verify all code blocks are properly closed',
        'Check for special characters that might need escaping'
      ],
      false,
      { 
        additionalData: { documentPath },
        originalError: parseError
      }
    );
  }
}

/**
 * Base class for network-related errors
 */
export class NetworkError extends MarkdownDocsError {
  public readonly type: OptimizationErrorType;
  public readonly suggestions: string[];
  public readonly httpStatus?: number;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    suggestions: string[] = [],
    isRetryable: boolean = true,
    httpStatus?: number,
    context: Partial<OptimizationErrorContext> = {}
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, isRetryable, context);
    
    this.name = 'NetworkError';
    this.type = OptimizationErrorType.NETWORK;
    this.suggestions = suggestions;
    this.httpStatus = httpStatus;
    
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  static requestFailed(url: string, status?: number, statusText?: string): NetworkError {
    const message = status 
      ? `Network request failed: ${status} ${statusText}` 
      : 'Network request failed';
    
    const suggestions = status === 404 
      ? [
          'Check if the URL is correct',
          'Verify the file exists at the specified location',
          'Check if the file has been moved or renamed'
        ]
      : status === 403
      ? [
          'Check if you have permission to access this resource',
          'Verify authentication credentials if required',
          'Contact the site administrator'
        ]
      : [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ];

    return new NetworkError(
      ErrorCode.NETWORK_ERROR,
      message,
      'Unable to load content due to a network error.',
      suggestions,
      true,
      status,
      { 
        requestUrl: url,
        httpStatus: status,
        httpStatusText: statusText
      }
    );
  }

  static timeout(url: string, timeoutMs: number): NetworkError {
    return new NetworkError(
      ErrorCode.NETWORK_TIMEOUT,
      `Request timeout after ${timeoutMs}ms: ${url}`,
      'Request took too long to complete.',
      [
        'Check your internet connection',
        'The server might be temporarily overloaded',
        'Try again in a few moments'
      ],
      true,
      undefined,
      { 
        requestUrl: url,
        additionalData: { timeoutMs }
      }
    );
  }

  static corsError(url: string): NetworkError {
    return new NetworkError(
      ErrorCode.NETWORK_ERROR,
      `CORS error accessing: ${url}`,
      'Cross-origin request blocked by browser security policy.',
      [
        'Ensure the server allows cross-origin requests',
        'Check if the URL protocol matches your site (HTTP vs HTTPS)',
        'Contact the site administrator to configure CORS headers'
      ],
      false,
      undefined,
      { 
        requestUrl: url,
        additionalData: { errorType: 'CORS' }
      }
    );
  }

  static rateLimited(url: string, retryAfter?: number): NetworkError {
    const suggestions = retryAfter 
      ? [`Wait ${retryAfter} seconds before trying again`]
      : ['Wait a few minutes before trying again'];
      
    suggestions.push(
      'Consider reducing the number of concurrent requests',
      'Check if you have exceeded API rate limits'
    );

    return new NetworkError(
      ErrorCode.RATE_LIMITED,
      `Rate limit exceeded: ${url}`,
      'Too many requests. Please wait before trying again.',
      suggestions,
      true,
      429,
      { 
        requestUrl: url,
        httpStatus: 429,
        additionalData: { retryAfter }
      }
    );
  }
}