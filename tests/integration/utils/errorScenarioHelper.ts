/**
 * Error Scenario Helper
 *
 * Utilities for testing error scenarios and validating error UI in integration tests.
 */

export interface ErrorScenario {
  type: string;
  description: string;
  setup(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
  expectedError?: string;
  expectedRecovery?: boolean;
}

export interface ErrorUIExpectations {
  hasErrorMessage?: boolean;
  errorMessageContains?: string;
  hasRetryButton?: boolean;
  hasErrorClass?: boolean;
  errorClassName?: string;
  isRecoverable?: boolean;
}

export const createErrorScenarios = {
  containerNotFound: (): ErrorScenario => ({
    type: 'container-not-found',
    description: 'Container element does not exist in DOM',
    setup: async () => {
      // Remove any existing containers that might match the selector
      const existing = document.querySelector('#nonexistent-container');
      if (existing) {
        existing.remove();
      }
    },
    expectedError: 'Container element "#nonexistent-container" not found',
    expectedRecovery: false,
  }),

  containerInvalid: (): ErrorScenario => ({
    type: 'container-invalid',
    description: 'Container element is not suitable for content',
    setup: async () => {
      // Create an unsuitable container (script tag)
      const script = document.createElement('script');
      script.id = 'invalid-container';
      document.body.appendChild(script);
    },
    cleanup: async () => {
      const script = document.getElementById('invalid-container');
      if (script) script.remove();
    },
    expectedError: 'Container element is not suitable',
    expectedRecovery: false,
  }),

  configurationError: (): ErrorScenario => ({
    type: 'configuration-error',
    description: 'Configuration loading fails',
    setup: async () => {
      // Mock fetch to return invalid config
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Failed to load configuration');
      };
      // Store original for cleanup
      (global as any).__originalFetch = originalFetch;
    },
    cleanup: async () => {
      // Restore original fetch
      if ((global as any).__originalFetch) {
        global.fetch = (global as any).__originalFetch;
        delete (global as any).__originalFetch;
      }
    },
    expectedError: 'Failed to load configuration',
    expectedRecovery: true,
  }),

  documentLoadError: (): ErrorScenario => ({
    type: 'document-load-error',
    description: 'Document loading fails during initialization',
    setup: async () => {
      // This would typically be set up by mocking document loading
      console.log('Setting up document load error scenario');
    },
    expectedError: 'Failed to load documents',
    expectedRecovery: true,
  }),
};

export async function waitForErrorUI(container: HTMLElement, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let checkCount = 0;

    const check = () => {
      checkCount++;

      // Look for common error UI indicators including the actual error div structure
      const errorElement =
        container.querySelector('.error-container') ||
        container.querySelector('.error-message') ||
        container.querySelector('[class*="error"]') ||
        container.querySelector('div[style*="color: #d73a49"]') || // Match the actual error styling
        container.querySelector('h3') || // Any h3 might be the error heading
        (container.textContent?.includes('Error:') ? container : null) ||
        (container.textContent?.includes('Failed') ? container : null) ||
        (container.textContent?.includes('Setup Required') ? container : null);

      if (errorElement) {
        resolve(errorElement as HTMLElement);
        return;
      }

      // Add safety check to prevent infinite loops
      if (Date.now() - startTime > timeout || checkCount > timeout / 100) {
        reject(new Error(`Error UI not found within ${timeout}ms after ${checkCount} checks`));
        return;
      }

      setTimeout(check, 100);
    };

    check();
  });
}

export function validateErrorUI(
  errorElement: HTMLElement,
  expectations: ErrorUIExpectations
): void {
  if (expectations.hasErrorMessage) {
    const hasMessage = errorElement.textContent && errorElement.textContent.trim().length > 0;
    if (!hasMessage) {
      throw new Error('Expected error message but none found');
    }

    if (expectations.errorMessageContains) {
      const containsExpected = errorElement.textContent.includes(expectations.errorMessageContains);
      if (!containsExpected) {
        throw new Error(
          `Expected error message to contain "${expectations.errorMessageContains}" but got: ${errorElement.textContent}`
        );
      }
    }
  }

  if (expectations.hasRetryButton) {
    const retryButton = errorElement.querySelector(
      'button[data-retry], .retry-button, button[class*="retry"]'
    );
    if (!retryButton) {
      throw new Error('Expected retry button but none found');
    }
  }

  if (expectations.hasErrorClass && expectations.errorClassName) {
    if (!errorElement.classList.contains(expectations.errorClassName)) {
      throw new Error(
        `Expected element to have class "${expectations.errorClassName}" but classes are: ${Array.from(errorElement.classList).join(', ')}`
      );
    }
  }
}

export async function triggerErrorScenario(scenario: ErrorScenario): Promise<void> {
  if (scenario.setup) {
    await scenario.setup();
  }
}

export function createContainerErrorScenario(containerId: string): ErrorScenario {
  return {
    type: 'container-error',
    description: `Container with ID "${containerId}" causes an error`,
    setup: async () => {
      // Remove container if it exists
      const existing = document.getElementById(containerId);
      if (existing) {
        existing.remove();
      }
    },
    expectedError: `Container element "#${containerId}" not found`,
    expectedRecovery: false,
  };
}

export function createConfigErrorScenario(configError: string): ErrorScenario {
  return {
    type: 'config-error',
    description: `Configuration error: ${configError}`,
    setup: async () => {
      // This would be implemented based on specific config error type
      console.log(`Setting up config error scenario: ${configError}`);
    },
    expectedError: configError,
    expectedRecovery: true,
  };
}

/**
 * Inspects error HTML and returns detailed information about the error element
 * Used for debugging and validation in integration tests
 */
export function inspectErrorHTML(errorElement: HTMLElement): {
  textContent: string;
  outerHTML: string;
  classList: string[];
  styles: Record<string, string>;
  childCount: number;
  hasLinks: boolean;
  hasCodeBlocks: boolean;
  hasHeadings: boolean;
} {
  if (!errorElement) {
    throw new Error('inspectErrorHTML: errorElement is required');
  }

  // Get computed styles
  const computedStyles = window.getComputedStyle(errorElement);
  const styles: Record<string, string> = {};

  // Extract key style properties
  const styleProps = [
    'display',
    'visibility',
    'opacity',
    'color',
    'background-color',
    'border',
    'padding',
    'margin',
  ];
  for (const prop of styleProps) {
    styles[prop] = computedStyles.getPropertyValue(prop);
  }

  return {
    textContent: errorElement.textContent || '',
    outerHTML: errorElement.outerHTML,
    classList: Array.from(errorElement.classList),
    styles,
    childCount: errorElement.children.length,
    hasLinks: errorElement.querySelectorAll('a[href]').length > 0,
    hasCodeBlocks: errorElement.querySelectorAll('code, pre').length > 0,
    hasHeadings: errorElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
  };
}
