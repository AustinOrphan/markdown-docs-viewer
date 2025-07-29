import { Theme } from './types';
import { ThemeManager, ThemePreset } from './theme-manager';
import {
  escapeHtmlAttribute,
  sanitizeCssColor,
  sanitizeFontFamily,
  sanitizeCssValue,
} from './utils';
import { createCustomTheme, getThemeBaseName, getThemeMode } from './themes';

type ThemeColors = Theme['colors'];
type ThemeFonts = Theme['fonts'];
type ThemeSpacing = Theme['spacing'];

export interface ThemeBuilderOptions {
  onThemeCreate?: (theme: ThemePreset) => void;
  onThemeUpdate?: (theme: ThemePreset) => void;
  onClose?: () => void;
  allowExport?: boolean;
  allowImport?: boolean;
  showPreview?: boolean;
  showAccessibilityCheck?: boolean;
  defaultMode?: 'light' | 'dark';
  allowModeSelection?: boolean;
}

export interface ColorInput {
  key: keyof ThemeColors;
  label: string;
  description?: string;
  category: 'primary' | 'background' | 'text' | 'semantic';
}

export class ThemeBuilder {
  private themeManager: ThemeManager;
  private options: ThemeBuilderOptions;
  private container: HTMLElement | null = null;
  private currentTheme: Theme;
  private originalTheme: Theme;
  private isOpen: boolean = false;
  private currentMode: 'light' | 'dark';

  private readonly colorInputs: ColorInput[] = [
    // Primary colors
    { key: 'primary', label: 'Primary', description: 'Main accent color', category: 'primary' },
    {
      key: 'secondary',
      label: 'Secondary',
      description: 'Secondary accent color',
      category: 'primary',
    },

    // Background colors
    {
      key: 'background',
      label: 'Background',
      description: 'Main background color',
      category: 'background',
    },
    {
      key: 'surface',
      label: 'Surface',
      description: 'Card and panel background',
      category: 'background',
    },

    // Text colors
    { key: 'text', label: 'Text', description: 'Body text color', category: 'text' },
    {
      key: 'textPrimary',
      label: 'Primary Text',
      description: 'Primary text color',
      category: 'text',
    },
    {
      key: 'textSecondary',
      label: 'Secondary Text',
      description: 'Secondary text color',
      category: 'text',
    },
    { key: 'textLight', label: 'Light Text', description: 'Light text color', category: 'text' },

    // Border and code
    { key: 'border', label: 'Border', description: 'Border color', category: 'background' },
    { key: 'code', label: 'Code Text', description: 'Inline code text color', category: 'text' },
    {
      key: 'codeBackground',
      label: 'Code Background',
      description: 'Code block background',
      category: 'background',
    },
    { key: 'link', label: 'Link', description: 'Link color', category: 'primary' },
    { key: 'linkHover', label: 'Link Hover', description: 'Link hover color', category: 'primary' },

    // Semantic colors
    { key: 'error', label: 'Error', description: 'Error state color', category: 'semantic' },
    { key: 'warning', label: 'Warning', description: 'Warning state color', category: 'semantic' },
    { key: 'success', label: 'Success', description: 'Success state color', category: 'semantic' },
  ];

  constructor(themeManager: ThemeManager, options: ThemeBuilderOptions = {}) {
    this.themeManager = themeManager;
    this.options = {
      allowExport: true,
      allowImport: true,
      showPreview: true,
      showAccessibilityCheck: true,
      allowModeSelection: true,
      ...options,
    };

    this.originalTheme = themeManager.getCurrentTheme();
    this.currentMode = options.defaultMode || getThemeMode(this.originalTheme.name);
    this.currentTheme = this.deepCloneTheme(this.originalTheme);
  }

