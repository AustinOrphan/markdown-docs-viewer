# Implementation Plan

## Task Overview
This implementation creates four streamlined installation pathways that reduce setup time from 5-10 minutes to under 2 minutes. Tasks are organized by installation method, building on existing infrastructure while adding new automation and pre-built distribution mechanisms.

## Steering Document Compliance
- **structure.md**: Tasks follow existing `scripts/` organization, GitHub workflows structure, and documentation patterns
- **tech.md**: Tasks leverage existing Vite builds, npm scripts, and GitHub Actions infrastructure without disrupting current distribution strategy

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Exact file paths to create/modify specified
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Installation Script Infrastructure

- [x] 1. Create platform detection utilities in scripts/install/platform.sh
  - File: scripts/install/platform.sh
  - Implement detect_platform() function for macOS/Linux/Windows detection
  - Add get_architecture() function for x64/arm64 architecture detection
  - Add has_command() utility for checking if commands exist (git, node, npm, curl)
  - Purpose: Provide cross-platform installation support foundation
  - _Leverage: scripts/run-docs-status.sh_
  - _Requirements: 1.1, 1.4_

- [x] 2. Create dependency management utilities in scripts/install/dependencies.sh
  - File: scripts/install/dependencies.sh
  - Implement check_dependencies() function to verify git, Node.js availability
  - Add install_nodejs() function with platform-specific Node.js installation
  - Add validate_node_version() to ensure Node.js 18+ compatibility
  - Purpose: Handle dependency installation and validation automatically
  - _Leverage: package.json engines field, existing build requirements_
  - _Requirements: 1.1, 1.3_

- [x] 3. Create download and build utilities in scripts/install/build.sh
  - File: scripts/install/build.sh
  - Implement download_repository() function with shallow clone optimization
  - Add build_viewer() function that runs npm install && npm run build
  - Add validate_build() function to check dist/ files exist and are valid
  - Purpose: Handle repository download and build process with error recovery
  - _Leverage: existing build scripts, vite.zero-config.ts_
  - _Requirements: 1.1, 1.2_

- [x] 4. Create file management utilities in scripts/install/files.sh
  - File: scripts/install/files.sh
  - Implement copy_assets() function to copy dist/ files to target directory
  - Add create_example_html() function using zero-config template
  - Add cleanup() function for temporary directory removal
  - Purpose: Handle file operations and example generation
  - _Leverage: scripts/create-distribution.js patterns_
  - _Requirements: 1.2_

