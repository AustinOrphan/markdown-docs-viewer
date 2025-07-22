import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportManager, createExportOptions } from '../src/export';
import { I18nManager, createI18nConfig, defaultMessages } from '../src/i18n';
import { TableOfContents, addHeadingIds } from '../src/toc';
import { AdvancedSearchManager } from '../src/advanced-search';
import { generatePrintStyles } from '../src/print-styles';
import { Document } from '../src/types';

// Mock marked module
vi.mock('marked', () => ({
  marked: vi.fn((content: string) => `<p>${content}</p>`),
  markedHighlight: vi.fn(() => ({})),
}));

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    getLanguage: vi.fn(() => true),
    highlight: vi.fn((code: string) => ({ value: code })),
  },
}));

describe('Export Utility Functions', () => {
  // We need to test the private functions by importing the module and accessing them
  // Since they're not exported, we'll test them through ExportManager public methods

  it('should escape HTML special characters in export content', async () => {
    const mockViewer = {
      getDocuments: vi.fn(() => [
        {
          id: 'doc1',
          title: '<script>alert("xss")</script>Document',
          content: 'Content with <script>evil()</script>',
          description: '<img src=x onerror=alert(1)>Description',
        },
      ]),
      getDocumentContent: vi.fn((doc: any) => Promise.resolve(doc.content)),
      getTheme: vi.fn(() => ({
        name: 'default',
        colors: { primary: '#000', background: '#fff' },
        fonts: { body: 'Arial', code: 'monospace' },
      })),
      getThemeStyles: vi.fn(() => 'theme styles'),
    };

    const exportManager = new ExportManager(mockViewer);
    const result = await exportManager.export({ format: 'html' });

    // Should escape HTML in title
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>alert');
  });

  it('should sanitize malicious HTML content', async () => {
    const mockViewer = {
      getDocuments: vi.fn(() => [
        {
          id: 'doc1',
          title: 'Test Document',
          content: '<div onclick="evil()">Safe content</div><script>alert("xss")</script>',
          tags: ['<script>tag</script>', 'safe-tag'],
        },
      ]),
      getDocumentContent: vi.fn((doc: any) => Promise.resolve(doc.content)),
      getTheme: vi.fn(() => ({
        name: 'default',
        colors: { primary: '#000', background: '#fff' },
        fonts: { body: 'Arial', code: 'monospace' },
      })),
      getThemeStyles: vi.fn(() => 'theme styles'),
    };

    const exportManager = new ExportManager(mockViewer);
    const result = await exportManager.export({ format: 'html' });

    // Should remove script tags and event handlers
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Safe content');
  });

  it('should handle various URL protocols in content', async () => {
    const mockViewer = {
      getDocuments: vi.fn(() => [
        {
          id: 'doc1',
          title: 'URL Test Document',
          content: `
            <a href="javascript:alert('xss')">Evil Link</a>
            <a href="https://safe.com">Safe Link</a>
            <a href="mailto:test@example.com">Email Link</a>
            <a href="#fragment">Fragment Link</a>
            <img src="data:text/html,<script>alert(1)</script>">
            <img src="https://safe.com/image.jpg">
          `,
        },
      ]),
      getDocumentContent: vi.fn((doc: any) => Promise.resolve(doc.content)),
      getTheme: vi.fn(() => ({
        name: 'default',
        colors: { primary: '#000', background: '#fff' },
        fonts: { body: 'Arial', code: 'monospace' },
      })),
      getThemeStyles: vi.fn(() => 'theme styles'),
    };

    const exportManager = new ExportManager(mockViewer);
    const result = await exportManager.export({ format: 'html' });

    // Should remove dangerous protocols
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('data:text/html');
    // Should keep safe URLs
    expect(result).toContain('https://safe.com');
    expect(result).toContain('mailto:test@example.com');
    expect(result).toContain('#fragment');
  });

  it('should handle non-string inputs gracefully', async () => {
    const mockViewer = {
      getDocuments: vi.fn(() => [
        {
          id: 'doc1',
          title: null, // Non-string title
          content: 'Content',
          description: undefined, // Non-string description
          tags: [null, 'valid-tag', undefined], // Mixed tag types
        },
      ]),
      getDocumentContent: vi.fn((doc: any) => Promise.resolve(doc.content || '')),
      getTheme: vi.fn(() => ({
        name: 'default',
        colors: { primary: '#000', background: '#fff' },
        fonts: { body: 'Arial', code: 'monospace' },
      })),
      getThemeStyles: vi.fn(() => 'theme styles'),
    };

    const exportManager = new ExportManager(mockViewer);

    // Should not throw error with non-string inputs
    await expect(exportManager.export({ format: 'html' })).resolves.toBeDefined();
  });
});

