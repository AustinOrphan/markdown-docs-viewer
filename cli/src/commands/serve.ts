/**
 * Serve Command - Local development server
 * Implements "mdv serve" functionality
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { existsSync } from 'fs';

// Types
interface ServeOptions {
  port?: number;
  host?: string;
  open?: boolean;
  watch?: boolean;
  config?: string;
}

/**
 * Find available port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');

  return new Promise(resolve => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/**
 * Start HTTP server
 */
async function startServer(
  projectDir: string,
  port: number,
  host: string,
  options: ServeOptions
): Promise<void> {
  const http = await import('http');
  const path = await import('path');
  const url = await import('url');

  // MIME types for common files
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url || '/', true);
      let pathname = parsedUrl.pathname || '/';

      // Remove query string and decode
      pathname = decodeURIComponent(pathname);

      // Security: prevent directory traversal
      if (pathname.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // Default to index.html for root
      if (pathname === '/') {
        pathname = '/index.html';
      }

      const filePath = path.join(projectDir, pathname);

      // Check if file exists
      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      // Get file stats
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // Try to serve index.html from directory
        const indexPath = path.join(filePath, 'index.html');
        if (existsSync(indexPath)) {
          const content = await fs.readFile(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end('Directory listing not allowed');
        }
        return;
      }

      // Determine content type
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      // CORS headers for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Cache control for development
      if (ext === '.md' || ext === '.json') {
        res.setHeader('Cache-Control', 'no-cache');
      }

      // Read and serve file
      const content = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  server.listen(port, host, () => {
    console.log(chalk.green(`\\n🚀 Server running at http://${host}:${port}\\n`));

    console.log(chalk.bold('Available URLs:'));
    console.log(chalk.cyan(`  Local:    http://localhost:${port}`));

    if (host !== 'localhost' && host !== '127.0.0.1') {
      console.log(chalk.cyan(`  Network:  http://${host}:${port}`));
    }

    console.log();
    console.log(chalk.gray('Press Ctrl+C to stop the server'));

    // Auto-open browser if requested
    if (options.open) {
      const open = require('open');
      open(`http://localhost:${port}`).catch(() => {
        console.log(chalk.yellow('⚠️  Could not open browser automatically'));
      });
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\\n\\n🛑 Shutting down server...'));
    server.close(() => {
      console.log(chalk.green('✅ Server stopped'));
      process.exit(0);
    });
  });
}

/**
 * Setup file watching
 */
async function setupWatching(projectDir: string): Promise<void> {
  try {
    const chokidar = await import('chokidar');

    const watcher = chokidar.watch(
      [
        join(projectDir, 'docs/**/*.md'),
        join(projectDir, 'docs-config.json'),
        join(projectDir, '*.html'),
      ],
      {
        ignored: /(^|[\\/\\\\])\\../,
        persistent: true,
      }
    );

    watcher.on('change', path => {
      console.log(chalk.blue(`📝 Changed: ${path.replace(projectDir, '.')}`));
      console.log(chalk.gray('   Refresh your browser to see changes'));
    });

    watcher.on('add', path => {
      console.log(chalk.green(`✨ Added: ${path.replace(projectDir, '.')}`));
    });

    watcher.on('unlink', path => {
      console.log(chalk.red(`🗑️  Removed: ${path.replace(projectDir, '.')}`));
    });

    console.log(chalk.blue('👀 Watching for file changes...'));
  } catch {
    console.log(
      chalk.yellow('⚠️  File watching not available (install chokidar for this feature)')
    );
  }
}

/**
 * Main serve command implementation
 */
export async function serveCommand(options: ServeOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue('\\n🌐 Starting Development Server\\n'));

    // Check if we're in a project directory
    const projectDir = process.cwd();
    const indexPath = join(projectDir, 'index.html');

    if (!existsSync(indexPath)) {
      console.log(chalk.red('❌ No index.html found in current directory.'));
      console.log(chalk.gray('   Run this command from your project root.'));
      console.log(chalk.gray('   Use "mdv init" to create a new project.'));
      return;
    }

    // Configuration
    const host = options.host || 'localhost';
    const requestedPort = options.port || 3000;
    const port = await findAvailablePort(requestedPort);

    if (port !== requestedPort) {
      console.log(chalk.yellow(`⚠️  Port ${requestedPort} is busy, using ${port} instead`));
    }

    // Check project structure
    const docsDir = join(projectDir, 'docs');
    const viewerDir = join(projectDir, 'viewer');

    if (!existsSync(docsDir)) {
      console.log(chalk.yellow('⚠️  No docs/ directory found'));
      console.log(chalk.gray('   Create docs/README.md to add content'));
    }

    if (!existsSync(viewerDir)) {
      console.log(chalk.yellow('⚠️  No viewer/ directory found'));
      console.log(chalk.gray('   Run "mdv upgrade" to install the viewer'));
    }

    // Setup file watching if requested
    if (options.watch !== false) {
      await setupWatching(projectDir);
    }

    // Start server
    await startServer(projectDir, port, host, options);
  } catch (error) {
    console.error(chalk.red('\\n❌ Failed to start server:'));
    console.error(error instanceof Error ? error.message : error);

    if (process.env.MDV_VERBOSE === 'true' && error instanceof Error) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
