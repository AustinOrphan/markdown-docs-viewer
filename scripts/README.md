# Documentation Automation Scripts

This directory contains scripts for automating documentation generation, validation, and maintenance for the markdown-docs-viewer project.

## Available Scripts

### 1. Documentation Generation (`generate-docs.js`)

Generates comprehensive documentation including API docs, validates structure, and checks for issues.

**Usage:**

```bash
npm run docs:generate
```

**Features:**

- Generates TypeScript API documentation using TypeDoc
- Validates documentation structure
- Checks for broken internal links
- Creates a documentation index
- Generates detailed reports

**Output:**

- API documentation in `docs/api/`
- Documentation index at `docs/index.json`
- Generation report at `docs-report.json` and `docs-report.md`

### 2. Documentation Status Dashboard (`docs-status.js`)

Provides a real-time status dashboard for documentation health.

**Usage:**

```bash
# Terminal output with colors
npm run docs:status

# JSON output for CI/CD integration
npm run docs:status:json
```

**Features:**

- Documentation coverage analysis
- File statistics
- Broken link detection
- Uncommitted changes tracking
- Health score calculation (0-100)
- Actionable recommendations

**Health Score Factors:**

- Broken links (−5 points each, max −20)
- Documentation coverage < 80% (up to −50 points, 0% = −50, 50% = −25, 75% = −12.5)
- Uncommitted documentation (−2 points each, max −10)
- Stale documentation > 7 days (−10 points)
- Never generated documentation (−20 points)

### 3. Mermaid Diagram Converter (`convert-mermaid.js`)

Converts Mermaid diagrams in markdown files to PNG images for better compatibility.

**Usage:**

```bash
# Convert all diagrams
npm run docs:mermaid

# Preview without making changes
npm run docs:mermaid:dry-run
```

**Features:**

- Scans all markdown files for Mermaid code blocks
- Converts diagrams to PNG images
- Updates markdown files with image references
- Preserves original Mermaid source in collapsible sections
- Creates backup files before modifications

**Requirements:**

- Mermaid CLI: `npm install -g @mermaid-js/mermaid-cli`

## NPM Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `docs:generate`        | Generate all documentation          |
| `docs:status`          | Show documentation status dashboard |
| `docs:status:json`     | Output status as JSON               |
| `docs:validate`        | Generate docs and show status       |
| `docs:watch`           | Watch for changes and regenerate    |
| `docs:mermaid`         | Convert Mermaid diagrams to images  |
| `docs:mermaid:dry-run` | Preview Mermaid conversions         |

## CI/CD Integration

### GitHub Actions Workflow

The project includes a GitHub Actions workflow (`.github/workflows/docs-validation.yml`) that:

1. Runs on pull requests that modify documentation or source files
2. Generates documentation and validates structure
3. Posts a status comment on the PR
4. Fails if health score is below 70%

### Integration with Other CI Systems

The scripts support CI/CD integration through:

- Exit codes (0 for success, 1 for failure)
- JSON output mode for parsing
- Environment variable support (`CI=true`, `SILENT=true`)
- Detailed report generation

## Configuration

### Documentation Structure Requirements

The validation script expects the following documentation structure:

```
docs/
├── README.md
├── API.md
├── CONFIGURATION.md
├── THEMING.md
└── architecture/
    └── README.md
```

### TypeDoc Configuration

The API documentation generator uses these TypeDoc options:

- Entry point: `src/index.ts`
- Excludes private and internal members
- Uses markdown plugin for output
- Output directory: `docs/api/`

## Troubleshooting

### Common Issues

1. **TypeDoc not found**

   ```bash
   npm install --save-dev typedoc typedoc-plugin-markdown
   ```

2. **Mermaid CLI not found**

   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

3. **Permission denied running scripts**
   ```bash
   chmod +x scripts/*.js
   ```

### Debug Mode

Set environment variables for debugging:

```bash
# Disable console output
SILENT=true npm run docs:generate

# CI mode (outputs JSON summary)
CI=true npm run docs:generate
```

## Best Practices

1. **Regular Generation**: Run `docs:generate` before commits
2. **PR Validation**: Let CI validate documentation on PRs
3. **Monitor Health**: Check `docs:status` regularly
4. **Fix Issues Promptly**: Address broken links and low coverage
5. **Keep Docs Fresh**: Regenerate after significant changes

## Future Enhancements

Potential improvements for the documentation automation:

- [ ] Spell checking integration
- [ ] Grammar validation
- [ ] API usage examples extraction
- [ ] Changelog generation from commits
- [ ] Documentation versioning support
- [ ] Multi-language documentation support
