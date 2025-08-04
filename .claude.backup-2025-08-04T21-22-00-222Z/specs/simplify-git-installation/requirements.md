# Requirements Document

## Introduction

The current git-based installation process creates significant friction that contradicts the "nearly drag-and-drop integration" vision. Users must clone repositories, install dependencies, run builds, and manually copy files - a process that takes 5-10 minutes instead of the target 2 minutes. This feature will create streamlined installation mechanisms that align with the zero-config philosophy while maintaining the git-based distribution strategy.

## Alignment with Product Vision

This feature directly supports multiple product.md goals:

- **Core Value Proposition**: "Zero-config by default, infinitely configurable when needed" - Current installation is neither zero-config nor simple
- **Primary Success Indicator**: "Setup time under 2 minutes from zero to working docs" - Current process takes 5-10 minutes
- **Zero-Config Path Vision**: Steps 1-4 should be executable in under 2 minutes total
- **Business Objective**: "Reduce Documentation Friction" - Complex installation is a major friction point

## Requirements

### Requirement 1: One-Command Installation Script

**User Story:** As a developer, I want to install the markdown docs viewer with a single command, so that I can get started without manual build steps.

#### Acceptance Criteria

1. WHEN user runs `curl -fsSL https://raw.githubusercontent.com/AustinOrphan/markdown-docs-viewer/main/install.sh | bash` THEN the system SHALL download, build, and copy all necessary files to the current directory
2. WHEN the install script completes THEN the system SHALL create a ready-to-use HTML file with zero-config setup
3. IF the install script encounters build errors THEN the system SHALL provide clear error messages and cleanup instructions
4. WHEN install script runs in CI environment THEN the system SHALL detect headless mode and skip interactive prompts

### Requirement 2: Pre-built Release Assets

**User Story:** As a developer, I want to download pre-built files without running builds, so that I can avoid Node.js/npm dependencies entirely.

#### Acceptance Criteria

1. WHEN user visits GitHub releases page THEN the system SHALL provide downloadable zip files containing pre-built assets
2. WHEN user downloads release zip THEN the system SHALL include zero-config.umd.cjs, example HTML, and documentation
3. IF user has no Node.js installed THEN the system SHALL still work with pre-built assets only
4. WHEN new version is tagged THEN GitHub Actions SHALL automatically create release with pre-built assets

### Requirement 3: Simplified Git Submodule Integration

**User Story:** As a project maintainer, I want to add the viewer as a submodule with automated build setup, so that I can integrate it into my project workflow.

#### Acceptance Criteria

1. WHEN user adds git submodule THEN the system SHALL include a post-checkout hook that automatically builds the viewer
2. WHEN submodule is updated THEN the system SHALL automatically rebuild without manual intervention
3. IF build fails in submodule THEN the system SHALL provide clear failure notifications and recovery steps
4. WHEN project clones with submodules THEN the system SHALL work correctly with `git submodule update --init --recursive`

### Requirement 4: Package Manager Alternative

**User Story:** As a developer, I want to install via package managers like Homebrew or npm, so that I can use familiar installation methods.

#### Acceptance Criteria

1. WHEN user runs `npm install -g markdown-docs-viewer-cli` THEN the system SHALL provide a global CLI for creating projects
2. WHEN user runs `brew install markdown-docs-viewer` THEN the system SHALL install the CLI tool system-wide
3. IF package manager installation succeeds THEN the system SHALL provide `mdv init` command for project creation
4. WHEN CLI creates new project THEN the system SHALL scaffold complete working example with documentation

### Requirement 5: Documentation and Examples Clarity

**User Story:** As a developer, I want clear installation documentation with working examples, so that I can choose the best installation method for my use case.

#### Acceptance Criteria

1. WHEN user visits README.md THEN the system SHALL present installation options in order of simplicity
2. WHEN user follows any installation method THEN the system SHALL provide working example that runs without modification
3. IF installation method has prerequisites THEN the system SHALL clearly state requirements upfront
4. WHEN user encounters installation issues THEN the system SHALL provide troubleshooting section with common solutions

### Requirement 6: Progressive Complexity Support

**User Story:** As a developer, I want to start simple and add complexity later, so that I can adopt the viewer progressively.

#### Acceptance Criteria

1. WHEN user completes basic installation THEN the system SHALL provide clear next steps for customization
2. WHEN user wants advanced features THEN the system SHALL guide toward appropriate installation methods
3. IF user starts with pre-built assets THEN the system SHALL explain how to switch to development setup later
4. WHEN user upgrades complexity level THEN the system SHALL preserve existing configuration and content

## Non-Functional Requirements

### Performance
- Installation script must complete in under 2 minutes on standard hardware
- Pre-built assets must be under 200KB total download size
- Git submodule integration must not significantly impact clone times

### Security
- Installation script must validate checksums of downloaded files
- Pre-built assets must be signed and verifiable
- No execution of untrusted code during installation process

### Reliability
- Installation methods must work across macOS, Linux, and Windows
- Must handle network interruptions gracefully with resume capability  
- Must detect and handle existing installations without conflicts

### Usability
- Installation success must be clearly indicated with next steps
- Error messages must be actionable with specific solutions
- Documentation must include copy-paste examples that work immediately