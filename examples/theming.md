# Theming Guide

Create beautiful, branded documentation with the powerful theming system of the Markdown Documentation Viewer.

## Built-in Themes

The viewer comes with carefully crafted built-in themes:

### Default (Light) Theme

```javascript
import { MarkdownDocsViewer, defaultTheme } from '../dist/markdown-docs-viewer.js';

const viewer = new MarkdownDocsViewer({
  theme: defaultTheme,
  // ... other options
});
```

### Dark Theme

```javascript
import { MarkdownDocsViewer, darkTheme } from '../dist/markdown-docs-viewer.js';

const viewer = new MarkdownDocsViewer({
  theme: darkTheme,
  // ... other options
});
```

## Theme Structure

A theme is a JavaScript object with the following structure:

```typescript
interface Theme {
  colors: {
    primary: string; // Primary brand color
    secondary?: string; // Secondary accent color
    background: string; // Main background
    surface: string; // Card/panel backgrounds
    text: string; // Primary text color
    textLight: string; // Secondary text color
    border: string; // Border color
    code: string; // Code text color
    codeBackground: string; // Code background color
    success: string; // Success state color
    warning: string; // Warning state color
    error: string; // Error state color
  };
  fonts: {
    body: string; // Body text font stack
    heading: string; // Heading font stack
    code: string; // Code font stack
  };
  spacing?: {
    content: string; // Content padding
    navigation: string; // Navigation spacing
    section: string; // Section spacing
  };
  radius?: {
    small: string; // Small border radius
    medium: string; // Medium border radius
    large: string; // Large border radius
  };
  shadows?: {
    small: string; // Small shadow
    medium: string; // Medium shadow
    large: string; // Large shadow
  };
}
```

## Creating Custom Themes

### Brand Colors Theme

```javascript
const brandTheme = {
  colors: {
    primary: '#3b82f6', // Blue primary
    secondary: '#10b981', // Green secondary
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    code: '#8b5cf6', // Purple for code
    codeBackground: '#f1f5f9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Georgia, "Times New Roman", serif',
    code: 'Menlo, Monaco, "Courier New", monospace',
  },
  spacing: {
    content: '2rem',
    navigation: '1.5rem',
    section: '3rem',
  },
  radius: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
  },
};
```

### High Contrast Theme

```javascript
const highContrastTheme = {
  colors: {
    primary: '#000000',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textLight: '#333333',
    border: '#000000',
    code: '#000000',
    codeBackground: '#e5e5e5',
    success: '#008000',
    warning: '#ff8c00',
    error: '#dc143c',
  },
  fonts: {
    body: 'Arial, sans-serif',
    heading: 'Arial, sans-serif',
    code: 'Courier, monospace',
  },
};
```

### Minimal Theme

```javascript
const minimalTheme = {
  colors: {
    primary: '#333333',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#333333',
    textLight: '#666666',
    border: '#e0e0e0',
    code: '#d73a49',
    codeBackground: '#f6f8fa',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    code: 'SFMono-Regular, Consolas, monospace',
  },
  spacing: {
    content: '1.5rem',
    navigation: '1rem',
    section: '2rem',
  },
  radius: {
    small: '0',
    medium: '0',
    large: '0',
  },
};
```

## Dynamic Theme Switching

Enable users to switch themes at runtime:

```javascript
const viewer = new MarkdownDocsViewer({
  theme: defaultTheme,
  // ... other options
});

// Theme switcher buttons
document.getElementById('light-theme').addEventListener('click', () => {
  viewer.setTheme(defaultTheme);
});

document.getElementById('dark-theme').addEventListener('click', () => {
  viewer.setTheme(darkTheme);
});

document.getElementById('custom-theme').addEventListener('click', () => {
  viewer.setTheme(brandTheme);
});
```

### Theme Persistence

```javascript
// Save theme preference
function setTheme(theme) {
  viewer.setTheme(theme);
  localStorage.setItem('docs-theme', theme.name || 'custom');
}

// Load saved theme
const savedTheme = localStorage.getItem('docs-theme');
const initialTheme = savedTheme === 'dark' ? darkTheme : defaultTheme;
```

## CSS Custom Properties

Themes are applied using CSS custom properties (CSS variables):

```css
.mdv-app {
  --mdv-color-primary: #3b82f6;
  --mdv-color-background: #ffffff;
  --mdv-color-surface: #f8fafc;
  --mdv-color-text: #1e293b;
  --mdv-color-text-light: #64748b;
  --mdv-color-border: #e2e8f0;
  --mdv-color-code: #8b5cf6;
  --mdv-color-code-background: #f1f5f9;

  --mdv-font-body: -apple-system, BlinkMacSystemFont, sans-serif;
  --mdv-font-heading: Georgia, serif;
  --mdv-font-code: Menlo, Monaco, monospace;

  --mdv-spacing-content: 2rem;
  --mdv-spacing-navigation: 1.5rem;

  --mdv-radius-small: 0.25rem;
  --mdv-radius-medium: 0.5rem;
  --mdv-radius-large: 1rem;
}
```

