# Documentation Generation Report

Generated: 2025-07-23T14:29:23.596Z

## Summary

- Total tasks: 4
- Successful: 2
- Failed: 2

## Errors

- Error generating API documentation: Command failed: npx typedoc --out "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/markdown-docs-viewer/docs/api" --entryPoints "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/markdown-docs-viewer/src/index.ts" --excludePrivate --excludeInternal --plugin typedoc-plugin-markdown --readme none
  [91m[error][0m The plugin typedoc-plugin-markdown could not be loaded
  [91m[error][0m Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typedoc-plugin-markdown' imported from /Users/austinorphan/.npm/\_npx/dafcb7cdaad6ed61/node_modules/typedoc/dist/lib/utils/plugins.js
  at Object.getPackageJSONURL (node:internal/modules/package_json_reader:256:9)
  at packageResolve (node:internal/modules/esm/resolve:768:81)
  at moduleResolve (node:internal/modules/esm/resolve:854:18)
  at defaultResolve (node:internal/modules/esm/resolve:984:11)
  at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)
  at #cachedDefaultResolve (node:internal/modules/esm/loader:704:25)
  at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)
  at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)
  at onImport.tracePromise.**proto** (node:internal/modules/esm/loader:643:36)
  at TracingChannel.tracePromise (node:diagnostics_channel:344:14)
  [91m[error][0m Found 2 errors and 0 warnings

## Warnings

- Missing documentation files:
- - README.md
- - architecture/README.md

## Details

See `docs-report.json` for full details.
