import { Theme } from './types';

// Base theme definitions with light/dark variants
export const baseThemes = {
  default: {
    light: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#ffffff',
      surface: '#f3f4f6',
      text: '#111827',
      textPrimary: '#111827',
      textLight: '#6b7280',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      code: '#8b5cf6',
      codeBackground: '#f3f4f6',
      link: '#3b82f6',
      linkHover: '#2563eb',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#34d399',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textPrimary: '#f1f5f9',
      textLight: '#94a3b8',
      textSecondary: '#94a3b8',
      border: '#334155',
      code: '#a78bfa',
      codeBackground: '#1a202c',
      link: '#60a5fa',
      linkHover: '#93c5fd',
      error: '#f87171',
      warning: '#fbbf24',
      success: '#34d399',
    },
  },
  github: {
    light: {
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
      success: '#1a7f37',
    },
    dark: {
      primary: '#4493f8',
      secondary: '#3fb950',
      background: '#0d1117',
      surface: '#161b22',
      text: '#e6edf3',
      textPrimary: '#e6edf3',
      textLight: '#7d8590',
      textSecondary: '#7d8590',
      border: '#30363d',
      code: '#79c0ff',
      codeBackground: '#161b22',
      link: '#4493f8',
      linkHover: '#58a6ff',
      error: '#f85149',
      warning: '#d29922',
      success: '#3fb950',
    },
  },
  material: {
    light: {
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
      success: '#388e3c',
    },
    dark: {
      primary: '#42a5f5',
      secondary: '#26a69a',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textPrimary: '#ffffff',
      textLight: '#b3b3b3',
      textSecondary: '#b3b3b3',
      border: '#2e2e2e',
      code: '#ab47bc',
      codeBackground: '#1e1e1e',
      link: '#42a5f5',
      linkHover: '#64b5f6',
      error: '#f44336',
      warning: '#ff9800',
      success: '#4caf50',
    },
  },
};

// Helper function to create a theme with mode
function createTheme(baseName: string, mode: 'light' | 'dark'): Theme {
  const baseColors = baseThemes[baseName as keyof typeof baseThemes];
  if (!baseColors) {
    throw new Error(`Unknown theme: ${baseName}`);
  }

  return {
    name: `${baseName}-${mode}`,
    colors: baseColors[mode],
    fonts: {
      body: baseName === 'github' 
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
        : baseName === 'material'
        ? 'Roboto, "Helvetica Neue", Arial, sans-serif'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: baseName === 'github'
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
        : baseName === 'material'
        ? 'Roboto, "Helvetica Neue", Arial, sans-serif'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      code: baseName === 'github'
        ? 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
        : baseName === 'material'
        ? '"Roboto Mono", Consolas, Monaco, monospace'
        : '"Fira Code", "Consolas", "Monaco", "Andale Mono", "Ubuntu Mono", monospace',
    },
    spacing: {
      unit: 8,
      containerMaxWidth: '1200px',
      sidebarWidth: '320px',
    },
    borderRadius: baseName === 'material' ? '0.25rem' : '0.5rem',
  };
}

// Export default themes for backward compatibility
export const defaultTheme: Theme = createTheme('default', 'light');
export const darkTheme: Theme = createTheme('default', 'dark');

// Helper function to get theme name without mode suffix
export function getThemeBaseName(themeName: string): string {
  return themeName.replace(/-(light|dark)$/, '');
}

// Helper function to get theme mode from name
export function getThemeMode(themeName: string): 'light' | 'dark' {
  return themeName.endsWith('-dark') ? 'dark' : 'light';
}

// Helper function to toggle theme mode
export function toggleThemeMode(themeName: string): string {
  const baseName = getThemeBaseName(themeName);
  const currentMode = getThemeMode(themeName);
  const newMode = currentMode === 'light' ? 'dark' : 'light';
  return `${baseName}-${newMode}`;
}

// Helper function to create both light and dark variants of all themes
export function getAllThemeVariants(): Theme[] {
  const themes: Theme[] = [];
  
  Object.keys(baseThemes).forEach(baseName => {
    themes.push(createTheme(baseName, 'light'));
    themes.push(createTheme(baseName, 'dark'));
  });
  
  return themes;
}

// Get available theme names (just base names)
export function getAvailableThemeNames(): string[] {
  return Object.keys(baseThemes);
}

// Overloaded function for backward compatibility
 
export function createCustomTheme(overrides: Partial<Theme>): Theme;
// eslint-disable-next-line no-redeclare
export function createCustomTheme(baseName: string, mode: 'light' | 'dark', overrides: Partial<Theme>): Theme;
// eslint-disable-next-line no-redeclare
export function createCustomTheme(
  baseNameOrOverrides: string | Partial<Theme>,
  mode?: 'light' | 'dark',
  overrides?: Partial<Theme>
): Theme {
  // Handle old signature: createCustomTheme(overrides)
  if (typeof baseNameOrOverrides === 'object' && mode === undefined && overrides === undefined) {
    const legacyOverrides = baseNameOrOverrides;
    // For legacy usage, if name contains a known base theme, use it; otherwise use default
    let baseName = 'default';
    let themeMode: 'light' | 'dark' = 'light';
    
    if (legacyOverrides.name) {
      // Try to extract base name and mode from the legacy name
      const detectedBaseName = getThemeBaseName(legacyOverrides.name);
      if (Object.keys(baseThemes).includes(detectedBaseName)) {
        baseName = detectedBaseName;
        themeMode = getThemeMode(legacyOverrides.name);
      } else if (legacyOverrides.name === 'dark') {
        // Special case for old 'dark' theme name
        baseName = 'default';
        themeMode = 'dark';
      }
    }
    
    const baseTheme = createTheme(baseName, themeMode);
    
    return {
      ...baseTheme,
      ...legacyOverrides,
      name: legacyOverrides.name || `${baseName}-${themeMode}`,
      colors: {
        ...baseTheme.colors,
        ...(legacyOverrides.colors || {}),
      },
      fonts: {
        ...baseTheme.fonts,
        ...(legacyOverrides.fonts || {}),
      },
      spacing: {
        ...baseTheme.spacing,
        ...(legacyOverrides.spacing || {}),
      },
    };
  }
  
  // Handle new signature: createCustomTheme(baseName, mode, overrides)
  if (typeof baseNameOrOverrides === 'string' && mode && overrides) {
    const baseName = baseNameOrOverrides;
    const baseTheme = createTheme(baseName, mode);
    
    return {
      ...baseTheme,
      ...overrides,
      name: overrides.name || `${baseName}-${mode}`,
      colors: {
        ...baseTheme.colors,
        ...(overrides.colors || {}),
      },
      fonts: {
        ...baseTheme.fonts,
        ...(overrides.fonts || {}),
      },
      spacing: {
        ...baseTheme.spacing,
        ...(overrides.spacing || {}),
      },
    };
  }
  
  throw new Error('Invalid arguments to createCustomTheme. Use either createCustomTheme(overrides) or createCustomTheme(baseName, mode, overrides)');
}
