// Script to check contrast ratios for all themes
const themes = {
  default: {
    light: {
      text: '#111827',
      textPrimary: '#111827',
      textLight: '#6b7280',
      textSecondary: '#6b7280',
      background: '#ffffff',
      surface: '#f3f4f6',
      codeBackground: '#f3f4f6',
    },
    dark: {
      text: '#f1f5f9',
      textPrimary: '#f1f5f9',
      textLight: '#94a3b8',
      textSecondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      codeBackground: '#1a202c',
    },
  },
  solarized: {
    light: {
      text: '#657b83',
      textPrimary: '#073642',
      textLight: '#93a1a1',
      textSecondary: '#839496',
      background: '#fdf6e3',
      surface: '#eee8d5',
      codeBackground: '#eee8d5',
    },
    dark: {
      text: '#839496',
      textPrimary: '#93a1a1',
      textLight: '#657b83',
      textSecondary: '#586e75',
      background: '#002b36',
      surface: '#073642',
      codeBackground: '#073642',
    },
  },
  ayu: {
    light: {
      text: '#5c6166',
      textPrimary: '#5c6166',
      textLight: '#828c99',
      textSecondary: '#828c99',
      background: '#fafafa',
      surface: '#f3f4f5',
      codeBackground: '#f3f4f5',
    },
    dark: {
      text: '#b3b1ad',
      textPrimary: '#e6e1cf',
      textLight: '#4d5566',
      textSecondary: '#626a73',
      background: '#0b0e14',
      surface: '#11151c',
      codeBackground: '#11151c',
    },
  },
  tokyo: {
    light: {
      text: '#0d2258',
      textPrimary: '#0d2258',
      textLight: '#9699a3',
      textSecondary: '#9699a3',
      background: '#d5d6db',
      surface: '#e1e2e7',
      codeBackground: '#e1e2e7',
    },
    dark: {
      text: '#c0caf5',
      textPrimary: '#c0caf5',
      textLight: '#565f89',
      textSecondary: '#565f89',
      background: '#1a1b26',
      surface: '#24283b',
      codeBackground: '#24283b',
    },
  },
};

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance
function getLuminance(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check WCAG compliance
function checkWCAG(ratio) {
  return {
    ratio: ratio.toFixed(2),
    AA: ratio >= 4.5,
    AAA: ratio >= 7.0,
    AALarge: ratio >= 3.0, // For large text
    issue: ratio < 4.5,
  };
}

// Analyze all themes
console.log('Theme Contrast Analysis Report');
console.log('==============================\n');

const issues = [];

Object.entries(themes).forEach(([themeName, modes]) => {
  console.log(`\n${themeName.toUpperCase()} Theme:`);
  console.log('-'.repeat(40));

  Object.entries(modes).forEach(([mode, colors]) => {
    console.log(`\n  ${mode} mode:`);

    // Check main text contrasts
    const checks = [
      { text: 'text', bg: 'background', label: 'Text on Background' },
      { text: 'textPrimary', bg: 'background', label: 'Primary Text on Background' },
      { text: 'textLight', bg: 'background', label: 'Light Text on Background' },
      { text: 'textSecondary', bg: 'background', label: 'Secondary Text on Background' },
      { text: 'text', bg: 'surface', label: 'Text on Surface' },
      { text: 'textLight', bg: 'surface', label: 'Light Text on Surface' },
      { text: 'text', bg: 'codeBackground', label: 'Text on Code Background' },
    ];

    checks.forEach(({ text, bg, label }) => {
      const result = checkWCAG(getContrastRatio(colors[text], colors[bg]));
      const status = result.AA ? '✓' : '✗';
      const warning = result.issue ? ' ⚠️  FAILS WCAG AA' : '';

      console.log(`    ${status} ${label}: ${result.ratio}:1${warning}`);

      if (result.issue) {
        issues.push({
          theme: `${themeName}-${mode}`,
          test: label,
          ratio: result.ratio,
          foreground: colors[text],
          background: colors[bg],
        });
      }
    });
  });
});

if (issues.length > 0) {
  console.log('\n\nCONTRAST ISSUES FOUND:');
  console.log('=====================\n');
  issues.forEach(issue => {
    console.log(`${issue.theme}: ${issue.test}`);
    console.log(`  Ratio: ${issue.ratio}:1 (needs 4.5:1)`);
    console.log(`  Foreground: ${issue.foreground}`);
    console.log(`  Background: ${issue.background}\n`);
  });
} else {
  console.log('\n\nAll themes pass WCAG AA contrast requirements! ✓');
}
