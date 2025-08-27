#!/usr/bin/env node

/**
 * 🔧 CI VALIDATION SCRIPT - Spike Academic Platform
 * 
 * Validates CI configuration and runs comprehensive checks
 * Designed for Hebrew/RTL academic platform with BGU integration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎓 Spike Academic Platform - CI Validation');
console.log('==========================================');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Execute command and return result
 */
function execCommand(command, description, options = {}) {
  console.log(`\n🔧 ${description}...`);
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    
    console.log(`✅ ${description} - PASSED`);
    results.passed++;
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}`);
    results.failed++;
    results.errors.push({ description, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Check if file exists
 */
function checkFileExists(filePath, description) {
  console.log(`\n📁 Checking ${description}...`);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} - EXISTS`);
    results.passed++;
    return true;
  } else {
    console.log(`❌ ${description} - MISSING`);
    results.failed++;
    results.errors.push({ description, error: 'File not found' });
    return false;
  }
}

/**
 * Validate package.json scripts
 */
function validatePackageScripts() {
  console.log('\n📦 Validating package.json scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    results.failed++;
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = [
    'build',
    'test',
    'lint',
    'type-check',
    'test:auth',
    'test:hebrew',
    'format:check'
  ];
  
  const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
  
  if (missingScripts.length === 0) {
    console.log('✅ All required scripts present');
    results.passed++;
  } else {
    console.log(`❌ Missing scripts: ${missingScripts.join(', ')}`);
    results.failed++;
    results.errors.push({ 
      description: 'Package scripts validation', 
      error: `Missing scripts: ${missingScripts.join(', ')}` 
    });
  }
}

/**
 * Validate Turborepo configuration
 */
function validateTurboConfig() {
  console.log('\n🚀 Validating Turborepo configuration...');
  
  const turboPath = path.join(process.cwd(), 'turbo.json');
  if (!fs.existsSync(turboPath)) {
    console.log('❌ turbo.json not found');
    results.failed++;
    return;
  }
  
  try {
    const turboConfig = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
    const requiredPipelines = ['build', 'test', 'lint', 'type-check'];
    
    const missingPipelines = requiredPipelines.filter(pipeline => !turboConfig.pipeline[pipeline]);
    
    if (missingPipelines.length === 0) {
      console.log('✅ Turborepo pipelines configured correctly');
      results.passed++;
    } else {
      console.log(`❌ Missing Turbo pipelines: ${missingPipelines.join(', ')}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ Invalid turbo.json: ${error.message}`);
    results.failed++;
  }
}

/**
 * Validate GitHub Actions workflows
 */
function validateGitHubActions() {
  console.log('\n🤖 Validating GitHub Actions workflows...');
  
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) {
    console.log('❌ .github/workflows directory not found');
    results.failed++;
    return;
  }
  
  const expectedWorkflows = ['ci.yml', 'deploy.yml', 'security-and-maintenance.yml'];
  const existingWorkflows = fs.readdirSync(workflowsDir);
  
  expectedWorkflows.forEach(workflow => {
    if (existingWorkflows.includes(workflow)) {
      console.log(`✅ ${workflow} workflow found`);
      results.passed++;
    } else {
      console.log(`❌ ${workflow} workflow missing`);
      results.failed++;
    }
  });
}

/**
 * Validate Hebrew/RTL configuration
 */
function validateHebrewRTLConfig() {
  console.log('\n🌍 Validating Hebrew/RTL configuration...');
  
  // Check Playwright config for Hebrew locale
  const playwrightPath = path.join(process.cwd(), 'playwright.config.ts');
  if (fs.existsSync(playwrightPath)) {
    const playwrightContent = fs.readFileSync(playwrightPath, 'utf8');
    if (playwrightContent.includes('he-IL')) {
      console.log('✅ Playwright configured for Hebrew locale');
      results.passed++;
    } else {
      console.log('⚠️  Playwright Hebrew locale not found');
      results.warnings++;
    }
  }
  
  // Check for RTL-related CSS or configuration
  const possibleRTLFiles = [
    'apps/web/app/globals.css',
    'apps/web/tailwind.config.js',
    'apps/web/next.config.js'
  ];
  
  let rtlConfigFound = false;
  possibleRTLFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('rtl') || content.includes('direction') || content.includes('he-IL')) {
        rtlConfigFound = true;
      }
    }
  });
  
  if (rtlConfigFound) {
    console.log('✅ RTL configuration detected');
    results.passed++;
  } else {
    console.log('⚠️  RTL configuration not clearly detected');
    results.warnings++;
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('\n🚀 Starting CI validation...\n');
  
  // Check essential files
  checkFileExists('.github/workflows/ci.yml', 'Main CI workflow');
  checkFileExists('.github/workflows/deploy.yml', 'Deployment workflow');
  checkFileExists('.github/workflows/security-and-maintenance.yml', 'Security workflow');
  checkFileExists('turbo.json', 'Turborepo configuration');
  checkFileExists('playwright.config.ts', 'Playwright configuration');
  checkFileExists('.lighthouserc.json', 'Lighthouse configuration');
  checkFileExists('package.json', 'Package configuration');
  
  // Validate configurations
  validatePackageScripts();
  validateTurboConfig();
  validateGitHubActions();
  validateHebrewRTLConfig();
  
  // Test basic commands
  execCommand('npm run type-check', 'TypeScript type checking', { timeout: 30000 });
  execCommand('npm run lint', 'ESLint validation', { timeout: 30000 });
  execCommand('npm run format:check', 'Code formatting check', { timeout: 15000 });
  
  // Test Hebrew/RTL specific commands (if they exist)
  try {
    execCommand('npm run test:hebrew', 'Hebrew content tests', { timeout: 30000 });
  } catch (error) {
    console.log('ℹ️  Hebrew tests not available or not configured');
  }
  
  try {
    execCommand('npm run lint:rtl', 'RTL-specific linting', { timeout: 15000 });
  } catch (error) {
    console.log('ℹ️  RTL linting not available or not configured');
  }
  
  // Build test
  console.log('\n🏗️  Testing build process...');
  const buildResult = execCommand('npm run build', 'Production build', { timeout: 120000 });
  
  // Generate summary
  console.log('\n📊 CI VALIDATION SUMMARY');
  console.log('=======================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED CHECKS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.description}: ${error.error}`);
    });
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Fix all failed checks before pushing to main');
    console.log('2. Ensure all required scripts are present in package.json');
    console.log('3. Verify GitHub Actions workflows are properly configured');
    console.log('4. Test Hebrew/RTL functionality manually');
    console.log('5. Run this script again after fixes: npm run validate:ci');
    
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('✅ CI configuration is valid and ready for production');
    console.log('🎓 Spike Academic Platform CI validation successful');
    
    if (results.warnings > 0) {
      console.log('\n⚠️  Note: Some warnings were found. Consider addressing them for optimal performance.');
    }
    
    process.exit(0);
  }
}

// Run validation
main().catch(error => {
  console.error('\n💥 Validation script crashed:', error);
  process.exit(1);
});