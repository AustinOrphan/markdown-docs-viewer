import { DocumentationConfig } from './types';

/**
 * Modern responsive breakpoints based on current device landscape
 * Following mobile-first design principles
 */
export const BREAKPOINTS = {
  // Mobile (portrait phones)
  xs: 0,
  // Mobile (landscape phones)
  sm: 576,
  // Tablet (portrait)
  md: 768,
  // Tablet (landscape) / Desktop
  lg: 992,
  // Desktop
  xl: 1200,
  // Large desktop
  xxl: 1400,
} as const;

/**
 * Container max-widths for each breakpoint
 */
export const CONTAINER_MAX_WIDTHS = {
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
  xxl: 1320,
} as const;

/**
 * Touch target minimum sizes for accessibility
 */
export const TOUCH_TARGETS = {
  minimum: 44, // WCAG AAA guideline
  comfortable: 48, // Recommended comfortable size
  large: 56, // Large touch targets for important actions
} as const;

/**
 * Mobile typography scale
 */
export const MOBILE_TYPOGRAPHY = {
  baseFontSize: {
    xs: 14,
    sm: 15,
    md: 16,
    lg: 16,
    xl: 16,
    xxl: 16,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  headings: {
    h1: { xs: 1.75, sm: 2, md: 2.5, lg: 3, xl: 3.5, xxl: 4 },
    h2: { xs: 1.5, sm: 1.75, md: 2, lg: 2.25, xl: 2.5, xxl: 2.75 },
    h3: { xs: 1.25, sm: 1.5, md: 1.75, lg: 1.875, xl: 2, xxl: 2.125 },
    h4: { xs: 1.125, sm: 1.25, md: 1.375, lg: 1.5, xl: 1.625, xxl: 1.75 },
    h5: { xs: 1, sm: 1.125, md: 1.25, lg: 1.375, xl: 1.5, xxl: 1.625 },
    h6: { xs: 0.875, sm: 1, md: 1.125, lg: 1.25, xl: 1.375, xxl: 1.5 },
  },
} as const;

/**
 * Generates responsive CSS variables for the viewer
 */
export function generateResponsiveCSSVariables(): string {
  return `
    :root {
      /* Breakpoint values */
      --mdv-breakpoint-xs: ${BREAKPOINTS.xs}px;
      --mdv-breakpoint-sm: ${BREAKPOINTS.sm}px;
      --mdv-breakpoint-md: ${BREAKPOINTS.md}px;
      --mdv-breakpoint-lg: ${BREAKPOINTS.lg}px;
      --mdv-breakpoint-xl: ${BREAKPOINTS.xl}px;
      --mdv-breakpoint-xxl: ${BREAKPOINTS.xxl}px;
      
      /* Touch targets */
      --mdv-touch-target-min: ${TOUCH_TARGETS.minimum}px;
      --mdv-touch-target-comfortable: ${TOUCH_TARGETS.comfortable}px;
      --mdv-touch-target-large: ${TOUCH_TARGETS.large}px;
      
      /* Container max-widths */
      --mdv-container-sm: ${CONTAINER_MAX_WIDTHS.sm}px;
      --mdv-container-md: ${CONTAINER_MAX_WIDTHS.md}px;
      --mdv-container-lg: ${CONTAINER_MAX_WIDTHS.lg}px;
      --mdv-container-xl: ${CONTAINER_MAX_WIDTHS.xl}px;
      --mdv-container-xxl: ${CONTAINER_MAX_WIDTHS.xxl}px;
      
      /* Base typography */
      --mdv-font-size-base: ${MOBILE_TYPOGRAPHY.baseFontSize.md}px;
      --mdv-line-height-base: ${MOBILE_TYPOGRAPHY.lineHeight.normal};
      
      /* Spacing scale (mobile-optimized) */
      --mdv-spacing-xs: 0.25rem;
      --mdv-spacing-sm: 0.5rem;
      --mdv-spacing-md: 1rem;
      --mdv-spacing-lg: 1.5rem;
      --mdv-spacing-xl: 2rem;
      --mdv-spacing-xxl: 3rem;
      
      /* Mobile-specific values */
      --mdv-mobile-padding: 1rem;
      --mdv-mobile-margin: 0.75rem;
      --mdv-mobile-border-radius: 8px;
      
      /* Navigation dimensions */
      --mdv-nav-width: 280px;
      --mdv-nav-width-collapsed: 60px;
      --mdv-header-height: 60px;
      --mdv-footer-height: 40px;
      
      /* Z-index scale */
      --mdv-z-dropdown: 1000;
      --mdv-z-sticky: 1020;
      --mdv-z-fixed: 1030;
      --mdv-z-modal-backdrop: 1040;
      --mdv-z-modal: 1050;
      --mdv-z-popover: 1060;
      --mdv-z-tooltip: 1070;
    }
  `;
}

/**
 * Generates responsive media queries with mobile-first approach
 */
export function generateMediaQueries(): string {
  return `
    /* Mobile First - Base styles (xs: 0px and up) */
    .mdv-container {
      width: 100%;
      padding-right: var(--mdv-mobile-padding);
      padding-left: var(--mdv-mobile-padding);
      margin-right: auto;
      margin-left: auto;
    }
    
    /* Small devices (landscape phones, 576px and up) */
    @media (min-width: ${BREAKPOINTS.sm}px) {
      .mdv-container {
        max-width: var(--mdv-container-sm);
      }
      
      :root {
        --mdv-font-size-base: ${MOBILE_TYPOGRAPHY.baseFontSize.sm}px;
      }
      
      .mdv-mobile-toggle {
        display: none;
      }
    }
    
    /* Medium devices (tablets, 768px and up) */
    @media (min-width: ${BREAKPOINTS.md}px) {
      .mdv-container {
        max-width: var(--mdv-container-md);
      }
      
      :root {
        --mdv-font-size-base: ${MOBILE_TYPOGRAPHY.baseFontSize.md}px;
      }
      
      .mdv-sidebar {
        position: relative;
        transform: none;
        box-shadow: none;
        height: auto;
      }
      
      .mdv-sidebar-header {
        display: block; /* Show on desktop */
      }
      
      .mdv-content {
        margin-left: var(--mdv-nav-width);
      }
    }
    
    /* Large devices (desktops, 992px and up) */
    @media (min-width: ${BREAKPOINTS.lg}px) {
      .mdv-container {
        max-width: var(--mdv-container-lg);
      }
    }
    
    /* Extra large devices (large desktops, 1200px and up) */
    @media (min-width: ${BREAKPOINTS.xl}px) {
      .mdv-container {
        max-width: var(--mdv-container-xl);
      }
    }
    
    /* Extra extra large devices (larger desktops, 1400px and up) */
    @media (min-width: ${BREAKPOINTS.xxl}px) {
      .mdv-container {
        max-width: var(--mdv-container-xxl);
      }
    }
  `;
}

/**
 * Generates responsive typography styles
 */
export function generateResponsiveTypography(): string {
  const headingStyles = Object.entries(MOBILE_TYPOGRAPHY.headings)
    .map(([tag, sizes]) => {
      const baseSize = sizes.xs;
      let styles = `
    ${tag} {
      font-size: ${baseSize}rem;
      line-height: ${MOBILE_TYPOGRAPHY.lineHeight.tight};
      margin-bottom: var(--mdv-spacing-md);
    }`;

      // Add responsive sizes
      Object.entries(sizes).forEach(([breakpoint, size]) => {
        if (breakpoint !== 'xs' && BREAKPOINTS[breakpoint as keyof typeof BREAKPOINTS]) {
          styles += `
    @media (min-width: ${BREAKPOINTS[breakpoint as keyof typeof BREAKPOINTS]}px) {
      ${tag} {
        font-size: ${size}rem;
      }
    }`;
        }
      });

      return styles;
    })
    .join('\n');

  return `
    /* Responsive Typography */
    body {
      font-size: var(--mdv-font-size-base);
      line-height: var(--mdv-line-height-base);
    }
    
    /* Responsive font sizes by breakpoint */
    @media (max-width: ${BREAKPOINTS.sm - 1}px) {
      :root {
        --mdv-font-size-base: ${MOBILE_TYPOGRAPHY.baseFontSize.xs}px;
      }
    }
    
    ${headingStyles}
    
    /* Responsive paragraph spacing */
    p {
      margin-bottom: var(--mdv-spacing-md);
      line-height: var(--mdv-line-height-base);
    }
    
    @media (max-width: ${BREAKPOINTS.sm - 1}px) {
      p {
        line-height: ${MOBILE_TYPOGRAPHY.lineHeight.relaxed};
      }
    }
  `;
}

/**
 * Generates touch-friendly styles for mobile devices
 */
export function generateTouchStyles(): string {
  return `
    /* Touch-friendly styles */
    .mdv-button,
    .mdv-nav-item,
    .mdv-mobile-toggle,
    .mdv-search-input,
    .mdv-toc-item {
      min-height: var(--mdv-touch-target-min);
      min-width: var(--mdv-touch-target-min);
      
      /* Prevent 300ms click delay */
      touch-action: manipulation;
      
      /* Smooth touch feedback */
      transition: background-color 0.15s ease-in-out;
    }
    
    /* Larger touch targets for primary actions */
    .mdv-button-primary,
    .mdv-mobile-toggle {
      min-height: var(--mdv-touch-target-comfortable);
      min-width: var(--mdv-touch-target-comfortable);
    }
    
    /* Extra large touch targets for critical actions */
    .mdv-button-large {
      min-height: var(--mdv-touch-target-large);
      min-width: var(--mdv-touch-target-large);
    }
    
    /* Touch feedback states */
    @media (hover: none) and (pointer: coarse) {
      .mdv-button:active,
      .mdv-nav-item:active {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      /* Remove hover states on touch devices */
      .mdv-button:hover,
      .mdv-nav-item:hover {
        background-color: initial;
      }
    }
    
    /* Focus styles for accessibility - WCAG compliant */
    .mdv-button:focus-visible,
    .mdv-nav-item:focus-visible,
    .mdv-search-input:focus-visible,
    .mdv-toc-item:focus-visible,
    .mdv-nav-link:focus-visible,
    .mdv-mobile-toggle:focus-visible {
      /* Two-color focus indicator for better visibility */
      /* Inner indicator */
      outline: 2px solid #F9F9F9;
      outline-offset: 0;
      /* Outer indicator */
      box-shadow: 0 0 0 4px #193146;
      /* Ensure proper z-index */
      position: relative;
      z-index: 1;
    }
    
    /* Alternative focus style for dark themes */
    [data-theme="dark"] .mdv-button:focus-visible,
    [data-theme="dark"] .mdv-nav-item:focus-visible,
    [data-theme="dark"] .mdv-search-input:focus-visible,
    [data-theme="dark"] .mdv-toc-item:focus-visible,
    [data-theme="dark"] .mdv-nav-link:focus-visible,
    [data-theme="dark"] .mdv-mobile-toggle:focus-visible {
      /* Inner indicator */
      outline: 2px solid #193146;
      /* Outer indicator */
      box-shadow: 0 0 0 4px #F9F9F9;
    }
    
    /* Remove default focus outline */
    .mdv-button:focus:not(:focus-visible),
    .mdv-nav-item:focus:not(:focus-visible),
    .mdv-search-input:focus:not(:focus-visible),
    .mdv-toc-item:focus:not(:focus-visible),
    .mdv-nav-link:focus:not(:focus-visible),
    .mdv-mobile-toggle:focus:not(:focus-visible) {
      outline: none;
    }
    
    /* Enhanced focus for form controls */
    .mdv-search-input:focus-visible {
      outline: 3px solid var(--mdv-primary-color);
      outline-offset: 2px;
      box-shadow: 0 0 0 5px rgba(var(--mdv-primary-rgb), 0.2);
    }
    
    /* Focus styles for links in content */
    .mdv-content a:focus-visible {
      outline: 2px solid var(--mdv-primary-color);
      outline-offset: 3px;
      background-color: rgba(var(--mdv-primary-rgb), 0.1);
      border-radius: 2px;
    }
    
    /* Prevent text selection on buttons */
    .mdv-button,
    .mdv-mobile-toggle {
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
  `;
}

/**
 * Generates mobile-specific layout styles
 */
export function generateMobileLayout(): string {
  return `
    /* Mobile Layout Optimizations */
    
    /* Mobile navigation */
    @media (max-width: ${BREAKPOINTS.md - 1}px) {
      /* Adjust header layout on mobile */
      .mdv-header {
        padding-left: calc(var(--mdv-touch-target-comfortable) + var(--mdv-spacing-lg) + var(--mdv-spacing-md));
        position: relative;
        min-height: 60px;
      }
      
      /* Mobile header actions */
      .mdv-header-actions {
        gap: var(--mdv-spacing-sm);
        padding-right: var(--mdv-spacing-sm);
      }
      
      .mdv-header-actions .mdv-dark-mode-toggle {
        gap: var(--mdv-spacing-xs);
      }
      
      /* Make dark mode toggle smaller on mobile */
      .mdv-header-actions .mdv-dark-toggle-btn {
        width: 40px;
        height: 22px;
        border-radius: 11px;
      }
      
      .mdv-header-actions .mdv-dark-toggle-track {
        border-radius: 11px;
      }
      
      .mdv-header-actions .mdv-dark-toggle-thumb {
        width: 18px;
        height: 18px;
        top: 2px;
        left: 2px;
      }
      
      .mdv-header-actions .mdv-dark-toggle-btn.dark .mdv-dark-toggle-thumb {
        transform: translateX(18px);
      }
      
      .mdv-header-actions .mdv-dark-toggle-icon svg {
        width: 10px;
        height: 10px;
      }
      
      .mdv-header-actions .mdv-dark-toggle-label {
        font-size: 0.75rem;
        display: none; /* Hide labels on small mobile screens */
      }
      
      .mdv-header-actions .mdv-theme-switcher .mdv-theme-trigger {
        padding: 6px 8px;
        font-size: 0.75rem;
        min-width: auto;
      }
      
      .mdv-header-actions .mdv-theme-switcher .mdv-theme-name {
        display: none; /* Hide theme name on mobile */
      }
      
      .mdv-mobile-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 50%;
        left: var(--mdv-spacing-md);
        transform: translateY(-50%);
        z-index: var(--mdv-z-fixed);
        background: var(--mdv-primary-color, #0969da);
        color: white;
        border: none;
        border-radius: var(--mdv-mobile-border-radius);
        cursor: pointer;
        width: var(--mdv-touch-target-comfortable);
        height: var(--mdv-touch-target-comfortable);
        font-size: 1.25rem;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .mdv-mobile-toggle:hover {
        transform: translateY(-50%) scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .mdv-mobile-toggle:active {
        transform: translateY(-50%) scale(0.95);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .mdv-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: var(--mdv-nav-width);
        z-index: var(--mdv-z-modal);
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.15);
        /* Slightly transparent background with blur for readability */
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow-y: auto;
      }
      
      /* Dark theme support for sidebar */
      [data-theme="dark"] .mdv-sidebar {
        background: rgba(24, 24, 27, 0.95);
      }
      
      .mdv-sidebar.open {
        transform: translateX(0);
      }
      
      .mdv-sidebar-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: var(--mdv-z-modal-backdrop);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
      }
      
      .mdv-sidebar-backdrop.show {
        opacity: 1;
        visibility: visible;
      }
      
      .mdv-content {
        margin-left: 0;
        padding: var(--mdv-spacing-lg) var(--mdv-mobile-padding);
        padding-top: calc(var(--mdv-touch-target-comfortable) + var(--mdv-spacing-lg) * 2);
      }
      
      .mdv-document {
        padding: 0;
      }
    }
    
    /* Tablet layout adjustments */
    @media (min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px) {
      .mdv-sidebar {
        width: 240px;
      }
      
      .mdv-content {
        margin-left: 240px;
      }
    }
    
    /* Mobile content optimizations */
    @media (max-width: ${BREAKPOINTS.sm - 1}px) {
      .mdv-document-title {
        font-size: 1.75rem;
        line-height: 1.2;
        margin-bottom: var(--mdv-spacing-lg);
      }
      
      .mdv-code-block {
        font-size: 0.875rem;
        padding: var(--mdv-spacing-md);
        border-radius: var(--mdv-mobile-border-radius);
        overflow-x: auto;
      }
      
      .mdv-table-wrapper {
        overflow-x: auto;
        margin: var(--mdv-spacing-md) 0;
      }
      
      .mdv-table {
        min-width: 600px;
      }
      
      /* Improve readability on small screens */
      .mdv-content img {
        max-width: 100%;
        height: auto;
        border-radius: var(--mdv-mobile-border-radius);
      }
      
      .mdv-content blockquote {
        margin: var(--mdv-spacing-lg) 0;
        padding: var(--mdv-spacing-md);
        border-left: 4px solid var(--mdv-primary-color);
        border-radius: 0 var(--mdv-mobile-border-radius) var(--mdv-mobile-border-radius) 0;
      }
    }
  `;
}

/**
 * Main function to generate complete mobile-responsive CSS
 */
export function generateMobileCSS(_config?: DocumentationConfig): string {
  const cssVariables = generateResponsiveCSSVariables();
  const mediaQueries = generateMediaQueries();
  const typography = generateResponsiveTypography();
  const touchStyles = generateTouchStyles();
  const mobileLayout = generateMobileLayout();

  return `
    ${cssVariables}
    ${mediaQueries}
    ${typography}
    ${touchStyles}
    ${mobileLayout}
  `;
}

/**
 * Utility function to check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Utility function to get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === 'undefined') return 'md';

  const width = window.innerWidth;

  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Utility function to add viewport meta tag for mobile optimization
 */
export function addViewportMeta(): void {
  if (typeof document === 'undefined') return;

  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;

  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }

  // Optimal viewport configuration for responsive design
  viewport.content =
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=yes, maximum-scale=5';
}
