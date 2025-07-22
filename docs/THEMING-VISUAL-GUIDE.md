# Theming Visual Guide

This guide provides visual examples and detailed instructions for using the theming features in Markdown Docs Viewer.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Theme Switcher](#theme-switcher)
3. [Dark Mode Toggle](#dark-mode-toggle)
4. [Built-in Themes](#built-in-themes)
5. [Custom Themes](#custom-themes)
6. [CSS Customization](#css-customization)
7. [Theme Persistence](#theme-persistence)
8. [Events and API](#events-and-api)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Setup with Theme Controls

```javascript
import { MarkdownDocsViewer } from '@austinorphan/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
  container: '#docs',
  theme: {
    // Both controls appear in header by default
    switcherPosition: 'header',
    darkTogglePosition: 'header',
    showDarkModeLabel: true,
    enablePersistence: true,
  },
  source: {
    // Your documents
  },
});
```

### Minimal Dark Mode Toggle

```javascript
const viewer = new MarkdownDocsViewer({
  container: '#docs',
  theme: {
    darkTogglePosition: 'header',
    compactDarkToggle: true,
    showDarkModeLabel: false,
  },
});
```

## Theme Switcher

The theme switcher provides a dropdown interface for selecting themes.

### Configuration Options

```javascript
theme: {
  switcherPosition: 'header', // 'header' | 'footer' | 'sidebar' | 'floating'
  showPreview: true,          // Show color swatches
  showDescription: true,      // Show theme descriptions
  allowCustomThemes: true     // Enable custom theme creation
}
```

### Visual Examples

#### Header Position (Default)

The theme switcher appears in the top right of the header, showing the current theme name with a dropdown arrow.

#### Floating Position

```javascript
theme: {
  switcherPosition: 'floating';
}
```

Creates a floating button in the bottom right corner of the viewport.

#### Custom Styling

```css
/* Customize the theme switcher appearance */
.mdv-theme-switcher .mdv-theme-trigger {
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
}

.mdv-theme-dropdown {
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

## Dark Mode Toggle

A simple switch for toggling between light and dark themes.

### Configuration Options

```javascript
theme: {
  darkTogglePosition: 'header',  // 'header' | 'footer' | 'floating'
  showDarkModeLabel: true,       // Show "Light/Dark Mode" text
  compactDarkToggle: false       // Use smaller toggle
}
```

### Visual States

#### Light Mode

- Sun icon displayed
- Light background on toggle track
- Label shows "Light Mode" (if enabled)

#### Dark Mode

- Moon icon displayed
- Primary color background on toggle track
- Label shows "Dark Mode" (if enabled)

### Compact Mode

```javascript
theme: {
  compactDarkToggle: true,
  showDarkModeLabel: false
}
```

Creates a smaller toggle without labels, perfect for tight spaces.

## Built-in Themes

### Light Themes

#### Default Theme

```javascript
import { defaultTheme } from '@austinorphan/markdown-docs-viewer';
viewer.setTheme('default');
```

- Clean, modern design
- Blue primary color (#3b82f6)
- High readability

#### GitHub Theme

```javascript
viewer.setTheme('github');
```

- GitHub-inspired colors
- Familiar developer experience
- Optimized for code

#### Material Theme

```javascript
viewer.setTheme('material');
```

- Material Design principles
- Subtle shadows and depth
- Roboto font family

### Dark Themes

#### Dark Theme

```javascript
import { darkTheme } from '@austinorphan/markdown-docs-viewer';
viewer.setTheme('dark');
```

- Easy on the eyes
- High contrast text
- Blue accent colors

#### Dracula Theme

```javascript
viewer.setTheme('dracula');
```

- Popular dark theme
- Vibrant colors
- Purple and green accents

### Accessibility Theme

#### High Contrast

```javascript
viewer.setTheme('high-contrast');
```

- Maximum contrast ratios
- WCAG AAA compliant
- Clear focus indicators

## Custom Themes

### Creating a Custom Theme

```javascript
// Method 1: Extend existing theme
const myTheme = viewer.createCustomTheme('my-theme', {
  colors: {
    primary: '#e91e63',
    secondary: '#9c27b0',
  },
});

// Method 2: Complete theme object
viewer.registerTheme({
  name: 'brand-theme',
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#2d3436',
    textPrimary: '#2d3436',
    textSecondary: '#636e72',
    textLight: '#95a5a6',
    border: '#e9ecef',
    code: '#6c5ce7',
    codeBackground: '#f8f9fa',
    link: '#0984e3',
    linkHover: '#0056b3',
    error: '#d63031',
    warning: '#fdcb6e',
    success: '#00b894',
  },
  fonts: {
    body: 'Inter, -apple-system, sans-serif',
    heading: 'Inter, -apple-system, sans-serif',
    code: 'JetBrains Mono, monospace',
  },
  spacing: {
    unit: 8,
    containerMaxWidth: '1200px',
    sidebarWidth: '300px',
  },
  borderRadius: '0.5rem',
});
```

### Theme with Custom CSS

```javascript
viewer.registerTheme({
  name: 'gradient-theme',
  // ... colors, fonts, spacing ...
  customCSS: `
    /* Gradient header */
    .mdv-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    /* Animated links */
    .mdv-nav-link {
      transition: all 0.3s ease;
    }
    
    .mdv-nav-link:hover {
      transform: translateX(5px);
      color: var(--mdv-color-primary);
    }
    
    /* Custom scrollbar */
    .mdv-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .mdv-content::-webkit-scrollbar-track {
      background: var(--mdv-color-surface);
    }
    
    .mdv-content::-webkit-scrollbar-thumb {
      background: var(--mdv-color-primary);
      border-radius: 4px;
    }
  `,
});
```

## CSS Customization

### Styling the Controls

```css
/* Dark mode toggle customization */
.mdv-dark-mode-toggle {
  /* Position adjustments */
  margin-right: 16px;
}

.mdv-dark-toggle-btn {
  /* Custom toggle appearance */
  width: 60px;
  height: 30px;
}

.mdv-dark-toggle-track {
  /* Custom colors */
  background: #e0e0e0;
}

.mdv-dark-toggle-btn.dark .mdv-dark-toggle-track {
  background: linear-gradient(45deg, #1a1a2e, #16213e);
}

/* Theme switcher customization */
.mdv-theme-switcher .mdv-theme-trigger {
  /* Custom button style */
  border: 2px solid var(--mdv-color-primary);
  background: transparent;
  color: var(--mdv-color-primary);
}

.mdv-theme-switcher .mdv-theme-trigger:hover {
  background: var(--mdv-color-primary);
  color: white;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .mdv-header-actions {
    gap: 8px;
  }

  .mdv-dark-toggle-label,
  .mdv-theme-name {
    display: none;
  }
}
```

### Layout Examples

#### Side-by-Side in Header

```css
.mdv-header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}
```

#### Stacked Vertically

```css
.mdv-header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
```

#### Custom Positions

```javascript
// Place controls in custom container
const controls = document.getElementById('my-controls');
controls.innerHTML = `
  ${viewer.darkModeToggle.render()}
  ${viewer.themeSwitcher.render()}
`;
viewer.darkModeToggle.attachTo(controls.querySelector('.mdv-dark-mode-toggle'));
viewer.themeSwitcher.attachTo(controls.querySelector('.mdv-theme-switcher'));
```

## Theme Persistence

### Default Behavior

Themes are automatically saved to localStorage:

- Key: `mdv-theme` (default)
- Persists across sessions
- Respects user preference

### Custom Storage Key

```javascript
theme: {
  enablePersistence: true,
  storageKey: 'my-app-theme-preference'
}
```

### Clearing Saved Preference

```javascript
// Clear saved theme
localStorage.removeItem('mdv-theme');

// Reset to default
viewer.setTheme('default');
```

## Events and API

### Theme Change Events

```javascript
// Listen for any theme change
document.addEventListener('mdv-theme-changed', e => {
  console.log('New theme:', e.detail.theme);
  // Update other UI elements
  updateAppTheme(e.detail.theme);
});

// Listen for dark mode toggle
document.addEventListener('mdv-dark-mode-toggled', e => {
  console.log('Dark mode:', e.detail.isDark);
  console.log('Theme:', e.detail.theme);
  // Track user preference
  analytics.track('dark_mode_toggled', {
    isDark: e.detail.isDark,
  });
});
```

### Programmatic Control

```javascript
// Get current theme
const currentTheme = viewer.getCurrentTheme();

// Get all available themes
const themes = viewer.getAvailableThemes();

// Set theme programmatically
viewer.setTheme('github');

// Toggle dark mode
viewer.darkModeToggle.toggle();

// Check dark mode state
const isDark = viewer.darkModeToggle.isDarkMode();

// Set dark mode explicitly
viewer.darkModeToggle.setDarkMode(true);

// Access theme manager
const themeManager = viewer.themeManager;

// Check contrast ratio
const ratio = themeManager.getContrastRatio('#000', '#fff');

// Validate accessibility
const isAccessible = themeManager.isAccessible(
  '#3b82f6', // Example foreground color (blue)
  '#ffffff', // Example background color (white)
  'AA' // or 'AAA'
);
```

## Troubleshooting

### Common Issues

#### Theme Not Persisting

```javascript
// Ensure persistence is enabled
theme: {
  enablePersistence: true;
}

// Check localStorage is available
if (typeof Storage !== 'undefined') {
  console.log('localStorage available');
} else {
  console.log('No localStorage support');
}
```

#### Controls Not Appearing

```javascript
// Verify container exists
const container = document.querySelector('.mdv-header-actions');
console.log('Container found:', container);

// Check theme configuration
console.log('Theme config:', viewer.config.theme);

// Manually render if needed
if (!container.querySelector('.mdv-dark-mode-toggle')) {
  container.innerHTML += viewer.darkModeToggle.render();
  viewer.darkModeToggle.attachTo(container.querySelector('.mdv-dark-mode-toggle'));
}
```

#### Styles Not Applied

```javascript
// Ensure styles are loaded
const styles = document.querySelector('style');
console.log('Styles loaded:', styles?.textContent.includes('mdv-dark-mode-toggle'));

// Force style refresh
viewer.applyTheme(viewer.getCurrentTheme());
```

#### Mobile Layout Issues

```css
/* Ensure viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* Force mobile layout */
@media (max-width: 768px) {
  .mdv-header {
    flex-wrap: wrap;
  }

  .mdv-header-actions {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
}
```

### Best Practices

1. **Test Theme Contrast**: Always verify WCAG compliance
2. **Mobile First**: Design for mobile, enhance for desktop
3. **Performance**: Use CSS variables for instant theme switching
4. **Accessibility**: Provide keyboard navigation and ARIA labels
5. **User Preference**: Respect system dark mode preference
6. **Documentation**: Document custom themes for team members

### Debug Mode

```javascript
// Enable verbose logging
viewer.logger = {
  log: (...args) => console.log('[Theme]', ...args),
  warn: (...args) => console.warn('[Theme]', ...args),
  error: (...args) => console.error('[Theme]', ...args),
};

// Log all theme operations
viewer.themeManager.on('themeChange', theme => {
  console.log('Theme changed:', theme);
});
```
