#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir, readdir, stat, rm } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
  apiDocsOutput: join(projectRoot, 'docs', 'api'),
  srcDir: join(projectRoot, 'src'),
  docsDir: join(projectRoot, 'docs'),
  tempDir: join(projectRoot, '.temp-docs'),
};

// Result collector
const results = {
  logs: [],
  errors: [],
  warnings: [],
  info: [],
};

function logInfo(message) {
  results.info.push({ timestamp: new Date().toISOString(), message });
  results.logs.push({ level: 'info', timestamp: new Date().toISOString(), message });
}

function logError(message) {
  results.errors.push({ timestamp: new Date().toISOString(), message });
  results.logs.push({ level: 'error', timestamp: new Date().toISOString(), message });
}

function logWarning(message) {
  results.warnings.push({ timestamp: new Date().toISOString(), message });
  results.logs.push({ level: 'warn', timestamp: new Date().toISOString(), message });
}

// Utility functions
async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dir}:`, error.message);
      throw error;
    }
  }
}

async function cleanDir(dir) {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist
  }
  await ensureDir(dir);
}

// Generate API documentation using TypeDoc
async function generateApiDocs() {
  console.log('Starting generateApiDocs...');
  logInfo('Generating API documentation...');

  console.log('Cleaning directory:', config.apiDocsOutput);
  await cleanDir(config.apiDocsOutput);

  try {
    // Check if TypeDoc is available
    try {
      await execAsync('npx typedoc --version');
    } catch {
      logInfo('Installing TypeDoc...');
      await execAsync('npm install --save-dev typedoc typedoc-plugin-markdown');
    }

    // Generate TypeDoc documentation with safe paths
    const typeDocCmd = [
      'npx',
      'typedoc',
      '--out',
      config.apiDocsOutput,
      '--entryPoints',
      join(config.srcDir, 'index.ts'),
      '--excludePrivate',
      '--excludeInternal',
      '--plugin',
      'typedoc-plugin-markdown',
      '--readme',
      'none',
    ];

    const { stdout, stderr } = await execAsync(
      typeDocCmd.map(arg => JSON.stringify(arg)).join(' ')
    );
    if (stdout) logInfo(stdout);
    if (stderr && !stderr.includes('warning')) logError(stderr);

    logInfo('API documentation generated successfully');
    return { success: true };
  } catch (error) {
    logError(`Error generating API documentation: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Validate documentation structure
async function validateDocsStructure() {
  logInfo('Validating documentation structure...');

  const requiredDocs = [
    'README.md',
    'API.md',
    'CONFIGURATION.md',
    'THEMING.md',
    'architecture/README.md',
  ];

  const missingDocs = [];
  const validDocs = [];

  for (const doc of requiredDocs) {
    const docPath = join(config.docsDir, doc);
    try {
      await stat(docPath);
      validDocs.push(doc);
    } catch {
      missingDocs.push(doc);
    }
  }

  if (missingDocs.length > 0) {
    logWarning('Missing documentation files:');
    missingDocs.forEach(doc => logWarning(`   - ${doc}`));
  } else {
    logInfo('Documentation structure is valid');
  }

  return {
    success: missingDocs.length === 0,
    missingDocs,
    validDocs,
  };
}

