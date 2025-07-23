import { Theme } from './types';
import {
  defaultTheme,
  getAllThemeVariants,
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
    }
  }

  private initializeBuiltInThemes(): void {
    // Register all theme variants (light and dark) from the new theme system
    const allThemes = getAllThemeVariants();

    allThemes.forEach(theme => {
      const baseName = getThemeBaseName(theme.name);
      const mode = getThemeMode(theme.name);

      const description = this.getThemeDescription(baseName, mode);

      this.registerTheme({
        ...theme,
        description,
        author: 'MarkdownDocsViewer',
        version: '1.0.0',
      });
    });
  }

  private resolveInitialTheme(savedThemeName: string | null): Theme {
    if (!savedThemeName) {
      return defaultTheme;
    }

    // Check if the saved theme exists exactly as-is (new format)
    const exactMatch = this.themes.get(savedThemeName);
    if (exactMatch) {
      return exactMatch;
    }

    // Handle old theme names that might be stored in localStorage
    const legacyThemeMap: Record<string, string> = {
      default: 'default-light',
      dark: 'default-dark',
      light: 'default-light',
      github: 'github-light',
      material: 'material-light',
      dracula: 'default-dark', // Old dracula maps to default-dark
      'solarized-light': 'default-light', // Old solarized maps to default
      'solarized-dark': 'default-dark',
      'high-contrast': 'default-light',
    };

    const mappedTheme = legacyThemeMap[savedThemeName];
    if (mappedTheme) {
      const resolvedTheme = this.themes.get(mappedTheme);
      if (resolvedTheme) {
        // Update localStorage to use the new theme name
        this.saveThemeName(mappedTheme);
        return resolvedTheme;
      }
    }

    // If saved theme has no mode suffix, try to infer it
    if (!savedThemeName.includes('-light') && !savedThemeName.includes('-dark')) {
      // Try light version first
      const lightVersion = this.themes.get(`${savedThemeName}-light`);
      if (lightVersion) {
        this.saveThemeName(`${savedThemeName}-light`);
        return lightVersion;
      }

      // Try dark version
      const darkVersion = this.themes.get(`${savedThemeName}-dark`);
      if (darkVersion) {
        this.saveThemeName(`${savedThemeName}-dark`);
        return darkVersion;
      }
    }

    // Fallback to default theme
    console.warn(`Could not resolve saved theme "${savedThemeName}", falling back to default`);
    return defaultTheme;
  }

  private getThemeDescription(baseName: string, mode: 'light' | 'dark'): string {
    const descriptions: Record<string, { light: string; dark: string }> = {
      default: {
        light: 'Clean and modern light theme',
        dark: 'Clean and modern dark theme',
      },
      github: {
        light: 'GitHub-inspired light theme',
        dark: 'GitHub-inspired dark theme',
      },
      material: {
        light: 'Material Design inspired light theme',
        dark: 'Material Design inspired dark theme',
      },
    };

    return descriptions[baseName]?.[mode] || `${baseName} ${mode} theme`;
  }

  public registerTheme(theme: ThemePreset): void {
    this.themes.set(theme.name, theme);
  }

  public setTheme(themeName: string): Theme | null {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(
        `Theme "${themeName}" not found. Available themes:`,
        Array.from(this.themes.keys())
      );
      return null;
    }

    this.currentTheme = theme;

    // Save to storage
    if (this.options.enablePersistence) {
      this.saveThemeName(themeName);
    }

    // Apply CSS custom properties
    this.applyCSSVariables(theme);

    // Notify change
    if (this.options.onThemeChange) {
      this.options.onThemeChange(theme);
    }

    return theme;
  }

  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  public getAvailableThemes(): ThemePreset[] {
    return Array.from(this.themes.values());
  }

  public getTheme(name: string): ThemePreset | undefined {
    return this.themes.get(name);
  }

  public createCustomTheme(name: string, overrides: Partial<Theme>): ThemePreset {
    const baseTheme = this.currentTheme;

    // Create safe theme object
    const customTheme: ThemePreset = {
      name,
      colors: this.mergeObjects(baseTheme.colors, overrides.colors || {}),
      fonts: this.mergeObjects(baseTheme.fonts, overrides.fonts || {}),
      spacing: this.mergeObjects(baseTheme.spacing, overrides.spacing || {}),
      borderRadius: overrides.borderRadius || baseTheme.borderRadius,
      description: overrides.name?.includes('dark')
        ? `Custom dark theme based on ${getThemeBaseName(baseTheme.name)}`
        : `Custom light theme based on ${getThemeBaseName(baseTheme.name)}`,
      author: 'User',
      version: '1.0.0',
    };

    this.registerTheme(customTheme);
    return customTheme;
  }

  // Helper method to get available base theme names (without mode suffixes)
  public getAvailableBaseThemes(): string[] {
    return getAvailableThemeNames();
  }

  // Helper method to get current theme's base name and mode
  public getCurrentThemeInfo(): { baseName: string; mode: 'light' | 'dark' } {
    const currentTheme = this.getCurrentTheme();
    return {
      baseName: getThemeBaseName(currentTheme.name),
      mode: getThemeMode(currentTheme.name),
    };
  }

  private mergeObjects<T extends object>(base: T, override: Partial<T>): T {
    const result = Object.create(null);

    // Copy base properties
    for (const key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }

    // Apply overrides safely
    for (const key in override) {
      if (
        Object.prototype.hasOwnProperty.call(override, key) &&
        key !== '__proto__' &&
        key !== 'constructor' &&
        key !== 'prototype'
      ) {
        result[key] = override[key];
      }
    }

    return result;
  }

  public applyCSSVariables(theme: Theme): void {
    const root = document.documentElement;

    // Defensive check for style property
    if (!root || !root.style || typeof root.style.setProperty !== 'function') {
      console.warn('Cannot apply CSS variables: document.documentElement.style not available');
      return;
    }

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const varName = `--mdv-color-${this.kebabCase(key)}`;
      root.style.setProperty(varName, value);

      // Also create RGB versions for opacity support
      const rgb = this.hexToRgb(value);
      if (rgb) {
        root.style.setProperty(`${varName}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      }
    });

    // Apply font variables
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--mdv-font-${this.kebabCase(key)}`, value);
    });

    // Apply spacing variables
    root.style.setProperty('--mdv-spacing-unit', `${theme.spacing.unit}px`);
    root.style.setProperty('--mdv-container-max-width', theme.spacing.containerMaxWidth);
    root.style.setProperty('--mdv-sidebar-width', theme.spacing.sidebarWidth);

    // Apply other variables
    root.style.setProperty('--mdv-border-radius', theme.borderRadius);

    // Set theme attribute for CSS targeting
    root.setAttribute('data-mdv-theme', theme.name);
  }

  public getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  public isAccessible(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  }

  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private getSavedThemeName(): string | null {
    if (!this.options.enablePersistence || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      return localStorage.getItem(this.options.storageKey || 'mdv-theme');
    } catch {
      return null;
    }
  }

  private saveThemeName(name: string): void {
    if (!this.options.enablePersistence || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.options.storageKey || 'mdv-theme', name);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  public exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  public importTheme(themeJson: string): ThemePreset | null {
    try {
      const parsed = JSON.parse(themeJson);

      // Create a safe theme object to prevent prototype pollution
      const theme = this.createSafeTheme(parsed);

      this.validateTheme(theme);
      this.registerTheme(theme);
      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  private createSafeTheme(source: any): ThemePreset {
    // Create objects without prototype chain to prevent pollution
    const safeTheme = Object.create(null);

    // Only copy allowed properties
    const allowedKeys = [
      'name',
      'colors',
      'fonts',
      'spacing',
      'borderRadius',
      'description',
      'author',
      'version',
    ];

    for (const key of allowedKeys) {
      if (key in source && source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          // Deep copy objects safely
          safeTheme[key] = this.deepCopyObject(source[key]);
        } else {
          safeTheme[key] = source[key];
        }
      }
    }

    return safeTheme as ThemePreset;
  }

  private deepCopyObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    const result = Object.create(null);

    for (const key in obj) {
      // Skip prototype properties
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      // Skip dangerous keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = this.deepCopyObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }

    return result;
  }

  private validateTheme(theme: any): void {
    if (!theme.name || typeof theme.name !== 'string') {
      throw new Error('Theme must have a name');
    }

    if (!theme.colors || typeof theme.colors !== 'object') {
      throw new Error('Theme must have colors');
    }

    const requiredColors = [
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

    for (const color of requiredColors) {
      if (!theme.colors[color]) {
        throw new Error(`Theme missing required color: ${color}`);
      }
    }
  }
}
