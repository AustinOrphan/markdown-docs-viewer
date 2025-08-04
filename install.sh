#!/bin/bash
# Markdown Docs Viewer - One-Command Installation Script
# Provides one-command installation with automatic build and setup

set -euo pipefail

# Script configuration
SCRIPT_VERSION="1.0.0"
DEFAULT_PROJECT_NAME="My Documentation"
DEFAULT_BRANCH="main"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
TEMP_DIR=""
TARGET_DIR=""
PROJECT_NAME=""
BRANCH=""
SKIP_DEPS=""

# Print colored output
print_color() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

# Print header
print_header() {
    echo ""
    print_color "$CYAN" "🚀 Markdown Docs Viewer Installer v$SCRIPT_VERSION"
    echo ""
    print_color "$BLUE" "Transform your markdown files into beautiful documentation"
    print_color "$BLUE" "Zero-config by default, infinitely configurable when needed"
    echo ""
}

# Print usage information
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [TARGET_DIRECTORY]

OPTIONS:
    --help, -h              Show this help message
    --name NAME             Set project name (default: "$DEFAULT_PROJECT_NAME")
    --branch BRANCH         Use specific git branch (default: "$DEFAULT_BRANCH")
    --skip-deps             Skip dependency installation (use existing tools)
    --version, -v           Show version information

EXAMPLES:
    # Install in current directory
    $0

    # Install in specific directory with custom name
    $0 --name "My Project Docs" ./my-docs

    # Install from development branch
    $0 --branch develop

    # Skip dependency installation (faster if tools already available)
    $0 --skip-deps

For more information, visit: https://github.com/AustinOrphan/markdown-docs-viewer
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                print_usage
                exit 0
                ;;
            --name)
                PROJECT_NAME="$2"
                shift 2
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --skip-deps)
                SKIP_DEPS="true"
                shift
                ;;
            --version|-v)
                echo "Markdown Docs Viewer Installer v$SCRIPT_VERSION"
                exit 0
                ;;
            --*)
                print_color "$RED" "Error: Unknown option $1"
                print_usage
                exit 1
                ;;
            *)
                if [[ -z "$TARGET_DIR" ]]; then
                    TARGET_DIR="$1"
                else
                    print_color "$RED" "Error: Multiple target directories specified"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Set defaults
    PROJECT_NAME="${PROJECT_NAME:-$DEFAULT_PROJECT_NAME}"
    BRANCH="${BRANCH:-$DEFAULT_BRANCH}"
    TARGET_DIR="${TARGET_DIR:-$(pwd)/markdown-docs-viewer}"
    SKIP_DEPS="${SKIP_DEPS:-false}"
}

# Source utility scripts
source_utilities() {
    local script_dir utils_dir
    
    # Determine if we're running from downloaded script or local development
    if [[ -f "scripts/install/platform.sh" ]]; then
        # Local development mode
        utils_dir="scripts/install"
    else
        # Downloaded script mode - utilities should be in same directory
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        utils_dir="$script_dir"
        
        # If utilities don't exist, we need to download them first
        if [[ ! -f "$utils_dir/platform.sh" ]]; then
            print_color "$YELLOW" "Downloading installation utilities..."
            download_utilities "$utils_dir"
        fi
    fi
    
    # Source all utility scripts
    local utilities=("platform.sh" "dependencies.sh" "build.sh" "files.sh")
    for util in "${utilities[@]}"; do
        local util_path="$utils_dir/$util"
        if [[ -f "$util_path" ]]; then
            # shellcheck source=/dev/null
            source "$util_path"
        else
            print_color "$RED" "Error: Required utility script not found: $util_path"
            exit 1
        fi
    done
}

# Download utility scripts (for standalone installation)
download_utilities() {
    local utils_dir="$1"
    local base_url="https://raw.githubusercontent.com/AustinOrphan/markdown-docs-viewer/$BRANCH/scripts/install"
    local download_cmd
    
    download_cmd="$(curl --version >/dev/null 2>&1 && echo "curl -fsSL" || echo "wget -qO-")"
    if [[ "$download_cmd" == "wget -qO-" ]] && ! wget --version >/dev/null 2>&1; then
        print_color "$RED" "Error: Neither curl nor wget available for downloading utilities"
        exit 1
    fi
    
    mkdir -p "$utils_dir"
    
    local utilities=("platform.sh" "dependencies.sh" "build.sh" "files.sh")
    for util in "${utilities[@]}"; do
        print_color "$CYAN" "  Downloading $util..."
        if $download_cmd "$base_url/$util" > "$utils_dir/$util"; then
            chmod +x "$utils_dir/$util"
        else
            print_color "$RED" "Error: Failed to download $util"
            exit 1
        fi
    done
    
    print_color "$GREEN" "✓ Installation utilities downloaded"
}

