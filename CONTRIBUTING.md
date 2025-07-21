# Contributing to Markdown Docs Viewer

Thank you for your interest in contributing to the Markdown Docs Viewer! This guide will help you get started with contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors
- Report any unacceptable behavior to the project maintainers

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/markdown-docs-viewer.git
   cd markdown-docs-viewer
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the demo** to verify everything works:
   ```bash
   npm run demo
   ```

5. **Run tests** to ensure the project is working correctly:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation updates
- `refactor/description` - For refactoring code

### Making Changes

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add support for custom themes"
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Project Structure

```
markdown-docs-viewer/
├── src/               # Source code
│   ├── viewer.ts      # Main MarkdownDocsViewer class
│   ├── themes.ts      # Theme definitions
│   ├── types.ts       # TypeScript type definitions
│   ├── factory.ts     # Factory functions
│   └── ...
├── tests/             # Test files
│   ├── viewer.test.ts
│   ├── themes.test.ts
│   └── ...
├── demo/              # Demo application
├── examples/          # Documentation examples
└── docs/              # Additional documentation
```

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Adding New Features

1. **Check existing issues** to see if the feature has been requested
2. **Open an issue** to discuss the feature before implementing
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure backward compatibility** when possible

### Bug Fixes

1. **Create a test case** that reproduces the bug
2. **Fix the issue** while ensuring the test passes
3. **Verify** that existing tests still pass
4. **Update documentation** if the fix changes behavior

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for all new functionality
- Use descriptive test names that explain what is being tested
- Follow the existing test patterns and structure
- Mock external dependencies appropriately
- Test edge cases and error conditions

### Test Structure

```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  it('should behave correctly when...', () => {
    // Test implementation
  });
});
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**: `npm test`
2. **Run linting**: `npm run lint`
3. **Check TypeScript compilation**: `npm run typecheck`
4. **Update documentation** if needed
5. **Rebase your branch** on the latest `main`

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Create a pull request** against the `main` branch
3. **Fill out the PR template** completely
4. **Link any related issues**

### PR Review Process

- All PRs require at least one review from a maintainer
- Address feedback promptly and professionally
- Keep PRs focused and reasonably sized
- Be prepared to make changes based on feedback

### What We Look For

- **Code quality**: Clean, readable, and maintainable code
- **Test coverage**: Adequate tests for new functionality
- **Documentation**: Updated docs for API changes
- **Backward compatibility**: Minimal breaking changes
- **Performance**: No significant performance regressions

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (browser, Node.js version, etc.)
- **Code samples** or minimal reproduction case
- **Screenshots** if applicable

### Feature Requests

When requesting features, please include:

- **Clear description** of the proposed feature
- **Use case** and motivation
- **Acceptance criteria**
- **Potential implementation ideas** (optional)

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvement
- `good first issue` - Good for newcomers
- `help wanted` - Community help requested

## Documentation

### Updating Documentation

- Update the README.md for API changes
- Add examples for new features
- Update JSDoc comments for code changes
- Consider adding to the examples/ directory

### Writing Style

- Use clear, concise language
- Include code examples where helpful
- Follow the existing documentation structure
- Test all code examples to ensure they work

## Release Process

Releases are handled by maintainers following semantic versioning:

- **Patch** (x.x.1) - Bug fixes and small improvements
- **Minor** (x.1.x) - New features (backward compatible)
- **Major** (1.x.x) - Breaking changes

## Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and community discussion
- **Email** - austin@austinorphan.com for private inquiries

## Recognition

Contributors are recognized in:

- The project's README.md
- Release notes for significant contributions
- GitHub's contributor graphs

## Development Tips

### Local Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run demo with live reload
npm run demo:dev
```

### Debugging

- Use browser dev tools for debugging client-side code
- Add `console.log` statements for quick debugging
- Use TypeScript's strict mode to catch type errors early

### Performance Considerations

- Test with large document sets
- Consider memory usage for long-running applications
- Profile rendering performance for complex documents

Thank you for contributing to the Markdown Docs Viewer! Your contributions help make this project better for everyone.