  public render(): string {
    return `
      <div class="mdv-theme-builder-overlay ${this.isOpen ? 'open' : ''}" aria-hidden="${!this.isOpen}">
        <div class="mdv-theme-builder" role="dialog" aria-labelledby="theme-builder-title">
          <div class="mdv-theme-builder-header">
            <h2 id="theme-builder-title">Custom Theme Builder</h2>
            <button class="mdv-theme-builder-close" aria-label="Close theme builder">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
          
          <div class="mdv-theme-builder-content">
            <div class="mdv-theme-builder-sidebar">
              <div class="mdv-theme-builder-section">
                <h3>Theme Information</h3>
                <div class="mdv-theme-builder-field">
                  <label for="theme-name">Theme Name</label>
                  <input type="text" id="theme-name" value="${escapeHtmlAttribute(getThemeBaseName(this.currentTheme.name))}" placeholder="Enter theme name">
                </div>
              </div>
              
              ${
                this.options.allowModeSelection
                  ? `
              <div class="mdv-theme-builder-section">
                <h3>Theme Mode</h3>
                <div class="mdv-theme-builder-mode-selector">
                  <label class="mdv-theme-builder-mode-option">
                    <input type="radio" name="theme-mode" value="light" ${this.currentMode === 'light' ? 'checked' : ''}>
                    <span class="mdv-theme-builder-mode-label">
                      <span class="mdv-theme-builder-mode-icon">☀️</span>
                      Light Mode
                    </span>
                  </label>
                  <label class="mdv-theme-builder-mode-option">
                    <input type="radio" name="theme-mode" value="dark" ${this.currentMode === 'dark' ? 'checked' : ''}>
                    <span class="mdv-theme-builder-mode-label">
                      <span class="mdv-theme-builder-mode-icon">🌙</span>
                      Dark Mode
                    </span>
                  </label>
                </div>
              </div>
              `
                  : ''
              }
              
              <div class="mdv-theme-builder-section">
                <h3>Base Theme</h3>
                <select id="base-theme" aria-label="Select base theme">
                  ${this.themeManager
                    .getAvailableBaseThemes()
                    .map(
                      baseName => `
                    <option value="${escapeHtmlAttribute(baseName)}" ${baseName === getThemeBaseName(this.originalTheme.name) ? 'selected' : ''}>
                      ${escapeHtmlAttribute(baseName)}
                    </option>
                  `
                    )
                    .join('')}
                </select>
              </div>
              
              <div class="mdv-theme-builder-section">
                <h3>Colors</h3>
                ${this.renderColorInputs()}
              </div>
              
              <div class="mdv-theme-builder-section">
                <h3>Typography</h3>
                ${this.renderFontInputs()}
              </div>
              
              <div class="mdv-theme-builder-section">
                <h3>Spacing & Layout</h3>
                ${this.renderSpacingInputs()}
              </div>
              
              <div class="mdv-theme-builder-section">
                <h3>Border Radius</h3>
                <div class="mdv-theme-builder-field">
                  <label for="border-radius">Border Radius</label>
                  <input type="text" id="border-radius" value="${escapeHtmlAttribute(sanitizeCssValue(this.currentTheme.borderRadius))}" placeholder="e.g., 0.5rem">
                </div>
              </div>
              
              ${this.options.showAccessibilityCheck ? this.renderAccessibilityCheck() : ''}
              
              <div class="mdv-theme-builder-actions">
                ${
                  this.options.allowImport
                    ? `
                  <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" id="import-theme">
                    Import Theme
                  </button>
                `
                    : ''
                }
                ${
                  this.options.allowExport
                    ? `
                  <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" id="export-theme">
                    Export Theme
                  </button>
                `
                    : ''
                }
                <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" id="reset-theme">
                  Reset
                </button>
                <button class="mdv-theme-builder-btn mdv-theme-builder-btn-primary" id="save-theme">
                  Save Theme
                </button>
              </div>
            </div>
            
            ${
              this.options.showPreview
                ? `
              <div class="mdv-theme-builder-preview">
                <h3>Preview</h3>
                <div class="mdv-theme-builder-preview-content" id="theme-preview">
                  ${this.renderPreview()}
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  private renderColorInputs(): string {
    const categories = ['primary', 'background', 'text', 'semantic'] as const;

    return categories
      .map(category => {
        const inputs = this.colorInputs.filter(input => input.category === category);
        return `
        <div class="mdv-theme-builder-color-category">
          <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
          ${inputs
            .map(
              input => `
            <div class="mdv-theme-builder-field mdv-theme-builder-color-field">
              <label for="color-${input.key}">${input.label}</label>
              <div class="mdv-theme-builder-color-input">
                <input 
                  type="color" 
                  id="color-${input.key}" 
                  value="${escapeHtmlAttribute(sanitizeCssColor(this.currentTheme.colors[input.key]))}"
                  aria-label="${input.label} color"
                >
                <input 
                  type="text" 
                  id="color-text-${input.key}" 
                  value="${escapeHtmlAttribute(sanitizeCssColor(this.currentTheme.colors[input.key]))}"
                  placeholder="#000000"
                  aria-label="${input.label} color value"
                >
              </div>
              ${input.description ? `<small>${input.description}</small>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `;
      })
      .join('');
  }

  private renderFontInputs(): string {
    const fonts = [
      { key: 'body' as keyof ThemeFonts, label: 'Body Font', description: 'Main text font family' },
      {
        key: 'heading' as keyof ThemeFonts,
        label: 'Heading Font',
        description: 'Heading font family',
      },
      { key: 'code' as keyof ThemeFonts, label: 'Code Font', description: 'Monospace font family' },
    ];

    return fonts
      .map(
        font => `
      <div class="mdv-theme-builder-field">
        <label for="font-${font.key}">${font.label}</label>
        <input 
          type="text" 
          id="font-${font.key}" 
          value="${escapeHtmlAttribute(sanitizeFontFamily(this.currentTheme.fonts[font.key]))}"
          placeholder="Font family"
        >
        <small>${font.description}</small>
      </div>
    `
      )
      .join('');
  }

  private renderSpacingInputs(): string {
    const spacingInputs = [
      {
        key: 'unit' as keyof ThemeSpacing,
        label: 'Base Unit',
        description: 'Base spacing unit in pixels',
        type: 'number',
      },
      {
        key: 'containerMaxWidth' as keyof ThemeSpacing,
        label: 'Container Max Width',
        description: 'Maximum container width',
        type: 'text',
      },
      {
        key: 'sidebarWidth' as keyof ThemeSpacing,
        label: 'Sidebar Width',
        description: 'Sidebar width',
        type: 'text',
      },
    ];

    return spacingInputs
      .map(
        input => `
      <div class="mdv-theme-builder-field">
        <label for="spacing-${input.key}">${input.label}</label>
        <input 
          type="${input.type}" 
          id="spacing-${input.key}" 
          value="${escapeHtmlAttribute(sanitizeCssValue(this.currentTheme.spacing[input.key]))}"
          placeholder="${input.type === 'number' ? '8' : 'e.g., 1200px'}"
        >
        <small>${input.description}</small>
      </div>
    `
      )
      .join('');
  }

  private renderAccessibilityCheck(): string {
    const textBgRatio = this.themeManager.getContrastRatio(
      this.currentTheme.colors.textPrimary,
      this.currentTheme.colors.background
    );
    const primaryBgRatio = this.themeManager.getContrastRatio(
      this.currentTheme.colors.primary,
      this.currentTheme.colors.background
    );

    return `
      <div class="mdv-theme-builder-section">
        <h3>Accessibility Check</h3>
        <div class="mdv-theme-builder-accessibility">
          <div class="mdv-theme-builder-contrast-check">
            <span>Text/Background:</span>
            <span class="mdv-contrast-ratio ${textBgRatio >= 4.5 ? 'pass' : 'fail'}">
              ${textBgRatio.toFixed(1)}:1 ${textBgRatio >= 4.5 ? '✓' : '✗'}
            </span>
          </div>
          <div class="mdv-theme-builder-contrast-check">
            <span>Primary/Background:</span>
            <span class="mdv-contrast-ratio ${primaryBgRatio >= 3 ? 'pass' : 'fail'}">
              ${primaryBgRatio.toFixed(1)}:1 ${primaryBgRatio >= 3 ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private renderPreview(): string {
    return `
      <div class="mdv-theme-preview-sample">
        <h1>Sample Heading</h1>
        <p>This is a sample paragraph to demonstrate how your theme will look. You can see the primary text color, background, and overall styling.</p>
        <a href="#" style="color: ${sanitizeCssColor(this.currentTheme.colors.link)}">Sample Link</a>
        <blockquote style="background: ${sanitizeCssColor(this.currentTheme.colors.surface)}; border-left: 4px solid ${sanitizeCssColor(this.currentTheme.colors.primary)};">
          This is a blockquote to show surface colors and borders.
        </blockquote>
        <code style="background: ${sanitizeCssColor(this.currentTheme.colors.codeBackground)}; color: ${sanitizeCssColor(this.currentTheme.colors.code)};">
          code example
        </code>
        <div class="mdv-preview-buttons">
          <button style="background: ${sanitizeCssColor(this.currentTheme.colors.primary)}; color: white;">Primary Button</button>
          <button style="background: ${sanitizeCssColor(this.currentTheme.colors.secondary)}; color: white;">Secondary Button</button>
        </div>
      </div>
    `;
  }

  public open(): void {
    this.isOpen = true;
    this.updateDisplay();
  }

  public close(): void {
    this.isOpen = false;
    this.updateDisplay();
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public attachTo(container: HTMLElement): void {
    this.container = container;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.mdv-theme-builder-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Overlay click to close
    const overlay = this.container.querySelector('.mdv-theme-builder-overlay');
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) this.close();
    });

    // Color inputs
    this.colorInputs.forEach(input => {
      if (!this.container) return;

      const colorInput = this.container.querySelector<HTMLInputElement>(`#color-${input.key}`);
      const textInput = this.container.querySelector<HTMLInputElement>(`#color-text-${input.key}`);

      if (!colorInput || !textInput) {
        console.warn(`Color inputs not found for: ${input.key}`);
        return;
      }

      colorInput.addEventListener('input', e => {
        const value = (e.target as HTMLInputElement).value;
        this.updateColor(input.key, value);
        textInput.value = value;
      });

      textInput.addEventListener('input', e => {
        const value = (e.target as HTMLInputElement).value;
        if (this.isValidColor(value)) {
          this.updateColor(input.key, value);
          colorInput.value = value;
        }
      });
    });

    // Font inputs
    const fontKeys: (keyof ThemeFonts)[] = ['body', 'heading', 'code'];
    fontKeys.forEach(key => {
      if (!this.container) return;

      const input = this.container.querySelector<HTMLInputElement>(`#font-${key}`);
      if (!input) {
        console.warn(`Font input not found: font-${key}`);
        return;
      }
      input.addEventListener('input', e => {
        this.updateFont(key, (e.target as HTMLInputElement).value);
      });
    });

    // Spacing inputs
    const spacingKeys: (keyof ThemeSpacing)[] = ['unit', 'containerMaxWidth', 'sidebarWidth'];
    spacingKeys.forEach(key => {
      if (!this.container) return;

      const input = this.container.querySelector<HTMLInputElement>(`#spacing-${key}`);
      if (!input) {
        console.warn(`Spacing input not found: spacing-${key}`);
        return;
      }
      input.addEventListener('input', e => {
        const value =
          key === 'unit'
            ? parseInt((e.target as HTMLInputElement).value)
            : (e.target as HTMLInputElement).value;
        this.updateSpacing(key, value);
      });
    });

    // Border radius
    const borderRadiusInput = this.container.querySelector<HTMLInputElement>('#border-radius');
    if (borderRadiusInput) {
      borderRadiusInput.addEventListener('input', e => {
        this.currentTheme.borderRadius = (e.target as HTMLInputElement).value;
        this.updatePreview();
      });
    }

    // Theme name
    const themeNameInput = this.container.querySelector<HTMLInputElement>('#theme-name');
    if (themeNameInput) {
      themeNameInput.addEventListener('input', e => {
        this.currentTheme.name = (e.target as HTMLInputElement).value;
      });
    }

    // Mode selection
    if (this.options.allowModeSelection) {
      const modeInputs = this.container.querySelectorAll<HTMLInputElement>(
        'input[name="theme-mode"]'
      );
      modeInputs.forEach(input => {
        input.addEventListener('change', e => {
          const newMode = (e.target as HTMLInputElement).value as 'light' | 'dark';
          this.switchMode(newMode);
        });
      });
    }

    // Base theme selection
    const baseThemeSelect = this.container.querySelector<HTMLSelectElement>('#base-theme');
    if (baseThemeSelect) {
      baseThemeSelect.addEventListener('change', e => {
        this.loadBaseTheme((e.target as HTMLSelectElement).value);
      });
    }

    // Action buttons
    const saveBtn = this.container.querySelector('#save-theme');
    saveBtn?.addEventListener('click', () => this.saveTheme());

    const resetBtn = this.container.querySelector('#reset-theme');
    resetBtn?.addEventListener('click', () => this.resetTheme());

    const exportBtn = this.container.querySelector('#export-theme');
    exportBtn?.addEventListener('click', () => this.exportTheme());

    const importBtn = this.container.querySelector('#import-theme');
    importBtn?.addEventListener('click', () => this.importTheme());

    // Escape key to close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  private updateColor(key: keyof ThemeColors, value: string): void {
    this.currentTheme.colors[key] = value;
    this.updatePreview();
    this.updateAccessibilityCheck();
  }

