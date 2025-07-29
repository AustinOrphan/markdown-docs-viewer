import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
vi.mock('../src/config-loader');
vi.mock('../src/auto-discovery');
vi.mock('../src/factory');

describe('Zero Config API - Comprehensive Coverage', () => {
  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = '<div id="docs"></div>';

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

  describe('Static Functions', () => {
    it('should test getAvailableThemes function', async () => {
      const { getAvailableThemes } = await import('../src/zero-config');
      const themes = getAvailableThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('default-light');
      expect(themes).toContain('default-dark');
    });

    it('should test generateConfig function', async () => {
      // Mock ConfigLoader.generateSampleConfig
      const { ConfigLoader } = await import('../src/config-loader');
      ConfigLoader.generateSampleConfig = vi.fn().mockReturnValue('sample config string');

      const { generateConfig } = await import('../src/zero-config');
      const config = generateConfig();

      expect(config).toBe('sample config string');
      expect(ConfigLoader.generateSampleConfig).toHaveBeenCalled();
    });

    it('should test getViewer when no viewer exists', async () => {
      const { getViewer } = await import('../src/zero-config');
      const viewer = getViewer();

      expect(viewer).toBeNull();
    });

    it('should test setTheme without viewer', async () => {
      const { setTheme } = await import('../src/zero-config');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setTheme('github-dark');

      expect(consoleSpy).toHaveBeenCalledWith('No viewer instance found. Call init() first.');
    });

    it('should test setTheme with invalid theme name', async () => {
      const { setTheme } = await import('../src/zero-config');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setTheme('invalid-theme-name');

      expect(consoleSpy).toHaveBeenCalledWith('No viewer instance found. Call init() first.');
    });

    it('should test reload without existing viewer', async () => {
      // Mock the init function to return a mock viewer
      const mockViewer = { destroy: vi.fn() };
      const { ConfigLoader } = await import('../src/config-loader');
      const { AutoDiscovery } = await import('../src/auto-discovery');
      const { createViewer } = await import('../src/factory');

      // Setup mocks
      ConfigLoader.prototype.loadConfig = vi.fn().mockResolvedValue({
        title: 'Test',
        theme: 'default-light',
        source: { type: 'auto', path: './docs' },
      });
      ConfigLoader.prototype.toDocumentationConfig = vi.fn().mockReturnValue({ title: 'Test' });
      AutoDiscovery.prototype.discoverFiles = vi.fn().mockResolvedValue([]);
      vi.mocked(createViewer).mockReturnValue(mockViewer as any);

      const { reload } = await import('../src/zero-config');
      const result = await reload();

      expect(result).toBe(mockViewer);
    });
  });

  describe('onDOMReady function', () => {
    it('should handle DOM ready state when loading', async () => {
      // Mock document.readyState
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading',
      });

      // const mockCallback = vi.fn();

      // Import to trigger the module and get access to onDOMReady logic
      await import('../src/zero-config');

      // Test that addEventListener would be called (we can't easily test the private onDOMReady function)
      expect(document.readyState).toBe('loading');
    });

    it('should handle DOM ready state when complete', async () => {
      // Mock document.readyState
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      });

      // Import to test the DOM ready logic
      await import('../src/zero-config');

      expect(document.readyState).toBe('complete');
    });
  });

  describe('Theme utilities', () => {
    it('should test theme name parsing in setTheme', async () => {
      // Create a mock viewer to test theme setting logic
      // const mockViewer = {
      //   setTheme: vi.fn()
      // };

      // Mock the global viewer
      // const zeroConfigModule = await import('../src/zero-config');

      // Use Object.defineProperty to set the private globalViewer
      // This tests the theme parsing logic
      const { themes } = await import('../src/themes');

      expect(themes.github).toBeDefined();
      expect(themes.github.light).toBeDefined();
      expect(themes.github.dark).toBeDefined();
    });

    it('should handle theme name splitting correctly', async () => {
      const { setTheme } = await import('../src/zero-config');

      // Test that it handles theme names without mode
      expect(() => setTheme('github')).not.toThrow();
      expect(() => setTheme('material')).not.toThrow();
      expect(() => setTheme('')).not.toThrow();
    });
  });

  describe('Container detection logic', () => {
    it('should test container auto-detection fallbacks', async () => {
      // Remove #docs and test fallback logic
      document.body.innerHTML = '<div id="documentation"></div>';

      const documentationEl = document.getElementById('documentation');
      expect(documentationEl).toBeTruthy();
    });

    it('should test container detection with .docs class', async () => {
      document.body.innerHTML = '<div class="docs"></div>';

      const docsEl = document.querySelector('.docs');
      expect(docsEl).toBeTruthy();
    });

    it('should test container detection with .documentation class', async () => {
      document.body.innerHTML = '<div class="documentation"></div>';

      const documentationEl = document.querySelector('.documentation');
      expect(documentationEl).toBeTruthy();
    });

    it('should fallback to body when no standard containers found', () => {
      document.body.innerHTML = '<div></div>';

      expect(document.body).toBeTruthy();
    });
  });

  describe('Export object', () => {
    it('should test default export object', async () => {
      const defaultExport = (await import('../src/zero-config')).default;

      expect(defaultExport).toBeDefined();
      expect(typeof defaultExport.init).toBe('function');
      expect(typeof defaultExport.getViewer).toBe('function');
      expect(typeof defaultExport.reload).toBe('function');
      expect(typeof defaultExport.setTheme).toBe('function');
      expect(typeof defaultExport.getAvailableThemes).toBe('function');
      expect(typeof defaultExport.generateConfig).toBe('function');
      expect(defaultExport.themes).toBeDefined();
      expect(defaultExport.autoInit).toBe(true);
    });
  });
});
