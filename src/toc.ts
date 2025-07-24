import { TableOfContentsOptions } from './types';
import { marked, Token } from 'marked';
import { announceToScreenReader } from './utils';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children: TOCItem[];
}

/**
 * Table of Contents generator
 */
export class TableOfContents {
  private options: TableOfContentsOptions;
  private headings: TOCItem[] = [];
  private activeId: string | null = null;

  constructor(options: TableOfContentsOptions = {}) {
    this.options = {
      enabled: true,
      maxDepth: 3,
      sticky: true,
      scrollSpy: true,
      collapsible: false,
      position: 'right',
      ...options,
    };
  }

  /**
   * Generate table of contents from markdown content
   */
  generate(content: string): TOCItem[] {
    if (!this.options.enabled) {
      return [];
    }

    this.headings = [];
    let tokens: Token[] = [];
    try {
      // Try the function approach first (newer marked versions)
      tokens = marked.lexer(content);
    } catch {
      console.warn('`marked.lexer` failed, falling back to manual heading parsing.');
      // Fallback to parsing markdown manually for headings
      const lines = content.split('\n');
      for (const line of lines) {
        // Use indexOf for safer heading detection without regex vulnerability
        if (line.startsWith('#')) {
          const hashMatch = line.match(/^#{1,6}/);
          if (hashMatch) {
            const hashCount = hashMatch[0].length;
            const remainingText = line.slice(hashCount).trim();
            if (remainingText.length > 0) {
              const level = hashCount;
              const text = remainingText;
              const id = this.generateId(text);
              this.headings.push({ level, text, id, children: [] });
            }
          }
        }
      }
      return this.buildTree();
    }

    this.extractHeadings(tokens);
    return this.buildTree();
  }

  /**
   * Extract headings from markdown tokens
   */
  private extractHeadings(tokens: Token[]): void {
    for (const token of tokens) {
      if (token.type === 'heading' && token.depth <= this.options.maxDepth!) {
        const id = this.generateId(token.text);
        this.headings.push({
          id,
          text: token.text,
          level: token.depth,
          children: [],
        });
      }
    }
  }

  /**
   * Build hierarchical tree from flat headings
   */
  private buildTree(): TOCItem[] {
    const tree: TOCItem[] = [];
    const stack: TOCItem[] = [];

    for (const heading of this.headings) {
      // Find the appropriate parent for this heading
      // Remove items from stack until we find a heading with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // No parent found, this is a top level heading
        tree.push(heading);
      } else {
        // Add as child to the last item in stack (which has lower level)
        const parent = stack[stack.length - 1];
        parent.children.push(heading);
      }

      // Add this heading to the stack for potential future children
      stack.push(heading);
    }

    return tree;
  }

  /**
   * Generate unique ID for heading
   */
  private generateId(text: string): string {
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Ensure uniqueness
    let counter = 1;
    let uniqueId = id;
    while (this.headings.some(h => h.id === uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }

    return uniqueId;
  }

  /**
   * Render table of contents HTML
   */
  render(): string {
    if (!this.options.enabled || this.headings.length === 0) {
      return '';
    }

    const position = this.options.position;
    const sticky = this.options.sticky ? 'mdv-toc-sticky' : '';
    const collapsible = this.options.collapsible ? 'mdv-toc-collapsible' : '';

    return `
      <nav class="mdv-toc mdv-toc-${position} ${sticky} ${collapsible}" role="navigation" aria-label="Table of contents">
        <h2 class="mdv-toc-title" id="toc-heading">Table of Contents</h2>
        ${this.renderTree(this.buildTree())}
        <div class="mdv-sr-only" aria-live="polite" id="toc-announcements"></div>
      </nav>
    `;
  }

  /**
   * Render TOC tree recursively
   */
  private renderTree(items: TOCItem[], level: number = 1): string {
    if (items.length === 0) {
      return '';
    }

    const listItems = items
      .map(item => {
        const hasChildren = item.children.length > 0;
        const active = item.id === this.activeId ? 'mdv-toc-active' : '';

        return `
        <li class="mdv-toc-item mdv-toc-level-${level} ${active}" role="listitem">
          <a href="#${item.id}" 
             class="mdv-toc-link" 
             data-toc-id="${item.id}"
             aria-current="${item.id === this.activeId ? 'location' : 'false'}"
             role="link">
            ${item.text}
          </a>
          ${hasChildren ? this.renderTree(item.children, level + 1) : ''}
        </li>
      `;
      })
      .join('');

    return `<ul class="mdv-toc-list mdv-toc-list-${level}" role="list">${listItems}</ul>`;
  }

  /**
   * Initialize scroll spy functionality
   */
  initScrollSpy(container: HTMLElement): void {
    if (!this.options.scrollSpy || !this.options.enabled) {
      return;
    }

    const headingElements: HTMLElement[] = [];

    // Collect all heading elements
    this.headings.forEach(heading => {
      const element = container.querySelector(`#${heading.id}`) as HTMLElement;
      if (element) {
        headingElements.push(element);
      }
    });

    // Create intersection observer
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.setActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -70% 0%',
        threshold: 0,
      }
    );

