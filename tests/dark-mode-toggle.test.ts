import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DarkModeToggle } from '../src/dark-mode-toggle';
import { ThemeManager } from '../src/theme-manager';
import { defaultTheme, darkTheme } from '../src/themes';

describe('DarkModeToggle', () => {
  let themeManager: ThemeManager;
  let darkModeToggle: DarkModeToggle;
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;

    // Mock theme manager
    themeManager = {
      getCurrentTheme: vi.fn().mockReturnValue(defaultTheme),
      setTheme: vi.fn().mockReturnValue(darkTheme),
      getAvailableThemes: vi.fn().mockReturnValue([defaultTheme, darkTheme]),
    } as any;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      darkModeToggle = new DarkModeToggle(themeManager);
      expect(darkModeToggle).toBeInstanceOf(DarkModeToggle);
    });

    it('should initialize with custom options', () => {
      const options = {
        position: 'footer' as const,
        showLabel: false,
        compact: true,
        lightThemeName: 'light',
        darkThemeName: 'dark-custom',
      };

      darkModeToggle = new DarkModeToggle(themeManager, options);
      expect(darkModeToggle).toBeInstanceOf(DarkModeToggle);
    });

    it('should determine initial dark state based on current theme', () => {
      // Mock dark theme as current
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({
        ...darkTheme,
        name: 'default-dark',
      });

      darkModeToggle = new DarkModeToggle(themeManager, { darkThemeName: 'default-dark' });
      expect(darkModeToggle.isDarkMode()).toBe(true);
    });

    it('should determine initial light state based on current theme', () => {
      // Mock light theme as current
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({
        ...defaultTheme,
        name: 'default-light',
      });

      darkModeToggle = new DarkModeToggle(themeManager, { lightThemeName: 'default-light' });
      expect(darkModeToggle.isDarkMode()).toBe(false);
    });
  });

  describe('render', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
    });

    it('should render toggle HTML with default options', () => {
      const html = darkModeToggle.render();

      expect(html).toContain('mdv-dark-mode-toggle');
      expect(html).toContain('mdv-dark-toggle-btn');
      expect(html).toContain('Light Mode');
      expect(html).toContain('aria-checked="false"');
      expect(html).toContain('Switch to dark mode');
    });

    it('should render toggle HTML without label when showLabel is false', () => {
      darkModeToggle = new DarkModeToggle(themeManager, { showLabel: false });
      const html = darkModeToggle.render();

      expect(html).not.toContain('Light Mode');
    });

    it('should render compact toggle when compact is true', () => {
      darkModeToggle = new DarkModeToggle(themeManager, { compact: true });
      const html = darkModeToggle.render();

      expect(html).toContain('mdv-dark-toggle-compact');
    });

    it('should render floating toggle when position is floating', () => {
      darkModeToggle = new DarkModeToggle(themeManager, { position: 'floating' });
      const html = darkModeToggle.render();

      expect(html).toContain('mdv-dark-toggle-floating');
    });

    it('should render in dark state when initialized as dark', () => {
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({
        ...darkTheme,
        name: 'default-dark',
      });
      darkModeToggle = new DarkModeToggle(themeManager, { darkThemeName: 'default-dark' });

      const html = darkModeToggle.render();

      expect(html).toContain('Dark Mode');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('Switch to light mode');
      expect(html).toContain('dark');
    });

    it('should generate unique IDs for multiple instances', () => {
      const toggle1 = new DarkModeToggle(themeManager);
      const toggle2 = new DarkModeToggle(themeManager);

      const html1 = toggle1.render();
      const html2 = toggle2.render();

      // Extract IDs from HTML
      const id1Match = html1.match(/id="(mdv-dark-toggle-\d+)"/);
      const id2Match = html2.match(/id="(mdv-dark-toggle-\d+)"/);

      expect(id1Match).toBeTruthy();
      expect(id2Match).toBeTruthy();
      expect(id1Match![1]).not.toBe(id2Match![1]);
    });
  });

  describe('attachTo', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
      container.innerHTML = darkModeToggle.render();
    });

    it('should attach to container and setup event listeners', () => {
      darkModeToggle.attachTo(container);

      const button = container.querySelector('.mdv-dark-toggle-btn') as HTMLElement;
      expect(button).toBeTruthy();
    });

    it('should handle missing button gracefully', () => {
      container.innerHTML = '<div></div>';

      expect(() => {
        darkModeToggle.attachTo(container);
      }).not.toThrow();
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
      container.innerHTML = darkModeToggle.render();
      darkModeToggle.attachTo(container);
    });

    it('should toggle from light to dark mode', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      expect(mockSetTheme).toHaveBeenCalledWith('default-dark');
      expect(darkModeToggle.isDarkMode()).toBe(true);
    });

    it('should toggle from dark to light mode', () => {
      // Set initial dark state
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({
        ...darkTheme,
        name: 'default-dark',
      });
      darkModeToggle = new DarkModeToggle(themeManager, { darkThemeName: 'default-dark' });
      container.innerHTML = darkModeToggle.render();
      darkModeToggle.attachTo(container);

      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(defaultTheme);

      darkModeToggle.toggle();

      expect(mockSetTheme).toHaveBeenCalledWith('default-light');
      expect(darkModeToggle.isDarkMode()).toBe(false);
    });

    it('should dispatch custom event on toggle', () => {
      const eventSpy = vi.fn();
      document.addEventListener('mdv-dark-mode-toggled', eventSpy);

      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            isDark: true,
            theme: darkTheme,
          },
        })
      );

      document.removeEventListener('mdv-dark-mode-toggled', eventSpy);
    });

    it('should call onToggle callback if provided', () => {
      const onToggle = vi.fn();
      darkModeToggle = new DarkModeToggle(themeManager, { onToggle });

      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      expect(onToggle).toHaveBeenCalledWith(true, darkTheme);
    });

    it('should handle theme manager returning null', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(null);

      const initialState = darkModeToggle.isDarkMode();
      darkModeToggle.toggle();

      expect(darkModeToggle.isDarkMode()).toBe(initialState);
    });
  });

  describe('setDarkMode', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
    });

    it('should toggle to dark mode when called with true', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.setDarkMode(true);

      expect(mockSetTheme).toHaveBeenCalledWith('default-dark');
      expect(darkModeToggle.isDarkMode()).toBe(true);
    });

    it('should toggle to light mode when called with false', () => {
      // Set initial dark state
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({
        ...darkTheme,
        name: 'default-dark',
      });
      darkModeToggle = new DarkModeToggle(themeManager, { darkThemeName: 'default-dark' });

      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(defaultTheme);

      darkModeToggle.setDarkMode(false);

      expect(mockSetTheme).toHaveBeenCalledWith('default-light');
      expect(darkModeToggle.isDarkMode()).toBe(false);
    });

    it('should not toggle if already in requested state', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);

      darkModeToggle.setDarkMode(false); // Already light

      expect(mockSetTheme).not.toHaveBeenCalled();
    });
  });

  describe('updateUI', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
      container.innerHTML = darkModeToggle.render();
      darkModeToggle.attachTo(container);
    });

    it('should update button classes and attributes when toggled', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      const button = container.querySelector('.mdv-dark-toggle-btn');
      expect(button?.className).toContain('dark');
      expect(button?.getAttribute('aria-checked')).toBe('true');
      expect(button?.getAttribute('aria-label')).toBe('Switch to light mode');
    });

    it('should update label text when toggled', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      const label = container.querySelector('.mdv-dark-toggle-label');
      expect(label?.textContent).toBe('Dark Mode');
    });

    it('should update icon when toggled', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      darkModeToggle.toggle();

      const icon = container.querySelector('.mdv-dark-toggle-icon');
      expect(icon?.innerHTML).toContain('path'); // Moon icon has path element
    });

    it('should handle missing elements gracefully', () => {
      container.innerHTML = '<div></div>';
      darkModeToggle.attachTo(container);

      expect(() => {
        const mockSetTheme = vi.mocked(themeManager.setTheme);
        mockSetTheme.mockReturnValue(darkTheme);
        darkModeToggle.toggle();
      }).not.toThrow();
    });
  });

  describe('Theme change event handling', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
      container.innerHTML = darkModeToggle.render();
      darkModeToggle.attachTo(container);
    });

    it('should update state when external theme change event is received', () => {
      // Simulate external theme change to dark
      const themeChangeEvent = new CustomEvent('mdv-theme-changed', {
        detail: { theme: { name: 'default-dark' } },
      });

      document.dispatchEvent(themeChangeEvent);

      expect(darkModeToggle.isDarkMode()).toBe(true);
    });

    it('should not update state if theme name matches current state', () => {
      const initialState = darkModeToggle.isDarkMode();

      // Dispatch same theme
      const themeChangeEvent = new CustomEvent('mdv-theme-changed', {
        detail: { theme: { name: 'default' } },
      });

      document.dispatchEvent(themeChangeEvent);

      expect(darkModeToggle.isDarkMode()).toBe(initialState);
    });

    it('should handle theme change event without detail', () => {
      const themeChangeEvent = new CustomEvent('mdv-theme-changed');

      expect(() => {
        document.dispatchEvent(themeChangeEvent);
      }).not.toThrow();
    });
  });

  describe('Button click handling', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
      container.innerHTML = darkModeToggle.render();
      darkModeToggle.attachTo(container);
    });

    it('should toggle when button is clicked', () => {
      const mockSetTheme = vi.mocked(themeManager.setTheme);
      mockSetTheme.mockReturnValue(darkTheme);

      const button = container.querySelector('.mdv-dark-toggle-btn') as HTMLElement;
      button.click();

      expect(mockSetTheme).toHaveBeenCalledWith('default-dark');
      expect(darkModeToggle.isDarkMode()).toBe(true);
    });
  });

  describe('getStyles', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
    });

    it('should return CSS styles string', () => {
      const styles = darkModeToggle.getStyles();

      expect(styles).toContain('.mdv-dark-mode-toggle');
      expect(styles).toContain('.mdv-dark-toggle-btn');
      expect(styles).toContain('.mdv-dark-toggle-track');
      expect(styles).toContain('.mdv-dark-toggle-thumb');
      expect(styles).toContain('transition');
    });

    it('should include responsive styles', () => {
      const styles = darkModeToggle.getStyles();

      expect(styles).toContain('@media (max-width: 768px)');
    });

    it('should include accessibility styles', () => {
      const styles = darkModeToggle.getStyles();

      expect(styles).toContain('@media (prefers-contrast: high)');
      expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('Icon rendering', () => {
    beforeEach(() => {
      darkModeToggle = new DarkModeToggle(themeManager);
    });

    it('should render sun icon in light mode', () => {
      const html = darkModeToggle.render();
      expect(html).toContain('circle'); // Sun icon has circle element
    });

    it('should render moon icon in dark mode', () => {
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue({ ...darkTheme, name: 'dark' });
      darkModeToggle = new DarkModeToggle(themeManager, { darkThemeName: 'dark' });

      const html = darkModeToggle.render();
      expect(html).toContain('path'); // Moon icon has path element
    });
  });
});
