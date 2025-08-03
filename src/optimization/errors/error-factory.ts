/**
 * Error factory for creating standardized errors with context and suggestions
 * Implements the IErrorFactory interface from the shared context
 */

import { 
  ConfigLoadError, 
  DocumentLoadError, 
  NetworkError, 
  OptimizationErrorType,
  OptimizationErrorContext 
} from './base-errors';
import { MarkdownDocsError, ErrorCode } from '../../errors';

/**
 * Interface for error factory as defined in shared context
 */
export interface IErrorFactory {
  createConfigError(message: string, context?: Partial<OptimizationErrorContext>): ConfigLoadError;
  createDocumentError(message: string, context?: Partial<OptimizationErrorContext>): DocumentLoadError;
  createNetworkError(message: string, context?: Partial<OptimizationErrorContext>): NetworkError;
  analyzeError(error: unknown): AnalyzedError;
  generateUserMessage(error: MarkdownDocsError): string;
  generateSuggestions(error: MarkdownDocsError): string[];
}

/**
 * Result of error analysis
 */
export interface AnalyzedError {
  type: OptimizationErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
  userMessage: string;
  suggestions: string[];
  technicalDetails: any;
}

/**
 * Error factory implementation
 */
export class ErrorFactory implements IErrorFactory {
  private static instance: ErrorFactory;

  /**
   * Singleton instance getter
   */
  public static getInstance(): ErrorFactory {
    if (!ErrorFactory.instance) {
      ErrorFactory.instance = new ErrorFactory();
    }
    return ErrorFactory.instance;
  }

  private constructor() {}

  /**
   * Creates a configuration error with appropriate context and suggestions
   */
  createConfigError(message: string, context: Partial<OptimizationErrorContext> = {}): ConfigLoadError {
    const userMessage = this.generateConfigUserMessage(message, context);
    const suggestions = this.generateConfigSuggestions(message, context);
    
    return new ConfigLoadError(message, userMessage, suggestions, context);
  }

  /**
   * Creates a document error with appropriate context and suggestions
   */
  createDocumentError(message: string, context: Partial<OptimizationErrorContext> = {}): DocumentLoadError {
    const userMessage = this.generateDocumentUserMessage(message, context);
    const suggestions = this.generateDocumentSuggestions(message, context);
    
    // Determine if retryable based on context
    const isRetryable = this.isDocumentErrorRetryable(context);
    
    return new DocumentLoadError(
      this.getDocumentErrorCode(message, context),
      message,
      userMessage,
      suggestions,
      isRetryable,
      context
    );
  }

  /**
   * Creates a network error with appropriate context and suggestions
   */
  createNetworkError(message: string, context: Partial<OptimizationErrorContext> = {}): NetworkError {
    const userMessage = this.generateNetworkUserMessage(message, context);
    const suggestions = this.generateNetworkSuggestions(message, context);
    
    // Determine if retryable based on HTTP status
    const isRetryable = this.isNetworkErrorRetryable(context);
    
    return new NetworkError(
      this.getNetworkErrorCode(context),
      message,
      userMessage,
      suggestions,
      isRetryable,
      context.httpStatus,
      context
    );
  }

  /**
   * Analyzes any error and returns structured information
   */
  analyzeError(error: unknown): AnalyzedError {
    if (error instanceof ConfigLoadError) {
      return {
        type: OptimizationErrorType.CONFIG_LOAD,
        severity: 'high',
        isRetryable: false,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        technicalDetails: error.context
      };
    }

    if (error instanceof DocumentLoadError) {
      return {
        type: OptimizationErrorType.DOCUMENT_LOAD,
        severity: 'medium',
        isRetryable: error.isRetryable,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        technicalDetails: error.context
      };
    }

    if (error instanceof NetworkError) {
      return {
        type: OptimizationErrorType.NETWORK,
        severity: this.getNetworkErrorSeverity(error.httpStatus),
        isRetryable: error.isRetryable,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        technicalDetails: error.context
      };
    }

    if (error instanceof MarkdownDocsError) {
      return {
        type: this.mapErrorCodeToOptimizationType(error.code),
        severity: error.severity,
        isRetryable: error.isRetryable,
        userMessage: error.userMessage,
        suggestions: this.generateSuggestions(error),
        technicalDetails: error.context
      };
    }

    if (error instanceof Error) {
      return {
        type: OptimizationErrorType.REQUEST_FAILED,
        severity: 'medium',
        isRetryable: false,
        userMessage: 'An unexpected error occurred. Please try again.',
        suggestions: [
          'Refresh the page and try again',
          'Check your internet connection',
          'Contact support if the problem persists'
        ],
        technicalDetails: { 
          message: error.message, 
          stack: error.stack,
          timestamp: new Date()
        }
      };
    }

    // Unknown error type
    return {
      type: OptimizationErrorType.REQUEST_FAILED,
      severity: 'medium',
      isRetryable: false,
      userMessage: 'An unknown error occurred. Please try again.',
      suggestions: [
        'Refresh the page and try again',
        'Clear your browser cache',
        'Contact support if the problem persists'
      ],
      technicalDetails: { 
        error: String(error),
        timestamp: new Date()
      }
    };
  }

