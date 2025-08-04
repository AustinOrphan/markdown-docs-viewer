#!/usr/bin/env node
/**
 * Release Asset Build Script for Markdown Docs Viewer
 * Extends scripts/create-distribution.js to create release-ready ZIP files
 * Generates pre-built assets for GitHub releases
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  distDir: path.join(__dirname, '..', 'dist'),
  outputDir: path.join(__dirname, '..', 'distribution'),
  tempDir: path.join(__dirname, '..', 'temp-release'),
  projectRoot: path.join(__dirname, '..'),
  
  // Required files for release
  requiredFiles: [
    'zero-config.umd.cjs',
    'zero-config.es.js', 
    'index.d.ts'
  ],
  
  // Files to include in release ZIP
  releaseIncludes: [
    'zero-config.umd.cjs',
    'zero-config.es.js',
    'index.d.ts',
    'README.md',
    'LICENSE',
    'CHANGELOG.md'
  ],
  
  // Template files to generate
  templates: {
    'example.html': 'example-template.html',
    'docs-config.json': 'docs-config-template.json',
    'install.sh': '../install.sh'
  }
};

/**
 * Utility function to log with timestamps
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const levelColors = {
    info: '\x1b[36m',     // Cyan
    success: '\x1b[32m',  // Green
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    reset: '\x1b[0m'      // Reset
  };
  
  console.log(`${levelColors[level]}[${timestamp}] ${message}${levelColors.reset}`);
}

/**
 * Check if required build files exist
 */
