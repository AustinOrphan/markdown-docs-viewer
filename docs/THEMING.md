# Theme System Documentation

The Markdown Docs Viewer provides a comprehensive theming system with both a full theme switcher and a convenient dark mode toggle for end users.

## Overview

The theming system includes:
- **Theme Switcher**: Full theme selection with preview and multiple built-in themes
- **Dark Mode Toggle**: Quick toggle between light and dark modes
- **Theme Persistence**: User preferences are saved in localStorage
- **Custom Themes**: Ability to create and register custom themes
- **Mobile Responsive**: Both components work seamlessly on mobile devices

## Built-in Themes

The library includes several built-in themes:
- `default` - Clean modern light theme
- `dark` - Dark theme with good contrast
- `high-contrast` - High contrast theme for accessibility
- `github` - GitHub-inspired theme
- `dracula` - Popular dark theme with vibrant colors
- `solarized-light` - Solarized light theme
- `solarized-dark` - Solarized dark theme
- `material` - Material Design inspired theme

## Quick Setup

### Basic Configuration

```javascript
import { MarkdownDocsViewer } from '@austinorphan/markdown-docs-viewer';

const viewer = new MarkdownDocsViewer({
  container: '#docs',
  source: {
    type: 'local',
    documents: [/* your documents */]
  },
  theme: {
    // Theme switcher configuration
    switcherPosition: 'header', // 'header' | 'footer' | 'sidebar' | 'floating'
    showPreview: true,
    showDescription: true,
    allowCustomThemes: true,
    
    // Dark mode toggle configuration
    darkTogglePosition: 'header', // 'header' | 'footer' | 'floating'
    showDarkModeLabel: true,
    compactDarkToggle: false,
    
    // Persistence
    enablePersistence: true,
    storageKey: 'mdv-theme'
  }
});
```

### Standalone Usage

You can also use the components independently:

```javascript
import { ThemeManager, ThemeSwitcher, DarkModeToggle } from '@austinorphan/markdown-docs-viewer';

// Initialize theme manager
const themeManager = new ThemeManager({
  enablePersistence: true,
  onThemeChange: (theme) => {
    console.log('Theme changed to:', theme.name);
  }
});

// Create theme switcher
const themeSwitcher = new ThemeSwitcher(themeManager, {
  position: 'header',
  showPreview: true,
  showDescription: true
});

// Create dark mode toggle
const darkModeToggle = new DarkModeToggle(themeManager, {
  position: 'header',
  showLabel: true,
  compact: false
});

// Add to your HTML
document.getElementById('theme-controls').innerHTML = `
  ${darkModeToggle.render()}
  ${themeSwitcher.render()}
`;

// Attach event listeners
darkModeToggle.attachTo(document.querySelector('.mdv-dark-mode-toggle'));
themeSwitcher.attachTo(document.querySelector('.mdv-theme-switcher'));
```

## Theme Switcher

### Configuration Options

```typescript
interface ThemeSwitcherOptions {
  position?: 'header' | 'footer' | 'sidebar' | 'floating';
  showPreview?: boolean;        // Show color preview dots
  showDescription?: boolean;    // Show theme descriptions
  allowCustomThemes?: boolean;  // Enable custom theme creation
  onThemeChange?: (theme: Theme) => void;
}
```

### Usage Examples

#### Header Theme Switcher
```javascript
const themeSwitcher = new ThemeSwitcher(themeManager, {
  position: 'header',
  showPreview: true,
  showDescription: true,
  allowCustomThemes: true
});
```

#### Floating Theme Switcher
```javascript
const themeSwitcher = new ThemeSwitcher(themeManager, {
  position: 'floating',
  showPreview: false,
  showDescription: false
});
```

### Features

- **Visual Preview**: Color swatches show theme colors before selection
- **Keyboard Navigation**: Full keyboard support with arrow keys
- **Accessibility**: ARIA labels and screen reader support
- **Mobile Optimized**: Responsive dropdown that adapts to mobile screens
- **Custom Themes**: Button to create custom themes (when enabled)

## Dark Mode Toggle

### Configuration Options

```typescript
interface DarkModeToggleOptions {
  position?: 'header' | 'footer' | 'floating';
  showLabel?: boolean;   // Show "Light/Dark Mode" text
  compact?: boolean;     // Smaller toggle for tight spaces
  lightThemeName?: string; // Theme to use for light mode (default: 'default')
  darkThemeName?: string;  // Theme to use for dark mode (default: 'dark')
  onToggle?: (isDark: boolean, theme: Theme) => void;
}
```

### Usage Examples

