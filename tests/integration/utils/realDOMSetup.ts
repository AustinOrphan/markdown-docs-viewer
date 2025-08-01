/**
 * Real DOM Setup Utilities
 *
 * Provides utilities for setting up real DOM environments for integration testing.
 * No mocking - uses actual browser APIs and DOM manipulation.
 */

export interface TestContainer {
  element: HTMLElement;
  id: string;
  cleanup: () => void;
}

export interface DOMTestEnvironment {
  containers: TestContainer[];
  cleanup: () => void;
}

/**
 * Sets up a real DOM environment for testing
 */
export function setupRealDOM(): DOMTestEnvironment {
  const containers: TestContainer[] = [];

  // Ensure we have a clean document body
  if (typeof document !== 'undefined') {
    // Clear any existing test containers
    const existingContainers = document.querySelectorAll('[data-test-container]');
    existingContainers.forEach(container => container.remove());
  }

  const cleanup = () => {
    containers.forEach(container => container.cleanup());
    containers.length = 0;

    // Final cleanup of any remaining test elements
    if (typeof document !== 'undefined') {
      const testElements = document.querySelectorAll('[data-test-container]');
      testElements.forEach(element => element.remove());
    }
  };

  return { containers, cleanup };
}

/**
 * Creates a real DOM container for testing
 */
export function createRealContainer(
  id: string = `test-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  tagName: string = 'div'
): TestContainer {
  if (typeof document === 'undefined') {
    throw new Error('createRealContainer requires a DOM environment');
  }

  const element = document.createElement(tagName);
  element.id = id;
  element.setAttribute('data-test-container', 'true');

  // Add to document body
  document.body.appendChild(element);

  const cleanup = () => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  return { element, id, cleanup };
}

/**
 * Creates a container with specific attributes for testing
 */
export function createContainerWithAttributes(
  id: string,
  attributes: Record<string, string> = {},
  styles: Record<string, string> = {}
): TestContainer {
  const container = createRealContainer(id);

  // Apply attributes
  Object.entries(attributes).forEach(([key, value]) => {
    container.element.setAttribute(key, value);
  });

  // Apply styles
  Object.entries(styles).forEach(([key, value]) => {
    container.element.style.setProperty(key, value);
  });

  return container;
}

/**
 * Waits for an element to appear in the DOM
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000,
  container: Element = document.body
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const element = container.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
            return;
          }
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Waits for an element to disappear from the DOM
 */
export function waitForElementToDisappear(
  selector: string,
  timeout: number = 5000,
  container: Element = document.body
): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector);
    if (!element) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector);
      if (!element) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(`Element with selector "${selector}" did not disappear within ${timeout}ms`)
      );
    }, timeout);
  });
}

/**
 * Simulates user interaction with real events
 */
export function simulateUserInteraction(element: Element, eventType: string, options: any = {}) {
  const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
  element.dispatchEvent(event);
}

/**
 * Simulates click with real mouse event
 */
export function simulateClick(element: Element, options: Record<string, any> = {}) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
    ...options,
  });
  element.dispatchEvent(event);
}

/**
 * Gets computed styles of an element
 */
export function getComputedStyles(element: Element): CSSStyleDeclaration {
  if (typeof window === 'undefined' || !window.getComputedStyle) {
    throw new Error('getComputedStyles requires a browser environment');
  }
  return window.getComputedStyle(element);
}

/**
 * Checks if an element is visible in the viewport
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Waits for container to have specific content
 */
export async function waitForContainerContent(
  container: HTMLElement,
  expectedContent?: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 50;
  const maxAttempts = Math.ceil(timeout / pollInterval);
  let attempts = 0;

  while (attempts < maxAttempts) {
    const innerHTML = container.innerHTML;

    if (expectedContent) {
      if (innerHTML.includes(expectedContent)) {
        return true;
      }
    } else {
      // Just check if container has any content
      if (innerHTML && innerHTML.trim() !== '') {
        return true;
      }
    }

    // Double-check timeout to prevent infinite loops
    if (Date.now() - startTime > timeout) {
      break;
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return false;
}

/**
 * Global DOM cleanup function for tests
 */
export function cleanupRealDOM(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Remove all test containers
  const testContainers = document.querySelectorAll('[data-test-container]');
  testContainers.forEach(container => container.remove());

  // Clear document body content (but preserve body itself)
  const children = Array.from(document.body.children);
  children.forEach(child => {
    // Only remove elements that look like test elements
    if (
      child.hasAttribute('data-test-container') ||
      child.id?.startsWith('test-') ||
      child.className?.includes('test-')
    ) {
      child.remove();
    }
  });

  // Clear any remaining innerHTML that might contain error messages
  if (
    document.body.innerHTML.includes('Setup Required') ||
    document.body.innerHTML.includes('Viewer Creation Failed')
  ) {
    document.body.innerHTML = '';
  }
}