  private updateFont(key: keyof ThemeFonts, value: string): void {
    this.currentTheme.fonts[key] = value;
    this.updatePreview();
  }

  private updateSpacing(key: keyof ThemeSpacing, value: string | number): void {
    (this.currentTheme.spacing as any)[key] = value;
    this.updatePreview();
  }

  private updatePreview(): void {
    if (!this.options.showPreview || !this.container) return;

    const preview = this.container.querySelector('#theme-preview');
    if (preview) {
      preview.innerHTML = this.renderPreview();
    }

    // Apply theme variables to preview
    const previewContent = this.container.querySelector(
      '.mdv-theme-builder-preview-content'
    ) as HTMLElement;
    if (previewContent) {
      Object.entries(this.currentTheme.colors).forEach(([key, value]) => {
        previewContent.style.setProperty(`--mdv-color-${this.kebabCase(key)}`, value);
      });
    }
  }

  private updateAccessibilityCheck(): void {
    if (!this.options.showAccessibilityCheck || !this.container) return;

    const accessibilitySection = this.container.querySelector('.mdv-theme-builder-accessibility');
    if (accessibilitySection) {
      accessibilitySection.innerHTML =
        this.renderAccessibilityCheck().match(
          /<div class="mdv-theme-builder-accessibility">(.*?)<\/div>/s
        )?.[1] || '';
    }
  }

