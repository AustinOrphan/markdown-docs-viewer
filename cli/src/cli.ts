#!/usr/bin/env node
/**
 * Markdown Docs Viewer CLI
 * Command-line interface for creating and managing documentation sites
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import commands
import { initCommand } from './commands/init.js';
import { upgradeCommand } from './commands/upgrade.js';
import { serveCommand } from './commands/serve.js';
import { buildCommand } from './commands/build.js';
import { doctorCommand } from './commands/doctor.js';

// Get package info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Create main program
const program = new Command();

// Configure main program
program
  .name('mdv')
  .description('Markdown Docs Viewer CLI - Create beautiful documentation sites with zero configuration')
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information')
  .configureHelp({
    sortSubcommands: true,
    showGlobalOptions: true,
  });

// Global options
program
  .option('--verbose', 'Enable verbose output')
  .option('--quiet', 'Suppress non-essential output')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Path to configuration file');

// Add commands
program
  .command('init')
  .alias('i')
  .description('Initialize a new documentation project')
  .argument('[name]', 'Project name (default: current directory name)')
  .option('-d, --dir <directory>', 'Target directory (default: current directory)')
  .option('-t, --template <template>', 'Project template (default, minimal, blog, api)', 'default')
  .option('--theme <theme>', 'Initial theme (default-light, default-dark, minimal, modern)', 'default-light')
  .option('--git', 'Initialize git repository')
  .option('--install', 'Run npm install after setup')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('--typescript', 'Use TypeScript configuration')
  .action(initCommand);

program
  .command('upgrade')
  .alias('u')
  .description('Upgrade viewer to latest version')
  .option('-f, --force', 'Force upgrade even if version is same')
  .option('--version <version>', 'Upgrade to specific version')
  .option('--preview', 'Upgrade to preview/beta version')
  .option('--backup', 'Create backup before upgrading')
  .action(upgradeCommand);

program
  .command('serve')
  .alias('s')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number (default: 3000)', '3000')
  .option('-h, --host <host>', 'Host address (default: localhost)', 'localhost')
  .option('--open', 'Open browser automatically')
  .option('--watch', 'Watch for file changes and reload', true)
  .option('--no-watch', 'Disable file watching')
  .option('--docs <path>', 'Path to docs directory (default: docs)', 'docs')
  .action(serveCommand);

program
  .command('build')
  .alias('b')
  .description('Build static documentation site')
  .option('-o, --output <directory>', 'Output directory (default: dist)', 'dist')
  .option('--base <path>', 'Base path for deployment (default: /)', '/')
  .option('--clean', 'Clean output directory before build', true)
  .option('--no-clean', 'Skip cleaning output directory')
  .option('--minify', 'Minify output files', true)
  .option('--no-minify', 'Skip minification')
  .option('--sourcemap', 'Generate source maps')
  .action(buildCommand);

program
  .command('doctor')
  .alias('dr')
  .description('Diagnose and fix common issues')
  .option('--fix', 'Automatically fix issues when possible')
  .option('--check-deps', 'Check dependencies and versions')
  .option('--check-config', 'Validate configuration files')
  .option('--check-docs', 'Check documentation structure')
  .action(doctorCommand);

// Add examples section to help
program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('mdv init my-docs')}                 Create new project
  ${chalk.cyan('mdv init --template api')}         Create API documentation project
  ${chalk.cyan('mdv serve --port 8080')}          Start server on port 8080
  ${chalk.cyan('mdv build --output public')}      Build to public directory
  ${chalk.cyan('mdv upgrade --version 1.2.3')}    Upgrade to specific version
  ${chalk.cyan('mdv doctor --fix')}               Check and fix issues

${chalk.bold('Quick Start:')}
  ${chalk.gray('1.')} ${chalk.cyan('mdv init my-docs')}     ${chalk.gray('# Create project')}
  ${chalk.gray('2.')} ${chalk.cyan('cd my-docs')}           ${chalk.gray('# Enter directory')}  
  ${chalk.gray('3.')} ${chalk.cyan('mdv serve')}            ${chalk.gray('# Start development')}

${chalk.bold('Resources:')}
  Homepage: ${chalk.blue('https://github.com/AustinOrphan/markdown-docs-viewer')}
  Issues:   ${chalk.blue('https://github.com/AustinOrphan/markdown-docs-viewer/issues')}
  Docs:     ${chalk.blue('https://github.com/AustinOrphan/markdown-docs-viewer#readme')}
`);

// Handle global options
program.hook('preAction', (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  
  // Set global state for verbose/quiet
  if (opts.verbose) {
    process.env.MDV_VERBOSE = 'true';
  }
  if (opts.quiet) {
    process.env.MDV_QUIET = 'true';
  }
  if (opts.noColor) {
    process.env.NO_COLOR = 'true';
    chalk.level = 0;
  }
  if (opts.config) {
    process.env.MDV_CONFIG = opts.config;
  }
});

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log();
  console.log('Available commands:');
  program.commands.forEach(cmd => {
    const aliases = cmd.aliases().length > 0 ? ` (${cmd.aliases().join(', ')})` : '';
    console.log(`  ${chalk.cyan(cmd.name())}${aliases} - ${cmd.description()}`);
  });
  console.log();
  console.log(`Run ${chalk.cyan('mdv --help')} for more information.`);
  process.exit(1);
});

// Handle version flag with additional info
program.on('option:version', () => {
  console.log(`${chalk.bold('Markdown Docs Viewer CLI')} v${packageJson.version}`);
  console.log(`Node.js ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  
  // Try to get viewer library version if available
  try {
    const viewerPackagePath = join(process.cwd(), 'node_modules', 'markdown-docs-viewer', 'package.json');
    const viewerPackage = JSON.parse(readFileSync(viewerPackagePath, 'utf8'));
    console.log(`Viewer Library: v${viewerPackage.version}`);
  } catch {
    // Viewer not installed locally, that's fine
  }
  
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error.message);
  if (process.env.MDV_VERBOSE === 'true') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled rejection at:'), promise, chalk.red('reason:'), reason);
  if (process.env.MDV_VERBOSE === 'true' && reason instanceof Error) {
    console.error(reason.stack);
  }
  process.exit(1);
});

// Add signal handlers for graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nReceived SIGINT. Gracefully shutting down...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\nReceived SIGTERM. Gracefully shutting down...'));
  process.exit(0);
});

// Parse arguments and execute
async function main() {
  try {
    // Show banner for certain commands if not quiet
    const showBanner = process.argv.includes('init') || 
                      process.argv.includes('serve') || 
                      (process.argv.length === 2 && !process.env.MDV_QUIET);
                      
    if (showBanner && !process.env.MDV_QUIET) {
      console.log(chalk.cyan(`
┌─────────────────────────────────────────────────────────────┐
│  ${chalk.bold('Markdown Docs Viewer CLI')} v${packageJson.version}                      │
│  ${chalk.gray('Transform markdown into beautiful documentation sites')}    │
└─────────────────────────────────────────────────────────────┘
`));
    }
    
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('Command failed:'), error instanceof Error ? error.message : error);
    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { program };