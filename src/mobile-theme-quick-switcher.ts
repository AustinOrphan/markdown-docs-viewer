import { ThemeManager } from './theme-manager';
// Utility function for theme management
function getThemeBaseName(themeName: string): string {
  return themeName.replace(/-(light|dark)$/, '');
}

export interface MobileThemeQuickSwitcherOptions {
  themeManager: ThemeManager;
  maxRecentThemes?: number;
  popularThemes?: string[];
  onThemeChange?: (themeName: string) => void;
}

/**
 * Mobile-optimized theme quick switcher that shows recently used themes
 * in a horizontal scrollable list for quick access
 */
export class MobileThemeQuickSwitcher {
  private themeManager: ThemeManager;
  private options: MobileThemeQuickSwitcherOptions;
  private container: HTMLElement | null = null;
  private recentThemes: string[] = [];
  private storageKey = 'mdv-recent-themes';

  constructor(options: MobileThemeQuickSwitcherOptions) {
    this.themeManager = options.themeManager;
    this.options = {
      maxRecentThemes: 5,
      popularThemes: ['github', 'vscode', 'material', 'nord', 'dracula'],
      ...options,
    };

    this.loadRecentThemes();
  }

  private loadRecentThemes(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.recentThemes = JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }

    // Add current theme if not in recent
    const currentTheme = getThemeBaseName(this.themeManager.getCurrentTheme().name);
    if (!this.recentThemes.includes(currentTheme)) {
      this.recentThemes.unshift(currentTheme);
    }

    // Limit to max recent themes
    this.recentThemes = this.recentThemes.slice(0, this.options.maxRecentThemes!);
  }

  private saveRecentThemes(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recentThemes));
    } catch {
      // Ignore storage errors
    }
  }

  private addToRecent(themeName: string): void {
    const baseName = getThemeBaseName(themeName);

    // Remove if already exists
    this.recentThemes = this.recentThemes.filter(t => t !== baseName);

    // Add to beginning
    this.recentThemes.unshift(baseName);

    // Limit to max
    this.recentThemes = this.recentThemes.slice(0, this.options.maxRecentThemes!);

    this.saveRecentThemes();
    this.updateUI();
  }

  public render(): string {
    const currentTheme = getThemeBaseName(this.themeManager.getCurrentTheme().name);

    // Get popular themes that are not in recent
    const popularThemes = (this.options.popularThemes || [])
      .filter(theme => !this.recentThemes.includes(theme))
      .slice(0, 3);

    const allThemes = [...this.recentThemes, ...popularThemes];

    return `
      <div class="mdv-mobile-quick-themes">
        <div class="mdv-mobile-quick-themes-scroll">
          ${allThemes
            .map(
              themeName => `
            <button 
              class="mdv-mobile-quick-theme ${themeName === currentTheme ? 'active' : ''}"
              data-theme="${themeName}"
              aria-label="Switch to ${themeName} theme"
              title="${themeName}"
            >
              <span class="mdv-mobile-quick-theme-preview">
                ${this.renderThemePreview(themeName)}
              </span>
              <span class="mdv-mobile-quick-theme-name">${themeName}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  private renderThemePreview(themeName: string): string {
    const theme =
      this.themeManager.getTheme(`${themeName}-light`) ||
      this.themeManager.getTheme(`${themeName}-dark`);

    if (!theme) return '';

    return `
      <span class="mdv-mobile-quick-theme-colors">
        <span style="background-color: ${theme.colors.primary}"></span>
        <span style="background-color: ${theme.colors.secondary}"></span>
        <span style="background-color: ${theme.colors.background}"></span>
      </span>
    `;
  }

  public attachTo(container: HTMLElement): void {
    this.container = container;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    this.container.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const button = target.closest('.mdv-mobile-quick-theme') as HTMLElement;

      if (button && button.dataset.theme) {
        this.selectTheme(button.dataset.theme);
      }
    });

    // Native horizontal scrolling is sufficient on mobile
    // The CSS already has overflow-x: auto which provides native momentum scrolling
  }

  private selectTheme(baseName: string): void {
    const currentMode = this.themeManager.getCurrentTheme().name.includes('-dark')
      ? 'dark'
      : 'light';
    const fullThemeName = `${baseName}-${currentMode}`;

    const theme = this.themeManager.setTheme(fullThemeName);
    if (theme) {
      this.addToRecent(baseName);

      if (this.options.onThemeChange) {
        this.options.onThemeChange(fullThemeName);
      }
    }
  }

  private updateUI(): void {
    if (!this.container) return;

    // Update active theme without destroying event listeners
    const activeTheme = this.container.querySelector('.mdv-mobile-quick-theme.active');
    if (activeTheme) {
      activeTheme.classList.remove('active');
    }

    // Find and mark new active theme
    const currentTheme = this.themeManager.getCurrentTheme();
    const currentBaseName = getThemeBaseName(currentTheme.name);
    const newActiveTheme = this.container.querySelector(`[data-theme="${currentBaseName}"]`);
    if (newActiveTheme) {
      newActiveTheme.classList.add('active');
    }
  }

  public getStyles(): string {
    return `
      .mdv-mobile-quick-themes {
        display: none;
        padding: 8px 0;
        background: var(--mdv-color-surface);
        border-bottom: 1px solid var(--mdv-color-border);
      }
      
      @media (max-width: 768px) {
        .mdv-mobile-quick-themes {
          display: block;
        }
      }
      
      .mdv-mobile-quick-themes-scroll {
        display: flex;
        gap: 8px;
        padding: 0 12px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      .mdv-mobile-quick-themes-scroll::-webkit-scrollbar {
        display: none;
      }
      
      .mdv-mobile-quick-theme {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px;
        background: transparent;
        border: 1px solid var(--mdv-color-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }
      
      .mdv-mobile-quick-theme:active {
        transform: scale(0.95);
      }
      
      .mdv-mobile-quick-theme.active {
        border-color: var(--mdv-color-primary);
        background: rgba(var(--mdv-color-primary-rgb, 9, 105, 218), 0.1);
      }
      
      .mdv-mobile-quick-theme-preview {
        width: 40px;
        height: 30px;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--mdv-color-border);
      }
      
      .mdv-mobile-quick-theme-colors {
        display: flex;
        height: 100%;
      }
      
      .mdv-mobile-quick-theme-colors span {
        flex: 1;
      }
      
      .mdv-mobile-quick-theme-name {
        font-size: 0.7rem;
        text-transform: capitalize;
        color: var(--mdv-color-text);
        white-space: nowrap;
      }
      
      .mdv-mobile-quick-theme.active .mdv-mobile-quick-theme-name {
        color: var(--mdv-color-primary);
        font-weight: 500;
      }
    `;
  }
}
