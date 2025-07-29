# UI Improvements Needed

## 1. Navigation Categories Arrow Direction Fixed ✅

**Status**: COMPLETED
**Issue**: Arrow pointed wrong direction when collapsed
**Fix**: Changed from ▼ to ▶ and adjusted rotation logic

## 2. Navigation State Persistence ✅

**Status**: COMPLETED  
**Issue**: Navigation categories don't remember their collapsed/expanded state when switching documents
**Fix**: Added localStorage persistence for category states

## 3. Search Input Theme Transition ✅

**Status**: COMPLETED
**Issue**: Search input color changes are delayed when theme changes
**Fix**: Added transitions for background-color and color properties

## 4. Excessive Space Between Navigation and Content

**Status**: NEEDS FIX
**Issue**: Too much space between navigation pane and main content area
**Location**: Likely in sidebar/content layout styles
**Priority**: High - affects user experience

**Potential fixes:**

- Reduce margin/padding between `.mdv-sidebar` and `.mdv-content`
- Review responsive breakpoints and spacing
- Check if mobile styles are affecting desktop layout

## 5. Collapsible Navigation Pane for Desktop

**Status**: NEEDS FIX  
**Issue**: Navigation pane should be collapsible on desktop, not just mobile
**Current behavior**: Navigation is only collapsible on mobile
**Expected behavior**: Add toggle button to collapse/expand entire navigation pane on desktop

**Implementation ideas:**

- Add a collapse/expand button to navigation header
- Animate sidebar width transition
- Preserve state in localStorage
- Ensure content area expands when sidebar is collapsed
- Consider keyboard shortcut (e.g., Ctrl+B)

## 6. Navigation Categories Start Collapsed

**Status**: COMPLETED ✅
**Issue**: Categories should start collapsed by default for better space usage
**Fix**: Changed default aria-expanded to "false" and added hidden attribute

## Next Steps

1. **Spacing Issue**: Investigate CSS for navigation-content gap
   - Check `.mdv-sidebar` and `.mdv-content` styles
   - Review grid/flexbox layout
   - Test responsive behavior

2. **Desktop Navigation Toggle**: Design and implement
   - Add toggle button component
   - Create animation for sidebar collapse
   - Update layout calculations
   - Add accessibility support

3. **Testing**: Verify fixes work across different screen sizes and browsers

## Files to modify:

- `src/styles.ts` - Layout and spacing fixes
- `src/viewer.ts` - Desktop navigation toggle logic
- `src/mobile-styles.ts` - Ensure mobile behavior isn't affected
- Add tests for new functionality
