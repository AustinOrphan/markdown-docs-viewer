/**
 * Doctor Command - Diagnose and fix project issues
 * Implements "mdv doctor" diagnostic functionality
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';

// Types
interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
}

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
  fixable?: boolean;
}

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  architecture: string;
  workingDirectory: string;
}

/**
 * Get system information
 */
function getSystemInfo(): SystemInfo {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    workingDirectory: process.cwd(),
  };
}

/**
 * Check if we're in a valid project directory
 */
async function checkProjectStructure(): Promise<DiagnosticResult> {
  const projectDir = process.cwd();
  const indexPath = join(projectDir, 'index.html');

  if (!existsSync(indexPath)) {
    return {
      name: 'Project Structure',
      status: 'fail',
      message: 'No index.html found in current directory',
      details: 'This command should be run from your project root directory',
      fixable: false,
    };
  }

  return {
    name: 'Project Structure',
    status: 'pass',
    message: 'Valid project directory detected',
  };
}

/**
 * Check viewer installation
 */
async function checkViewer(): Promise<DiagnosticResult> {
  const viewerPath = join(process.cwd(), 'viewer', 'zero-config.umd.cjs');

  if (!existsSync(viewerPath)) {
    return {
      name: 'Viewer Installation',
      status: 'fail',
      message: 'Viewer not found',
      details: 'The viewer file is missing from the viewer/ directory',
      fixable: true,
    };
  }

  try {
    // Check if viewer file is valid
    const content = await fs.readFile(viewerPath, 'utf-8');

    if (content.length < 1000) {
      return {
        name: 'Viewer Installation',
        status: 'fail',
        message: 'Viewer file appears to be corrupted or incomplete',
        details: `File size is only ${content.length} bytes`,
        fixable: true,
      };
    }

    // Try to extract version
    const versionMatch = content.match(/version['"]?\\s*:\\s*['"]([^'"]+)['"]/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    return {
      name: 'Viewer Installation',
      status: 'pass',
      message: `Viewer installed (v${version})`,
    };
  } catch (error) {
    return {
      name: 'Viewer Installation',
      status: 'fail',
      message: 'Cannot read viewer file',
      details: error instanceof Error ? error.message : String(error),
      fixable: true,
    };
  }
}

/**
 * Check docs directory and content
 */
async function checkDocs(): Promise<DiagnosticResult> {
  const docsDir = join(process.cwd(), 'docs');

  if (!existsSync(docsDir)) {
    return {
      name: 'Documentation Content',
      status: 'warn',
      message: 'No docs/ directory found',
      details: 'Create a docs/ directory and add markdown files',
      fixable: true,
    };
  }

  try {
    // Count markdown files
    let markdownCount = 0;

    async function countFiles(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await countFiles(fullPath);
        } else if (entry.name.endsWith('.md')) {
          markdownCount++;
        }
      }
    }

    await countFiles(docsDir);

    if (markdownCount === 0) {
      return {
        name: 'Documentation Content',
        status: 'warn',
        message: 'No markdown files found in docs/',
        details: 'Add some .md files to create documentation content',
        fixable: true,
      };
    }

    return {
      name: 'Documentation Content',
      status: 'pass',
      message: `Found ${markdownCount} markdown files`,
    };
  } catch (error) {
    return {
      name: 'Documentation Content',
      status: 'fail',
      message: 'Cannot read docs directory',
      details: error instanceof Error ? error.message : String(error),
      fixable: false,
    };
  }
}

/**
 * Check configuration file
 */
async function checkConfig(): Promise<DiagnosticResult> {
  const configPath = join(process.cwd(), 'docs-config.json');

  if (!existsSync(configPath)) {
    return {
      name: 'Configuration',
      status: 'warn',
      message: 'No configuration file found',
      details: 'Using default settings. Create docs-config.json to customize',
      fixable: true,
    };
  }

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Basic validation
    const issues: string[] = [];

    if (!config.title) {
      issues.push('Missing title');
    }

    if (!config.theme) {
      issues.push('Missing theme');
    }

    if (config.source && config.source.type === 'local' && config.source.basePath) {
      const sourcePath = join(process.cwd(), config.source.basePath);
      if (!existsSync(sourcePath)) {
        issues.push(`Source path does not exist: ${config.source.basePath}`);
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Configuration',
        status: 'warn',
        message: 'Configuration has issues',
        details: issues.join(', '),
        fixable: true,
      };
    }

    return {
      name: 'Configuration',
      status: 'pass',
      message: 'Configuration file is valid',
    };
  } catch (error) {
    return {
      name: 'Configuration',
      status: 'fail',
      message: 'Invalid configuration file',
      details: error instanceof Error ? error.message : String(error),
      fixable: true,
    };
  }
}

