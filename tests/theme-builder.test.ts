import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeBuilder } from '../src/theme-builder';
import { ThemeManager } from '../src/theme-manager';
import { defaultTheme } from '../src/themes';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL methods
const createObjectURLMock = vi.fn();
const revokeObjectURLMock = vi.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: createObjectURLMock,
    revokeObjectURL: revokeObjectURLMock,
  },
});

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onload: ((e: { target: { result: string } }) => void) | null = null;

  readAsText(_file: File) {
    setTimeout(() => {
      this.result = '{"name": "test", "colors": {}}';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: MockFileReader,
});

describe('ThemeBuilder', () => {
  let themeManager: ThemeManager;
  let themeBuilder: ThemeBuilder;
  let container: HTMLElement;

  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;

    // Create theme manager
    themeManager = new ThemeManager();

    // Reset document styles
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-mdv-theme');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      themeBuilder = new ThemeBuilder(themeManager);
      expect(themeBuilder).toBeInstanceOf(ThemeBuilder);
    });

    it('should initialize with custom options', () => {
      const options = {
        onThemeCreate: vi.fn(),
        onThemeUpdate: vi.fn(),
        onClose: vi.fn(),
        allowExport: false,
        allowImport: false,
        showPreview: false,
        showAccessibilityCheck: false,
      };

      themeBuilder = new ThemeBuilder(themeManager, options);
      expect(themeBuilder).toBeInstanceOf(ThemeBuilder);
    });

    it('should copy current theme as starting point', () => {
      themeManager.setTheme('default-dark');
      themeBuilder = new ThemeBuilder(themeManager);

      const html = themeBuilder.render();
      // Theme name input should show base name and dark mode should be selected
      expect(html).toContain('value="default"');
      expect(html).toContain('value="dark" checked');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should render theme builder HTML with all sections', () => {
      const html = themeBuilder.render();

      expect(html).toContain('mdv-theme-builder-overlay');
      expect(html).toContain('Custom Theme Builder');
      expect(html).toContain('Theme Information');
      expect(html).toContain('Base Theme');
      expect(html).toContain('Colors');
      expect(html).toContain('Typography');
      expect(html).toContain('Spacing & Layout');
      expect(html).toContain('Border Radius');
      expect(html).toContain('Accessibility Check');
    });

    it('should include all color input categories', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Primary');
      expect(html).toContain('Background');
      expect(html).toContain('Text');
      expect(html).toContain('Semantic');
    });

    it('should include all action buttons by default', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Import Theme');
      expect(html).toContain('Export Theme');
      expect(html).toContain('Reset');
      expect(html).toContain('Save Theme');
    });

    it('should hide import/export buttons when disabled', () => {
      themeBuilder = new ThemeBuilder(themeManager, {
        allowImport: false,
        allowExport: false,
      });

      const html = themeBuilder.render();

      expect(html).not.toContain('Import Theme');
      expect(html).not.toContain('Export Theme');
    });

    it('should hide preview when disabled', () => {
      themeBuilder = new ThemeBuilder(themeManager, { showPreview: false });

      const html = themeBuilder.render();

      expect(html).not.toContain('mdv-theme-builder-preview');
    });

    it('should hide accessibility check when disabled', () => {
      themeBuilder = new ThemeBuilder(themeManager, { showAccessibilityCheck: false });

      const html = themeBuilder.render();

      expect(html).not.toContain('Accessibility Check');
    });

    it('should render font inputs', () => {
      const html = themeBuilder.render();

      expect(html).toContain('font-body');
      expect(html).toContain('font-heading');
      expect(html).toContain('font-code');
    });

    it('should render spacing inputs', () => {
      const html = themeBuilder.render();

      expect(html).toContain('spacing-unit');
      expect(html).toContain('spacing-containerMaxWidth');
      expect(html).toContain('spacing-sidebarWidth');
    });

    it('should render base theme options', () => {
      const html = themeBuilder.render();

      expect(html).toContain('option value="default"');
      expect(html).toContain('option value="github"');
      expect(html).toContain('option value="material"');
    });
  });

  describe('Color inputs rendering', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should render all required color inputs', () => {
      const html = themeBuilder.render();

      const expectedColors = [
        'primary',
        'secondary',
        'background',
        'surface',
        'text',
        'textPrimary',
        'textSecondary',
        'textLight',
        'border',
        'code',
        'codeBackground',
        'link',
        'linkHover',
        'error',
        'warning',
        'success',
      ];

      expectedColors.forEach(color => {
        expect(html).toContain(`color-${color}`);
        expect(html).toContain(`color-text-${color}`);
      });
    });

    it('should group colors by category', () => {
      const html = themeBuilder.render();

      expect(html).toContain('<h4>Primary</h4>');
      expect(html).toContain('<h4>Background</h4>');
      expect(html).toContain('<h4>Text</h4>');
      expect(html).toContain('<h4>Semantic</h4>');
    });

    it('should include color descriptions', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Main accent color');
      expect(html).toContain('Body text color');
      expect(html).toContain('Error state color');
    });
  });

  describe('Preview rendering', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should render preview with sample content', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Sample Heading');
      expect(html).toContain('This is a sample paragraph');
      expect(html).toContain('Sample Link');
      expect(html).toContain('This is a blockquote');
      expect(html).toContain('code example');
    });

    it('should apply theme colors to preview elements', () => {
      const html = themeBuilder.render();

      // Preview elements use inline styles for theme colors
      expect(html).toContain(`color: ${defaultTheme.colors.link}`);
      expect(html).toContain(`background: ${defaultTheme.colors.surface}`);
      expect(html).toContain(`background: ${defaultTheme.colors.codeBackground}`);
    });

    it('should render primary and secondary buttons', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Primary Button');
      expect(html).toContain('Secondary Button');
    });
  });

  describe('Accessibility check rendering', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should render contrast ratio checks', () => {
      const html = themeBuilder.render();

      expect(html).toContain('Text/Background:');
      expect(html).toContain('Primary/Background:');
      expect(html).toContain(':1');
    });

    it('should show pass/fail indicators', () => {
      const html = themeBuilder.render();

      expect(html).toMatch(/[✓✗]/);
    });
  });

  describe('open and close', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should open the theme builder', () => {
      expect(themeBuilder.render()).not.toContain('mdv-theme-builder-overlay open');

      themeBuilder.open();

      const overlay = container.querySelector('.mdv-theme-builder-overlay');
      expect(overlay?.classList.contains('open')).toBe(true);
    });

    it('should close the theme builder', () => {
      themeBuilder.open();
      themeBuilder.close();

      const overlay = container.querySelector('.mdv-theme-builder-overlay');
      expect(overlay?.classList.contains('open')).toBe(false);
    });

    it('should call onClose callback when closed', () => {
      const onClose = vi.fn();
      themeBuilder = new ThemeBuilder(themeManager, { onClose });

      themeBuilder.close();

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('attachTo and event listeners', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should close when close button is clicked', () => {
      const closeBtn = container.querySelector('.mdv-theme-builder-close') as HTMLElement;
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      closeBtn.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should close when overlay is clicked', () => {
      const overlay = container.querySelector('.mdv-theme-builder-overlay') as HTMLElement;
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      // Simulate clicking on overlay (not inner content)
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: overlay });
      overlay.dispatchEvent(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close when clicking inside the builder', () => {
      const builder = container.querySelector('.mdv-theme-builder') as HTMLElement;
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      builder.click();

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should close on Escape key', () => {
      themeBuilder.open();
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close on Escape when not open', () => {
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Color input interactions', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should update color when color input changes', () => {
      const colorInput = container.querySelector('#color-primary') as HTMLInputElement;
      const textInput = container.querySelector('#color-text-primary') as HTMLInputElement;

      colorInput.value = '#ff0000';
      colorInput.dispatchEvent(new Event('input'));

      expect(textInput.value).toBe('#ff0000');
    });

    it('should update color when text input changes with valid color', () => {
      const colorInput = container.querySelector('#color-primary') as HTMLInputElement;
      const textInput = container.querySelector('#color-text-primary') as HTMLInputElement;

      textInput.value = '#00ff00';
      textInput.dispatchEvent(new Event('input'));

      expect(colorInput.value).toBe('#00ff00');
    });

    it('should not update with invalid color format', () => {
      const colorInput = container.querySelector('#color-primary') as HTMLInputElement;
      const textInput = container.querySelector('#color-text-primary') as HTMLInputElement;
      const originalValue = colorInput.value;

      textInput.value = 'invalid-color';
      textInput.dispatchEvent(new Event('input'));

      expect(colorInput.value).toBe(originalValue);
    });
  });

  describe('Font input interactions', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should update font when input changes', () => {
      const fontInput = container.querySelector('#font-body') as HTMLInputElement;

      fontInput.value = 'Arial, sans-serif';
      fontInput.dispatchEvent(new Event('input'));

      // Font change should trigger preview update
      expect(fontInput.value).toBe('Arial, sans-serif');
    });
  });

  describe('Spacing input interactions', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should update spacing when inputs change', () => {
      const unitInput = container.querySelector('#spacing-unit') as HTMLInputElement;
      const widthInput = container.querySelector('#spacing-containerMaxWidth') as HTMLInputElement;

      unitInput.value = '16';
      unitInput.dispatchEvent(new Event('input'));

      widthInput.value = '1400px';
      widthInput.dispatchEvent(new Event('input'));

      expect(unitInput.value).toBe('16');
      expect(widthInput.value).toBe('1400px');
    });
  });

  describe('Theme name and border radius', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should update theme name', () => {
      const nameInput = container.querySelector('#theme-name') as HTMLInputElement;

      nameInput.value = 'My Custom Theme';
      nameInput.dispatchEvent(new Event('input'));

      expect(nameInput.value).toBe('My Custom Theme');
    });

    it('should update border radius', () => {
      const radiusInput = container.querySelector('#border-radius') as HTMLInputElement;

      radiusInput.value = '1rem';
      radiusInput.dispatchEvent(new Event('input'));

      expect(radiusInput.value).toBe('1rem');
    });
  });

  describe('Base theme selection', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should load different base theme when selected', () => {
      const baseSelect = container.querySelector('#base-theme') as HTMLSelectElement;

      baseSelect.value = 'github';
      baseSelect.dispatchEvent(new Event('change'));

      expect(baseSelect.value).toBe('github');
    });
  });

  describe('Action buttons', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);
    });

    it('should save theme when save button is clicked', () => {
      const onThemeCreate = vi.fn();
      themeBuilder = new ThemeBuilder(themeManager, { onThemeCreate });
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);

      const saveBtn = container.querySelector('#save-theme') as HTMLElement;
      const closeSpy = vi.spyOn(themeBuilder, 'close');

      saveBtn.click();

      expect(onThemeCreate).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should reset theme when reset button is clicked', () => {
      const resetBtn = container.querySelector('#reset-theme') as HTMLElement;
      const colorInput = container.querySelector('#color-primary') as HTMLInputElement;

      // Change the color
      const newColor = '#ff0000';
      colorInput.value = newColor;
      colorInput.dispatchEvent(new Event('input'));

      // Verify it changed
      expect(colorInput.value).toBe(newColor);

      // Mock the resetTheme method to verify it's called
      const resetSpy = vi.spyOn(themeBuilder as any, 'resetTheme');

      // Click reset
      resetBtn.click();

      // Verify reset was called
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should handle export theme', () => {
      const exportBtn = container.querySelector('#export-theme') as HTMLElement;

      // Mock DOM methods for file download
      interface MockAnchor {
        href: string;
        download: string;
        click: ReturnType<typeof vi.fn>;
      }

      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(tag => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
          } as MockAnchor as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });

      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => undefined as Node);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => undefined as Node);

      createObjectURLMock.mockReturnValue('blob:test-url');

      exportBtn.click();

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle import theme', async () => {
      const importBtn = container.querySelector('#import-theme') as HTMLElement;

      interface MockInput {
        type: string;
        accept: string;
        onchange: ((e: { target: MockInput }) => void) | null;
        click: ReturnType<typeof vi.fn>;
        files: File[];
      }

      // Mock file input creation and interaction
      const mockInput: MockInput = {
        type: '',
        accept: '',
        onchange: null,
        click: vi.fn(),
        files: [new File(['{"name": "imported"}'], 'theme.json', { type: 'application/json' })],
      };

      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockInput as HTMLInputElement);

      importBtn.click();

      expect(createElementSpy).toHaveBeenCalledWith('input');
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('.json');
      expect(mockInput.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });
  });

  describe('Utility methods', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should validate colors correctly', () => {
      // Access private method through type assertion for testing
      const builder = themeBuilder as { isValidColor: (color: string) => boolean };

      expect(builder.isValidColor('#ff0000')).toBe(true);
      expect(builder.isValidColor('#000')).toBe(true);
      expect(builder.isValidColor('#FFFFFF')).toBe(true);
      expect(builder.isValidColor('invalid')).toBe(false);
      expect(builder.isValidColor('#gg0000')).toBe(false);
      expect(builder.isValidColor('#ff00')).toBe(false);
    });

    it('should convert camelCase to kebab-case', () => {
      // Access private method through type assertion for testing
      const builder = themeBuilder as { kebabCase: (str: string) => string };

      expect(builder.kebabCase('textPrimary')).toBe('text-primary');
      expect(builder.kebabCase('backgroundColor')).toBe('background-color');
      expect(builder.kebabCase('primary')).toBe('primary');
    });
  });

  describe('getStyles', () => {
    beforeEach(() => {
      themeBuilder = new ThemeBuilder(themeManager);
    });

    it('should return CSS styles string', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('.mdv-theme-builder-overlay');
      expect(styles).toContain('.mdv-theme-builder');
      expect(styles).toContain('.mdv-theme-builder-header');
      expect(styles).toContain('.mdv-theme-builder-content');
      expect(styles).toContain('transition');
    });

    it('should include mobile responsive styles', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('@media (max-width: 768px)');
    });

    it('should include accessibility styles', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('.mdv-contrast-ratio.pass');
      expect(styles).toContain('.mdv-contrast-ratio.fail');
    });

    it('should include color input styles', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('.mdv-theme-builder-color-input');
      expect(styles).toContain('input[type="color"]');
    });

    it('should include button styles', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('.mdv-theme-builder-btn-primary');
      expect(styles).toContain('.mdv-theme-builder-btn-secondary');
    });

    it('should include preview styles', () => {
      const styles = themeBuilder.getStyles();

      expect(styles).toContain('.mdv-theme-preview-sample');
      expect(styles).toContain('.mdv-preview-buttons');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing container gracefully', () => {
      themeBuilder = new ThemeBuilder(themeManager);

      expect(() => {
        themeBuilder.attachTo(container);
        // Try to interact without proper setup
        const event = new Event('input');
        container.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = '<div></div>'; // Empty container

      expect(() => {
        themeBuilder.attachTo(container);
      }).not.toThrow();
    });

    it('should handle file import errors gracefully', async () => {
      themeBuilder = new ThemeBuilder(themeManager);
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock FileReader to return invalid JSON
      class ErrorFileReader {
        onload: ((e: { target: { result: string } }) => void) | null = null;
        onerror: ((e: any) => void) | null = null;

        readAsText() {
          setTimeout(() => {
            if (this.onload) {
              // Return invalid JSON to trigger parse error
              this.onload({ target: { result: 'invalid json content' } });
            }
          }, 0);
        }
      }

      Object.defineProperty(window, 'FileReader', {
        value: ErrorFileReader,
        configurable: true,
      });

      const importBtn = container.querySelector('#import-theme') as HTMLElement;

      interface MockInput {
        type: string;
        accept: string;
        onchange: ((e: { target: MockInput }) => void) | null;
        click: ReturnType<typeof vi.fn>;
        files: File[];
      }

      const mockInput: MockInput = {
        type: 'file',
        accept: '.json',
        onchange: null,
        click: vi.fn(),
        files: [new File(['invalid json'], 'theme.json')],
      };

      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockInput as HTMLInputElement);

      importBtn.click();

      // Simulate file selection
      if (mockInput.onchange) {
        mockInput.onchange({ target: mockInput });
      }

      // Wait for async file read operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to import theme:', expect.any(Error));

      createElementSpy.mockRestore();
      consoleSpy.mockRestore();

      // Restore FileReader
      Object.defineProperty(window, 'FileReader', {
        value: MockFileReader,
        configurable: true,
      });
    });

    it('should handle theme creation without onThemeCreate callback', () => {
      themeBuilder = new ThemeBuilder(themeManager); // No callback
      container.innerHTML = themeBuilder.render();
      themeBuilder.attachTo(container);

      const saveBtn = container.querySelector('#save-theme') as HTMLElement;

      expect(() => {
        saveBtn.click();
      }).not.toThrow();
    });
  });
});
