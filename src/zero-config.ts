/**
 * Zero-configuration entry point for the markdown documentation viewer
 * Provides the simplest possible API for users
 */

import { createViewer } from './factory';
import { MarkdownDocsViewer } from './viewer';
import { ConfigLoader } from './config-loader';
import { AutoDiscovery } from './auto-discovery';
import { themes } from './themes';
import { escapeHtml } from './utils';

export interface ZeroConfigOptions {
  container?: string | HTMLElement;
  configPath?: string;
  docsPath?: string;
  theme?: string;
  title?: string;
}

/**
 * Global instance for singleton pattern
 */
let globalViewer: MarkdownDocsViewer | null = null;

/**
 * The main zero-config initialization function
 * This is what users call to get started with minimal setup
 */
export async function init(options: ZeroConfigOptions = {}): Promise<MarkdownDocsViewer> {
  try {
    console.log('🚀 Initializing Markdown Docs Viewer...');

    // 1. Load configuration
    const configLoader = new ConfigLoader();
    let config;
    try {
      config = await configLoader.loadConfig(options.configPath);
    } catch (configError) {
      console.error('Failed to load configuration:', configError);
      // Provide default config as fallback
      config = {
        title: 'Documentation',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' },
      };
    }

    // Override config with any provided options
    if (options.docsPath) config.source!.path = options.docsPath;
    if (options.theme) config.theme = options.theme;
    if (options.title) config.title = options.title;

    console.log(`📋 Configuration loaded - Title: "${config.title}", Theme: "${config.theme}"`);

    // 2. Auto-discover documents if using auto mode
    let documents: any[] = [];
    if (config.source?.type === 'auto' || !config.source?.type) {
      console.log(`📁 Auto-discovering documents in: ${config.source?.path}`);
      const discovery = new AutoDiscovery({
        basePath: config.source?.path || './docs',
        exclude: config.source?.exclude,
      });
      try {
        documents = await discovery.discoverFiles();
        console.log(`📚 Found ${documents.length} documents`);
      } catch (discoveryError) {
        console.error('Failed to discover documents:', discoveryError);
        // Provide empty documents array as fallback
        documents = [];
        console.log(`📚 Using empty documents array as fallback`);
      }
    }

    // 3. Convert config to DocumentationConfig format
    const viewerConfig = {
      ...configLoader.toDocumentationConfig(),
      source: {
        type: 'content' as const,
        documents,
      },
    };

    // 4. Apply theme
    if (config.theme) {
      const [themeName, mode] = config.theme.split('-');
      const themeObj = themes[themeName as keyof typeof themes];
      if (themeObj) {
        viewerConfig.theme = themeObj[mode as 'light' | 'dark'] || themeObj.light;
      }
    }

    // 5. Determine container
    let container: HTMLElement;
    if (options.container) {
      if (typeof options.container === 'string') {
        const element = document.querySelector(options.container);
        if (!element) {
          throw new Error(`Container element "${options.container}" not found`);
        }
        container = element as HTMLElement;
      } else {
        container = options.container;
      }
    } else {
      // Auto-detect container
      container =
        document.getElementById('docs') ||
        document.getElementById('documentation') ||
        document.querySelector('.docs') ||
        document.querySelector('.documentation') ||
        document.body;
    }

    // 6. Create and initialize viewer
    console.log(
      `🎯 Creating viewer in container: ${container.tagName}${container.id ? '#' + container.id : ''}${container.className ? '.' + container.className.split(' ').join('.') : ''}`
    );

    let viewer;
    try {
      viewer = createViewer({
        container,
        ...viewerConfig,
      });
    } catch (viewerError) {
      console.error('Failed to create viewer:', viewerError);
      // Fallback: dynamic no-op proxy that still matches MarkdownDocsViewer
      const handler: ProxyHandler<any> = {
        get(target, prop) {
          if (prop === 'container') return container; // real container for error UI
          return () => {}; // no-op for everything else
        },
      };
      viewer = new Proxy({}, handler) as MarkdownDocsViewer;

      // Display error in container but don't throw - let init() continue and return the viewer
      if (container) {
        container.innerHTML = `
          <div style="padding: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
            <h2 style="color: #dc3545; margin-bottom: 1rem;">❌ Viewer Creation Failed</h2>
            <p style="margin-bottom: 1rem;">Failed to create the documentation viewer.</p>
            <details style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 0.5rem;">
              <summary style="cursor: pointer; font-weight: 600;">🔍 Error Details</summary>
              <pre style="margin-top: 1rem; font-size: 0.875rem; white-space: pre-wrap;">${escapeHtml((viewerError as Error).stack || String(viewerError))}</pre>
            </details>
          </div>
        `;
      }
    }

    // Store global reference
    globalViewer = viewer;

    // 7. Add helpful console messages
    console.log('✅ Markdown Docs Viewer initialized successfully!');
    console.log('📖 Available commands:');
    console.log('  - MarkdownDocsViewer.getViewer() - Get current viewer instance');
    console.log('  - MarkdownDocsViewer.reload() - Reload documents');
    console.log('  - MarkdownDocsViewer.setTheme(theme) - Change theme');

    if (documents.length === 0) {
      console.warn(
        '⚠️  No documents found. Make sure your markdown files are in the correct location.'
      );
      console.log(`   Looking in: ${config.source?.path}`);
      console.log('   Try adding a README.md file to get started.');
    }

    return viewer;
  } catch (error) {
    console.error('❌ Failed to initialize Markdown Docs Viewer:', error);

    // Show helpful error message in the container
    const container = options.container
      ? typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container
      : document.getElementById('docs') || document.body;

    if (container) {
      container.innerHTML = `
        <div style="padding: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
          <h2 style="color: #dc3545; margin-bottom: 1rem;">📋 Markdown Docs Viewer - Setup Required</h2>
          <p style="margin-bottom: 1rem;">The documentation viewer couldn't find any markdown files to display.</p>
          
          <h3 style="margin: 2rem 0 1rem 0;">🚀 Quick Setup:</h3>
          <ol style="line-height: 1.6; padding-left: 1.5rem;">
            <li>Create a <code style="background: #f8f9fa; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">docs/</code> folder in your project</li>
            <li>Add a <code style="background: #f8f9fa; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">README.md</code> file with your content</li>
            <li>Refresh the page</li>
          </ol>
          
          <h3 style="margin: 2rem 0 1rem 0;">📁 Expected Structure:</h3>
          <pre style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;"><code>your-project/
├── docs/
│   ├── README.md
│   ├── getting-started.md
│   └── api/
│       └── reference.md
└── index.html</code></pre>
          
          <h3 style="margin: 2rem 0 1rem 0;">🔧 Need Help?</h3>
          <p style="margin: 0;">
            <a href="https://github.com/AustinOrphan/markdown-docs-viewer" target="_blank" style="color: #0969da;">
              View documentation and examples →
            </a>
          </p>
          
          <details style="margin-top: 2rem; padding: 1rem; background: #fff3cd; border-radius: 0.5rem;">
            <summary style="cursor: pointer; font-weight: 600;">🔍 Technical Details</summary>
            <pre style="margin-top: 1rem; font-size: 0.875rem; white-space: pre-wrap;">${escapeHtml((error as Error).stack || String(error))}</pre>
          </details>
        </div>
      `;
    }

    // Fallback: dynamic no-op proxy that still satisfies MarkdownDocsViewer
    const errorHandler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === 'container') return container; // let error UI render
        return () => {}; // noop for everything else
      },
    };
    const errorViewer = new Proxy({}, errorHandler) as MarkdownDocsViewer;

    // Store global reference to the error viewer
    globalViewer = errorViewer;

    return errorViewer;
  }
}

