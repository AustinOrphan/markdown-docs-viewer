import { vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock global objects that may not be available in test environment
Object.defineProperty(global, 'ResizeObserver', {
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
    root: null,
    rootMargin: '0px',
    thresholds: [0]
  })),
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scroll methods
Object.defineProperty(Element.prototype, 'scrollTo', {
  value: vi.fn(),
})

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
})

// Mock requestAnimationFrame
Object.defineProperty(global, 'requestAnimationFrame', {
  value: vi.fn().mockImplementation(cb => setTimeout(cb, 16)),
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: vi.fn().mockImplementation(id => clearTimeout(id)),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
Object.defineProperty(global, 'fetch', {
  value: vi.fn(),
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})

// Mock console methods to avoid noise in tests (optional)
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up DOM
  if (document.body) document.body.innerHTML = ''
  if (document.head) document.head.innerHTML = ''
})

// Global test utilities
export const createMockElement = (tag: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  return element
}

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const mockConsole = () => {
  const originalConsole = { ...console }
  
  const mockMethods = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
  
  Object.assign(console, mockMethods)
  
  return {
    restore: () => Object.assign(console, originalConsole),
    ...mockMethods,
  }
}