import { Theme } from './types';
import { ThemeManager, ThemePreset } from './theme-manager';
import { ThemeBuilder } from './theme-builder';
import { escapeHtmlAttribute } from './utils';
import { getThemeBaseName, getThemeMode, toggleThemeMode } from './themes';

// Mobile breakpoint constant (768px)
const MOBILE_BREAKPOINT = 768;

// Swipe-to-close threshold constant
const SWIPE_TO_CLOSE_THRESHOLD = 100;

export interface ThemeSwitcherOptions {
  position?: 'header' | 'footer' | 'sidebar' | 'floating';
  showPreview?: boolean;
  showDescription?: boolean;
  allowCustomThemes?: boolean;
  showDarkModeToggle?: boolean;
  darkModeTogglePosition?: 'inline' | 'separate';
  onThemeChange?: (theme: Theme) => void;
  onModeChange?: (mode: 'light' | 'dark') => void;
  customThemeAccess?: 'everyone' | 'none' | ((user?: any) => boolean);
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
      customThemeAccess: 'everyone',
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
                this.shouldShowCustomThemeButton()
                  ? `
                <button class="mdv-theme-custom-btn" aria-label="Create custom theme" title="Create custom theme">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                  </svg>
                </button>
              `
                  : ''
              }
            </div>
          </div>
          <div class="mdv-theme-list">
            ${Object.entries(themeGroups)
              .map(([baseName, themeVariants]) =>
                this.renderThemeGroup(baseName, themeVariants, currentBaseName === baseName)
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  private shouldShowCustomThemeButton(): boolean {
    if (!this.options.allowCustomThemes) return false;

    const access = this.options.customThemeAccess;
    if (access === 'none') return false;
    if (access === 'everyone') return true;
    if (typeof access === 'function') {
      // Pass user context if available (could be extended with actual user data)
      return access();
    }
    return true;
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

    // Mobile-specific enhancements
    if (this.isMobile()) {
      this.setupMobileInteractions();
    }
  }

  private setupMobileInteractions(): void {
    // Add backdrop for mobile
    this.createMobileBackdrop();

    // Handle swipe down to close on mobile
    this.setupSwipeToClose();
  }

  private createMobileBackdrop(): HTMLElement {
    let backdrop = document.querySelector('.mdv-theme-backdrop') as HTMLElement;
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mdv-theme-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.addEventListener('click', () => {
      this.closeDropdown();
    });

    return backdrop;
  }

  private setupSwipeToClose(): void {
    const dropdown = this.container?.querySelector('.mdv-theme-dropdown') as HTMLElement;
    if (!dropdown) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        dropdown.style.transition = 'none';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // Only allow downward swipes
      if (deltaY > 0) {
        dropdown.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      isDragging = false;
      dropdown.style.transition = '';

      const deltaY = currentY - startY;

      // If swiped down more than threshold or 30% of dropdown height, close it
      if (deltaY > SWIPE_TO_CLOSE_THRESHOLD || deltaY > dropdown.offsetHeight * 0.3) {
        this.closeDropdown();
      } else {
        dropdown.style.transform = '';
      }
    };

    dropdown.addEventListener('touchstart', handleTouchStart, { passive: true });
    dropdown.addEventListener('touchmove', handleTouchMove, { passive: true });
    dropdown.addEventListener('touchend', handleTouchEnd, { passive: true });
    dropdown.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  private toggleDarkMode(): void {
    const currentTheme = this.themeManager.getCurrentTheme();
    const newThemeName = toggleThemeMode(currentTheme.name);
    const newTheme = this.themeManager.setTheme(newThemeName);

    if (newTheme) {
      const newMode = getThemeMode(newTheme.name);
      this.updateUI();

      if (this.options.onModeChange) {
        this.options.onModeChange(newMode);
      }

      if (this.options.onThemeChange) {
        this.options.onThemeChange(newTheme);
      }
    }
  }

  private toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.updateDropdownState();

    if (this.isOpen) {
      // Show mobile backdrop
      if (this.isMobile()) {
        this.showMobileBackdrop();
      }
    } else {
      // Hide mobile backdrop
      if (this.isMobile()) {
        this.hideMobileBackdrop();
      }
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updateDropdownState();

    // Hide mobile backdrop
    if (this.isMobile()) {
      this.hideMobileBackdrop();
    }

    // Return focus to trigger button to avoid aria-hidden issues
    const trigger = this.container?.querySelector('.mdv-theme-trigger') as HTMLElement;
    trigger?.focus();
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

    const theme = this.themeManager.setTheme(newThemeName);
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
    const currentBaseName = getThemeBaseName(currentTheme.name);
    const currentMode = getThemeMode(currentTheme.name);

    // Update trigger
    const trigger = this.container.querySelector('.mdv-theme-trigger');
    if (trigger) {
      // Update icon and theme name without destroying the dropdown arrow
      const iconAndName = trigger.querySelector('.mdv-theme-name');
      if (iconAndName) {
        // Update existing elements
        const icon = this.getThemeIcon(currentBaseName, currentMode);
        const firstNode = trigger.firstChild;
        if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
          firstNode.textContent = icon;
        } else {
          trigger.insertBefore(document.createTextNode(icon), trigger.firstChild);
        }
        iconAndName.textContent = currentBaseName;
      } else {
        // Fallback: preserve dropdown arrow if it exists
        const dropdownArrow = trigger.querySelector('.mdv-dropdown-arrow');
        trigger.innerHTML = `
          ${this.getThemeIcon(currentBaseName, currentMode)}
          <span class="mdv-theme-name">${currentBaseName}</span>
          ${dropdownArrow ? dropdownArrow.outerHTML : '<span class="mdv-dropdown-arrow" aria-hidden="true">▼</span>'}
        `;
      }
    }

    // Update dark mode toggle
    const darkModeToggle = this.container.querySelector('.mdv-dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.className = `mdv-dark-mode-toggle ${currentMode}`;
      darkModeToggle.setAttribute(
        'aria-label',
        `Toggle ${currentMode === 'light' ? 'dark' : 'light'} mode`
      );
      darkModeToggle.setAttribute(
        'title',
        `Switch to ${currentMode === 'light' ? 'dark' : 'light'} mode`
      );
    }

    // Update active state
    this.container.querySelectorAll('.mdv-theme-option').forEach(option => {
      const isActive = option.getAttribute('data-theme') === currentBaseName;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-current', isActive.toString());
    });

    // Update dark mode toggle position if separate (more efficient approach)
    if (this.options.showDarkModeToggle && this.options.darkModeTogglePosition === 'separate') {
      this.updateSeparateDarkModeToggle(currentMode);
    }
  }

  private updateSeparateDarkModeToggle(currentMode: 'light' | 'dark'): void {
    // Find the separate dark mode toggle container
    const separateToggle = this.container?.parentElement?.querySelector(
      '.mdv-theme-switcher .mdv-dark-mode-toggle'
    );
    if (separateToggle) {
      // Update the toggle state without re-rendering the entire component
      separateToggle.className = `mdv-dark-mode-toggle ${currentMode}`;
      separateToggle.setAttribute(
        'aria-label',
        `Toggle ${currentMode === 'light' ? 'dark' : 'light'} mode`
      );
      separateToggle.setAttribute(
        'title',
        `Switch to ${currentMode === 'light' ? 'dark' : 'light'} mode`
      );
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
      builderContainer.className = 'mdv-theme-builder-container';
      builderContainer.innerHTML = this.themeBuilder.render();
      document.body.appendChild(builderContainer);

      // Inject theme builder styles
      const styleId = 'mdv-theme-builder-styles';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = this.themeBuilder.getStyles();
        document.head.appendChild(styleElement);
      }

      this.themeBuilder.attachTo(builderContainer);
    }

    this.themeBuilder.open();
    this.closeDropdown();
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  }

  private showMobileBackdrop(): void {
    const backdrop = document.querySelector('.mdv-theme-backdrop');
    if (backdrop) {
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  private hideMobileBackdrop(): void {
    const backdrop = document.querySelector('.mdv-theme-backdrop');
    if (backdrop) {
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  public destroy(): void {
    // Close any open dropdowns
    this.closeDropdown();

    // Clean up theme builder if it exists
    if (this.themeBuilder) {
      this.themeBuilder = null;
    }

    // Remove mobile backdrop if it exists
    this.hideMobileBackdrop();
    const backdrop = document.querySelector('.mdv-theme-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Clear container reference
    this.container = null;
    this.isOpen = false;
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
        color: var(--mdv-color-text);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-trigger:hover {
        background: var(--mdv-color-background);
        box-shadow: 0 2px 4px rgba(var(--mdv-color-text-rgb, 0, 0, 0), 0.1);
      }
      
      .mdv-theme-trigger:focus {
        outline: 2px solid var(--mdv-color-primary);
        outline-offset: 2px;
        background: var(--mdv-color-background);
      }
      
      .mdv-theme-trigger:focus:not(:focus-visible) {
        outline: none;
      }
      
      .mdv-theme-name {
        text-transform: capitalize;
        color: var(--mdv-color-text);
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
        z-index: var(--mdv-z-popover, 1060);
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
        color: var(--mdv-color-text);
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
        color: var(--mdv-color-text);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-custom-btn:hover {
        background: var(--mdv-color-background);
        color: var(--mdv-color-primary);
      }
      
      .mdv-theme-custom-btn:focus {
        outline: 2px solid var(--mdv-color-primary);
        outline-offset: 2px;
        background: var(--mdv-color-background);
        color: var(--mdv-color-primary);
      }
      
      .mdv-theme-custom-btn:focus:not(:focus-visible) {
        outline: none;
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
        color: var(--mdv-color-text);
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-option:hover {
        background: var(--mdv-color-background);
        border-color: var(--mdv-color-border);
      }
      
      .mdv-theme-option:focus {
        outline: 2px solid var(--mdv-color-primary);
        outline-offset: 2px;
        background: var(--mdv-color-background);
        border-color: var(--mdv-color-primary);
      }
      
      .mdv-theme-option:focus:not(:focus-visible) {
        outline: none;
      }
      
      .mdv-theme-option.active:focus {
        outline: 2px solid rgba(255, 255, 255, 0.8);
        outline-offset: 2px;
        background: var(--mdv-color-primary);
        border-color: var(--mdv-color-primary);
      }
      
      .mdv-theme-option.active {
        background: var(--mdv-color-primary);
        color: white;
        border-color: var(--mdv-color-primary);
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
        opacity: 0.8;
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
        background: var(--mdv-color-text);
        opacity: 0.3;
      }
      
      .mdv-dark-mode-toggle.dark:hover .mdv-dark-mode-toggle-track {
        background: var(--mdv-color-primary);
        filter: brightness(1.1);
      }
      
      .mdv-dark-mode-toggle:focus {
        outline: 2px solid var(--mdv-color-primary);
        outline-offset: 2px;
      }
      
      .mdv-dark-mode-toggle:focus:not(:focus-visible) {
        outline: none;
      }
      
      /* Mobile styles */
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .mdv-theme-dropdown {
          position: fixed;
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          margin: 0;
          border-radius: var(--mdv-border-radius) var(--mdv-border-radius) 0 0;
          max-height: 85vh;
          z-index: var(--mdv-z-popover, 1060);
          animation: slideUpMobile 0.3s ease-out;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        .mdv-theme-dropdown.open {
          animation: slideUpMobile 0.3s ease-out;
        }
        
        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .mdv-theme-dropdown-header {
          padding: 16px;
          position: sticky;
          top: 0;
          background: var(--mdv-color-surface);
          z-index: 1;
          border-bottom: 1px solid var(--mdv-color-border);
        }
        
        .mdv-theme-dropdown-header h3 {
          font-size: 1rem;
        }
        
        .mdv-theme-list {
          padding: 12px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
          max-height: calc(85vh - 60px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        .mdv-theme-option {
          padding: 16px;
          margin-bottom: 8px;
          min-height: 60px;
          touch-action: manipulation;
          position: relative;
          overflow: hidden;
        }
        
        .mdv-theme-option::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          background: radial-gradient(
            circle,
            rgba(var(--mdv-color-primary-rgb, 9, 105, 218), 0.3) 0%,
            rgba(var(--mdv-color-primary-rgb, 9, 105, 218), 0.1) 50%,
            transparent 70%
          );
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.2s ease-out, opacity 0.2s ease-out;
          pointer-events: none;
        }
        
        .mdv-theme-option:active {
          transform: scale(0.98);
        }
        
        .mdv-theme-option:active::after {
          transform: translate(-50%, -50%) scale(6);
          opacity: 1;
        }
        
        .mdv-theme-preview {
          gap: 4px;
        }
        
        .mdv-theme-preview-color {
          width: 20px;
          height: 20px;
          border-radius: 6px;
        }
        
        .mdv-theme-switcher-floating {
          bottom: calc(60px + env(safe-area-inset-bottom, 0));
        }
        
        /* Mobile backdrop */
        .mdv-theme-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: calc(var(--mdv-z-popover, 1060) - 1);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        .mdv-theme-backdrop.show {
          opacity: 1;
          visibility: visible;
        }
        
        /* Enhanced touch feedback */
        @media (hover: none) and (pointer: coarse) {
          .mdv-theme-option {
            transition: transform 0.1s ease-out, background-color 0.1s ease-out;
          }
          
          
          .mdv-dark-mode-toggle {
            transition: transform 0.2s ease-out;
          }
          
          .mdv-dark-mode-toggle:active {
            transform: scale(0.95);
          }
        }
      }
      
      /* Small mobile optimizations */
      @media (max-width: 400px) {
        .mdv-theme-option-name {
          font-size: 0.875rem;
        }
        
        .mdv-theme-option-description {
          font-size: 0.7rem;
        }
        
        .mdv-theme-preview-color {
          width: 16px;
          height: 16px;
        }
        
        .mdv-dark-mode-toggle {
          width: 40px;
          height: 22px;
        }
        
        .mdv-dark-mode-toggle-thumb {
          width: 18px;
          height: 18px;
        }
      }
    `;
  }
}
