#!/usr/bin/env node

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
  docsDir: join(projectRoot, 'docs'),
  outputDir: join(projectRoot, 'docs', 'diagrams', 'images'),
  mermaidConfig: {
    theme: 'default',
    themeVariables: {
      primaryColor: '#4a90e2',
      primaryTextColor: '#fff',
      primaryBorderColor: '#3a7bc8',
      lineColor: '#5e6c84',
      secondaryColor: '#006fbb',
      tertiaryColor: '#fff',
    },
  },
};

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await mkdir(config.outputDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// Extract Mermaid diagrams from markdown files
async function extractMermaidDiagrams(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const diagrams = [];

  // Match mermaid code blocks
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = mermaidRegex.exec(content)) !== null) {
    diagrams.push({
      content: match[1].trim(),
      index: index++,
      startPos: match.index,
      endPos: match.index + match[0].length,
    });
  }

  return diagrams;
}

// Convert Mermaid diagram to image
async function convertDiagramToImage(diagram, sourceFile, index) {
  const baseFileName = basename(sourceFile, extname(sourceFile));
  const outputFileName = `${baseFileName}-diagram-${index}.png`;
  const outputPath = join(config.outputDir, outputFileName);

  // Create temporary mermaid file
  const tempFile = join(config.outputDir, `temp-${Date.now()}.mmd`);
  await writeFile(tempFile, diagram.content);

  try {
    // Check if mermaid CLI is installed
    try {
      await execAsync('npx -p @mermaid-js/mermaid-cli mmdc --version');
    } catch {
      throw new Error(
        'Mermaid CLI not found. Install it with: npm install -g @mermaid-js/mermaid-cli'
      );
    }

    // Convert to PNG
    const configJson = JSON.stringify(config.mermaidConfig);
    const command = `npx -p @mermaid-js/mermaid-cli mmdc -i "${tempFile}" -o "${outputPath}" -t ${config.mermaidConfig.theme} -c '${configJson}'`;

    await execAsync(command);

    // Clean up temp file
    await execAsync(`rm "${tempFile}"`);

    return {
      success: true,
      outputPath,
      relativePath: `diagrams/images/${outputFileName}`,
    };
  } catch (error) {
    // Clean up temp file on error
    try {
      await execAsync(`rm "${tempFile}"`);
    } catch {}

    return {
      success: false,
      error: error.message,
    };
  }
}

// Update markdown file with image references
async function updateMarkdownFile(filePath, diagrams, imageResults) {
  let content = await readFile(filePath, 'utf-8');
  let offset = 0;

  for (let i = 0; i < diagrams.length; i++) {
    const diagram = diagrams[i];
    const result = imageResults[i];

    if (result.success) {
      // Create replacement text
      const replacement = `![Diagram ${diagram.index + 1}](${result.relativePath})\n\n<details>\n<summary>View Mermaid Source</summary>\n\n\`\`\`mermaid\n${diagram.content}\n\`\`\`\n\n</details>`;

      // Replace in content
      const startPos = diagram.startPos + offset;
      const endPos = diagram.endPos + offset;

      content = content.substring(0, startPos) + replacement + content.substring(endPos);

      // Update offset for next replacements
      offset += replacement.length - (diagram.endPos - diagram.startPos);
    }
  }

  // Create backup
  const backupPath = filePath + '.backup';
  await writeFile(backupPath, await readFile(filePath, 'utf-8'));

  // Write updated content
  await writeFile(filePath, content);

  return { updated: true, backupPath };
}

// Process all markdown files
async function processMarkdownFiles(dir, options = {}) {
  const results = {
    processed: [],
    errors: [],
    totalDiagrams: 0,
  };

  async function scanDir(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory() && !['node_modules', '.git', 'images'].includes(entry.name)) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          // Extract diagrams
          const diagrams = await extractMermaidDiagrams(fullPath);

          if (diagrams.length > 0) {
            results.totalDiagrams += diagrams.length;

            // Convert diagrams to images
            const imageResults = [];
            for (let i = 0; i < diagrams.length; i++) {
              const result = await convertDiagramToImage(diagrams[i], fullPath, i);
              imageResults.push(result);
            }

            // Update markdown file if requested
            if (!options.dryRun) {
              await updateMarkdownFile(fullPath, diagrams, imageResults);
            }

            results.processed.push({
              file: fullPath,
              diagrams: diagrams.length,
              images: imageResults.filter(r => r.success).length,
            });
          }
        } catch (error) {
          results.errors.push({
            file: fullPath,
            error: error.message,
          });
        }
      }
    }
  }

  await scanDir(dir);
  return results;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    process.stdout.write(`
Mermaid Diagram Converter
========================

Converts Mermaid diagrams in markdown files to PNG images.

Usage: node scripts/convert-mermaid.js [options]

Options:
  --dry-run    Preview what would be converted without making changes
  --help, -h   Show this help message

The script will:
1. Scan all .md files in the docs directory
2. Extract Mermaid code blocks
3. Convert them to PNG images
4. Update the markdown files to reference the images
5. Keep the original Mermaid source in a collapsible section

Requirements:
- Mermaid CLI must be installed (npm install -g @mermaid-js/mermaid-cli)
`);
    return;
  }

  try {
    await ensureOutputDir();

    if (dryRun) {
      process.stdout.write('🔍 Running in dry-run mode (no files will be modified)\n\n');
    }

    process.stdout.write('🎨 Converting Mermaid diagrams to images...\n');

    const results = await processMarkdownFiles(config.docsDir, { dryRun });

    // Print results
    process.stdout.write('\n📊 Conversion Results:\n');
    process.stdout.write(`${'─'.repeat(50)}\n`);
    process.stdout.write(`Total diagrams found: ${results.totalDiagrams}\n`);
    process.stdout.write(`Files processed: ${results.processed.length}\n`);

    if (results.processed.length > 0) {
      process.stdout.write('\nProcessed files:\n');
      results.processed.forEach(({ file, diagrams, images }) => {
        const relativePath = file.replace(projectRoot + '/', '');
        process.stdout.write(`  ✅ ${relativePath} (${diagrams} diagrams, ${images} images)\n`);
      });
    }

    if (results.errors.length > 0) {
      process.stdout.write('\n❌ Errors:\n');
      results.errors.forEach(({ file, error }) => {
        const relativePath = file.replace(projectRoot + '/', '');
        process.stdout.write(`  - ${relativePath}: ${error}\n`);
      });
    }

    if (!dryRun && results.processed.length > 0) {
      process.stdout.write('\n💡 Backup files created with .backup extension\n');
    }
  } catch (error) {
    process.stderr.write(`❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractMermaidDiagrams, convertDiagramToImage, processMarkdownFiles };
