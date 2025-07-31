import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['tests/setup.ts'],

    // Global test configuration
    globals: true,

    // Integration-specific patterns
    include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/', 'dist/', 'demo/', 'examples/'],

    // Longer timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 30000,

    // Integration test isolation
    isolate: true,
    pool: 'forks',

    // Coverage configuration for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'demo/',
        'examples/',
        '**/*.d.ts',
        'vitest.config.ts',
        'vitest.integration.config.ts',
      ],
      thresholds: {
        functions: 70,
        lines: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Reporter configuration
    reporter: ['verbose', 'json'],

    // Mock configuration - allow real implementations for integration tests
    clearMocks: false,
    restoreMocks: false,

    // Less strict retry for integration tests (they may be flaky)
    retry: 1,
  },

  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});