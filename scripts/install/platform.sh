#!/bin/bash
# Platform detection utilities for markdown-docs-viewer installation
# Provides cross-platform installation support foundation

set -euo pipefail

# Detect the current platform (macOS/Linux/Windows)
detect_platform() {
    local platform
    case "$(uname -s)" in
        Darwin*)
            platform="macos"
            ;;
        Linux*)
            platform="linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            platform="windows"
            ;;
        *)
            platform="unknown"
            ;;
    esac
    echo "$platform"
}

# Detect system architecture (x64/arm64)
get_architecture() {
    local arch
    case "$(uname -m)" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        armv7l)
            arch="armv7"
            ;;
        i386|i686)
            arch="x86"
            ;;
        *)
            arch="unknown"
            ;;
    esac
    echo "$arch"
}

# Check if a command exists in PATH
has_command() {
    local cmd="$1"
    command -v "$cmd" >/dev/null 2>&1
}

# Get platform-specific package manager
get_package_manager() {
    local platform="$1"
    case "$platform" in
        macos)
            if has_command brew; then
                echo "brew"
            elif has_command port; then
                echo "port"
            else
                echo "none"
            fi
            ;;
        linux)
            if has_command apt-get; then
                echo "apt"
            elif has_command yum; then
                echo "yum"
            elif has_command dnf; then
                echo "dnf"
            elif has_command pacman; then
                echo "pacman"
            elif has_command zypper; then
                echo "zypper"
            else
                echo "none"
            fi
            ;;
        windows)
            if has_command choco; then
                echo "choco"
            elif has_command winget; then
                echo "winget"
            else
                echo "none"
            fi
            ;;
        *)
            echo "none"
            ;;
    esac
}

# Get download command (curl or wget)
get_download_command() {
    if has_command curl; then
        echo "curl -fsSL"
    elif has_command wget; then
        echo "wget -qO-"
    else
        echo "none"
    fi
}

# Check if running in CI environment
is_ci_environment() {
    [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]] || [[ -n "${TRAVIS:-}" ]] || [[ -n "${CIRCLECI:-}" ]] || [[ -n "${JENKINS_URL:-}" ]]
}

# Get temporary directory path
get_temp_dir() {
    local temp_base
    if [[ -n "${TMPDIR:-}" ]]; then
        temp_base="$TMPDIR"
    elif [[ -d "/tmp" ]]; then
        temp_base="/tmp"
    else
        temp_base="."
    fi
    echo "${temp_base}/mdv-install-$$"
}

# Print platform information for debugging
print_platform_info() {
    echo "Platform Information:"
    echo "  OS: $(detect_platform)"
    echo "  Architecture: $(get_architecture)"
    echo "  Package Manager: $(get_package_manager "$(detect_platform)")"
    echo "  Download Command: $(get_download_command)"
    echo "  CI Environment: $(is_ci_environment && echo "yes" || echo "no")"
    echo "  Temp Directory: $(get_temp_dir)"
}

# Validate platform compatibility
validate_platform_compatibility() {
    local platform arch download_cmd
    platform="$(detect_platform)"
    arch="$(get_architecture)"
    download_cmd="$(get_download_command)"
    
    if [[ "$platform" == "unknown" ]]; then
        echo "Error: Unsupported platform detected. Please install manually." >&2
        return 1
    fi
    
    if [[ "$arch" == "unknown" ]]; then
        echo "Warning: Unknown architecture detected. Installation may not work correctly." >&2
    fi
    
    if [[ "$download_cmd" == "none" ]]; then
        echo "Error: Neither curl nor wget found. Please install one of them first." >&2
        return 1
    fi
    
    return 0
}

# Export functions for use in other scripts
export -f detect_platform
export -f get_architecture
export -f has_command
export -f get_package_manager
export -f get_download_command
export -f is_ci_environment
export -f get_temp_dir
export -f print_platform_info
export -f validate_platform_compatibility