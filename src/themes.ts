import { Theme } from './types';
import fontMappings from './font-mappings.json';

// Base theme definitions with light/dark variants - internal use only
const baseThemes = {
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
  vscode: {
    light: {
      primary: '#0078d4',
      secondary: '#00bcf2',
      background: '#ffffff',
      surface: '#f3f3f3',
      text: '#323130',
      textPrimary: '#323130',
      textLight: '#605e5c',
      textSecondary: '#605e5c',
      border: '#c8c6c4',
      code: '#d83b01',
      codeBackground: '#f3f2f1',
      link: '#0078d4',
      linkHover: '#106ebe',
      error: '#d13438',
      warning: '#ff8c00',
      success: '#107c10',
    },
    dark: {
      primary: '#0078d4',
      secondary: '#00bcf2',
      background: '#1e1e1e',
      surface: '#252526',
      text: '#cccccc',
      textPrimary: '#cccccc',
      textLight: '#969696',
      textSecondary: '#969696',
      border: '#3c3c3c',
      code: '#569cd6',
      codeBackground: '#1e1e1e',
      link: '#3794ff',
      linkHover: '#1f7ce6',
      error: '#f14c4c',
      warning: '#ff8c00',
      success: '#89d185',
    },
  },
  nord: {
    light: {
      primary: '#5e81ac',
      secondary: '#88c0d0',
      background: '#eceff4',
      surface: '#e5e9f0',
      text: '#2e3440',
      textPrimary: '#2e3440',
      textLight: '#4c566a',
      textSecondary: '#4c566a',
      border: '#d8dee9',
      code: '#b48ead',
      codeBackground: '#e5e9f0',
      link: '#5e81ac',
      linkHover: '#81a1c1',
      error: '#bf616a',
      warning: '#ebcb8b',
      success: '#a3be8c',
    },
    dark: {
      primary: '#88c0d0',
      secondary: '#8fbcbb',
      background: '#2e3440',
      surface: '#3b4252',
      text: '#eceff4',
      textPrimary: '#eceff4',
      textLight: '#d8dee9',
      textSecondary: '#d8dee9',
      border: '#4c566a',
      code: '#b48ead',
      codeBackground: '#3b4252',
      link: '#88c0d0',
      linkHover: '#8fbcbb',
      error: '#bf616a',
      warning: '#ebcb8b',
      success: '#a3be8c',
    },
  },
  dracula: {
    light: {
      primary: '#6272a4',
      secondary: '#8be9fd',
      background: '#f8f8f2',
      surface: '#f0f0f0',
      text: '#282a36',
      textPrimary: '#282a36',
      textLight: '#6272a4',
      textSecondary: '#6272a4',
      border: '#e0e0e0',
      code: '#bd93f9',
      codeBackground: '#f0f0f0',
      link: '#6272a4',
      linkHover: '#44475a',
      error: '#ff5555',
      warning: '#ffb86c',
      success: '#50fa7b',
    },
    dark: {
      primary: '#bd93f9',
      secondary: '#8be9fd',
      background: '#282a36',
      surface: '#44475a',
      text: '#f8f8f2',
      textPrimary: '#f8f8f2',
      textLight: '#6272a4',
      textSecondary: '#6272a4',
      border: '#6272a4',
      code: '#ff79c6',
      codeBackground: '#44475a',
      link: '#8be9fd',
      linkHover: '#50fa7b',
      error: '#ff5555',
      warning: '#ffb86c',
      success: '#50fa7b',
    },
  },
  solarized: {
    light: {
      primary: '#268bd2',
      secondary: '#2aa198',
      background: '#fdf6e3',
      surface: '#eee8d5',
      text: '#586e75', // Darkened from #657b83 for better contrast
      textPrimary: '#073642',
      textLight: '#586e75', // Darkened from #93a1a1 for WCAG AA
      textSecondary: '#586e75', // Darkened from #839496 for readability
      border: '#93a1a1',
      code: '#d33682',
      codeBackground: '#eee8d5',
      link: '#268bd2',
      linkHover: '#2aa198',
      error: '#dc322f',
      warning: '#b58900',
      success: '#859900',
    },
    dark: {
      primary: '#268bd2',
      secondary: '#2aa198',
      background: '#002b36',
      surface: '#073642',
      text: '#839496',
      textPrimary: '#93a1a1',
      textLight: '#657b83',
      textSecondary: '#586e75',
      border: '#586e75',
      code: '#d33682',
      codeBackground: '#073642',
      link: '#268bd2',
      linkHover: '#2aa198',
      error: '#dc322f',
      warning: '#b58900',
      success: '#859900',
    },
  },
  monokai: {
    light: {
      primary: '#f92672',
      secondary: '#a6e22e',
      background: '#fafafa',
      surface: '#f0f0f0',
      text: '#272822',
      textPrimary: '#272822',
      textLight: '#75715e',
      textSecondary: '#75715e',
      border: '#e0e0e0',
      code: '#ae81ff',
      codeBackground: '#f0f0f0',
      link: '#f92672',
      linkHover: '#fd971f',
      error: '#f92672',
      warning: '#fd971f',
      success: '#a6e22e',
    },
    dark: {
      primary: '#f92672',
      secondary: '#a6e22e',
      background: '#272822',
      surface: '#3e3d32',
      text: '#f8f8f2',
      textPrimary: '#f8f8f2',
      textLight: '#75715e',
      textSecondary: '#75715e',
      border: '#49483e',
      code: '#ae81ff',
      codeBackground: '#3e3d32',
      link: '#66d9ef',
      linkHover: '#a6e22e',
      error: '#f92672',
      warning: '#fd971f',
      success: '#a6e22e',
    },
  },
  ayu: {
    light: {
      primary: '#399ee6',
      secondary: '#86b300',
      background: '#fafafa',
      surface: '#f3f4f5',
      text: '#5c6166',
      textPrimary: '#5c6166',
      textLight: '#5c6166', // Darkened from #828c99 to match main text
      textSecondary: '#5c6166', // Darkened from #828c99 for WCAG compliance
      border: '#e7eaed',
      code: '#a37acc',
      codeBackground: '#f3f4f5',
      link: '#399ee6',
      linkHover: '#4cbf99',
      error: '#f07178',
      warning: '#ff8f40',
      success: '#86b300',
    },
    dark: {
      primary: '#39bae6',
      secondary: '#95e6cb',
      background: '#0b0e14',
      surface: '#11151c',
      text: '#b3b1ad',
      textPrimary: '#e6e1cf',
      textLight: '#4d5566',
      textSecondary: '#626a73',
      border: '#1e232a',
      code: '#d4bfff',
      codeBackground: '#11151c',
      link: '#39bae6',
      linkHover: '#95e6cb',
      error: '#f28779',
      warning: '#ffb454',
      success: '#bae67e',
    },
  },
  catppuccin: {
    light: {
      primary: '#1e66f5',
      secondary: '#179299',
      background: '#eff1f5',
      surface: '#e6e9ef',
      text: '#4c4f69',
      textPrimary: '#4c4f69',
      textLight: '#6c6f85',
      textSecondary: '#6c6f85',
      border: '#bcc0cc',
      code: '#8839ef',
      codeBackground: '#e6e9ef',
      link: '#1e66f5',
      linkHover: '#04a5e5',
      error: '#d20f39',
      warning: '#df8e1d',
      success: '#40a02b',
    },
    dark: {
      primary: '#89b4fa',
      secondary: '#94e2d5',
      background: '#1e1e2e',
      surface: '#313244',
      text: '#cdd6f4',
      textPrimary: '#cdd6f4',
      textLight: '#a6adc8',
      textSecondary: '#a6adc8',
      border: '#45475a',
      code: '#cba6f7',
      codeBackground: '#313244',
      link: '#89b4fa',
      linkHover: '#94e2d5',
      error: '#f38ba8',
      warning: '#fab387',
      success: '#a6e3a1',
    },
  },
  tokyo: {
    light: {
      primary: '#3d59a1',
      secondary: '#006a83',
      background: '#d5d6db',
      surface: '#e1e2e7',
      text: '#0d2258',
      textPrimary: '#0d2258',
      textLight: '#5c5f69', // Significantly darkened from #9699a3 for 4.5:1 ratio
      textSecondary: '#5c5f69', // Significantly darkened from #9699a3 for readability
      border: '#a8adb7',
      code: '#5a4a78',
      codeBackground: '#e1e2e7',
      link: '#3d59a1',
      linkHover: '#634da0',
      error: '#8c4351',
      warning: '#8f5e15',
      success: '#485e30',
    },
    dark: {
      primary: '#7aa2f7',
      secondary: '#7dcfff',
      background: '#1a1b26',
      surface: '#24283b',
      text: '#c0caf5',
      textPrimary: '#c0caf5',
      textLight: '#565f89',
      textSecondary: '#565f89',
      border: '#414868',
      code: '#bb9af7',
      codeBackground: '#24283b',
      link: '#7aa2f7',
      linkHover: '#7dcfff',
      error: '#f7768e',
      warning: '#e0af68',
      success: '#9ece6a',
    },
  },
};

