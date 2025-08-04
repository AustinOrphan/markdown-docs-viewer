# Bug Report

## Bug Summary
The `agents_enabled` configuration field is not being persisted or auto-populated during install/update processes, causing `using-agents` to return false even when agents should be available.

## Bug Details

### Expected Behavior
When running setup/update on an existing installation, the `agents_enabled` field should be:
1. Auto-added to spec-config.json if missing
2. Preserved if already present and set to true
3. Properly detected by the `using-agents` command
4. Allow agent functionality to work correctly

### Actual Behavior  
The setup/update process overwrites the config file and removes the `agents_enabled` field entirely, causing:
- `using-agents` returns `false`
- Agent directories get removed/not created
- Agent functionality becomes unavailable
- Configuration is not preserved between updates

### Steps to Reproduce
1. Have an existing installation of claude-code-spec-workflow
2. Manually add or set `"agents_enabled": true` in spec-config.json
3. Run setup/update process
4. Observe that `agents_enabled` field disappears from config
5. Run `using-agents` command - returns `false`
6. Check agents directory - missing or empty

### Environment
- **Version**: Latest claude-code-spec-workflow
- **Platform**: macOS
- **Configuration**: Existing installation in markdown-docs-viewer project
- **Project Path**: `/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/markdown-docs-viewer`

## Impact Assessment

### Severity
- [x] High - Major functionality broken
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
Users with existing installations who want to enable or maintain agent functionality.

### Affected Features
- Agent configuration persistence
- `using-agents` command reliability
- Agent directory maintenance
- Agent-based workflow functionality

## Additional Context

### Error Messages
```
# Current config state (missing agents_enabled):
{
  "spec_workflow": {
    "version": "1.0.0",
    "auto_create_directories": true,
    "auto_reference_requirements": true,
    "enforce_approval_workflow": true,
    "default_feature_prefix": "feature-",
    "supported_formats": ["markdown", "mermaid"]
  }
}

# Expected config state:
{
  "spec_workflow": {
    "version": "1.0.0",
    "auto_create_directories": true,
    "auto_reference_requirements": true,
    "enforce_approval_workflow": true,
    "default_feature_prefix": "feature-",
    "supported_formats": ["markdown", "mermaid"],
    "agents_enabled": true
  }
}
```

### Screenshots/Media
Commands showing the issue:
- `using-agents` returns `false`
- `ls .claude/agents/` shows 0 agents
- Config missing `agents_enabled` field

### Related Issues
This appears to be a separate issue from the previous agent-enablement bug:
- Previous bug: Missing agent in update process (fixed)
- Current bug: Configuration field not being preserved/auto-populated

## Initial Analysis

### Suspected Root Cause
The setup/update process may be:
1. **Overwriting config entirely**: Not reading existing config before writing new one
2. **Missing auto-population logic**: Not detecting when agents should be enabled
3. **Default configuration issue**: Not including `agents_enabled` in default config template
4. **Update logic gap**: Not preserving existing agent settings during updates

### Affected Components
- Configuration management in setup.ts (`createConfigFile()` method)
- Update process in update.ts
- `using-agents` command logic
- Agent directory creation/maintenance
- Config file read/write operations

## Root Cause Investigation Needed
1. **Config Creation Logic**: How is spec-config.json generated/updated?
2. **Preservation Logic**: Should existing config values be preserved?
3. **Auto-Detection**: Should agents be auto-enabled based on existing agent files?
4. **Default Behavior**: What should the default `agents_enabled` value be?