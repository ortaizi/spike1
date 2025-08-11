const fs = require('fs');
const path = require('path');

// Function to replace process.env access patterns
function fixEnvAccess(content) {
  // Replace process.env['KEY'] with env.KEY imports
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUTH_SECRET',
    'AUTH_DEBUG',
    'APP_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'BGU_MOODLE_URL',
    'TECHNION_MOODLE_URL',
    'HUJI_MOODLE_URL',
    'TAU_MOODLE_URL',
    'SCRAPING_TIMEOUT',
    'SCRAPING_USER_AGENT',
    'SCRAPING_RETRY_ATTEMPTS',
    'SCRAPING_DELAY',
    'COURSE_ANALYZER_API_URL',
    'SYNC_API_URL',
    'NEXTAUTH_DEBUG'
  ];

  let modified = content;
  let needsEnvImport = false;

  envVars.forEach(envVar => {
    const pattern = new RegExp(`process\\.env\\.${envVar}`, 'g');
    const bracketPattern = new RegExp(`process\\.env\\['${envVar}'\\]`, 'g');
    
    if (pattern.test(modified) || bracketPattern.test(modified)) {
      needsEnvImport = true;
      modified = modified.replace(pattern, `env.${envVar}`);
      modified = modified.replace(bracketPattern, `env.${envVar}`);
    }
  });

  // Add env import if needed and not already present
  if (needsEnvImport && !modified.includes('import { env }')) {
    // Find the last import statement
    const lines = modified.split('\n');
    let importIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require(')) {
        importIndex = i;
      }
    }
    
    if (importIndex !== -1) {
      lines.splice(importIndex + 1, 0, 'import { env } from "@/lib/env"');
      modified = lines.join('\n');
    }
  }

  return modified;
}

// Function to process files recursively
function processFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        processFiles(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixed = fixEnvAccess(content);
      
      if (fixed !== content) {
        fs.writeFileSync(filePath, fixed);
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

// Start processing from apps/web
const webDir = path.join(__dirname, 'apps', 'web');
console.log('Fixing environment variable access patterns...');
processFiles(webDir);
console.log('Done!');



