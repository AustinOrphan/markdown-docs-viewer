# Configuration

Learn how to configure the markdown documentation viewer.

## Configuration File

Create a `docs.config.json` file:

```json
{
  "title": "My Documentation",
  "theme": "github-light",
  "source": {
    "type": "auto",
    "path": "./docs",
    "exclude": ["**/drafts/**"],
    "include": ["**/*.md"]
  },
  "search": {
    "enabled": true,
    "placeholder": "Search docs..."
  },
  "features": {
    "tableOfContents": true,
    "darkMode": true
  }
}
```

## Runtime Configuration

Override configuration at runtime:

```javascript
await init({
  title: 'Runtime Title',
  theme: 'github-dark',
  docsPath: './custom-docs',
});
```

## Available Themes

- `github-light`: GitHub-inspired light theme
- `github-dark`: GitHub-inspired dark theme
- `default-light`: Clean light theme
- `default-dark`: Clean dark theme

## Auto-Discovery

The viewer automatically discovers markdown files:

- Searches recursively in `./docs`
- Includes `*.md` and `*.markdown` files
- Respects exclude/include patterns
- Generates navigation from file structure