#### Standard Toggle with Label
```javascript
const darkModeToggle = new DarkModeToggle(themeManager, {
  position: 'header',
  showLabel: true,
  compact: false
});
```

#### Compact Toggle
```javascript
const darkModeToggle = new DarkModeToggle(themeManager, {
  position: 'header',
  showLabel: false,
  compact: true
});
```

#### Floating Toggle
```javascript
const darkModeToggle = new DarkModeToggle(themeManager, {
  position: 'floating',
  showLabel: false,
  compact: true
});
```

#### Custom Theme Names
```javascript
// Use different themes for light/dark modes
const darkModeToggle = new DarkModeToggle(themeManager, {
  position: 'header',
  lightThemeName: 'github',      // Use GitHub theme for light mode
  darkThemeName: 'dracula',      // Use Dracula theme for dark mode
  showLabel: true
});
```

### Features

- **Smooth Animation**: Toggle switch with smooth transitions
- **Visual Icons**: Sun and moon icons indicate current mode
- **Touch Friendly**: Large enough for mobile interaction
- **System Preference**: Respects user's OS theme preference initially
- **Accessibility**: Full ARIA support and keyboard navigation

## Advanced Configuration

### Custom Theme Creation

```javascript
// Create a custom theme
const customTheme = themeManager.createCustomTheme('my-theme', {
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#f8f9fa',
    surface: '#ffffff',
    // ... other color overrides
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    code: 'JetBrains Mono, monospace'
  }
});

// Apply the custom theme
themeManager.setTheme('my-theme');
```

### Theme Events

```javascript
// Listen for theme changes
document.addEventListener('mdv-theme-changed', (e) => {
  console.log('Theme changed:', e.detail.theme);
});

// Listen for dark mode toggles
document.addEventListener('mdv-dark-mode-toggled', (e) => {
  console.log('Dark mode:', e.detail.isDark);
  console.log('New theme:', e.detail.theme);
});
```

### Programmatic Control

```javascript
// Check current theme
const currentTheme = themeManager.getCurrentTheme();

// Set theme programmatically
themeManager.setTheme('dark');

// Toggle dark mode
darkModeToggle.toggle();

// Check if dark mode is active
const isDark = darkModeToggle.isDarkMode();

// Set dark mode state
darkModeToggle.setDarkMode(true);
```

## Styling and Customization

### CSS Custom Properties

The theme system uses CSS custom properties that you can override:

```css
:root {
  --mdv-color-primary: #3b82f6;
  --mdv-color-background: #ffffff;
  --mdv-color-surface: #f3f4f6;
  --mdv-color-text: #111827;
  --mdv-border-radius: 0.5rem;
  /* ... many more properties */
}
```

### Custom Styling

```css
/* Customize theme switcher */
.mdv-theme-switcher .mdv-theme-trigger {
  border-radius: 8px;
  font-weight: 600;
}

/* Customize dark mode toggle */
.mdv-dark-mode-toggle .mdv-dark-toggle-btn {
  transform: scale(0.8);
}

/* Header actions layout */
.mdv-header-actions {
  gap: 16px;
}
```

## Mobile Responsiveness

Both components automatically adapt to mobile screens:

- **Theme Switcher**: Dropdown becomes full-screen modal on mobile
- **Dark Mode Toggle**: Touch-friendly sizing and spacing
- **Header Layout**: Components stack appropriately on small screens

## Accessibility Features

### Theme Switcher
- ARIA labels and descriptions
- Keyboard navigation with arrow keys
- Screen reader announcements
- High contrast mode support

### Dark Mode Toggle
- ARIA switch role
- Keyboard activation (Enter/Space)
- Visual focus indicators
- Reduced motion support

## Best Practices

1. **Positioning**: Use `header` position for primary controls, `floating` for secondary access
2. **User Choice**: Don't force a theme; respect user preferences and system settings
3. **Persistence**: Enable theme persistence for better user experience
4. **Performance**: Themes are applied via CSS custom properties for optimal performance
5. **Accessibility**: Always test with screen readers and keyboard navigation
6. **Mobile**: Ensure touch targets are at least 44px for mobile usability

## Troubleshooting

### Common Issues

**Theme not persisting**:
```javascript
// Ensure persistence is enabled
const themeManager = new ThemeManager({
  enablePersistence: true,
  storageKey: 'my-app-theme'
});
```

**Components not appearing**:
```javascript
// Ensure CSS styles are included
const cssContent = themeSwitcher.getStyles() + darkModeToggle.getStyles();
const styleSheet = document.createElement('style');
styleSheet.textContent = cssContent;
document.head.appendChild(styleSheet);
```

**Mobile dropdown issues**:
```javascript
// Add viewport meta tag
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```