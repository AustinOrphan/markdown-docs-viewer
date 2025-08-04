# Git Submodule Integration Guide

This guide explains how to integrate the Markdown Docs Viewer as a git submodule in your project, enabling seamless updates and automated builds.

## Overview

Git submodule integration provides:
- **Version Control**: Pin to specific versions, update when ready
- **Automated Builds**: Automatic rebuilding when submodule updates
- **Project Integration**: Seamless integration with your project workflow
- **CI/CD Friendly**: Works with automated deployment pipelines

## Quick Setup

### Automated Setup (Recommended)

Use the setup script for one-command integration:

```bash
# Add submodule with automatic build hooks
curl -fsSL https://raw.githubusercontent.com/AustinOrphan/markdown-docs-viewer/main/scripts/setup-submodule.sh | bash -s -- docs-viewer

# Or download and run locally
wget https://raw.githubusercontent.com/AustinOrphan/markdown-docs-viewer/main/scripts/setup-submodule.sh
chmod +x setup-submodule.sh
./setup-submodule.sh docs-viewer
```

### Manual Setup

If you prefer manual setup or need custom configuration:

```bash
# 1. Add the submodule
git submodule add https://github.com/AustinOrphan/markdown-docs-viewer.git docs-viewer

# 2. Initialize and update
git submodule update --init --recursive

# 3. Build the viewer
cd docs-viewer
npm ci
npm run build
cd ..

# 4. Commit the submodule
git add .gitmodules docs-viewer
git commit -m "Add markdown-docs-viewer submodule"
```

## Setup Script Options

The setup script provides several configuration options:

```bash
# Basic usage
./setup-submodule.sh [OPTIONS] [SUBMODULE_PATH]

# Available options
--branch BRANCH         # Use specific git branch (default: main)
--no-hooks              # Skip automatic build hook installation
--force                 # Force setup even if submodule exists
--help, -h              # Show help information
--version, -v           # Show version information
```

### Examples

```bash
# Use development branch
./setup-submodule.sh --branch develop docs-viewer

# Setup without automatic builds (manual build only)
./setup-submodule.sh --no-hooks docs-viewer

# Force setup in existing directory
./setup-submodule.sh --force docs-viewer

# Custom submodule path
./setup-submodule.sh vendor/markdown-viewer
```

## Automatic Build System

The submodule integration includes an automatic build system that rebuilds the viewer when the submodule is updated.

### How It Works

1. **Post-Checkout Hook**: Installed in the submodule's `.git/hooks/` directory
2. **Update Detection**: Monitors submodule updates (not branch checkouts)
3. **Dependency Check**: Verifies Node.js and npm availability
4. **Build Process**: Runs `npm ci && npm run build` automatically
5. **Error Handling**: Provides clear error messages and recovery instructions

### Build Hook Features

- ✅ **Smart Detection**: Only runs on actual submodule updates
- ✅ **Environment Awareness**: Skips builds in CI by default
- ✅ **Dependency Validation**: Checks for Node.js 18+ and npm
- ✅ **Error Recovery**: Provides clear instructions when builds fail
- ✅ **Skip Option**: Can be disabled per-project with `.skip-auto-build` file
- ✅ **Timeout Protection**: Prevents hanging on long builds

### Controlling Automatic Builds

#### Disable Auto-Builds

Create a `.skip-auto-build` file in the submodule directory:

```bash
cd docs-viewer
touch .skip-auto-build
git add .skip-auto-build
git commit -m "Disable auto-build for docs-viewer"
```

#### Re-enable Auto-Builds

Remove the skip file:

```bash
cd docs-viewer
rm .skip-auto-build
git add .skip-auto-build
git commit -m "Re-enable auto-build for docs-viewer"
```

#### Manual Builds

Build manually when needed:

```bash
cd docs-viewer
npm ci
npm run build
```

## Project Integration Patterns

### Pattern 1: Documentation Site

Integrate the viewer for a documentation site:

```
my-project/
├── src/
├── docs/                    # Your markdown files
│   ├── README.md
│   ├── api/
│   └── guides/
├── docs-viewer/             # Submodule
│   └── dist/
│       ├── zero-config.umd.cjs
│       └── index.d.ts
└── docs.html               # Your documentation page
```

