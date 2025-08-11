/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // ================================================================================================
    // 🎯 TEST ENVIRONMENT
    // ================================================================================================
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    
    // ================================================================================================
    // 📁 FILE PATTERNS
    // ================================================================================================
    include: [
      'apps/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'packages/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/e2e/**',
      '**/playwright/**',
    ],
    
    // ================================================================================================
    // 📊 COVERAGE CONFIGURATION
    // ================================================================================================
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        'apps/**/*.config.{js,ts}',
        'apps/**/*.d.ts',
        'apps/**/types/**',
        'packages/**/dist/**',
        'apps/**/.next/**',
        'apps/**/coverage/**',
        'apps/**/*.stories.{js,ts,jsx,tsx}',
        'apps/**/*.spec.{js,ts,jsx,tsx}',
        'apps/**/*.test.{js,ts,jsx,tsx}',
        // Exclude Python scraper files
        '**/*.py',
        '**/venv/**',
        '**/env/**',
      ],
      include: [
        'apps/**/*.{js,ts,jsx,tsx}',
        'packages/**/*.{js,ts,jsx,tsx}',
      ],
      // Academic platform specific coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Higher requirements for critical academic components
        'apps/web/components/assignments/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'apps/web/components/courses/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'apps/web/app/api/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
    
    // ================================================================================================
    // 🌍 HEBREW/RTL TESTING SUPPORT
    // ================================================================================================
    env: {
      LOCALE: 'he-IL',
      TIMEZONE: 'Asia/Jerusalem',
      RTL: 'true',
      ACADEMIC_YEAR: '2024',
      DEFAULT_SEMESTER: 'א',
      NODE_ENV: 'test',
      VITEST_HEBREW: 'true'
    },
    
    // ================================================================================================
    // 🧪 HEBREW TEST PATTERNS
    // ================================================================================================
    testNamePattern: '.*\\.(hebrew|rtl|עברית).*',
    
    // ================================================================================================
    // ⚡ PERFORMANCE CONFIGURATION
    // ================================================================================================
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // ================================================================================================
    // 🔧 TESTING UTILITIES
    // ================================================================================================
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    
    // ================================================================================================
    // 📋 REPORTING
    // ================================================================================================
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-results.html',
    },
    
    // ================================================================================================
    // 🎓 ACADEMIC PLATFORM SPECIFIC MOCKS
    // ================================================================================================
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  
  // ================================================================================================
  // 🗂️ PATH RESOLUTION (same as main tsconfig)
  // ================================================================================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web'),
      '@/components': path.resolve(__dirname, './apps/web/components'),
      '@/lib': path.resolve(__dirname, './apps/web/lib'),
      '@/types': path.resolve(__dirname, './apps/web/types'),
      '@/hooks': path.resolve(__dirname, './apps/web/hooks'),
      '@/stores': path.resolve(__dirname, './apps/web/stores'),
      '@/app': path.resolve(__dirname, './apps/web/app'),
      '@spike/database': path.resolve(__dirname, './packages/database/src'),
      '@spike/shared': path.resolve(__dirname, './packages/shared/src'),
      '@spike/ui': path.resolve(__dirname, './packages/ui/src'),
    },
  },
  
  // ================================================================================================
  // 📦 PLUGIN CONFIGURATION
  // ================================================================================================
  esbuild: {
    target: 'node14',
  },
  
  // ================================================================================================
  // 🔧 BUILD OPTIMIZATION FOR TESTS
  // ================================================================================================
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ],
  },
});