    // Observe all headings
    headingElements.forEach(element => {
      observer.observe(element);
    });

    // Handle scroll to update active heading
    let scrollTimeout: NodeJS.Timeout;
    container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateActiveHeading(container, headingElements);
      }, 100);
    });
  }

  /**
   * Update active heading based on scroll position
   */
  private updateActiveHeading(container: HTMLElement, headings: HTMLElement[]): void {
    let activeHeading: HTMLElement | null = null;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;

      if (relativeTop <= 100) {
        activeHeading = heading;
      } else {
        break;
      }
    }

    if (activeHeading) {
      this.setActiveHeading(activeHeading.id);
    }
  }

  /**
   * Set active heading
   */
  private setActiveHeading(id: string): void {
    const previousActiveId = this.activeId;
    this.activeId = id;

    // Update DOM
    document.querySelectorAll('.mdv-toc-link').forEach(link => {
      const isActive = link.getAttribute('data-toc-id') === id;
      link.classList.toggle('mdv-toc-active', isActive);
      link.setAttribute('aria-current', isActive ? 'location' : 'false');

      if (isActive) {
        // Ensure active item is visible in TOC
        const tocContainer = link.closest('.mdv-toc');
        if (tocContainer && this.options.sticky) {
          const linkRect = link.getBoundingClientRect();
          const containerRect = tocContainer.getBoundingClientRect();

          if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
            link.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        // Announce the change for screen readers
        if (previousActiveId !== id) {
          this.announceActiveHeading(link.textContent || '');
        }
      }
    });
  }

  private announceActiveHeading(headingText: string): void {
    const announcement = `Current section: ${headingText}`;
    // Only announce if the TOC live region exists (TOC is rendered)
    if (document.getElementById('toc-announcements')) {
      announceToScreenReader(announcement, 'toc-announcements');
    }
  }

  /**
   * Get TOC styles
   */
  static getStyles(): string {
    return `
      .mdv-toc {
        padding: 1rem;
        background: var(--mdv-surface);
        border-radius: var(--mdv-border-radius);
        max-height: calc(100vh - 200px);
        overflow-y: auto;
      }

      .mdv-toc-sticky {
        position: sticky;
        top: 1rem;
      }

      .mdv-toc-right {
        float: right;
        margin-left: 2rem;
        width: 250px;
      }

      .mdv-toc-left {
        float: left;
        margin-right: 2rem;
        width: 250px;
      }

      .mdv-toc-inline {
        margin: 2rem 0;
      }

      .mdv-toc-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        color: var(--mdv-text-primary);
      }

      .mdv-toc-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .mdv-toc-list-2,
      .mdv-toc-list-3 {
        padding-left: 1rem;
      }

      .mdv-toc-item {
        margin: 0.25rem 0;
      }

      .mdv-toc-link {
        display: block;
        padding: 0.25rem 0.5rem;
        color: var(--mdv-text-secondary);
        text-decoration: none;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
        font-size: 0.875rem;
      }

      .mdv-toc-link:hover {
        color: var(--mdv-primary);
        background: var(--mdv-background);
      }

      .mdv-toc-link.mdv-toc-active {
        color: var(--mdv-primary);
        font-weight: 500;
        background: var(--mdv-background);
      }

      .mdv-toc-level-2 .mdv-toc-link {
        font-size: 0.813rem;
      }

      .mdv-toc-level-3 .mdv-toc-link {
        font-size: 0.75rem;
      }

      /* Collapsible TOC */
      .mdv-toc-collapsible .mdv-toc-item.has-children > .mdv-toc-link::before {
        content: '▸';
        display: inline-block;
        margin-right: 0.25rem;
        transition: transform 0.2s ease;
      }

      .mdv-toc-collapsible .mdv-toc-item.has-children.expanded > .mdv-toc-link::before {
        transform: rotate(90deg);
      }

      .mdv-toc-collapsible .mdv-toc-item.has-children:not(.expanded) > .mdv-toc-list {
        display: none;
      }

      /* Mobile styles */
      @media (max-width: 1200px) {
        .mdv-toc-right,
        .mdv-toc-left {
          float: none;
          width: 100%;
          margin: 2rem 0;
        }
      }

      /* Print styles */
      @media print {
        .mdv-toc {
          display: none;
        }
      }
    `;
  }
}

/**
 * Add IDs to headings in HTML content
 */
export function addHeadingIds(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  const usedIds = new Set<string>();

  headings.forEach(heading => {
    if (!heading.id) {
      const id = heading
        .textContent!.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Ensure uniqueness
      let counter = 1;
      let uniqueId = id;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${id}-${counter}`;
        counter++;
      }

      usedIds.add(uniqueId);
      heading.id = uniqueId;
    }
  });

  return doc.body.innerHTML;
}
