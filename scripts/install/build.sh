#!/bin/bash
# Download and build utilities for markdown-docs-viewer installation
# Handles repository download and build process with error recovery

set -euo pipefail

# Source platform detection and dependency utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./platform.sh
source "$SCRIPT_DIR/platform.sh"
# shellcheck source=./dependencies.sh
source "$SCRIPT_DIR/dependencies.sh"

# Repository configuration
REPO_URL="https://github.com/AustinOrphan/markdown-docs-viewer.git"
REPO_BRANCH="main"
REQUIRED_DIST_FILES=("zero-config.umd.cjs" "zero-config.es.js" "index.d.ts")

# Download repository with shallow clone optimization
download_repository() {
    local temp_dir="$1"
    local branch="${2:-$REPO_BRANCH}"
    local download_cmd
    
    echo "Downloading markdown-docs-viewer repository..."
    
    download_cmd="$(get_download_command)"
    if [[ "$download_cmd" == "none" ]]; then
        echo "Error: No download command available (curl or wget required)" >&2
        return 1
    fi
    
    # Create temporary directory
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # Try shallow clone first (fastest)
    if git clone --depth 1 --branch "$branch" "$REPO_URL" .; then
        echo "✓ Repository cloned successfully (shallow clone)"
        return 0
    fi
    
    # Fallback to full clone if shallow fails
    echo "Shallow clone failed, trying full clone..."
    rm -rf .git
    if git clone --branch "$branch" "$REPO_URL" .; then
        echo "✓ Repository cloned successfully (full clone)"
        return 0
    fi
    
    echo "Error: Failed to clone repository" >&2
    return 1
}