// Helper function to get appropriate font family for a theme
function getFontFamily(baseName: string, type: 'body' | 'heading' | 'code'): string {
  const themeMapping = fontMappings[baseName as keyof typeof fontMappings];
  return themeMapping ? themeMapping[type] : fontMappings.default[type];
}

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
      body: getFontFamily(baseName, 'body'),
      heading: getFontFamily(baseName, 'heading'),
      code: getFontFamily(baseName, 'code'),
    },
    spacing: {
      unit: 8,
      containerMaxWidth: '1200px',
      sidebarWidth: '320px',
    },
    borderRadius: baseName === 'material' ? '0.25rem' : '0.5rem',
  };
}

// Helper function to get theme name without mode suffix
export function getThemeBaseName(themeName: string): string {
  return themeName.replace(/-(light|dark)$/, '');
}

// Helper function to get theme mode from name
export function getThemeMode(themeName: string): 'light' | 'dark' {
  return themeName.endsWith('-dark') ? 'dark' : 'light';
}

// Overloaded function for backward compatibility

export function createCustomTheme(overrides: Partial<Theme>): Theme;
// eslint-disable-next-line no-redeclare
export function createCustomTheme(
  baseName: string,
  mode: 'light' | 'dark',
  overrides: Partial<Theme>
): Theme;
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
      } else if (legacyOverrides.name === 'dark' || legacyOverrides.name.includes('-dark')) {
        // Special case for old 'dark' theme name or names containing '-dark'
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

  throw new Error(
    'Invalid arguments to createCustomTheme. Use either createCustomTheme(overrides) or createCustomTheme(baseName, mode, overrides)'
  );
}

// Type for the exported themes object
type ThemesExport = { [key: string]: { light: Theme; dark: Theme } };

// Export themes object - generated programmatically from baseThemes
export const themes = Object.keys(baseThemes).reduce((acc, baseName) => {
  const key = baseName as keyof typeof baseThemes;
  acc[key] = {
    light: createTheme(key, 'light'),
    dark: createTheme(key, 'dark'),
  };
  return acc;
}, {} as ThemesExport);

// Export utility functions for getting all theme variants
export function getAllThemeVariants(): Theme[] {
  const allThemes: Theme[] = [];
  Object.keys(themes).forEach(baseName => {
    const themeGroup = themes[baseName as keyof typeof themes];
    allThemes.push(themeGroup.light);
    allThemes.push(themeGroup.dark);
  });
  return allThemes;
}

// Export utility function for getting available theme names
export function getAvailableThemeNames(): string[] {
  return Object.keys(themes);
}