  private updateDisplay(): void {
    if (!this.container) return;

    const overlay = this.container.querySelector('.mdv-theme-builder-overlay');
    if (overlay) {
      overlay.classList.toggle('open', this.isOpen);
      overlay.setAttribute('aria-hidden', (!this.isOpen).toString());
    }
  }

  private switchMode(newMode: 'light' | 'dark'): void {
    this.currentMode = newMode;
    const currentBaseName = getThemeBaseName(this.currentTheme.name);
    this.loadBaseTheme(currentBaseName);
  }

  private loadBaseTheme(baseName: string): void {
    // Create the theme name with current mode
    const themeName = `${baseName}-${this.currentMode}`;
    const baseTheme = this.themeManager.getTheme(themeName);

    if (baseTheme) {
      // Preserve custom name if user has set one
      const currentName = this.container?.querySelector<HTMLInputElement>('#theme-name')?.value;
      const shouldPreserveName =
        currentName && currentName !== getThemeBaseName(this.currentTheme.name);

      this.currentTheme = this.deepCloneTheme(baseTheme);

      if (shouldPreserveName) {
        this.currentTheme.name = currentName;
      }

      this.refreshInputs();
      this.updatePreview();
      this.updateAccessibilityCheck();
    }
  }

  private refreshInputs(): void {
    if (!this.container) return;

    // Update color inputs
    this.colorInputs.forEach(input => {
      if (!this.container) return;

      const colorInput = this.container.querySelector<HTMLInputElement>(`#color-${input.key}`);
      const textInput = this.container.querySelector<HTMLInputElement>(`#color-text-${input.key}`);

      if (colorInput) colorInput.value = this.currentTheme.colors[input.key];
      if (textInput) textInput.value = this.currentTheme.colors[input.key];
    });

    // Update other inputs
    const inputs = [
      { selector: '#theme-name', value: this.currentTheme.name },
      { selector: '#border-radius', value: this.currentTheme.borderRadius },
      { selector: '#font-body', value: this.currentTheme.fonts.body },
      { selector: '#font-heading', value: this.currentTheme.fonts.heading },
      { selector: '#font-code', value: this.currentTheme.fonts.code },
      { selector: '#spacing-unit', value: this.currentTheme.spacing.unit.toString() },
      {
        selector: '#spacing-containerMaxWidth',
        value: this.currentTheme.spacing.containerMaxWidth,
      },
      { selector: '#spacing-sidebarWidth', value: this.currentTheme.spacing.sidebarWidth },
    ];

    inputs.forEach(({ selector, value }) => {
      if (!this.container) return;

      const input = this.container.querySelector<HTMLInputElement>(selector);
      if (input) input.value = value;
    });
  }

