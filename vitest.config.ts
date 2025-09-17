import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * 🧪 VITEST CONFIGURATION - Spike Academic Platform
 *
 * Comprehensive testing setup with Hebrew/RTL support for the
 * Israeli university academic management platform
 */

export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default;

  return {
    // ================================================================================================
    // 🎯 PLUGIN CONFIGURATION
    // ================================================================================================
    plugins: [
      react({
        // Support JSX with Hebrew content
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        babel: {
          parserOpts: {
            plugins: ['jsx', 'typescript'],
          },
        },
      }),
    ],

    // ================================================================================================
    // 🧪 VITEST CONFIGURATION
    // ================================================================================================
    test: {
      // Test environment setup
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],

      // ================================================================================================
      // 🌍 HEBREW/RTL CONFIGURATION
      // ================================================================================================

      // Global test configuration for Hebrew locale
      globals: true,

      // File patterns for test discovery
      include: [
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'tests/**/*.{test,spec}.{js,ts,tsx}',
        'apps/**/tests/**/*.{test,spec}.{js,ts,tsx}',
        'packages/**/tests/**/*.{test,spec}.{js,ts,tsx}',
      ],

      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/playwright/**',
        '**/e2e/**',
        // Exclude Playwright E2E tests from unit test runs
        'tests/e2e/**',
      ],

      // ================================================================================================
      // 📊 COVERAGE CONFIGURATION
      // ================================================================================================

      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],

        // Coverage thresholds for quality gates
        thresholds: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
          },
        },

        // Include Hebrew/RTL specific files
        include: [
          'apps/**/*.{js,ts,jsx,tsx}',
          'packages/**/*.{js,ts,jsx,tsx}',
          'lib/**/*.{js,ts,jsx,tsx}',
        ],

        exclude: [
          '**/node_modules/**',
          '**/tests/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/dist/**',
          '**/.next/**',
          '**/playwright/**',
          '**/e2e/**',
          // Exclude config files
          '**/*.config.*',
          '**/middleware.ts',
          // Exclude type files
          '**/*.d.ts',
        ],
      },

      // ================================================================================================
      // ⚡ PERFORMANCE CONFIGURATION
      // ================================================================================================

      // Test execution configuration
      testTimeout: 10000, // 10 seconds for Hebrew text processing
      hookTimeout: 10000, // 10 seconds for setup/teardown

      // Parallel execution
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false,
        },
      },

      // ================================================================================================
      // 🎓 ACADEMIC PLATFORM SPECIFIC CONFIGURATION
      // ================================================================================================

      // Test patterns for different academic features
      testNamePattern: undefined, // Allow Hebrew test names

      // Watch mode configuration for development
      watch: false,

      // Reporters for Hebrew content
      reporter: process.env.CI ? 'json' : 'verbose',

      // Output configuration
      outputFile: {
        json: './test-results/results.json',
      },

      // ================================================================================================
      // 🔧 ADVANCED CONFIGURATION
      // ================================================================================================

      // Mock configuration
      clearMocks: true,
      restoreMocks: true,

      // Snapshot configuration for Hebrew content
      snapshotFormat: {
        escapeString: false,
        printBasicPrototype: true,
      },

      // Silent console in tests
      silent: false,

      // Fail fast in CI
      bail: process.env.CI ? 1 : 0,
    },

    // ================================================================================================
    // 📁 RESOLVE CONFIGURATION
    // ================================================================================================

    resolve: {
      alias: {
        // Next.js style path mapping
        '@': path.resolve(__dirname, './'),
        '@/components': path.resolve(__dirname, './components'),
        '@/lib': path.resolve(__dirname, './lib'),
        '@/app': path.resolve(__dirname, './app'),
        '@/tests': path.resolve(__dirname, './tests'),

        // App-specific aliases for monorepo
        '@/web': path.resolve(__dirname, './apps/web'),
        '@/database': path.resolve(__dirname, './packages/database'),

        // Fix absolute imports for test files
        '../../apps/web/lib': path.resolve(__dirname, './apps/web/lib'),
        '../../apps/web/app': path.resolve(__dirname, './apps/web/app'),

        // Hebrew utilities
        '@/utils/hebrew': path.resolve(__dirname, './lib/utils/hebrew'),
        '@/utils/academic': path.resolve(__dirname, './lib/utils/academic'),

        // Fix module resolution for specific files
        '../env': path.resolve(__dirname, './apps/web/lib/env.ts'),
        'lib/env': path.resolve(__dirname, './apps/web/lib/env.ts'),
        '../../apps/web/lib/env': path.resolve(__dirname, './apps/web/lib/env.ts'),
        '/Users/ortaizi/Desktop/spike1-1/apps/web/lib/env': path.resolve(__dirname, './apps/web/lib/env.ts'),

        // Fix Next.js module resolution for testing
        'next/server': path.resolve(__dirname, './tests/mocks/next-server.mock.ts'),
        'next/headers': path.resolve(__dirname, './tests/mocks/next-headers.mock.ts'),
      },
    },

    // ================================================================================================
    // 🌐 DEFINE CONFIGURATION
    // ================================================================================================

    define: {
      // Environment variables for testing
      'process.env.NODE_ENV': '"test"',
      'process.env.NEXT_PUBLIC_APP_ENV': '"test"',

      // Hebrew locale configuration
      'process.env.LOCALE': '"he-IL"',
      'process.env.TIMEZONE': '"Asia/Jerusalem"',

      // Academic platform configuration
      'process.env.ACADEMIC_YEAR': '"2024"',
      'process.env.SEMESTER': '"א"', // Hebrew first semester

      // Test-specific configurations
      'process.env.SUPABASE_URL': '"http://localhost:54321"',
      'process.env.SUPABASE_ANON_KEY': '"test-key"',
      'process.env.NEXTAUTH_SECRET': '"test-secret"',
      'process.env.NEXTAUTH_URL': '"http://localhost:3000"',
    },

    // ================================================================================================
    // 🏗️ BUILD CONFIGURATION
    // ================================================================================================

    // ESBuild configuration for Hebrew content
    esbuild: {
      target: 'node16',
      format: 'esm',
      charset: 'utf8',
      jsx: 'preserve',
    },

    // ================================================================================================
    // 📊 OPTIMIZATIONS FOR ACADEMIC PLATFORM
    // ================================================================================================

    optimizeDeps: {
      include: [
        // Pre-bundle testing dependencies
        '@testing-library/react',
        '@testing-library/jest-dom',
        '@testing-library/user-event',

        // Hebrew text processing
        'he',
        'intl',

        // Academic platform dependencies
        '@supabase/supabase-js',
        'next-auth',
      ],
    },
  };
});
