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
          <div class="mdv-dark-mode-toggle-track">
            <div class="mdv-dark-mode-toggle-thumb">
              <div class="mdv-dark-mode-icon light-icon">${this.getSunIcon()}</div>
              <div class="mdv-dark-mode-icon dark-icon">${this.getMoonIcon()}</div>
            </div>
          </div>
        </button>
      </div>
    `;
  }

  private getSunIcon(): string {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2V6M12 18V22M22 12H18M6 12H2M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  private getMoonIcon(): string {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05Z"/>
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
        width: 44px;
        height: 24px;
        padding: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.3s ease;
        outline: none;
      }
      
      .mdv-dark-toggle-btn:focus {
        outline: 2px solid var(--mdv-color-primary);
        outline-offset: 2px;
      }
      
      .mdv-dark-toggle-btn:focus:not(:focus-visible) {
        outline: none;
      }
      
      .mdv-dark-mode-toggle-track {
        width: 100%;
        height: 100%;
        background: var(--mdv-color-border);
        border-radius: 12px;
        position: relative;
        transition: background-color 0.3s ease;
      }
      
      .mdv-dark-toggle-btn.dark .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-primary);
      }
      
      .mdv-dark-toggle-btn:hover .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-text);
        opacity: 0.3;
      }
      
      .mdv-dark-toggle-btn.dark:hover .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-primary);
        filter: brightness(1.1);
      }
      
      .mdv-dark-mode-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: var(--mdv-color-surface);
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }
      
      .mdv-dark-toggle-btn.dark .mdv-dark-mode-toggle-thumb {
        transform: translateX(20px);
      }
      
      .mdv-dark-mode-icon {
        position: absolute;
        transition: opacity 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .mdv-dark-mode-icon svg {
        width: 14px;
        height: 14px;
        color: var(--mdv-color-text);
      }
      
      .mdv-dark-toggle-btn.light .light-icon {
        opacity: 1;
      }
      
      .mdv-dark-toggle-btn.light .dark-icon {
        opacity: 0;
      }
      
      .mdv-dark-toggle-btn.dark .light-icon {
        opacity: 0;
      }
      
      .mdv-dark-toggle-btn.dark .dark-icon {
        opacity: 1;
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