- [x] 5. Create main installation script in install.sh
  - File: install.sh
  - Source all utility scripts from scripts/install/
  - Implement main() function with step-by-step installation process
  - Add command-line argument parsing (--help, --dir=, --skip-deps)
  - Add progress indication and error handling with cleanup on failure
  - Purpose: Provide the main one-command installation entry point
  - _Leverage: scripts/install/*.sh utilities_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Create installation script tests in tests/install.test.sh
  - File: tests/install.test.sh
  - Write unit tests for each utility function in scripts/install/
  - Add integration test that simulates full installation in temporary directory
  - Add error scenario tests (missing dependencies, network failures, permission errors)
  - Purpose: Ensure installation script reliability across platforms
  - _Leverage: existing test patterns_
  - _Requirements: 1.1, 1.2, 1.3_

### Phase 2: GitHub Release Assets Automation

- [x] 7. Create release asset build script in scripts/build-release-assets.js
  - File: scripts/build-release-assets.js
  - Extend scripts/create-distribution.js to create release-ready ZIP files
  - Add checksum generation for all assets using crypto module
  - Add build manifest generation with version info and asset metadata
  - Purpose: Generate pre-built assets for GitHub releases
  - _Leverage: scripts/create-distribution.js, package.json version_
  - _Requirements: 2.1, 2.2_

- [x] 8. Create GitHub Actions release assets workflow in .github/workflows/release-assets.yml
  - File: .github/workflows/release-assets.yml
  - Implement workflow triggered on release creation
  - Add build step that runs scripts/build-release-assets.js
  - Add asset upload step using softprops/action-gh-release
  - Purpose: Automate pre-built asset creation and distribution
  - _Leverage: existing .github/workflows/release.yml_
  - _Requirements: 2.4_

- [x] 9. Update package.json scripts for release asset generation
  - File: package.json
  - Add "dist:release" script that calls scripts/build-release-assets.js
  - Update "prepublishOnly" script to include release asset generation
  - Add validation that release assets are created successfully
  - Purpose: Integrate release asset generation into build process
  - _Leverage: existing npm scripts structure_
  - _Requirements: 2.1_

- [x] 10. Create release asset validation tests in tests/release-assets.test.js
  - File: tests/release-assets.test.js
  - Write tests for scripts/build-release-assets.js functionality
  - Add tests for ZIP file creation and checksum validation
  - Add tests for build manifest generation and format validation
  - Purpose: Ensure release assets are generated correctly
  - _Leverage: existing test utilities_
  - _Requirements: 2.1, 2.2_

### Phase 3: Git Submodule Automation

- [x] 11. Create git hooks template in templates/git-hooks/post-checkout
  - File: templates/git-hooks/post-checkout
  - Implement post-checkout hook that detects submodule changes
  - Add automatic npm install && npm run build execution
  - Add error handling with clear failure messages and recovery instructions
  - Purpose: Enable automatic builds when submodule is updated
  - _Leverage: existing build scripts, error handling patterns_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Create submodule setup script in scripts/setup-submodule.sh
  - File: scripts/setup-submodule.sh
  - Implement script to copy git hooks to .git/hooks/ directory
  - Add .gitmodules configuration validation
  - Add instructions for proper submodule integration
  - Purpose: Simplify submodule setup with automated build hooks
  - _Leverage: existing shell script patterns_
  - _Requirements: 3.1, 3.4_

- [x] 13. Create submodule documentation in docs/SUBMODULE_INTEGRATION.md
  - File: docs/SUBMODULE_INTEGRATION.md
  - Document step-by-step submodule addition process
  - Add troubleshooting section for common submodule issues
  - Add examples for different project structures and workflows
  - Purpose: Provide clear guidance for submodule integration
  - _Leverage: existing documentation structure and examples_
  - _Requirements: 3.1, 3.3_

- [x] 14. Create submodule integration tests in tests/submodule.test.sh
  - File: tests/submodule.test.sh
  - Write tests for git hook functionality
  - Add tests for submodule setup script
  - Add integration tests that simulate real submodule workflows
  - Purpose: Ensure submodule automation works correctly
  - _Leverage: existing test patterns_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Phase 4: CLI Tool Development

- [x] 15. Create CLI package structure in cli/package.json
  - File: cli/package.json
  - Set up separate npm package for CLI tool
  - Configure bin entry for "mdv" command
  - Add dependencies for commander.js, fs-extra, chalk for CLI functionality
  - Purpose: Establish CLI tool as installable npm package
  - _Leverage: existing package.json structure and dependencies_
  - _Requirements: 4.1, 4.3_

- [x] 16. Create CLI command parser in cli/src/cli.ts
  - File: cli/src/cli.ts
  - Implement main CLI entry point using commander.js
  - Add command definitions for init, upgrade, help
  - Add global options and version display
  - Purpose: Provide CLI command structure and argument parsing
  - _Leverage: commander.js patterns_
  - _Requirements: 4.1, 4.3_

- [ ] 17. Create project initialization command in cli/src/commands/init.ts
  - File: cli/src/commands/init.ts
  - Implement initCommand() function that creates project directory
  - Add template copying for index.html, docs/, docs-config.json
  - Add latest viewer download from GitHub releases
  - Purpose: Enable "mdv init" project scaffolding functionality
  - _Leverage: existing templates, zero-config patterns_
  - _Requirements: 4.4_

- [ ] 18. Create project templates in cli/templates/
  - Files: cli/templates/index.html, cli/templates/docs/README.md, cli/templates/docs-config.json
  - Create example.html template with zero-config setup
  - Create starter README.md with documentation examples
  - Create docs-config.json template with common configuration options
  - Purpose: Provide starter templates for new projects
  - _Leverage: existing examples, zero-config setup_
  - _Requirements: 4.4_

- [ ] 19. Create CLI tool tests in cli/tests/cli.test.ts
  - File: cli/tests/cli.test.ts
  - Write tests for CLI command parsing and execution
  - Add tests for project initialization in temporary directories
  - Add tests for template copying and file generation
  - Purpose: Ensure CLI tool functionality works correctly
  - _Leverage: existing test patterns_
  - _Requirements: 4.1, 4.3, 4.4_

### Phase 5: Documentation Enhancement

- [ ] 20. Update main README.md with installation decision tree
  - File: README.md
  - Restructure installation section with four clear options
  - Add decision flowchart for choosing installation method
  - Update quick start section with simplest-first ordering
  - Purpose: Guide users to appropriate installation method
  - _Leverage: existing README structure and examples_
  - _Requirements: 5.1, 5.2_

- [ ] 21. Create installation troubleshooting guide in docs/INSTALLATION_TROUBLESHOOTING.md
  - File: docs/INSTALLATION_TROUBLESHOOTING.md
  - Document common installation issues and solutions
  - Add platform-specific troubleshooting sections
  - Add recovery instructions for failed installations
  - Purpose: Provide actionable solutions for installation problems
  - _Leverage: existing documentation patterns_
  - _Requirements: 5.4_

- [ ] 22. Update quick-start guide in docs/quick-start.md
  - File: docs/quick-start.md
  - Restructure with new installation methods as primary options
  - Update examples to use new installation workflows
  - Add progressive complexity guidance
  - Purpose: Reflect new simplified installation options
  - _Leverage: existing quick-start structure_
  - _Requirements: 5.1, 5.3_

- [ ] 23. Create installation examples in examples/installation/
  - Files: examples/installation/script.md, examples/installation/release.md, examples/installation/submodule.md, examples/installation/cli.md
  - Create working examples for each installation method
  - Add copy-paste commands that work without modification
  - Add expected output examples and success indicators
  - Purpose: Provide working examples users can follow exactly
  - _Leverage: existing examples structure_
  - _Requirements: 5.2, 6.1_

### Phase 6: Integration and Testing

- [ ] 24. Create end-to-end installation tests in tests/e2e/installation.test.js
  - File: tests/e2e/installation.test.js
  - Write full workflow tests for each installation method
  - Add performance tests to verify sub-2-minute completion times
  - Add cross-platform testing for macOS, Linux, Windows
  - Purpose: Validate complete installation workflows work as designed
  - _Leverage: existing test infrastructure_
  - _Requirements: All requirements validation_

- [ ] 25. Update CI workflows to test installation methods in .github/workflows/test-installation.yml
  - File: .github/workflows/test-installation.yml
  - Add workflow that tests all installation methods in clean environments
  - Add matrix testing across different operating systems
  - Add performance benchmarking for installation times
  - Purpose: Ensure installation methods work in CI/CD environments
  - _Leverage: existing CI workflows_
  - _Requirements: 1.4, All requirements_

- [ ] 26. Create installation analytics in scripts/analytics/installation-tracking.js
  - File: scripts/analytics/installation-tracking.js
  - Add optional usage analytics for installation success/failure rates
  - Add performance metrics collection for installation times
  - Add error categorization for common failure modes
  - Purpose: Monitor installation success and identify improvement opportunities
  - _Leverage: existing error handling patterns_
  - _Requirements: Performance and reliability requirements_