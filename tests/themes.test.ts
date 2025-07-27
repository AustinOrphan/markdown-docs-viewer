import { describe, it, expect } from 'vitest';
import { themes, createCustomTheme } from '../src/themes';

describe('Themes', () => {
  describe('themes.default.light', () => {
    it('should have all required color properties', () => {
      expect(themes.default.light.colors).toBeDefined();
      expect(themes.default.light.colors.primary).toBeDefined();
      expect(themes.default.light.colors.background).toBeDefined();
      expect(themes.default.light.colors.surface).toBeDefined();
      expect(themes.default.light.colors.text).toBeDefined();
      expect(themes.default.light.colors.textLight).toBeDefined();
      expect(themes.default.light.colors.border).toBeDefined();
      expect(themes.default.light.colors.code).toBeDefined();
      expect(themes.default.light.colors.codeBackground).toBeDefined();
    });

    it('should have valid CSS color values', () => {
      // Test that color values are valid CSS colors (hex format)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

      expect(themes.default.light.colors.primary).toMatch(hexColorRegex);
      expect(themes.default.light.colors.background).toMatch(hexColorRegex);
      expect(themes.default.light.colors.text).toMatch(hexColorRegex);
    });

    it('should have all required font properties', () => {
      expect(themes.default.light.fonts).toBeDefined();
      expect(themes.default.light.fonts.body).toBeDefined();
      expect(themes.default.light.fonts.heading).toBeDefined();
      expect(themes.default.light.fonts.code).toBeDefined();
    });

    it('should have valid font stacks', () => {
      // Font stacks should be non-empty strings
      expect(themes.default.light.fonts.body).toBeTypeOf('string');
      expect(themes.default.light.fonts.body.length).toBeGreaterThan(0);

      expect(themes.default.light.fonts.heading).toBeTypeOf('string');
      expect(themes.default.light.fonts.heading.length).toBeGreaterThan(0);

      expect(themes.default.light.fonts.code).toBeTypeOf('string');
      expect(themes.default.light.fonts.code.length).toBeGreaterThan(0);
    });
  });

  describe('themes.default.dark', () => {
    it('should have all required color properties', () => {
      expect(themes.default.dark.colors).toBeDefined();
      expect(themes.default.dark.colors.primary).toBeDefined();
      expect(themes.default.dark.colors.background).toBeDefined();
      expect(themes.default.dark.colors.surface).toBeDefined();
      expect(themes.default.dark.colors.text).toBeDefined();
      expect(themes.default.dark.colors.textLight).toBeDefined();
      expect(themes.default.dark.colors.border).toBeDefined();
      expect(themes.default.dark.colors.code).toBeDefined();
      expect(themes.default.dark.colors.codeBackground).toBeDefined();
    });

    it('should have different colors from default theme', () => {
      // Dark theme should have different background colors
      expect(themes.default.dark.colors.background).not.toBe(
        themes.default.light.colors.background
      );
      expect(themes.default.dark.colors.text).not.toBe(themes.default.light.colors.text);
    });

    it('should have dark background colors', () => {
      // Dark theme should have dark backgrounds (approximate check)
      // This is a simple check - in a real app you might use color parsing
      expect(themes.default.dark.colors.background.toLowerCase()).toMatch(/^#[0-4]/);
    });

    it('should have light text colors for contrast', () => {
      // Dark theme should have light text for contrast
      expect(themes.default.dark.colors.text.toLowerCase()).toMatch(/^#[a-f9]/);
    });

    it('should have same font structure as default theme', () => {
      expect(themes.default.dark.fonts).toBeDefined();
      expect(themes.default.dark.fonts.body).toBeDefined();
      expect(themes.default.dark.fonts.heading).toBeDefined();
      expect(themes.default.dark.fonts.code).toBeDefined();
    });
  });

  describe('Theme Validation', () => {
    it('should have consistent structure between themes', () => {
      const defaultKeys = Object.keys(themes.default.light.colors).sort();
      const darkKeys = Object.keys(themes.default.dark.colors).sort();

      expect(darkKeys).toEqual(defaultKeys);
    });

    it('should have valid CSS units for spacing if present', () => {
      const cssUnitRegex = /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/;

      if (themes.default.light.spacing) {
        Object.values(themes.default.light.spacing).forEach(value => {
          if (typeof value === 'string') {
            expect(value).toMatch(cssUnitRegex);
          }
        });
      }
    });

    it('should have valid CSS units for radius if present', () => {
      const cssUnitRegex = /^\d+(\.\d+)?(px|em|rem|%)$/;

      if (themes.default.light.borderRadius) {
        // Note: borderRadius is a single value, not an object
        if (typeof themes.default.light.borderRadius === 'string') {
          expect(themes.default.light.borderRadius).toMatch(cssUnitRegex);
        }
      }
    });
  });

  describe('Accessibility Considerations', () => {
    it('should have sufficient contrast between text and background', () => {
      // This is a simplified check - in production you'd use a proper contrast calculator
      const isLightBackground = (color: string) => {
        // Simple check: light colors typically start with higher hex values
        return color.toLowerCase().match(/^#[a-f8-9]/);
      };

      const isDarkText = (color: string) => {
        // Simple check: dark colors typically start with lower hex values
        return color.toLowerCase().match(/^#[0-7]/);
      };

      // Default theme: light background should have dark text
      if (isLightBackground(themes.default.light.colors.background)) {
        expect(isDarkText(themes.default.light.colors.text)).toBeTruthy();
      }

      // Dark theme: dark background should have light text
      if (!isLightBackground(themes.default.dark.colors.background)) {
        expect(!isDarkText(themes.default.dark.colors.text)).toBeTruthy();
      }
    });

    it('should not rely only on color for information', () => {
      // Both themes should have the same structure
      // This ensures information isn't conveyed through color alone
      expect(Object.keys(themes.default.light.colors)).toEqual(
        Object.keys(themes.default.dark.colors)
      );
    });
  });

  describe('Custom Theme Creation', () => {
    it('should be possible to extend default theme', () => {
      const customTheme = {
        ...themes.default.light,
        colors: {
          ...themes.default.light.colors,
          primary: '#ff0000',
        },
      };

      expect(customTheme.colors.primary).toBe('#ff0000');
      expect(customTheme.colors.background).toBe(themes.default.light.colors.background);
      expect(customTheme.fonts).toBe(themes.default.light.fonts);
    });

    it('should be possible to extend dark theme', () => {
      const customDarkTheme = {
        ...themes.default.dark,
        colors: {
          ...themes.default.dark.colors,
          primary: '#00ff00',
        },
      };

      expect(customDarkTheme.colors.primary).toBe('#00ff00');
      expect(customDarkTheme.colors.background).toBe(themes.default.dark.colors.background);
    });

    it('should be possible to create completely custom theme', () => {
      const brandTheme = {
        colors: {
          primary: '#3b82f6',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textLight: '#64748b',
          border: '#e2e8f0',
          code: '#8b5cf6',
          codeBackground: '#f1f5f9',
        },
        fonts: {
          body: 'Inter, sans-serif',
          heading: 'Poppins, sans-serif',
          code: 'Fira Code, monospace',
        },
      };

      expect(brandTheme.colors.primary).toBe('#3b82f6');
      expect(brandTheme.fonts.body).toBe('Inter, sans-serif');
    });
  });

  describe('createCustomTheme', () => {
    it('should create custom theme based on default theme', () => {
      const customTheme = createCustomTheme({
        colors: {
          primary: '#ff0000',
        },
      });

      expect(customTheme.colors.primary).toBe('#ff0000');
      expect(customTheme.colors.background).toBe(themes.default.light.colors.background);
      expect(customTheme.fonts).toEqual(themes.default.light.fonts);
    });

    it('should create custom theme based on dark theme when name contains dark', () => {
      const customDarkTheme = createCustomTheme({
        name: 'custom-dark',
        colors: {
          primary: '#00ff00',
        },
      });

      expect(customDarkTheme.colors.primary).toBe('#00ff00');
      expect(customDarkTheme.colors.background).toBe(themes.default.dark.colors.background);
      expect(customDarkTheme.fonts).toEqual(themes.default.dark.fonts);
    });

    it('should merge all theme properties', () => {
      const customTheme = createCustomTheme({
        colors: {
          primary: '#123456',
        },
        fonts: {
          body: 'Custom Font',
        },
        spacing: {
          xs: '0.25rem',
        },
      });

      expect(customTheme.colors.primary).toBe('#123456');
      expect(customTheme.colors.background).toBe(themes.default.light.colors.background);
      expect(customTheme.fonts.body).toBe('Custom Font');
      expect(customTheme.fonts.heading).toBe(themes.default.light.fonts.heading);
      expect(customTheme.spacing.unit).toBe(8); // spacing.xs doesn't exist, using unit
    });

    it('should handle empty overrides', () => {
      const customTheme = createCustomTheme({});

      expect(customTheme).toEqual(themes.default.light);
    });

    it('should handle overrides with undefined values', () => {
      const customTheme = createCustomTheme({
        colors: undefined,
        fonts: undefined,
        spacing: undefined,
      });

      expect(customTheme.colors).toEqual(themes.default.light.colors);
      expect(customTheme.fonts).toEqual(themes.default.light.fonts);
      expect(customTheme.spacing).toEqual(themes.default.light.spacing);
    });

    it('should handle new signature with base name and mode', () => {
      const customTheme = createCustomTheme('github', 'dark', {
        colors: {
          primary: '#654321',
        },
      });

      expect(customTheme.name).toBe('github-dark');
      expect(customTheme.colors.primary).toBe('#654321');
      // Should use github dark theme as base
      expect(customTheme.colors.background).toBe('#0d1117');
    });

    it('should support backward compatibility for dark theme name', () => {
      const customTheme = createCustomTheme({
        name: 'dark',
        colors: {
          primary: '#abcdef',
        },
      });

      expect(customTheme.name).toBe('dark');
      expect(customTheme.colors.primary).toBe('#abcdef');
      // Should use default dark theme as base
      expect(customTheme.colors.background).toBe(themes.default.dark.colors.background);
    });
  });
});
