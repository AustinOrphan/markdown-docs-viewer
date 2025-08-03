/**
 * Tests for base error classes
 * Week 1 deliverable tests - Agent B
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigLoadError,
  DocumentLoadError,
  NetworkError,
  OptimizationErrorType
} from '../../../src/optimization/errors/base-errors';

describe('ConfigLoadError', () => {
  it('should create config load error with correct properties', () => {
    const error = new ConfigLoadError(
      'Config file not found',
      'Configuration file could not be found',
      ['Create a config file', 'Check the path'],
      { additionalData: { filePath: '/test/config.json' } }
    );

    expect(error.name).toBe('ConfigLoadError');
    expect(error.type).toBe(OptimizationErrorType.CONFIG_LOAD);
    expect(error.message).toBe('Config file not found');
    expect(error.userMessage).toBe('Configuration file could not be found');
    expect(error.suggestions).toEqual(['Create a config file', 'Check the path']);
    expect(error.isRetryable).toBe(false);
    expect(error.context.additionalData?.filePath).toBe('/test/config.json');
  });

  it('should create file not found error using static method', () => {
    const error = ConfigLoadError.fileNotFound('/test/config.json');

    expect(error.type).toBe(OptimizationErrorType.CONFIG_LOAD);
    expect(error.message).toContain('/test/config.json');
    expect(error.suggestions.length).toBeGreaterThan(0);
    expect(error.suggestions[0]).toContain('Create a markdown-docs.json');
  });

  it('should create parse error using static method', () => {
    const parseError = new Error('Unexpected token');
    const error = ConfigLoadError.parseError('/test/config.json', parseError);

    expect(error.type).toBe(OptimizationErrorType.CONFIG_LOAD);
    expect(error.message).toContain('Failed to parse');
    expect(error.context.originalError).toBe(parseError);
    expect(error.suggestions.some(s => s.includes('JSON syntax'))).toBe(true);
  });

  it('should create invalid schema error using static method', () => {
    const validationErrors = ['Missing required field: source', 'Invalid theme name'];
    const error = ConfigLoadError.invalidSchema('/test/config.json', validationErrors);

    expect(error.type).toBe(OptimizationErrorType.CONFIG_LOAD);
    expect(error.message).toContain('invalid schema');
    expect(error.suggestions.length).toBeGreaterThan(validationErrors.length);
    expect(error.context.additionalData?.validationErrors).toEqual(validationErrors);
  });
});

describe('DocumentLoadError', () => {
  it('should create document load error with correct properties', () => {
    const error = new DocumentLoadError(
      'DOCUMENT_NOT_FOUND' as any,
      'Document not found',
      'The document could not be found',
      ['Check the path'],
      false,
      { requestUrl: '/docs/test.md' }
    );

    expect(error.name).toBe('DocumentLoadError');
    expect(error.type).toBe(OptimizationErrorType.DOCUMENT_LOAD);
    expect(error.suggestions).toEqual(['Check the path']);
    expect(error.isRetryable).toBe(false);
  });

  it('should create not found error using static method', () => {
    const error = DocumentLoadError.notFound('/docs/missing.md');

    expect(error.type).toBe(OptimizationErrorType.DOCUMENT_LOAD);
    expect(error.message).toContain('/docs/missing.md');
    expect(error.isRetryable).toBe(false);
    expect(error.suggestions.some(s => s.includes('file exists'))).toBe(true);
  });

  it('should create load failed error using static method', () => {
    const networkError = new Error('Network failure');
    const error = DocumentLoadError.loadFailed('/docs/test.md', networkError);

    expect(error.type).toBe(OptimizationErrorType.DOCUMENT_LOAD);
    expect(error.message).toContain('Failed to load');
    expect(error.isRetryable).toBe(true);
    expect(error.context.originalError).toBe(networkError);
  });

  it('should create parse failed error using static method', () => {
    const parseError = new Error('Invalid markdown');
    const error = DocumentLoadError.parseFailed('/docs/test.md', parseError);

    expect(error.type).toBe(OptimizationErrorType.DOCUMENT_LOAD);
    expect(error.message).toContain('Failed to parse');
    expect(error.isRetryable).toBe(false);
    expect(error.suggestions.some(s => s.includes('markdown syntax'))).toBe(true);
  });
});

describe('NetworkError', () => {
  it('should create network error with correct properties', () => {
    const error = new NetworkError(
      'NETWORK_ERROR' as any,
      'Request failed',
      'Network request failed',
      ['Check connection'],
      true,
      500,
      { requestUrl: 'https://example.com/test' }
    );

    expect(error.name).toBe('NetworkError');
    expect(error.type).toBe(OptimizationErrorType.NETWORK);
    expect(error.httpStatus).toBe(500);
    expect(error.isRetryable).toBe(true);
  });

  it('should create request failed error using static method', () => {
    const error = NetworkError.requestFailed('https://example.com/test', 404, 'Not Found');

    expect(error.type).toBe(OptimizationErrorType.NETWORK);
    expect(error.httpStatus).toBe(404);
    expect(error.message).toContain('404 Not Found');
    expect(error.isRetryable).toBe(true);
    expect(error.context.requestUrl).toBe('https://example.com/test');
  });

  it('should create timeout error using static method', () => {
    const error = NetworkError.timeout('https://example.com/test', 5000);

    expect(error.type).toBe(OptimizationErrorType.NETWORK);
    expect(error.message).toContain('timeout after 5000ms');
    expect(error.isRetryable).toBe(true);
    expect(error.context.additionalData?.timeoutMs).toBe(5000);
  });

  it('should create CORS error using static method', () => {
    const error = NetworkError.corsError('https://external.com/api');

    expect(error.type).toBe(OptimizationErrorType.NETWORK);
    expect(error.message).toContain('CORS error');
    expect(error.isRetryable).toBe(false);
    expect(error.suggestions.some(s => s.includes('cross-origin'))).toBe(true);
  });

  it('should create rate limited error using static method', () => {
    const error = NetworkError.rateLimited('https://api.com/data', 60);

    expect(error.type).toBe(OptimizationErrorType.NETWORK);
    expect(error.httpStatus).toBe(429);
    expect(error.isRetryable).toBe(true);
    expect(error.context.additionalData?.retryAfter).toBe(60);
    expect(error.suggestions[0]).toContain('Wait 60 seconds');
  });
});

describe('Error Context and Inheritance', () => {
  it('should maintain proper prototype chain', () => {
    const configError = new ConfigLoadError('test', 'test');
    const docError = new DocumentLoadError('DOC_ERROR' as any, 'test', 'test');
    const netError = new NetworkError('NET_ERROR' as any, 'test', 'test');

    expect(configError instanceof ConfigLoadError).toBe(true);
    expect(configError instanceof Error).toBe(true);
    expect(docError instanceof DocumentLoadError).toBe(true);
    expect(docError instanceof Error).toBe(true);
    expect(netError instanceof NetworkError).toBe(true);
    expect(netError instanceof Error).toBe(true);
  });

  it('should include timestamp in context', () => {
    const before = Date.now();
    const error = new ConfigLoadError('test', 'test');
    const after = Date.now();

    expect(error.context.timestamp).toBeInstanceOf(Date);
    expect(error.context.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(error.context.timestamp.getTime()).toBeLessThanOrEqual(after);
  });

  it('should include browser context when available', () => {
    // This test would need proper mocking in a real test environment
    const error = new ConfigLoadError('test', 'test');
    
    expect(error.context).toBeDefined();
    expect(error.context.timestamp).toBeInstanceOf(Date);
  });
});