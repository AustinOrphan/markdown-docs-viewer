#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Dashboard components
class DocsDashboard {
  constructor() {
    this.stats = {
      totalFiles: 0,
      markdownFiles: 0,
      apiDocs: 0,
      brokenLinks: 0,
      lastGenerated: null,
      coverage: {},
    };
  }

  async collectStats() {
    // Check for last generation report
    try {
      const reportPath = join(projectRoot, 'docs-report.json');
      const report = JSON.parse(await readFile(reportPath, 'utf-8'));
      this.stats.lastGenerated = report.timestamp;

      // Extract broken links count
      const brokenLinksTask = report.results.find(r => r.task === 'checkBrokenLinks');
      if (brokenLinksTask && brokenLinksTask.brokenLinks) {
        this.stats.brokenLinks = brokenLinksTask.brokenLinks.length;
      }
    } catch (error) {
      // If no report exists, try to get last modified time of architecture docs
      try {
        const archPath = join(projectRoot, 'docs', 'architecture', 'README.md');
        const stats = await stat(archPath);
        this.stats.lastGenerated = stats.mtime.toISOString();
      } catch {
        this.stats.lastGenerated = 'Never';
      }
    }

    // Count documentation files
    await this.countDocFiles(join(projectRoot, 'docs'));

    // Check API documentation
    try {
      const apiDir = join(projectRoot, 'docs', 'api');
      const apiFiles = await readdir(apiDir);
      this.stats.apiDocs = apiFiles.filter(f => f.endsWith('.md')).length;
    } catch {
      this.stats.apiDocs = 0;
    }

    // Calculate documentation coverage
    await this.calculateCoverage();

    return this.stats;
  }

