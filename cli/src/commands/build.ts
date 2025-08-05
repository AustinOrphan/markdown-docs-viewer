/**
 * Build Command - Build static documentation site
 * Implements "mdv build" functionality for static site generation
 */

import { promises as fs } from 'fs';
import { join, relative } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';

// Types
interface BuildOptions {
  output?: string;
  clean?: boolean;
  minify?: boolean;
  source?: string;
}

interface DocumentFile {
  path: string;
  relativePath: string;
  content: string;
}

/**
 * Clean output directory
 */
async function cleanOutput(outputDir: string): Promise<void> {
  if (existsSync(outputDir)) {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
  await fs.mkdir(outputDir, { recursive: true });
}

/**
 * Discover and read markdown files
 */
async function discoverDocuments(docsDir: string): Promise<DocumentFile[]> {
  const documents: DocumentFile[] = [];

  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const relativePath = relative(docsDir, fullPath);

        documents.push({
          path: fullPath,
          relativePath,
          content,
        });
      }
    }
  }

  if (existsSync(docsDir)) {
    await scanDirectory(docsDir);
  }

  return documents;
}

/**
 * Load configuration
 */
async function loadConfig(configPath?: string): Promise<any> {
  const configFile = configPath || join(process.cwd(), 'docs-config.json');

  if (existsSync(configFile)) {
    const content = await fs.readFile(configFile, 'utf-8');
    return JSON.parse(content);
  }

  // Default configuration
  return {
    title: 'Documentation',
    theme: 'default-light',
    source: {
      type: 'local',
      basePath: 'docs',
    },
  };
}

/**
 * Generate HTML file with embedded documents
 */
