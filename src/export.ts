import { Document, ExportOptions, ExportFormat } from './types';
import { MarkdownDocsViewer } from './viewer';
import { marked } from 'marked';
import { ErrorFactory, ErrorCode, MarkdownDocsError, ErrorSeverity } from './errors';

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export manager for generating PDF and HTML exports of documentation
 */
export class ExportManager {
  private viewer: MarkdownDocsViewer;
  private html2pdfAvailable: boolean = false;
  
  constructor(viewer: MarkdownDocsViewer) {
    this.viewer = viewer;
    this.checkDependencies();
  }

  /**
   * Check if optional export dependencies are available
   */
  private checkDependencies(): void {
    // Check for html2pdf.js availability
    if (typeof window !== 'undefined' && (window as any).html2pdf) {
      this.html2pdfAvailable = true;
    }
  }

  /**
   * Export documents in the specified format
   */
  async export(options: ExportOptions): Promise<Blob | string> {
    switch (options.format) {
      case 'pdf':
        return this.exportPDF(options);
      case 'html':
        return this.exportHTML(options);
      default:
        throw new MarkdownDocsError(
          ErrorCode.INVALID_CONFIG,
          `Unsupported export format: ${options.format}`,
          'The specified export format is not supported.',
          ErrorSeverity.HIGH,
          false,
          { operation: 'export', format: options.format }
        );
    }
  }