**docs.html example:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Project Documentation</title>
</head>
<body>
    <script src="docs-viewer/dist/zero-config.umd.cjs"></script>
    <script>
        // Zero-config initialization - automatically finds docs/
    </script>
</body>
</html>
```

### Pattern 2: Component Library

Use as part of a component library:

```
ui-library/
├── components/
├── documentation/
│   ├── docs/               # Component documentation
│   ├── viewer/             # Submodule
│   └── index.html
└── build.js                # Build script that includes docs
```

**Integration in build.js:**
```javascript
// Copy viewer files during build
const viewerFiles = [
    'documentation/viewer/dist/zero-config.umd.cjs',
    'documentation/viewer/dist/index.d.ts'
];

// Copy to build output
viewerFiles.forEach(file => {
    fs.copyFileSync(file, path.join('build', path.basename(file)));
});
```

### Pattern 3: Multi-Project Workspace

Share viewer across multiple projects:

```
workspace/
├── shared/
│   └── docs-viewer/         # Shared submodule
├── project-a/
│   ├── docs/
│   └── docs.html           # Points to ../shared/docs-viewer
└── project-b/
    ├── docs/
    └── docs.html           # Points to ../shared/docs-viewer
```

## Updating Submodules

### Update to Latest Version

```bash
# Update submodule to latest commit on tracked branch
git submodule update --remote docs-viewer

# Commit the update
git add docs-viewer
git commit -m "Update docs-viewer to latest version"
```

### Update to Specific Version

```bash
# Go to submodule directory
cd docs-viewer

# Checkout specific version/tag
git checkout v1.2.3

# Return to main project
cd ..

# Commit the version change
git add docs-viewer
git commit -m "Update docs-viewer to v1.2.3"
```

### Update All Submodules

```bash
# Update all submodules in the project
git submodule update --remote

# Commit all updates
git add .
git commit -m "Update all submodules"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-docs:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout with submodules
        uses: actions/checkout@v4
        with:
          submodules: recursive
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Build docs viewer
        run: |
          cd docs-viewer
          npm ci
          npm run build
          
      - name: Build documentation site
        run: |
          # Your documentation build process
          npm run build:docs
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### GitLab CI Example

```yaml
stages:
  - build
  - deploy

build-docs:
  stage: build
  image: node:20
  script:
    - git submodule update --init --recursive
    - cd docs-viewer && npm ci && npm run build && cd ..
    - npm run build:docs
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy-docs:
  stage: deploy
  dependencies:
    - build-docs
  script:
    - cp -r dist/* /var/www/docs/
  only:
    - main
```

## Troubleshooting

### Common Issues

#### Submodule Not Updating

**Problem**: Submodule appears unchanged after `git pull`

**Solution**: 
```bash
# Submodules don't auto-update, update manually
git submodule update --init --recursive

# Or configure git to always update submodules
git config submodule.recurse true
```

#### Build Fails After Update

**Problem**: Automatic build fails with dependency errors

**Solution**:
```bash
cd docs-viewer
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Hook Not Running

**Problem**: Post-checkout hook doesn't execute

**Solution**:
```bash
# Check if hook exists and is executable
ls -la docs-viewer/.git/hooks/post-checkout

# Make executable if needed
chmod +x docs-viewer/.git/hooks/post-checkout

# Re-run setup script if missing
./scripts/setup-submodule.sh --force docs-viewer
```

#### Permission Errors

**Problem**: Permission denied when running builds

**Solution**:
```bash
# Fix hook permissions
find docs-viewer/.git/hooks -name "post-checkout" -exec chmod +x {} \;

# Fix npm cache permissions
npm cache clean --force
```

### Environment-Specific Issues

#### Windows Submodules

On Windows, ensure proper line endings and permissions:

```bash
# Configure git for Windows
git config core.autocrlf true
git config core.filemode false

# Re-clone if needed
git submodule deinit -f docs-viewer
git submodule update --init docs-viewer
```

#### Docker/Container Issues

In containerized environments:

```dockerfile
# Dockerfile
FROM node:20

# Install git for submodules
RUN apt-get update && apt-get install -y git

# Clone with submodules
COPY . /app
WORKDIR /app
RUN git submodule update --init --recursive

# Build viewer
RUN cd docs-viewer && npm ci && npm run build
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Enable git submodule debug output
export GIT_TRACE=1
git submodule update --init --recursive