// Check for broken links in documentation
async function checkBrokenLinks() {
  logInfo('Checking for broken links...');

  const brokenLinks = [];
  const validLinks = [];
  const checkedLinks = new Set();

  async function checkFile(filePath) {
    const content = await readFile(filePath, 'utf-8');
    const relativeFilePath = relative(projectRoot, filePath);

    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];

      // Skip external links
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }

      // Skip anchor links
      if (linkUrl.startsWith('#')) {
        continue;
      }

      const linkKey = `${filePath}:${linkUrl}`;
      if (checkedLinks.has(linkKey)) {
        continue;
      }
      checkedLinks.add(linkKey);

      // Resolve relative links
      const basePath = dirname(filePath);
      const resolvedPath = linkUrl.startsWith('/')
        ? join(projectRoot, linkUrl)
        : join(basePath, linkUrl);

      // Check if file exists
      try {
        await stat(resolvedPath);
        validLinks.push({
          file: relativeFilePath,
          link: linkUrl,
          text: linkText,
        });
      } catch {
        brokenLinks.push({
          file: relativeFilePath,
          link: linkUrl,
          text: linkText,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }
  }

  async function scanDirectory(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (!['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
          await scanDirectory(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        await checkFile(fullPath);
      }
    }
  }

  await scanDirectory(config.docsDir);

  if (brokenLinks.length > 0) {
    logError('Found broken links:');
    brokenLinks.forEach(({ file, link, text, line }) => {
      logError(`   ${file}:${line} - [${text}](${link})`);
    });
  } else {
    logInfo('No broken links found');
  }

  return {
    success: brokenLinks.length === 0,
    brokenLinks,
    validLinks,
    totalChecked: checkedLinks.size,
  };
}

// Generate documentation index
async function generateDocsIndex() {
  logInfo('Generating documentation index...');

  const index = {
    generated: new Date().toISOString(),
    structure: {},
    stats: {
      totalFiles: 0,
      totalDirectories: 0,
      filesByType: {},
    },
  };

  async function scanDir(dir, relativePath = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    const result = {
      files: [],
      directories: {},
    };

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = join(relativePath, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git'].includes(entry.name)) {
          index.stats.totalDirectories++;
          result.directories[entry.name] = await scanDir(fullPath, relPath);
        }
      } else if (entry.isFile()) {
        index.stats.totalFiles++;
        const ext = entry.name.split('.').pop();
        index.stats.filesByType[ext] = (index.stats.filesByType[ext] || 0) + 1;

        result.files.push({
          name: entry.name,
          path: relPath,
          size: (await stat(fullPath)).size,
        });
      }
    }

    return result;
  }

  index.structure = await scanDir(config.docsDir);

  const indexPath = join(config.docsDir, 'index.json');
  await writeFile(indexPath, JSON.stringify(index, null, 2));

  logInfo('Documentation index generated');
  logInfo(`   Total files: ${index.stats.totalFiles}`);
  logInfo(`   Total directories: ${index.stats.totalDirectories}`);

  return { success: true, index };
}

// Generate documentation report
async function generateReport(taskResults) {
  const report = {
    timestamp: new Date().toISOString(),
    results: taskResults,
    summary: {
      totalTasks: taskResults.length,
      successful: taskResults.filter(r => r.success).length,
      failed: taskResults.filter(r => !r.success).length,
    },
    logs: results.logs,
    errors: results.errors,
    warnings: results.warnings,
    info: results.info,
  };

  const reportPath = join(projectRoot, 'docs-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  // Also write a human-readable summary
  const summaryPath = join(projectRoot, 'docs-report.md');
  const summary = `# Documentation Generation Report

Generated: ${report.timestamp}

## Summary
- Total tasks: ${report.summary.totalTasks}
- Successful: ${report.summary.successful}
- Failed: ${report.summary.failed}

## Errors
${report.errors.length === 0 ? 'No errors found.' : report.errors.map(e => `- ${e.message}`).join('\n')}

## Warnings
${report.warnings.length === 0 ? 'No warnings found.' : report.warnings.map(w => `- ${w.message}`).join('\n')}

## Details
See \`docs-report.json\` for full details.
`;

  await writeFile(summaryPath, summary);

  return report;
}

// Main execution
async function main() {
  console.log('Starting documentation generation...');
  logInfo('Starting documentation generation...');

  const taskResults = [];

  try {
    // Ensure directories exist
    console.log('Ensuring directories exist...');
    console.log('Creating:', config.docsDir);
    await ensureDir(config.docsDir);
    console.log('Creating:', config.apiDocsOutput);
    await ensureDir(config.apiDocsOutput);

    // Run tasks sequentially to capture individual results
    console.log('Running tasks...');
    taskResults.push({ task: 'generateApiDocs', ...(await generateApiDocs()) });
    console.log('API docs complete');

    taskResults.push({ task: 'validateDocsStructure', ...(await validateDocsStructure()) });
    console.log('Validation complete');

    taskResults.push({ task: 'checkBrokenLinks', ...(await checkBrokenLinks()) });
    console.log('Link check complete');

    taskResults.push({ task: 'generateDocsIndex', ...(await generateDocsIndex()) });
    console.log('Index generation complete');

    // Generate report
    const report = await generateReport(taskResults);

    // Check results
    const hasErrors = taskResults.some(r => !r.success);

    if (hasErrors) {
      logError('Documentation generation completed with errors');
      process.exit(1);
    } else {
      logInfo('Documentation generation completed successfully!');

      // Output summary to stdout for CI/CD integration
      if (process.env.CI) {
        process.stdout.write(JSON.stringify(report.summary));
      }
    }
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    await generateReport(taskResults);
    process.exit(1);
  }
}

// Always run main if this is the entry point
console.log('Script started, running main...');
main().catch(error => {
  console.error('Error running generate-docs:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

export { generateApiDocs, validateDocsStructure, checkBrokenLinks, generateDocsIndex };