/**
 * Check for common issues in HTML file
 */
async function checkHTML(): Promise<DiagnosticResult> {
  const indexPath = join(process.cwd(), 'index.html');

  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    const issues: string[] = [];

    // Check for viewer script
    if (!content.includes('zero-config.umd.cjs') && !content.includes('MarkdownDocsViewer')) {
      issues.push('Viewer script not found in HTML');
    }

    // Check for container element
    if (
      !content.includes('id="docs"') &&
      !content.includes('id="documentation"') &&
      !content.includes('class="docs"') &&
      !content.includes('class="documentation"')
    ) {
      issues.push('No container element found (try adding id="docs")');
    }

    // Check meta viewport
    if (!content.includes('name="viewport"')) {
      issues.push('Missing viewport meta tag for mobile support');
    }

    if (issues.length > 0) {
      return {
        name: 'HTML Structure',
        status: 'warn',
        message: 'HTML file has potential issues',
        details: issues.join(', '),
        fixable: false,
      };
    }

    return {
      name: 'HTML Structure',
      status: 'pass',
      message: 'HTML file looks good',
    };
  } catch (error) {
    return {
      name: 'HTML Structure',
      status: 'fail',
      message: 'Cannot read HTML file',
      details: error instanceof Error ? error.message : String(error),
      fixable: false,
    };
  }
}

/**
 * Check for latest version
 */