# Check hook execution
cd docs-viewer/.git/hooks
bash -x post-checkout prev_commit new_commit 0
```

## Advanced Configuration

### Custom Hook Configuration

Modify the post-checkout hook for custom behavior:

```bash
# Edit the hook
vim docs-viewer/.git/hooks/post-checkout

# Add custom build options
# Example: Skip build in development branch
if [[ "$(git branch --show-current)" == "develop" ]]; then
    echo "Skipping build in develop branch"
    exit 0
fi
```

### Multiple Branch Tracking

Track different branches for different environments:

```bash
# Production tracks main
git config -f .gitmodules submodule.docs-viewer.branch main

# Development tracks develop branch
git submodule set-branch --branch develop docs-viewer

# Update to track new branch
git submodule update --remote docs-viewer
```

### Shallow Submodules

For faster clones, use shallow submodules:

```bash
# Add shallow submodule
git submodule add --depth 1 https://github.com/AustinOrphan/markdown-docs-viewer.git docs-viewer

# Configure existing submodule to be shallow
git config -f .gitmodules submodule.docs-viewer.shallow true
```

## Best Practices

### 1. Version Pinning

Always commit submodule updates explicitly:

```bash
# ✅ Good: Explicit version control
git add docs-viewer
git commit -m "Update docs-viewer to v1.2.3 for new search features"

# ❌ Avoid: Leaving submodule updates uncommitted
```

### 2. Documentation

Document your submodule usage:

```markdown
## Documentation Setup

This project uses markdown-docs-viewer as a submodule for documentation.

- **Submodule Path**: `docs-viewer/`
- **Branch**: `main`
- **Auto-build**: Enabled
- **Build Output**: `docs-viewer/dist/`

### First-time Setup
\`\`\`bash
git submodule update --init --recursive
cd docs-viewer && npm ci && npm run build
\`\`\`
```

### 3. Build Validation

Validate builds in CI:

```yaml
- name: Validate docs build
  run: |
    test -f docs-viewer/dist/zero-config.umd.cjs || exit 1
    test -s docs-viewer/dist/zero-config.umd.cjs || exit 1
    echo "✓ Docs viewer build validated"
```

### 4. Dependency Management

Keep submodule dependencies separate:

```json
{
  "name": "my-project",
  "devDependencies": {
    "// Note": "Docs viewer dependencies are managed in the submodule"
  }
}
```

## Migration Guide

### From npm Package

If migrating from an npm-based installation:

```bash
# 1. Remove npm dependency
npm uninstall markdown-docs-viewer

# 2. Add as submodule
git submodule add https://github.com/AustinOrphan/markdown-docs-viewer.git docs-viewer

# 3. Update import paths
# Old: import viewer from 'markdown-docs-viewer'
# New: <script src="docs-viewer/dist/zero-config.umd.cjs"></script>

# 4. Build the submodule
cd docs-viewer && npm ci && npm run build
```

### From Git Clone

If currently using a manual git clone:

```bash
# 1. Remove existing clone
rm -rf docs-viewer

# 2. Add as proper submodule
git submodule add https://github.com/AustinOrphan/markdown-docs-viewer.git docs-viewer

# 3. Update .gitignore (remove docs-viewer if present)
sed -i '/docs-viewer/d' .gitignore

# 4. Commit submodule addition
git add .gitmodules docs-viewer .gitignore
git commit -m "Convert docs-viewer to git submodule"
```

## Support

### Getting Help

- **Documentation**: [GitHub Repository](https://github.com/AustinOrphan/markdown-docs-viewer)
- **Issues**: [GitHub Issues](https://github.com/AustinOrphan/markdown-docs-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AustinOrphan/markdown-docs-viewer/discussions)

### Reporting Submodule Issues

When reporting submodule-related issues, include:

1. **Setup Method**: Automated script vs manual setup
2. **Git Version**: `git --version`
3. **Node.js Version**: `node --version`
4. **OS/Environment**: Operating system and version
5. **Error Output**: Complete error messages and stack traces
6. **Submodule Status**: `git submodule status`

### Community Examples

Check the [examples repository](https://github.com/AustinOrphan/markdown-docs-viewer-examples) for community-contributed integration patterns and configurations.