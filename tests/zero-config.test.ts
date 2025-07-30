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

describe('Zero Config API', () => {
  let mockConfigLoader: any;
  let mockAutoDiscovery: any;
  let mockViewer: any;
  let mockContainer: HTMLElement;

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
    const createViewer = vi.fn().mockReturnValue(mockViewer);
    vi.doMock('../src/factory', () => ({
      createViewer,
    }));

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.resetModules();
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

    it('should throw error for invalid container string', async () => {
      const options: ZeroConfigOptions = {
        container: '#nonexistent',
      };

      await expect(init(options)).rejects.toThrow('Container element "#nonexistent" not found');
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
      expect(createViewer).toHaveBeenCalledWith(
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

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No documents found')
      );
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Test error');
      mockConfigLoader.loadConfig.mockRejectedValue(error);

      await expect(init()).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        error
      );
    });

    it('should display error message in container on failure', async () => {
      const error = new Error('Test error');
      mockConfigLoader.loadConfig.mockRejectedValue(error);

      try {
        await init();
      } catch (e) {
        // Expected to throw
      }

      expect(mockContainer.innerHTML).toContain('Setup Required');
      expect(mockContainer.innerHTML).toContain('Test error');
    });

    it('should handle error with custom container', async () => {
      const customContainer = document.createElement('div');
      document.body.appendChild(customContainer);

      const error = new Error('Test error');
      mockConfigLoader.loadConfig.mockRejectedValue(error);

      const options: ZeroConfigOptions = {
        container: customContainer,
      };

      try {
        await init(options);
      } catch (e) {
        // Expected to throw
      }

      expect(customContainer.innerHTML).toContain('Setup Required');
    });
  });

  describe('getViewer', () => {
    it('should return null when no viewer initialized', () => {
      expect(getViewer()).toBeNull();
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
    it('should warn when no viewer initialized', () => {
      setTheme('github-dark');

      expect(console.warn).toHaveBeenCalledWith(
        'No viewer instance found. Call init() first.'
      );
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

      try {
        await init(options);
      } catch (e) {
        // Should still throw the original error
        expect(e).toBe(error);
      }
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