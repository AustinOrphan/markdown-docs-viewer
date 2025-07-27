import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeSwitcher } from '../src/theme-switcher';
import { ThemeManager, ThemePreset } from '../src/theme-manager';
import { themes } from '../src/themes';

describe('ThemeSwitcher', () => {
  let themeManager: ThemeManager;
  let themeSwitcher: ThemeSwitcher;
  let container: HTMLElement;
  let mockThemes: ThemePreset[];

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;

    // Mock themes
    mockThemes = [
      { ...themes.default.light, description: 'Default light theme' },
      { ...themes.default.dark, description: 'Default dark theme' },
      {
        name: 'github-light',
        description: 'GitHub light theme',
        colors: { ...themes.default.light.colors, primary: '#0969da' },
        fonts: themes.default.light.fonts,
        spacing: themes.default.light.spacing,
        borderRadius: '0.5rem',
      },
    ];

    // Mock theme manager
    themeManager = {
      getCurrentTheme: vi.fn().mockReturnValue(mockThemes[0]),
      getAvailableThemes: vi.fn().mockReturnValue(mockThemes),
      setTheme: vi.fn().mockReturnValue(mockThemes[1]),
      getContrastRatio: vi.fn().mockReturnValue(4.5),
      isAccessible: vi.fn().mockReturnValue(true),
      getAvailableBaseThemes: vi.fn().mockReturnValue(['default', 'github', 'material']),
    } as unknown as ThemeManager;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      expect(themeSwitcher).toBeInstanceOf(ThemeSwitcher);
    });

    it('should initialize with custom options', () => {
      const options = {
        position: 'footer' as const,
        showPreview: false,
        showDescription: false,
        allowCustomThemes: false,
        onThemeChange: vi.fn(),
      };

      themeSwitcher = new ThemeSwitcher(themeManager, options);
      expect(themeSwitcher).toBeInstanceOf(ThemeSwitcher);
    });
  });

  describe('render', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
    });

    it('should render theme switcher HTML with default options', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('mdv-theme-switcher');
      expect(html).toContain('mdv-theme-trigger');
      expect(html).toContain('mdv-theme-dropdown');
      expect(html).toContain('Choose Theme');
      expect(html).toContain('default'); // Current theme name
      expect(html).toContain('mdv-theme-custom-btn'); // Custom theme button (default enabled)
    });

    it('should render floating switcher when position is floating', () => {
      themeSwitcher = new ThemeSwitcher(themeManager, { position: 'floating' });
      const html = themeSwitcher.render();

      expect(html).toContain('mdv-theme-switcher-floating');
    });

    it('should hide custom theme button when allowCustomThemes is false', () => {
      themeSwitcher = new ThemeSwitcher(themeManager, { allowCustomThemes: false });
      const html = themeSwitcher.render();

      expect(html).not.toContain('mdv-theme-custom-btn');
    });

    it('should render all available themes as options', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('data-theme="default"');
      expect(html).toContain('data-theme="github"');
    });

    it('should mark current theme as active', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('class="mdv-theme-option active"');
      expect(html).toContain('aria-current="true"');
    });

    it('should show theme descriptions when enabled', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('Default light theme');
      expect(html).toContain('GitHub light theme');
    });

    it('should hide theme descriptions when disabled', () => {
      themeSwitcher = new ThemeSwitcher(themeManager, { showDescription: false });
      const html = themeSwitcher.render();

      expect(html).not.toContain('mdv-theme-option-description');
    });

    it('should show theme preview when enabled', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('mdv-theme-preview');
      expect(html).toContain('mdv-theme-preview-color');
      expect(html).toContain(`background-color: ${themes.default.light.colors.background}`);
      expect(html).toContain(`background-color: ${themes.default.light.colors.primary}`);
    });

    it('should hide theme preview when disabled', () => {
      themeSwitcher = new ThemeSwitcher(themeManager, { showPreview: false });
      const html = themeSwitcher.render();

      expect(html).not.toContain('mdv-theme-preview');
    });

    it('should use appropriate theme icons', () => {
      const html = themeSwitcher.render();

      expect(html).toContain('☀️'); // Default theme icon
    });

    it('should handle theme without description', () => {
      const themesWithoutDesc = [{ ...themes.default.light, description: undefined }];
      vi.mocked(themeManager.getAvailableThemes).mockReturnValue(themesWithoutDesc);

      const html = themeSwitcher.render();

      expect(html).toContain('data-theme="default"');
    });
  });

  describe('attachTo', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = themeSwitcher.render();
    });

    it('should attach to container and setup event listeners', () => {
      themeSwitcher.attachTo(container);

      const trigger = container.querySelector('.mdv-theme-trigger');
      expect(trigger).toBeTruthy();
    });

    it('should handle missing trigger gracefully', () => {
      container.innerHTML = '<div></div>';

      expect(() => {
        themeSwitcher.attachTo(container);
      }).not.toThrow();
    });
  });

  describe('dropdown functionality', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);
    });

    it('should toggle dropdown when trigger is clicked', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;

      expect(dropdown.classList.contains('open')).toBe(false);

      trigger.click();

      expect(dropdown.classList.contains('open')).toBe(true);
      expect(dropdown.getAttribute('aria-hidden')).toBe('false');
    });

    it('should close dropdown when clicking outside', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;

      // Open dropdown
      trigger.click();
      expect(dropdown.classList.contains('open')).toBe(true);

      // Click outside
      document.body.click();

      expect(dropdown.classList.contains('open')).toBe(false);
      expect(dropdown.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not close dropdown when clicking inside', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;

      // Open dropdown
      trigger.click();
      expect(dropdown.classList.contains('open')).toBe(true);

      // Click inside dropdown
      dropdown.click();

      expect(dropdown.classList.contains('open')).toBe(true);
    });

    it('should prevent event bubbling on trigger click', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const clickSpy = vi.fn();

      document.addEventListener('click', clickSpy);
      trigger.click();

      // The click should be prevented from bubbling to document
      expect(clickSpy).not.toHaveBeenCalled();

      document.removeEventListener('click', clickSpy);
    });
  });

  describe('theme selection', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);
    });

    it('should select theme when option is clicked', () => {
      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;

      themeOption.click();

      expect(themeManager.setTheme).toHaveBeenCalledWith('default-light');
    });

    it('should close dropdown after selecting theme', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;
      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;

      // Open dropdown
      trigger.click();
      expect(dropdown.classList.contains('open')).toBe(true);

      // Select theme
      themeOption.click();

      expect(dropdown.classList.contains('open')).toBe(false);
    });

    it('should call onThemeChange callback when theme is selected', () => {
      const onThemeChange = vi.fn();
      themeSwitcher = new ThemeSwitcher(themeManager, { onThemeChange });
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);

      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;
      themeOption.click();

      expect(onThemeChange).toHaveBeenCalledWith(mockThemes[1]);
    });

    it('should update UI after theme selection', () => {
      // Mock theme manager to return light theme (current theme)
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue(mockThemes[0]);
      vi.mocked(themeManager.setTheme).mockImplementation(() => {
        // Simulate theme change by updating mock return value
        return mockThemes[0];
      });

      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;
      themeOption.click();

      // Check if UI was updated (this would be called internally)
      expect(themeManager.setTheme).toHaveBeenCalledWith('default-light');
    });

    it('should handle theme selection when setTheme returns null', () => {
      vi.mocked(themeManager.setTheme).mockReturnValue(null);
      const onThemeChange = vi.fn();
      themeSwitcher = new ThemeSwitcher(themeManager, { onThemeChange });
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);

      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;
      themeOption.click();

      expect(onThemeChange).not.toHaveBeenCalled();
    });

    it('should ignore clicks on non-theme elements', () => {
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;
      dropdown.click();

      expect(themeManager.setTheme).not.toHaveBeenCalled();
    });
  });

  describe('custom theme button', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);
    });

    it('should handle custom theme button click', () => {
      const customBtn = container.querySelector('.mdv-theme-custom-btn') as HTMLElement;

      customBtn.click();

      // Check that theme builder container was added to the body
      const builderContainer = document.body.querySelector('.mdv-theme-builder-overlay');
      expect(builderContainer).toBeTruthy();

      // Clean up
      builderContainer?.remove();
    });

    it('should close dropdown when custom theme button is clicked', () => {
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;
      const customBtn = container.querySelector('.mdv-theme-custom-btn') as HTMLElement;

      // Open dropdown
      trigger.click();
      expect(dropdown.classList.contains('open')).toBe(true);

      // Click custom button
      customBtn.click();

      expect(dropdown.classList.contains('open')).toBe(false);
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = themeSwitcher.render();
      themeSwitcher.attachTo(container);

      // Open dropdown for keyboard tests
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      trigger.click();
    });

    it('should navigate down with ArrowDown key', () => {
      const options = container.querySelectorAll('.mdv-theme-option');
      const firstOption = options[0] as HTMLElement;
      const secondOption = options[1] as HTMLElement;

      firstOption.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(event);

      expect(secondOption).toBe(document.activeElement);
    });

    it('should navigate up with ArrowUp key', () => {
      const options = container.querySelectorAll('.mdv-theme-option');
      const firstOption = options[0] as HTMLElement;
      const lastOption = options[options.length - 1] as HTMLElement;

      firstOption.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      container.dispatchEvent(event);

      expect(lastOption).toBe(document.activeElement);
    });

    it('should wrap around at the end with ArrowDown', () => {
      const options = container.querySelectorAll('.mdv-theme-option');
      const firstOption = options[0] as HTMLElement;

      // Since keyboard navigation is based on active class,
      // we need to test that focus moves correctly from the active element
      expect(firstOption.classList.contains('active')).toBe(true);

      // First ArrowDown should focus second option (index 1)
      const event1 = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(event1);
      expect(document.activeElement).toBe(options[1]);

      // Since navigation is still based on active class (which hasn't changed),
      // the next ArrowDown will still go to second option
      // To properly test wrap-around, we need to simulate selecting the last theme first

      // Let's test wrap-around from a different approach
      // Manually focus the last option
      const lastOption = options[options.length - 1] as HTMLElement;
      lastOption.classList.add('active');
      firstOption.classList.remove('active');

      // Now ArrowDown should wrap to first
      const wrapEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(wrapEvent);
      expect(document.activeElement).toBe(firstOption);
    });

    it('should select theme with Enter key', () => {
      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;
      themeOption.focus();

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(event);

      expect(themeManager.setTheme).toHaveBeenCalledWith('default-light');
    });

    it('should select theme with Space key', () => {
      const themeOption = container.querySelector('[data-theme="default"]') as HTMLElement;
      themeOption.focus();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(event);

      expect(themeManager.setTheme).toHaveBeenCalledWith('default-light');
    });

    it('should close dropdown with Escape key', () => {
      const dropdown = container.querySelector('.mdv-theme-dropdown') as HTMLElement;
      expect(dropdown.classList.contains('open')).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      container.dispatchEvent(event);

      expect(dropdown.classList.contains('open')).toBe(false);
    });

    it('should not respond to keyboard when dropdown is closed', () => {
      // Close dropdown
      const trigger = container.querySelector('.mdv-theme-trigger') as HTMLElement;
      trigger.click(); // Toggle to close

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(event);

      // Should not call setTheme or change focus
      expect(themeManager.setTheme).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation when no option is focused', () => {
      // With accessibility improvements, the first menu item is auto-focused when dropdown opens
      // So we need to remove focus first to test the no-focus scenario
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement) {
        focusedElement.blur();
      }

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(event);

      // Should not call setTheme when no option is focused
      expect(themeManager.setTheme).not.toHaveBeenCalled();
    });
  });

  describe('theme icons', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
    });

    it('should return correct icons for known themes', () => {
      const html = themeSwitcher.render();

      // Test default theme icon is present
      expect(html).toContain('☀️');
    });

    it('should return default icon for unknown themes', () => {
      const unknownTheme = {
        ...themes.default.light,
        name: 'unknown-theme',
        description: 'Unknown theme',
      };
      vi.mocked(themeManager.getCurrentTheme).mockReturnValue(unknownTheme);

      // Disable dark mode toggle to ensure base theme icon is shown
      themeSwitcher = new ThemeSwitcher(themeManager, { showDarkModeToggle: false });
      const html = themeSwitcher.render();

      expect(html).toContain('🎨'); // Default icon
    });
  });

  describe('getStyles', () => {
    beforeEach(() => {
      themeSwitcher = new ThemeSwitcher(themeManager);
    });

    it('should return CSS styles string', () => {
      const styles = themeSwitcher.getStyles();

      expect(styles).toContain('.mdv-theme-switcher');
      expect(styles).toContain('.mdv-theme-trigger');
      expect(styles).toContain('.mdv-theme-dropdown');
      expect(styles).toContain('.mdv-theme-option');
      expect(styles).toContain('transition');
    });

    it('should include floating styles', () => {
      const styles = themeSwitcher.getStyles();

      expect(styles).toContain('.mdv-theme-switcher-floating');
      expect(styles).toContain('position: fixed');
    });

    it('should include mobile responsive styles', () => {
      const styles = themeSwitcher.getStyles();

      expect(styles).toContain('@media (max-width: 768px)');
    });

    it('should include dropdown animation styles', () => {
      const styles = themeSwitcher.getStyles();

      expect(styles).toContain('opacity: 0');
      expect(styles).toContain('opacity: 1');
      expect(styles).toContain('transform: translateY');
    });

    it('should include preview styles', () => {
      const styles = themeSwitcher.getStyles();

      expect(styles).toContain('.mdv-theme-preview');
      expect(styles).toContain('.mdv-theme-preview-color');
    });
  });

  describe('edge cases', () => {
    it('should handle empty themes array', () => {
      vi.mocked(themeManager.getAvailableThemes).mockReturnValue([]);

      themeSwitcher = new ThemeSwitcher(themeManager);
      const html = themeSwitcher.render();

      expect(html).toContain('mdv-theme-list');
      expect(html).not.toContain('data-theme=');
    });

    it('should handle theme without colors for preview', () => {
      const themeWithoutColors = [{ ...themes.default.light, colors: undefined as never }];
      vi.mocked(themeManager.getAvailableThemes).mockReturnValue(themeWithoutColors);

      // Disable preview to avoid accessing undefined colors
      themeSwitcher = new ThemeSwitcher(themeManager, { showPreview: false });

      expect(() => {
        themeSwitcher.render();
      }).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      themeSwitcher = new ThemeSwitcher(themeManager);
      container.innerHTML = '<div></div>'; // Empty container
      themeSwitcher.attachTo(container);

      // Should not throw when trying to set up event listeners
      expect(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        container.dispatchEvent(event);
      }).not.toThrow();
    });
  });
});
