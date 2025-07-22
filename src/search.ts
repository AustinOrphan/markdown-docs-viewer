import { SearchOptions, Document } from './types';
import { SearchIndex, debounce } from './performance';

export function createSearch(options: SearchOptions): string {
  return `
    <div class="mdv-search">
      <input 
        type="text" 
        class="mdv-search-input" 
        placeholder="${options.placeholder || 'Search documentation...'}"
        aria-label="Search documentation"
      />
      <div class="mdv-search-results"></div>
    </div>
  `;
}

export class SearchManager {
  private searchIndex: SearchIndex;
  private options: SearchOptions;
  private searchInput: HTMLInputElement | null = null;
  private searchResults: HTMLElement | null = null;
  private debouncedSearch: (query: string) => void;
  private currentQuery: string = '';
  private onDocumentSelect?: (doc: Document) => void;

  constructor(options: SearchOptions, onDocumentSelect?: (doc: Document) => void) {
    this.options = options;
    this.searchIndex = new SearchIndex();
    this.onDocumentSelect = onDocumentSelect;

    // Create debounced search function
    this.debouncedSearch = debounce(
      (query: string) => this.performSearch(query),
      300 // 300ms delay
    );
  }

  updateIndex(documents: Document[], contentCache: Map<string, string>): void {
    this.searchIndex.updateIndex(documents, contentCache);
  }

  attachToDOM(container: HTMLElement): void {
    const searchContainer = container.querySelector('.mdv-search');
    if (!searchContainer) return;

    this.searchInput = searchContainer.querySelector('.mdv-search-input') as HTMLInputElement;
    this.searchResults = searchContainer.querySelector('.mdv-search-results') as HTMLElement;

    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
      this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
      this.searchInput.addEventListener('blur', this.handleBlur.bind(this));
    }

    // Hide results initially
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
    }
  }

  private handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    this.currentQuery = query;

    if (query.length === 0) {
      this.hideResults();
      return;
    }

    if (query.length >= 2) {
      this.debouncedSearch(query);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.searchResults) return;

    const results = this.searchResults.querySelectorAll('.mdv-search-result');
    const activeResult = this.searchResults.querySelector('.mdv-search-result.active');

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateResults(results, activeResult, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateResults(results, activeResult, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (activeResult) {
          this.selectResult(activeResult);
        } else if (results.length > 0) {
          this.selectResult(results[0]);
        }
        break;
      case 'Escape':
        this.hideResults();
        this.searchInput?.blur();
        break;
    }
  }

  private handleFocus(): void {
    if (this.currentQuery.length >= 2) {
      this.performSearch(this.currentQuery);
    }
  }

  private handleBlur(): void {
    // Delay hiding to allow clicking on results
    setTimeout(() => {
      this.hideResults();
    }, 150);
  }

  private navigateResults(
    results: NodeListOf<Element>,
    activeResult: Element | null,
    direction: number
  ): void {
    if (results.length === 0) return;

    // Remove current active class
    if (activeResult) {
      activeResult.classList.remove('active');
    }

    let newIndex = 0;
    if (activeResult) {
      const currentIndex = Array.from(results).indexOf(activeResult);
      newIndex = currentIndex + direction;
    } else if (direction === -1) {
      newIndex = results.length - 1;
    }

    // Wrap around
    if (newIndex < 0) newIndex = results.length - 1;
    if (newIndex >= results.length) newIndex = 0;

    results[newIndex].classList.add('active');
    results[newIndex].scrollIntoView({ block: 'nearest' });
  }

  private selectResult(resultElement: Element): void {
    const docId = resultElement.getAttribute('data-doc-id');
    if (docId && this.onDocumentSelect) {
      // Find the document
      const doc = this.findDocumentById(docId);
      if (doc) {
        this.onDocumentSelect(doc);
        this.hideResults();
        if (this.searchInput) {
          this.searchInput.value = '';
          this.currentQuery = '';
        }
      }
    }
  }

  private findDocumentById(docId: string): Document | null {
    // This would need to be provided by the parent component
    // For now, we'll create a minimal document object
    return { id: docId, title: docId };
  }

  private performSearch(query: string): void {
    if (!this.searchResults) return;

    const results = this.searchIndex.search(query, {
      searchInTags: this.options.searchInTags,
      fuzzySearch: this.options.fuzzySearch,
      caseSensitive: this.options.caseSensitive,
      maxResults: this.options.maxResults || 10,
    });

    this.renderResults(results, query);
  }

  private renderResults(results: Document[], query: string): void {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="mdv-search-no-results">
          No results found for "${this.escapeHtml(query)}"
        </div>
      `;
      this.showResults();
      return;
    }

    const resultsHtml = results
      .map((doc, index) => {
        const highlightedTitle = this.highlightQuery(doc.title, query);
        const description = doc.description ? this.highlightQuery(doc.description, query) : '';
        const tags = doc.tags
          ? doc.tags
              .map(tag => `<span class="mdv-search-tag">${this.escapeHtml(tag)}</span>`)
              .join('')
          : '';

        return `
        <div class="mdv-search-result ${index === 0 ? 'active' : ''}" data-doc-id="${this.escapeHtml(doc.id)}">
          <div class="mdv-search-result-title">${highlightedTitle}</div>
          ${description ? `<div class="mdv-search-result-description">${description}</div>` : ''}
          ${tags ? `<div class="mdv-search-result-tags">${tags}</div>` : ''}
          ${doc.category ? `<div class="mdv-search-result-category">${this.escapeHtml(doc.category)}</div>` : ''}
        </div>
      `;
      })
      .join('');

    this.searchResults.innerHTML = resultsHtml;

    // Add click handlers
    this.searchResults.querySelectorAll('.mdv-search-result').forEach(result => {
      result.addEventListener('click', () => this.selectResult(result));
      result.addEventListener('mouseenter', () => {
        this.searchResults
          ?.querySelectorAll('.mdv-search-result')
          .forEach(r => r.classList.remove('active'));
        result.classList.add('active');
      });
    });

    this.showResults();
  }

  private highlightQuery(text: string, query: string): string {
    if (!query) {
      return this.escapeHtml(text);
    }

    // Default to case-insensitive if not explicitly set to true
    const flags = this.options.caseSensitive === true ? 'g' : 'gi';
    const regex = new RegExp(`(${this.escapeRegex(query)})`, flags);
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  private showResults(): void {
    if (this.searchResults) {
      this.searchResults.style.display = 'block';
    }
  }

  private hideResults(): void {
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Public method to clear search
  clearSearch(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.currentQuery = '';
    this.hideResults();
  }

  // Public method to set documents reference for selection
  setDocuments(documents: Document[]): void {
    this.findDocumentById = (docId: string) => {
      return documents.find(doc => doc.id === docId) || null;
    };
  }

  // Cleanup method
  destroy(): void {
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearchInput.bind(this));
      this.searchInput.removeEventListener('keydown', this.handleKeyDown.bind(this));
      this.searchInput.removeEventListener('focus', this.handleFocus.bind(this));
      this.searchInput.removeEventListener('blur', this.handleBlur.bind(this));
    }
  }
}