/**
 * Gets the current global viewer instance
 */
export function getViewer(): MarkdownDocsViewer | null {
  return globalViewer;
}

/**
 * Reloads the documentation
 */
export async function reload(options: ZeroConfigOptions = {}): Promise<MarkdownDocsViewer> {
  if (globalViewer) {
    await globalViewer.destroy();
  }
  return init(options);
}

/**
 * Changes the theme
 */
export function setTheme(themeName: string): void {
  if (!globalViewer) {
    console.warn('No viewer instance found. Call init() first.');
    return;
  }

  const [name, mode] = themeName.split('-');
  const themeObj = themes[name as keyof typeof themes];
  if (themeObj) {
    const theme = themeObj[mode as 'light' | 'dark'] || themeObj.light;
    globalViewer.setTheme(theme);
  } else {
    console.warn(`Theme "${themeName}" not found. Available themes:`, Object.keys(themes));
  }
}

/**
 * Gets available themes
 */
export function getAvailableThemes(): string[] {
  const themeNames: string[] = [];
  Object.keys(themes).forEach(baseName => {
    themeNames.push(`${baseName}-light`, `${baseName}-dark`);
  });
  return themeNames;
}

/**
 * Generates a sample configuration file
 */
export function generateConfig(): string {
  return ConfigLoader.generateSampleConfig();
}

/**
 * DOM ready helper
 */
function onDOMReady(callback: () => void): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Auto-initialization when script loads (optional)
 * Users can disable this by setting window.MarkdownDocsViewer.autoInit = false
 */
onDOMReady(() => {
  // Check if we're in a test environment and skip auto-init
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }

  // Check if auto-init is disabled
  if ((window as any).MarkdownDocsViewer?.autoInit === false) {
    return;
  }

  // Auto-init if there's a #docs element and no manual init has been called
  const docsElement = document.getElementById('docs');
  if (docsElement && !globalViewer) {
    console.log('🔄 Auto-initializing Markdown Docs Viewer...');
    init().catch(() => {
      console.log('Auto-initialization failed, manual init() call required.');
    });
  }
});

// Export everything for global access
export default {
  init,
  getViewer,
  reload,
  setTheme,
  getAvailableThemes,
  generateConfig,
  themes,
  autoInit: true, // Can be set to false to disable auto-init
};