  /**
   * Generates user-friendly message for any MarkdownDocsError
   */
  generateUserMessage(error: MarkdownDocsError): string {
    if (error.userMessage) {
      return error.userMessage;
    }

    // Fallback user message generation based on error code
    switch (error.code) {
      case ErrorCode.DOCUMENT_NOT_FOUND:
        return 'The requested document could not be found.';
      case ErrorCode.NETWORK_ERROR:
        return 'Unable to load content due to a network error.';
      case ErrorCode.NETWORK_TIMEOUT:
        return 'Request took too long to complete.';
      case ErrorCode.INVALID_CONFIG:
        return 'Configuration is invalid. Using default settings.';
      default:
        return 'An error occurred while loading content.';
    }
  }

  /**
   * Generates actionable suggestions for any MarkdownDocsError
   */
  generateSuggestions(error: MarkdownDocsError): string[] {
    const suggestions: string[] = [];

    switch (error.code) {
      case ErrorCode.DOCUMENT_NOT_FOUND:
        suggestions.push(
          'Check if the file exists at the specified path',
          'Verify the file extension is .md or .markdown',
          'Check if the file has been moved or renamed'
        );
        break;

      case ErrorCode.NETWORK_ERROR:
        suggestions.push(
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        );
        break;

      case ErrorCode.NETWORK_TIMEOUT:
        suggestions.push(
          'Check your internet connection',
          'The server might be temporarily overloaded',
          'Try again in a few moments'
        );
        break;

      case ErrorCode.INVALID_CONFIG:
        suggestions.push(
          'Check the configuration documentation',
          'Validate your configuration file syntax',
          'Use the sample configuration as a reference'
        );
        break;

      case ErrorCode.RATE_LIMITED:
        suggestions.push(
          'Wait a few minutes before trying again',
          'Consider reducing the number of concurrent requests',
          'Check if you have exceeded API rate limits'
        );
        break;

      default:
        suggestions.push(
          'Refresh the page and try again',
          'Check your internet connection',
          'Contact support if the problem persists'
        );
    }

    return suggestions;
  }

  // Private helper methods

  private generateConfigUserMessage(message: string, _context: Partial<OptimizationErrorContext>): string {
    if (message.includes('not found')) {
      return 'Configuration file could not be found. Using default settings.';
    }
    if (message.includes('parse')) {
      return 'Configuration file contains invalid JSON. Using default settings.';
    }
    if (message.includes('schema') || message.includes('invalid')) {
      return 'Configuration file structure is invalid. Using default settings.';
    }
    return 'Configuration error occurred. Using default settings.';
  }

  private generateConfigSuggestions(message: string, _context: Partial<OptimizationErrorContext>): string[] {
    const suggestions = ['Check the configuration documentation'];
    
    if (message.includes('not found')) {
      suggestions.push(
        'Create a markdown-docs.json file in your project root',
        'Check if the file path is correct'
      );
    } else if (message.includes('parse')) {
      suggestions.push(
        'Check JSON syntax in your configuration file',
        'Validate JSON using an online JSON validator'
      );
    } else if (message.includes('schema')) {
      suggestions.push(
        'Compare your config with the sample configuration',
        'Check for required fields'
      );
    }
    
    return suggestions;
  }

  private generateDocumentUserMessage(message: string, context: Partial<OptimizationErrorContext>): string {
    if (context.httpStatus === 404) {
      return 'The requested document could not be found.';
    }
    if (context.httpStatus === 403) {
      return 'You do not have permission to access this document.';
    }
    if (message.includes('parse')) {
      return 'Document contains invalid markdown and could not be rendered.';
    }
    return 'Document could not be loaded.';
  }

  private generateDocumentSuggestions(message: string, context: Partial<OptimizationErrorContext>): string[] {
    const suggestions: string[] = [];
    
    if (context.httpStatus === 404) {
      suggestions.push(
        'Check if the file exists at the specified path',
        'Verify the file has not been moved or renamed'
      );
    } else if (context.httpStatus === 403) {
      suggestions.push(
        'Check if you have permission to access this resource',
        'Contact the site administrator'
      );
    } else if (message.includes('parse')) {
      suggestions.push(
        'Check markdown syntax in the document',
        'Verify all code blocks are properly closed'
      );
    } else {
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page'
      );
    }
    
