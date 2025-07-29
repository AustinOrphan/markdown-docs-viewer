import { ThemeManager } from './theme-manager';
import { Theme } from './types';

export interface DarkModeToggleOptions {
  position?: 'header' | 'footer' | 'floating';
  showLabel?: boolean;
  lightThemeName?: string;
  darkThemeName?: string;
  onToggle?: (isDark: boolean, theme: Theme) => void;
}

export class DarkModeToggle {
  private static instanceCounter = 0;
  private themeManager: ThemeManager;
  private options: DarkModeToggleOptions;
  private container: HTMLElement | null = null;
  private isDark: boolean = false;
  private clickHandler: (() => void) | null = null;
  private themeChangeHandler: ((e: Event) => void) | null = null;

  constructor(themeManager: ThemeManager, options: DarkModeToggleOptions = {}) {
    this.themeManager = themeManager;
    this.options = {
      position: 'header',
      showLabel: false,
      lightThemeName: 'default-light',
      darkThemeName: 'default-dark',
      ...options,
    };

    // Determine initial state based on current theme
    const currentThemeName = this.themeManager.getCurrentTheme().name;
    this.isDark = currentThemeName.includes('-dark');
  }

  public render(): string {
    const toggleId = `mdv-dark-toggle-${++DarkModeToggle.instanceCounter}`;

    return `
      <div class="mdv-dark-mode-toggle ${this.options.position === 'floating' ? 'mdv-dark-toggle-floating' : ''}">
        ${
          this.options.showLabel
            ? `
          <span class="mdv-dark-toggle-label">
            ${this.isDark ? 'Dark' : 'Light'} Mode
          </span>
        `
            : ''
        }
        <button 
          class="mdv-dark-toggle-btn ${this.isDark ? 'dark' : 'light'}" 
          id="${toggleId}"
          type="button"
          role="switch"
          aria-checked="${this.isDark}"
          aria-label="${this.isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
          title="${this.isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
        >
          <div class="mdv-dark-toggle-track">
            <div class="mdv-dark-toggle-thumb">
              <div class="mdv-dark-toggle-icon">
                ${this.isDark ? this.getMoonIcon() : this.getSunIcon()}
              </div>
            </div>
          </div>
        </button>
      </div>
    `;
  }

  private getSunIcon(): string {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <path d="m12 1v6m0 14v6M4.22 4.22l4.24 4.24m8.48 8.48l4.24 4.24m-19.9-12h6m14 0h6M6.46 17.54l-4.24 4.24M17.54 6.46l4.24-4.24"></path>
      </svg>
    `;
  }

  private getMoonIcon(): string {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  }

  public attachTo(container: HTMLElement): void {
    this.container = container;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const button = this.container.querySelector('.mdv-dark-toggle-btn');
    if (!button) return;

    // Store click handler reference for cleanup
    this.clickHandler = () => {
      this.toggle();
    };
    button.addEventListener('click', this.clickHandler);

    // Store theme change handler reference for cleanup
    this.themeChangeHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const themeName = customEvent.detail?.theme?.name;
      const isDark = themeName?.includes('-dark') || false;
      if (isDark !== this.isDark) {
        this.isDark = isDark;
        this.updateUI();
      }
    };
    document.addEventListener('mdv-theme-changed', this.themeChangeHandler);

    // Listen for dark mode toggle events from other instances
    const darkModeToggleHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const isDark = customEvent.detail?.isDark;
      if (isDark !== undefined && isDark !== this.isDark) {
        this.isDark = isDark;
        this.updateUI();
      }
    };
    document.addEventListener('mdv-dark-mode-toggled', darkModeToggleHandler);
  }

  public toggle(): void {
    // Get the current theme and toggle its mode
    const currentTheme = this.themeManager.getCurrentTheme();
    const currentBaseName = currentTheme.name.replace(/-light|-dark/, '');
    const newMode = this.isDark ? 'light' : 'dark';
    const newThemeName = `${currentBaseName}-${newMode}`;

    const theme = this.themeManager.setTheme(newThemeName);

    if (theme) {
      this.isDark = !this.isDark;
      this.updateUI();

      // Dispatch custom event
      document.dispatchEvent(
        new CustomEvent('mdv-dark-mode-toggled', {
          detail: { isDark: this.isDark, theme },
        })
      );

      if (this.options.onToggle) {
        this.options.onToggle(this.isDark, theme);
      }
    }
  }

  private updateUI(): void {
    if (!this.container) return;

    const button = this.container.querySelector('.mdv-dark-toggle-btn');
    const label = this.container.querySelector('.mdv-dark-toggle-label');
    const icon = this.container.querySelector('.mdv-dark-toggle-icon');

    if (button) {
      button.className = `mdv-dark-toggle-btn ${this.isDark ? 'dark' : 'light'}`;
      button.setAttribute('aria-checked', this.isDark.toString());
      button.setAttribute(
        'aria-label',
        this.isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
      button.setAttribute('title', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    if (label) {
      label.textContent = `${this.isDark ? 'Dark' : 'Light'} Mode`;
    }

    if (icon) {
      icon.innerHTML = this.isDark ? this.getMoonIcon() : this.getSunIcon();
    }
  }

  public setDarkMode(isDark: boolean): void {
    if (isDark !== this.isDark) {
      this.toggle();
    }
  }

  public isDarkMode(): boolean {
    return this.isDark;
  }

  public destroy(): void {
    // Remove event listeners if they exist
    if (this.container && this.clickHandler) {
      const button = this.container.querySelector('.mdv-dark-toggle-btn');
      if (button) {
        button.removeEventListener('click', this.clickHandler);
      }
    }

    // Remove document event listener
    if (this.themeChangeHandler) {
      document.removeEventListener('mdv-theme-changed', this.themeChangeHandler);
    }

    // Clear references
    this.container = null;
    this.clickHandler = null;
    this.themeChangeHandler = null;
  }

  public getStyles(): string {
    return `
      .mdv-dark-mode-toggle {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .mdv-dark-toggle-floating {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: var(--mdv-z-fixed, 1030);
      }
      
      
      .mdv-dark-toggle-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--mdv-color-text);
        user-select: none;
      }
      
