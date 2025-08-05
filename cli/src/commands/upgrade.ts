/**
 * Upgrade Command - Update viewer to latest version
 * Implements "mdv upgrade" functionality
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync } from 'fs';

// Types
interface UpgradeOptions {
  force?: boolean;
  backup?: boolean;
  version?: string;
  check?: boolean;
}

// Version checking
interface VersionInfo {
  current: string | null;
  latest: string;
  updateAvailable: boolean;
}

/**
 * Check current and latest versions
 */
async function checkVersions(): Promise<VersionInfo> {
  const spinner = ora('Checking versions...').start();

  try {
    // Import node-fetch dynamically for ESM compatibility
    const fetch = (await import('node-fetch')).default;

    // Get latest version from GitHub
    const response = await fetch(
      'https://api.github.com/repos/AustinOrphan/markdown-docs-viewer/releases/latest'
    );
    if (!response.ok) {
      throw new Error('Failed to fetch latest version');
    }

    const release = (await response.json()) as any;
    const latest = release.tag_name.replace(/^v/, '');

    // Try to determine current version from viewer file
    let current: string | null = null;
    const viewerPath = join(process.cwd(), 'viewer', 'zero-config.umd.cjs');

    if (existsSync(viewerPath)) {
      const content = await fs.readFile(viewerPath, 'utf-8');
      const versionMatch = content.match(/version['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (versionMatch) {
        current = versionMatch[1];
      }
    }

    const updateAvailable = current ? current !== latest : true;

    spinner.succeed('Version check complete');

    return {
      current,
      latest,
      updateAvailable,
    };
  } catch (error) {
    spinner.fail('Version check failed');
    throw error;
  }
}

/**
 * Download and install latest viewer
 */
async function installViewer(targetDir: string, version?: string): Promise<void> {
  const spinner = ora(`Downloading viewer${version ? ` v${version}` : ''}...`).start();

  try {
    // Import node-fetch dynamically for ESM compatibility
    const fetch = (await import('node-fetch')).default;

    let downloadUrl: string;

    if (version) {
      // Download specific version
      downloadUrl = `https://github.com/AustinOrphan/markdown-docs-viewer/releases/download/v${version}/zero-config.umd.cjs`;
    } else {
      // Get latest release
      const response = await fetch(
        'https://api.github.com/repos/AustinOrphan/markdown-docs-viewer/releases/latest'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch release info');
      }

      const release = (await response.json()) as any;
      const asset = release.assets.find((a: any) => a.name === 'zero-config.umd.cjs');
      if (!asset) {
        throw new Error('UMD asset not found in release');
      }

      downloadUrl = asset.browser_download_url;
      version = release.tag_name.replace(/^v/, '');
    }

    // Download the file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const content = await response.text();

    // Ensure viewer directory exists
    const viewerDir = join(targetDir, 'viewer');
    await fs.mkdir(viewerDir, { recursive: true });

    // Write the file
    await fs.writeFile(join(viewerDir, 'zero-config.umd.cjs'), content);

    spinner.succeed(`Viewer v${version} installed successfully`);
  } catch (error) {
    spinner.fail('Download failed');
    throw error;
  }
}

/**
 * Create backup of current viewer
 */
async function createBackup(targetDir: string): Promise<string | null> {
  const viewerPath = join(targetDir, 'viewer', 'zero-config.umd.cjs');

  if (!existsSync(viewerPath)) {
    return null;
  }

  const spinner = ora('Creating backup...').start();

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(targetDir, 'viewer', `zero-config.umd.cjs.backup-${timestamp}`);

    await fs.copyFile(viewerPath, backupPath);

    spinner.succeed(`Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    spinner.fail('Backup failed');
    throw error;
  }
}

/**
 * Main upgrade command implementation
 */
export async function upgradeCommand(options: UpgradeOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue('\\n🔄 Markdown Docs Viewer Upgrade\\n'));

    // Check if we're in a project directory
    const projectDir = process.cwd();
    const viewerDir = join(projectDir, 'viewer');

    if (!existsSync(viewerDir)) {
      console.log(chalk.red('❌ No viewer installation found in current directory.'));
      console.log(
        chalk.gray(
          '   Run this command from your project root, or use "mdv init" to create a new project.'
        )
      );
      return;
    }

    // Check versions
    if (options.check) {
      const versions = await checkVersions();

      console.log(chalk.bold('Version Information:'));
      console.log(`  Current: ${versions.current || chalk.gray('unknown')}`);
      console.log(`  Latest:  ${versions.latest}`);
      console.log(
        `  Update:  ${versions.updateAvailable ? chalk.green('available') : chalk.gray('not needed')}`
      );

      if (!versions.updateAvailable) {
        console.log(chalk.green('\\n✅ You are running the latest version!'));
      } else {
        console.log(chalk.yellow('\\n⚠️  An update is available. Run "mdv upgrade" to update.'));
      }
      return;
    }

    const versions = await checkVersions();

    if (!versions.updateAvailable && !options.force) {
      console.log(chalk.green('✅ You are already running the latest version!'));
      console.log(chalk.gray(`   Current version: v${versions.current}`));
      console.log(chalk.gray('   Use --force to reinstall anyway.'));
      return;
    }

    // Confirm upgrade
    if (!options.force) {
      const currentText = versions.current ? `v${versions.current}` : 'unknown';

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Upgrade from ${currentText} to v${versions.latest}?`,
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Upgrade cancelled.'));
        return;
      }
    }

    // Create backup if requested
    let backupPath: string | null = null;
    if (options.backup !== false) {
      backupPath = await createBackup(projectDir);
    }

    // Install new version
    await installViewer(projectDir, options.version);

    // Success message
    console.log(chalk.green('\\n🎉 Upgrade completed successfully!\\n'));

    console.log(chalk.bold('What changed:'));
    console.log(chalk.cyan(`  Updated viewer to v${options.version || versions.latest}`));

    if (backupPath) {
      console.log(chalk.cyan(`  Backup saved: ${backupPath.split('/').pop()}`));
    }

    console.log();
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.cyan('  Refresh your browser to see the updated viewer'));
    console.log(chalk.cyan('  Check the changelog for new features'));

    console.log();
    console.log(
      chalk.gray('📖 Changelog: https://github.com/AustinOrphan/markdown-docs-viewer/releases')
    );
  } catch (error) {
    console.error(chalk.red('\\n❌ Upgrade failed:'));
    console.error(error instanceof Error ? error.message : error);

    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
