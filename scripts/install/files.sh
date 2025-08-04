#!/bin/bash
# File management utilities for markdown-docs-viewer installation
# Handles file operations and example generation

set -euo pipefail

# Source platform detection utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./platform.sh
source "$SCRIPT_DIR/platform.sh"

# Default target directory structure
declare -a VIEWER_FILES=("zero-config.umd.cjs" "zero-config.es.js" "index.d.ts")
declare -a EXAMPLE_DIRS=("docs" "viewer")

# Copy build assets to target directory
copy_assets() {
    local source_dir="$1"
    local target_dir="$2"
    local create_subdirs="${3:-true}"
    
    echo "Copying viewer assets..."
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Create viewer subdirectory if requested
    if [[ "$create_subdirs" == "true" ]]; then
        mkdir -p "$target_dir/viewer"
        local viewer_dir="$target_dir/viewer"
    else
        local viewer_dir="$target_dir"
    fi
    
    # Copy dist files
    local dist_dir="$source_dir/dist"
    if [[ ! -d "$dist_dir" ]]; then
        echo "Error: Source dist directory not found: $dist_dir" >&2
        return 1
    fi
    
    local copied_files=()
    for file in "${VIEWER_FILES[@]}"; do
        if [[ -f "$dist_dir/$file" ]]; then
            if cp "$dist_dir/$file" "$viewer_dir/"; then
                copied_files+=("$file")
                echo "  ✓ $file"
            else
                echo "  ✗ Failed to copy $file" >&2
                return 1
            fi
        else
            echo "  ⚠ $file not found in build output" >&2
        fi
    done
    
    if [[ ${#copied_files[@]} -eq 0 ]]; then
        echo "Error: No files were copied" >&2
        return 1
    fi
    
    echo "✓ Copied ${#copied_files[@]} viewer files to $viewer_dir"
    return 0
}

# Create example HTML file using zero-config template
create_example_html() {
    local target_dir="$1"
    local project_name="${2:-My Documentation}"
    local viewer_path="${3:-viewer/zero-config.umd.cjs}"
    
    echo "Creating example HTML file..."
    
    local html_file="$target_dir/index.html"
    
    # Create the HTML content
    cat > "$html_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$project_name</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
            color: #666;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0066cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading documentation...</p>
    </div>

    <script src="$viewer_path"></script>
    <script>
        // Initialize the viewer with zero-config setup
        window.addEventListener('DOMContentLoaded', function() {
            try {
                // The zero-config bundle automatically initializes
                console.log('Markdown Docs Viewer initialized successfully');
            } catch (error) {
                console.error('Failed to initialize viewer:', error);
                document.body.innerHTML = \`
                    <div style="padding: 20px; color: #d73a49; font-family: monospace;">
                        <h2>❌ Initialization Error</h2>
                        <p>Failed to load the documentation viewer.</p>
                        <details>
                            <summary>Error Details</summary>
                            <pre>\${error.message}</pre>
                        </details>
                        <p><strong>Troubleshooting:</strong></p>
                        <ul>
                            <li>Ensure the viewer file exists at: <code>$viewer_path</code></li>
                            <li>Check that you have markdown files in the <code>docs/</code> directory</li>
                            <li>Open browser developer tools for more details</li>
                        </ul>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>
EOF
    
    if [[ -f "$html_file" ]]; then
        echo "✓ Created example HTML file: $html_file"
        return 0
    else
        echo "Error: Failed to create HTML file" >&2
        return 1
    fi
}

# Create example documentation files
create_example_docs() {
    local target_dir="$1"
    local project_name="${2:-My Documentation}"
    
    echo "Creating example documentation..."
    
    local docs_dir="$target_dir/docs"
    mkdir -p "$docs_dir"
    
    # Create README.md
    cat > "$docs_dir/README.md" << EOF
# $project_name

Welcome to your documentation site! This is generated using the Markdown Docs Viewer.

## Getting Started

This documentation is automatically generated from markdown files in the \`docs/\` directory.

### Features

- 🚀 **Zero Configuration** - Works out of the box
- 🎨 **Beautiful Themes** - Multiple built-in themes with dark mode
- 🔍 **Powerful Search** - Find content instantly
- 📱 **Mobile Friendly** - Responsive design for all devices
- ⚡ **Fast Loading** - Optimized for performance

### Quick Start

1. Add your markdown files to the \`docs/\` directory
2. Open \`index.html\` in your browser
3. Your documentation is ready!

## Writing Documentation

Create new markdown files in the \`docs/\` directory. They will be automatically discovered and included in the navigation.

### Example Structure

\`\`\`
docs/
├── README.md (this file - serves as homepage)
├── getting-started.md
├── api/
│   ├── overview.md
│   └── reference.md
└── guides/
    ├── installation.md
    └── configuration.md
\`\`\`

## Customization

To customize the viewer, create a \`docs-config.json\` file:

\`\`\`json
{
  "title": "$project_name",
  "theme": "default-light",
  "search": {
    "enabled": true
  },
  "navigation": {
    "enabled": true
  }
}
\`\`\`

For more advanced configuration options, visit the [official documentation](https://github.com/AustinOrphan/markdown-docs-viewer).
EOF
    
    # Create getting-started.md
    cat > "$docs_dir/getting-started.md" << EOF
# Getting Started

This guide will help you get up and running with your documentation site.

## File Organization

Your documentation files should be organized in the \`docs/\` directory:

- \`README.md\` - Homepage content (this appears first)
- Other \`.md\` files - Additional pages
- Subdirectories - Organize content into sections

## Markdown Features

The viewer supports standard Markdown syntax plus:

### Code Blocks

\`\`\`javascript
function example() {
    console.log('Code highlighting works!');
}
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Themes | ✅ |
| Search | ✅ |
| Mobile | ✅ |

### Links

- [Internal links](./README.md) to other documentation pages
- [External links](https://github.com/AustinOrphan/markdown-docs-viewer) to other sites

## Next Steps

1. Replace this content with your own documentation
2. Add more markdown files as needed
3. Customize the theme and configuration
4. Share your documentation with others

Happy documenting! 📚
EOF
    
    echo "✓ Created example documentation files in $docs_dir"
    return 0
}

# Create configuration file template
create_config_template() {
    local target_dir="$1"
    local project_name="${2:-My Documentation}"
    
    echo "Creating configuration template..."
    
    local config_file="$target_dir/docs-config.json"
    
    cat > "$config_file" << EOF
{
  "title": "$project_name",
  "description": "Documentation generated with Markdown Docs Viewer",
  "theme": "default-light",
  "source": {
    "type": "local",
    "basePath": "docs"
  },
  "search": {
    "enabled": true,
    "placeholder": "Search documentation..."
  },
  "navigation": {
    "enabled": true,
    "collapsed": false
  },
  "toc": {
    "enabled": true,
    "maxDepth": 3
  },
  "mobile": {
    "enabled": true,
    "breakpoint": 768
  }
}
EOF
    
    if [[ -f "$config_file" ]]; then
        echo "✓ Created configuration template: $config_file"
        return 0
    else
        echo "Error: Failed to create configuration file" >&2
        return 1
    fi
}

# Create complete project structure
create_project_structure() {
    local target_dir="$1"
    local project_name="${2:-My Documentation}"
    local source_dir="$3"
    
    echo "Creating complete project structure in $target_dir..."
    
    # Create target directory
    mkdir -p "$target_dir"
    
    # Copy viewer assets
    if ! copy_assets "$source_dir" "$target_dir" true; then
        echo "Error: Failed to copy viewer assets" >&2
        return 1
    fi
    
    # Create example HTML
    if ! create_example_html "$target_dir" "$project_name" "viewer/zero-config.umd.cjs"; then
        echo "Error: Failed to create example HTML" >&2
        return 1
    fi
    
    # Create example documentation
    if ! create_example_docs "$target_dir" "$project_name"; then
        echo "Error: Failed to create example documentation" >&2
        return 1
    fi
    
    # Create configuration template
    if ! create_config_template "$target_dir" "$project_name"; then
        echo "Error: Failed to create configuration template" >&2
        return 1
    fi
    
    echo "✓ Project structure created successfully"
    return 0
}

# Clean up temporary files and directories
cleanup() {
    local temp_dir="$1"
    local preserve_logs="${2:-false}"
    
    if [[ -z "$temp_dir" ]] || [[ "$temp_dir" == "/" ]]; then
        echo "Error: Invalid temp directory for cleanup" >&2
        return 1
    fi
    
    if [[ -d "$temp_dir" ]]; then
        echo "Cleaning up temporary directory..."
        
        # Preserve logs if requested
        if [[ "$preserve_logs" == "true" ]] && [[ -f "$temp_dir/install.log" ]]; then
            local log_backup="/tmp/mdv-install-$(date +%Y%m%d-%H%M%S).log"
            cp "$temp_dir/install.log" "$log_backup"
            echo "Installation log preserved at: $log_backup"
        fi
        
        # Remove temporary directory
        rm -rf "$temp_dir"
        echo "✓ Temporary directory cleaned up"
    fi
}

# Validate installation success
validate_installation() {
    local target_dir="$1"
    
    echo "Validating installation..."
    
    local required_files=("index.html" "docs/README.md" "viewer/zero-config.umd.cjs")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$target_dir/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo "Error: Installation validation failed. Missing files:" >&2
        printf "  - %s\n" "${missing_files[@]}" >&2
        return 1
    fi
    
    # Check file sizes
    local html_size viewer_size
    html_size=$(stat -f%z "$target_dir/index.html" 2>/dev/null || stat -c%s "$target_dir/index.html" 2>/dev/null || echo "0")
    viewer_size=$(stat -f%z "$target_dir/viewer/zero-config.umd.cjs" 2>/dev/null || stat -c%s "$target_dir/viewer/zero-config.umd.cjs" 2>/dev/null || echo "0")
    
    if [[ "$html_size" -lt 500 ]]; then
        echo "Error: HTML file appears to be too small" >&2
        return 1
    fi
    
    if [[ "$viewer_size" -lt 1000 ]]; then
        echo "Error: Viewer file appears to be too small" >&2
        return 1
    fi
    
    echo "✓ Installation validation passed"
    echo "  Files created: ${#required_files[@]}"
    echo "  HTML size: $(format_file_size "$html_size")"
    echo "  Viewer size: $(format_file_size "$viewer_size")"
    
    return 0
}

# Format file size for display (helper function)
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

# Print installation success message
print_success_message() {
    local target_dir="$1"
    local project_name="${2:-My Documentation}"
    
    echo ""
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "📁 Project created in: $target_dir"
    echo "📖 Project name: $project_name"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. cd \"$target_dir\""
    echo "   2. open index.html"
    echo "   3. Edit docs/README.md to get started"
    echo ""
    echo "💡 Tips:"
    echo "   - Add more .md files to the docs/ directory"
    echo "   - Customize docs-config.json for advanced settings"
    echo "   - Use the theme switcher in the top-right corner"
    echo ""
    echo "📚 Documentation: https://github.com/AustinOrphan/markdown-docs-viewer"
    echo ""
}

# Export functions for use in other scripts
export -f copy_assets
export -f create_example_html
export -f create_example_docs
export -f create_config_template
export -f create_project_structure
export -f cleanup
export -f validate_installation
export -f format_file_size
export -f print_success_message