async function generateHTML(
  documents: DocumentFile[],
  config: any,
  outputDir: string,
  options: BuildOptions
): Promise<void> {
  const viewerPath = join(process.cwd(), 'viewer', 'zero-config.umd.cjs');

  if (!existsSync(viewerPath)) {
    throw new Error('Viewer not found. Run "mdv upgrade" to install it.');
  }

  const viewerScript = await fs.readFile(viewerPath, 'utf-8');

  // Create document data structure
  const documentData = documents.map(doc => ({
    path: doc.relativePath.replace(/\\\\/g, '/').replace(/\\.md$/, ''),
    title: extractTitle(doc.content) || doc.relativePath.replace(/\\.md$/, ''),
    content: doc.content,
    lastModified: new Date().toISOString(),
  }));

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title || 'Documentation'}</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        .loading { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            flex-direction: column; 
            color: #666; 
        }
        .loading-spinner { 
            width: 40px; 
            height: 40px; 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #0066cc; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin-bottom: 16px; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading documentation...</p>
    </div>
    
    <script>
        // Embedded document data
        window.EMBEDDED_DOCS = ${JSON.stringify(documentData, null, 2)};
        
        // Embedded configuration
        window.EMBEDDED_CONFIG = ${JSON.stringify(
          {
            ...config,
            source: {
              type: 'content',
              documents: documentData,
            },
          },
          null,
          2
        )};
    </script>
    
    <script>
        ${viewerScript}
        
        // Auto-initialize with embedded data
        if (typeof MarkdownDocsViewer !== 'undefined') {
            MarkdownDocsViewer.init({
                ...window.EMBEDDED_CONFIG,
                container: document.body
            }).then(() => {
                console.log('📚 Static documentation loaded successfully!');
            }).catch(error => {
                console.error('Failed to load documentation:', error);
            });
        }
    </script>
</body>
</html>`;

  // Write HTML file
  const outputFile = join(outputDir, 'index.html');
  await fs.writeFile(outputFile, options.minify ? minifyHTML(html) : html);
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | null {
  const lines = content.split('\\n');

  // Look for frontmatter title
  if (lines[0] === '---') {
    const frontmatterEnd = lines.findIndex((line, i) => i > 0 && line === '---');
    if (frontmatterEnd > 0) {
      const frontmatter = lines.slice(1, frontmatterEnd).join('\\n');
      const titleMatch = frontmatter.match(/^title:\\s*"?([^"\\n]+)"?/m);
      if (titleMatch) {
        return titleMatch[1];
      }
    }
  }

  // Look for first H1
  const h1Match = content.match(/^#\\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1];
  }

  return null;
}

/**
 * Basic HTML minification
 */
function minifyHTML(html: string): string {
  return html
    .replace(/\\n\\s*\\n/g, '\\n') // Remove empty lines
    .replace(/\\n\\s+/g, '\\n') // Remove leading whitespace
    .replace(/\\s+\\n/g, '\\n') // Remove trailing whitespace
    .replace(/\\s{2,}/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Copy static assets
 */
async function copyAssets(sourceDir: string, outputDir: string): Promise<void> {
  const assetsDir = join(sourceDir, 'assets');

  if (existsSync(assetsDir)) {
    const outputAssetsDir = join(outputDir, 'assets');
    await fs.mkdir(outputAssetsDir, { recursive: true });

    async function copyRecursive(src: string, dest: string): Promise<void> {
      const stat = await fs.stat(src);

      if (stat.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src);

        for (const entry of entries) {
          await copyRecursive(join(src, entry), join(dest, entry));
        }
      } else {
        await fs.copyFile(src, dest);
      }
    }

    await copyRecursive(assetsDir, outputAssetsDir);
  }
}

/**
 * Main build command implementation
 */
export async function buildCommand(options: BuildOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue('\\n🏗️  Building Static Documentation Site\\n'));

    // Configuration
    const projectDir = process.cwd();
    const outputDir = options.output ? join(projectDir, options.output) : join(projectDir, 'dist');
    const sourceDir = options.source || projectDir;
    const docsDir = join(sourceDir, 'docs');

    // Validate project structure
    if (!existsSync(join(projectDir, 'viewer', 'zero-config.umd.cjs'))) {
      console.log(chalk.red('❌ Viewer not found in project.'));
      console.log(chalk.gray('   Run "mdv upgrade" to install the viewer.'));
      return;
    }

    if (!existsSync(docsDir)) {
      console.log(chalk.red('❌ No docs/ directory found.'));
      console.log(chalk.gray('   Create docs/README.md to add content.'));
      return;
    }

    console.log(chalk.bold('Build Configuration:'));
    console.log(`  Source:  ${chalk.cyan(sourceDir)}`);
    console.log(`  Output:  ${chalk.cyan(outputDir)}`);
    console.log(`  Clean:   ${chalk.cyan(options.clean ? 'yes' : 'no')}`);
    console.log(`  Minify:  ${chalk.cyan(options.minify ? 'yes' : 'no')}`);
    console.log();

    // Clean output directory if requested
    if (options.clean !== false) {
      const spinner = ora('Cleaning output directory...').start();
      await cleanOutput(outputDir);
      spinner.succeed('Output directory cleaned');
    }

    // Load configuration
    const configSpinner = ora('Loading configuration...').start();
    const config = await loadConfig();
    configSpinner.succeed('Configuration loaded');

    // Discover documents
    const docsSpinner = ora('Discovering documents...').start();
    const documents = await discoverDocuments(docsDir);
    docsSpinner.succeed(`Found ${documents.length} documents`);

    if (documents.length === 0) {
      console.log(chalk.yellow('⚠️  No markdown files found in docs/ directory.'));
      console.log(chalk.gray('   Add some .md files and try again.'));
      return;
    }

    // Generate HTML
    const htmlSpinner = ora('Generating static HTML...').start();
    await generateHTML(documents, config, outputDir, options);
    htmlSpinner.succeed('Static HTML generated');

    // Copy assets
    const assetsSpinner = ora('Copying assets...').start();
    await copyAssets(sourceDir, outputDir);
    assetsSpinner.succeed('Assets copied');

    // Success message
    console.log(chalk.green('\\n🎉 Build completed successfully!\\n'));

    console.log(chalk.bold('Build Summary:'));
    console.log(chalk.cyan(`  Documents: ${documents.length} files processed`));
    console.log(chalk.cyan(`  Output: ${outputDir}`));
    console.log(chalk.cyan(`  Size: ${options.minify ? 'minified' : 'normal'}`));

    console.log();
    console.log(chalk.bold('Next Steps:'));
    console.log(chalk.cyan(`  cd ${relative(process.cwd(), outputDir)}`));
    console.log(chalk.cyan('  serve the index.html file with any web server'));
    console.log(chalk.cyan('  or upload the entire directory to your hosting provider'));

    console.log();
    console.log(chalk.gray('💡 Tip: Use "mdv serve" for local development'));
  } catch (error) {
    console.error(chalk.red('\\n❌ Build failed:'));
    console.error(error instanceof Error ? error.message : error);

    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
