import { Theme } from './types';

/**
 * Generate print-friendly CSS styles
 */
export function generatePrintStyles(_theme: Theme): string {
  return `
    @media print {
      /* Reset page margins and setup */
      @page {
        margin: 2cm;
        size: A4;
      }

      @page :first {
        margin-top: 3cm;
      }

      /* Hide UI elements */
      .mdv-header,
      .mdv-sidebar,
      .mdv-mobile-toggle,
      .mdv-footer,
      .mdv-copy-button,
      .mdv-search,
      .mdv-navigation,
      .mdv-toc-right,
      .mdv-toc-left,
      .mdv-advanced-search,
      .no-print {
        display: none !important;
      }

      /* Reset layout */
      .mdv-app {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }

      .mdv-layout {
        display: block !important;
        grid-template-columns: none !important;
      }

      .mdv-content {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }

      .mdv-document {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Typography adjustments */
      body {
        font-size: 11pt !important;
        line-height: 1.6 !important;
        color: #000 !important;
        background: #fff !important;
      }

      h1, h2, h3, h4, h5, h6 {
        color: #000 !important;
        page-break-after: avoid;
        page-break-inside: avoid;
        margin-top: 1.5em !important;
        margin-bottom: 0.5em !important;
      }

      h1 {
        font-size: 20pt !important;
        border-bottom: 2pt solid #000 !important;
        padding-bottom: 0.5em !important;
      }

      h2 {
        font-size: 16pt !important;
      }

      h3 {
        font-size: 14pt !important;
      }

      h4 {
        font-size: 12pt !important;
      }

      h5, h6 {
        font-size: 11pt !important;
      }

      p, li {
        font-size: 11pt !important;
        line-height: 1.6 !important;
        orphans: 3;
        widows: 3;
      }

      /* Links */
      a {
        color: #000 !important;
        text-decoration: underline !important;
      }

      /* Show link URLs */
      a[href^="http"]:after,
      a[href^="https"]:after {
        content: " (" attr(href) ")";
        font-size: 9pt;
        color: #666;
        word-wrap: break-word;
      }

      /* Don't show URLs for internal links */
      a[href^="#"]:after,
      a[href^="javascript:"]:after {
        content: "";
      }

      /* Code blocks */
      pre, code {
        font-family: "Courier New", Courier, monospace !important;
        font-size: 10pt !important;
        background: #f5f5f5 !important;
        color: #000 !important;
        border: 1pt solid #ddd !important;
        page-break-inside: avoid;
      }

      pre {
        padding: 1em !important;
        margin: 1em 0 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100% !important;
      }

      code {
        padding: 0.2em 0.4em !important;
      }

      /* Tables */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        page-break-inside: avoid;
        margin: 1em 0 !important;
      }

      th, td {
        border: 1pt solid #000 !important;
        padding: 0.5em !important;
        font-size: 10pt !important;
      }

      th {
        background: #f0f0f0 !important;
        font-weight: bold !important;
      }

      /* Images */
      img {
        max-width: 100% !important;
        height: auto !important;
        page-break-inside: avoid;
        display: block;
        margin: 1em auto !important;
      }

      /* Blockquotes */
      blockquote {
        border-left: 3pt solid #666 !important;
        padding-left: 1em !important;
        margin: 1em 0 !important;
        color: #333 !important;
        font-style: italic !important;
        page-break-inside: avoid;
      }

      /* Lists */
      ul, ol {
        margin: 1em 0 !important;
        padding-left: 2em !important;
      }

      li {
        margin: 0.5em 0 !important;
        page-break-inside: avoid;
      }

      /* Horizontal rules */
      hr {
        border: none !important;
        border-top: 1pt solid #000 !important;
        margin: 2em 0 !important;
        page-break-after: avoid;
      }

      /* Page breaks */
      .page-break,
      .mdv-page-break {
        page-break-before: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }

      /* Document metadata */
      .mdv-document-title {
        font-size: 24pt !important;
        margin-bottom: 1em !important;
        page-break-after: avoid;
      }

      .mdv-document-description {
        font-size: 12pt !important;
        color: #333 !important;
        margin-bottom: 2em !important;
        page-break-after: avoid;
      }

      /* Print-specific helpers */
      .print-only {
        display: block !important;
      }

      /* TOC for print */
      .mdv-toc-inline {
        display: block !important;
        page-break-after: always;
        margin-bottom: 2em !important;
      }

      .mdv-toc-inline .mdv-toc-title {
        font-size: 18pt !important;
        margin-bottom: 1em !important;
      }

      .mdv-toc-inline .mdv-toc-link {
        color: #000 !important;
        text-decoration: none !important;
        font-size: 11pt !important;
      }

      .mdv-toc-inline .mdv-toc-link:after {
        content: leader(". ") target-counter(attr(href), page);
        font-size: 11pt !important;
      }

      /* Syntax highlighting in print */
      .hljs {
        background: #f5f5f5 !important;
        color: #000 !important;
      }

      .hljs-keyword { color: #000 !important; font-weight: bold !important; }
      .hljs-string { color: #333 !important; }
      .hljs-comment { color: #666 !important; font-style: italic !important; }
      .hljs-number { color: #333 !important; }
      .hljs-function { color: #000 !important; }
      .hljs-class { color: #000 !important; font-weight: bold !important; }

      /* Ensure content is visible */
      * {
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }

      /* Footer for page numbers */
      @page {
        @bottom-right {
          content: counter(page) " of " counter(pages);
          font-size: 10pt;
          color: #666;
        }
      }
    }
  `;
}

/**
 * Add print utilities to a document
 */
export function addPrintUtilities(container: HTMLElement): void {
  // Add print button
  const printButton = document.createElement('button');
  printButton.className = 'mdv-print-button no-print';
  printButton.textContent = 'Print';
  printButton.onclick = () => window.print();
  
  // Find a suitable place to add the button
  const header = container.querySelector('.mdv-header');
  if (header) {
    header.appendChild(printButton);
  }

  // Add page break markers to long sections
  const sections = container.querySelectorAll('h1, h2');
  sections.forEach((section, index) => {
    if (index > 0 && index % 3 === 0) {
      section.classList.add('page-break');
    }
  });

  // Ensure tables don't break across pages
  const tables = container.querySelectorAll('table');
  tables.forEach(table => {
    table.classList.add('avoid-break');
  });

  // Add print-specific styles for code blocks
  const codeBlocks = container.querySelectorAll('pre');
  codeBlocks.forEach(block => {
    if (block.scrollHeight > 800) {
      // Long code blocks should allow page breaks
      block.style.pageBreakInside = 'auto';
    } else {
      block.classList.add('avoid-break');
    }
  });
}

/**
 * Generate print preview
 */
export function generatePrintPreview(content: string, theme: Theme): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print Preview</title>
      <style>
        ${generatePrintStyles(theme)}
        
        /* Preview-specific styles */
        body {
          margin: 0;
          padding: 20px;
          background: #f0f0f0;
        }
        
        .print-preview-page {
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          margin: 0 auto 20px;
          padding: 2cm;
          width: 21cm;
          min-height: 29.7cm;
          box-sizing: border-box;
        }
        
        @media screen {
          .print-preview-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          
          .print-preview-controls button {
            display: block;
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            cursor: pointer;
            border-radius: 4px;
          }
          
          .print-preview-controls button:hover {
            background: #e0e0e0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-preview-controls no-print">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close Preview</button>
      </div>
      <div class="print-preview-page">
        ${content}
      </div>
    </body>
    </html>
  `;
}