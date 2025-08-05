/**
 * Init Command - Create new documentation project
 * Implements "mdv init" project scaffolding functionality
 */

import { promises as fs } from 'fs';
import { join, resolve, basename } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync } from 'fs';

// Types
interface InitOptions {
  dir?: string;
  template?: string;
  theme?: string;
  git?: boolean;
  install?: boolean;
  yes?: boolean;
  typescript?: boolean;
}

interface ProjectTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  dependencies?: string[];
}

// Template definitions
const TEMPLATES: Record<string, ProjectTemplate> = {
  default: {
    name: 'Default',
    description: 'Standard documentation site with examples',
    files: {
      'index.html': 'default-index.html',
      'docs/README.md': 'default-readme.md',
      'docs/getting-started.md': 'getting-started.md',
      'docs-config.json': 'default-config.json',
    },
  },
  minimal: {
    name: 'Minimal',
    description: 'Minimal setup with just the basics',
    files: {
      'index.html': 'minimal-index.html',
      'docs/README.md': 'minimal-readme.md',
      'docs-config.json': 'minimal-config.json',
    },
  },
  blog: {
    name: 'Blog',
    description: 'Blog-style documentation with date-based organization',
    files: {
      'index.html': 'blog-index.html',
      'docs/README.md': 'blog-readme.md',
      'docs/posts/2024-01-01-welcome.md': 'blog-welcome.md',
      'docs-config.json': 'blog-config.json',
    },
  },
  api: {
    name: 'API Documentation',
    description: 'API documentation with endpoint references',
    files: {
      'index.html': 'api-index.html',
      'docs/README.md': 'api-readme.md',
      'docs/api/overview.md': 'api-overview.md',
      'docs/api/authentication.md': 'api-auth.md',
      'docs/api/endpoints.md': 'api-endpoints.md',
      'docs-config.json': 'api-config.json',
    },
  },
};