async function validateBuildOutput() {
  log('Validating build output...');
  
  try {
    const distStats = await fs.stat(CONFIG.distDir);
    if (!distStats.isDirectory()) {
      throw new Error('dist directory not found');
    }
    
    const missingFiles = [];
    for (const file of CONFIG.requiredFiles) {
      const filePath = path.join(CONFIG.distDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile() || stats.size === 0) {
          missingFiles.push(file);
        }
      } catch (err) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing required build files: ${missingFiles.join(', ')}`);
    }
    
    log('✓ Build output validation passed', 'success');
    return true;
  } catch (error) {
    log(`Build validation failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Get project version and metadata
 */
async function getProjectMetadata() {
  log('Reading project metadata...');
  
  try {
    const packageJsonPath = path.join(CONFIG.projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Get Git commit info
    let commitHash = 'unknown';
    let commitDate = new Date().toISOString();
    
    try {
      commitHash = execSync('git rev-parse --short HEAD', { 
        cwd: CONFIG.projectRoot,
        encoding: 'utf8' 
      }).trim();
      
      commitDate = execSync('git log -1 --format=%cI', { 
        cwd: CONFIG.projectRoot,       
        encoding: 'utf8' 
      }).trim();
    } catch (gitError) {
      log('Git information not available', 'warn');
    }
    
    const metadata = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      commitHash,
      commitDate,
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    log(`✓ Project: ${metadata.name}@${metadata.version}`, 'success');
    log(`  Commit: ${metadata.commitHash}`);
    log(`  Build Date: ${metadata.buildDate}`);
    
    return metadata;
  } catch (error) {
    log(`Failed to read project metadata: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Generate checksums for files
 */
async function generateChecksums(files) {
  log('Generating file checksums...');
  
  const checksums = {};
  
  for (const [relativePath, absolutePath] of Object.entries(files)) {
    try {
      const content = await fs.readFile(absolutePath);
      const hash = crypto.createHash('sha256');
      hash.update(content);
      checksums[relativePath] = hash.digest('hex');
      
      log(`  ${relativePath}: ${checksums[relativePath].substring(0, 12)}...`);
    } catch (error) {
      log(`Failed to generate checksum for ${relativePath}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  log(`✓ Generated checksums for ${Object.keys(checksums).length} files`, 'success');
  return checksums;
}

/**
 * Create example HTML template
 */
async function createExampleTemplate(outputPath) {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Documentation</title>
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

    <!-- Load the zero-config bundle -->
    <script src="zero-config.umd.cjs"></script>
    <script>
        // Zero-config initialization
        window.addEventListener('DOMContentLoaded', function() {
            try {
                console.log('✓ Markdown Docs Viewer initialized');
            } catch (error) {
                console.error('Initialization failed:', error);
                document.body.innerHTML = \`
                    <div style="padding: 20px; color: #d73a49; font-family: monospace;">
                        <h2>❌ Initialization Error</h2>
                        <p>Failed to load the documentation viewer.</p>
                        <details>
                            <summary>Error Details</summary>
                            <pre>\${error.message}</pre>
                        </details>
                        <p><strong>Quick Fix:</strong></p>
                        <ol>
                            <li>Create a <code>docs/</code> directory</li>
                            <li>Add a <code>docs/README.md</code> file</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;
  
  await fs.writeFile(outputPath, template, 'utf8');
}

/**
 * Create docs-config.json template
 */
async function createConfigTemplate(outputPath) {
  const config = {
    title: "My Documentation",
    description: "Documentation powered by Markdown Docs Viewer",
    theme: "default-light",
    source: {
      type: "local",
      basePath: "docs"
    },
    search: {
      enabled: true,
      placeholder: "Search documentation..."
    },
    navigation: {
      enabled: true,
      collapsed: false
    },
    toc: {
      enabled: true,
      maxDepth: 3
    },
    mobile: {
      enabled: true,
      breakpoint: 768
    }
  };
  
  await fs.writeFile(outputPath, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Create release manifest
 */
async function createReleaseManifest(metadata, checksums, outputPath) {
  log('Creating release manifest...');
  
  const manifest = {
    version: metadata.version,
    name: metadata.name,
    description: metadata.description,
    buildInfo: {
      commitHash: metadata.commitHash,
      commitDate: metadata.commitDate,
      buildDate: metadata.buildDate,
      nodeVersion: metadata.nodeVersion,
      platform: metadata.platform,
      arch: metadata.arch
    },
    assets: {},
    checksums,
    installation: {
      quickStart: [
        "1. Download and extract the release ZIP file",
        "2. Copy zero-config.umd.cjs to your project directory", 
        "3. Create an HTML file that includes the script",
        "4. Create a docs/ directory with markdown files",
        "5. Open the HTML file in your browser"
      ],
      requirements: [
        "Modern web browser (Chrome 88+, Firefox 85+, Safari 14+)",
        "Local web server (for loading local markdown files)",
        "No Node.js or build tools required"
      ]
    }
  };
  
  // Add asset information
  for (const [relativePath, checksum] of Object.entries(checksums)) {
    const assetPath = path.join(CONFIG.outputDir, relativePath);
    try {
      const stats = await fs.stat(assetPath);
      manifest.assets[relativePath] = {
        size: stats.size,
        checksum,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      log(`Warning: Could not get stats for ${relativePath}`, 'warn');
    }
  }
  
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
  log('✓ Release manifest created', 'success');
}

/**
 * Create ZIP archive
 */
async function createZipArchive(sourceDir, outputPath, metadata) {
  log(`Creating ZIP archive: ${path.basename(outputPath)}`);
  
  return new Promise((resolve, reject) => {
    const output = require('fs').createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      log(`✓ ZIP created: ${sizeMB}MB`, 'success');
      resolve();
    });
    
    archive.on('error', (err) => {
      log(`ZIP creation failed: ${err.message}`, 'error');
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add all files from source directory
    archive.directory(sourceDir, false);
    
    // Add metadata as comment
    archive.comment = `Markdown Docs Viewer v${metadata.version} - Built ${metadata.buildDate}`;
    
    archive.finalize();
  });
}

/**
 * Copy installation script
 */
async function copyInstallScript(outputDir) {
  const sourcePath = path.join(CONFIG.projectRoot, 'install.sh');
  const targetPath = path.join(outputDir, 'install.sh');
  
  try {
    await fs.copyFile(sourcePath, targetPath);
    // Make executable
    await fs.chmod(targetPath, 0o755);
    log('✓ Installation script copied', 'success');
  } catch (error) {
    log(`Warning: Could not copy install script: ${error.message}`, 'warn');
  }
}

/**
 * Main build process
 */
async function buildReleaseAssets() {
  const startTime = Date.now();
  
  try {
    log('🚀 Starting release asset build process...');
    
    // Step 1: Validate build output
    if (!(await validateBuildOutput())) {
      throw new Error('Build validation failed');
    }
    
    // Step 2: Get project metadata
    const metadata = await getProjectMetadata();
    
    // Step 3: Clean and create output directories
    log('Setting up output directories...');
    try {
      await fs.rm(CONFIG.outputDir, { recursive: true, force: true });
      await fs.rm(CONFIG.tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors for non-existent directories
    }
    
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    await fs.mkdir(CONFIG.tempDir, { recursive: true });
    
    // Step 4: Copy build assets to temp directory
    log('Copying build assets...');
    const filesToCopy = {};
    
    for (const file of CONFIG.requiredFiles) {
      const sourcePath = path.join(CONFIG.distDir, file);
      const targetPath = path.join(CONFIG.tempDir, file);
      await fs.copyFile(sourcePath, targetPath);
      filesToCopy[file] = targetPath;
    }
    
    // Step 5: Copy additional files (README, LICENSE, etc.)
    for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
      const sourcePath = path.join(CONFIG.projectRoot, file);
      const targetPath = path.join(CONFIG.tempDir, file);
      try {
        await fs.copyFile(sourcePath, targetPath);
        filesToCopy[file] = targetPath;
      } catch (error) {
        log(`Optional file not found: ${file}`, 'warn');
      }
    }
    
    // Step 6: Create template files
    log('Creating template files...');
    await createExampleTemplate(path.join(CONFIG.tempDir, 'example.html'));
    await createConfigTemplate(path.join(CONFIG.tempDir, 'docs-config.json'));
    filesToCopy['example.html'] = path.join(CONFIG.tempDir, 'example.html');
    filesToCopy['docs-config.json'] = path.join(CONFIG.tempDir, 'docs-config.json');
    
    // Step 7: Copy installation script
    await copyInstallScript(CONFIG.tempDir);
    filesToCopy['install.sh'] = path.join(CONFIG.tempDir, 'install.sh');
    
    // Step 8: Generate checksums
    const checksums = await generateChecksums(filesToCopy);
    
    // Step 9: Create release manifest
    const manifestPath = path.join(CONFIG.tempDir, 'release-manifest.json');
    await createReleaseManifest(metadata, checksums, manifestPath);
    
    // Step 10: Create ZIP archives
    log('Creating release archives...');
    
    // Complete release ZIP
    const completeZipName = `markdown-docs-viewer-v${metadata.version}-complete.zip`;
    const completeZipPath = path.join(CONFIG.outputDir, completeZipName);
    await createZipArchive(CONFIG.tempDir, completeZipPath, metadata);
    
    // Minimal release ZIP (just viewer files)
    const minimalTempDir = path.join(CONFIG.tempDir, '..', 'temp-minimal');
    await fs.mkdir(minimalTempDir, { recursive: true });
    
    // Copy only essential files to minimal release
    const minimalFiles = ['zero-config.umd.cjs', 'index.d.ts', 'example.html'];
    for (const file of minimalFiles) {
      const sourcePath = path.join(CONFIG.tempDir, file);
      const targetPath = path.join(minimalTempDir, file);
      await fs.copyFile(sourcePath, targetPath);
    }
    
    const minimalZipName = `markdown-docs-viewer-v${metadata.version}-minimal.zip`;
    const minimalZipPath = path.join(CONFIG.outputDir, minimalZipName);
    await createZipArchive(minimalTempDir, minimalZipPath, metadata);
    
    // Step 11: Copy individual files to output directory
    log('Copying individual assets...');
    for (const file of CONFIG.requiredFiles) {
      const sourcePath = path.join(CONFIG.tempDir, file);
      const targetPath = path.join(CONFIG.outputDir, file);
      await fs.copyFile(sourcePath, targetPath);
    }
    
    // Copy manifest to output
    await fs.copyFile(manifestPath, path.join(CONFIG.outputDir, 'release-manifest.json'));
    
    // Step 12: Clean up temporary directories
    await fs.rm(CONFIG.tempDir, { recursive: true, force: true });
    await fs.rm(minimalTempDir, { recursive: true, force: true });
    
    // Step 13: Generate summary
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('📦 Release asset build completed!', 'success');
    log(`   Build time: ${buildTime}s`);
    log(`   Output directory: ${CONFIG.outputDir}`);
    log(`   Complete release: ${completeZipName}`);
    log(`   Minimal release: ${minimalZipName}`);
    log(`   Individual files: ${CONFIG.requiredFiles.length} files`);
    
    return {
      success: true,
      metadata,
      outputs: {
        completeZip: completeZipPath,
        minimalZip: minimalZipPath,
        outputDir: CONFIG.outputDir
      },
      buildTime: parseFloat(buildTime)
    };
    
  } catch (error) {
    log(`❌ Release asset build failed: ${error.message}`, 'error');
    
    // Clean up on failure
    try {
      await fs.rm(CONFIG.tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  buildReleaseAssets()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Build failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  buildReleaseAssets,
  validateBuildOutput,
  getProjectMetadata,
  generateChecksums,
  createReleaseManifest
};