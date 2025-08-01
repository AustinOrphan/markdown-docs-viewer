# API Reference

Complete API documentation for the markdown documentation viewer.

## Core Functions

### `init(options)`

Initializes the documentation viewer.

**Parameters:**

- `options` (object, optional): Configuration options

**Returns:** `Promise<MarkdownDocsViewer>`

**Example:**

```javascript
const viewer = await init({
  container: '#docs',
  theme: 'github-light',
  title: 'API Documentation',
});
```

### `getViewer()`

Returns the current global viewer instance.

**Returns:** `MarkdownDocsViewer | null`

### `reload(options)`

Reloads the documentation with new options.

**Parameters:**

- `options` (object, optional): New configuration options

**Returns:** `Promise<MarkdownDocsViewer>`

### `setTheme(themeName)`

Changes the current theme.

**Parameters:**

- `themeName` (string): Theme name

### `getAvailableThemes()`

Returns array of available theme names.

**Returns:** `string[]`

## Viewer Instance Methods

### `viewer.destroy()`

Destroys the viewer and cleans up resources.

**Returns:** `Promise<void>`

### `viewer.reload()`

Reloads the viewer content.

**Returns:** `Promise<void>`

### `viewer.setTheme(theme)`

Sets the viewer theme.

**Parameters:**

- `theme` (object): Theme configuration object
