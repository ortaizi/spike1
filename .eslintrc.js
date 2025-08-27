/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'next/core-web-vitals',
    'prettier', // Must be last to override other configs
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'unused-imports',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
  },
  rules: {
    // ================================================================================================
    // 🚨 CRITICAL RULES - NEVER DISABLE
    // ================================================================================================
    
    // TypeScript Strict Rules (Relaxed for development)
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    
    // Security Rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Performance Rules
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    
    // ================================================================================================
    // 📝 CODE QUALITY RULES
    // ================================================================================================
    
    // TypeScript Best Practices
    '@typescript-eslint/consistent-type-imports': ['error', { 
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
    }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
    }],
    
    // Import Organization
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'type',
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
      pathGroups: [
        {
          pattern: 'react**',
          group: 'external',
          position: 'before',
        },
        {
          pattern: 'next**',
          group: 'external',
          position: 'before',
        },
        {
          pattern: '@/**',
          group: 'internal',
          position: 'before',
        },
        {
          pattern: '@spike/**',
          group: 'internal',
          position: 'before',
        },
      ],
      pathGroupsExcludedImportTypes: ['react', 'next'],
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    
    // Remove Unused Imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    
    // ================================================================================================
    // 🎨 REACT & JSX RULES
    // ================================================================================================
    
    // React Best Practices
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-fragments': ['error', 'syntax'],
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn',
    'react/prefer-stateless-function': 'error',
    'react/self-closing-comp': 'error',
    'react/jsx-sort-props': ['error', {
      callbacksLast: true,
      shorthandFirst: true,
      multiline: 'last',
      reservedFirst: true,
    }],
    
    // Accessibility Rules (Critical for Hebrew/RTL support)
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/lang': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    
    // ================================================================================================
    // 🎯 ACADEMIC PLATFORM SPECIFIC RULES
    // ================================================================================================
    
    // Hebrew/RTL Specific Rules
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/[a-zA-Z]{3,}/]',
        message: 'Hard-coded English strings detected. Use Hebrew localization or constants.',
      },
    ],
    
    // Academic Data Validation
    'no-magic-numbers': ['error', { 
      ignore: [0, 1, -1, 100], // Allow common academic values
      ignoreArrayIndexes: true,
      enforceConst: true,
    }],
    
    // ================================================================================================
    // 📦 NEXT.JS SPECIFIC RULES
    // ================================================================================================
    
    // Next.js Best Practices
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'error',
    '@next/next/no-page-custom-font': 'error',
    '@next/next/no-sync-scripts': 'error',
    '@next/next/no-title-in-document-head': 'error',
    '@next/next/no-unwanted-polyfillio': 'error',
    
    // ================================================================================================
    // 🔧 NAMING CONVENTIONS
    // ================================================================================================
    
    '@typescript-eslint/naming-convention': [
      'error',
      // Variables and functions: camelCase
      {
        selector: 'variableLike',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // Functions: camelCase
      {
        selector: 'function',
        format: ['camelCase'],
      },
      // Constants: UPPER_SNAKE_CASE
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['camelCase', 'UPPER_CASE'],
      },
      // Types and Interfaces: PascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // Enum members: PascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase', 'UPPER_CASE'],
      },
      // Class properties: camelCase
      {
        selector: 'classProperty',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // Parameters: camelCase
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
    ],
    
    // ================================================================================================
    // ⚡ PERFORMANCE RULES
    // ================================================================================================
    
    // Prevent performance issues
    'react/jsx-no-bind': ['error', {
      allowArrowFunctions: true,
      allowBind: false,
      ignoreRefs: true,
    }],
    'react/jsx-no-constructed-context-values': 'error',
    'react/no-unstable-nested-components': 'error',
    
    // ================================================================================================
    // 🚫 DISABLED RULES (with justification)
    // ================================================================================================
    
    // Disabled because we use Next.js App Router
    'react/react-in-jsx-scope': 'off',
    
    // Disabled because we prefer interface over type
    '@typescript-eslint/consistent-type-exports': 'off',
    
    // Disabled for Hebrew content and academic terms
    'spellcheck/spell-checker': 'off',
  },
  overrides: [
    // ================================================================================================
    // 📁 SPECIFIC FILE PATTERNS
    // ================================================================================================
    
    // Test files
    {
      files: ['**/__tests__/**/*', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
        'vitest-globals/env': true,
      },
      extends: ['plugin:jest/recommended', 'plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'no-magic-numbers': 'off',
      },
    },
    
    // Configuration files
    {
      files: ['*.config.{js,ts}', '.*rc.{js,ts}'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-default-export': 'off',
      },
    },
    
    // Next.js API routes
    {
      files: ['apps/web/app/api/**/*.{js,ts}', 'apps/web/pages/api/**/*.{js,ts}'],
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    
    // Scraping service (Python-like patterns allowed)
    {
      files: ['apps/scraper/**/*.{js,ts}'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    
    // Page components
    {
      files: ['apps/web/app/**/page.{js,jsx,ts,tsx}', 'apps/web/pages/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    
    // Layout components
    {
      files: ['apps/web/app/**/layout.{js,jsx,ts,tsx}'],
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'build/',
    '*.min.js',
    '*.bundle.js',
    'coverage/',
    '.turbo/',
    '**/*.d.ts',
    'apps/scraper/**/*.py', // Python files
  ],
};
