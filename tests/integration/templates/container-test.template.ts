/**
 * Container Integration Test Template
 *
 * Template for testing container-related error scenarios in real DOM environment.
 * This template provides a complete structure for container testing with real DOM manipulation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
<<<<<<< Updated upstream
import { setupRealDOM, DOMTestEnvironment } from '../utils/realDOMSetup';
import {
  createErrorScenarios,
  waitForErrorUI,
  validateErrorUI,
} from '../utils/errorScenarioHelper';
import { ContainerTester, validateContainer } from '../utils/containerTestUtils';
=======
import { 
  setupRealDOM, 
  createRealContainer, 
  waitForElement,
  DOMTestEnvironment,
  TestContainer 
} from '../utils/realDOMSetup';
import { 
  createErrorScenarios, 
  waitForErrorUI, 
  validateErrorUI,
  ErrorUIExpectations,
  triggerErrorScenario 
} from '../utils/errorScenarioHelper';
import { 
  ContainerTester, 
  validateContainer,
  ContainerTestOptions 
} from '../utils/containerTestUtils';
>>>>>>> Stashed changes

/**
 * Template for container integration tests
 * Copy this template and customize for specific error scenarios
 */
describe('Container Integration Tests Template', () => {
  let domEnv: DOMTestEnvironment;
  let containerTester: ContainerTester;

  beforeEach(() => {
<<<<<<< Updated upstream
    // Setup real DOM environment with proper cleanup tracking
=======
    // Setup real DOM environment with proper cleanup tracking  
>>>>>>> Stashed changes
    domEnv = setupRealDOM();
  });

  afterEach(() => {
    // Cleanup all test containers and DOM modifications
    if (containerTester) {
      containerTester.cleanup();
    }
    domEnv.cleanup();
  });

  describe('Container Not Found Scenarios', () => {
    it('should handle missing container element', async () => {
      // Create error scenario for container not found
      const scenario = createErrorScenarios.containerNotFound();
<<<<<<< Updated upstream

      // Setup scenario
      await scenario.setup();

      // Expected error UI characteristics for this scenario:
      // - hasErrorMessage: true
      // - errorMessageContains: 'not found'
      // - hasErrorClass: true
      // - errorClassName: 'error-container'
=======
      
      // Setup scenario
      await scenario.setup();
      
      // Expected error UI characteristics
      const expectations: ErrorUIExpectations = {
        hasErrorMessage: true,
        errorMessageContains: 'not found',
        hasErrorClass: true,
        errorClassName: 'error-container'
      };
>>>>>>> Stashed changes

      // This is a template - actual implementation should:
      // 1. Try to initialize viewer with non-existent container
      // 2. Wait for error UI to appear
      // 3. Validate error message and UI structure
      // 4. Test error recovery if applicable
<<<<<<< Updated upstream

=======
      
>>>>>>> Stashed changes
      expect(scenario.type).toBe('container-not-found');
      expect(scenario.description).toContain('not exist');
    });

    it('should handle invalid container selector', async () => {
      // Create container with problematic selector characters
      containerTester = new ContainerTester({
        id: 'container-with-special:chars@invalid',
<<<<<<< Updated upstream
        className: 'test-container',
      });

      const validation = containerTester.validate();

=======
        className: 'test-container'
      });

      const validation = containerTester.validate();
      
>>>>>>> Stashed changes
      // Validate container state
      expect(validation.element).toBeDefined();
      expect(validation.isValid).toBe(true); // ID is set correctly despite special chars
    });
  });

  describe('Container Type Validation', () => {
    it('should reject unsuitable container elements', async () => {
      // Create unsuitable container elements
      const unsuitableElements = ['script', 'style', 'meta', 'link'];
<<<<<<< Updated upstream

=======
      
>>>>>>> Stashed changes
      for (const tagName of unsuitableElements) {
        const element = document.createElement(tagName);
        element.id = `${tagName}-container`;
        document.body.appendChild(element);
<<<<<<< Updated upstream

        const validation = validateContainer(element);

=======
        
        const validation = validateContainer(element);
        
>>>>>>> Stashed changes
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          expect.stringContaining(`"${tagName}" is not suitable`)
        );
<<<<<<< Updated upstream

=======
        
>>>>>>> Stashed changes
        // Cleanup
        element.remove();
      }
    });

    it('should validate suitable container elements', async () => {
      const suitableElements = ['div', 'section', 'article', 'main'];
<<<<<<< Updated upstream

=======
      
>>>>>>> Stashed changes
      for (const tagName of suitableElements) {
        const element = document.createElement(tagName);
        element.id = `${tagName}-container`;
        document.body.appendChild(element);
<<<<<<< Updated upstream

        const validation = validateContainer(element);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);

=======
        
        const validation = validateContainer(element);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
>>>>>>> Stashed changes
        // Cleanup
        element.remove();
      }
    });
  });

  describe('Container State Changes', () => {
    it('should handle container visibility changes', async () => {
      containerTester = new ContainerTester({
        id: 'visibility-test-container',
<<<<<<< Updated upstream
        styles: { width: '100px', height: '100px' },
=======
        styles: { width: '100px', height: '100px' }
>>>>>>> Stashed changes
      });

      // Test initial visible state
      let validation = containerTester.validate();
      expect(validation.isValid).toBe(true);

      // Hide container
      containerTester.hide();
      validation = containerTester.validate();
<<<<<<< Updated upstream
      expect(validation.warnings).toContain(expect.stringContaining('display: none'));
=======
      expect(validation.warnings).toContain(
        expect.stringContaining('display: none')
      );
>>>>>>> Stashed changes

      // Show container again
      containerTester.show();
      validation = containerTester.validate();
      // Should not have display: none warning anymore
      expect(validation.warnings.filter(w => w.includes('display: none'))).toHaveLength(0);
    });

    it('should handle container DOM removal and restoration', async () => {
      containerTester = new ContainerTester({
<<<<<<< Updated upstream
        id: 'removal-test-container',
=======
        id: 'removal-test-container'
>>>>>>> Stashed changes
      });

      // Verify container is in DOM
      expect(document.contains(containerTester.element)).toBe(true);

      // Remove from DOM
      containerTester.removeFromDOM();
      expect(document.contains(containerTester.element)).toBe(false);

      // Validate removed state
      const validation = validateContainer(containerTester.element);
      expect(validation.errors).toContain('not attached to the DOM');

      // Restore to DOM
      containerTester.addToDOM();
      expect(document.contains(containerTester.element)).toBe(true);
    });
  });

  describe('Container Content Validation', () => {
    it('should wait for and validate container content', async () => {
      containerTester = new ContainerTester({
<<<<<<< Updated upstream
        id: 'content-test-container',
=======
        id: 'content-test-container'
>>>>>>> Stashed changes
      });

      // Add content asynchronously (simulating viewer initialization)
      setTimeout(() => {
        containerTester.setContent('<div class="viewer-content">Loaded content</div>');
      }, 100);

      // Wait for content to appear
      const contentElement = await containerTester.waitForContent('.viewer-content', 2000);
<<<<<<< Updated upstream

=======
      
>>>>>>> Stashed changes
      expect(contentElement).toBeDefined();
      expect(contentElement.textContent).toBe('Loaded content');
    });

    it('should handle content loading timeout', async () => {
      containerTester = new ContainerTester({
<<<<<<< Updated upstream
        id: 'timeout-test-container',
      });

      // Don't add any content - should timeout
      await expect(containerTester.waitForContent('.non-existent-content', 500)).rejects.toThrow(
        'not found within 500ms'
      );
=======
        id: 'timeout-test-container'
      });

      // Don't add any content - should timeout
      await expect(
        containerTester.waitForContent('.non-existent-content', 500)
      ).rejects.toThrow('not found within 500ms');
>>>>>>> Stashed changes
    });
  });

  describe('Container User Interaction', () => {
    it('should simulate user interactions with container content', async () => {
      containerTester = new ContainerTester({
        id: 'interaction-test-container',
<<<<<<< Updated upstream
        innerHTML: '<button class="test-button" data-clicked="false">Click me</button>',
=======
        innerHTML: '<button class="test-button" data-clicked="false">Click me</button>'
>>>>>>> Stashed changes
      });

      const button = containerTester.element.querySelector('.test-button') as HTMLElement;
      expect(button.getAttribute('data-clicked')).toBe('false');

      // Add click handler
      button.addEventListener('click', () => {
        button.setAttribute('data-clicked', 'true');
      });

      // Simulate user interaction
      containerTester.simulateUserInteraction('.test-button', 'click');

      expect(button.getAttribute('data-clicked')).toBe('true');
    });

    it('should handle multiple container instances', async () => {
      const containers = [
        new ContainerTester({ id: 'container-1', className: 'test-group' }),
        new ContainerTester({ id: 'container-2', className: 'test-group' }),
<<<<<<< Updated upstream
        new ContainerTester({ id: 'container-3', className: 'test-group' }),
=======
        new ContainerTester({ id: 'container-3', className: 'test-group' })
>>>>>>> Stashed changes
      ];

      // Verify all containers are created and have correct classes
      containers.forEach((container, index) => {
        expect(container.id).toBe(`container-${index + 1}`);
        expect(container.hasClass('test-group')).toBe(true);
        expect(document.contains(container.element)).toBe(true);
      });

      // Cleanup all containers
      containers.forEach(container => container.cleanup());
    });
  });

  describe('Error UI Integration', () => {
    it('should detect and validate error UI appearance', async () => {
      containerTester = new ContainerTester({
<<<<<<< Updated upstream
        id: 'error-ui-test-container',
=======
        id: 'error-ui-test-container'
>>>>>>> Stashed changes
      });

      // Simulate error condition by adding error content
      setTimeout(() => {
        containerTester.setContent(`
          <div class="error-container">
            <div class="error-message">Failed to load documentation</div>
            <button class="retry-button" data-retry>Try Again</button>
          </div>
        `);
      }, 100);

      // Wait for error UI to appear
      const errorElement = await waitForErrorUI(containerTester.element, 2000);

      // Validate error UI structure
<<<<<<< Updated upstream
      // Expected characteristics:
      // - hasErrorMessage: true
      // - errorMessageContains: 'Failed to load'
      // - hasRetryButton: true
      // - hasErrorClass: true
      // - errorClassName: 'error-container'

      validateErrorUI(errorElement, {
=======
      const expectations: ErrorUIExpectations = {
>>>>>>> Stashed changes
        hasErrorMessage: true,
        errorMessageContains: 'Failed to load',
        hasRetryButton: true,
        hasErrorClass: true,
<<<<<<< Updated upstream
        errorClassName: 'error-container',
      });
=======
        errorClassName: 'error-container'
      };

      validateErrorUI(errorElement, expectations);
>>>>>>> Stashed changes
    });
  });

  describe('Container Snapshot and State Tracking', () => {
    it('should capture and compare container snapshots', async () => {
      containerTester = new ContainerTester({
        id: 'snapshot-test-container',
        className: 'initial-state',
<<<<<<< Updated upstream
        styles: { width: '200px', height: '100px' },
      });

      // Take initial snapshot
      const initialSnapshot = containerTester.snapshot();

=======
        styles: { width: '200px', height: '100px' }
      });

      // Take initial snapshot  
      const initialSnapshot = containerTester.snapshot();
      
>>>>>>> Stashed changes
      expect(initialSnapshot.classList).toContain('initial-state');
      expect(initialSnapshot.dimensions.width).toBe(200);
      expect(initialSnapshot.dimensions.height).toBe(100);

      // Modify container
      containerTester.addClass('modified-state');
      containerTester.setDimensions('300px', '150px');
      containerTester.setContent('<p>Modified content</p>');

      // Take second snapshot
      const modifiedSnapshot = containerTester.snapshot();
<<<<<<< Updated upstream

=======
      
>>>>>>> Stashed changes
      expect(modifiedSnapshot.classList).toContain('modified-state');
      expect(modifiedSnapshot.innerHTML).toContain('Modified content');
      expect(modifiedSnapshot.dimensions.width).toBe(300);
      expect(modifiedSnapshot.dimensions.height).toBe(150);

      // Verify snapshots are different
      expect(initialSnapshot.innerHTML).not.toBe(modifiedSnapshot.innerHTML);
      expect(initialSnapshot.classList).not.toEqual(modifiedSnapshot.classList);
    });
  });
});
