import { Theme } from './types';
import { defaultTheme, darkTheme } from './themes';

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
  private currentTheme: Theme;
  private themes: Map<string, ThemePreset>;
  private options: ThemeManagerOptions;
  private container: HTMLElement | null = null;
  
  constructor(options: ThemeManagerOptions = {}) {
    this.options = {
      enablePersistence: true,
      storageKey: 'mdv-theme',
      ...options
    };
    
    this.themes = new Map();
    this.initializeBuiltInThemes();
    
    // Load saved theme or use default
    const savedThemeName = this.getSavedThemeName();
    this.currentTheme = savedThemeName ? (this.themes.get(savedThemeName) || defaultTheme) : defaultTheme;
  }
  
  private initializeBuiltInThemes(): void {
    // Light theme (default)
    this.registerTheme({
      ...defaultTheme,
      description: 'Clean and modern light theme',
      author: 'MarkdownDocsViewer',
      version: '1.0.0'
    });
    
    // Dark theme
    this.registerTheme({
      ...darkTheme,
      description: 'Easy on the eyes dark theme',
      author: 'MarkdownDocsViewer',
      version: '1.0.0'
    });
    
    // High contrast theme
    this.registerTheme({
      name: 'high-contrast',
      description: 'High contrast theme for improved accessibility',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#0066cc',
        secondary: '#008055',
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textPrimary: '#000000',
        textLight: '#333333',
        textSecondary: '#333333',
        border: '#000000',
        code: '#6600cc',
        codeBackground: '#ffffcc',
        link: '#0066cc',
        linkHover: '#0044aa',
        error: '#cc0000',
        warning: '#cc6600',
        success: '#008055'
      },
      fonts: defaultTheme.fonts,
      spacing: defaultTheme.spacing,
      borderRadius: '0.25rem'
    });
    
    // GitHub theme
    this.registerTheme({
      name: 'github',
      description: 'GitHub-inspired theme',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#0969da',
        secondary: '#1a7f37',
        background: '#ffffff',
        surface: '#f6f8fa',
        text: '#1f2328',
        textPrimary: '#1f2328',
        textLight: '#656d76',
        textSecondary: '#656d76',
        border: '#d0d7de',
        code: '#0550ae',
        codeBackground: '#f6f8fa',
        link: '#0969da',
        linkHover: '#0860ca',
        error: '#d1242f',
        warning: '#9a6700',
        success: '#1a7f37'
      },
      fonts: {
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        code: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
      },
      spacing: defaultTheme.spacing,
      borderRadius: '0.375rem'
    });
    
    // Dracula theme
    this.registerTheme({
      name: 'dracula',
      description: 'Popular dark theme with vibrant colors',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#bd93f9',
        secondary: '#50fa7b',
        background: '#282a36',
        surface: '#44475a',
        text: '#f8f8f2',
        textPrimary: '#f8f8f2',
        textLight: '#6272a4',
        textSecondary: '#6272a4',
        border: '#44475a',
        code: '#ff79c6',
        codeBackground: '#44475a',
        link: '#8be9fd',
        linkHover: '#9aedfe',
        error: '#ff5555',
        warning: '#ffb86c',
        success: '#50fa7b'
      },
      fonts: defaultTheme.fonts,
      spacing: defaultTheme.spacing,
      borderRadius: '0.5rem'
    });
    
    // Solarized Light theme
    this.registerTheme({
      name: 'solarized-light',
      description: 'Precision colors for machines and people',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#268bd2',
        secondary: '#859900',
        background: '#fdf6e3',
        surface: '#eee8d5',
        text: '#657b83',
        textPrimary: '#586e75',
        textLight: '#93a1a1',
        textSecondary: '#93a1a1',
        border: '#eee8d5',
        code: '#b58900',
        codeBackground: '#eee8d5',
        link: '#268bd2',
        linkHover: '#1e6fa8',
        error: '#dc322f',
        warning: '#cb4b16',
        success: '#859900'
      },
      fonts: defaultTheme.fonts,
      spacing: defaultTheme.spacing,
      borderRadius: '0.375rem'
    });
    
    // Solarized Dark theme
    this.registerTheme({
      name: 'solarized-dark',
      description: 'Precision colors for machines and people (dark)',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#268bd2',
        secondary: '#859900',
        background: '#002b36',
        surface: '#073642',
        text: '#839496',
        textPrimary: '#93a1a1',
        textLight: '#586e75',
        textSecondary: '#586e75',
        border: '#073642',
        code: '#b58900',
        codeBackground: '#073642',
        link: '#268bd2',
        linkHover: '#1e6fa8',
        error: '#dc322f',
        warning: '#cb4b16',
        success: '#859900'
      },
      fonts: defaultTheme.fonts,
      spacing: defaultTheme.spacing,
      borderRadius: '0.375rem'
    });
    
    // Material theme
    this.registerTheme({
      name: 'material',
      description: 'Material Design inspired theme',
      author: 'MarkdownDocsViewer',
      version: '1.0.0',
      colors: {
        primary: '#1976d2',
        secondary: '#00897b',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#212121',
        textPrimary: '#212121',
        textLight: '#757575',
        textSecondary: '#757575',
        border: '#e0e0e0',
        code: '#673ab7',
        codeBackground: '#f5f5f5',
        link: '#1976d2',
        linkHover: '#1565c0',
        error: '#d32f2f',
        warning: '#f57c00',
        success: '#388e3c'
      },
      fonts: {
        body: 'Roboto, "Helvetica Neue", Arial, sans-serif',
        heading: 'Roboto, "Helvetica Neue", Arial, sans-serif',
        code: '"Roboto Mono", Consolas, Monaco, monospace'
      },
      spacing: defaultTheme.spacing,
      borderRadius: '0.25rem'
    });
  }
  
  public registerTheme(theme: ThemePreset): void {
    this.themes.set(theme.name, theme);
  }
  
  public setTheme(themeName: string): Theme | null {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
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
    const customTheme: ThemePreset = {
      ...baseTheme,
      ...overrides,
      name,
      colors: {
        ...baseTheme.colors,
        ...(overrides.colors || {})
      },
      fonts: {
        ...baseTheme.fonts,
        ...(overrides.fonts || {})
      },
      spacing: {
        ...baseTheme.spacing,
        ...(overrides.spacing || {})
      },
      description: 'Custom theme',
      author: 'User',
      version: '1.0.0'
    };
    
    this.registerTheme(customTheme);
    return customTheme;
  }
  
  public applyCSSVariables(theme: Theme): void {
    const root = document.documentElement;
    
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
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
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
      const theme = JSON.parse(themeJson) as ThemePreset;
      this.validateTheme(theme);
      this.registerTheme(theme);
      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }
  
  private validateTheme(theme: any): void {
    if (!theme.name || typeof theme.name !== 'string') {
      throw new Error('Theme must have a name');
    }
    
    if (!theme.colors || typeof theme.colors !== 'object') {
      throw new Error('Theme must have colors');
    }
    
    const requiredColors = [
      'primary', 'secondary', 'background', 'surface', 
      'text', 'textPrimary', 'textSecondary', 'border'
    ];
    
    for (const color of requiredColors) {
      if (!theme.colors[color]) {
        throw new Error(`Theme missing required color: ${color}`);
      }
    }
  }
}