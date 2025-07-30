/**
 * HTML escaping utilities for preventing XSS vulnerabilities
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
export function escapeHtml(text: string | number | undefined | null): string {
  if (text == null) return '';

  const str = String(text);
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return str.replace(/[&<>"']/g, (m: string) => map[m]);
}

/**
 * Escapes HTML attributes specifically for use in attribute values
 * @param text - The text to escape for attribute use
 * @returns The escaped text safe for HTML attribute insertion
 */
export function escapeHtmlAttribute(text: string | number | undefined | null): string {
  if (text == null) return '';

  const str = String(text);
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '\n': '&#10;',
    '\r': '&#13;',
    '\t': '&#9;',
  };

  return str.replace(/[&<>"'\n\r\t]/g, (m: string) => map[m]);
}

/**
 * Validates and sanitizes CSS color values
 * @param color - The color value to validate
 * @returns The sanitized color value or empty string if invalid
 */
export function sanitizeCssColor(color: string | undefined | null): string {
  if (!color) return '';

  const colorStr = String(color).trim();

  // Allow hex colors, rgb/rgba, hsl/hsla, and named colors
  const colorPattern =
    /^(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)|hsla\([^)]*\)|[a-zA-Z]+)$/;

  if (colorPattern.test(colorStr)) {
    return colorStr;
  }

  return '';
}

/**
 * Validates and sanitizes CSS font family values
 * @param fontFamily - The font family value to validate
 * @returns The sanitized font family value or empty string if invalid
 */
export function sanitizeFontFamily(fontFamily: string | undefined | null): string {
  if (!fontFamily) return '';

  const fontStr = String(fontFamily).trim();

  // Basic validation for font families - allow alphanumeric, spaces, hyphens, commas, and quotes
  const fontPattern = /^[\w\s\-,'"]+$/;

  if (fontPattern.test(fontStr) && fontStr.length < 200) {
    return fontStr;
  }

  return '';
}

/**
 * Validates and sanitizes CSS size/spacing values
 * @param value - The size/spacing value to validate
 * @returns The sanitized value or empty string if invalid
 */
export function sanitizeCssValue(value: string | number | undefined | null): string {
  if (value == null) return '';

  const valueStr = String(value).trim();

  // Allow numbers, percentages, and common CSS units
  const sizePattern = /^-?(?:\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|ex|ch|vmin|vmax|cm|mm|in|pt|pc)?$/;

  if (sizePattern.test(valueStr) && valueStr.length < 20) {
    return valueStr;
  }

  return '';
}

/**
 * Creates a safe HTML template string by escaping all interpolated values
 * Use this for HTML templates that include user data or dynamic content
 * @param strings - Template string parts
 * @param values - Values to be escaped and interpolated
 * @returns Safe HTML string with escaped values
 * @example
 * const safeHtml = html`<div class="error">${userInput}</div>`;
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    result += escapeHtml(values[i]) + strings[i + 1];
  }

  return result;
}

/**
 * Creates a safe HTML template string with attribute-safe escaping for interpolated values
 * Use this for HTML templates where values will be inserted into attributes
 * @param strings - Template string parts
 * @param values - Values to be escaped for attribute use and interpolated
 * @returns Safe HTML string with attribute-escaped values
 * @example
 * const safeHtml = htmlAttr`<div title="${userTitle}" class="${userClass}">Content</div>`;
 */
export function htmlAttr(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    result += escapeHtmlAttribute(values[i]) + strings[i + 1];
  }

  return result;
}

/**
 * Announces a message to screen readers using an ARIA live region
 * @param message - The message to announce
 * @param regionId - Unique ID for the live region (defaults to 'mdv-live-announcements')
 * @param level - The politeness level for announcements ('polite' or 'assertive', defaults to 'polite')
 */
export function announceToScreenReader(
  message: string,
  regionId: string = 'mdv-live-announcements',
  level: 'polite' | 'assertive' = 'polite'
): void {
  // Create or update live region
  let liveRegion = document.getElementById(regionId);
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = regionId;
    liveRegion.setAttribute('aria-live', level);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'mdv-sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  }

  // Clear previous announcement and set new one
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}
