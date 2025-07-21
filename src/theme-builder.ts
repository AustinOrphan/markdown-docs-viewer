import { Theme, ThemeColors, ThemeFonts, ThemeSpacing } from './types';
import { defaultTheme } from './themes';

export interface ThemeBuilderOptions {
  container: HTMLElement;
  initialTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  onSave?: (theme: Theme) => void;
  showPreview?: boolean;
  previewContent?: string;
}

export interface ColorGroup {
  name: string;
  colors: Array<{
    key: keyof ThemeColors;
    label: string;
    description?: string;
  }>;
}

export interface FontOption {
  name: string;
  value: string;
  category: 'serif' | 'sans-serif' | 'monospace';
}

export class ThemeBuilder {
  private container: HTMLElement;
  private currentTheme: Theme;
  private options: ThemeBuilderOptions;
  private previewContainer?: HTMLElement;
  private isDirty: boolean = false;

  private static readonly COLOR_GROUPS: ColorGroup[] = [
    {
      name: 'Primary Colors',
      colors: [
        { key: 'primary', label: 'Primary', description: 'Main brand color' },
        { key: 'secondary', label: 'Secondary', description: 'Accent color' },
        { key: 'accent', label: 'Accent', description: 'Highlight color' }
      ]
    },
    {
      name: 'Background Colors',
      colors: [
        { key: 'background', label: 'Background', description: 'Main background' },
        { key: 'surface', label: 'Surface', description: 'Card/panel background' },
        { key: 'codeBackground', label: 'Code Background', description: 'Code block background' }
      ]
    },
    {
      name: 'Text Colors',
      colors: [
        { key: 'textPrimary', label: 'Primary Text', description: 'Main text color' },
        { key: 'textSecondary', label: 'Secondary Text', description: 'Muted text color' }
      ]
    },
    {
      name: 'Interactive Colors',
      colors: [
        { key: 'link', label: 'Link', description: 'Link color' },
        { key: 'linkHover', label: 'Link Hover', description: 'Link hover state' },
        { key: 'border', label: 'Border', description: 'Border color' }
      ]
    },
    {
      name: 'State Colors',
      colors: [
        { key: 'success', label: 'Success', description: 'Success state' },
        { key: 'warning', label: 'Warning', description: 'Warning state' },
        { key: 'error', label: 'Error', description: 'Error state' },
        { key: 'info', label: 'Info', description: 'Info state' }
      ]
    }
  ];

