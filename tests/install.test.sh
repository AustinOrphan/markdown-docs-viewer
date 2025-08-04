#!/bin/bash
# Installation script tests for markdown-docs-viewer
# Ensures installation script reliability across platforms

set -euo pipefail

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TEST_DIR")"
TEMP_TEST_DIR=""
FAILED_TESTS=0
TOTAL_TESTS=0

# Color codes for test output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Print colored test output
print_test() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

# Test result tracking
test_passed() {
    local test_name="$1"
    print_test "$GREEN" "✓ PASS: $test_name"
    ((TOTAL_TESTS++))
}

test_failed() {
    local test_name="$1"
    local error_msg="$2"
    print_test "$RED" "✗ FAIL: $test_name"
    print_test "$RED" "  Error: $error_msg"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

test_skipped() {
    local test_name="$1"
    local reason="$2"
    print_test "$YELLOW" "⊝ SKIP: $test_name ($reason)"
    ((TOTAL_TESTS++))
}

# Setup test environment
setup_test_env() {
    TEMP_TEST_DIR="/tmp/mdv-test-$$"
    mkdir -p "$TEMP_TEST_DIR"
    cd "$TEMP_TEST_DIR"
    
    print_test "$BLUE" "Test environment created: $TEMP_TEST_DIR"
}

# Cleanup test environment
cleanup_test_env() {
    if [[ -n "$TEMP_TEST_DIR" ]] && [[ -d "$TEMP_TEST_DIR" ]]; then
        rm -rf "$TEMP_TEST_DIR"
        print_test "$BLUE" "Test environment cleaned up"
    fi
}

# Source utility scripts for testing
source_utilities() {
    local utils_dir="$PROJECT_ROOT/scripts/install"
    
    # Check if utility scripts exist
    if [[ ! -d "$utils_dir" ]]; then
        print_test "$RED" "Error: Installation utilities not found at $utils_dir"
        exit 1
    fi
    
    # Source all utilities
    local utilities=("platform.sh" "dependencies.sh" "build.sh" "files.sh")
    for util in "${utilities[@]}"; do
        local util_path="$utils_dir/$util"
        if [[ -f "$util_path" ]]; then
            # shellcheck source=/dev/null
            source "$util_path"
        else
            print_test "$RED" "Error: Utility script not found: $util_path"
            exit 1
        fi
    done
}

# Test platform detection functions
test_platform_detection() {
    print_test "$BLUE" "Testing platform detection..."
    
    # Test detect_platform
    local platform
    platform="$(detect_platform)"
    if [[ -n "$platform" ]] && [[ "$platform" != "unknown" ]]; then
        test_passed "detect_platform returns valid platform: $platform"
    else
        test_failed "detect_platform" "Returned invalid platform: $platform"
    fi
    
    # Test get_architecture
    local arch
    arch="$(get_architecture)"
    if [[ -n "$arch" ]] && [[ "$arch" != "unknown" ]]; then
        test_passed "get_architecture returns valid architecture: $arch"
    else
        test_failed "get_architecture" "Returned invalid architecture: $arch"
    fi
    
    # Test has_command with known commands
    if has_command "bash"; then
        test_passed "has_command detects existing command (bash)"
    else
        test_failed "has_command" "Failed to detect bash command"
    fi
    
    if has_command "nonexistent-command-xyz"; then
        test_failed "has_command" "Incorrectly detected nonexistent command"
    else
        test_passed "has_command correctly rejects nonexistent command"
    fi
    
    # Test get_download_command
    local download_cmd
    download_cmd="$(get_download_command)"
    if [[ "$download_cmd" != "none" ]]; then
        test_passed "get_download_command found download tool: $download_cmd"
    else
        test_failed "get_download_command" "No download command available"
    fi
    
    # Test platform compatibility validation
    if validate_platform_compatibility; then
        test_passed "validate_platform_compatibility passed"
    else
        test_failed "validate_platform_compatibility" "Platform compatibility check failed"
    fi
}

# Test dependency checking functions
test_dependency_checking() {
    print_test "$BLUE" "Testing dependency checking..."
    
    # Test Node.js version validation
    if validate_node_version "18.0.0"; then
        test_passed "validate_node_version accepts minimum version (18.0.0)"
    else
        test_failed "validate_node_version" "Rejected valid minimum version"
    fi
    
    if validate_node_version "20.17.0"; then
        test_passed "validate_node_version accepts recommended version (20.17.0)"
    else
        test_failed "validate_node_version" "Rejected valid recommended version"
    fi
    
    if validate_node_version "16.0.0"; then
        test_failed "validate_node_version" "Incorrectly accepted old version (16.0.0)"
    else
        test_passed "validate_node_version correctly rejects old version (16.0.0)"
    fi
    
    # Test dependency checking (this may fail if dependencies are missing)
    if check_dependencies >/dev/null 2>&1; then
        test_passed "check_dependencies completed without errors"
    else
        test_skipped "check_dependencies" "dependencies not available in test environment"
    fi
}

# Test file operations
test_file_operations() {
    print_test "$BLUE" "Testing file operations..."
    
    # Create a mock dist directory for testing
    mkdir -p mock-repo/dist
    echo "mock-content" > mock-repo/dist/zero-config.umd.cjs
    echo "mock-content" > mock-repo/dist/zero-config.es.js
    echo "mock-types" > mock-repo/dist/index.d.ts
    
    # Test copy_assets
    if copy_assets "mock-repo" "test-target" true >/dev/null 2>&1; then
        if [[ -f "test-target/viewer/zero-config.umd.cjs" ]]; then
            test_passed "copy_assets creates viewer directory and copies files"
        else
            test_failed "copy_assets" "Files not copied to correct location"
        fi
    else
        test_failed "copy_assets" "Function failed to execute"
    fi
    
    # Test create_example_html
    if create_example_html "test-html" "Test Project" "viewer/zero-config.umd.cjs" >/dev/null 2>&1; then
        if [[ -f "test-html/index.html" ]]; then
            if grep -q "Test Project" "test-html/index.html"; then
                test_passed "create_example_html creates HTML with correct project name"
            else
                test_failed "create_example_html" "Project name not found in HTML"
            fi
        else
            test_failed "create_example_html" "HTML file not created"
        fi
    else
        test_failed "create_example_html" "Function failed to execute"
    fi
    
    # Test create_example_docs
    if create_example_docs "test-docs" "Test Docs" >/dev/null 2>&1; then
        if [[ -f "test-docs/docs/README.md" ]] && [[ -f "test-docs/docs/getting-started.md" ]]; then
            test_passed "create_example_docs creates documentation files"
        else
            test_failed "create_example_docs" "Documentation files not created"
        fi
    else
        test_failed "create_example_docs" "Function failed to execute"
    fi
    
    # Test create_config_template
    if create_config_template "test-config" "Test Config" >/dev/null 2>&1; then
        if [[ -f "test-config/docs-config.json" ]]; then
            if grep -q "Test Config" "test-config/docs-config.json"; then
                test_passed "create_config_template creates config with correct project name"
            else
                test_failed "create_config_template" "Project name not found in config"
            fi
        else
            test_failed "create_config_template" "Config file not created"
        fi
    else
        test_failed "create_config_template" "Function failed to execute"
    fi
    
    # Test validate_installation
    mkdir -p complete-test/{viewer,docs}
    echo "test" > complete-test/index.html
    echo "test" > complete-test/docs/README.md
    echo "mock-viewer-content" > complete-test/viewer/zero-config.umd.cjs
    
    if validate_installation "complete-test" >/dev/null 2>&1; then
        test_passed "validate_installation passes for complete installation"
    else
        test_failed "validate_installation" "Failed to validate complete installation"
    fi
    
    # Test validation failure
    mkdir -p incomplete-test
    if validate_installation "incomplete-test" >/dev/null 2>&1; then
        test_failed "validate_installation" "Incorrectly passed for incomplete installation"
    else
        test_passed "validate_installation correctly fails for incomplete installation"
    fi
}

# Test build utilities (without actually building)
test_build_utilities() {
    print_test "$BLUE" "Testing build utilities..."
    
    # Test format_file_size
    local size_1kb size_1mb
    size_1kb="$(format_file_size 1024)"
    size_1mb="$(format_file_size 1048576)"
    
    if [[ "$size_1kb" == "1KB" ]]; then
        test_passed "format_file_size correctly formats KB"
    else
        test_failed "format_file_size" "Incorrect KB formatting: $size_1kb"
    fi
    
    if [[ "$size_1mb" == "1MB" ]]; then
        test_passed "format_file_size correctly formats MB"
    else
        test_failed "format_file_size" "Incorrect MB formatting: $size_1mb"
    fi
    
    # Test get_temp_dir
    local temp_dir
    temp_dir="$(get_temp_dir)"
    if [[ -n "$temp_dir" ]] && [[ "$temp_dir" != "/" ]]; then
        test_passed "get_temp_dir returns valid temporary directory path"
    else
        test_failed "get_temp_dir" "Invalid temporary directory: $temp_dir"
    fi
    
    # Mock validate_build test (create fake dist directory)
    mkdir -p mock-build/dist
    echo "large-mock-content-$(printf '%*s' 1000 | tr ' ' 'x')" > mock-build/dist/zero-config.umd.cjs
    echo "mock-es-content" > mock-build/dist/zero-config.es.js
    echo "mock-types" > mock-build/dist/index.d.ts
    
    if validate_build "mock-build" >/dev/null 2>&1; then
        test_passed "validate_build passes for mock build output"
    else
        test_failed "validate_build" "Failed to validate mock build output"
    fi
}

# Test error scenarios
test_error_handling() {
    print_test "$BLUE" "Testing error handling..."
    
    # Test copy_assets with missing source
    if copy_assets "nonexistent-source" "test-error" true >/dev/null 2>&1; then
        test_failed "copy_assets error handling" "Should fail with missing source"
    else
        test_passed "copy_assets correctly handles missing source directory"
    fi
    
    # Test validate_build with missing dist
    if validate_build "nonexistent-build" >/dev/null 2>&1; then
        test_failed "validate_build error handling" "Should fail with missing dist directory"
    else
        test_passed "validate_build correctly handles missing dist directory"
    fi
    
    # Test cleanup with invalid path
    if cleanup "" false >/dev/null 2>&1; then
        test_failed "cleanup error handling" "Should fail with empty path"
    else
        test_passed "cleanup correctly rejects empty path"
    fi
}

# Integration test (if possible)
test_integration() {
    print_test "$BLUE" "Testing integration scenarios..."
    
    # This would require actual git repo and build tools
    # For now, we'll just test that the main script can be parsed
    local install_script="$PROJECT_ROOT/install.sh"
    
    if [[ -f "$install_script" ]]; then
        # Test script syntax
        if bash -n "$install_script"; then
            test_passed "install.sh has valid bash syntax"
        else
            test_failed "install.sh syntax" "Script has syntax errors"
        fi
        
        # Test help output
        if bash "$install_script" --help >/dev/null 2>&1; then
            test_passed "install.sh --help executes without errors"
        else
            test_failed "install.sh --help" "Help command failed"
        fi
        
        # Test version output
        if bash "$install_script" --version >/dev/null 2>&1; then
            test_passed "install.sh --version executes without errors"
        else
            test_failed "install.sh --version" "Version command failed"
        fi
    else
        test_failed "integration test setup" "install.sh not found at $install_script"
    fi
}

# Performance test
test_performance() {
    print_test "$BLUE" "Testing performance characteristics..."
    
    # Test file operations performance
    local start_time end_time duration
    start_time=$(date +%s)
    
    # Create multiple test files
    for i in {1..10}; do
        create_example_html "perf-test-$i" "Test $i" "viewer/test.js" >/dev/null 2>&1
    done
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    if [[ $duration -lt 5 ]]; then
        test_passed "file operations complete in reasonable time ($duration seconds)"
    else
        test_failed "performance test" "File operations too slow ($duration seconds)"
    fi
}

# Main test runner
run_all_tests() {
    print_test "$BLUE" "Starting installation script tests..."
    echo ""
    
    # Setup
    setup_test_env
    source_utilities
    
    # Run test suites
    test_platform_detection
    echo ""
    test_dependency_checking
    echo ""
    test_file_operations
    echo ""
    test_build_utilities
    echo ""
    test_error_handling
    echo ""
    test_integration
    echo ""
    test_performance
    
    # Cleanup
    cleanup_test_env
    
    # Print results
    echo ""
    print_test "$BLUE" "Test Results:"
    print_test "$GREEN" "  Passed: $((TOTAL_TESTS - FAILED_TESTS))"
    if [[ $FAILED_TESTS -gt 0 ]]; then
        print_test "$RED" "  Failed: $FAILED_TESTS"
    fi
    print_test "$BLUE" "  Total:  $TOTAL_TESTS"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        print_test "$GREEN" ""
        print_test "$GREEN" "🎉 All tests passed!"
        exit 0
    else
        print_test "$RED" ""
        print_test "$RED" "❌ Some tests failed!"
        exit 1
    fi
}

# Cleanup on exit
trap cleanup_test_env EXIT

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_all_tests
fi