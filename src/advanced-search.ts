import { Document, AdvancedSearchOptions } from './types';
import { SearchIndex, debounce } from './performance';

export interface SearchResult {
  document: Document;
  score: number;
  highlights: SearchHighlight[];
}

export interface SearchHighlight {
  field: 'title' | 'content' | 'description' | 'tags';
  text: string;
  position: number;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
}

/**
 * Advanced search manager with filtering and highlighting
 */
export class AdvancedSearchManager {
  private documents: Document[];
  private searchIndex: SearchIndex;
  private options: AdvancedSearchOptions;
  private searchHistory: SearchHistory[] = [];
  private debouncedSearch: (query: string) => void;

  constructor(documents: Document[], options: AdvancedSearchOptions = {}) {
    this.documents = documents;
    this.options = {
      enabled: true,
      caseSensitive: false,
      fuzzySearch: false,
      searchInTags: true,
      maxResults: 10,
      highlighting: true,
      searchHistory: true,
      maxHistoryItems: 10,
      ...options
    };

    this.searchIndex = new SearchIndex();
    this.buildIndex();

    // Create debounced search function
    this.debouncedSearch = debounce(
      (query: string) => this.performSearch(query),
      300
    );

    this.loadSearchHistory();
  }

  /**
   * Build search index from documents
   */
  private buildIndex(): void {
    this.documents.forEach(doc => {
      const indexData = {
        title: doc.title,
        content: doc.content || '',
        description: doc.description || '',
        tags: doc.tags?.join(' ') || '',
        category: doc.category || ''
      };
      
      this.searchIndex.add(doc.id, indexData);
    });
  }

  /**
   * Search documents with advanced options
   */
  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    // Get base results from index
    const indexResults = this.searchIndex.search(query);
    
    // Convert to SearchResult format
    let results: SearchResult[] = indexResults.map(result => {
      const doc = this.documents.find(d => d.id === result.id)!;
      return {
        document: doc,
        score: result.score,
        highlights: this.options.highlighting ? this.generateHighlights(doc, query) : []
      };
    });

    // Apply filters
    results = this.applyFilters(results);

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Limit results
    results = results.slice(0, this.options.maxResults);

    // Save to history
    if (this.options.searchHistory) {
      this.addToHistory(query, results.length);
    }