    return suggestions;
  }

  private generateNetworkUserMessage(message: string, context: Partial<OptimizationErrorContext>): string {
    if (context.httpStatus === 429) {
      return 'Too many requests. Please wait before trying again.';
    }
    if (message.includes('CORS')) {
      return 'Cross-origin request blocked by browser security policy.';
    }
    if (message.includes('timeout')) {
      return 'Request took too long to complete.';
    }
    return 'Unable to load content due to a network error.';
  }

  private generateNetworkSuggestions(message: string, context: Partial<OptimizationErrorContext>): string[] {
    const suggestions: string[] = [];
    
    if (context.httpStatus === 429) {
      suggestions.push(
        'Wait a few minutes before trying again',
        'Consider reducing the number of concurrent requests'
      );
    } else if (message.includes('CORS')) {
      suggestions.push(
        'Ensure the server allows cross-origin requests',
        'Check if the URL protocol matches your site'
      );
    } else if (message.includes('timeout')) {
      suggestions.push(
        'Check your internet connection',
        'The server might be temporarily overloaded'
      );
    } else {
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      );
    }
    
    return suggestions;
  }

  private isDocumentErrorRetryable(context: Partial<OptimizationErrorContext>): boolean {
    // 404, 403, and parse errors are not retryable
    if (context.httpStatus === 404 || context.httpStatus === 403) {
      return false;
    }
    // Network errors and 5xx errors are retryable
    return true;
  }

  private isNetworkErrorRetryable(context: Partial<OptimizationErrorContext>): boolean {
    if (!context.httpStatus) return true; // Unknown network errors are retryable
    
    // Client errors (4xx except 429) are not retryable
    if (context.httpStatus >= 400 && context.httpStatus < 500 && context.httpStatus !== 429) {
      return false;
    }
    
    // Server errors (5xx) and rate limiting (429) are retryable
    return true;
  }

  private getDocumentErrorCode(message: string, context: Partial<OptimizationErrorContext>): ErrorCode {
    if (context.httpStatus === 404) {
      return ErrorCode.DOCUMENT_NOT_FOUND;
    }
    if (message.includes('parse')) {
      return ErrorCode.DOCUMENT_PARSE_FAILED;
    }
    return ErrorCode.DOCUMENT_LOAD_FAILED;
  }

  private getNetworkErrorCode(context: Partial<OptimizationErrorContext>): ErrorCode {
    if (context.httpStatus === 429) {
      return ErrorCode.RATE_LIMITED;
    }
    if (context.additionalData?.errorType === 'CORS') {
      return ErrorCode.NETWORK_ERROR; // No specific CORS code in base system
    }
    return ErrorCode.NETWORK_ERROR;
  }

  private getNetworkErrorSeverity(httpStatus?: number): 'low' | 'medium' | 'high' | 'critical' {
    if (!httpStatus) return 'medium';
    
    if (httpStatus >= 500) return 'high';
    if (httpStatus === 429) return 'medium';
    if (httpStatus === 404) return 'low';
    if (httpStatus === 403) return 'medium';
    
    return 'medium';
  }

  private mapErrorCodeToOptimizationType(code: ErrorCode): OptimizationErrorType {
    switch (code) {
      case ErrorCode.INVALID_CONFIG:
        return OptimizationErrorType.CONFIG_LOAD;
      case ErrorCode.DOCUMENT_NOT_FOUND:
      case ErrorCode.DOCUMENT_LOAD_FAILED:
      case ErrorCode.DOCUMENT_PARSE_FAILED:
        return OptimizationErrorType.DOCUMENT_LOAD;
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.NETWORK_TIMEOUT:
        return OptimizationErrorType.NETWORK;
      case ErrorCode.RATE_LIMITED:
        return OptimizationErrorType.RATE_LIMITED;
      case ErrorCode.PERMISSION_DENIED:
        return OptimizationErrorType.PERMISSION_DENIED;
      default:
        return OptimizationErrorType.REQUEST_FAILED;
    }
  }
}

/**
 * Convenience function to get the singleton instance
 */
export function getErrorFactory(): ErrorFactory {
  return ErrorFactory.getInstance();
}

/**
 * Convenience functions for common error scenarios
 */
export const OptimizationErrors = {
  configNotFound: (filePath: string) => 
    ConfigLoadError.fileNotFound(filePath),
  
  configParseError: (filePath: string, parseError: Error) => 
    ConfigLoadError.parseError(filePath, parseError),
  
  configInvalid: (filePath: string, validationErrors: string[]) => 
    ConfigLoadError.invalidSchema(filePath, validationErrors),
  
  documentNotFound: (documentPath: string) => 
    DocumentLoadError.notFound(documentPath),
  
  documentLoadFailed: (documentPath: string, error: Error) => 
    DocumentLoadError.loadFailed(documentPath, error),
  
  documentParseFailed: (documentPath: string, parseError: Error) => 
    DocumentLoadError.parseFailed(documentPath, parseError),
  
  networkRequestFailed: (url: string, status?: number, statusText?: string) => 
    NetworkError.requestFailed(url, status, statusText),
  
  networkTimeout: (url: string, timeoutMs: number) => 
    NetworkError.timeout(url, timeoutMs),
  
  corsError: (url: string) => 
    NetworkError.corsError(url),
  
  rateLimited: (url: string, retryAfter?: number) => 
    NetworkError.rateLimited(url, retryAfter),
};