  private static readonly FONT_OPTIONS: FontOption[] = [
    // Sans-serif fonts
    { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', category: 'sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif', category: 'sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif', category: 'sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif', category: 'sans-serif' },
    
    // Serif fonts
    { name: 'Georgia', value: 'Georgia, serif', category: 'serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'serif' },
    { name: 'Merriweather', value: 'Merriweather, serif', category: 'serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'serif' },
    
    // Monospace fonts
    { name: 'System Mono', value: 'ui-monospace, "SF Mono", Monaco, "Cascadia Mono", "Segoe UI Mono", monospace', category: 'monospace' },
    { name: 'Fira Code', value: '"Fira Code", monospace', category: 'monospace' },
    { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'monospace' },
    { name: 'Source Code Pro', value: '"Source Code Pro", monospace', category: 'monospace' }
  ];

  constructor(options: ThemeBuilderOptions) {
    this.options = options;
    this.container = options.container;
    this.currentTheme = this.cloneTheme(options.initialTheme || defaultTheme);
    
    this.render();
    this.attachEventListeners();
    
    if (options.showPreview !== false) {
      this.updatePreview();
    }
  }

  private cloneTheme(theme: Theme): Theme {
    return JSON.parse(JSON.stringify(theme));
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="mdv-theme-builder">
        <div class="mdv-theme-builder-header">
          <h2>Theme Builder</h2>
          <div class="mdv-theme-builder-actions">
            <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" data-action="reset">
              Reset
            </button>
            <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" data-action="import">
              Import
            </button>
            <button class="mdv-theme-builder-btn mdv-theme-builder-btn-secondary" data-action="export">
              Export
            </button>
            ${this.options.onSave ? `
              <button class="mdv-theme-builder-btn mdv-theme-builder-btn-primary" data-action="save">
                Save Theme
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="mdv-theme-builder-content">
          <div class="mdv-theme-builder-editor">
            <section class="mdv-theme-builder-section">
              <h3>Basic Information</h3>
              ${this.renderBasicInfo()}
            </section>
            
            <section class="mdv-theme-builder-section">
              <h3>Colors</h3>
              ${this.renderColorGroups()}
            </section>
            
            <section class="mdv-theme-builder-section">
              <h3>Typography</h3>
              ${this.renderTypography()}
            </section>
            
            <section class="mdv-theme-builder-section">
              <h3>Spacing & Layout</h3>
              ${this.renderSpacing()}
            </section>
            
            <section class="mdv-theme-builder-section">
              <h3>Custom CSS</h3>
              ${this.renderCustomCSS()}
            </section>
          </div>
          
          ${this.options.showPreview !== false ? `
            <div class="mdv-theme-builder-preview">
              <h3>Preview</h3>
              <div class="mdv-theme-builder-preview-container" id="theme-preview"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.previewContainer = this.container.querySelector('#theme-preview') as HTMLElement;
    this.addStyles();
  }

  private renderBasicInfo(): string {
    return `
      <div class="mdv-theme-builder-field">
        <label for="theme-name">Theme Name</label>
        <input 
          type="text" 
          id="theme-name" 
          value="${this.currentTheme.name}" 
          data-property="name"
          placeholder="My Custom Theme"
        />
      </div>
      
      <div class="mdv-theme-builder-field">
        <label for="theme-description">Description</label>
        <textarea 
          id="theme-description" 
          data-property="description"
          placeholder="A brief description of your theme"
          rows="3"
        >${this.currentTheme.description || ''}</textarea>
      </div>
    `;
  }

  private renderColorGroups(): string {
    return ThemeBuilder.COLOR_GROUPS.map(group => `
      <div class="mdv-theme-builder-color-group">
        <h4>${group.name}</h4>
        <div class="mdv-theme-builder-color-grid">
          ${group.colors.map(({ key, label, description }) => `
            <div class="mdv-theme-builder-color-field">
              <label>
                ${label}
                ${description ? `<span class="mdv-theme-builder-hint">${description}</span>` : ''}
              </label>
              <div class="mdv-theme-builder-color-input-wrapper">
                <input 
                  type="color" 
                  value="${this.currentTheme.colors[key]}" 
                  data-color="${key}"
                  class="mdv-theme-builder-color-picker"
                />
                <input 
                  type="text" 
                  value="${this.currentTheme.colors[key]}" 
                  data-color-text="${key}"
                  class="mdv-theme-builder-color-text"
                  placeholder="#000000"
                />
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  private renderTypography(): string {
    return `
      <div class="mdv-theme-builder-typography">
        <div class="mdv-theme-builder-field">
          <label for="font-heading">Heading Font</label>
          <select id="font-heading" data-font="heading">
            ${this.renderFontOptions(this.currentTheme.fonts.heading)}
          </select>
        </div>
        
        <div class="mdv-theme-builder-field">
          <label for="font-body">Body Font</label>
          <select id="font-body" data-font="body">
            ${this.renderFontOptions(this.currentTheme.fonts.body)}
          </select>
        </div>
        
        <div class="mdv-theme-builder-field">
          <label for="font-code">Code Font</label>
          <select id="font-code" data-font="code">
            ${this.renderFontOptions(this.currentTheme.fonts.code, 'monospace')}
          </select>
        </div>
      </div>
    `;
  }

  private renderFontOptions(currentValue: string, filterCategory?: string): string {
    const options = filterCategory 
      ? ThemeBuilder.FONT_OPTIONS.filter(f => f.category === filterCategory)
      : ThemeBuilder.FONT_OPTIONS;

    return options.map(font => `
      <option value="${font.value}" ${font.value === currentValue ? 'selected' : ''}>
        ${font.name}
      </option>
    `).join('');
  }

  private renderSpacing(): string {
    return `
      <div class="mdv-theme-builder-spacing">
        <div class="mdv-theme-builder-field">
          <label for="spacing-unit">
            Base Spacing Unit
            <span class="mdv-theme-builder-hint">Used for consistent spacing throughout</span>
          </label>
          <input 
            type="range" 
            id="spacing-unit" 
            min="4" 
            max="16" 
            value="${this.currentTheme.spacing.unit}"
            data-spacing="unit"
          />
          <span class="mdv-theme-builder-value">${this.currentTheme.spacing.unit}px</span>
        </div>
        
        <div class="mdv-theme-builder-field">
          <label for="border-radius">
            Border Radius
            <span class="mdv-theme-builder-hint">Corner roundness</span>
          </label>
          <input 
            type="text" 
            id="border-radius" 
            value="${this.currentTheme.borderRadius}"
            data-property="borderRadius"
            placeholder="4px"
          />
        </div>
        
        <div class="mdv-theme-builder-field">
          <label for="sidebar-width">
            Sidebar Width
            <span class="mdv-theme-builder-hint">Navigation panel width</span>
          </label>
          <input 
            type="text" 
            id="sidebar-width" 
            value="${this.currentTheme.spacing.sidebarWidth}"
            data-spacing="sidebarWidth"
            placeholder="300px"
          />
        </div>
        
        <div class="mdv-theme-builder-field">
          <label for="container-max-width">
            Container Max Width
            <span class="mdv-theme-builder-hint">Maximum content width</span>
          </label>
          <input 
            type="text" 
            id="container-max-width" 
            value="${this.currentTheme.spacing.containerMaxWidth}"
            data-spacing="containerMaxWidth"
            placeholder="900px"
          />
        </div>
      </div>
    `;
  }

  private renderCustomCSS(): string {
    return `
      <div class="mdv-theme-builder-field">
        <label for="custom-css">
          Custom CSS
          <span class="mdv-theme-builder-hint">Additional styles to apply</span>
        </label>
        <textarea 
          id="custom-css" 
          data-property="customCSS"
          placeholder="/* Add your custom CSS here */\n.mdv-app {\n  /* Custom styles */\n}"
          rows="10"
        >${this.currentTheme.customCSS || ''}</textarea>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Color pickers
    this.container.querySelectorAll('[data-color]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const colorKey = target.dataset.color as keyof ThemeColors;
        this.updateColor(colorKey, target.value);
      });
    });

    // Color text inputs
    this.container.querySelectorAll('[data-color-text]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const colorKey = target.dataset.colorText as keyof ThemeColors;
        if (this.isValidColor(target.value)) {
          this.updateColor(colorKey, target.value);
        }
      });
    });

    // Font selects
    this.container.querySelectorAll('[data-font]').forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const fontKey = target.dataset.font as keyof ThemeFonts;
        this.updateFont(fontKey, target.value);
      });
    });

    // Spacing inputs
    this.container.querySelectorAll('[data-spacing]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const spacingKey = target.dataset.spacing as keyof ThemeSpacing;
        this.updateSpacing(spacingKey, target.value);
      });
    });

    // Property inputs
    this.container.querySelectorAll('[data-property]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const property = target.dataset.property as keyof Theme;
        this.updateProperty(property, target.value);
      });
    });

    // Action buttons
    this.container.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        this.handleAction(action!);
      });
    });

    // Range input value display
    this.container.querySelectorAll('input[type="range"]').forEach(range => {
      range.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const valueSpan = target.nextElementSibling as HTMLElement;
        if (valueSpan && valueSpan.classList.contains('mdv-theme-builder-value')) {
          valueSpan.textContent = `${target.value}px`;
        }
      });
    });
  }

  private updateColor(key: keyof ThemeColors, value: string): void {
    this.currentTheme.colors[key] = value;
    
    // Update both color picker and text input
    const colorPicker = this.container.querySelector(`[data-color="${key}"]`) as HTMLInputElement;
    const colorText = this.container.querySelector(`[data-color-text="${key}"]`) as HTMLInputElement;
    
    if (colorPicker && colorPicker.value !== value) {
      colorPicker.value = value;
    }
    if (colorText && colorText.value !== value) {
      colorText.value = value;
    }
    
    this.onThemeUpdate();
  }

  private updateFont(key: keyof ThemeFonts, value: string): void {
    this.currentTheme.fonts[key] = value;
    this.onThemeUpdate();
  }

  private updateSpacing(key: keyof ThemeSpacing, value: string): void {
    if (key === 'unit') {
      this.currentTheme.spacing[key] = parseInt(value, 10);
    } else {
      this.currentTheme.spacing[key] = value;
    }
    this.onThemeUpdate();
  }

  private updateProperty(key: keyof Theme, value: string): void {
    (this.currentTheme as any)[key] = value;
    this.onThemeUpdate();
  }

  private onThemeUpdate(): void {
    this.isDirty = true;
    
    if (this.options.onThemeChange) {
      this.options.onThemeChange(this.currentTheme);
    }
    
    if (this.options.showPreview !== false) {
      this.updatePreview();
    }
  }

  private updatePreview(): void {
    if (!this.previewContainer) return;

    const previewContent = this.options.previewContent || this.getDefaultPreviewContent();
    
    this.previewContainer.innerHTML = `
      <div class="mdv-app" style="height: 100%; overflow: auto;">
        <style>${this.generatePreviewStyles()}</style>
        ${previewContent}
      </div>
    `;
  }

  private generatePreviewStyles(): string {
    const { colors, fonts, spacing, borderRadius } = this.currentTheme;
    const unit = spacing.unit;

    return `
      .mdv-app {
        font-family: ${fonts.body};
        color: ${colors.textPrimary};
        background-color: ${colors.background};
        padding: ${unit * 2}px;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: ${fonts.heading};
        color: ${colors.textPrimary};
        margin-top: ${unit * 2}px;
        margin-bottom: ${unit}px;
      }
      
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; }
      h3 { font-size: 1.25rem; }
      
      p {
        color: ${colors.textSecondary};
        line-height: 1.6;
        margin-bottom: ${unit}px;
      }
      
      a {
        color: ${colors.link};
        text-decoration: none;
      }
      
      a:hover {
        color: ${colors.linkHover};
        text-decoration: underline;
      }
      
      code {
        font-family: ${fonts.code};
        background-color: ${colors.codeBackground};
        padding: 2px 4px;
        border-radius: ${borderRadius};
        font-size: 0.9em;
      }
      
      pre {
        background-color: ${colors.codeBackground};
        padding: ${unit * 2}px;
        border-radius: ${borderRadius};
        overflow-x: auto;
      }
      
      pre code {
        background: none;
        padding: 0;
      }
      
      blockquote {
        border-left: 4px solid ${colors.primary};
        padding-left: ${unit * 2}px;
        margin: ${unit * 2}px 0;
        color: ${colors.textSecondary};
      }
      
      .surface {
        background-color: ${colors.surface};
        padding: ${unit * 2}px;
        border-radius: ${borderRadius};
        border: 1px solid ${colors.border};
        margin-bottom: ${unit * 2}px;
      }
      
      .button {
        background-color: ${colors.primary};
        color: white;
        padding: ${unit}px ${unit * 2}px;
        border-radius: ${borderRadius};
        border: none;
        cursor: pointer;
        font-family: ${fonts.body};
        display: inline-block;
      }
      
      .button:hover {
        background-color: ${colors.secondary};
      }
      
      ${this.currentTheme.customCSS || ''}
    `;
  }

  private getDefaultPreviewContent(): string {
    return `
      <div style="max-width: 600px; margin: 0 auto;">
        <h1>Preview: ${this.currentTheme.name}</h1>
        <p>This is a preview of your custom theme. You can see how different elements will look with your color choices.</p>
        
        <div class="surface">
          <h2>Surface Element</h2>
          <p>This is how content looks on a surface background with a border.</p>
          <p>Here's a <a href="#">link example</a> and some <code>inline code</code>.</p>
        </div>
        
        <h3>Code Block Example</h3>
        <pre><code>function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');</code></pre>
        
        <blockquote>
          <p>This is a blockquote. It's styled with your primary color as an accent.</p>
        </blockquote>
        
        <p>
          <span class="button">Primary Button</span>
        </p>
      </div>
    `;
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'reset':
        this.resetTheme();
        break;
      case 'import':
        this.importTheme();
        break;
      case 'export':
        this.exportTheme();
        break;
      case 'save':
        this.saveTheme();
        break;
    }
  }

  private resetTheme(): void {
    if (this.isDirty && !confirm('Are you sure you want to reset? All unsaved changes will be lost.')) {
      return;
    }
    
    this.currentTheme = this.cloneTheme(this.options.initialTheme || defaultTheme);
    this.isDirty = false;
    this.render();
    this.attachEventListeners();
    
    if (this.options.showPreview !== false) {
      this.updatePreview();
    }
  }

  private importTheme(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const theme = JSON.parse(text) as Theme;
        
        // Validate theme structure
        if (!theme.name || !theme.colors || !theme.fonts || !theme.spacing) {
          throw new Error('Invalid theme file');
        }
        
        this.currentTheme = theme;
        this.isDirty = true;
        this.render();
        this.attachEventListeners();
        
        if (this.options.showPreview !== false) {
          this.updatePreview();
        }
      } catch (error) {
        alert('Failed to import theme. Please ensure the file is a valid theme JSON.');
      }
    });
    
    input.click();
  }

  private exportTheme(): void {
    const themeJson = JSON.stringify(this.currentTheme, null, 2);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  private saveTheme(): void {
    if (this.options.onSave) {
      this.options.onSave(this.currentTheme);
      this.isDirty = false;
    }
  }

  private isValidColor(color: string): boolean {
    // Check hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) return true;
    if (/^#[0-9A-F]{3}$/i.test(color)) return true;
    
    // Check rgb/rgba
    if (/^rgba?\(/.test(color)) return true;
    
    // Check named colors
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  private addStyles(): void {
    const styleId = 'mdv-theme-builder-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .mdv-theme-builder {
        font-family: system-ui, -apple-system, sans-serif;
        color: #333;
        background: #fff;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .mdv-theme-builder * {
        box-sizing: border-box;
      }
      
      .mdv-theme-builder-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mdv-theme-builder-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      .mdv-theme-builder-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .mdv-theme-builder-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .mdv-theme-builder-btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .mdv-theme-builder-btn-primary:hover {
        background: #2563eb;
      }
      
      .mdv-theme-builder-btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }
      
      .mdv-theme-builder-btn-secondary:hover {
        background: #e5e7eb;
      }
      
      .mdv-theme-builder-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .mdv-theme-builder-editor {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }
      
      .mdv-theme-builder-preview {
        width: 50%;
        border-left: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
      }
      
      .mdv-theme-builder-preview h3 {
        margin: 0;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      .mdv-theme-builder-preview-container {
        flex: 1;
        overflow: auto;
      }
      
      .mdv-theme-builder-section {
        margin-bottom: 2rem;
      }
      
      .mdv-theme-builder-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      .mdv-theme-builder-section h4 {
        margin: 1rem 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .mdv-theme-builder-field {
        margin-bottom: 1rem;
      }
      
      .mdv-theme-builder-field label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .mdv-theme-builder-hint {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 400;
        margin-top: 0.125rem;
      }
      
      .mdv-theme-builder-field input[type="text"],
      .mdv-theme-builder-field input[type="number"],
      .mdv-theme-builder-field textarea,
      .mdv-theme-builder-field select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
      }
      
      .mdv-theme-builder-field input[type="range"] {
        width: calc(100% - 60px);
        margin-right: 0.5rem;
      }
      
      .mdv-theme-builder-value {
        display: inline-block;
        width: 50px;
        text-align: right;
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .mdv-theme-builder-color-group {
        margin-bottom: 1.5rem;
      }
      
      .mdv-theme-builder-color-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
      
      .mdv-theme-builder-color-field label {
        margin-bottom: 0.5rem;
      }
      
      .mdv-theme-builder-color-input-wrapper {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      
      .mdv-theme-builder-color-picker {
        width: 40px;
        height: 40px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .mdv-theme-builder-color-text {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: monospace;
      }
      
      .mdv-theme-builder-typography {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      
      .mdv-theme-builder-spacing {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .mdv-theme-builder-content {
          flex-direction: column;
        }
        
        .mdv-theme-builder-preview {
          width: 100%;
          border-left: none;
          border-top: 1px solid #e5e7eb;
          height: 50%;
        }
        
        .mdv-theme-builder-actions {
          flex-wrap: wrap;
        }
        
        .mdv-theme-builder-color-grid,
        .mdv-theme-builder-typography,
        .mdv-theme-builder-spacing {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  public getTheme(): Theme {
    return this.cloneTheme(this.currentTheme);
  }

  public setTheme(theme: Theme): void {
    this.currentTheme = this.cloneTheme(theme);
    this.render();
    this.attachEventListeners();
    
    if (this.options.showPreview !== false) {
      this.updatePreview();
    }
  }

  public isDirtyState(): boolean {
    return this.isDirty;
  }

  public destroy(): void {
    this.container.innerHTML = '';
    const style = document.getElementById('mdv-theme-builder-styles');
    if (style) {
      style.remove();
    }
  }
}

// Helper function to create a theme builder
export function createThemeBuilder(options: ThemeBuilderOptions): ThemeBuilder {
  return new ThemeBuilder(options);
}