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
