import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * 🧪 VITEST SIMPLE CONFIGURATION - Spike Academic Platform
 *
 * Simplified testing configuration for quick unit tests,
 * particularly for authentication and critical path testing
 */

export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default;

  return {
    // ================================================================================================
    // 🎯 MINIMAL PLUGIN SETUP
    // ================================================================================================
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
    ],

    // ================================================================================================
    // 🧪 SIMPLIFIED TEST CONFIGURATION
    // ================================================================================================
    test: {
      // Basic environment
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,

      // ================================================================================================
      // 🎯 FOCUSED TEST PATTERNS
      // ================================================================================================

      // Only include specific test files for quick execution
      include: [
        'tests/unit/middleware-authentication-logic.test.ts',
        'tests/unit/onboarding-api-logic.test.ts',
        'tests/unit/**/*.{test,spec}.{js,ts,tsx}',
      ],

      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        'tests/e2e/**',
        'tests/integration/**',
        '**/*.integration.test.*',
        '**/*.e2e.test.*',
      ],

      // ================================================================================================
      // ⚡ PERFORMANCE OPTIMIZED
      // ================================================================================================

      // Fast execution for critical tests
      testTimeout: 5000, // 5 seconds
      hookTimeout: 5000,

      // Sequential execution for consistency
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },

      // ================================================================================================
      // 📊 MINIMAL COVERAGE
      // ================================================================================================

      coverage: {
        provider: 'v8',
        reporter: ['text'],

        // Focus on critical authentication components
        include: ['lib/auth/**', 'lib/middleware/**', 'lib/security/**', 'app/api/auth/**'],

        exclude: ['**/node_modules/**', '**/tests/**', '**/*.test.*', '**/*.spec.*', '**/*.d.ts'],

        // Lower thresholds for quick feedback
        thresholds: {
          global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
          },
        },
      },

      // ================================================================================================
      // 🔧 SIMPLE CONFIGURATION
      // ================================================================================================

      // Clear mocks between tests
      clearMocks: true,
      restoreMocks: true,

      // Minimal output
      reporter: 'verbose',

      // Fast failure
      bail: 1,

      // No watch mode for CI/quick runs
      watch: false,

      // Silent mode for focused testing
      silent: false,
    },

    // ================================================================================================
    // 📁 BASIC RESOLVE CONFIGURATION
    // ================================================================================================

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@/lib': path.resolve(__dirname, './lib'),
        '@/app': path.resolve(__dirname, './app'),
        '@/tests': path.resolve(__dirname, './tests'),

        // App-specific aliases for monorepo
        '@/web': path.resolve(__dirname, './apps/web'),
        '@/database': path.resolve(__dirname, './packages/database'),

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
    // 🌐 ESSENTIAL ENVIRONMENT VARIABLES
    // ================================================================================================

    define: {
      'process.env.NODE_ENV': '"test"',
      'process.env.NEXT_PUBLIC_APP_ENV': '"test"',
      'process.env.NEXTAUTH_SECRET': '"test-secret"',
      'process.env.NEXTAUTH_URL': '"http://localhost:3000"',
    },
  };
});
