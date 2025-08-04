#!/bin/bash
# Dependency management utilities for markdown-docs-viewer installation
# Handles dependency installation and validation automatically

set -euo pipefail

# Source platform detection utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./platform.sh
source "$SCRIPT_DIR/platform.sh"

# Minimum required Node.js version
MIN_NODE_VERSION="18"
RECOMMENDED_NODE_VERSION="20"

# Check if dependencies are available
check_dependencies() {
    local missing_deps=()
    local platform
    platform="$(detect_platform)"
    
    echo "Checking dependencies..."
    
    # Check for git
    if ! has_command git; then
        missing_deps+=("git")
    else
        echo "✓ git found: $(git --version | head -1)"
    fi
    
    # Check for Node.js
    if ! has_command node; then
        missing_deps+=("node")
    else
        local node_version
        node_version="$(node --version | sed 's/v//')"
        if ! validate_node_version "$node_version"; then
            echo "⚠ Node.js $node_version found, but $MIN_NODE_VERSION+ required"
            missing_deps+=("node")
        else
            echo "✓ Node.js $node_version found"
        fi
    fi
    
    # Check for npm (usually comes with Node.js)
    if ! has_command npm; then
        missing_deps+=("npm")
    else
        echo "✓ npm found: $(npm --version)"
    fi
    
    # Check for download command
    local download_cmd
    download_cmd="$(get_download_command)"
    if [[ "$download_cmd" == "none" ]]; then
        missing_deps+=("curl_or_wget")
    else
        echo "✓ Download command found: $download_cmd"
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    echo "All dependencies satisfied!"
    return 0
}

# Validate Node.js version meets minimum requirements
validate_node_version() {
    local version="$1"
    local major_version
    major_version="$(echo "$version" | cut -d. -f1)"
    
    [[ "$major_version" -ge "$MIN_NODE_VERSION" ]]
}

# Install Node.js using platform-specific method
install_nodejs() {
    local platform package_manager
    platform="$(detect_platform)"
    package_manager="$(get_package_manager "$platform")"
    
    echo "Installing Node.js..."
    
    case "$platform" in
        macos)
            case "$package_manager" in
                brew)
                    echo "Installing Node.js via Homebrew..."
                    brew install node
                    ;;
                port)
                    echo "Installing Node.js via MacPorts..."
                    sudo port install nodejs20 +universal
                    ;;
                none)
                    echo "No package manager found. Please install Node.js manually:"
                    echo "Visit: https://nodejs.org/en/download/"
                    return 1
                    ;;
            esac
            ;;
        linux)
            case "$package_manager" in
                apt)
                    echo "Installing Node.js via apt..."
                    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    ;;
                yum|dnf)
                    echo "Installing Node.js via $package_manager..."
                    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                    sudo "$package_manager" install -y nodejs npm
                    ;;
                pacman)
                    echo "Installing Node.js via pacman..."
                    sudo pacman -S nodejs npm
                    ;;
                zypper)
                    echo "Installing Node.js via zypper..."
                    sudo zypper install nodejs20 npm20
                    ;;
                none)
                    echo "No package manager found. Please install Node.js manually:"
                    echo "Visit: https://nodejs.org/en/download/"
                    return 1
                    ;;
            esac
            ;;
        windows)
            case "$package_manager" in
                choco)
                    echo "Installing Node.js via Chocolatey..."
                    choco install nodejs
                    ;;
                winget)
                    echo "Installing Node.js via winget..."
                    winget install OpenJS.NodeJS
                    ;;
                none)
                    echo "No package manager found. Please install Node.js manually:"
                    echo "Visit: https://nodejs.org/en/download/"
                    return 1
                    ;;
            esac
            ;;
        *)
            echo "Unsupported platform for automatic Node.js installation."
            echo "Please install Node.js manually: https://nodejs.org/en/download/"
            return 1
            ;;
    esac
    
    # Verify installation
    if has_command node && has_command npm; then
        local node_version
        node_version="$(node --version | sed 's/v//')"
        echo "✓ Node.js $node_version installed successfully"
        echo "✓ npm $(npm --version) installed successfully"
        return 0
    else
        echo "Node.js installation failed or not found in PATH"
        return 1
    fi
}

# Install git using platform-specific method
install_git() {
    local platform package_manager
    platform="$(detect_platform)"
    package_manager="$(get_package_manager "$platform")"
    
    echo "Installing git..."
    
    case "$platform" in
        macos)
            case "$package_manager" in
                brew)
                    echo "Installing git via Homebrew..."
                    brew install git
                    ;;
                port)
                    echo "Installing git via MacPorts..."
                    sudo port install git
                    ;;
                none)
                    echo "Installing Xcode Command Line Tools (includes git)..."
                    xcode-select --install
                    ;;
            esac
            ;;
        linux)
            case "$package_manager" in
                apt)
                    echo "Installing git via apt..."
                    sudo apt-get update
                    sudo apt-get install -y git
                    ;;
                yum|dnf)
                    echo "Installing git via $package_manager..."
                    sudo "$package_manager" install -y git
                    ;;
                pacman)
                    echo "Installing git via pacman..."
                    sudo pacman -S git
                    ;;
                zypper)
                    echo "Installing git via zypper..."
                    sudo zypper install git
                    ;;
                none)
                    echo "No package manager found. Please install git manually."
                    return 1
                    ;;
            esac
            ;;
        windows)
            case "$package_manager" in
                choco)
                    echo "Installing git via Chocolatey..."
                    choco install git
                    ;;
                winget)
                    echo "Installing git via winget..."
                    winget install Git.Git
                    ;;
                none)
                    echo "Please install git manually: https://git-scm.com/download/windows"
                    return 1
                    ;;
            esac
            ;;
        *)
            echo "Unsupported platform for automatic git installation."
            return 1
            ;;
    esac
    
    # Verify installation
    if has_command git; then
        echo "✓ git $(git --version | head -1) installed successfully"
        return 0
    else
        echo "git installation failed or not found in PATH"
        return 1
    fi
}

