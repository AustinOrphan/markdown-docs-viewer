#!/bin/bash
# Submodule setup script for markdown-docs-viewer
# Simplifies submodule setup with automated build hooks

set -euo pipefail

# Script configuration
SCRIPT_VERSION="1.0.0"
REPO_URL="https://github.com/AustinOrphan/markdown-docs-viewer.git"
HOOK_TEMPLATE_URL="https://raw.githubusercontent.com/AustinOrphan/markdown-docs-viewer/main/templates/git-hooks/post-checkout"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

# Print header
print_header() {
    echo ""
    print_color "$CYAN" "🔗 Markdown Docs Viewer Submodule Setup v$SCRIPT_VERSION"
    echo ""
    print_color "$BLUE" "Automated git submodule integration with build hooks"
    echo ""
}

# Print usage information
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [SUBMODULE_PATH]

DESCRIPTION:
    Sets up markdown-docs-viewer as a git submodule with automatic build hooks.
    The submodule will automatically rebuild when updated.

OPTIONS:
    --help, -h              Show this help message
    --branch BRANCH         Use specific git branch (default: main)
    --no-hooks              Skip git hook installation
    --force                 Force setup even if submodule exists
    --version, -v           Show version information

EXAMPLES:
    # Add submodule in docs-viewer/ directory
    $0 docs-viewer

    # Add submodule with specific branch
    $0 --branch develop docs-viewer

    # Setup without automatic build hooks
    $0 --no-hooks docs-viewer

    # Force setup in existing directory
    $0 --force docs-viewer

NOTES:
    - Must be run from the root of a git repository
    - Requires git, Node.js 18+, and npm for automatic builds
    - Creates .gitmodules entry and installs post-checkout hook

For more information, visit: https://github.com/AustinOrphan/markdown-docs-viewer
EOF
}

# Parse command line arguments
parse_arguments() {
    SUBMODULE_PATH=""
    BRANCH="main"
    INSTALL_HOOKS="true"
    FORCE_SETUP="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                print_usage
                exit 0
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --no-hooks)
                INSTALL_HOOKS="false"
                shift
                ;;
            --force)
                FORCE_SETUP="true"
                shift
                ;;
            --version|-v)
                echo "Markdown Docs Viewer Submodule Setup v$SCRIPT_VERSION"
                exit 0
                ;;
            --*)
                print_color "$RED" "Error: Unknown option $1"
                print_usage
                exit 1
                ;;
            *)
                if [[ -z "$SUBMODULE_PATH" ]]; then
                    SUBMODULE_PATH="$1"
                else
                    print_color "$RED" "Error: Multiple submodule paths specified"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Set default submodule path if not provided
    if [[ -z "$SUBMODULE_PATH" ]]; then
        SUBMODULE_PATH="markdown-docs-viewer"
    fi
}

# Validate environment
validate_environment() {
    print_color "$CYAN" "Validating environment..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        print_color "$RED" "Error: Not in a git repository"
        print_color "$YELLOW" "Run this script from the root of your git repository"
        exit 1
    fi
    
    # Check git version
    local git_version
    git_version="$(git --version | sed 's/git version //')"
    print_color "$BLUE" "✓ Git $git_version found"
    
    # Check for git command availability
    if ! command -v git >/dev/null 2>&1; then
        print_color "$RED" "Error: git command not found"
        exit 1
    fi
    
    # Check internet connectivity (basic)
    if ! ping -c 1 github.com >/dev/null 2>&1; then
        print_color "$YELLOW" "Warning: Cannot reach GitHub. Internet connection may be required."
    fi
    
    print_color "$GREEN" "✓ Environment validation passed"
}