// GitHub API types
interface GitHubRelease {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

/**
 * Download latest viewer from GitHub releases
 */
async function downloadLatestViewer(targetDir: string): Promise<void> {
  const spinner = ora('Downloading latest viewer...').start();

  try {
    // Import node-fetch dynamically for ESM compatibility
    const fetch = (await import('node-fetch')).default;

    // Get latest release info
    const response = await fetch(
      'https://api.github.com/repos/AustinOrphan/markdown-docs-viewer/releases/latest'
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release: GitHubRelease = (await response.json()) as GitHubRelease;

    // Find the UMD asset
    const umdAsset = release.assets.find(asset => asset.name === 'zero-config.umd.cjs');
    if (!umdAsset) {
      throw new Error('UMD asset not found in latest release');
    }

    // Create viewer directory
    const viewerDir = join(targetDir, 'viewer');
    await fs.mkdir(viewerDir, { recursive: true });

    // Download the UMD file
    const assetResponse = await fetch(umdAsset.browser_download_url);
    if (!assetResponse.ok) {
      throw new Error(`Failed to download asset: ${assetResponse.status}`);
    }

    const content = await assetResponse.text();
    await fs.writeFile(join(viewerDir, 'zero-config.umd.cjs'), content);

    spinner.succeed(`Downloaded viewer v${release.tag_name}`);
  } catch {
    spinner.fail('Failed to download viewer');

    // Fallback: create a placeholder that shows an error
    const viewerDir = join(targetDir, 'viewer');
    await fs.mkdir(viewerDir, { recursive: true });

    const fallbackContent = `
// Markdown Docs Viewer - Download Failed
// Please download manually from: https://github.com/AustinOrphan/markdown-docs-viewer/releases/latest
console.error('Viewer download failed during project initialization');
console.error('Please download zero-config.umd.cjs manually from GitHub releases');
`;

    await fs.writeFile(join(viewerDir, 'zero-config.umd.cjs'), fallbackContent);

    console.log(chalk.yellow('⚠️  Viewer download failed. You can download it manually later.'));
    console.log(
      chalk.gray('   Visit: https://github.com/AustinOrphan/markdown-docs-viewer/releases/latest')
    );
  }
}

/**
 * Create template file content
 */
function getTemplateContent(templateName: string, fileName: string, projectName: string): string {
  const templates: Record<string, Record<string, string>> = {
    'default-index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .loading { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; color: #666; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0066cc; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading documentation...</p>
    </div>
    <script src="viewer/zero-config.umd.cjs"></script>
</body>
</html>`,

    'minimal-index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
</head>
<body>
    <script src="viewer/zero-config.umd.cjs"></script>
</body>
</html>`,

    'default-readme.md': `# ${projectName}

Welcome to your documentation site! This project uses the Markdown Docs Viewer to create beautiful, searchable documentation from your markdown files.

## Getting Started

This documentation is automatically generated from markdown files in the \`docs/\` directory.

### Features

- 🚀 **Zero Configuration** - Works out of the box
- 🎨 **Beautiful Themes** - Multiple built-in themes with dark mode
- 🔍 **Powerful Search** - Find content instantly
- 📱 **Mobile Friendly** - Responsive design for all devices
- ⚡ **Fast Loading** - Optimized for performance

### Writing Documentation

Create new markdown files in the \`docs/\` directory. They will be automatically discovered and included in the navigation.

#### Example Structure

\`\`\`
docs/
├── README.md          # This file - serves as homepage
├── getting-started.md
├── guides/
│   ├── installation.md
│   └── configuration.md
└── api/
    └── reference.md
\`\`\`

## Customization

To customize the viewer, edit the \`docs-config.json\` file in the project root.

For more advanced configuration options, visit the [official documentation](https://github.com/AustinOrphan/markdown-docs-viewer).

## Development

1. Open \`index.html\` in your browser
2. Edit markdown files in the \`docs/\` directory
3. Refresh to see changes

That's it! Happy documenting! 📚`,

    'getting-started.md': `# Getting Started

This guide will help you get up and running with your documentation site.

## Project Structure

Your documentation project is organized as follows:

- \`index.html\` - Main entry point for your documentation
- \`docs/\` - Directory containing your markdown files
- \`viewer/\` - Contains the documentation viewer files
- \`docs-config.json\` - Configuration file for customization

## Adding Content

### Creating Pages

Add new markdown files to the \`docs/\` directory:

\`\`\`bash
# Create a new guide
echo "# My New Guide" > docs/my-guide.md
\`\`\`

### Organizing Content

Use subdirectories to organize your content:

\`\`\`
docs/
├── README.md
├── guides/
│   ├── beginner.md
│   └── advanced.md
└── reference/
    └── api.md
\`\`\`

## Customization

### Themes

Change the theme in \`docs-config.json\`:

\`\`\`json
{
  "theme": "default-dark"
}
\`\`\`

Available themes: \`default-light\`, \`default-dark\`, \`minimal\`, \`modern\`

### Search

Configure search behavior:

\`\`\`json
{
  "search": {
    "enabled": true,
    "placeholder": "Search documentation..."
  }
}
\`\`\`

## Next Steps

1. Replace this content with your own documentation
2. Customize the theme and configuration
3. Share your documentation with others

Happy documenting! 🎉`,

    'default-config.json': `{
  "title": "${projectName}",
  "description": "Documentation powered by Markdown Docs Viewer",
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
}`,

    'minimal-config.json': `{
  "title": "${projectName}",
  "theme": "minimal",
  "source": {
    "type": "local",
    "basePath": "docs"
  }
}`,
  };

  return templates[fileName] || `# ${fileName}\n\nTemplate content for ${projectName}`;
}

/**
 * Prompt user for project configuration
 */
async function promptForConfig(
  projectName: string,
  options: InitOptions
): Promise<{
  name: string;
  template: string;
  theme: string;
  directory: string;
  initGit: boolean;
  runInstall: boolean;
}> {
  if (options.yes) {
    // Use defaults when --yes flag is provided
    return {
      name: projectName,
      template: options.template || 'default',
      theme: options.theme || 'default-light',
      directory: options.dir || process.cwd(),
      initGit: options.git || false,
      runInstall: options.install || false,
    };
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName,
      validate: (input: string) => input.trim().length > 0 || 'Project name is required',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: Object.entries(TEMPLATES).map(([key, template]) => ({
        name: `${template.name} - ${template.description}`,
        value: key,
      })),
      default: options.template || 'default',
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Choose initial theme:',
      choices: [
        { name: 'Default Light', value: 'default-light' },
        { name: 'Default Dark', value: 'default-dark' },
        { name: 'Minimal', value: 'minimal' },
        { name: 'Modern', value: 'modern' },
      ],
      default: options.theme || 'default-light',
    },
    {
      type: 'input',
      name: 'directory',
      message: 'Target directory:',
      default: options.dir || process.cwd(),
      validate: (input: string) => input.trim().length > 0 || 'Directory is required',
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: options.git || false,
    },
    {
      type: 'confirm',
      name: 'runInstall',
      message: 'Run npm install after setup?',
      default: options.install || false,
    },
  ]);