# Install curl if not available (wget might be used as fallback)
install_download_tool() {
    local platform package_manager
    platform="$(detect_platform)"
    package_manager="$(get_package_manager "$platform")"
    
    # If we already have a download tool, skip
    if [[ "$(get_download_command)" != "none" ]]; then
        return 0
    fi
    
    echo "Installing curl..."
    
    case "$platform" in
        macos)
            # curl is usually pre-installed on macOS
            echo "curl should be pre-installed on macOS"
            return 0
            ;;
        linux)
            case "$package_manager" in
                apt)
                    sudo apt-get update
                    sudo apt-get install -y curl
                    ;;
                yum|dnf)
                    sudo "$package_manager" install -y curl
                    ;;
                pacman)
                    sudo pacman -S curl
                    ;;
                zypper)
                    sudo zypper install curl
                    ;;
                none)
                    echo "No package manager found. Please install curl manually."
                    return 1
                    ;;
            esac
            ;;
        windows)
            case "$package_manager" in
                choco)
                    choco install curl
                    ;;
                winget)
                    # curl is usually pre-installed on Windows 10+
                    echo "curl should be pre-installed on Windows 10+"
                    ;;
                none)
                    echo "curl should be pre-installed on Windows 10+"
                    ;;
            esac
            ;;
    esac
    
    if has_command curl; then
        echo "✓ curl installed successfully"
        return 0
    else
        echo "curl installation failed"
        return 1
    fi
}

# Attempt to install all missing dependencies
install_missing_dependencies() {
    local ci_mode="${1:-false}"
    
    if [[ "$ci_mode" == "true" ]] || is_ci_environment; then
        echo "Running in CI environment - skipping interactive dependency installation"
        return 1
    fi
    
    echo "Attempting to install missing dependencies..."
    
    # Install git if missing
    if ! has_command git; then
        if ! install_git; then
            echo "Failed to install git. Please install manually."
            return 1
        fi
    fi
    
    # Install download tool if missing
    if [[ "$(get_download_command)" == "none" ]]; then
        if ! install_download_tool; then
            echo "Failed to install download tool. Please install curl or wget manually."
            return 1
        fi
    fi
    
    # Install Node.js if missing or outdated
    if ! has_command node || ! validate_node_version "$(node --version | sed 's/v//')"; then
        if ! install_nodejs; then
            echo "Failed to install Node.js. Please install manually."
            return 1
        fi
    fi
    
    # Final verification
    if check_dependencies; then
        echo "✓ All dependencies installed successfully!"
        return 0
    else
        echo "Some dependencies could not be installed automatically."
        return 1
    fi
}

# Print dependency installation instructions
print_manual_install_instructions() {
    local platform
    platform="$(detect_platform)"
    
    echo ""
    echo "Manual installation instructions for $platform:"
    echo ""
    
    case "$platform" in
        macos)
            echo "1. Install Homebrew (if not already installed):"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo ""
            echo "2. Install dependencies:"
            echo "   brew install git node"
            ;;
        linux)
            echo "For Ubuntu/Debian:"
            echo "   sudo apt-get update"
            echo "   sudo apt-get install -y git curl"
            echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "   sudo apt-get install -y nodejs"
            echo ""
            echo "For CentOS/RHEL/Fedora:"
            echo "   sudo yum install -y git curl"
            echo "   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "   sudo yum install -y nodejs npm"
            ;;
        windows)
            echo "1. Install Chocolatey (if not already installed):"
            echo "   Visit: https://chocolatey.org/install"
            echo ""
            echo "2. Install dependencies:"
            echo "   choco install git nodejs"
            echo ""
            echo "Alternative: Download installers directly:"
            echo "   Git: https://git-scm.com/download/windows"
            echo "   Node.js: https://nodejs.org/en/download/"
            ;;
        *)
            echo "Please install the following manually:"
            echo "   - git: https://git-scm.com/downloads"
            echo "   - Node.js $RECOMMENDED_NODE_VERSION+: https://nodejs.org/en/download/"
            echo "   - curl or wget for downloads"
            ;;
    esac
    echo ""
}

# Export functions for use in other scripts
export -f check_dependencies
export -f validate_node_version
export -f install_nodejs
export -f install_git
export -f install_download_tool
export -f install_missing_dependencies
export -f print_manual_install_instructions