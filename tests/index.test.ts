import { describe, it, expect } from 'vitest';
import * as exports from '../src/index';

describe('Index Exports', () => {
  it('should export MarkdownDocsViewer', () => {
    expect(exports.MarkdownDocsViewer).toBeDefined();
    expect(typeof exports.MarkdownDocsViewer).toBe('function');
  });

  it('should export themes', () => {
    expect(exports.defaultTheme).toBeDefined();
    expect(exports.defaultTheme.name).toBe('default-light');

    expect(exports.darkTheme).toBeDefined();
    expect(exports.darkTheme.name).toBe('default-dark');
  });

  it('should export factory functions', () => {
    expect(exports.createViewer).toBeDefined();
    expect(typeof exports.createViewer).toBe('function');
  });

  it('should export error handling utilities', () => {
    expect(exports.MarkdownDocsError).toBeDefined();
    expect(exports.ErrorCode).toBeDefined();
    expect(exports.ErrorSeverity).toBeDefined();
    expect(exports.ErrorFactory).toBeDefined();
    expect(exports.withRetry).toBeDefined();
    expect(exports.ErrorBoundary).toBeDefined();
    expect(exports.ConsoleErrorLogger).toBeDefined();

    expect(typeof exports.MarkdownDocsError).toBe('function');
    expect(typeof exports.withRetry).toBe('function');
    expect(typeof exports.ErrorBoundary).toBe('function');
    expect(typeof exports.ConsoleErrorLogger).toBe('function');
  });

  it('should export performance utilities', () => {
    expect(exports.LRUCache).toBeDefined();
    expect(exports.PersistentCache).toBeDefined();
    expect(exports.SearchIndex).toBeDefined();
    expect(exports.debounce).toBeDefined();
    expect(exports.throttle).toBeDefined();
    expect(exports.LazyLoader).toBeDefined();
    expect(exports.MemoryManager).toBeDefined();
    expect(exports.PerformanceMonitor).toBeDefined();

    expect(typeof exports.LRUCache).toBe('function');
    expect(typeof exports.PersistentCache).toBe('function');
    expect(typeof exports.SearchIndex).toBe('function');
    expect(typeof exports.debounce).toBe('function');
    expect(typeof exports.throttle).toBe('function');
    expect(typeof exports.LazyLoader).toBe('function');
    expect(typeof exports.MemoryManager).toBe('function');
    expect(typeof exports.PerformanceMonitor).toBe('function');
  });

  it('should export search manager', () => {
    expect(exports.SearchManager).toBeDefined();
    expect(typeof exports.SearchManager).toBe('function');
  });

  it('should export export utilities', () => {
    expect(exports.ExportManager).toBeDefined();
    expect(exports.createExportOptions).toBeDefined();

    expect(typeof exports.ExportManager).toBe('function');
    expect(typeof exports.createExportOptions).toBe('function');
  });

  it('should export i18n utilities', () => {
    expect(exports.I18nManager).toBeDefined();
    expect(exports.createI18nConfig).toBeDefined();
    expect(exports.defaultMessages).toBeDefined();
    expect(exports.createLocaleMessages).toBeDefined();

    expect(typeof exports.I18nManager).toBe('function');
    expect(typeof exports.createI18nConfig).toBe('function');
    expect(typeof exports.defaultMessages).toBe('object');
    expect(typeof exports.createLocaleMessages).toBe('function');
  });

  it('should export table of contents utilities', () => {
    expect(exports.TableOfContents).toBeDefined();
    expect(exports.addHeadingIds).toBeDefined();

    expect(typeof exports.TableOfContents).toBe('function');
    expect(typeof exports.addHeadingIds).toBe('function');
  });

  it('should export advanced search', () => {
    expect(exports.AdvancedSearchManager).toBeDefined();
    expect(typeof exports.AdvancedSearchManager).toBe('function');
  });

  it('should export print utilities', () => {
    expect(exports.generatePrintStyles).toBeDefined();
    expect(exports.addPrintUtilities).toBeDefined();
    expect(exports.generatePrintPreview).toBeDefined();

    expect(typeof exports.generatePrintStyles).toBe('function');
    expect(typeof exports.addPrintUtilities).toBe('function');
    expect(typeof exports.generatePrintPreview).toBe('function');
  });

  it('should export type definitions', () => {
    // Check that types namespace exists (they won't be defined at runtime but we can check the exports object)
    const exportKeys = Object.keys(exports);

    // Since types are erased at runtime, we can't directly check them
    // But we can ensure the module exports what we expect
    expect(exportKeys.length).toBeGreaterThan(20); // We have many exports
  });
});
