import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/test-setup.js'],
    testTimeout: 8000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    include: [
      'tests/unit/**/*.js',
      'tests/integration/**/*.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/__fixtures__/',
        'tests/__helpers__/',
        'tests/e2e/',
        'coverage/',
        '*.config.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  server: {
    deps: {
      inline: ['vitest']
    }
  }
});