    return results;
  }

  /**
   * Perform debounced search
   */
  searchDebounced(query: string, callback: (results: SearchResult[]) => void): void {
    this.debouncedSearch = debounce(() => {
      const results = this.search(query);
      callback(results);
    }, 300);
    
    this.debouncedSearch(query);
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult[]): SearchResult[] {
    if (!this.options.filters) {
      return results;
    }

    const { categories, tags, dateRange } = this.options.filters;

    return results.filter(result => {
      const doc = result.document;

      // Filter by categories
      if (categories && categories.length > 0) {
        if (!doc.category || !categories.includes(doc.category)) {
          return false;
        }
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        if (!doc.tags || !doc.tags.some(tag => tags.includes(tag))) {
          return false;
        }
      }

      // Filter by date range (if document has a date property)
      if (dateRange && (doc as any).date) {
        const docDate = new Date((doc as any).date);
        if (dateRange.from && docDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && docDate > dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(doc: Document, query: string): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];
    const searchTerms = query.toLowerCase().split(/\s+/);

    // Helper function to find highlights in text
    const findHighlights = (text: string, field: SearchHighlight['field']) => {
      const lowerText = text.toLowerCase();
      
      searchTerms.forEach(term => {
        let position = lowerText.indexOf(term);
        while (position !== -1) {
          const contextStart = Math.max(0, position - 50);
          const contextEnd = Math.min(text.length, position + term.length + 50);
          const highlightText = text.substring(contextStart, contextEnd);
          
          highlights.push({
            field,
            text: highlightText,
            position
          });
          
          position = lowerText.indexOf(term, position + 1);
        }
      });
    };

    // Search in different fields
    findHighlights(doc.title, 'title');
    
    if (doc.description) {
      findHighlights(doc.description, 'description');
    }
    
    if (doc.content && highlights.length < 5) {
      findHighlights(doc.content, 'content');
    }
    
    if (doc.tags && this.options.searchInTags) {
      findHighlights(doc.tags.join(' '), 'tags');
    }

    // Limit number of highlights
    return highlights.slice(0, 5);
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchHistory[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  /**
   * Add to search history
   */
  private addToHistory(query: string, resultCount: number): void {
    // Remove duplicate queries
    this.searchHistory = this.searchHistory.filter(h => h.query !== query);

    // Add new entry
    this.searchHistory.unshift({
      query,
      timestamp: new Date(),
      resultCount
    });

    // Limit history size
    if (this.searchHistory.length > this.options.maxHistoryItems!) {
      this.searchHistory = this.searchHistory.slice(0, this.options.maxHistoryItems);
    }

    this.saveSearchHistory();
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    if (typeof window === 'undefined' || !this.options.searchHistory) {
      return;
    }

    try {
      const saved = localStorage.getItem('mdv-search-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.searchHistory = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }

  /**
   * Save search history to localStorage
   */
  private saveSearchHistory(): void {
    if (typeof window === 'undefined' || !this.options.searchHistory) {
      return;
    }

    try {
      localStorage.setItem('mdv-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Get search suggestions based on history and document titles
   */
  getSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Add matching history items
    this.searchHistory.forEach(item => {
      if (item.query.toLowerCase().includes(lowerQuery)) {
        suggestions.push(item.query);
      }
    });

    // Add matching document titles
    this.documents.forEach(doc => {
      if (doc.title.toLowerCase().includes(lowerQuery) && 
          !suggestions.includes(doc.title)) {
        suggestions.push(doc.title);
      }
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Update documents and rebuild index
   */
  updateDocuments(documents: Document[]): void {
    this.documents = documents;
    this.searchIndex = new SearchIndex();
    this.buildIndex();
  }

  /**
   * Render search UI component
   */
  static renderSearchUI(options: AdvancedSearchOptions): string {
    return `
      <div class="mdv-advanced-search">
        <div class="mdv-search-input-wrapper">
          <input 
            type="search" 
            class="mdv-search-input" 
            placeholder="${options.placeholder || 'Search documentation...'}"
            autocomplete="off"
          >
          <button class="mdv-search-clear" aria-label="Clear search">×</button>
          <div class="mdv-search-suggestions"></div>
        </div>
        
        ${options.filters ? `
          <div class="mdv-search-filters">
            <button class="mdv-filter-toggle">Filters</button>
            <div class="mdv-filter-panel">
              ${options.filters.categories ? `
                <div class="mdv-filter-group">
                  <label>Categories</label>
                  <select multiple class="mdv-filter-categories">
                    ${options.filters.categories.map(cat => 
                      `<option value="${cat}">${cat}</option>`
                    ).join('')}
                  </select>
                </div>
              ` : ''}
              
              ${options.filters.tags ? `
                <div class="mdv-filter-group">
                  <label>Tags</label>
                  <select multiple class="mdv-filter-tags">
                    ${options.filters.tags.map(tag => 
                      `<option value="${tag}">${tag}</option>`
                    ).join('')}
                  </select>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="mdv-search-results"></div>
      </div>
    `;
  }

  /**
   * Render search result
   */
  static renderSearchResult(result: SearchResult): string {
    const doc = result.document;
    
    return `
      <div class="mdv-search-result" data-doc-id="${doc.id}">
        <h3 class="mdv-search-result-title">
          ${result.highlights.find(h => h.field === 'title') 
            ? highlightText(doc.title, result.highlights.find(h => h.field === 'title')!.text)
            : doc.title}
        </h3>
        
        ${doc.description ? `
          <p class="mdv-search-result-description">
            ${result.highlights.find(h => h.field === 'description')
              ? highlightText(doc.description, result.highlights.find(h => h.field === 'description')!.text)
              : doc.description}
          </p>
        ` : ''}
        
        ${result.highlights.filter(h => h.field === 'content').map(highlight => `
          <p class="mdv-search-result-excerpt">
            ...${highlightText(highlight.text, highlight.text)}...
          </p>
        `).join('')}
        
        <div class="mdv-search-result-meta">
          ${doc.category ? `<span class="mdv-search-result-category">${doc.category}</span>` : ''}
          ${doc.tags?.map(tag => `<span class="mdv-search-result-tag">${tag}</span>`).join('') || ''}
        </div>
      </div>
    `;
  }
}

/**
 * Highlight search terms in text
 */
function highlightText(text: string, searchText: string): string {
  // This is a simplified version - in production, use a proper highlighting library
  const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}