describe('ExportManager', () => {
  let mockViewer: any;
  let exportManager: ExportManager;

  beforeEach(() => {
    mockViewer = {
      getDocuments: vi.fn(() => [
        { id: 'doc1', title: 'Document 1', content: 'Content 1' },
        { id: 'doc2', title: 'Document 2', content: 'Content 2' },
      ]),
      getDocumentContent: vi.fn((doc: Document) => Promise.resolve(doc.content || '')),
      getTheme: vi.fn(() => ({
        name: 'default',
        colors: { primary: '#000', background: '#fff' },
        fonts: { body: 'Arial', code: 'monospace' },
      })),
      getThemeStyles: vi.fn(() => 'theme styles'),
    };

    exportManager = new ExportManager(mockViewer);
  });

  it('should create export manager', () => {
    expect(exportManager).toBeDefined();
    expect(exportManager.getExportCapabilities().html).toBe(true);
  });

  it('should export HTML', async () => {
    const options = createExportOptions({
      format: 'html',
      includeTheme: true,
      includeTOC: true,
    });

    const result = await exportManager.export(options);
    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Document 1');
    expect(result).toContain('Document 2');
  });

  it('should handle invalid export format', async () => {
    const options = createExportOptions({
      format: 'invalid' as any,
    });

    await expect(exportManager.export(options)).rejects.toThrow();
  });

  it('should export HTML without theme', async () => {
    const options = createExportOptions({
      format: 'html',
      includeTheme: false,
      includeTOC: false,
    });

    const result = await exportManager.export(options);
    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).not.toContain('Table of Contents');
  });

  it('should export HTML with specific document IDs', async () => {
    const options = createExportOptions({
      format: 'html',
      documentIds: ['doc1'],
    });

    const result = await exportManager.export(options);
    expect(typeof result).toBe('string');
    expect(result).toContain('Document 1');
    expect(result).not.toContain('Document 2');
  });

  it('should export HTML with asset embedding', async () => {
    const options = createExportOptions({
      format: 'html',
      embedAssets: true,
    });

    const result = await exportManager.export(options);
    expect(typeof result).toBe('string');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should handle documents with descriptions and tags', async () => {
    mockViewer.getDocuments.mockReturnValue([
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
      },
    ]);

    const options = createExportOptions({ format: 'html' });
    const result = await exportManager.export(options);

    expect(result).toContain('Test description');
    expect(result).toContain('tag1');
    expect(result).toContain('tag2');
  });

  it('should handle documents without descriptions or tags', async () => {
    mockViewer.getDocuments.mockReturnValue([
      { id: 'doc1', title: 'Document 1', content: 'Content 1' },
    ]);

    const options = createExportOptions({ format: 'html' });
    const result = await exportManager.export(options);

    expect(result).toContain('Document 1');
    // Check that description and tags HTML elements are not present in the content
    expect(result).not.toContain('<p class="doc-description">');
    expect(result).not.toContain('<div class="doc-tags">');
  });

  it('should handle PDF export without html2pdf dependency', async () => {
    const options = createExportOptions({
      format: 'pdf',
    });

    await expect(exportManager.export(options)).rejects.toThrow('html2pdf.js is required');
  });

  it('should check PDF export availability', () => {
    expect(exportManager.isPDFExportAvailable()).toBe(false);

    const capabilities = exportManager.getExportCapabilities();
    expect(capabilities.pdf).toBe(false);
    expect(capabilities.html).toBe(true);
    expect(capabilities.formats).toEqual(['html']);
  });

  it('should handle empty document list', async () => {
    mockViewer.getDocuments.mockReturnValue([]);

    const options = createExportOptions({ format: 'html' });
    const result = await exportManager.export(options);

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).not.toContain('<article');
  });

  it('should handle custom export options', async () => {
    const options = createExportOptions({
      format: 'html',
      title: 'Custom Title',
      locale: 'es',
      includeTOC: true,
      includeTheme: true,
    });

    const result = await exportManager.export(options);
    expect(result).toContain('Custom Title');
    expect(result).toContain('lang="es"');
    expect(result).toContain('Table of Contents');
  });
});

describe('I18nManager', () => {
  let i18n: I18nManager;

  beforeEach(() => {
    const config = createI18nConfig({
      locale: 'en',
      messages: {
        en: defaultMessages,
        es: {
          app: {
            title: 'Documentación',
            loading: 'Cargando documentación...',
          },
        },
      },
    });

    i18n = new I18nManager(config);
  });

  it('should translate messages', () => {
    expect(i18n.t('app.title')).toBe('Documentation');
    expect(i18n.t('app.loading')).toBe('Loading documentation...');
  });

  it('should handle missing translations', () => {
    expect(i18n.t('missing.key')).toBe('missing.key');
  });

  it('should interpolate parameters', () => {
    i18n.addLocale('test', {
      greeting: 'Hello {name}!',
    });
    i18n.setLocale('test');

    expect(i18n.t('greeting', { name: 'World' })).toBe('Hello World!');
  });

  it('should switch locales', () => {
    i18n.setLocale('es');
    expect(i18n.t('app.title')).toBe('Documentación');
    expect(i18n.getLocale()).toBe('es');
  });

  it('should list available locales', () => {
    const locales = i18n.getAvailableLocales();
    expect(locales).toContain('en');
    expect(locales).toContain('es');
  });
});