  async countDocFiles(dir) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
          await this.countDocFiles(fullPath);
        } else if (entry.isFile()) {
          this.stats.totalFiles++;
          if (entry.name.endsWith('.md')) {
            this.stats.markdownFiles++;
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
  }

  async calculateCoverage() {
    // Check which source files have corresponding documentation
    const srcDir = join(projectRoot, 'src');
    const srcFiles = [];

    async function scanSrc(dir) {
      try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            await scanSrc(fullPath);
          } else if (
            entry.isFile() &&
            entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.test.ts')
          ) {
            srcFiles.push(entry.name.replace('.ts', ''));
          }
        }
      } catch (error) {
        console.error('Error scanning src:', error.message);
      }
    }

    await scanSrc(srcDir);

    // Check for component documentation in architecture docs
    const documentedFiles = new Set();
    try {
      const componentDir = join(projectRoot, 'docs', 'architecture', 'components');
      const componentFiles = await readdir(componentDir);
      componentFiles.forEach(f => {
        if (f.endsWith('.md')) {
          // Extract component name from filename (e.g., theme-manager.md -> theme-manager)
          documentedFiles.add(f.replace('.md', ''));
        }
      });
    } catch {
      // Component docs don't exist
    }

    // Also check if files are mentioned in the main architecture docs
    try {
      const archContent = await readFile(
        join(projectRoot, 'docs', 'architecture', 'README.md'),
        'utf-8'
      );
      srcFiles.forEach(file => {
        if (archContent.includes(file)) {
          documentedFiles.add(file);
        }
      });
    } catch {
      // Architecture README doesn't exist
    }

    this.stats.coverage = {
      total: srcFiles.length,
      documented: documentedFiles.size,
      percentage:
        srcFiles.length > 0 ? Math.round((documentedFiles.size / srcFiles.length) * 100) : 0,
    };
  }

  async checkGitStatus() {
    try {
      const { stdout } = await execAsync('git status --porcelain docs/', { cwd: projectRoot });
      return stdout
        .trim()
        .split('\n')
        .filter(line => line.trim()).length;
    } catch {
      return 0;
    }
  }

  async generateReport(format = 'terminal') {
    const stats = await this.collectStats();
    const uncommittedDocs = await this.checkGitStatus();

    if (format === 'json') {
      return JSON.stringify(
        {
          ...stats,
          uncommittedDocs,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );
    }

    // Terminal output with colors
    const output = [];

    output.push(`${colors.bright}${colors.cyan}📊 Documentation Status Dashboard${colors.reset}`);
    output.push(`${'─'.repeat(50)}`);

    // Last generated
    const isRecent =
      stats.lastGenerated !== 'Never' &&
      new Date() - new Date(stats.lastGenerated) < 24 * 60 * 60 * 1000;
    output.push(
      `${colors.bright}Last Generated:${colors.reset} ${
        isRecent ? colors.green : colors.yellow
      }${stats.lastGenerated}${colors.reset}`
    );

    // File statistics
    output.push(`\n${colors.bright}📁 File Statistics:${colors.reset}`);
    output.push(`  Total files: ${stats.totalFiles}`);
    output.push(`  Markdown files: ${stats.markdownFiles}`);
    output.push(`  API docs: ${stats.apiDocs}`);

    // Coverage
    const coverageColor =
      stats.coverage.percentage >= 80
        ? colors.green
        : stats.coverage.percentage >= 50
          ? colors.yellow
          : colors.red;
    output.push(`\n${colors.bright}📈 Documentation Coverage:${colors.reset}`);
    output.push(`  Source files: ${stats.coverage.total}`);
    output.push(`  Documented: ${stats.coverage.documented}`);
    output.push(`  Coverage: ${coverageColor}${stats.coverage.percentage}%${colors.reset}`);

    // Issues
    output.push(`\n${colors.bright}⚠️  Issues:${colors.reset}`);
    output.push(
      `  Broken links: ${
        stats.brokenLinks > 0 ? colors.red : colors.green
      }${stats.brokenLinks}${colors.reset}`
    );
    output.push(
      `  Uncommitted docs: ${
        uncommittedDocs > 0 ? colors.yellow : colors.green
      }${uncommittedDocs}${colors.reset}`
    );

    // Health score
    const healthScore = this.calculateHealthScore(stats, uncommittedDocs);
    const healthColor =
      healthScore >= 80 ? colors.green : healthScore >= 50 ? colors.yellow : colors.red;
    output.push(
      `\n${colors.bright}❤️  Documentation Health Score: ${healthColor}${healthScore}/100${colors.reset}`
    );

    output.push(`${'─'.repeat(50)}`);

    // Recommendations
    if (healthScore < 100) {
      output.push(`\n${colors.bright}💡 Recommendations:${colors.reset}`);
      if (stats.brokenLinks > 0) {
        output.push(`  - Fix ${stats.brokenLinks} broken links`);
      }
      if (stats.coverage.percentage < 80) {
        output.push(`  - Improve documentation coverage (currently ${stats.coverage.percentage}%)`);
      }
      if (uncommittedDocs > 0) {
        output.push(`  - Commit ${uncommittedDocs} uncommitted documentation changes`);
      }
      if (stats.lastGenerated === 'Never' || !isRecent) {
        output.push(`  - Regenerate documentation (last: ${stats.lastGenerated})`);
      }
    }

    return output.join('\n');
  }

  calculateHealthScore(stats, uncommittedDocs) {
    let score = 100;

    // Deduct for broken links (5 points per link, max 20)
    score -= Math.min(stats.brokenLinks * 5, 20);

    // Deduct for low coverage (more aggressive penalty)
    // 0% = -50 points, 25% = -37.5 points, 50% = -25 points, 75% = -12.5 points, 80%+ = 0 points
    if (stats.coverage.percentage < 80) {
      const coveragePenalty = Math.round((100 - stats.coverage.percentage) * 0.5);
      score -= Math.min(coveragePenalty, 50);
    }

    // Deduct for uncommitted docs (2 points per file, max 10)
    score -= Math.min(uncommittedDocs * 2, 10);

    // Deduct if docs are stale (10 points if > 7 days, 20 if never generated)
    if (stats.lastGenerated === 'Never') {
      score -= 20;
    } else {
      const daysSinceGenerated =
        (new Date() - new Date(stats.lastGenerated)) / (1000 * 60 * 60 * 24);
      if (daysSinceGenerated > 7) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'terminal';

  const dashboard = new DocsDashboard();
  const report = await dashboard.generateReport(format);

  if (format === 'terminal') {
    process.stdout.write(report + '\n');
  } else {
    process.stdout.write(report);
  }
}

// Always run main if this is the entry point
main().catch(error => {
  console.error('Error running docs-status:', error);
  process.exit(1);
});

export { DocsDashboard };
