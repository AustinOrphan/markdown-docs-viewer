import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '../src/theme-manager';
import { defaultTheme, darkTheme } from '../src/themes';

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

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset document styles
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-mdv-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme().name).toBe('default');
      expect(themeManager.getAvailableThemes()).toHaveLength(8); // Built-in themes
    });

    it('should initialize with custom options', () => {
      const onThemeChange = vi.fn();
      themeManager = new ThemeManager({
        enablePersistence: false,
        storageKey: 'custom-key',
        onThemeChange
      });
      
      expect(themeManager.getCurrentTheme().name).toBe('default');
    });

    it('should load saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme().name).toBe('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mdv-theme');
    });

    it('should fall back to default theme if saved theme not found', () => {
      localStorageMock.getItem.mockReturnValue('nonexistent');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme().name).toBe('default');
    });

    it('should use custom storage key', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      themeManager = new ThemeManager({ storageKey: 'my-theme' });
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('my-theme');
    });
  });

  describe('Built-in themes', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should have all expected built-in themes', () => {
      const themes = themeManager.getAvailableThemes();
      const themeNames = themes.map(t => t.name);
      
      expect(themeNames).toContain('default');
      expect(themeNames).toContain('dark');
      expect(themeNames).toContain('high-contrast');
      expect(themeNames).toContain('github');
      expect(themeNames).toContain('dracula');
      expect(themeNames).toContain('solarized-light');
      expect(themeNames).toContain('solarized-dark');
      expect(themeNames).toContain('material');
    });

    it('should have proper theme structure for all built-in themes', () => {
      const themes = themeManager.getAvailableThemes();
      
      themes.forEach(theme => {
        expect(theme.name).toBeTruthy();
        expect(theme.colors).toBeTruthy();
        expect(theme.fonts).toBeTruthy();
        expect(theme.spacing).toBeTruthy();
        expect(theme.borderRadius).toBeTruthy();
        expect(theme.description).toBeTruthy();
        expect(theme.author).toBeTruthy();
        expect(theme.version).toBeTruthy();
      });
    });
  });

  describe('registerTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should register a custom theme', () => {
      const customTheme = {
        name: 'custom',
        description: 'Custom theme',
        colors: { ...defaultTheme.colors, primary: '#ff0000' },
        fonts: defaultTheme.fonts,
        spacing: defaultTheme.spacing,
        borderRadius: '0.5rem'
      };
      
      themeManager.registerTheme(customTheme);
      
      const registeredTheme = themeManager.getTheme('custom');
      expect(registeredTheme).toEqual(customTheme);
    });

    it('should allow overriding existing themes', () => {
      const modifiedDefault = {
        name: 'default',
        description: 'Modified default',
        colors: { ...defaultTheme.colors, primary: '#ff0000' },
        fonts: defaultTheme.fonts,
        spacing: defaultTheme.spacing,
        borderRadius: '0.5rem'
      };
      
      themeManager.registerTheme(modifiedDefault);
      
      const theme = themeManager.getTheme('default');
      expect(theme?.colors.primary).toBe('#ff0000');
      expect(theme?.description).toBe('Modified default');
    });
  });

  describe('setTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should set theme and return the theme object', () => {
      const result = themeManager.setTheme('dark');
      
      expect(result).toBeTruthy();
      expect(result?.name).toBe('dark');
      expect(themeManager.getCurrentTheme().name).toBe('dark');
    });

    it('should return null for non-existent theme', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = themeManager.setTheme('nonexistent');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Theme "nonexistent" not found');
      expect(themeManager.getCurrentTheme().name).toBe('default'); // Should remain unchanged
      
      consoleSpy.mockRestore();
    });

    it('should save theme to localStorage when persistence enabled', () => {
      themeManager.setTheme('dark');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mdv-theme', 'dark');
    });

    it('should not save theme when persistence disabled', () => {
      themeManager = new ThemeManager({ enablePersistence: false });
      
      themeManager.setTheme('dark');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should call onThemeChange callback', () => {
      const onThemeChange = vi.fn();
      themeManager = new ThemeManager({ onThemeChange });
      
      const result = themeManager.setTheme('dark');
      
      expect(onThemeChange).toHaveBeenCalledWith(result);
    });

    it('should apply CSS variables', () => {
      themeManager.setTheme('dark');
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-color-primary')).toBe(darkTheme.colors.primary);
      expect(root.style.getPropertyValue('--mdv-color-background')).toBe(darkTheme.colors.background);
      expect(root.getAttribute('data-mdv-theme')).toBe('dark');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = themeManager.setTheme('dark');
      
      expect(result).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save theme preference:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should return current theme', () => {
      const current = themeManager.getCurrentTheme();
      expect(current.name).toBe('default');
      
      themeManager.setTheme('dark');
      const updated = themeManager.getCurrentTheme();
      expect(updated.name).toBe('dark');
    });
  });

  describe('getAvailableThemes', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should return all registered themes', () => {
      const themes = themeManager.getAvailableThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes.every(theme => theme.name && theme.colors)).toBe(true);
    });

    it('should include custom themes', () => {
      const customTheme = {
        name: 'custom',
        description: 'Custom theme',
        colors: defaultTheme.colors,
        fonts: defaultTheme.fonts,
        spacing: defaultTheme.spacing,
        borderRadius: '0.5rem'
      };
      
      themeManager.registerTheme(customTheme);
      
      const themes = themeManager.getAvailableThemes();
      expect(themes.some(theme => theme.name === 'custom')).toBe(true);
    });
  });

  describe('getTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should return theme by name', () => {
      const theme = themeManager.getTheme('dark');
      expect(theme?.name).toBe('dark');
    });

    it('should return undefined for non-existent theme', () => {
      const theme = themeManager.getTheme('nonexistent');
      expect(theme).toBeUndefined();
    });
  });

  describe('createCustomTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should create custom theme based on current theme', () => {
      const customTheme = themeManager.createCustomTheme('my-theme', {
        colors: { primary: '#ff0000' }
      });
      
      expect(customTheme.name).toBe('my-theme');
      expect(customTheme.colors.primary).toBe('#ff0000');
      expect(customTheme.colors.background).toBe(defaultTheme.colors.background); // Inherited
      expect(customTheme.description).toBe('Custom theme');
      expect(customTheme.author).toBe('User');
    });

    it('should merge all properties correctly', () => {
      themeManager.setTheme('dark'); // Change base theme
      
      const customTheme = themeManager.createCustomTheme('dark-custom', {
        colors: { primary: '#purple' },
        fonts: { body: 'Comic Sans' },
        spacing: { unit: 16 },
        borderRadius: '1rem'
      });
      
      expect(customTheme.colors.primary).toBe('#purple');
      expect(customTheme.colors.background).toBe(darkTheme.colors.background); // From dark theme
      expect(customTheme.fonts.body).toBe('Comic Sans');
      expect(customTheme.fonts.heading).toBe(darkTheme.fonts.heading); // Inherited
      expect(customTheme.spacing.unit).toBe(16);
      expect(customTheme.borderRadius).toBe('1rem');
    });

    it('should register the custom theme', () => {
      themeManager.createCustomTheme('registered', {});
      
      const theme = themeManager.getTheme('registered');
      expect(theme).toBeTruthy();
    });
  });

  describe('applyCSSVariables', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should apply all color variables', () => {
      themeManager.applyCSSVariables(darkTheme);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-color-primary')).toBe(darkTheme.colors.primary);
      expect(root.style.getPropertyValue('--mdv-color-background')).toBe(darkTheme.colors.background);
      expect(root.style.getPropertyValue('--mdv-color-text-primary')).toBe(darkTheme.colors.textPrimary);
    });

    it('should apply RGB versions of colors', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      const rgbValue = root.style.getPropertyValue('--mdv-color-primary-rgb');
      expect(rgbValue).toBeTruthy();
      expect(rgbValue).toMatch(/^\d+, \d+, \d+$/); // Format: "r, g, b"
    });

    it('should apply font variables', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-font-body')).toBe(defaultTheme.fonts.body);
      expect(root.style.getPropertyValue('--mdv-font-heading')).toBe(defaultTheme.fonts.heading);
      expect(root.style.getPropertyValue('--mdv-font-code')).toBe(defaultTheme.fonts.code);
    });

    it('should apply spacing variables', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-spacing-unit')).toBe(`${defaultTheme.spacing.unit}px`);
      expect(root.style.getPropertyValue('--mdv-container-max-width')).toBe(defaultTheme.spacing.containerMaxWidth);
      expect(root.style.getPropertyValue('--mdv-sidebar-width')).toBe(defaultTheme.spacing.sidebarWidth);
    });

    it('should apply border radius', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-border-radius')).toBe(defaultTheme.borderRadius);
    });

    it('should set theme data attribute', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      expect(document.documentElement.getAttribute('data-mdv-theme')).toBe('default');
    });
  });

  describe('Color utility methods', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    describe('getContrastRatio', () => {
      it('should calculate contrast ratio correctly', () => {
        const ratio = themeManager.getContrastRatio('#000000', '#ffffff');
        expect(ratio).toBeCloseTo(21, 0); // Black on white should be ~21:1
      });

      it('should handle same colors', () => {
        const ratio = themeManager.getContrastRatio('#ff0000', '#ff0000');
        expect(ratio).toBe(1); // Same color should be 1:1
      });

      it('should be symmetric', () => {
        const ratio1 = themeManager.getContrastRatio('#000000', '#ffffff');
        const ratio2 = themeManager.getContrastRatio('#ffffff', '#000000');
        expect(ratio1).toBe(ratio2);
      });
    });

    describe('isAccessible', () => {
      it('should return true for high contrast combinations (AA)', () => {
        const accessible = themeManager.isAccessible('#000000', '#ffffff', 'AA');
        expect(accessible).toBe(true);
      });

      it('should return false for low contrast combinations (AA)', () => {
        const accessible = themeManager.isAccessible('#cccccc', '#ffffff', 'AA');
        expect(accessible).toBe(false);
      });

      it('should use AA standard by default', () => {
        const accessible1 = themeManager.isAccessible('#000000', '#ffffff');
        const accessible2 = themeManager.isAccessible('#000000', '#ffffff', 'AA');
        expect(accessible1).toBe(accessible2);
      });

      it('should apply AAA standard correctly', () => {
        // A combination that passes AA but not AAA
        const passesAA = themeManager.isAccessible('#767676', '#ffffff', 'AA');
        const passesAAA = themeManager.isAccessible('#767676', '#ffffff', 'AAA');
        
        expect(passesAA).toBe(true);
        expect(passesAAA).toBe(false);
      });
    });
  });

  describe('Theme import/export', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    describe('exportTheme', () => {
      it('should export theme as JSON string', () => {
        const exported = themeManager.exportTheme(defaultTheme);
        const parsed = JSON.parse(exported);
        
        expect(parsed.name).toBe(defaultTheme.name);
        expect(parsed.colors).toEqual(defaultTheme.colors);
      });

      it('should format JSON nicely', () => {
        const exported = themeManager.exportTheme(defaultTheme);
        expect(exported).toContain('\n'); // Should be formatted
        expect(exported).toContain('  '); // Should have indentation
      });
    });

    describe('importTheme', () => {
      it('should import valid theme JSON', () => {
        const themeData = {
          name: 'imported',
          colors: defaultTheme.colors,
          fonts: defaultTheme.fonts,
          spacing: defaultTheme.spacing,
          borderRadius: '0.5rem'
        };
        
        const result = themeManager.importTheme(JSON.stringify(themeData));
        
        expect(result).toBeTruthy();
        expect(result?.name).toBe('imported');
        expect(themeManager.getTheme('imported')).toBeTruthy();
      });

      it('should return null for invalid JSON', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const result = themeManager.importTheme('invalid json');
        
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });

      it('should validate theme structure', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const invalidTheme = { invalidProperty: true };
        const result = themeManager.importTheme(JSON.stringify(invalidTheme));
        
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });

      it('should validate required colors', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const incompleteTheme = {
          name: 'incomplete',
          colors: { primary: '#ff0000' } // Missing required colors
        };
        
        const result = themeManager.importTheme(JSON.stringify(incompleteTheme));
        
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Persistence edge cases', () => {
    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true
      });
      
      expect(() => {
        themeManager = new ThemeManager();
        themeManager.setTheme('dark');
      }).not.toThrow();
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true
      });
    });

    it('should handle localStorage getItem errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        themeManager = new ThemeManager();
      }).not.toThrow();
      
      expect(themeManager.getCurrentTheme().name).toBe('default');
    });
  });

  describe('Utility methods', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should convert camelCase to kebab-case', () => {
      // Test the kebabCase method indirectly through CSS variable application
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--mdv-color-text-primary')).toBeTruthy();
      expect(root.style.getPropertyValue('--mdv-color-text-secondary')).toBeTruthy();
    });

    it('should handle hex to RGB conversion', () => {
      themeManager.applyCSSVariables(defaultTheme);
      
      const root = document.documentElement;
      const rgbValue = root.style.getPropertyValue('--mdv-color-primary-rgb');
      expect(rgbValue).toMatch(/^\d+, \d+, \d+$/);
    });
  });
});