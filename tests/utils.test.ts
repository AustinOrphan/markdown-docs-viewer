import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  escapeHtmlAttribute,
  sanitizeCssColor,
  sanitizeFontFamily,
  sanitizeCssValue,
} from '../src/utils';

describe('HTML Security Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "Hello" & \'Goodbye\'')).toBe(
        'He said &quot;Hello&quot; &amp; &#039;Goodbye&#039;'
      );
    });

    it('should handle null and undefined values', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeHtml(42)).toBe('42');
      expect(escapeHtml(0)).toBe('0');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should not modify safe text', () => {
      expect(escapeHtml('Hello World!')).toBe('Hello World!');
    });
  });

  describe('escapeHtmlAttribute', () => {
    it('should escape HTML attribute special characters', () => {
      expect(escapeHtmlAttribute('" onmouseover="alert(\'XSS\')"')).toBe(
        '&quot; onmouseover=&quot;alert(&#039;XSS&#039;)&quot;'
      );
    });

    it('should escape newlines and tabs', () => {
      expect(escapeHtmlAttribute('Line 1\nLine 2\rLine 3\tTab')).toBe(
        'Line 1&#10;Line 2&#13;Line 3&#9;Tab'
      );
    });

    it('should handle null and undefined values', () => {
      expect(escapeHtmlAttribute(null)).toBe('');
      expect(escapeHtmlAttribute(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeHtmlAttribute(123)).toBe('123');
    });
  });

  describe('sanitizeCssColor', () => {
    it('should allow valid hex colors', () => {
      expect(sanitizeCssColor('#ff0000')).toBe('#ff0000');
      expect(sanitizeCssColor('#FFF')).toBe('#FFF');
      expect(sanitizeCssColor('#12345678')).toBe('#12345678');
    });

    it('should allow valid rgb/rgba colors', () => {
      expect(sanitizeCssColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      expect(sanitizeCssColor('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should allow valid hsl/hsla colors', () => {
      expect(sanitizeCssColor('hsl(0, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
      expect(sanitizeCssColor('hsla(0, 100%, 50%, 0.5)')).toBe('hsla(0, 100%, 50%, 0.5)');
    });

    it('should allow named colors', () => {
      expect(sanitizeCssColor('red')).toBe('red');
      expect(sanitizeCssColor('transparent')).toBe('transparent');
    });

    it('should reject invalid colors', () => {
      expect(sanitizeCssColor('javascript:alert(1)')).toBe('');
      expect(sanitizeCssColor('expression(alert(1))')).toBe('');
      expect(sanitizeCssColor('" onmouseover="alert(1)"')).toBe('');
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeCssColor(null)).toBe('');
      expect(sanitizeCssColor(undefined)).toBe('');
      expect(sanitizeCssColor('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeCssColor('  #ff0000  ')).toBe('#ff0000');
    });
  });

  describe('sanitizeFontFamily', () => {
    it('should allow valid font families', () => {
      expect(sanitizeFontFamily('Arial, sans-serif')).toBe('Arial, sans-serif');
      expect(sanitizeFontFamily('"Times New Roman", serif')).toBe('"Times New Roman", serif');
      expect(sanitizeFontFamily("'Courier New', monospace")).toBe("'Courier New', monospace");
    });

    it('should allow font names with hyphens', () => {
      expect(sanitizeFontFamily('Source-Sans-Pro')).toBe('Source-Sans-Pro');
    });

    it('should reject fonts with suspicious content', () => {
      expect(sanitizeFontFamily('Arial; background: url(javascript:alert(1))')).toBe('');
      expect(sanitizeFontFamily('Arial</style><script>alert(1)</script>')).toBe('');
    });

    it('should reject overly long font names', () => {
      const longFont = 'A'.repeat(201);
      expect(sanitizeFontFamily(longFont)).toBe('');
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeFontFamily(null)).toBe('');
      expect(sanitizeFontFamily(undefined)).toBe('');
      expect(sanitizeFontFamily('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFontFamily('  Arial  ')).toBe('Arial');
    });
  });

  describe('sanitizeCssValue', () => {
    it('should allow valid pixel values', () => {
      expect(sanitizeCssValue('10px')).toBe('10px');
      expect(sanitizeCssValue('0px')).toBe('0px');
      expect(sanitizeCssValue('-5px')).toBe('-5px');
    });

    it('should allow valid rem/em values', () => {
      expect(sanitizeCssValue('1.5rem')).toBe('1.5rem');
      expect(sanitizeCssValue('2em')).toBe('2em');
    });

    it('should allow percentages', () => {
      expect(sanitizeCssValue('100%')).toBe('100%');
      expect(sanitizeCssValue('50.5%')).toBe('50.5%');
    });

    it('should allow viewport units', () => {
      expect(sanitizeCssValue('100vh')).toBe('100vh');
      expect(sanitizeCssValue('50vw')).toBe('50vw');
      expect(sanitizeCssValue('10vmin')).toBe('10vmin');
      expect(sanitizeCssValue('20vmax')).toBe('20vmax');
    });

    it('should allow unitless numbers', () => {
      expect(sanitizeCssValue('8')).toBe('8');
      expect(sanitizeCssValue(8)).toBe('8');
      expect(sanitizeCssValue('0')).toBe('0');
    });

    it('should reject invalid values', () => {
      expect(sanitizeCssValue('expression(alert(1))')).toBe('');
      expect(sanitizeCssValue('javascript:alert(1)')).toBe('');
      expect(sanitizeCssValue('10px; background: red')).toBe('');
    });

    it('should reject overly long values', () => {
      const longValue = '1'.repeat(21) + 'px';
      expect(sanitizeCssValue(longValue)).toBe('');
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeCssValue(null)).toBe('');
      expect(sanitizeCssValue(undefined)).toBe('');
      expect(sanitizeCssValue('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeCssValue('  10px  ')).toBe('10px');
    });
  });
});

describe('XSS Prevention Integration', () => {
  it('should prevent theme name XSS injection', () => {
    const maliciousThemeName = '" onmouseover="alert(\'XSS\')"';
    const escaped = escapeHtmlAttribute(maliciousThemeName);
    expect(escaped).toBe('&quot; onmouseover=&quot;alert(&#039;XSS&#039;)&quot;');

    // Verify it would be safe in HTML - no unescaped quotes that could break out
    const html = `<input value="${escaped}">`;
    expect(html).not.toContain('onmouseover="alert('); // The dangerous part is escaped
    expect(html).toContain('&quot;'); // Quotes are properly escaped
    expect(html).toContain('value="&quot; onmouseover=&quot;'); // Full escaped content
  });

  it('should prevent CSS injection in colors', () => {
    const maliciousColor = 'red; background: url(javascript:alert(1))';
    const sanitized = sanitizeCssColor(maliciousColor);
    expect(sanitized).toBe('');
  });

  it('should prevent CSS injection in fonts', () => {
    const maliciousFont = 'Arial; background: url(javascript:alert(1))';
    const sanitized = sanitizeFontFamily(maliciousFont);
    expect(sanitized).toBe('');
  });

  it('should prevent CSS injection in spacing values', () => {
    const maliciousValue = '10px; background: url(javascript:alert(1))';
    const sanitized = sanitizeCssValue(maliciousValue);
    expect(sanitized).toBe('');
  });
});
