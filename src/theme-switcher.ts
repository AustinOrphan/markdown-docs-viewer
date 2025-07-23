import { Theme } from './types';
import { ThemeManager, ThemePreset } from './theme-manager';
import { ThemeBuilder } from './theme-builder';
import { escapeHtmlAttribute } from './utils';
import { getThemeBaseName, getThemeMode, toggleThemeMode } from './themes';

export interface ThemeSwitcherOptions {
  position?: 'header' | 'footer' | 'sidebar' | 'floating';
  showPreview?: boolean;
  showDescription?: boolean;
  allowCustomThemes?: boolean;
  showDarkModeToggle?: boolean;
  darkModeTogglePosition?: 'inline' | 'separate';
  onThemeChange?: (theme: Theme) => void;
  onModeChange?: (mode: 'light' | 'dark') => void;
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
      showDarkModeToggle: true,
      darkModeTogglePosition: 'inline',
      ...options,
    };
  }

  public render(): string {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themes = this.themeManager.getAvailableThemes();
    const currentBaseName = getThemeBaseName(currentTheme.name);
    const currentMode = getThemeMode(currentTheme.name);

    // Group themes by base name for cleaner display
    const themeGroups = this.groupThemesByBaseName(themes);

    return `
      <div class="mdv-theme-switcher ${this.options.position === 'floating' ? 'mdv-theme-switcher-floating' : ''}">
        ${this.options.showDarkModeToggle && this.options.darkModeTogglePosition === 'separate' ? this.renderDarkModeToggle(currentMode) : ''}
        <button class="mdv-theme-trigger" aria-label="Change theme" title="Change theme">
          ${this.getThemeIcon(currentBaseName, currentMode)}
          <span class="mdv-theme-name">${currentBaseName}</span>
        </button>
        <div class="mdv-theme-dropdown ${this.isOpen ? 'open' : ''}" aria-hidden="${!this.isOpen}">
          <div class="mdv-theme-dropdown-header">
            <h3>Choose Theme</h3>
            <div class="mdv-theme-header-actions">
              ${this.options.showDarkModeToggle && this.options.darkModeTogglePosition === 'inline' ? this.renderDarkModeToggle(currentMode) : ''}
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
          </div>
          <div class="mdv-theme-list">
            ${Object.entries(themeGroups).map(([baseName, themeVariants]) => 
              this.renderThemeGroup(baseName, themeVariants, currentBaseName === baseName)
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderDarkModeToggle(currentMode: 'light' | 'dark'): string {
    return `
      <button 
        class="mdv-dark-mode-toggle ${currentMode}" 
        aria-label="Toggle ${currentMode === 'light' ? 'dark' : 'light'} mode"
        title="Switch to ${currentMode === 'light' ? 'dark' : 'light'} mode"
      >
        <div class="mdv-dark-mode-toggle-track">
          <div class="mdv-dark-mode-toggle-thumb">
            <span class="mdv-dark-mode-icon light-icon">☀️</span>
            <span class="mdv-dark-mode-icon dark-icon">🌙</span>
          </div>
        </div>
      </button>
    `;
  }

  private groupThemesByBaseName(themes: ThemePreset[]): Record<string, ThemePreset[]> {
    const groups: Record<string, ThemePreset[]> = {};
    
    themes.forEach(theme => {
      const baseName = getThemeBaseName(theme.name);
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(theme);
    });

    return groups;
  }

  private renderThemeGroup(baseName: string, variants: ThemePreset[], isActive: boolean): string {
    // Only show the light variant in the list, but mark as active if either variant is active
    const lightVariant = variants.find(v => getThemeMode(v.name) === 'light') || variants[0];
    
    return this.renderThemeOption(lightVariant, isActive);
  }

  private renderThemeOption(theme: ThemePreset, isActive: boolean): string {
    const baseName = getThemeBaseName(theme.name);
    return `
      <button 
        class="mdv-theme-option ${isActive ? 'active' : ''}" 
        data-theme="${baseName}"
        aria-label="Switch to ${baseName} theme"
        aria-current="${isActive ? 'true' : 'false'}"
      >
        <div class="mdv-theme-option-content">
          <div class="mdv-theme-option-info">
            <span class="mdv-theme-option-name">${escapeHtmlAttribute(baseName)}</span>
            ${
              this.options.showDescription && theme.description
                ? `
              <span class="mdv-theme-option-description">${escapeHtmlAttribute(theme.description)}</span>
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

  private getThemeIcon(baseName: string, mode?: 'light' | 'dark'): string {
    const baseIcons: Record<string, string> = {
      default: '🎨',
      github: '🐙',
      material: '🎨',
    };

    const modeIcons: Record<string, string> = {
      light: '☀️',
      dark: '🌙',
    };

    if (mode && this.options.showDarkModeToggle) {
      return modeIcons[mode];
    }

    return baseIcons[baseName] || '🎨';
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
        return;
      }

      // Dark mode toggle
      const darkModeToggle = target.closest('.mdv-dark-mode-toggle') as HTMLElement;
      if (darkModeToggle) {
        e.stopPropagation();
        this.toggleDarkMode();
        return;
      }
    });

    // Custom theme button
    const customBtn = this.container.querySelector('.mdv-theme-custom-btn');
    customBtn?.addEventListener('click', e => {
      e.stopPropagation();
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

  private toggleDarkMode(): void {
    const currentTheme = this.themeManager.getCurrentTheme();
    console.log('Toggle dark mode - Current theme:', currentTheme.name);
    
    const newThemeName = toggleThemeMode(currentTheme.name);
    console.log('Toggle dark mode - New theme name:', newThemeName);
    
    const newTheme = this.themeManager.setTheme(newThemeName);
    console.log('Toggle dark mode - Set theme result:', newTheme ? newTheme.name : 'null');
    
    if (newTheme) {
      const newMode = getThemeMode(newTheme.name);
      this.updateUI();
      
      if (this.options.onModeChange) {
        this.options.onModeChange(newMode);
      }
      
      if (this.options.onThemeChange) {
        this.options.onThemeChange(newTheme);
      }
    } else {
      console.error('Failed to set new theme:', newThemeName);
    }
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

  private selectTheme(baseName: string): void {
    const currentTheme = this.themeManager.getCurrentTheme();
    const currentMode = getThemeMode(currentTheme.name);
    const newThemeName = `${baseName}-${currentMode}`;
    
    console.log('Select theme - Base name:', baseName);
    console.log('Select theme - Current theme:', currentTheme.name);
    console.log('Select theme - Current mode:', currentMode);
    console.log('Select theme - New theme name:', newThemeName);
    
    const theme = this.themeManager.setTheme(newThemeName);
    if (theme) {
      console.log('Select theme - Successfully set:', theme.name);
      this.updateUI();
      this.closeDropdown();

      if (this.options.onThemeChange) {
        this.options.onThemeChange(theme);
      }
    } else {
      console.error('Select theme - Failed to set theme:', newThemeName);
    }
  }

  private updateUI(): void {
    if (!this.container) return;

    const currentTheme = this.themeManager.getCurrentTheme();
    const currentBaseName = getThemeBaseName(currentTheme.name);
    const currentMode = getThemeMode(currentTheme.name);

    // Update trigger
    const trigger = this.container.querySelector('.mdv-theme-trigger');
    if (trigger) {
      trigger.innerHTML = `
        ${this.getThemeIcon(currentBaseName, currentMode)}
        <span class="mdv-theme-name">${currentBaseName}</span>
      `;
    }

    // Update dark mode toggle
    const darkModeToggle = this.container.querySelector('.mdv-dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.className = `mdv-dark-mode-toggle ${currentMode}`;
      darkModeToggle.setAttribute('aria-label', `Toggle ${currentMode === 'light' ? 'dark' : 'light'} mode`);
      darkModeToggle.setAttribute('title', `Switch to ${currentMode === 'light' ? 'dark' : 'light'} mode`);
    }

    // Update active state
    this.container.querySelectorAll('.mdv-theme-option').forEach(option => {
      const isActive = option.getAttribute('data-theme') === currentBaseName;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-current', isActive.toString());
    });

    // Re-render the container to update dark mode toggle position if separate
    if (this.options.showDarkModeToggle && this.options.darkModeTogglePosition === 'separate') {
      this.container.innerHTML = this.render();
      this.setupEventListeners();
    }
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
      
      /* Dark mode toggle styles */
      .mdv-theme-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .mdv-dark-mode-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        padding: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      
      .mdv-dark-mode-toggle-track {
        width: 100%;
        height: 100%;
        background: var(--mdv-color-border);
        border-radius: 12px;
        position: relative;
        transition: background-color 0.3s ease;
      }
      
      .mdv-dark-mode-toggle.dark .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-primary);
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
      
      .mdv-dark-mode-toggle.dark .mdv-dark-mode-toggle-thumb {
        transform: translateX(20px);
      }
      
      .mdv-dark-mode-icon {
        position: absolute;
        transition: opacity 0.3s ease;
      }
      
      .mdv-dark-mode-toggle.light .light-icon {
        opacity: 1;
      }
      
      .mdv-dark-mode-toggle.light .dark-icon {
        opacity: 0;
      }
      
      .mdv-dark-mode-toggle.dark .light-icon {
        opacity: 0;
      }
      
      .mdv-dark-mode-toggle.dark .dark-icon {
        opacity: 1;
      }
      
      .mdv-dark-mode-toggle:hover .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-text-light);
      }
      
      .mdv-dark-mode-toggle.dark:hover .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-primary);
        filter: brightness(1.1);
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
