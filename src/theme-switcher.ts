import { Theme } from './types';
import { ThemeManager, ThemePreset } from './theme-manager';
import { ThemeBuilder } from './theme-builder';

export interface ThemeSwitcherOptions {
  position?: 'header' | 'footer' | 'sidebar' | 'floating';
  showPreview?: boolean;
  showDescription?: boolean;
  allowCustomThemes?: boolean;
  onThemeChange?: (theme: Theme) => void;
}

export class ThemeSwitcher {
  private themeManager: ThemeManager;
  private options: ThemeSwitcherOptions;
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private themeBuilder: ThemeBuilder | null = null;

  constructor(themeManager: ThemeManager, options: ThemeSwitcherOptions = {}) {
    this.themeManager = themeManager;
    this.options = {
      position: 'header',
      showPreview: true,
      showDescription: true,
      allowCustomThemes: true,
      ...options,
    };
  }

  public render(): string {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themes = this.themeManager.getAvailableThemes();

    return `
      <div class="mdv-theme-switcher ${this.options.position === 'floating' ? 'mdv-theme-switcher-floating' : ''}">
        <button class="mdv-theme-trigger" aria-label="Change theme" title="Change theme">
          ${this.getThemeIcon(currentTheme.name)}
          <span class="mdv-theme-name">${currentTheme.name}</span>
        </button>
        <div class="mdv-theme-dropdown ${this.isOpen ? 'open' : ''}" aria-hidden="${!this.isOpen}">
          <div class="mdv-theme-dropdown-header">
            <h3>Choose Theme</h3>
            ${
              this.options.allowCustomThemes
                ? `
              <button class="mdv-theme-custom-btn" aria-label="Create custom theme">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                </svg>
              </button>
            `
                : ''
            }
          </div>
          <div class="mdv-theme-list">
            ${themes.map(theme => this.renderThemeOption(theme, theme.name === currentTheme.name)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderThemeOption(theme: ThemePreset, isActive: boolean): string {
    return `
      <button 
        class="mdv-theme-option ${isActive ? 'active' : ''}" 
        data-theme="${theme.name}"
        aria-label="Switch to ${theme.name} theme"
        aria-current="${isActive ? 'true' : 'false'}"
      >
        <div class="mdv-theme-option-content">
          <div class="mdv-theme-option-info">
            <span class="mdv-theme-option-name">${theme.name}</span>
            ${
              this.options.showDescription && theme.description
                ? `
              <span class="mdv-theme-option-description">${theme.description}</span>
            `
                : ''
            }
          </div>
          ${this.options.showPreview ? this.renderThemePreview(theme) : ''}
        </div>
        ${
          isActive
            ? `
          <svg class="mdv-theme-option-check" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        `
            : ''
        }
      </button>
    `;
  }

  private renderThemePreview(theme: ThemePreset): string {
    return `
      <div class="mdv-theme-preview" aria-hidden="true">
        <div class="mdv-theme-preview-colors">
          <div 
            class="mdv-theme-preview-color" 
            style="background-color: ${theme.colors.background}"
            title="Background"
          ></div>
          <div 
            class="mdv-theme-preview-color" 
            style="background-color: ${theme.colors.primary}"
            title="Primary"
          ></div>
          <div 
            class="mdv-theme-preview-color" 
            style="background-color: ${theme.colors.secondary}"
            title="Secondary"
          ></div>
          <div 
            class="mdv-theme-preview-color" 
            style="background-color: ${theme.colors.surface}"
            title="Surface"
          ></div>
        </div>
      </div>
    `;
  }

  private getThemeIcon(themeName: string): string {
    const icons: Record<string, string> = {
      default: '☀️',
      light: '☀️',
      dark: '🌙',
      'high-contrast': '🔲',
      github: '🐙',
      dracula: '🦇',
      'solarized-light': '🌅',
      'solarized-dark': '🌃',
      material: '🎨',
    };

    return icons[themeName] || '🎨';
  }

  public attachTo(container: HTMLElement): void {
    this.container = container;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Toggle dropdown
    const trigger = this.container.querySelector('.mdv-theme-trigger');
    trigger?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Theme selection
    this.container.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const themeOption = target.closest('.mdv-theme-option') as HTMLElement;

      if (themeOption && themeOption.dataset.theme) {
        this.selectTheme(themeOption.dataset.theme);
      }
    });

    // Custom theme button
    const customBtn = this.container.querySelector('.mdv-theme-custom-btn');
    customBtn?.addEventListener('click', () => {
      this.openCustomThemeBuilder();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      if (!this.container?.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });

    // Keyboard navigation
    this.container.addEventListener('keydown', e => {
      this.handleKeyboardNavigation(e as KeyboardEvent);
    });
  }

  private toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.updateDropdownState();
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updateDropdownState();
  }

  private updateDropdownState(): void {
    const dropdown = this.container?.querySelector('.mdv-theme-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('open', this.isOpen);
      dropdown.setAttribute('aria-hidden', (!this.isOpen).toString());
    }
  }

  private selectTheme(themeName: string): void {
    const theme = this.themeManager.setTheme(themeName);
    if (theme) {
      this.updateUI();
      this.closeDropdown();

      if (this.options.onThemeChange) {
        this.options.onThemeChange(theme);
      }
    }
  }

  private updateUI(): void {
    if (!this.container) return;

    const currentTheme = this.themeManager.getCurrentTheme();

    // Update trigger
    const trigger = this.container.querySelector('.mdv-theme-trigger');
    if (trigger) {
      trigger.innerHTML = `
        ${this.getThemeIcon(currentTheme.name)}
        <span class="mdv-theme-name">${currentTheme.name}</span>
      `;
    }

    // Update active state
    this.container.querySelectorAll('.mdv-theme-option').forEach(option => {
      const isActive = option.getAttribute('data-theme') === currentTheme.name;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-current', isActive.toString());
    });
  }

  private handleKeyboardNavigation(e: KeyboardEvent): void {
    if (!this.isOpen) return;

    const options = Array.from(
      this.container?.querySelectorAll('.mdv-theme-option') || []
    ) as HTMLElement[];

    const currentIndex = options.findIndex(opt => opt.classList.contains('active'));
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % options.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const focusedOption = document.activeElement as HTMLElement;
        if (focusedOption?.dataset.theme) {
          this.selectTheme(focusedOption.dataset.theme);
        }
        return;
      }
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        return;
    }

    if (newIndex !== currentIndex) {
      options[newIndex]?.focus();
    }
  }

  private openCustomThemeBuilder(): void {
    if (!this.themeBuilder) {
      this.themeBuilder = new ThemeBuilder(this.themeManager, {
        onThemeCreate: theme => {
          this.selectTheme(theme.name);
        },
        onClose: () => {
          this.themeBuilder = null;
        },
      });

      // Create container for theme builder
      const builderContainer = document.createElement('div');
      builderContainer.innerHTML = this.themeBuilder.render();
      document.body.appendChild(builderContainer);

      this.themeBuilder.attachTo(builderContainer);
    }

    this.themeBuilder.open();
    this.closeDropdown();
  }

  public getStyles(): string {
    return `
      .mdv-theme-switcher {
        position: relative;
      }
      
      .mdv-theme-switcher-floating {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: var(--mdv-z-fixed, 1030);
      }
      
      .mdv-theme-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--mdv-color-surface);
        border: 1px solid var(--mdv-color-border);
        border-radius: var(--mdv-border-radius);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-trigger:hover {
        background: var(--mdv-color-background);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-theme-name {
        text-transform: capitalize;
      }
      
      .mdv-theme-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: var(--mdv-color-surface);
        border: 1px solid var(--mdv-color-border);
        border-radius: var(--mdv-border-radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 280px;
        max-height: 400px;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }
      
      .mdv-theme-dropdown.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .mdv-theme-dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--mdv-color-border);
      }
      
      .mdv-theme-dropdown-header h3 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
      }
      
      .mdv-theme-custom-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .mdv-theme-custom-btn:hover {
        background: var(--mdv-color-background);
      }
      
      .mdv-theme-list {
        max-height: 320px;
        overflow-y: auto;
        padding: 8px;
      }
      
      .mdv-theme-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px;
        margin-bottom: 4px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-option:hover {
        background: var(--mdv-color-background);
        border-color: var(--mdv-color-border);
      }
      
      .mdv-theme-option.active {
        background: var(--mdv-color-primary);
        color: white;
      }
      
      .mdv-theme-option-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      
      .mdv-theme-option-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }
      
      .mdv-theme-option-name {
        font-weight: 500;
        text-transform: capitalize;
      }
      
      .mdv-theme-option-description {
        font-size: 0.75rem;
        opacity: 0.7;
      }
      
      .mdv-theme-option.active .mdv-theme-option-description {
        opacity: 0.9;
      }
      
      .mdv-theme-preview {
        display: flex;
        gap: 2px;
      }
      
      .mdv-theme-preview-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      .mdv-theme-option-check {
        flex-shrink: 0;
      }
      
      /* Mobile styles */
      @media (max-width: 768px) {
        .mdv-theme-dropdown {
          position: fixed;
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          margin: 0;
          border-radius: var(--mdv-border-radius) var(--mdv-border-radius) 0 0;
          max-height: 70vh;
        }
        
        .mdv-theme-switcher-floating {
          bottom: 60px;
        }
      }
    `;
  }
}
