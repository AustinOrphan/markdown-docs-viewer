import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchManager, createSearch } from '../src/search'
import { SearchOptions, Document } from '../src/types'
import { SearchIndex, debounce } from '../src/performance'

// Mock the performance module
vi.mock('../src/performance', () => ({
  SearchIndex: vi.fn().mockImplementation(() => ({
    updateIndex: vi.fn(),
    search: vi.fn().mockReturnValue([])
  })),
  debounce: vi.fn((fn, delay) => {
    const debounced = (...args: any[]) => {
      clearTimeout(debounced.timeout)
      debounced.timeout = setTimeout(() => fn(...args), delay)
    }
    debounced.timeout = null as any
    return debounced
  })
}))

describe('createSearch', () => {
  it('should create search HTML with default placeholder', () => {
    const html = createSearch({})
    
    expect(html).toContain('class="mdv-search"')
    expect(html).toContain('class="mdv-search-input"')
    expect(html).toContain('placeholder="Search documentation..."')
    expect(html).toContain('class="mdv-search-results"')
  })

  it('should create search HTML with custom placeholder', () => {
    const html = createSearch({ placeholder: 'Custom search...' })
    
    expect(html).toContain('placeholder="Custom search..."')
  })
})

describe('SearchManager', () => {
  let searchManager: SearchManager
  let mockSearchIndex: any
  let onDocumentSelect: any
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    
    // Setup DOM
    container = document.createElement('div')
    container.innerHTML = createSearch({})
    document.body.appendChild(container)
    
    // Setup mocks
    onDocumentSelect = vi.fn()
    mockSearchIndex = {
      updateIndex: vi.fn(),
      search: vi.fn().mockReturnValue([])
    }
    vi.mocked(SearchIndex).mockImplementation(() => mockSearchIndex)
    
    // Create search manager
    searchManager = new SearchManager({}, onDocumentSelect)
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const sm = new SearchManager({})
      expect(sm).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const options: SearchOptions = {
        searchInTags: true,
        fuzzySearch: true,
        caseSensitive: true,
        maxResults: 5,
        placeholder: 'Custom'
      }
      const sm = new SearchManager(options)
      expect(sm).toBeDefined()
    })

    it('should create debounced search function', () => {
      const sm = new SearchManager({})
      expect(debounce).toHaveBeenCalledWith(expect.any(Function), 300)
    })
  })

  describe('updateIndex', () => {
    it('should update search index with documents and content', () => {
      const documents: Document[] = [
        { id: 'doc1', title: 'Doc 1' },
        { id: 'doc2', title: 'Doc 2' }
      ]
      const contentCache = new Map([
        ['doc1', 'Content 1'],
        ['doc2', 'Content 2']
      ])
      
      searchManager.updateIndex(documents, contentCache)
      
      expect(mockSearchIndex.updateIndex).toHaveBeenCalledWith(documents, contentCache)
    })
  })

  describe('attachToDOM', () => {
    it('should attach event listeners to search input', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const addEventListenerSpy = vi.spyOn(input, 'addEventListener')
      
      searchManager.attachToDOM(container)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function))
    })

    it('should hide search results initially', () => {
      searchManager.attachToDOM(container)
      
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      expect(results.style.display).toBe('none')
    })

    it('should handle missing search container', () => {
      const emptyContainer = document.createElement('div')
      
      // Should not throw
      expect(() => searchManager.attachToDOM(emptyContainer)).not.toThrow()
    })
  })

  describe('Search input handling', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
    })

    it('should trigger search on input after 2 characters', async () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      
      input.value = 'te'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).toHaveBeenCalledWith('te', expect.any(Object))
    })

    it('should not trigger search for single character', async () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      
      input.value = 't'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).not.toHaveBeenCalled()
    })

    it('should hide results when input is cleared', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      
      // First show results
      results.style.display = 'block'
      
      input.value = ''
      input.dispatchEvent(new Event('input'))
      
      expect(results.style.display).toBe('none')
    })

    it('should trim whitespace from query', async () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      
      input.value = '  test  '
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).toHaveBeenCalledWith('test', expect.any(Object))
    })
  })

  describe('Keyboard navigation', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
      
      // Setup search results
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      results.innerHTML = `
        <div class="mdv-search-result" data-doc-id="doc1">Result 1</div>
        <div class="mdv-search-result" data-doc-id="doc2">Result 2</div>
        <div class="mdv-search-result" data-doc-id="doc3">Result 3</div>
      `
      results.style.display = 'block'
    })

    it('should navigate down through results', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelectorAll('.mdv-search-result')
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      expect(results[0].classList.contains('active')).toBe(true)
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      expect(results[0].classList.contains('active')).toBe(false)
      expect(results[1].classList.contains('active')).toBe(true)
    })

    it('should navigate up through results', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelectorAll('.mdv-search-result')
      
      // Start at bottom
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      expect(results[2].classList.contains('active')).toBe(true)
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      expect(results[1].classList.contains('active')).toBe(true)
    })

    it('should wrap around when navigating', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelectorAll('.mdv-search-result')
      
      // Navigate to last item
      results[2].classList.add('active')
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      expect(results[0].classList.contains('active')).toBe(true)
    })

    it('should select result on Enter key', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelectorAll('.mdv-search-result')
      
      searchManager.setDocuments([
        { id: 'doc1', title: 'Doc 1' }
      ])
      
      results[0].classList.add('active')
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      
      expect(onDocumentSelect).toHaveBeenCalledWith({ id: 'doc1', title: 'Doc 1' })
    })

    it('should hide results on Escape key', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      const blurSpy = vi.spyOn(input, 'blur')
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      
      expect(results.style.display).toBe('none')
      expect(blurSpy).toHaveBeenCalled()
    })
  })

  describe('Search results rendering', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
    })

    it('should render search results', async () => {
      const searchResults: Document[] = [
        { id: 'doc1', title: 'Test Document', description: 'A test doc' },
        { id: 'doc2', title: 'Another Test', tags: ['test', 'demo'] }
      ]
      mockSearchIndex.search.mockReturnValue(searchResults)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      const results = container.querySelectorAll('.mdv-search-result')
      expect(results).toHaveLength(2)
      expect(results[0].classList.contains('active')).toBe(true)
      expect(results[0].getAttribute('data-doc-id')).toBe('doc1')
    })

    it('should render no results message', async () => {
      mockSearchIndex.search.mockReturnValue([])
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'nonexistent'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      const noResults = container.querySelector('.mdv-search-no-results')
      expect(noResults).toBeTruthy()
      expect(noResults?.textContent).toContain('No results found for "nonexistent"')
    })

    it('should highlight search query in results', async () => {
      const searchResults: Document[] = [
        { id: 'doc1', title: 'Test Document' }
      ]
      mockSearchIndex.search.mockReturnValue(searchResults)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      const resultTitle = container.querySelector('.mdv-search-result-title')
      // Check for case-insensitive highlighting
      expect(resultTitle?.innerHTML).toContain('<mark>')
      expect(resultTitle?.innerHTML).toContain('</mark>')
    })

    it('should render document with all fields', async () => {
      const searchResults: Document[] = [
        {
          id: 'doc1',
          title: 'Test Document',
          description: 'Test description',
          tags: ['tag1', 'tag2'],
          category: 'Testing'
        }
      ]
      mockSearchIndex.search.mockReturnValue(searchResults)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      const result = container.querySelector('.mdv-search-result')
      expect(result?.querySelector('.mdv-search-result-description')).toBeTruthy()
      expect(result?.querySelector('.mdv-search-result-tags')).toBeTruthy()
      expect(result?.querySelector('.mdv-search-result-category')).toBeTruthy()
    })
  })

  describe('Focus and blur handling', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
    })

    it('should perform search on focus if query exists', async () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      
      // Set query first
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      await vi.runAllTimersAsync()
      
      mockSearchIndex.search.mockClear()
      
      // Focus again
      input.dispatchEvent(new Event('focus'))
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).toHaveBeenCalled()
    })

    it('should hide results on blur with delay', async () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      results.style.display = 'block'
      
      input.dispatchEvent(new Event('blur'))
      
      // Results should still be visible immediately
      expect(results.style.display).toBe('block')
      
      // Wait for delay
      await vi.advanceTimersByTime(150)
      
      expect(results.style.display).toBe('none')
    })
  })

  describe('Public methods', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
    })

    it('should clear search', () => {
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      
      input.value = 'test'
      results.style.display = 'block'
      
      searchManager.clearSearch()
      
      expect(input.value).toBe('')
      expect(results.style.display).toBe('none')
    })

    it('should set documents for selection', async () => {
      const documents: Document[] = [
        { id: 'doc1', title: 'Doc 1' },
        { id: 'doc2', title: 'Doc 2' }
      ]
      
      searchManager.setDocuments(documents)
      
      // Mock search results to include the document
      mockSearchIndex.search.mockReturnValue([documents[0]])
      
      // Trigger search to render results with proper event handlers
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'doc'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      // Now click the result
      const result = container.querySelector('.mdv-search-result') as HTMLElement
      result.click()
      
      expect(onDocumentSelect).toHaveBeenCalledWith(documents[0])
    })
  })

  describe('destroy', () => {
    it('should remove event listeners', () => {
      searchManager.attachToDOM(container)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      const removeEventListenerSpy = vi.spyOn(input, 'removeEventListener')
      
      searchManager.destroy()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })

  describe('Search options', () => {
    it('should pass search options to index', async () => {
      const options: SearchOptions = {
        searchInTags: true,
        fuzzySearch: true,
        caseSensitive: true,
        maxResults: 5
      }
      
      searchManager = new SearchManager(options, onDocumentSelect)
      searchManager.attachToDOM(container)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).toHaveBeenCalledWith('test', {
        searchInTags: true,
        fuzzySearch: true,
        caseSensitive: true,
        maxResults: 5
      })
    })

    it('should use default maxResults if not specified', async () => {
      searchManager = new SearchManager({}, onDocumentSelect)
      searchManager.attachToDOM(container)
      
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      
      await vi.runAllTimersAsync()
      
      expect(mockSearchIndex.search).toHaveBeenCalledWith('test', expect.objectContaining({
        maxResults: 10
      }))
    })
  })

  describe('Mouse interactions', () => {
    beforeEach(() => {
      searchManager.attachToDOM(container)
      
      const results = container.querySelector('.mdv-search-results') as HTMLElement
      results.innerHTML = `
        <div class="mdv-search-result" data-doc-id="doc1">Result 1</div>
        <div class="mdv-search-result" data-doc-id="doc2">Result 2</div>
      `
      
      // Mock search results to add event listeners
      const searchResults: Document[] = [
        { id: 'doc1', title: 'Result 1' },
        { id: 'doc2', title: 'Result 2' }
      ]
      mockSearchIndex.search.mockReturnValue(searchResults)
      
      // Trigger search to attach event listeners
      const input = container.querySelector('.mdv-search-input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input'))
      vi.runAllTimers()
    })

    it('should activate result on mouse enter', () => {
      const results = container.querySelectorAll('.mdv-search-result')
      
      results[1].dispatchEvent(new Event('mouseenter'))
      
      expect(results[0].classList.contains('active')).toBe(false)
      expect(results[1].classList.contains('active')).toBe(true)
    })

    it('should select result on click', () => {
      searchManager.setDocuments([
        { id: 'doc1', title: 'Result 1' },
        { id: 'doc2', title: 'Result 2' }
      ])
      
      const results = container.querySelectorAll('.mdv-search-result')
      results[0].click()
      
      expect(onDocumentSelect).toHaveBeenCalledWith({ id: 'doc1', title: 'Result 1' })
    })
  })
})