#!/usr/bin/env node

/**
 * Distribution builder for zero-config component
 * Creates a distributable package with all necessary files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createDistribution() {
  console.log('📦 Creating distribution package...');
  console.log('Root directory:', rootDir);

  const distDir = path.join(rootDir, 'distribution');

  // Clean and create distribution directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy essential files
  const filesToCopy = [
    { src: 'dist/zero-config.umd.cjs', dest: 'zero-config.umd.cjs' },
    { src: 'dist/zero-config.es.js', dest: 'zero-config.es.js' },
    { src: 'examples/zero-config.html', dest: 'example.html' },
    { src: 'examples/docs-config.json', dest: 'docs-config.json' },
    { src: 'COMPONENT-USAGE.md', dest: 'README.md' },
  ];

  for (const file of filesToCopy) {
    const srcPath = path.join(rootDir, file.src);
    const destPath = path.join(distDir, file.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file.src} → distribution/${file.dest}`);
    } else {
      console.log(`⚠️  Missing ${file.src}, skipping...`);
    }
  }

  // Create example docs directory
  const exampleDocsDir = path.join(distDir, 'docs');
  fs.mkdirSync(exampleDocsDir);

  // Copy example docs
  const exampleDocs = [
    { src: 'examples/docs/README.md', dest: 'docs/README.md' },
    { src: 'examples/docs/getting-started.md', dest: 'docs/getting-started.md' },
  ];

  for (const doc of exampleDocs) {
    const srcPath = path.join(rootDir, doc.src);
    const destPath = path.join(distDir, doc.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${doc.src} → distribution/${doc.dest}`);
    }
  }

  // Create version info
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const versionInfo = {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    built: new Date().toISOString(),
    files: {
      'zero-config.umd.cjs': 'Main UMD bundle for browser usage',
      'zero-config.es.js': 'ES module bundle for modern bundlers',
      'example.html': 'Complete working example',
      'docs-config.json': 'Example configuration file',
      'docs/': 'Example markdown documentation',
      'README.md': 'Complete usage guide',
    },
    quickStart: [
      '1. Place zero-config.umd.cjs in your project',
      '2. Create a docs/ folder with your markdown files',
      '3. Include the script in your HTML',
      '4. Call MarkdownDocsViewer.init()',
      '5. Done! See README.md for full details',
    ],
  };

  fs.writeFileSync(path.join(distDir, 'package-info.json'), JSON.stringify(versionInfo, null, 2));

  console.log('✨ Distribution package created in ./distribution/');
  console.log('\nContents:');
  console.log('- zero-config.umd.cjs (main component)');
  console.log('- zero-config.es.js (ES module)');
  console.log('- example.html (working example)');
  console.log('- docs-config.json (configuration template)');
  console.log('- docs/ (example documentation)');
  console.log('- README.md (usage guide)');
  console.log('- package-info.json (version and info)');

  console.log('\n🎯 Ready for distribution!');
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-distribution.js')) {
  createDistribution().catch(error => {
    console.error('❌ Error creating distribution:', error);
    process.exit(1);
  });
}

export { createDistribution };
