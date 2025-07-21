# Theming Guide

The Markdown Docs Viewer includes a comprehensive theming system that allows you to customize the appearance of your documentation to match your brand or preferences.

## Table of Contents

- [Quick Start](#quick-start)
- [Built-in Themes](#built-in-themes)
- [Theme Configuration](#theme-configuration)
- [Creating Custom Themes](#creating-custom-themes)
- [Theme API Reference](#theme-api-reference)
- [CSS Variables](#css-variables)
- [Accessibility](#accessibility)
- [Examples](#examples)

## Quick Start

### Using a Built-in Theme

```javascript
import { MarkdownDocsViewer, darkTheme } from 'markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: darkTheme, // Use the built-in dark theme
    source: {
        type: 'local',
        documents: [/* ... */]
    }
});
```

### Enabling Theme Switching

```javascript
const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: {
        name: 'default',
        switcherPosition: 'header', // Show theme switcher in header
        allowCustomThemes: true,
        enablePersistence: true // Remember user's choice
    },
    source: {
        type: 'local',
        documents: [/* ... */]
    }
});
```

## Built-in Themes

The viewer includes 8 professionally designed themes:

### Light Themes

1. **Default** - Clean and modern light theme
   - Primary: Blue (#3b82f6)
   - Best for: General documentation

2. **GitHub** - GitHub-inspired theme
   - Primary: GitHub Blue (#0969da)
   - Best for: Developer documentation

3. **Solarized Light** - Precision colors for reduced eye strain
   - Primary: Blue (#268bd2)
   - Best for: Long reading sessions

4. **Material** - Material Design inspired
   - Primary: Material Blue (#1976d2)
   - Best for: Modern web applications

### Dark Themes

5. **Dark** - Easy on the eyes dark theme
   - Background: Navy (#0f172a)
   - Best for: Night time reading

6. **Dracula** - Popular dark theme with vibrant colors
   - Background: Dark Purple (#282a36)
   - Best for: Developers who love Dracula theme

7. **Solarized Dark** - Precision colors (dark variant)
   - Background: Dark Blue (#002b36)
   - Best for: Terminal enthusiasts

### Accessibility

8. **High Contrast** - WCAG AAA compliant
   - Maximum contrast ratios
   - Best for: Users with visual impairments

## Theme Configuration

### Configuration Options

```typescript
interface ThemeConfig {
    // Theme name or theme object
    name?: string;
    
    // Theme switcher options
    switcherPosition?: 'header' | 'footer' | 'sidebar' | 'floating';
    showPreview?: boolean;      // Show color preview in switcher
    showDescription?: boolean;   // Show theme descriptions
    allowCustomThemes?: boolean; // Allow custom theme creation
    
    // Persistence options
    enablePersistence?: boolean; // Save theme choice to localStorage
    storageKey?: string;        // Custom storage key (default: 'mdv-theme')
    
    // Callbacks
    onThemeChange?: (theme: Theme) => void;
}
```

### Example Configuration

```javascript
const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: {
        name: 'github',
        switcherPosition: 'floating',
        showPreview: true,
        showDescription: true,
        allowCustomThemes: true,
        enablePersistence: true,
        storageKey: 'my-docs-theme'
    },
    onThemeChange: (theme) => {
        console.log('Theme changed to:', theme.name);
        // Update other UI elements if needed
    }
});
```

## Creating Custom Themes

### Method 1: Extend an Existing Theme

```javascript
// Create a custom theme based on the default theme
const customTheme = viewer.createCustomTheme('my-brand', {
    colors: {
        primary: '#e91e63',      // Pink
        secondary: '#9c27b0',    // Purple
        link: '#e91e63',
        linkHover: '#d81b60'
    }
});

// Apply the custom theme
viewer.setTheme('my-brand');
```

### Method 2: Complete Theme Definition

```javascript
const brandTheme = {
    name: 'company-brand',
    colors: {
        // Primary colors
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        
        // Background colors
        background: '#ffffff',
        surface: '#f7f9fc',
        
        // Text colors
        text: '#2d3748',
        textPrimary: '#1a202c',
        textSecondary: '#718096',
        
        // UI colors
        border: '#e2e8f0',
        code: '#805ad5',
        codeBackground: '#f7fafc',
        
        // Interactive colors
        link: '#3182ce',
        linkHover: '#2c5aa0',
        
        // Status colors
        error: '#e53e3e',
        warning: '#dd6b20',
        success: '#38a169'
    },
    fonts: {
        body: '"Inter", -apple-system, sans-serif',
        heading: '"Inter", -apple-system, sans-serif',
        code: '"Fira Code", "Consolas", monospace'
    },
    spacing: {
        unit: 8,
        containerMaxWidth: '1200px',
        sidebarWidth: '320px'
    },
    borderRadius: '0.5rem',
    customCSS: `
        /* Add custom styles */
        .mdv-header {
            backdrop-filter: blur(10px);
            background-color: rgba(255, 255, 255, 0.9);
        }
    `
};

// Register and use the theme
viewer.registerTheme(brandTheme);
viewer.setTheme('company-brand');
```

### Method 3: Dynamic Theme Creation

```javascript
// Create a theme from user input
function createUserTheme(name, primaryColor) {
    // Generate a complete color palette from a primary color
    const theme = viewer.createCustomTheme(name, {
        colors: {
            primary: primaryColor,
            secondary: adjustBrightness(primaryColor, -20),
            link: primaryColor,
            linkHover: adjustBrightness(primaryColor, -10)
        }
    });
    
    return theme;
}

// Helper function to adjust color brightness
function adjustBrightness(hex, percent) {
    // Implementation details...
}
```

## Theme API Reference

### Viewer Methods

```javascript
// Set theme by name or object
viewer.setTheme('dark');
viewer.setTheme(customThemeObject);

// Get current theme
const currentTheme = viewer.getTheme();

// Get all available themes
const themes = viewer.getAvailableThemes();

// Register a new theme
viewer.registerTheme(myTheme);

// Create custom theme
const custom = viewer.createCustomTheme(name, overrides);
```

### ThemeManager Methods

```javascript
// Access the theme manager
const themeManager = viewer.themeManager;

// Apply CSS variables
themeManager.applyCSSVariables(theme);

// Check contrast ratios
const ratio = themeManager.getContrastRatio('#000000', '#ffffff');

// Check WCAG compliance
const isAccessible = themeManager.isAccessible(
    foregroundColor,
    backgroundColor,
    'AA' // or 'AAA'
);

// Export/Import themes
const json = themeManager.exportTheme(theme);
const imported = themeManager.importTheme(json);
```

## CSS Variables

All theme colors are exposed as CSS custom properties:

```css
/* Color variables */
--mdv-color-primary
--mdv-color-secondary
--mdv-color-background
--mdv-color-surface
--mdv-color-text
--mdv-color-text-primary
--mdv-color-text-secondary
--mdv-color-border
--mdv-color-code
--mdv-color-code-background
--mdv-color-link
--mdv-color-link-hover
--mdv-color-error
--mdv-color-warning
--mdv-color-success

/* RGB versions for opacity */
--mdv-color-primary-rgb
--mdv-color-secondary-rgb
/* ... etc */

/* Font variables */
--mdv-font-body
--mdv-font-heading
--mdv-font-code

/* Spacing variables */
--mdv-spacing-unit
--mdv-container-max-width
--mdv-sidebar-width
--mdv-border-radius
```

### Using CSS Variables

```css
/* Custom component using theme variables */
.my-custom-button {
    background-color: var(--mdv-color-primary);
    color: white;
    border-radius: var(--mdv-border-radius);
    padding: calc(var(--mdv-spacing-unit) * 2);
}

/* Semi-transparent background */
.my-overlay {
    background-color: rgba(var(--mdv-color-primary-rgb), 0.1);
}
```

## Accessibility

### Contrast Requirements

The theme system includes built-in contrast checking:

```javascript
// Check theme accessibility
function auditTheme(theme) {
    const tm = viewer.themeManager;
    
    const critical = [
        ['textPrimary', 'background', 4.5],    // Normal text
        ['textSecondary', 'background', 4.5],  // Secondary text
        ['link', 'background', 4.5],           // Links
        ['primary', 'surface', 3.0]            // Large text
    ];
    
    critical.forEach(([fg, bg, required]) => {
        const ratio = tm.getContrastRatio(
            theme.colors[fg],
            theme.colors[bg]
        );
        
        if (ratio < required) {
            console.warn(`Low contrast: ${fg} on ${bg} (${ratio.toFixed(2)}:1)`);
        }
    });
}
```

### Best Practices

1. **Test all color combinations** - Ensure text is readable on all backgrounds
2. **Provide high contrast option** - Include at least one high contrast theme
3. **Consider color blindness** - Test themes with color blindness simulators
4. **Use semantic colors** - Keep error=red, success=green, warning=yellow
5. **Test in different lighting** - Themes should work in various environments

## Examples

### Example 1: Minimal Theme

```javascript
const minimalTheme = viewer.createCustomTheme('minimal', {
    colors: {
        primary: '#000000',
        background: '#ffffff',
        border: '#000000'
    },
    borderRadius: '0'
});
```

### Example 2: Gradient Theme

```javascript
const gradientTheme = {
    name: 'gradient',
    colors: defaultTheme.colors,
    fonts: defaultTheme.fonts,
    spacing: defaultTheme.spacing,
    borderRadius: '1rem',
    customCSS: `
        .mdv-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .mdv-nav-link.active {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
    `
};
```

### Example 3: System Theme Sync

```javascript
// Sync with system dark mode preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function syncSystemTheme() {
    viewer.setTheme(mediaQuery.matches ? 'dark' : 'default');
}

// Initial sync
syncSystemTheme();

// Listen for changes
mediaQuery.addEventListener('change', syncSystemTheme);
```

### Example 4: Theme from URL

```javascript
// Load theme from URL parameter
const params = new URLSearchParams(window.location.search);
const themeName = params.get('theme');

if (themeName && viewer.getAvailableThemes().find(t => t.name === themeName)) {
    viewer.setTheme(themeName);
}
```

## Theme Gallery

Visit our [Theme Demo](../examples/theme-demo.html) to:
- Preview all built-in themes
- Create custom themes interactively
- Export/import theme configurations
- Check contrast ratios
- Test theme accessibility

## Troubleshooting

### Theme not persisting
- Check if `enablePersistence` is set to `true`
- Verify localStorage is available
- Check for browser privacy settings

### Custom CSS not applying
- Ensure CSS selectors are specific enough
- Check for syntax errors in customCSS
- Verify theme is properly registered

### Poor contrast warnings
- Use the contrast checker tool
- Adjust color values for better ratios
- Consider providing alternative themes

### Theme switcher not appearing
- Verify `switcherPosition` is set correctly
- Check if theme configuration is valid
- Ensure container has enough space