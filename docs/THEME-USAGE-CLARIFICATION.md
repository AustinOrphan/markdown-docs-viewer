# Theme Usage Clarification: Configuration vs Runtime

This document clarifies the correct usage of themes when configuring the Markdown Documentation Viewer initially vs switching themes at runtime.

## Important: Theme Parameter Types

The theme parameter usage depends on the context:

- **Initial Configuration**: Only **Theme objects** are supported
- **Runtime Switching**: Both **Theme objects** and **strings** are supported

## Initial Configuration (Both CDN and NPM)

For initial configuration, **only theme objects are supported** regardless of whether you're using CDN or NPM:

**CDN Usage:**

```html
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@latest/dist/index.umd.cjs"></script>

<script>
  const { createViewer, themes } = window.MarkdownDocsViewer;

  // ✅ CORRECT: Use theme objects
  const viewer = createViewer({
    container: '#docs',
    theme: themes.github.light, // Theme object required
    source: {
      /* ... */
    },
  });

  // ❌ INCORRECT: Strings don't work for initial config
  const viewer = createViewer({
    container: '#docs',
    theme: 'github-light', // Won't work!
    source: {
      /* ... */
    },
  });
</script>
```

**NPM Usage:**

```javascript
import { createViewer, themes } from '@austinorphan/markdown-docs-viewer';

// ✅ CORRECT: Use theme objects
const viewer = createViewer({
  container: '#docs',
  theme: themes.github.light, // Theme object required
  source: {
    /* ... */
  },
});

// ❌ INCORRECT: Strings don't work for initial config
const viewer = createViewer({
  container: '#docs',
  theme: 'github-light', // Won't work!
  source: {
    /* ... */
  },
});
```

### Available Theme Objects

These theme objects are available in both CDN and NPM contexts:

- `themes.default.light` and `themes.default.dark`
- `themes.github.light` and `themes.github.dark`
- `themes.material.light` and `themes.material.dark`
- `themes.nord.light` and `themes.nord.dark`
- `themes.tokyo.light` and `themes.tokyo.dark`
- And more...

## Runtime Theme Switching

For dynamic theme switching after initialization, use the `setTheme()` method. This method accepts **both theme objects and strings**:

**Both CDN and NPM:**

```javascript
// ✅ Using theme objects (recommended)
viewer.setTheme(themes.github.dark);
viewer.setTheme(themes.material.light);

// ✅ Using theme name strings (also works)
viewer.setTheme('github-dark');
viewer.setTheme('material-light');
```

### Available Theme Names for Runtime Switching

When using strings with `setTheme()`, these theme names are available:

- `'default-light'` and `'default-dark'`
- `'github-light'` and `'github-dark'`
- `'material-light'` and `'material-dark'`
- `'nord-light'` and `'nord-dark'`
- `'tokyo-light'` and `'tokyo-dark'`
- `'dracula-dark'`
- `'solarized-light'` and `'solarized-dark'`
- `'monokai-dark'`
- `'ayu-light'` and `'ayu-dark'`
- `'catppuccin-light'` and `'catppuccin-dark'`
- `'vscode-light'` and `'vscode-dark'`

## Custom Themes

Custom themes should always be created as objects:

```javascript
import { createCustomTheme } from '@austinorphan/markdown-docs-viewer';

const myTheme = createCustomTheme({
  name: 'my-custom-theme',
  colors: {
    primary: '#007acc',
    background: '#ffffff',
    // ... other colors
  },
});

// Use the custom theme object
const viewer = createViewer({
  container: '#docs',
  theme: myTheme, // Always use the object
  source: {
    /* ... */
  },
});
```

## Summary

- **Initial Configuration**: Always use theme objects (both CDN and NPM)
- **Runtime Switching**: Can use either theme objects or theme name strings
- **Custom Themes**: Always create and use as objects
- **Best Practice**: Use theme objects for consistency

This distinction exists because:

1. The `DocumentationConfig.theme` property is typed to only accept Theme objects
2. The `setTheme()` method is overloaded to accept both Theme objects and strings
3. Theme objects are guaranteed to work in all contexts and provide better TypeScript support