describe('TableOfContents', () => {
  let toc: TableOfContents;

  beforeEach(() => {
    toc = new TableOfContents({
      enabled: true,
      maxDepth: 3,
    });
  });

  it('should generate TOC from markdown', () => {
    const content = `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
### Subsection 2.1
#### Deep section
# Another Title
    `;

    const items = toc.generate(content);
    expect(items).toHaveLength(2);
    expect(items[0].text).toBe('Main Title');
    expect(items[0].children).toHaveLength(2);
    expect(items[0].children[0].text).toBe('Section 1');
    expect(items[0].children[0].children).toHaveLength(1);
  });

  it('should generate unique IDs', () => {
    const content = `
# Title
## Title
### Title
    `;

    const items = toc.generate(content);
    const ids = new Set<string>();

    const collectIds = (items: any[]) => {
      items.forEach(item => {
        ids.add(item.id);
        if (item.children) {
          collectIds(item.children);
        }
      });
    };

    collectIds(items);
    expect(ids.size).toBe(3);
  });

  it('should render TOC HTML', () => {
    const content = '# Title\n## Section';
    toc.generate(content);

    const html = toc.render();
    expect(html).toContain('mdv-toc');
    expect(html).toContain('Table of Contents');
    expect(html).toContain('href="#title"');
  });
});

describe('AdvancedSearchManager', () => {
  let searchManager: AdvancedSearchManager;
  const documents: Document[] = [
    {
      id: 'doc1',
      title: 'JavaScript Guide',
      content: 'Learn JavaScript programming',
      tags: ['javascript', 'programming'],
      category: 'Guides',
    },
    {
      id: 'doc2',
      title: 'TypeScript Tutorial',
      content: 'TypeScript is a typed superset of JavaScript',
      tags: ['typescript', 'programming'],
      category: 'Tutorials',
    },
    {
      id: 'doc3',
      title: 'CSS Basics',
      content: 'Cascading Style Sheets fundamentals',
      tags: ['css', 'design'],
      category: 'Guides',
    },
  ];

  beforeEach(() => {
    searchManager = new AdvancedSearchManager(documents, {
      enabled: true,
      highlighting: true,
      searchHistory: false, // Disable for tests
    });
  });

  it('should search documents', () => {
    const results = searchManager.search('javascript');
    expect(results).toHaveLength(2);
    expect(results[0].document.id).toBe('doc1');
  });

  it('should apply category filters', () => {
    searchManager = new AdvancedSearchManager(documents, {
      filters: {
        categories: ['Guides'],
      },
    });

    const results = searchManager.search('programming');
    expect(results).toHaveLength(1);
    expect(results[0].document.category).toBe('Guides');
  });

  it('should apply tag filters', () => {
    searchManager = new AdvancedSearchManager(documents, {
      filters: {
        tags: ['typescript'],
      },
    });

    const results = searchManager.search('programming');
    expect(results).toHaveLength(1);
    expect(results[0].document.tags).toContain('typescript');
  });

  it('should generate highlights', () => {
    const results = searchManager.search('javascript');
    expect(results[0].highlights).toBeDefined();
    expect(results[0].highlights.length).toBeGreaterThan(0);
    expect(results[0].highlights[0].field).toBe('title');
  });

  it('should get search suggestions', () => {
    const suggestions = searchManager.getSuggestions('java');
    expect(suggestions).toContain('JavaScript Guide');
  });
});

describe('addHeadingIds', () => {
  it('should add IDs to headings', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
    const result = addHeadingIds(html);

    expect(result).toContain('id="title"');
    expect(result).toContain('id="subtitle"');
    expect(result).toContain('id="section"');
  });

  it('should handle duplicate headings', () => {
    const html = '<h1>Title</h1><h2>Title</h2><h3>Title</h3>';
    const result = addHeadingIds(html);

    expect(result).toContain('id="title"');
    expect(result).toContain('id="title-1"');
    expect(result).toContain('id="title-2"');
  });
});

describe('generatePrintStyles', () => {
  it('should generate print CSS', () => {
    const theme = {
      name: 'default',
      colors: {
        primary: '#000',
        background: '#fff',
        border: '#ccc',
      },
      fonts: {
        body: 'Arial',
        code: 'monospace',
      },
    };

    const styles = generatePrintStyles(theme as any);
    expect(styles).toContain('@media print');
    expect(styles).toContain('page-break-after: avoid');
    expect(styles).toContain('.mdv-sidebar');
    expect(styles).toContain('display: none');
  });
});
