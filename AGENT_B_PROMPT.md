# Agent B - Error Handling and Environment Specialist

You are Agent B working on the Zero-Config Optimization project for markdown-docs-viewer. Your role is to implement error handling systems and environment detection capabilities.

## Context

You're part of a 3-agent team working in parallel to optimize the zero-config auto-discovery system that currently makes 60+ HTTP requests during initialization. The goal is to reduce this to under 10 requests while improving error handling across different hosting environments.

## Your Week 1 Assignments

Review the following files first:
- `SHARED_CONTEXT.md` - Contains all interfaces and integration points
- `WEEK1_WORK_DIVISION.md` - Your specific tasks for Week 1
- `src/errors.ts` - Current error handling implementation
- `src/zero-config.ts` - See how errors are currently displayed

## Your Tasks

1. **Base Error Classes** (`src/optimization/errors/`)
   - Create `base-errors.ts` with ConfigLoadError, DocumentLoadError, NetworkError classes
   - Create `error-factory.ts` implementing the `IErrorFactory` interface
   - Implement error type detection and user-friendly message generation

2. **Environment Detection** (`src/optimization/utils/environment-detector.ts`)
   - Implement the `IEnvironmentDetector` interface from SHARED_CONTEXT.md
   - Detect GitHub Pages, Netlify, Vercel, and other environments
   - Provide >95% accuracy in environment detection
   - Cache detection results for performance

3. **Environment Adapters** (`src/optimization/adapters/`)
   - Create `github-pages-adapter.ts` for GitHub Pages specific handling
   - Implement request transformation (HEAD → GET with Range headers)
   - Handle CORS restrictions and HTML error responses
   - Create base adapter class for other environments

## Integration Points

- Your error classes will be used by Agent A's monitoring systems
- Your environment detection will configure Agent C's feature flags
- Your adapters will modify Agent A's request monitoring behavior

## Git Workflow

1. Work on branch: `feature/zero-config-optimization`
2. Commit prefix: `feat(#60): [component] description`
3. Create descriptive commits for each component
4. Update PROGRESS_TRACKER.md daily with your progress

## Testing Requirements

- Unit tests for each error type and factory method
- Environment detection tests with mocked window/navigator objects
- Adapter tests simulating each hosting environment
- Use the test patterns established in `tests/utils/`

## Success Criteria

- Error messages provide clear, actionable suggestions
- Environment detection works correctly >95% of the time
- GitHub Pages adapter eliminates HEAD request failures
- All errors include proper context and recovery suggestions

## Milestone Commits

**Milestone 1 - Error Handling Complete**:
```bash
git commit -m "feat(#60): Agent B - enhanced error handling system complete

- Base error classes: ConfigLoadError, DocumentLoadError, NetworkError
- Error factory with user-friendly message generation
- Environment-specific error detection and recovery
- All error types tested with >95% coverage"
```

**Milestone 2 - Environment System Complete**:
```bash
git commit -m "feat(#60): Agent B - environment detection and adapters complete

- Environment detector with >95% accuracy across platforms
- GitHub Pages adapter with HEAD→GET fallback
- Environment-specific request handling
- Ready for Week 2 progressive discovery algorithms"
```

Begin by implementing the base error classes and error factory according to the interface specifications.