# Check if Node.js dependencies are available
check_build_dependencies() {
    print_color "$CYAN" "Checking build dependencies..."
    
    local warnings=()
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version="$(node --version | sed 's/v//')"
        local major_version
        major_version="$(echo "$node_version" | cut -d. -f1)"
        
        if [[ "$major_version" -ge 18 ]]; then
            print_color "$BLUE" "✓ Node.js $node_version found"
        else
            warnings+=("Node.js $node_version found, but 18+ recommended for building")
        fi
    else
        warnings+=("Node.js not found - required for automatic builds")
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version="$(npm --version)"
        print_color "$BLUE" "✓ npm $npm_version found"
    else
        warnings+=("npm not found - required for automatic builds")
    fi
    
    # Print warnings
    if [[ ${#warnings[@]} -gt 0 ]]; then
        print_color "$YELLOW" "Warnings:"
        for warning in "${warnings[@]}"; do
            print_color "$YELLOW" "  - $warning"
        done
        print_color "$YELLOW" "Automatic builds may not work. Install Node.js 18+ and npm to enable."
        echo ""
    else
        print_color "$GREEN" "✓ Build dependencies available"
    fi
}

# Validate .gitmodules configuration
validate_gitmodules() {
    local submodule_path="$1"
    
    if [[ -f ".gitmodules" ]]; then
        print_color "$CYAN" "Checking existing .gitmodules configuration..."
        
        # Check if submodule already exists
        if git config --file .gitmodules --get-regexp "submodule\..*\.path" | grep -q "^submodule\.[^.]*\.path $submodule_path$"; then
            if [[ "$FORCE_SETUP" == "true" ]]; then
                print_color "$YELLOW" "Submodule path '$submodule_path' exists, but --force specified"
                return 0
            else
                print_color "$RED" "Error: Submodule path '$submodule_path' already exists in .gitmodules"
                print_color "$YELLOW" "Use --force to override, or choose a different path"
                exit 1
            fi
        fi
        
        print_color "$BLUE" "✓ No conflicts in .gitmodules"
    else
        print_color "$BLUE" "No existing .gitmodules file"
    fi
}

# Add git submodule
add_submodule() {
    local submodule_path="$1"
    local branch="$2"
    
    print_color "$CYAN" "Adding git submodule..."
    
    # Remove existing submodule if force is specified
    if [[ "$FORCE_SETUP" == "true" ]] && [[ -d "$submodule_path" ]]; then
        print_color "$YELLOW" "Removing existing submodule directory..."
        git submodule deinit -f "$submodule_path" 2>/dev/null || true
        git rm -f "$submodule_path" 2>/dev/null || true
        rm -rf "$submodule_path"
    fi
    
    # Add the submodule
    print_color "$BLUE" "Adding submodule from $REPO_URL (branch: $branch)"
    if git submodule add -b "$branch" "$REPO_URL" "$submodule_path"; then
        print_color "$GREEN" "✓ Submodule added successfully"
    else
        print_color "$RED" "Error: Failed to add submodule"
        exit 1
    fi
    
    # Initialize and update the submodule
    print_color "$BLUE" "Initializing submodule..."
    if git submodule update --init --recursive "$submodule_path"; then
        print_color "$GREEN" "✓ Submodule initialized and updated"
    else
        print_color "$RED" "Error: Failed to initialize submodule"
        exit 1
    fi
}

# Download git hook template
download_git_hook() {
    local hook_path="$1"
    
    print_color "$CYAN" "Downloading git hook template..."
    
    # Create hooks directory if it doesn't exist
    mkdir -p "$(dirname "$hook_path")"
    
    # Try to download from GitHub
    if command -v curl >/dev/null 2>&1; then
        if curl -fsSL "$HOOK_TEMPLATE_URL" -o "$hook_path"; then
            chmod +x "$hook_path"
            print_color "$GREEN" "✓ Git hook downloaded from GitHub"
            return 0
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget -qO "$hook_path" "$HOOK_TEMPLATE_URL"; then
            chmod +x "$hook_path"
            print_color "$GREEN" "✓ Git hook downloaded from GitHub"
            return 0
        fi
    fi
    
    # Fallback: create a basic hook locally
    print_color "$YELLOW" "Could not download hook template, creating basic version..."
    create_basic_hook "$hook_path"
}

# Create basic git hook (fallback)
create_basic_hook() {
    local hook_path="$1"
    
    cat > "$hook_path" << 'EOF'
#!/bin/bash
# Basic post-checkout hook for markdown-docs-viewer submodule
# Auto-generated fallback version

set -e

# Only run in submodules
if [[ ! -f ".git" ]] || ! grep -q "gitdir:" ".git"; then
    exit 0
fi

# Only run on submodule updates (not branch checkouts)
prev_head="$1"
new_head="$2"
branch_checkout="$3"

if [[ "$branch_checkout" -eq 1 ]] || [[ "$prev_head" == "$new_head" ]]; then
    exit 0
fi

# Check if this is markdown-docs-viewer
if [[ ! -f "package.json" ]] || ! grep -q "markdown-docs-viewer" package.json; then
    exit 0
fi

echo "[markdown-docs-viewer] Submodule updated, running build..."

# Simple build process
if command -v npm >/dev/null 2>&1 && [[ -f "package.json" ]]; then
    npm ci --no-audit --no-fund && npm run build
    echo "[markdown-docs-viewer] Build completed successfully!"
else
    echo "[markdown-docs-viewer] Node.js/npm not available, skipping build"
fi
EOF
    
    chmod +x "$hook_path"
    print_color "$GREEN" "✓ Basic git hook created"
}

# Install git hooks
install_git_hooks() {
    local submodule_path="$1"
    
    if [[ "$INSTALL_HOOKS" == "false" ]]; then
        print_color "$YELLOW" "Skipping git hook installation (--no-hooks specified)"
        return 0
    fi
    
    print_color "$CYAN" "Installing git hooks..."
    
    # Get the submodule's git directory
    local submodule_git_dir
    if [[ -f "$submodule_path/.git" ]]; then
        # Submodule with gitdir reference
        submodule_git_dir="$(grep gitdir "$submodule_path/.git" | cut -d' ' -f2-)"
        if [[ ! "${submodule_git_dir}" =~ ^/ ]]; then
            # Relative path, make it absolute from submodule directory
            submodule_git_dir="$submodule_path/$submodule_git_dir"
        fi
    elif [[ -d "$submodule_path/.git" ]]; then
        # Regular git directory (unusual for submodules)
        submodule_git_dir="$submodule_path/.git"
    else
        print_color "$RED" "Error: Cannot find git directory for submodule"
        return 1
    fi
    
    local hooks_dir="$submodule_git_dir/hooks"
    local hook_path="$hooks_dir/post-checkout"
    
    # Create hooks directory
    mkdir -p "$hooks_dir"
    
    # Download and install the hook
    download_git_hook "$hook_path"
    
    print_color "$GREEN" "✓ Git hooks installed in $hooks_dir"
}

# Create skip flag file
create_skip_flag_example() {
    local submodule_path="$1"
    
    cat > "$submodule_path/.skip-auto-build.example" << EOF
# Markdown Docs Viewer - Auto-build Control
#
# To disable automatic builds when the submodule is updated:
# 1. Rename this file to .skip-auto-build (remove .example)
# 2. Commit the change to your repository
#
# When auto-build is disabled, you'll need to run 'npm run build'
# manually in the submodule directory after updates.
#
# To re-enable auto-build, simply delete the .skip-auto-build file.
EOF
    
    print_color "$BLUE" "Created .skip-auto-build.example for build control"
}

# Generate setup summary
print_setup_summary() {
    local submodule_path="$1"
    local branch="$2"
    
    print_color "$GREEN" ""
    print_color "$GREEN" "🎉 Submodule setup completed successfully!"
    print_color "$GREEN" ""
    print_color "$PURPLE" "Setup Summary:"
    print_color "$BLUE" "  Submodule Path: $submodule_path"
    print_color "$BLUE" "  Branch: $branch"
    print_color "$BLUE" "  Auto-build: $([ "$INSTALL_HOOKS" == "true" ] && echo "Enabled" || echo "Disabled")"
    print_color "$BLUE" ""
    print_color "$PURPLE" "Next Steps:"
    print_color "$CYAN" "  1. cd $submodule_path"
    print_color "$CYAN" "  2. npm run build  # Build the viewer"
    print_color "$CYAN" "  3. Use files from dist/ directory in your project"
    print_color "$BLUE" ""
    print_color "$PURPLE" "Usage:"
    print_color "$CYAN" "  • Submodule will auto-build when updated (if hooks enabled)"
    print_color "$CYAN" "  • Create .skip-auto-build file to disable auto-builds"
    print_color "$CYAN" "  • Manual build: cd $submodule_path && npm run build"
    print_color "$BLUE" ""
    print_color "$PURPLE" "Update Submodule:"
    print_color "$CYAN" "  git submodule update --remote $submodule_path"
    print_color "$BLUE" ""
    print_color "$PURPLE" "Documentation:"
    print_color "$CYAN" "  https://github.com/AustinOrphan/markdown-docs-viewer"
    print_color "$BLUE" ""
}

# Main setup process
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Print header
    print_header
    
    # Print configuration
    print_color "$PURPLE" "Setup Configuration:"
    print_color "$BLUE" "  Submodule Path: $SUBMODULE_PATH"
    print_color "$BLUE" "  Branch: $BRANCH"
    print_color "$BLUE" "  Install Hooks: $INSTALL_HOOKS"
    print_color "$BLUE" "  Force Setup: $FORCE_SETUP"
    echo ""
    
    # Validate environment
    validate_environment
    echo ""
    
    # Check build dependencies
    check_build_dependencies
    echo ""
    
    # Validate .gitmodules
    validate_gitmodules "$SUBMODULE_PATH"
    echo ""
    
    # Add submodule
    add_submodule "$SUBMODULE_PATH" "$BRANCH"
    echo ""
    
    # Install git hooks
    install_git_hooks "$SUBMODULE_PATH"
    echo ""
    
    # Create skip flag example
    create_skip_flag_example "$SUBMODULE_PATH"
    
    # Print setup summary
    print_setup_summary "$SUBMODULE_PATH" "$BRANCH"
}

# Handle script interruption
handle_interrupt() {
    print_color "$YELLOW" ""
    print_color "$YELLOW" "Setup interrupted by user"
    exit 1
}

# Trap interrupt signals
trap handle_interrupt SIGINT SIGTERM

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi