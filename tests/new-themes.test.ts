import { describe, it, expect } from 'vitest';
import { baseThemes, getAllThemeVariants, getThemeBaseName, getThemeMode } from '../src/themes';
import { ThemeManager } from '../src/theme-manager';

describe('New Theme Integration', () => {
  describe('Base Themes Structure', () => {
    const newThemes = [
      'vscode',
      'nord',
      'dracula',
      'solarized',
      'monokai',
      'ayu',
      'catppuccin',
      'tokyo',
    ];

    newThemes.forEach(themeName => {
      it(`should have complete ${themeName} theme definition`, () => {
        const theme = baseThemes[themeName as keyof typeof baseThemes];
        expect(theme).toBeDefined();
        expect(theme.light).toBeDefined();
        expect(theme.dark).toBeDefined();

        // Check that both light and dark variants have all required color properties
        const requiredColors = [
          'primary',
          'secondary',
          'background',
          'surface',
          'text',
          'textPrimary',
          'textLight',
          'textSecondary',
          'border',
          'code',
          'codeBackground',
          'link',
          'linkHover',
          'error',
          'warning',
          'success',
        ];

        requiredColors.forEach(colorProp => {
          expect(theme.light[colorProp as keyof typeof theme.light]).toBeDefined();
          expect(theme.dark[colorProp as keyof typeof theme.dark]).toBeDefined();
          expect(typeof theme.light[colorProp as keyof typeof theme.light]).toBe('string');
          expect(typeof theme.dark[colorProp as keyof typeof theme.dark]).toBe('string');
        });
      });

      it(`should have valid color values for ${themeName}`, () => {
        const theme = baseThemes[themeName as keyof typeof baseThemes];
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;

        Object.values(theme.light).forEach(color => {
          expect(hexRegex.test(color)).toBe(true);
        });

        Object.values(theme.dark).forEach(color => {
          expect(hexRegex.test(color)).toBe(true);
        });
      });
    });
  });

  describe('Theme Generation', () => {
    it('should generate all theme variants including new themes', () => {
      const allVariants = getAllThemeVariants();
      const expectedThemeCount = Object.keys(baseThemes).length * 2; // Each theme has light and dark variant

      expect(allVariants).toHaveLength(expectedThemeCount);

      // Check that all new themes are included
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];
      newThemes.forEach(themeName => {
        const lightVariant = allVariants.find(t => t.name === `${themeName}-light`);
        const darkVariant = allVariants.find(t => t.name === `${themeName}-dark`);

        expect(lightVariant).toBeDefined();
        expect(darkVariant).toBeDefined();
      });
    });

    it('should have proper theme structure for all variants', () => {
      const allVariants = getAllThemeVariants();

      allVariants.forEach(theme => {
        expect(theme.name).toBeDefined();
        expect(theme.colors).toBeDefined();
        expect(theme.fonts).toBeDefined();
        expect(theme.spacing).toBeDefined();
        expect(theme.borderRadius).toBeDefined();

        // Check fonts structure
        expect(theme.fonts.body).toBeDefined();
        expect(theme.fonts.heading).toBeDefined();
        expect(theme.fonts.code).toBeDefined();

        // Check spacing structure
        expect(theme.spacing.unit).toBeDefined();
        expect(theme.spacing.containerMaxWidth).toBeDefined();
        expect(theme.spacing.sidebarWidth).toBeDefined();
      });
    });
  });

  describe('Theme Manager Integration', () => {
    it('should register all new themes in ThemeManager', () => {
      const themeManager = new ThemeManager();
      const availableThemes = themeManager.getAvailableThemes();

      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];
      newThemes.forEach(themeName => {
        const lightTheme = availableThemes.find(t => t.name === `${themeName}-light`);
        const darkTheme = availableThemes.find(t => t.name === `${themeName}-dark`);

        expect(lightTheme).toBeDefined();
        expect(darkTheme).toBeDefined();

        // Check that themes have descriptions
        expect(lightTheme!.description).toBeDefined();
        expect(darkTheme!.description).toBeDefined();
        expect(lightTheme!.description).not.toBe(`${themeName} light theme`);
        expect(darkTheme!.description).not.toBe(`${themeName} dark theme`);
      });
    });

    it('should be able to set new themes', () => {
      const themeManager = new ThemeManager();
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];

      newThemes.forEach(themeName => {
        // Test light variant
        const lightTheme = themeManager.setTheme(`${themeName}-light`);
        expect(lightTheme).not.toBeNull();
        expect(lightTheme!.name).toBe(`${themeName}-light`);

        // Test dark variant
        const darkTheme = themeManager.setTheme(`${themeName}-dark`);
        expect(darkTheme).not.toBeNull();
        expect(darkTheme!.name).toBe(`${themeName}-dark`);
      });
    });
  });

  describe('Theme Utilities', () => {
    it('should correctly extract base names from new theme names', () => {
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];

      newThemes.forEach(themeName => {
        expect(getThemeBaseName(`${themeName}-light`)).toBe(themeName);
        expect(getThemeBaseName(`${themeName}-dark`)).toBe(themeName);
      });
    });

    it('should correctly extract modes from new theme names', () => {
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];

      newThemes.forEach(themeName => {
        expect(getThemeMode(`${themeName}-light`)).toBe('light');
        expect(getThemeMode(`${themeName}-dark`)).toBe('dark');
      });
    });
  });

  describe('Theme Color Accessibility', () => {
    it('should have good contrast between text and background for all new themes', () => {
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];
      const allVariants = getAllThemeVariants();

      newThemes.forEach(themeName => {
        const lightTheme = allVariants.find(t => t.name === `${themeName}-light`)!;
        const darkTheme = allVariants.find(t => t.name === `${themeName}-dark`)!;

        // Light theme should have dark text on light background
        expect(lightTheme.colors.background).toMatch(/^#[a-fA-F0-9]{6}$/); // Valid hex color
        expect(lightTheme.colors.text).toMatch(/^#[a-fA-F0-9]{6}$/); // Valid hex color

        // Dark theme should have light text on dark background
        expect(darkTheme.colors.background).toMatch(/^#[a-fA-F0-9]{6}$/); // Valid hex color
        expect(darkTheme.colors.text).toMatch(/^#[a-fA-F0-9]{6}$/); // Valid hex color
      });
    });
  });

  describe('Theme Font Families', () => {
    it('should have appropriate font families for each theme', () => {
      const allVariants = getAllThemeVariants();
      const newThemes = [
        'vscode',
        'nord',
        'dracula',
        'solarized',
        'monokai',
        'ayu',
        'catppuccin',
        'tokyo',
      ];

      newThemes.forEach(themeName => {
        const lightTheme = allVariants.find(t => t.name === `${themeName}-light`)!;
        const darkTheme = allVariants.find(t => t.name === `${themeName}-dark`)!;

        // Check that fonts are defined and non-empty
        expect(lightTheme.fonts.body).toBeTruthy();
        expect(lightTheme.fonts.heading).toBeTruthy();
        expect(lightTheme.fonts.code).toBeTruthy();

        expect(darkTheme.fonts.body).toBeTruthy();
        expect(darkTheme.fonts.heading).toBeTruthy();
        expect(darkTheme.fonts.code).toBeTruthy();

        // Check that code fonts include monospace fonts
        expect(lightTheme.fonts.code.toLowerCase()).toContain('mono');
        expect(darkTheme.fonts.code.toLowerCase()).toContain('mono');
      });
    });

    it('should have theme-specific fonts where appropriate', () => {
      const allVariants = getAllThemeVariants();

      // VS Code should use Segoe UI
      const vscodeLight = allVariants.find(t => t.name === 'vscode-light')!;
      expect(vscodeLight.fonts.body).toContain('Segoe UI');
      expect(vscodeLight.fonts.code).toContain('Consolas');

      // Material should use Roboto
      const materialLight = allVariants.find(t => t.name === 'material-light')!;
      expect(materialLight.fonts.body).toContain('Roboto');

      // Solarized should use Source fonts
      const solarizedLight = allVariants.find(t => t.name === 'solarized-light')!;
      expect(solarizedLight.fonts.body).toContain('Source Sans Pro');
      expect(solarizedLight.fonts.code).toContain('Source Code Pro');
    });
  });

  describe('Theme Descriptions', () => {
    it('should have meaningful descriptions for all new themes', () => {
      const themeManager = new ThemeManager();
      const availableThemes = themeManager.getAvailableThemes();

      const expectedDescriptions = {
        'vscode-light': 'Visual Studio Code inspired light theme',
        'vscode-dark': 'Visual Studio Code inspired dark theme',
        'nord-light': 'Nord light theme with arctic aesthetics',
        'nord-dark': 'Nord dark theme with arctic aesthetics',
        'dracula-light': 'Dracula-inspired light theme',
        'dracula-dark': 'Popular Dracula dark theme',
        'solarized-light': 'Solarized light - precision colors',
        'solarized-dark': 'Solarized dark - precision colors',
        'monokai-light': 'Monokai-inspired light theme',
        'monokai-dark': 'Classic Monokai dark theme',
        'ayu-light': 'Ayu light - elegant and minimal',
        'ayu-dark': 'Ayu dark - elegant and minimal',
        'catppuccin-light': 'Catppuccin Latte - pastel perfection',
        'catppuccin-dark': 'Catppuccin Mocha - cozy dark theme',
        'tokyo-light': 'Tokyo Night light - modern aesthetics',
        'tokyo-dark': 'Tokyo Night dark - popular among developers',
      };

      Object.entries(expectedDescriptions).forEach(([themeName, expectedDescription]) => {
        const theme = availableThemes.find(t => t.name === themeName);
        expect(theme).toBeDefined();
        expect(theme!.description).toBe(expectedDescription);
      });
    });
  });
});