## Theme Customization with CSS

### Override Specific Properties

```css
/* Override just the primary color */
.mdv-app {
  --mdv-color-primary: #ff6b6b;
}

/* Custom navigation styling */
.mdv-navigation {
  --mdv-spacing-navigation: 2rem;
  background: linear-gradient(135deg, var(--mdv-color-primary), var(--mdv-color-secondary));
}
```

### Component-Specific Theming

```css
/* Style the header */
.mdv-header {
  background: var(--mdv-color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Style code blocks */
.mdv-code-block {
  border-left: 4px solid var(--mdv-color-primary);
  background: var(--mdv-color-code-background);
}

/* Style search input */
.mdv-search-input {
  border: 2px solid var(--mdv-color-border);
  border-radius: var(--mdv-radius-medium);
}
```

## Responsive Theming

Adapt themes for different screen sizes:

```javascript
const responsiveTheme = {
  colors: {
    // ... color definitions
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    code: 'SFMono-Regular, monospace',
  },
  spacing: {
    content: '1rem', // Smaller on mobile
    navigation: '0.75rem',
    section: '2rem',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};
```

## Print Styling

Optimize themes for printing:

```css
@media print {
  .mdv-app {
    --mdv-color-background: white;
    --mdv-color-text: black;
    --mdv-font-body: serif;
  }

  .mdv-navigation,
  .mdv-search {
    display: none;
  }
}
```

## Accessibility Considerations

### High Contrast Support

```javascript
const accessibleTheme = {
  colors: {
    primary: '#0066cc', // WCAG AA compliant
    background: '#ffffff',
    text: '#000000', // Maximum contrast
    textLight: '#333333', // Still accessible
    // Ensure 4.5:1 contrast ratio minimum
  },
};
```

### Color Blind Friendly

```javascript
const colorBlindFriendlyTheme = {
  colors: {
    primary: '#1f77b4', // Blue
    secondary: '#ff7f0e', // Orange
    success: '#2ca02c', // Green
    warning: '#ff7f0e', // Orange (not red/green confusion)
    error: '#d62728', // Red
  },
};
```

## Theme Presets

### Corporate Theme

```javascript
const corporateTheme = {
  colors: {
    primary: '#1e3a8a', // Corporate blue
    secondary: '#059669', // Professional green
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textLight: '#6b7280',
    border: '#d1d5db',
    code: '#7c3aed',
    codeBackground: '#f3f4f6',
  },
  fonts: {
    body: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    heading: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    code: 'Consolas, "Courier New", monospace',
  },
};
```

### Creative Theme

```javascript
const creativeTheme = {
  colors: {
    primary: '#8b5cf6', // Purple
    secondary: '#06b6d4', // Cyan
    background: '#fafafa',
    surface: '#ffffff',
    text: '#374151',
    textLight: '#9ca3af',
    border: '#e5e7eb',
    code: '#ec4899', // Pink
    codeBackground: '#fdf2f8',
  },
  fonts: {
    body: '"Inter", sans-serif',
    heading: '"Poppins", sans-serif',
    code: '"Fira Code", monospace',
  },
  radius: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
  },
};
```

## Theme Validation

The viewer validates themes to ensure compatibility:

```javascript
// Invalid theme will show helpful warnings
const invalidTheme = {
  colors: {
    primary: 'not-a-color', // Invalid CSS color
    // Missing required colors
  },
};

// The viewer will fall back to default values and warn in console
```

## Best Practices

### 1. Maintain Contrast Ratios

- Ensure text has sufficient contrast against backgrounds
- Test with accessibility tools
- Provide high contrast alternatives

### 2. Use System Fonts

- Leverage system font stacks for better performance
- Provide fallbacks for custom fonts
- Consider loading performance

### 3. Test Across Devices

- Verify themes work on different screen sizes
- Test in various browsers
- Check print appearance

### 4. Brand Consistency

- Align with your brand guidelines
- Use consistent spacing and typography
- Maintain visual hierarchy

## Next Steps

- **[Component Styling](./components.md)** - Style individual components
- **[Plugin Themes](./plugin-themes.md)** - Create themes for plugins
- **[Theme Generator](./theme-generator.md)** - Use the online theme generator

---

> **Design Tip**: Start with one of the built-in themes and gradually customize it to match your brand identity!