async function checkVersion(): Promise<DiagnosticResult> {
  try {
    // Import node-fetch dynamically for ESM compatibility
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(
      'https://api.github.com/repos/AustinOrphan/markdown-docs-viewer/releases/latest'
    );
    if (!response.ok) {
      return {
        name: 'Version Check',
        status: 'warn',
        message: 'Cannot check for updates',
        details: 'Network error or rate limited',
        fixable: false,
      };
    }

    const release = (await response.json()) as any;
    const latestVersion = release.tag_name.replace(/^v/, '');

    // Try to get current version
    const viewerPath = join(process.cwd(), 'viewer', 'zero-config.umd.cjs');
    if (existsSync(viewerPath)) {
      const content = await fs.readFile(viewerPath, 'utf-8');
      const versionMatch = content.match(/version['"]?\\s*:\\s*['"]([^'"]+)['"]/);

      if (versionMatch) {
        const currentVersion = versionMatch[1];

        if (currentVersion !== latestVersion) {
          return {
            name: 'Version Check',
            status: 'warn',
            message: `Update available: v${currentVersion} → v${latestVersion}`,
            details: 'Run "mdv upgrade" to update',
            fixable: true,
          };
        }
      }
    }

    return {
      name: 'Version Check',
      status: 'pass',
      message: 'Using latest version',
    };
  } catch {
    return {
      name: 'Version Check',
      status: 'warn',
      message: 'Cannot check version',
      details: 'Network error',
      fixable: false,
    };
  }
}

/**
 * Fix issues automatically
 */
async function fixIssues(results: DiagnosticResult[]): Promise<void> {
  console.log(chalk.blue('\\n🔧 Attempting to fix issues...\\n'));

  for (const result of results) {
    if (result.status !== 'pass' && result.fixable) {
      const spinner = ora(`Fixing: ${result.name}`).start();

      try {
        switch (result.name) {
          case 'Viewer Installation': {
            // Download and install viewer
            const { upgradeCommand } = await import('./upgrade');
            await upgradeCommand({ force: true });
            spinner.succeed(`Fixed: ${result.name}`);
            break;
          }

          case 'Documentation Content':
            if (result.message.includes('No docs/ directory')) {
              // Create docs directory with README
              await fs.mkdir(join(process.cwd(), 'docs'), { recursive: true });
              await fs.writeFile(
                join(process.cwd(), 'docs', 'README.md'),
                `# Documentation\\n\\nWelcome to your documentation site!\\n\\nStart by editing this file or adding more markdown files to the docs/ directory.\\n`
              );
              spinner.succeed(`Fixed: ${result.name}`);
            } else if (result.message.includes('No markdown files')) {
              // Create sample README
              await fs.writeFile(
                join(process.cwd(), 'docs', 'README.md'),
                `# Documentation\\n\\nWelcome to your documentation site!\\n\\nStart by editing this file or adding more markdown files to the docs/ directory.\\n`
              );
              spinner.succeed(`Fixed: ${result.name}`);
            }
            break;

          case 'Configuration':
            if (result.message.includes('No configuration file')) {
              // Create basic config
              const config = {
                title: 'Documentation',
                theme: 'default-light',
                source: {
                  type: 'local',
                  basePath: 'docs',
                },
              };
              await fs.writeFile(
                join(process.cwd(), 'docs-config.json'),
                JSON.stringify(config, null, 2)
              );
              spinner.succeed(`Fixed: ${result.name}`);
            }
            break;

          default:
            spinner.fail(`Cannot auto-fix: ${result.name}`);
        }
      } catch (error) {
        spinner.fail(`Failed to fix: ${result.name}`);
        console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
}

/**
 * Main doctor command implementation
 */
export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue('\\n🩺 Markdown Docs Viewer Health Check\\n'));

    // Show system info if verbose
    if (options.verbose) {
      const sysInfo = getSystemInfo();
      console.log(chalk.bold('System Information:'));
      console.log(`  Node.js: ${sysInfo.nodeVersion}`);
      console.log(`  Platform: ${sysInfo.platform} (${sysInfo.architecture})`);
      console.log(`  Directory: ${sysInfo.workingDirectory}`);
      console.log();
    }

    // Run diagnostics
    const spinner = ora('Running diagnostics...').start();

    const diagnostics = [
      checkProjectStructure,
      checkViewer,
      checkDocs,
      checkConfig,
      checkHTML,
      checkVersion,
    ];

    const results: DiagnosticResult[] = [];

    for (const diagnostic of diagnostics) {
      try {
        const result = await diagnostic();
        results.push(result);
      } catch (error) {
        results.push({
          name: 'Unknown Check',
          status: 'fail',
          message: 'Diagnostic failed',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }

    spinner.succeed('Diagnostics complete');

    // Display results
    console.log();
    console.log(chalk.bold('Diagnostic Results:'));
    console.log();

    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    for (const result of results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      const color =
        result.status === 'pass'
          ? chalk.green
          : result.status === 'warn'
            ? chalk.yellow
            : chalk.red;

      console.log(`${icon} ${result.name}: ${color(result.message)}`);

      if (result.details && options.verbose) {
        console.log(`   ${chalk.gray(result.details)}`);
      }

      if (result.status === 'pass') passCount++;
      else if (result.status === 'warn') warnCount++;
      else failCount++;
    }

    // Summary
    console.log();
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✅ Passed:')} ${passCount}`);
    console.log(`  ${chalk.yellow('⚠️  Warnings:')} ${warnCount}`);
    console.log(`  ${chalk.red('❌ Failed:')} ${failCount}`);

    // Auto-fix if requested
    if (options.fix && (warnCount > 0 || failCount > 0)) {
      await fixIssues(results);

      console.log(chalk.green('\\n🎉 Auto-fix completed!'));
      console.log(chalk.gray('   Run "mdv doctor" again to verify fixes'));
    } else if (warnCount > 0 || failCount > 0) {
      console.log();
      console.log(chalk.blue('💡 Run "mdv doctor --fix" to attempt automatic fixes'));
    }

    if (failCount === 0 && warnCount === 0) {
      console.log(chalk.green('\\n🎉 All checks passed! Your project looks healthy.'));
    }
  } catch (error) {
    console.error(chalk.red('\\n❌ Health check failed:'));
    console.error(error instanceof Error ? error.message : error);

    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
