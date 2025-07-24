# Theme Usage Clarification: CDN vs NPM

This document clarifies the correct usage of themes when using the Markdown Documentation Viewer via CDN or NPM.

## Important: Theme Parameter Types

The `theme` parameter in the configuration accepts either:

- A **Theme object** (recommended for CDN usage)
- A **string** representing the theme name (available for NPM usage)

## CDN Usage (Browser/Script Tag)

When using the library via CDN with script tags, you must use the exported theme objects:

```html
<script src="https://unpkg.com/@austinorphan/markdown-docs-viewer@1.0.0/dist/index.umd.cjs"></script>

<script>
  // Get the theme objects from the global namespace
  const { MarkdownDocsViewer, defaultTheme, darkTheme } = window.MarkdownDocsViewer;

  // CORRECT: Use theme objects
  const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: defaultTheme, // ✅ Use the theme object
    // OR
    theme: darkTheme, // ✅ Use the theme object
    source: {
      type: 'local',
      documents: [
        /* ... */
      ],
    },
  });

  // INCORRECT: Don't use strings in CDN context
  const viewer = new MarkdownDocsViewer({
    container: '#docs',
    theme: 'default', // ❌ Won't work properly in CDN context
    source: {
      type: 'local',
      documents: [
        /* ... */
      ],
    },
  });
</script>
```

### Available Theme Objects in CDN

When using the UMD build, these theme objects are available:

- `defaultTheme` - Light theme
- `darkTheme` - Dark theme

## NPM Usage (Module Import)

When using the library via NPM with module imports, you can use either theme objects or strings:

```javascript
import { createViewer, defaultTheme, darkTheme } from '@austinorphan/markdown-docs-viewer';

// Option 1: Use theme objects (recommended)
const viewer = createViewer({
  container: '#docs',
  theme: defaultTheme, // ✅ Theme object
  source: {
    type: 'local',
    documents: [
      /* ... */
    ],
  },
});

// Option 2: Use theme name strings (also valid)
const viewer = createViewer({
  container: '#docs',
  theme: 'default', // ✅ String works in NPM context
  source: {
    type: 'local',
    documents: [
      /* ... */
    ],
  },
});
```

### Available Theme Names for NPM

When using strings, these theme names are available:

- `'default'` or `'default-light'` - Light theme
- `'default-dark'` or `'dark'` - Dark theme
- `'github-light'` - GitHub light theme
- `'github-dark'` - GitHub dark theme
- `'nord-light'` - Nord light theme
- `'nord-dark'` - Nord dark theme
- `'solarized-light'` - Solarized light theme
- `'solarized-dark'` - Solarized dark theme

## Dynamic Theme Switching

For dynamic theme switching, use the `setTheme` method:

### CDN Context

```javascript
// Use theme objects
viewer.setTheme(darkTheme);
```

### NPM Context

```javascript
// Can use either objects or strings
viewer.setTheme(darkTheme); // Theme object
viewer.setTheme('github-dark'); // Theme name string
```

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

- **CDN/Browser**: Always use theme objects (`defaultTheme`, `darkTheme`)
- **NPM/Module**: Can use either theme objects or theme name strings
- **Custom Themes**: Always create and use as objects
- **Best Practice**: When in doubt, use theme objects for consistency

This distinction exists because:

1. In CDN context, the theme registry might not be fully initialized when using strings
2. NPM builds have access to the full theme registry during initialization
3. Theme objects are guaranteed to work in all contexts
