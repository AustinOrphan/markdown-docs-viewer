import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'demo/',
        'examples/',
        '**/*.d.ts',
        'vitest.config.ts',
        'src/theme-builder.ts',
        'src/theme-manager.ts',
        'src/theme-switcher.ts',
        'src/dark-mode-toggle.ts'
      ],
      thresholds: {
        functions: 80,
        lines: 80,
        branches: 80,
        statements: 80
      }
    },
    
    // Include/exclude patterns
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules/',
      'dist/',
      'demo/',
      'examples/'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose', 'json'],
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Watch mode
    watch: false,
    
    // Retry failed tests
    retry: 0
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
})