  return answers;
}

/**
 * Create project files from template
 */
async function createProjectFiles(
  targetDir: string,
  projectName: string,
  templateName: string,
  theme: string
): Promise<void> {
  const spinner = ora('Creating project files...').start();

  try {
    const template = TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    // Create files from template
    for (const [filePath, templateFile] of Object.entries(template.files)) {
      const fullPath = join(targetDir, filePath);
      const dir = join(fullPath, '..');

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Get template content
      let content = getTemplateContent(templateFile, templateFile, projectName);

      // Apply theme to config files
      if (filePath.endsWith('config.json')) {
        const config = JSON.parse(content);
        config.theme = theme;
        content = JSON.stringify(config, null, 2);
      }

      // Write file
      await fs.writeFile(fullPath, content);
    }

    spinner.succeed('Project files created');
  } catch (error) {
    spinner.fail('Failed to create project files');
    throw error;
  }
}

/**
 * Initialize git repository
 */
async function initGitRepo(targetDir: string): Promise<void> {
  const spinner = ora('Initializing git repository...').start();

  try {
    const { execSync } = await import('child_process');

    // Initialize git repo
    execSync('git init', { cwd: targetDir, stdio: 'pipe' });

    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
`;

    await fs.writeFile(join(targetDir, '.gitignore'), gitignore);

    // Add and commit initial files
    execSync('git add .', { cwd: targetDir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit: documentation project setup"', {
      cwd: targetDir,
      stdio: 'pipe',
    });

    spinner.succeed('Git repository initialized');
  } catch {
    spinner.fail('Failed to initialize git repository');
    console.log(
      chalk.yellow('⚠️  Git initialization failed. You can initialize it manually later.')
    );
  }
}

/**
 * Main init command implementation
 */
export async function initCommand(name?: string, options: InitOptions = {}): Promise<void> {
  try {
    // Determine project name
    const projectName = name || basename(process.cwd()) || 'my-docs';

    console.log(chalk.blue(`\n🚀 Creating documentation project: ${chalk.bold(projectName)}\n`));

    // Get configuration from user
    const config = await promptForConfig(projectName, options);

    // Resolve target directory
    const targetDir = resolve(config.directory);
    const projectDir = name ? join(targetDir, config.name) : targetDir;

    // Check if directory exists and is not empty
    if (existsSync(projectDir)) {
      const files = await fs.readdir(projectDir);
      if (files.length > 0) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'Directory is not empty. Continue anyway?',
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('Aborted.'));
          return;
        }
      }
    }

    // Create project structure
    await createProjectFiles(projectDir, config.name, config.template, config.theme);

    // Download latest viewer
    await downloadLatestViewer(projectDir);

    // Initialize git if requested
    if (config.initGit) {
      await initGitRepo(projectDir);
    }

    // Success message
    console.log(chalk.green('\n🎉 Project created successfully!\n'));

    console.log(chalk.bold('Next steps:'));
    if (projectDir !== process.cwd()) {
      console.log(chalk.cyan(`  cd ${config.name}`));
    }
    console.log(chalk.cyan('  open index.html'));
    console.log(chalk.cyan('  # Edit docs/README.md to get started'));

    if (config.runInstall) {
      console.log(chalk.cyan('  npm install  # Run if you need additional dependencies'));
    }

    console.log();
    console.log(
      chalk.gray('📚 Documentation: https://github.com/AustinOrphan/markdown-docs-viewer')
    );
    console.log(
      chalk.gray('🐛 Issues: https://github.com/AustinOrphan/markdown-docs-viewer/issues')
    );
  } catch (error) {
    console.error(chalk.red('\n❌ Project creation failed:'));
    console.error(error instanceof Error ? error.message : error);

    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
