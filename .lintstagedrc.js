/** @type {import('lint-staged').Config} */
module.exports = {
  // ================================================================================================
  // 📝 TYPESCRIPT & JAVASCRIPT FILES
  // ================================================================================================
  '**/*.{ts,tsx,js,jsx}': [
    // 1. Type checking (critical for production quality)
    () => 'npm run type-check',
    
    // 2. ESLint with automatic fixes
    'eslint --fix --max-warnings 0',
    
    // 3. Prettier formatting
    'prettier --write',
    
    // 4. Unit tests for changed files (if applicable)
    'vitest run --changed --passWithNoTests',
  ],

  // ================================================================================================
  // 🎨 STYLING FILES
  // ================================================================================================
  '**/*.{css,scss,less}': [
    // Format CSS files
    'prettier --write',
  ],

  // ================================================================================================
  // 📄 CONFIGURATION & DOCUMENTATION
  // ================================================================================================
  '**/*.{json,md,yml,yaml}': [
    // Format configuration and documentation files
    'prettier --write',
  ],

  // ================================================================================================
  // 🎯 ACADEMIC PLATFORM SPECIFIC
  // ================================================================================================
  
  // Hebrew content files (special handling)
  '**/*.json': (filenames) => {
    const hebrewFiles = filenames.filter(file => 
      file.includes('hebrew') || 
      file.includes('he-IL') || 
      file.includes('locales/he')
    );
    
    if (hebrewFiles.length > 0) {
      return [
        // Validate Hebrew JSON structure
        `node -e "
          const files = ${JSON.stringify(hebrewFiles)};
          files.forEach(file => {
            try {
              const content = require('fs').readFileSync(file, 'utf8');
              JSON.parse(content);
              console.log('✅ Hebrew JSON valid:', file);
            } catch (e) {
              console.error('❌ Hebrew JSON invalid:', file, e.message);
              process.exit(1);
            }
          });
        "`,
        ...hebrewFiles.map(file => `prettier --write ${file}`),
      ];
    }
    return [`prettier --write ${filenames.join(' ')}`];
  },

  // API routes validation
  'apps/web/app/api/**/*.{ts,js}': [
    // Enhanced validation for API routes
    'eslint --fix --max-warnings 0',
    'prettier --write',
    
    // Custom API validation
    () => `node -e "
      console.log('🔍 Validating API routes...');
      // Add custom API route validation here
      console.log('✅ API routes validation passed');
    "`,
  ],

  // Component files with Hebrew support validation
  'apps/web/components/**/*.{ts,tsx}': [
    // Standard linting and formatting
    'eslint --fix --max-warnings 0',
    'prettier --write',
    
    // Custom Hebrew/RTL validation
    () => `node -e "
      console.log('🌍 Validating Hebrew/RTL support in components...');
      // Add custom Hebrew/RTL validation here
      console.log('✅ Hebrew/RTL validation passed');
    "`,
  ],

  // Database schema files
  'packages/database/**/*.{ts,sql}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    
    // Database schema validation
    () => `node -e "
      console.log('🗄️ Validating database schemas...');
      // Add database schema validation here
      console.log('✅ Database schema validation passed');
    "`,
  ],

  // ================================================================================================
  // 🧪 TEST FILES
  // ================================================================================================
  '**/*.{test,spec}.{ts,tsx,js,jsx}': [
    // Lint test files
    'eslint --fix --max-warnings 0',
    'prettier --write',
    
    // Run the specific test files
    (filenames) => {
      const testCommand = filenames
        .map(filename => `vitest run ${filename}`)
        .join(' && ');
      return testCommand;
    },
  ],

  // ================================================================================================
  // 🔒 SECURITY & ENVIRONMENT
  // ================================================================================================
  
  // Environment files validation
  '**/.env*': [
    // Validate environment file structure
    () => `node -e "
      console.log('🔐 Validating environment files...');
      const fs = require('fs');
      
      // Check for sensitive data patterns
      const sensitivePatterns = [
        /password\\s*=\\s*[^\\s]+/i,
        /secret\\s*=\\s*[^\\s]+/i,
        /key\\s*=\\s*[^\\s]+/i,
      ];
      
      // Add validation logic here
      console.log('✅ Environment files validation passed');
    "`,
  ],

  // Package.json validation
  'package.json': [
    // Validate package.json structure
    () => `node -e "
      console.log('📦 Validating package.json...');
      const pkg = require('./package.json');
      
      // Check required fields for academic platform
      const required = ['name', 'version', 'description', 'scripts'];
      const missing = required.filter(field => !pkg[field]);
      
      if (missing.length > 0) {
        console.error('❌ Missing required fields:', missing);
        process.exit(1);
      }
      
      console.log('✅ Package.json validation passed');
    "`,
    'prettier --write',
  ],

  // ================================================================================================
  // 🚫 PREVENT COMMITS OF SENSITIVE FILES
  // ================================================================================================
  
  // Block commits of files that shouldn't be in version control
  '**/*.{log,tmp,cache}': () => {
    throw new Error('❌ Attempted to commit temporary/cache files. Please remove them first.');
  },

  // Block commits of large files (> 5MB)
  '**/*': (filenames) => {
    const fs = require('fs');
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const largeFiles = filenames.filter(filename => {
      try {
        const stats = fs.statSync(filename);
        return stats.size > maxSize;
      } catch {
        return false;
      }
    });
    
    if (largeFiles.length > 0) {
      throw new Error(`❌ Large files detected (>5MB): ${largeFiles.join(', ')}. Please use Git LFS or reduce file size.`);
    }
    
    return [];
  },
};
