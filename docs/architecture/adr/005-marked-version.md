# ADR-005: Use Marked v15 Instead of v16

## Status

Accepted

## Context

The marked library is a critical peer dependency for markdown parsing. Version 16 introduced breaking changes by becoming ESM-only, dropping CommonJS support. This creates compatibility issues for projects that need UMD builds or CommonJS compatibility.

## Decision

We will constrain the marked peer dependency to version 15.x (`>=15.0.0 <16.0.0`) to maintain CommonJS/UMD compatibility.

## Consequences

### Positive

- **UMD Support**: UMD builds work correctly with `require()`
- **CommonJS Compatibility**: Node.js projects using CommonJS can consume our library
- **Wider Adoption**: No restrictions on consumer module systems
- **Stable API**: Marked v15 is mature and stable
- **Built-in Types**: v15 includes TypeScript definitions

### Negative

- **Version Constraint**: Cannot use v16+ features
- **Future Migration**: Eventually need to handle ESM-only world
- **Dependency Management**: Must educate users about version constraint

### Neutral

- **Feature Parity**: v15 has all features we currently need
- **Security**: v15 still receives security updates
- **Performance**: No significant performance difference

## Implementation

### Package.json Configuration

```json
{
  "peerDependencies": {
    "marked": ">=15.0.0 <16.0.0"
  },
  "devDependencies": {
    "marked": "^15.0.12"
  }
}
```

### Build Configuration

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['marked', 'marked-highlight', 'highlight.js'],
      output: {
        globals: {
          marked: 'marked',
          'marked-highlight': 'markedHighlight',
          'highlight.js': 'hljs',
        },
      },
    },
  },
});
```

## Migration Strategy

When CommonJS usage drops sufficiently:

1. **Phase 1**: Add ESM-only build alongside UMD
2. **Phase 2**: Deprecate UMD build with warnings
3. **Phase 3**: Remove UMD in major version bump
4. **Phase 4**: Upgrade to marked v16+

## Alternatives Considered

### Use Marked v16

- ✅ Latest features
- ✅ ESM-only is future
- ❌ Breaks UMD builds
- ❌ No CommonJS support
- ❌ Reduces adoption

### Bundle Marked

- ✅ Version control
- ✅ No peer dependency
- ❌ Larger bundle size
- ❌ Duplicate marked instances
- ❌ Version conflicts

### Different Parser

- ✅ Avoid the issue
- ❌ Breaking change
- ❌ Different API
- ❌ Migration cost

## References

- [Marked v16 Release Notes](https://github.com/markedjs/marked/releases/tag/v16.0.0)
- [ESM vs CommonJS](https://nodejs.org/api/esm.html)
- [UMD Pattern](https://github.com/umdjs/umd)