# Cleanup function (called on EXIT)
cleanup_on_exit() {
    local exit_code=$?
    
    if [[ -n "$TEMP_DIR" ]] && [[ -d "$TEMP_DIR" ]]; then
        print_color "$YELLOW" "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
    
    if [[ $exit_code -ne 0 ]]; then
        print_color "$RED" "Installation failed. Check the error messages above."
        print_color "$YELLOW" "For help, visit: https://github.com/AustinOrphan/markdown-docs-viewer/issues"
    fi
}

# Main installation process
main() {
    # Set up cleanup trap
    trap cleanup_on_exit EXIT
    
    # Parse arguments
    parse_arguments "$@"
    
    # Print header
    print_header
    
    # Source utility scripts
    source_utilities
    
    # Print configuration
    print_color "$PURPLE" "Installation Configuration:"
    echo "  Target Directory: $TARGET_DIR"
    echo "  Project Name: $PROJECT_NAME"
    echo "  Branch: $BRANCH"
    echo "  Skip Dependencies: $SKIP_DEPS"
    echo ""
    
    # Print platform information
    print_platform_info
    echo ""
    
    # Validate platform compatibility
    if ! validate_platform_compatibility; then
        print_color "$RED" "Platform compatibility check failed"
        exit 1
    fi
    
    # Check dependencies or install them
    if [[ "$SKIP_DEPS" == "true" ]]; then
        print_color "$YELLOW" "Skipping dependency check (--skip-deps specified)"
        if ! check_dependencies; then
            print_color "$RED" "Required dependencies missing. Remove --skip-deps to auto-install."
            print_manual_install_instructions
            exit 1
        fi
    else
        print_color "$CYAN" "Checking dependencies..."
        if ! check_dependencies; then
            print_color "$YELLOW" "Missing dependencies detected. Attempting automatic installation..."
            if ! install_missing_dependencies; then
                print_color "$RED" "Automatic dependency installation failed."
                print_manual_install_instructions
                exit 1
            fi
        fi
    fi
    
    # Create temporary directory
    TEMP_DIR="$(get_temp_dir)"
    print_color "$CYAN" "Creating temporary directory: $TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Download and build
    print_color "$CYAN" "Downloading and building markdown-docs-viewer..."
    if ! download_and_build "$TEMP_DIR" "$BRANCH" 300; then
        print_color "$RED" "Download and build process failed"
        exit 1
    fi
    
    # Create project structure
    print_color "$CYAN" "Creating project structure..."
    if ! create_project_structure "$TARGET_DIR" "$PROJECT_NAME" "$TEMP_DIR"; then
        print_color "$RED" "Failed to create project structure"
        exit 1
    fi
    
    # Validate installation
    print_color "$CYAN" "Validating installation..."
    if ! validate_installation "$TARGET_DIR"; then
        print_color "$RED" "Installation validation failed"
        exit 1
    fi
    
    # Print success message
    print_success_message "$TARGET_DIR" "$PROJECT_NAME"
    
    # Clean up temporary directory
    cleanup "$TEMP_DIR"
    TEMP_DIR="" # Prevent cleanup trap from running again
    
    print_color "$GREEN" "🎉 Installation completed successfully!"
    print_color "$CYAN" "⏱️  Total time: $((SECONDS))s"
}

# Handle script interruption
handle_interrupt() {
    print_color "$YELLOW" ""
    print_color "$YELLOW" "Installation interrupted by user"
    exit 1
}

# Trap interrupt signals
trap handle_interrupt SIGINT SIGTERM

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
else
    # Script is being sourced - export functions for testing
    export -f print_color
    export -f print_header
    export -f print_usage
    export -f parse_arguments
    export -f source_utilities
    export -f download_utilities
    export -f cleanup_on_exit
    export -f main
    export -f handle_interrupt
fi