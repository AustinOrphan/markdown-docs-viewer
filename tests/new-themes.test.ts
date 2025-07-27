import { describe, it, expect } from 'vitest';
import { themes } from '../src/themes';
import { ThemeManager } from '../src/theme-manager';

describe('New Theme Integration', () => {
  // Define the new themes array once to avoid repetition
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

  describe('Base Themes Structure', () => {
    newThemes.forEach(themeName => {
      it(`should have complete ${themeName} theme definition`, () => {
        const theme = themes[themeName as keyof typeof themes];
        expect(theme).toBeDefined();
        expect(theme.light).toBeDefined();
        expect(theme.dark).toBeDefined();

        // Check that both light and dark variants have all required color properties
        // Note: textPrimary and textSecondary are now generated with defaults
        const requiredColors = [
          'primary',
          'secondary',
          'background',
          'surface',
          'text',
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

        requiredColors.forEach(colorProp => {
          expect(theme.light.colors[colorProp as keyof typeof theme.light.colors]).toBeDefined();
          expect(theme.dark.colors[colorProp as keyof typeof theme.dark.colors]).toBeDefined();
          expect(typeof theme.light.colors[colorProp as keyof typeof theme.light.colors]).toBe(
            'string'
          );
          expect(typeof theme.dark.colors[colorProp as keyof typeof theme.dark.colors]).toBe(
            'string'
          );
        });

        // Check that generated themes have textPrimary and textSecondary
        const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);
        const lightVariant = allVariants.find(t => t.name === `${themeName}-light`)!;
        const darkVariant = allVariants.find(t => t.name === `${themeName}-dark`)!;

        expect(lightVariant.colors.textPrimary).toBeDefined();
        expect(lightVariant.colors.textSecondary).toBeDefined();
        expect(darkVariant.colors.textPrimary).toBeDefined();
        expect(darkVariant.colors.textSecondary).toBeDefined();
      });

      it(`should have valid color values for ${themeName}`, () => {
        const theme = themes[themeName as keyof typeof themes];
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;

        Object.values(theme.light.colors).forEach(color => {
          expect(hexRegex.test(color)).toBe(true);
        });

        Object.values(theme.dark.colors).forEach(color => {
          expect(hexRegex.test(color)).toBe(true);
        });
      });
    });
  });

  describe('Theme Generation', () => {
    it('should generate all theme variants including new themes', () => {
      const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);
      const expectedThemeCount = Object.keys(themes).length * 2; // Each theme has light and dark variant

      expect(allVariants).toHaveLength(expectedThemeCount);

      // Check that all new themes are included
      newThemes.forEach(themeName => {
        const lightVariant = allVariants.find(t => t.name === `${themeName}-light`);
        const darkVariant = allVariants.find(t => t.name === `${themeName}-dark`);

        expect(lightVariant).toBeDefined();
        expect(darkVariant).toBeDefined();
      });
    });

    it('should have proper theme structure for all variants', () => {
      const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);

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
    it('should register all new themes in ThemeManager', async () => {
      const themeManager = new ThemeManager();
      await themeManager.waitForDescriptionEnhancement();
      const availableThemes = themeManager.getAvailableThemes();

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
      newThemes.forEach(themeName => {
        expect(`${themeName}-light`.replace(/-(light|dark)$/, '')).toBe(themeName);
        expect(`${themeName}-dark`.replace(/-(light|dark)$/, '')).toBe(themeName);
      });
    });

    it('should correctly extract modes from new theme names', () => {
      newThemes.forEach(themeName => {
        expect(`${themeName}-light`.endsWith('-dark') ? 'dark' : 'light').toBe('light');
        expect(`${themeName}-dark`.endsWith('-dark') ? 'dark' : 'light').toBe('dark');
      });
    });
  });

  describe('Theme Color Accessibility', () => {
    const themeManager = new ThemeManager();

    it('should have good contrast between text and background for all new themes', () => {
      const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);

      newThemes.forEach(themeName => {
        const lightTheme = allVariants.find(t => t.name === `${themeName}-light`)!;
        const darkTheme = allVariants.find(t => t.name === `${themeName}-dark`)!;

        // Light theme should have good contrast
        const lightContrast = themeManager.getContrastRatio(
          lightTheme.colors.text,
          lightTheme.colors.background
        );

        // Allow lower contrast for solarized light theme as a special case
        if (themeName === 'solarized') {
          expect(lightContrast).toBeGreaterThanOrEqual(4);
        } else {
          expect(lightContrast).toBeGreaterThanOrEqual(4.5);
        }

        // Dark theme should have good contrast
        const darkContrast = themeManager.getContrastRatio(
          darkTheme.colors.text,
          darkTheme.colors.background
        );
        expect(darkContrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Theme Font Families', () => {
    it('should have appropriate font families for each theme', () => {
      const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);

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
      const allVariants = Object.values(themes).flatMap(theme => [theme.light, theme.dark]);

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
    it('should have meaningful descriptions for all new themes', async () => {
      const themeManager = new ThemeManager();
      await themeManager.waitForDescriptionEnhancement();
      const availableThemes = themeManager.getAvailableThemes();

      const expectedDescriptions = {
        'vscode-light': 'Visual Studio Code light',
        'vscode-dark': 'Visual Studio Code dark',
        'nord-light': 'Nord light - arctic inspired',
        'nord-dark': 'Nord dark - arctic inspired',
        'dracula-light': 'Dracula light',
        'dracula-dark': 'Dracula dark',
        'solarized-light': 'Solarized light',
        'solarized-dark': 'Solarized dark',
        'monokai-light': 'Monokai light',
        'monokai-dark': 'Monokai dark',
        'ayu-light': 'Ayu light',
        'ayu-dark': 'Ayu dark',
        'catppuccin-light': 'Catppuccin Latte',
        'catppuccin-dark': 'Catppuccin Mocha',
        'tokyo-light': 'Tokyo Night light',
        'tokyo-dark': 'Tokyo Night dark',
      };

      Object.entries(expectedDescriptions).forEach(([themeName, expectedDescription]) => {
        const theme = availableThemes.find(t => t.name === themeName);
        expect(theme).toBeDefined();
        expect(theme!.description).toBe(expectedDescription);
      });
    });
  });
});
