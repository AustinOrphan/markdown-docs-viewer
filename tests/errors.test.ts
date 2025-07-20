import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MarkdownDocsError,
  ErrorCode,
  ErrorSeverity,
  ErrorFactory,
  withRetry,
  ErrorBoundary,
  ConsoleErrorLogger,
  DEFAULT_RETRY_CONFIG
} from '../src/errors'

describe('Error Handling System', () => {
  let consoleWarnSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('MarkdownDocsError', () => {
    it('should create error with all properties', () => {
      const error = new MarkdownDocsError(
        ErrorCode.DOCUMENT_NOT_FOUND,
        'Test error message',
        'User-friendly message',
        ErrorSeverity.HIGH,
        true,
        { documentId: 'test-doc' }
      )

      expect(error.name).toBe('MarkdownDocsError')
      expect(error.code).toBe(ErrorCode.DOCUMENT_NOT_FOUND)
      expect(error.message).toBe('Test error message')
      expect(error.userMessage).toBe('User-friendly message')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.isRetryable).toBe(true)
      expect(error.context.documentId).toBe('test-doc')
      expect(error.context.timestamp).toBeInstanceOf(Date)
    })

    it('should have default values', () => {
      const error = new MarkdownDocsError(
        ErrorCode.UNKNOWN_ERROR,
        'Test message',
        'User message'
      )

      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.isRetryable).toBe(false)
      expect(error.context.timestamp).toBeInstanceOf(Date)
    })

    it('should serialize to JSON correctly', () => {
      const error = new MarkdownDocsError(
        ErrorCode.NETWORK_ERROR,
        'Network failed',
        'Connection error',
        ErrorSeverity.MEDIUM,
        true,
        { url: 'https://example.com' }
      )

      const json = error.toJSON()
      expect(json.name).toBe('MarkdownDocsError')
      expect(json.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(json.message).toBe('Network failed')
      expect(json.userMessage).toBe('Connection error')
      expect(json.severity).toBe(ErrorSeverity.MEDIUM)
      expect(json.isRetryable).toBe(true)
      expect(json.context).toBeDefined()
    })
  })

  describe('ErrorFactory', () => {
    it('should create container not found error', () => {
      const error = ErrorFactory.containerNotFound('#missing-container')
      
      expect(error.code).toBe(ErrorCode.INVALID_CONFIG)
      expect(error.message).toContain('#missing-container')
      expect(error.userMessage).toContain('container element')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.isRetryable).toBe(false)
    })

    it('should create document not found error', () => {
      const error = ErrorFactory.documentNotFound('missing-doc')
      
      expect(error.code).toBe(ErrorCode.DOCUMENT_NOT_FOUND)
      expect(error.message).toContain('missing-doc')
      expect(error.context.documentId).toBe('missing-doc')
      expect(error.isRetryable).toBe(false)
    })

    it('should create network error', () => {
      const error = ErrorFactory.networkError('https://example.com', 500, 'Internal Server Error')
      
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.message).toContain('500')
      expect(error.message).toContain('Internal Server Error')
      expect(error.isRetryable).toBe(true)
      expect(error.context.additionalData?.url).toBe('https://example.com')
    })

    it('should create GitHub API error', () => {
      const error = ErrorFactory.githubApiError('owner/repo/file.md', 404, 'Not Found')
      
      expect(error.code).toBe(ErrorCode.GITHUB_NOT_FOUND)
      expect(error.message).toContain('Not Found')
      expect(error.userMessage).toContain('not found')
      expect(error.isRetryable).toBe(false)
    })

    it('should create GitHub rate limit error', () => {
      const error = ErrorFactory.githubApiError('owner/repo/file.md', 403, 'Rate limit exceeded')
      
      expect(error.code).toBe(ErrorCode.GITHUB_RATE_LIMIT)
      expect(error.userMessage).toContain('rate limit')
      expect(error.isRetryable).toBe(true)
    })

    it('should create parse error', () => {
      const content = '# Test content'
      const originalError = new Error('Parse failed')
      const error = ErrorFactory.parseError(content, originalError)
      
      expect(error.code).toBe(ErrorCode.MARKDOWN_PARSE_ERROR)
      expect(error.context.originalError).toBe(originalError)
      expect(error.context.additionalData?.contentLength).toBe(content.length)
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await withRetry(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new MarkdownDocsError(
          ErrorCode.NETWORK_ERROR,
          'Network failed',
          'Connection error',
          ErrorSeverity.MEDIUM,
          true
        ))
        .mockResolvedValue('success')
      
      const result = await withRetry(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable errors', async () => {
      const error = new MarkdownDocsError(
        ErrorCode.DOCUMENT_NOT_FOUND,
        'Not found',
        'Document not found',
        ErrorSeverity.MEDIUM,
        false
      )
      const operation = vi.fn().mockRejectedValue(error)
      
      await expect(withRetry(operation)).rejects.toThrow(error)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect maxAttempts configuration', async () => {
      const error = new MarkdownDocsError(
        ErrorCode.NETWORK_ERROR,
        'Network failed',
        'Connection error',
        ErrorSeverity.MEDIUM,
        true
      )
      const operation = vi.fn().mockRejectedValue(error)
      
      await expect(withRetry(operation, { maxAttempts: 2 })).rejects.toThrow(error)
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should handle non-MarkdownDocsError exceptions', async () => {
      const error = new Error('Generic error')
      const operation = vi.fn().mockRejectedValue(error)
      
      await expect(withRetry(operation)).rejects.toThrow(error)
      expect(operation).toHaveBeenCalledTimes(1) // Should not retry generic errors
    })

    it('should apply exponential backoff delays', async () => {
      const error = new MarkdownDocsError(
        ErrorCode.NETWORK_ERROR,
        'Network failed',
        'Connection error',
        ErrorSeverity.MEDIUM,
        true
      )
      const operation = vi.fn().mockRejectedValue(error)
      
      const startTime = Date.now()
      await expect(withRetry(operation, { 
        maxAttempts: 3, 
        baseDelay: 100,
        exponentialBackoff: true 
      })).rejects.toThrow()
      const endTime = Date.now()
      
      // Should have waited at least 100ms + 200ms = 300ms total
      expect(endTime - startTime).toBeGreaterThan(250)
      expect(operation).toHaveBeenCalledTimes(3)
    })
  })

  describe('ErrorBoundary', () => {
    it('should execute operation successfully', async () => {
      const errorHandler = vi.fn()
      const boundary = new ErrorBoundary(errorHandler)
      const operation = vi.fn().mockResolvedValue('success')
      const fallback = vi.fn().mockReturnValue('fallback')
      
      const result = await boundary.execute(operation, fallback)
      
      expect(result).toBe('success')
      expect(errorHandler).not.toHaveBeenCalled()
      expect(fallback).not.toHaveBeenCalled()
    })

    it('should handle errors and call fallback', async () => {
      const errorHandler = vi.fn()
      const boundary = new ErrorBoundary(errorHandler)
      const error = new Error('Test error')
      const operation = vi.fn().mockRejectedValue(error)
      const fallback = vi.fn().mockReturnValue('fallback')
      
      const result = await boundary.execute(operation, fallback)
      
      expect(result).toBe('fallback')
      expect(errorHandler).toHaveBeenCalledTimes(1)
      expect(fallback).toHaveBeenCalledTimes(1)
      
      const handledError = errorHandler.mock.calls[0][0]
      expect(handledError).toBeInstanceOf(MarkdownDocsError)
      expect(handledError.context.originalError).toBe(error)
    })

    it('should pass through MarkdownDocsError unchanged', async () => {
      const errorHandler = vi.fn()
      const boundary = new ErrorBoundary(errorHandler)
      const error = new MarkdownDocsError(
        ErrorCode.DOCUMENT_NOT_FOUND,
        'Not found',
        'Document not found'
      )
      const operation = vi.fn().mockRejectedValue(error)
      const fallback = vi.fn().mockReturnValue('fallback')
      
      const result = await boundary.execute(operation, fallback)
      
      expect(result).toBe('fallback')
      expect(errorHandler).toHaveBeenCalledWith(error)
    })

    it('should work without error handler', async () => {
      const boundary = new ErrorBoundary()
      const error = new Error('Test error')
      const operation = vi.fn().mockRejectedValue(error)
      const fallback = vi.fn().mockReturnValue('fallback')
      
      const result = await boundary.execute(operation, fallback)
      
      expect(result).toBe('fallback')
      expect(fallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('ConsoleErrorLogger', () => {
    describe('in development mode', () => {
      let logger: ConsoleErrorLogger

      beforeEach(() => {
        logger = new ConsoleErrorLogger(true)
      })

      it('should log detailed error information', () => {
        const error = new MarkdownDocsError(
          ErrorCode.NETWORK_ERROR,
          'Network failed',
          'Connection error',
          ErrorSeverity.HIGH,
          true,
          { url: 'https://example.com' }
        )
        
        logger.log(error)
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'MarkdownDocsViewer Error:',
          expect.objectContaining({
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network failed',
            userMessage: 'Connection error',
            severity: ErrorSeverity.HIGH,
            context: expect.any(Object)
          })
        )
      })

      it('should log debug messages in development', () => {
        logger.debug('Test debug message', { key: 'value' })
        
        expect(console.debug).toHaveBeenCalledWith(
          'MarkdownDocsViewer Debug:',
          'Test debug message',
          { key: 'value' }
        )
      })
    })

    describe('in production mode', () => {
      let logger: ConsoleErrorLogger

      beforeEach(() => {
        logger = new ConsoleErrorLogger(false)
      })

      it('should log simplified error information', () => {
        const error = new MarkdownDocsError(
          ErrorCode.NETWORK_ERROR,
          'Network failed',
          'Connection error',
          ErrorSeverity.HIGH
        )
        
        logger.log(error)
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[NETWORK_ERROR] Connection error'
        )
      })

      it('should not log debug messages in production', () => {
        const debugSpy = vi.spyOn(console, 'debug')
        
        logger.debug('Test debug message')
        
        expect(debugSpy).not.toHaveBeenCalled()
      })
    })

    it('should use appropriate log levels for different severities', () => {
      const logger = new ConsoleErrorLogger(true)
      
      const lowError = new MarkdownDocsError(
        ErrorCode.UNKNOWN_ERROR,
        'Low severity',
        'Low severity',
        ErrorSeverity.LOW
      )
      logger.log(lowError)
      expect(console.info).toHaveBeenCalled()
      
      const mediumError = new MarkdownDocsError(
        ErrorCode.UNKNOWN_ERROR,
        'Medium severity',
        'Medium severity',
        ErrorSeverity.MEDIUM
      )
      logger.log(mediumError)
      expect(consoleWarnSpy).toHaveBeenCalled()
      
      const highError = new MarkdownDocsError(
        ErrorCode.UNKNOWN_ERROR,
        'High severity',
        'High severity',
        ErrorSeverity.HIGH
      )
      logger.log(highError)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should log warnings and errors', () => {
      const logger = new ConsoleErrorLogger()
      
      logger.warn('Test warning', { context: 'test' })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'MarkdownDocsViewer Warning:',
        'Test warning',
        { context: 'test' }
      )
      
      logger.error('Test error', { context: 'test' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'MarkdownDocsViewer Error:',
        'Test error',
        { context: 'test' }
      )
    })
  })

  describe('Error Code Coverage', () => {
    it('should have all error codes defined', () => {
      const expectedCodes = [
        'INVALID_CONFIG',
        'CONTAINER_NOT_FOUND',
        'INVALID_SOURCE',
        'DOCUMENT_NOT_FOUND',
        'DOCUMENT_LOAD_FAILED',
        'DOCUMENT_PARSE_FAILED',
        'NETWORK_ERROR',
        'NETWORK_TIMEOUT',
        'UNAUTHORIZED_ACCESS',
        'RATE_LIMITED',
        'FILE_NOT_FOUND',
        'FILE_READ_ERROR',
        'PERMISSION_DENIED',
        'GITHUB_API_ERROR',
        'GITHUB_RATE_LIMIT',
        'GITHUB_NOT_FOUND',
        'SEARCH_FAILED',
        'SEARCH_TIMEOUT',
        'MARKDOWN_PARSE_ERROR',
        'SYNTAX_HIGHLIGHT_ERROR',
        'THEME_LOAD_ERROR',
        'INVALID_THEME',
        'UNKNOWN_ERROR',
        'OPERATION_CANCELLED'
      ]

      expectedCodes.forEach(code => {
        expect(ErrorCode[code as keyof typeof ErrorCode]).toBeDefined()
      })
    })

    it('should have all error severities defined', () => {
      expect(ErrorSeverity.LOW).toBe('low')
      expect(ErrorSeverity.MEDIUM).toBe('medium')
      expect(ErrorSeverity.HIGH).toBe('high')
      expect(ErrorSeverity.CRITICAL).toBe('critical')
    })
  })

  describe('Default Retry Configuration', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3)
      expect(DEFAULT_RETRY_CONFIG.baseDelay).toBe(1000)
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(10000)
      expect(DEFAULT_RETRY_CONFIG.exponentialBackoff).toBe(true)
      expect(DEFAULT_RETRY_CONFIG.retryableErrorCodes).toContain(ErrorCode.NETWORK_ERROR)
      expect(DEFAULT_RETRY_CONFIG.retryableErrorCodes).toContain(ErrorCode.NETWORK_TIMEOUT)
      expect(DEFAULT_RETRY_CONFIG.retryableErrorCodes).toContain(ErrorCode.RATE_LIMITED)
      expect(DEFAULT_RETRY_CONFIG.retryableErrorCodes).toContain(ErrorCode.GITHUB_RATE_LIMIT)
    })
  })
})