# Download repository as ZIP (fallback method)
download_repository_zip() {
    local temp_dir="$1"
    local branch="${2:-$REPO_BRANCH}"
    local download_cmd zip_url
    
    echo "Downloading repository as ZIP (fallback method)..."
    
    download_cmd="$(get_download_command)"
    if [[ "$download_cmd" == "none" ]]; then
        echo "Error: No download command available" >&2
        return 1
    fi
    
    zip_url="https://github.com/AustinOrphan/markdown-docs-viewer/archive/refs/heads/${branch}.zip"
    
    # Create temporary directory
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # Download and extract ZIP
    if $download_cmd "$zip_url" > repo.zip; then
        if has_command unzip; then
            unzip -q repo.zip
            mv "markdown-docs-viewer-${branch}"/* .
            rm -rf "markdown-docs-viewer-${branch}" repo.zip
            echo "✓ Repository downloaded and extracted successfully"
            return 0
        else
            echo "Error: unzip command not found" >&2
            return 1
        fi
    fi
    
    echo "Error: Failed to download repository ZIP" >&2
    return 1
}

# Build the viewer using npm
build_viewer() {
    local repo_dir="$1"
    local build_timeout="${2:-300}" # 5 minutes default timeout
    
    echo "Building markdown-docs-viewer..."
    
    cd "$repo_dir"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        echo "Error: package.json not found in repository" >&2
        return 1
    fi
    
    # Install dependencies with timeout
    echo "Installing npm dependencies..."
    if timeout "$build_timeout" npm ci --no-audit --no-fund --prefer-offline; then
        echo "✓ Dependencies installed successfully"
    elif timeout "$build_timeout" npm install --no-audit --no-fund; then
        echo "✓ Dependencies installed successfully (fallback to npm install)"
    else
        echo "Error: Failed to install dependencies" >&2
        return 1
    fi
    
    # Run build with timeout
    echo "Running build process..."
    if timeout "$build_timeout" npm run build; then
        echo "✓ Build completed successfully"
    else
        echo "Error: Build process failed or timed out" >&2
        return 1
    fi
    
    return 0
}

# Build only the zero-config bundle (faster alternative)
build_zero_config_only() {
    local repo_dir="$1"
    local build_timeout="${2:-180}" # 3 minutes default timeout
    
    echo "Building zero-config bundle only..."
    
    cd "$repo_dir"
    
    # Check if zero-config build script exists
    if ! npm run --dry-run build:zero-config >/dev/null 2>&1; then
        echo "Zero-config build script not available, running full build..."
        return build_viewer "$repo_dir" "$build_timeout"
    fi
    
    # Install dependencies
    echo "Installing npm dependencies..."
    if timeout "$build_timeout" npm ci --no-audit --no-fund --prefer-offline; then
        echo "✓ Dependencies installed successfully"
    elif timeout "$build_timeout" npm install --no-audit --no-fund; then
        echo "✓ Dependencies installed successfully (fallback to npm install)"
    else
        echo "Error: Failed to install dependencies" >&2
        return 1
    fi
    
    # Run zero-config build
    echo "Running zero-config build..."
    if timeout "$build_timeout" npm run build:zero-config; then
        echo "✓ Zero-config build completed successfully"
        return 0
    else
        echo "Zero-config build failed, trying full build..."
        return build_viewer "$repo_dir" "$build_timeout"
    fi
}

# Validate that build output exists and is valid
validate_build() {
    local repo_dir="$1"
    local dist_dir="$repo_dir/dist"
    
    echo "Validating build output..."
    
    # Check if dist directory exists
    if [[ ! -d "$dist_dir" ]]; then
        echo "Error: dist/ directory not found" >&2
        return 1
    fi
    
    # Check for required files
    local missing_files=()
    for file in "${REQUIRED_DIST_FILES[@]}"; do
        if [[ ! -f "$dist_dir/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo "Error: Missing required build files: ${missing_files[*]}" >&2
        return 1
    fi
    
    # Check file sizes (basic validation)
    local zero_config_size
    zero_config_size=$(stat -f%z "$dist_dir/zero-config.umd.cjs" 2>/dev/null || stat -c%s "$dist_dir/zero-config.umd.cjs" 2>/dev/null || echo "0")
    
    if [[ "$zero_config_size" -lt 1000 ]]; then
        echo "Error: zero-config.umd.cjs appears to be too small ($zero_config_size bytes)" >&2
        return 1
    fi
    
    echo "✓ Build validation passed"
    echo "  - zero-config.umd.cjs: $(format_file_size "$zero_config_size")"
    
    for file in "${REQUIRED_DIST_FILES[@]}"; do
        if [[ -f "$dist_dir/$file" ]]; then
            echo "  - $file: ✓"
        fi
    done
    
    return 0
}

# Format file size for display
format_file_size() {
    local bytes="$1"
    if [[ "$bytes" -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ "$bytes" -lt 1048576 ]]; then
        echo "$((bytes / 1024))KB"
    else
        echo "$((bytes / 1048576))MB"
    fi
}

# Get build information (version, commit, etc.)
get_build_info() {
    local repo_dir="$1"
    
    cd "$repo_dir"
    
    local version commit_hash build_date
    version="$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")"
    commit_hash="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
    build_date="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    
    echo "Build Information:"
    echo "  Version: $version"
    echo "  Commit: $commit_hash"
    echo "  Build Date: $build_date"
}

# Clean up build artifacts but keep dist/
clean_build_artifacts() {
    local repo_dir="$1"
    
    cd "$repo_dir"
    
    echo "Cleaning up build artifacts..."
    
    # Remove node_modules to save space
    if [[ -d "node_modules" ]]; then
        rm -rf node_modules
        echo "  - Removed node_modules/"
    fi
    
    # Remove other build artifacts
    local cleanup_patterns=(".nyc_output" "coverage" "*.log" ".npm" ".cache")
    for pattern in "${cleanup_patterns[@]}"; do
        if compgen -G "$pattern" > /dev/null 2>&1; then
            rm -rf $pattern
            echo "  - Removed $pattern"
        fi
    done
    
    echo "✓ Build artifacts cleaned up"
}

# Complete download and build process
download_and_build() {
    local temp_dir="$1"
    local branch="${2:-$REPO_BRANCH}"
    local build_timeout="${3:-300}"
    local cleanup="${4:-true}"
    
    echo "Starting download and build process..."
    
    # Try git clone first
    if download_repository "$temp_dir" "$branch"; then
        echo "✓ Repository downloaded via git"
    elif download_repository_zip "$temp_dir" "$branch"; then
        echo "✓ Repository downloaded as ZIP"
    else
        echo "Error: Failed to download repository" >&2
        return 1
    fi
    
    # Get build info before building
    get_build_info "$temp_dir"
    
    # Build the project
    if build_zero_config_only "$temp_dir" "$build_timeout"; then
        echo "✓ Build process completed"
    else
        echo "Error: Build process failed" >&2
        return 1
    fi
    
    # Validate build output
    if validate_build "$temp_dir"; then
        echo "✓ Build validation passed"
    else
        echo "Error: Build validation failed" >&2
        return 1
    fi
    
    # Clean up if requested
    if [[ "$cleanup" == "true" ]]; then
        clean_build_artifacts "$temp_dir"
    fi
    
    echo "✓ Download and build process completed successfully"
    return 0
}

# Export functions for use in other scripts
export -f download_repository
export -f download_repository_zip
export -f build_viewer
export -f build_zero_config_only
export -f validate_build
export -f format_file_size
export -f get_build_info
export -f clean_build_artifacts
export -f download_and_build