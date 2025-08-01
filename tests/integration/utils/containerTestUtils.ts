/**
 * Container Test Utilities
 *
 * Utilities for testing container validation and manipulation in integration tests.
 */

export interface ContainerTestOptions {
  id?: string;
  className?: string;
  innerHTML?: string;
  styles?: Record<string, string>;
}

export interface ContainerValidation {
  element: HTMLElement;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContainerTester {
  public element: HTMLElement;
  public id: string;

  constructor(options: ContainerTestOptions = {}) {
    const { id = `test-container-${Date.now()}`, className, innerHTML = '', styles = {} } = options;

    this.id = id;
    this.element = document.createElement('div');
    this.element.id = id;

    if (className) {
      this.element.className = className;
    }

    if (innerHTML) {
      this.element.innerHTML = innerHTML;
    }

    // Apply styles
    Object.entries(styles).forEach(([property, value]) => {
      this.element.style.setProperty(property, value);
    });

    // Add to DOM by default
    document.body.appendChild(this.element);
  }

  validate(): ContainerValidation {
    return validateContainer(this.element);
  }

  setContent(html: string): void {
    this.element.innerHTML = html;
  }

  addClass(className: string): void {
    this.element.classList.add(className);
  }

  removeClass(className: string): void {
    this.element.classList.remove(className);
  }

  hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  show(): void {
    this.element.style.display = '';
  }

  removeFromDOM(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  addToDOM(): void {
    if (!document.contains(this.element)) {
      document.body.appendChild(this.element);
    }
  }

  setDimensions(width: string, height: string): void {
    this.element.style.width = width;
    this.element.style.height = height;
  }

  async waitForContent(selector: string, timeout = 5000): Promise<HTMLElement> {
    const startTime = Date.now();
    const pollInterval = 50;
    const maxAttempts = Math.ceil(timeout / pollInterval);
    let attempts = 0;

    while (attempts < maxAttempts) {
      const element = this.element.querySelector(selector) as HTMLElement;
      if (element) {
        return element;
      }

      // Double-check timeout to prevent infinite loops
      if (Date.now() - startTime > timeout) {
        break;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `Element with selector "${selector}" not found within ${timeout}ms after ${attempts} attempts`
    );
  }

  simulateUserInteraction(selector: string, eventType: string): void {
    const element = this.element.querySelector(selector) as HTMLElement;
    if (element) {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    }
  }

  snapshot() {
    const rect = this.element.getBoundingClientRect();
    return {
      id: this.element.id,
      tagName: this.element.tagName,
      classList: Array.from(this.element.classList),
      innerHTML: this.element.innerHTML,
      dimensions: {
        width: rect.width,
        height: rect.height,
      },
      styles: {
        display: this.element.style.display,
        visibility: this.element.style.visibility,
        position: this.element.style.position,
      },
      inDOM: document.contains(this.element),
      attributes: Array.from(this.element.attributes).reduce(
        (acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        },
        {} as Record<string, string>
      ),
    };
  }

  cleanup(): void {
    this.removeFromDOM();
  }
}

export function validateContainer(element: HTMLElement): ContainerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if element exists
  if (!element) {
    errors.push('Container element is null or undefined');
    return { element, isValid: false, errors, warnings };
  }

  // Check if element is attached to DOM
  if (!document.contains(element)) {
    errors.push('Container element is not attached to the DOM');
  }

  // Check for unsuitable tag names
  const unsuitableTags = ['script', 'style', 'meta', 'link', 'title', 'head'];
  if (unsuitableTags.includes(element.tagName.toLowerCase())) {
    errors.push(
      `Container element "${element.tagName.toLowerCase()}" is not suitable for content display`
    );
  }

  // Check visibility
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === 'none') {
    warnings.push('Container element has display: none');
  }
  if (computedStyle.visibility === 'hidden') {
    warnings.push('Container element has visibility: hidden');
  }

  // Check dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    warnings.push('Container element has zero dimensions');
  }

  return {
    element,
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Creates a test container with the specified options
 * This is a convenience function that creates a ContainerTester instance
 */
export function createTestContainer(options: ContainerTestOptions = {}): ContainerTester {
  return new ContainerTester(options);
}

/**
 * Creates multiple test containers with the specified options array
 */
export function createMultipleContainers(optionsArray: ContainerTestOptions[]): ContainerTester[] {
  return optionsArray.map(options => new ContainerTester(options));
}