  private saveTheme(): void {
    // Get the custom theme name from the input, or use current theme name
    const themeNameInput = this.container?.querySelector<HTMLInputElement>('#theme-name');
    const customName = themeNameInput?.value || getThemeBaseName(this.currentTheme.name);

    // Create the theme with the current mode
    const customThemeName = `${customName}-${this.currentMode}`;

    // Use the new createCustomTheme from themes.ts instead of ThemeManager's method
    const customTheme = createCustomTheme(
      getThemeBaseName(this.originalTheme.name),
      this.currentMode,
      {
        ...this.currentTheme,
        name: customThemeName,
      }
    );

    // Register it with the theme manager
    this.themeManager.registerTheme(customTheme);

    if (this.options.onThemeCreate) {
      this.options.onThemeCreate(customTheme);
    }

    this.close();
  }

  private resetTheme(): void {
    this.currentTheme = this.deepCloneTheme(this.originalTheme);
    this.refreshInputs();
    this.updatePreview();
    this.updateAccessibilityCheck();
  }

  private exportTheme(): void {
    const themeJson = this.themeManager.exportTheme(this.currentTheme);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentTheme.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private importTheme(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const themeJson = e.target?.result as string;
            const importedTheme = this.themeManager.importTheme(themeJson);

            if (importedTheme) {
              this.currentTheme = this.deepCloneTheme(importedTheme);
              this.refreshInputs();
              this.updatePreview();
              this.updateAccessibilityCheck();
            }
          } catch (error) {
            console.error('Failed to import theme:', error);
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private deepCloneTheme(theme: Theme): Theme {
    // Use structuredClone if available (modern browsers)
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(theme);
    }

    // Fallback to JSON parse/stringify for older browsers
    return JSON.parse(JSON.stringify(theme));
  }

  public getStyles(): string {
    return `
      .mdv-theme-builder-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: var(--mdv-z-modal, 1040);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .mdv-theme-builder-overlay.open {
        opacity: 1;
        visibility: visible;
      }
      
      .mdv-theme-builder {
        position: relative;
        max-width: 1200px;
        max-height: 90vh;
        margin: 5vh auto;
        background: var(--mdv-color-surface);
        border-radius: var(--mdv-border-radius);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .mdv-theme-builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--mdv-color-border);
        background: var(--mdv-color-background);
      }
      
      .mdv-theme-builder-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mdv-color-text);
      }
      
      .mdv-theme-builder-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: var(--mdv-color-text);
        transition: background 0.2s ease;
      }
      
      .mdv-theme-builder-close:hover {
        background: var(--mdv-color-surface);
      }
      
      .mdv-theme-builder-content {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      
      .mdv-theme-builder-sidebar {
        width: 400px;
        padding: 24px;
        overflow-y: auto;
        border-right: 1px solid var(--mdv-color-border);
      }
      
      .mdv-theme-builder-preview {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }
      
      .mdv-theme-builder-section {
        margin-bottom: 24px;
      }
      
      .mdv-theme-builder-section h3 {
        margin: 0 0 12px 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--mdv-color-text);
      }
      
      .mdv-theme-builder-section h4 {
        margin: 16px 0 8px 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--mdv-color-text);
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Mode selector styles */
      .mdv-theme-builder-mode-selector {
        display: flex;
        gap: 8px;
      }
      
      .mdv-theme-builder-mode-option {
        flex: 1;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .mdv-theme-builder-mode-option input[type="radio"] {
        display: none;
      }
      
      .mdv-theme-builder-mode-label {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--mdv-color-border);
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        background: var(--mdv-color-background);
        color: var(--mdv-color-text);
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-builder-mode-option:hover .mdv-theme-builder-mode-label {
        border-color: var(--mdv-color-primary);
        background: var(--mdv-color-surface);
      }
      
      .mdv-theme-builder-mode-option input[type="radio"]:checked + .mdv-theme-builder-mode-label {
        border-color: var(--mdv-color-primary);
        background: var(--mdv-color-primary);
        color: white;
      }
      
      .mdv-theme-builder-mode-icon {
        font-size: 1rem;
      }
      
      .mdv-theme-builder-field {
        margin-bottom: 12px;
      }
      
      .mdv-theme-builder-field label {
        display: block;
        margin-bottom: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--mdv-color-text);
      }
      
      .mdv-theme-builder-field input,
      .mdv-theme-builder-field select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--mdv-color-border);
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        background: var(--mdv-color-background);
        font-size: 0.875rem;
        transition: border-color 0.2s ease;
      }
      
      .mdv-theme-builder-field input:focus,
      .mdv-theme-builder-field select:focus {
        outline: none;
        border-color: var(--mdv-color-primary);
      }
      
      .mdv-theme-builder-field input::placeholder {
        color: var(--mdv-color-text);
        opacity: 0.5;
      }
      
      .mdv-theme-builder-field small {
        display: block;
        margin-top: 4px;
        font-size: 0.75rem;
        color: var(--mdv-color-text);
        opacity: 0.75;
      }
      
      .mdv-theme-builder-color-field {
        margin-bottom: 16px;
      }
      
      .mdv-theme-builder-color-input {
        display: flex;
        gap: 8px;
      }
      
      .mdv-theme-builder-color-input input[type="color"] {
        width: 48px;
        height: 36px;
        padding: 2px;
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        cursor: pointer;
      }
      
      .mdv-theme-builder-color-input input[type="text"] {
        flex: 1;
      }
      
      .mdv-theme-builder-accessibility {
        background: var(--mdv-color-background);
        padding: 12px;
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        border: 1px solid var(--mdv-color-border);
      }
      
      .mdv-theme-builder-contrast-check {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 0.875rem;
        color: var(--mdv-color-text);
      }
      
      .mdv-theme-builder-contrast-check:last-child {
        margin-bottom: 0;
      }
      
      .mdv-contrast-ratio.pass {
        color: var(--mdv-color-success);
        font-weight: 500;
      }
      
      .mdv-contrast-ratio.fail {
        color: var(--mdv-color-error);
        font-weight: 500;
      }
      
      .mdv-theme-builder-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--mdv-color-border);
      }
      
      .mdv-theme-builder-btn {
        padding: 8px 16px;
        border: 1px solid var(--mdv-color-border);
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .mdv-theme-builder-btn-primary {
        background: var(--mdv-color-primary);
        color: white;
        border-color: var(--mdv-color-primary);
      }
      
      .mdv-theme-builder-btn-primary:hover {
        background: var(--mdv-color-primary);
        opacity: 0.9;
      }
      
      .mdv-theme-builder-btn-secondary {
        background: var(--mdv-color-background);
        color: var(--mdv-color-text);
        border-color: var(--mdv-color-border);
      }
      
      .mdv-theme-builder-btn-secondary:hover {
        background: var(--mdv-color-surface);
      }
      
      .mdv-theme-preview-sample {
        background: var(--mdv-color-background);
        padding: 24px;
        border-radius: var(--mdv-border-radius);
        border: 1px solid var(--mdv-color-border);
      }
      
      .mdv-theme-preview-sample h1 {
        margin: 0 0 16px 0;
        color: var(--mdv-color-text-primary);
        font-family: var(--mdv-font-heading);
      }
      
      .mdv-theme-preview-sample p {
        margin: 0 0 16px 0;
        color: var(--mdv-color-text);
        font-family: var(--mdv-font-body);
        line-height: 1.6;
      }
      
      .mdv-theme-preview-sample blockquote {
        margin: 16px 0;
        padding: 12px 16px;
        border-radius: calc(var(--mdv-border-radius) * 0.75);
      }
      
      .mdv-theme-preview-sample code {
        padding: 4px 8px;
        border-radius: calc(var(--mdv-border-radius) * 0.5);
        font-family: var(--mdv-font-code);
        font-size: 0.875rem;
      }
      
      .mdv-preview-buttons {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      
      .mdv-preview-buttons button {
        padding: 8px 16px;
        border: none;
        border-radius: calc(var(--mdv-border-radius) * 0.75);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
      }
      
      /* Mobile responsiveness - maintain same components with responsive layout */
      @media (max-width: 768px) {
        .mdv-theme-builder {
          margin: 0;
          max-height: 100vh;
          border-radius: 0;
        }
        
        .mdv-theme-builder-content {
          flex-direction: column;
        }
        
        .mdv-theme-builder-sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--mdv-color-border);
          max-height: 50vh;
          overflow-y: auto;
        }
        
        .mdv-theme-builder-preview {
          max-height: 50vh;
          border-top: 1px solid var(--mdv-color-border);
        }
        
        .mdv-theme-builder-actions {
          flex-direction: column;
          position: sticky;
          bottom: 0;
          background: var(--mdv-color-background);
          padding: 16px;
          border-top: 1px solid var(--mdv-color-border);
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .mdv-theme-builder-actions button {
          width: 100%;
        }
        
        .mdv-theme-builder-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `;
  }
}