      .mdv-dark-toggle-btn {
        position: relative;
        width: 52px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 14px;
        outline: none;
      }
      
      .mdv-dark-toggle-btn:focus-visible {
        box-shadow: 0 0 0 2px var(--mdv-color-primary);
      }
      
      .mdv-dark-toggle-compact .mdv-dark-toggle-btn {
        width: 44px;
        height: 24px;
        border-radius: 12px;
      }
      
      .mdv-dark-toggle-track {
        width: 100%;
        height: 100%;
        background: var(--mdv-color-border);
        border-radius: 14px;
        position: relative;
        transition: background-color 0.2s ease;
      }
      
      .mdv-dark-toggle-btn.dark .mdv-dark-toggle-track {
        background: var(--mdv-color-primary);
      }
      
      .mdv-dark-toggle-compact .mdv-dark-toggle-track {
        border-radius: 12px;
      }
      
      .mdv-dark-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background: var(--mdv-color-surface);
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-dark-toggle-btn.dark .mdv-dark-toggle-thumb {
        transform: translateX(24px);
        background: var(--mdv-color-surface);
      }
      
      .mdv-dark-toggle-compact .mdv-dark-toggle-thumb {
        width: 20px;
        height: 20px;
      }
      
      .mdv-dark-toggle-compact .mdv-dark-toggle-btn.dark .mdv-dark-toggle-thumb {
        transform: translateX(20px);
      }
      
      .mdv-dark-toggle-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--mdv-color-text);
        transition: all 0.2s ease;
      }
      
      .mdv-dark-toggle-btn.light .mdv-dark-toggle-icon {
        color: #fbbf24; /* Yellow sun */
      }
      
      .mdv-dark-toggle-btn.dark .mdv-dark-toggle-icon {
        color: #60a5fa; /* Blue moon */
      }
      
      .mdv-dark-toggle-btn:hover .mdv-dark-toggle-track {
        background: var(--mdv-color-text);
        opacity: 0.3;
      }
      
      .mdv-dark-toggle-btn.dark:hover .mdv-dark-toggle-track {
        background: var(--mdv-color-primary);
        opacity: 0.8;
      }
      
      /* Mobile styles */
      @media (max-width: 768px) {
        .mdv-dark-toggle-floating {
          bottom: 20px;
          right: 16px;
        }
        
        .mdv-dark-mode-toggle {
          gap: 8px;
        }
        
        .mdv-dark-toggle-label {
          font-size: 0.8rem;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .mdv-dark-toggle-track {
          border: 2px solid var(--mdv-color-text);
        }
        
        .mdv-dark-toggle-thumb {
          border: 1px solid var(--mdv-color-text);
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .mdv-dark-toggle-btn,
        .mdv-dark-toggle-track,
        .mdv-dark-toggle-thumb,
        .mdv-dark-toggle-icon {
          transition: none;
        }
      }
    `;
  }
}
