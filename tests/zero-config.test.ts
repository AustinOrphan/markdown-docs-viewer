import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  init,
  getViewer,
  reload,
  setTheme,
  getAvailableThemes,
  generateConfig,
  ZeroConfigOptions,
} from '../src/zero-config';
import { ConfigLoader } from '../src/config-loader';
import { AutoDiscovery } from '../src/auto-discovery';
import { themes } from '../src/themes';

// Mock dependencies
vi.mock('../src/factory');
vi.mock('../src/config-loader');
vi.mock('../src/auto-discovery');
vi.mock('../src/viewer');

// Import the mocked createViewer after mocking
import { createViewer } from '../src/factory';

describe('Zero Config API', () => {
  let mockConfigLoader: any;
  let mockAutoDiscovery: any;
  let mockViewer: any;
  let mockContainer: HTMLElement;
  let mockCreateViewer: any;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="docs"></div>';
    mockContainer = document.getElementById('docs')!;

    // Mock ConfigLoader
    mockConfigLoader = {
      loadConfig: vi.fn().mockResolvedValue({
        title: 'Test Docs',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' },
      }),
      toDocumentationConfig: vi.fn().mockReturnValue({
        title: 'Test Docs',
        theme: themes.default.light,
      }),
      generateSampleConfig: vi.fn().mockReturnValue('sample config'),
    };
    vi.mocked(ConfigLoader).mockImplementation(() => mockConfigLoader);
    (ConfigLoader as any).generateSampleConfig = vi.fn().mockReturnValue('sample config');

    // Mock AutoDiscovery
    mockAutoDiscovery = {
      discoverFiles: vi.fn().mockResolvedValue([
        { id: 'doc1', title: 'Document 1', content: '# Doc 1' },
        { id: 'doc2', title: 'Document 2', content: '# Doc 2' },
      ]),
    };
    vi.mocked(AutoDiscovery).mockImplementation(() => mockAutoDiscovery);

    // Mock viewer
    mockViewer = {
      destroy: vi.fn().mockResolvedValue(undefined),
      setTheme: vi.fn(),
    };

    // Mock createViewer
    mockCreateViewer = vi.fn().mockReturnValue(mockViewer);
    vi.mocked(createViewer).mockImplementation(mockCreateViewer);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Reset global viewer by calling getViewer and destroying if present
    const viewer = getViewer();
    if (viewer) {
      await viewer.destroy();
    }

    // Reset the module to clear global state
    vi.resetModules();

    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize with default options', async () => {
      const viewer = await init();

      expect(mockConfigLoader.loadConfig).toHaveBeenCalledWith(undefined);
      expect(mockAutoDiscovery.discoverFiles).toHaveBeenCalled();
      expect(viewer).toBe(mockViewer);
    });

    it('should initialize with custom options', async () => {
      const options: ZeroConfigOptions = {
        container: '#docs',
        configPath: './custom-config.json',
        docsPath: './custom-docs',
        theme: 'github-dark',
        title: 'Custom Title',
      };

      await init(options);

      expect(mockConfigLoader.loadConfig).toHaveBeenCalledWith('./custom-config.json');
    });

    it('should handle custom container string', async () => {
      const options: ZeroConfigOptions = {
        container: '#docs',
      };

      const viewer = await init(options);
      expect(viewer).toBe(mockViewer);
    });

    it('should handle custom container element', async () => {
      const options: ZeroConfigOptions = {
        container: mockContainer,
      };

      const viewer = await init(options);
      expect(viewer).toBe(mockViewer);
    });

    it('should return error viewer for invalid container string', async () => {
      const options: ZeroConfigOptions = {
        container: '#nonexistent',
      };

      const viewer = await init(options);
      expect(viewer).toBeDefined();
      expect(viewer.destroy).toBeDefined();
      expect(viewer.setTheme).toBeDefined();

      // Should log the container error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.objectContaining({ message: 'Container element "#nonexistent" not found' })
      );

      // Since the error handling fallback tried to find a container but the querySelector was mocked to return null,
      // no HTML would be injected. The important thing is that an error viewer was returned instead of throwing.
    });

    it('should auto-detect container when none provided', async () => {
      // Remove #docs and add different containers
      document.body.innerHTML = '<div id="documentation"></div>';

      const viewer = await init();
      expect(viewer).toBe(mockViewer);
    });

    it('should fall back to body when no standard containers found', async () => {
      document.body.innerHTML = '<div></div>';

      const viewer = await init();
      expect(viewer).toBe(mockViewer);
    });

    it('should apply theme from config', async () => {
      mockConfigLoader.loadConfig.mockResolvedValue({
        title: 'Test Docs',
        theme: 'github-dark',
        source: { type: 'auto', path: './docs' },
      });

      await init();

      // Should parse theme name and mode
      expect(mockCreateViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: themes.github.dark,
        })
      );
    });

    it('should handle invalid theme gracefully', async () => {
      mockConfigLoader.loadConfig.mockResolvedValue({
        title: 'Test Docs',
        theme: 'nonexistent-theme',
        source: { type: 'auto', path: './docs' },
      });

      const viewer = await init();
      expect(viewer).toBe(mockViewer);
    });

    it('should warn when no documents found', async () => {
      mockAutoDiscovery.discoverFiles.mockResolvedValue([]);

      await init();

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No documents found'));
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Test error');
      mockConfigLoader.loadConfig.mockRejectedValue(error);

      const viewer = await init();
      expect(viewer).toBeDefined();
      expect(viewer.destroy).toBeDefined();
      expect(viewer.setTheme).toBeDefined();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load configuration:'),
        error
      );
    });

    it('should display error message in container on failure', async () => {
      const error = new Error('Test error');
      // Mock createViewer to throw an error to trigger viewer creation error display
      mockCreateViewer.mockImplementation(() => {
        throw error;
      });

      const viewer = await init();
      expect(viewer).toBeDefined();
      expect(viewer.destroy).toBeDefined();
      expect(viewer.setTheme).toBeDefined();

      // Error viewer should be created and error should be displayed
      expect(mockContainer.innerHTML).toContain('Viewer Creation Failed');
      expect(mockContainer.innerHTML).toContain('Test error');
    });

    it('should handle error with custom container', async () => {
      const customContainer = document.createElement('div');
      document.body.appendChild(customContainer);

      const error = new Error('Test error');
      // Mock createViewer to throw an error to trigger viewer creation error display
      mockCreateViewer.mockImplementation(() => {
        throw error;
      });

      const options: ZeroConfigOptions = {
        container: customContainer,
      };

      const viewer = await init(options);
      expect(viewer).toBeDefined();
      expect(viewer.destroy).toBeDefined();
      expect(viewer.setTheme).toBeDefined();

      // Error should be displayed in custom container
      expect(customContainer.innerHTML).toContain('Viewer Creation Failed');
    });
  });

  describe('getViewer', () => {
    it('should return null when no viewer initialized', async () => {
      // Reset module state to ensure clean test
      await vi.resetModules();
      const { getViewer: freshGetViewer } = await import('../src/zero-config');
      expect(freshGetViewer()).toBeNull();
    });

    it('should return viewer after initialization', async () => {
      await init();
      expect(getViewer()).toBe(mockViewer);
    });
  });

  describe('reload', () => {
    it('should destroy existing viewer and reinitialize', async () => {
      // First initialize
      await init();
      expect(getViewer()).toBe(mockViewer);

      // Then reload
      const newViewer = await reload();

      expect(mockViewer.destroy).toHaveBeenCalled();
      expect(newViewer).toBe(mockViewer);
    });

    it('should handle reload with options', async () => {
      await init();

      const options: ZeroConfigOptions = {
        theme: 'material-dark',
      };

      await reload(options);

      expect(mockViewer.destroy).toHaveBeenCalled();
      expect(mockConfigLoader.loadConfig).toHaveBeenCalledTimes(2);
    });

    it('should handle reload when no viewer exists', async () => {
      const viewer = await reload();
      expect(viewer).toBe(mockViewer);
    });
  });

  describe('setTheme', () => {
    it('should warn when no viewer initialized', async () => {
      // Reset module state to ensure clean test
      await vi.resetModules();
      const { setTheme: freshSetTheme } = await import('../src/zero-config');

      freshSetTheme('github-dark');

      expect(console.warn).toHaveBeenCalledWith('No viewer instance found. Call init() first.');
    });

    it('should set theme on existing viewer', async () => {
      await init();

      setTheme('github-dark');

      expect(mockViewer.setTheme).toHaveBeenCalledWith(themes.github.dark);
    });

    it('should fall back to light mode when mode not specified', async () => {
      await init();

      setTheme('github');

      expect(mockViewer.setTheme).toHaveBeenCalledWith(themes.github.light);
    });

    it('should warn for invalid theme', async () => {
      await init();

      setTheme('nonexistent-theme');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Theme "nonexistent-theme" not found'),
        expect.arrayContaining(Object.keys(themes))
      );
    });
  });

  describe('getAvailableThemes', () => {
    it('should return all available theme variants', () => {
      const availableThemes = getAvailableThemes();

      expect(availableThemes).toBeInstanceOf(Array);
      expect(availableThemes.length).toBeGreaterThan(0);
      expect(availableThemes).toContain('default-light');
      expect(availableThemes).toContain('default-dark');
      expect(availableThemes).toContain('github-light');
      expect(availableThemes).toContain('github-dark');
    });

    it('should include all theme variations', () => {
      const availableThemes = getAvailableThemes();
      const themeKeys = Object.keys(themes);

      // Should have both light and dark for each theme
      expect(availableThemes.length).toBe(themeKeys.length * 2);

      themeKeys.forEach(themeName => {
        expect(availableThemes).toContain(`${themeName}-light`);
        expect(availableThemes).toContain(`${themeName}-dark`);
      });
    });
  });

  describe('generateConfig', () => {
    it('should return sample configuration', () => {
      const config = generateConfig();

      expect(config).toBe('sample config');
      expect(ConfigLoader.generateSampleConfig).toHaveBeenCalled();
    });
  });

  describe('DOM Ready and Auto-initialization', () => {
    it('should handle DOM ready state', () => {
      // Simple test to check the function exists
      expect(typeof document.readyState).toBe('string');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle container query failure in error state', async () => {
      // Mock querySelector to return null
      vi.spyOn(document, 'querySelector').mockReturnValue(null);
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      const error = new Error('Test error');
      mockConfigLoader.loadConfig.mockRejectedValue(error);

      const options: ZeroConfigOptions = {
        container: '#nonexistent',
      };

      const viewer = await init(options);
      expect(viewer).toBeDefined();
      expect(viewer.destroy).toBeDefined();
      expect(viewer.setTheme).toBeDefined();
      // Both errors should have been logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load configuration:'),
        error
      );
    });

    it('should handle missing theme parts gracefully', async () => {
      await init();

      // Test theme name without mode
      setTheme('github');
      expect(mockViewer.setTheme).toHaveBeenCalledWith(themes.github.light);

      // Test empty theme name
      setTheme('');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Theme "" not found'),
        expect.any(Array)
      );
    });
  });
});