  /**
   * Export documents as PDF
   */
  private async exportPDF(options: ExportOptions): Promise<Blob> {
    if (!this.html2pdfAvailable) {
      throw new MarkdownDocsError(
        ErrorCode.NETWORK_ERROR, // Using available error code since DEPENDENCY_ERROR doesn't exist
        'html2pdf.js is required for PDF export. Please include it in your project.',
        'PDF export requires the html2pdf.js library to be included in your project.',
        ErrorSeverity.HIGH,
        false,
        { operation: 'exportPDF', dependency: 'html2pdf.js' }
      );
    }

    const html = await this.generateExportHTML(options);
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    try {
      const pdfOptions = {
        margin: options.pdfOptions?.margin || 10,
        filename: options.filename || 'documentation.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: options.pdfOptions?.format || 'a4', 
          orientation: options.pdfOptions?.orientation || 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const html2pdf = (window as any).html2pdf;
      const pdf = await html2pdf()
        .set(pdfOptions)
        .from(container)
        .outputPdf('blob');

      return pdf;
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Export documents as HTML bundle
   */
  private async exportHTML(options: ExportOptions): Promise<string> {
    const html = await this.generateExportHTML(options);
    
    if (options.embedAssets) {
      return this.embedAssets(html);
    }
    
    return html;
  }

  /**
   * Generate HTML for export
   */
  private async generateExportHTML(options: ExportOptions): Promise<string> {
    const documents = await this.getDocumentsToExport(options);
    const theme = this.viewer.getTheme();
    
    let html = `<!DOCTYPE html>
<html lang="${escapeHtml(options.locale || 'en')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title || 'Documentation Export')}</title>
  <style>
    ${this.getExportStyles(theme)}
    ${options.includeTheme ? this.viewer.getThemeStyles() : ''}
    
    /* Print styles */
    @media print {
      .page-break {
        page-break-before: always;
      }
      
      .no-print {
        display: none !important;
      }
      
      body {
        font-size: 12pt;
        line-height: 1.5;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      
      pre, blockquote, table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body class="export-body">`;

    // Add table of contents if requested
    if (options.includeTOC) {
      html += this.generateTableOfContents(documents);
    }

    // Add documents
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const content = await this.viewer.getDocumentContent(doc);
      const processedContent = marked(content);
      
      html += `
  <article class="exported-document ${i > 0 ? 'page-break' : ''}" id="doc-${escapeHtml(doc.id)}">
    <h1>${escapeHtml(doc.title)}</h1>
    ${doc.description ? `<p class="doc-description">${escapeHtml(doc.description)}</p>` : ''}
    ${doc.tags?.length ? `<div class="doc-tags">${doc.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
    <div class="doc-content">
      ${processedContent}
    </div>
  </article>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Get documents to export based on options
   */
  private async getDocumentsToExport(options: ExportOptions): Promise<Document[]> {
    const allDocs = this.viewer.getDocuments();
    
    if (!options.documentIds || options.documentIds.length === 0) {
      return allDocs;
    }
    
    return allDocs.filter(doc => options.documentIds!.includes(doc.id));
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(documents: Document[]): string {
    let toc = `
  <nav class="export-toc page-break">
    <h1>Table of Contents</h1>
    <ol>`;
    
    for (const doc of documents) {
      toc += `
      <li><a href="#doc-${escapeHtml(doc.id)}">${escapeHtml(doc.title)}</a></li>`;
    }
    
    toc += `
    </ol>
  </nav>`;
    
    return toc;
  }

  /**
   * Get export-specific styles
   */
  private getExportStyles(theme: any): string {
    return `
    body {
      font-family: ${theme.fonts.body};
      color: ${theme.colors.textPrimary};
      background: ${theme.colors.background};
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    
    .export-body {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .exported-document {
      margin-bottom: 50px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.textPrimary};
      margin-top: 24px;
      margin-bottom: 16px;
    }
    
    h1 { font-size: 2.5em; border-bottom: 2px solid ${theme.colors.border}; padding-bottom: 10px; }
    h2 { font-size: 2em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; }
    
    code {
      font-family: ${theme.fonts.code};
      background: ${theme.colors.codeBackground};
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    
    pre {
      background: ${theme.colors.codeBackground};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius};
      padding: 16px;
      overflow-x: auto;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    blockquote {
      border-left: 4px solid ${theme.colors.primary};
      margin: 16px 0;
      padding-left: 16px;
      color: ${theme.colors.textSecondary};
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    
    th, td {
      border: 1px solid ${theme.colors.border};
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background: ${theme.colors.surface};
      font-weight: bold;
    }
    
    a {
      color: ${theme.colors.link};
      text-decoration: none;
    }
    
    a:hover {
      color: ${theme.colors.linkHover};
      text-decoration: underline;
    }
    
    .doc-description {
      font-style: italic;
      color: ${theme.colors.textSecondary};
      margin-bottom: 16px;
    }
    
    .doc-tags {
      margin-bottom: 20px;
    }
    
    .tag {
      display: inline-block;
      background: ${theme.colors.surface};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius};
      padding: 4px 8px;
      margin-right: 8px;
      font-size: 0.85em;
    }
    
    .export-toc {
      margin-bottom: 50px;
    }
    
    .export-toc ol {
      list-style: decimal;
      padding-left: 20px;
    }
    
    .export-toc li {
      margin: 8px 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    hr {
      border: none;
      border-top: 1px solid ${theme.colors.border};
      margin: 24px 0;
    }
    `;
  }

  /**
   * Embed assets (styles, images) into HTML
   */
  private async embedAssets(html: string): Promise<string> {
    // For now, styles are already embedded
    // In the future, we could embed images as base64
    return html;
  }

  /**
   * Check if PDF export is available
   */
  isPDFExportAvailable(): boolean {
    return this.html2pdfAvailable;
  }

  /**
   * Get export capabilities
   */
  getExportCapabilities(): {
    pdf: boolean;
    html: boolean;
    formats: ExportFormat[];
  } {
    return {
      pdf: this.html2pdfAvailable,
      html: true,
      formats: ['html', ...(this.html2pdfAvailable ? ['pdf' as ExportFormat] : [])]
    };
  }
}

/**
 * Factory function to create export options
 */
export function createExportOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    format: 'html',
    includeTheme: true,
    includeTOC: true,
    embedAssets: false,
    ...overrides
  };
}