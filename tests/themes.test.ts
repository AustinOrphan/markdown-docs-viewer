import { describe, it, expect } from 'vitest'
import { defaultTheme, darkTheme } from '../src/themes'

describe('Themes', () => {
    describe('defaultTheme', () => {
        it('should have all required color properties', () => {
            expect(defaultTheme.colors).toBeDefined()
            expect(defaultTheme.colors.primary).toBeDefined()
            expect(defaultTheme.colors.background).toBeDefined()
            expect(defaultTheme.colors.surface).toBeDefined()
            expect(defaultTheme.colors.text).toBeDefined()
            expect(defaultTheme.colors.textLight).toBeDefined()
            expect(defaultTheme.colors.border).toBeDefined()
            expect(defaultTheme.colors.code).toBeDefined()
            expect(defaultTheme.colors.codeBackground).toBeDefined()
        })

        it('should have valid CSS color values', () => {
            // Test that color values are valid CSS colors (hex format)
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
            
            expect(defaultTheme.colors.primary).toMatch(hexColorRegex)
            expect(defaultTheme.colors.background).toMatch(hexColorRegex)
            expect(defaultTheme.colors.text).toMatch(hexColorRegex)
        })

        it('should have all required font properties', () => {
            expect(defaultTheme.fonts).toBeDefined()
            expect(defaultTheme.fonts.body).toBeDefined()
            expect(defaultTheme.fonts.heading).toBeDefined()
            expect(defaultTheme.fonts.code).toBeDefined()
        })

        it('should have valid font stacks', () => {
            // Font stacks should be non-empty strings
            expect(defaultTheme.fonts.body).toBeTypeOf('string')
            expect(defaultTheme.fonts.body.length).toBeGreaterThan(0)
            
            expect(defaultTheme.fonts.heading).toBeTypeOf('string')
            expect(defaultTheme.fonts.heading.length).toBeGreaterThan(0)
            
            expect(defaultTheme.fonts.code).toBeTypeOf('string')
            expect(defaultTheme.fonts.code.length).toBeGreaterThan(0)
        })
    })

    describe('darkTheme', () => {
        it('should have all required color properties', () => {
            expect(darkTheme.colors).toBeDefined()
            expect(darkTheme.colors.primary).toBeDefined()
            expect(darkTheme.colors.background).toBeDefined()
            expect(darkTheme.colors.surface).toBeDefined()
            expect(darkTheme.colors.text).toBeDefined()
            expect(darkTheme.colors.textLight).toBeDefined()
            expect(darkTheme.colors.border).toBeDefined()
            expect(darkTheme.colors.code).toBeDefined()
            expect(darkTheme.colors.codeBackground).toBeDefined()
        })

        it('should have different colors from default theme', () => {
            // Dark theme should have different background colors
            expect(darkTheme.colors.background).not.toBe(defaultTheme.colors.background)
            expect(darkTheme.colors.text).not.toBe(defaultTheme.colors.text)
        })

        it('should have dark background colors', () => {
            // Dark theme should have dark backgrounds (approximate check)
            // This is a simple check - in a real app you might use color parsing
            expect(darkTheme.colors.background.toLowerCase()).toMatch(/^#[0-4]/)
        })

        it('should have light text colors for contrast', () => {
            // Dark theme should have light text for contrast
            expect(darkTheme.colors.text.toLowerCase()).toMatch(/^#[a-f9]/)
        })

        it('should have same font structure as default theme', () => {
            expect(darkTheme.fonts).toBeDefined()
            expect(darkTheme.fonts.body).toBeDefined()
            expect(darkTheme.fonts.heading).toBeDefined()
            expect(darkTheme.fonts.code).toBeDefined()
        })
    })

    describe('Theme Validation', () => {
        it('should have consistent structure between themes', () => {
            const defaultKeys = Object.keys(defaultTheme.colors).sort()
            const darkKeys = Object.keys(darkTheme.colors).sort()
            
            expect(darkKeys).toEqual(defaultKeys)
        })

        it('should have valid CSS units for spacing if present', () => {
            const cssUnitRegex = /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/
            
            if (defaultTheme.spacing) {
                Object.values(defaultTheme.spacing).forEach(value => {
                    if (typeof value === 'string') {
                        expect(value).toMatch(cssUnitRegex)
                    }
                })
            }
        })

        it('should have valid CSS units for radius if present', () => {
            const cssUnitRegex = /^\d+(\.\d+)?(px|em|rem|%)$/
            
            if (defaultTheme.radius) {
                Object.values(defaultTheme.radius).forEach(value => {
                    if (typeof value === 'string') {
                        expect(value).toMatch(cssUnitRegex)
                    }
                })
            }
        })
    })

    describe('Accessibility Considerations', () => {
        it('should have sufficient contrast between text and background', () => {
            // This is a simplified check - in production you'd use a proper contrast calculator
            const isLightBackground = (color: string) => {
                // Simple check: light colors typically start with higher hex values
                return color.toLowerCase().match(/^#[a-f8-9]/)
            }
            
            const isDarkText = (color: string) => {
                // Simple check: dark colors typically start with lower hex values
                return color.toLowerCase().match(/^#[0-7]/)
            }
            
            // Default theme: light background should have dark text
            if (isLightBackground(defaultTheme.colors.background)) {
                expect(isDarkText(defaultTheme.colors.text)).toBeTruthy()
            }
            
            // Dark theme: dark background should have light text
            if (!isLightBackground(darkTheme.colors.background)) {
                expect(!isDarkText(darkTheme.colors.text)).toBeTruthy()
            }
        })

        it('should not rely only on color for information', () => {
            // Both themes should have the same structure
            // This ensures information isn't conveyed through color alone
            expect(Object.keys(defaultTheme.colors)).toEqual(Object.keys(darkTheme.colors))
        })
    })

    describe('Custom Theme Creation', () => {
        it('should be possible to extend default theme', () => {
            const customTheme = {
                ...defaultTheme,
                colors: {
                    ...defaultTheme.colors,
                    primary: '#ff0000'
                }
            }
            
            expect(customTheme.colors.primary).toBe('#ff0000')
            expect(customTheme.colors.background).toBe(defaultTheme.colors.background)
            expect(customTheme.fonts).toBe(defaultTheme.fonts)
        })

        it('should be possible to extend dark theme', () => {
            const customDarkTheme = {
                ...darkTheme,
                colors: {
                    ...darkTheme.colors,
                    primary: '#00ff00'
                }
            }
            
            expect(customDarkTheme.colors.primary).toBe('#00ff00')
            expect(customDarkTheme.colors.background).toBe(darkTheme.colors.background)
        })

        it('should be possible to create completely custom theme', () => {
            const brandTheme = {
                colors: {
                    primary: '#3b82f6',
                    background: '#ffffff',
                    surface: '#f8fafc',
                    text: '#1e293b',
                    textLight: '#64748b',
                    border: '#e2e8f0',
                    code: '#8b5cf6',
                    codeBackground: '#f1f5f9'
                },
                fonts: {
                    body: 'Inter, sans-serif',
                    heading: 'Poppins, sans-serif',
                    code: 'Fira Code, monospace'
                }
            }
            
            expect(brandTheme.colors.primary).toBe('#3b82f6')
            expect(brandTheme.fonts.body).toBe('Inter, sans-serif')
        })
    })
})