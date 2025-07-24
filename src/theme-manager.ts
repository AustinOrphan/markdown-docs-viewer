import { Theme } from './types';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultTheme,
  getAllThemeVariants,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableThemeNames,
  getThemeBaseName,
  getThemeMode,
} from './themes';

export interface ThemeColor {
  name: string;
  value: string;
  description?: string;
}

export interface ThemePreset extends Theme {
  description?: string;
  author?: string;
  version?: string;
}

export interface ThemeManagerOptions {
  enablePersistence?: boolean;
  storageKey?: string;
  onThemeChange?: (theme: Theme) => void;
}

export class ThemeManager {
  private currentTheme!: Theme;
  private themes: Map<string, ThemePreset>;
  private options: ThemeManagerOptions;
  private container: HTMLElement | null = null;

  constructor(options: ThemeManagerOptions = {}) {
    this.options = {
      enablePersistence: true,
      storageKey: 'mdv-theme',
      ...options,
    };

    this.themes = new Map();
    this.initializeBuiltInThemes();

    // Load saved theme or use default
    const savedThemeName = this.getSavedThemeName();
    const initialTheme = this.resolveInitialTheme(savedThemeName);

    // Properly set the theme through the normal flow to ensure consistency
    if (initialTheme) {
      this.currentTheme = initialTheme;
      // Apply CSS variables immediately
      this.applyCSSVariables(initialTheme);

      // Trigger the change callback for initial theme if provided
      if (this.options.onThemeChange) {
        // Use setTimeout to ensure it runs after constructor completes
        setTimeout(() => {
          this.options.onThemeChange!(initialTheme);
        }, 0);
      }
    }
  }

  private async initializeBuiltInThemes(): Promise<void> {
    // Register all theme variants (light and dark) from the new theme system
    const allThemes = getAllThemeVariants();

    const descriptions = await import('./theme-descriptions.json').then(m => m.default);

    allThemes.forEach(theme => {
      const baseName = getThemeBaseName(theme.name);
      const mode = getThemeMode(theme.name);

      const description = descriptions[baseName]?.[mode] || `${baseName} ${mode} theme`;

      this.registerTheme({
        ...theme,
        description,
        author: 'MarkdownDocsViewer',
        version: '1.0.0',
      });
    });
  }

  // Rest of the file remains the same
  // (Previous implementation of the class methods)
}
