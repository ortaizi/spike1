# Spike Platform - Claude Custom Commands

This file defines custom slash commands for efficient development of the Spike academic management platform. These commands automate common tasks and ensure proper implementation of Hebrew RTL support, university integrations, and authentication flows.

## Database & Types Commands

### /sync-types
**Purpose**: Sync Supabase database types to the shared packages
**Implementation**:
```bash
cd /Users/ortaizi/Desktop/Spike
npm run db:generate
# This runs: turbo db:generate which executes:
# 1. supabase gen types typescript --project-id=fnizmtpiyszmmccorscc > packages/database/src/types.ts
# 2. Copies types to packages/shared/src/types.ts for cross-package usage
# 3. Updates all package TypeScript builds
```
**When to use**: After any Supabase schema changes, migrations, or RLS policy updates

### /check-db-health
**Purpose**: Verify database connection and table structure
**Implementation**:
```bash
cd apps/web
curl -s http://localhost:3000/api/health | jq .
# Should return database connection status and performance metrics
```

## RTL & Hebrew Support Commands

### /test-hebrew [component]
**Purpose**: Test specific component with Hebrew content and RTL layout verification
**Implementation**:
```bash
# 1. Create test Hebrew content file
cat > test-hebrew-content.json << 'EOF'
{
  "courseName": "יסודות האלגוריתמים והסיבוכיות",
  "assignment": "תרגיל בית מספר 3 - אלגוריתמי מיון",
  "description": "בתרגיל זה תתרגלו על אלגוריתמי מיון שונים ותשוו ביניהם",
  "instructor": "ד\"ר רחל כהן",
  "dueDate": "15 בינואר 2024",
  "priority": "גבוהה"
}
EOF

# 2. Start dev server with Hebrew locale
cd apps/web
NEXT_LOCALE=he npm run dev

# 3. Take screenshot for visual verification
npm run test:visual -- --grep="[component]" --locale=he

# 4. Run RTL layout tests
npm test -- --testNamePattern="RTL.*[component]" --verbose
```
**Parameters**: 
- `[component]` - Component name to test (e.g., "CourseCard", "AssignmentTable")

### /rtl-check
**Purpose**: Scan all components for proper RTL implementation
**Implementation**:
```bash
echo "🔍 Scanning for RTL issues in components..."

# 1. Check for deprecated margin/padding classes
echo "❌ Found deprecated margin/padding classes:"
find components -name "*.tsx" -o -name "*.ts" | xargs grep -n "ml-\|mr-\|pl-\|pr-" | head -20

# 2. Check for proper RTL classes
echo "✅ Components using proper RTL classes:"
find components -name "*.tsx" -o -name "*.ts" | xargs grep -n "ms-\|me-\|ps-\|pe-\|rtl:" | head -10

# 3. Check for hardcoded text direction
echo "⚠️  Hardcoded text direction (should use dir='rtl'):"
find components -name "*.tsx" -o -name "*.ts" | xargs grep -n 'direction.*ltr\|direction.*rtl' | head -10

# 4. Check for missing RTL utilities
echo "🔧 Components that may need RTL attention:"
find components -name "*.tsx" | while read file; do
  if ! grep -q "rtl:\|dir=\|direction" "$file" && grep -q "flex\|grid\|justify\|items" "$file"; then
    echo "  - $file (contains layout classes but no RTL handling)"
  fi
done | head -10

# 5. Generate RTL compliance report
cat > rtl-compliance-report.md << 'EOF'
# RTL Compliance Report - $(date)

## Issues Found:
- Deprecated classes: $(find components -name "*.tsx" | xargs grep -c "ml-\|mr-\|pl-\|pr-" | grep -v ":0" | wc -l) files
- Missing dir attributes: $(find components -name "*.tsx" | xargs grep -L "dir=" | wc -l) components

## Action Items:
1. Replace ml-/mr- with ms-/me-
2. Replace pl-/pr- with ps-/pe-
3. Add dir="rtl" to Hebrew content containers
4. Test icon rotation with rtl: utilities
EOF

echo "📊 Report saved to rtl-compliance-report.md"
```

### /fix-rtl-class [file]
**Purpose**: Automatically fix common RTL class issues in a specific file
**Implementation**:
```bash
file="$1"
if [ -z "$file" ]; then
  echo "Usage: /fix-rtl-class [file-path]"
  exit 1
fi

echo "🔧 Fixing RTL classes in $file..."

# Create backup
cp "$file" "$file.bak"

# Replace deprecated margin classes
sed -i 's/ml-/ms-/g' "$file"
sed -i 's/mr-/me-/g' "$file"

# Replace deprecated padding classes  
sed -i 's/pl-/ps-/g' "$file"
sed -i 's/pr-/pe-/g' "$file"

# Add common RTL utilities for icons
sed -i 's/className="\([^"]*\)"/className="\1 rtl:rotate-180"/g' "$file" # For arrow icons

echo "✅ Fixed RTL classes in $file"
echo "📁 Backup saved as $file.bak"
```

## University Integration Commands

### /add-university [name]
**Purpose**: Scaffold new university integration
**Implementation**:
```bash
university_name="$1"
university_id=$(echo "$university_name" | tr '[:upper:]' '[:lower:]' | sed 's/ /_/g')

if [ -z "$university_name" ]; then
  echo "Usage: /add-university [University Name]"
  echo "Example: /add-university \"Bar-Ilan University\""
  exit 1
fi

echo "🏫 Creating integration for $university_name..."

# 1. Create university directory structure
mkdir -p "apps/scraper/src/universities/$university_id"
mkdir -p "apps/scraper/src/universities/$university_id/scrapers"
mkdir -p "apps/scraper/src/universities/$university_id/tests"
mkdir -p "apps/scraper/src/universities/$university_id/config"

# 2. Create base configuration
cat > "apps/scraper/src/universities/$university_id/config/index.ts" << EOF
import { UniversityConfig } from '../../../types/university';

export const ${university_id}Config: UniversityConfig = {
  id: '$university_id',
  name: '$university_name',
  nameHe: '$university_name', // Add Hebrew name
  domain: '${university_id}.ac.il',
  moodleUrl: 'https://moodle.${university_id}.ac.il',
  apiEndpoint: 'https://moodle.${university_id}.ac.il/login/index.php',
  logo: '/universities/${university_id}-logo.png',
  supportedFeatures: {
    courses: true,
    assignments: true,
    grades: true,
    announcements: true,
    calendar: true,
    messaging: false
  },
  loginSelector: '#username',
  passwordSelector: '#password',
  loginButtonSelector: '#loginbtn',
  waitAfterLogin: 2000,
  maxRetries: 3
};
EOF

# 3. Create scraper implementation
cat > "apps/scraper/src/universities/$university_id/scrapers/courses.ts" << EOF
import { Page } from 'playwright';
import { CourseData } from '../../../types/course';
import { ${university_id}Config } from '../config';

export class ${university_name}CourseScraper {
  constructor(private page: Page) {}

  async scrapeCourses(): Promise<CourseData[]> {
    try {
      // Navigate to courses page
      await this.page.goto(\`\${${university_id}Config.moodleUrl}/my/\`);
      
      // Wait for courses to load
      await this.page.waitForSelector('.course-info-container', { timeout: 10000 });
      
      // Extract course data
      const courses = await this.page.evaluate(() => {
        const courseElements = document.querySelectorAll('.course-info-container');
        return Array.from(courseElements).map(element => {
          const nameElement = element.querySelector('.coursename a');
          const codeElement = element.querySelector('.course-code');
          
          return {
            id: nameElement?.getAttribute('href')?.split('id=')[1] || '',
            name: nameElement?.textContent?.trim() || '',
            code: codeElement?.textContent?.trim() || '',
            url: nameElement?.getAttribute('href') || '',
            semester: '2024A', // Extract from page if available
            isActive: true
          };
        });
      });
      
      console.log(\`Found \${courses.length} courses for $university_name\`);
      return courses;
    } catch (error) {
      console.error('Error scraping courses:', error);
      return [];
    }
  }
}
EOF

# 4. Create test file
cat > "apps/scraper/src/universities/$university_id/tests/courses.test.ts" << EOF
import { test, expect } from '@playwright/test';
import { ${university_name}CourseScraper } from '../scrapers/courses';
import { ${university_id}Config } from '../config';

test.describe('$university_name Course Scraper', () => {
  test('should extract course list', async ({ page }) => {
    const scraper = new ${university_name}CourseScraper(page);
    
    // Mock login (replace with actual login in integration tests)
    await page.goto(${university_id}Config.moodleUrl);
    
    const courses = await scraper.scrapeCourses();
    
    expect(courses).toBeInstanceOf(Array);
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0]).toHaveProperty('name');
    expect(courses[0]).toHaveProperty('code');
  });
});
EOF

# 5. Add to main university registry
echo "
// $university_name
export { ${university_id}Config } from './$university_id/config';
export { ${university_name}CourseScraper } from './$university_id/scrapers/courses';" >> apps/scraper/src/universities/index.ts

# 6. Add environment variables
echo "
# $university_name Configuration
$(echo $university_id | tr '[:lower:]' '[:upper:]')_MOODLE_URL=\"https://moodle.$university_id.ac.il\"
$(echo $university_id | tr '[:lower:]' '[:upper:]')_USERNAME=\"\"
$(echo $university_id | tr '[:lower:]' '[:upper:]')_PASSWORD=\"\"" >> .env.example

echo "✅ Created university integration for $university_name"
echo "📁 Files created in apps/scraper/src/universities/$university_id/"
echo "🔧 Next steps:"
echo "  1. Update Hebrew name in config file"
echo "  2. Test login selectors against actual Moodle site"
echo "  3. Implement specific course/assignment scrapers"
echo "  4. Add environment variables to .env.development"
```

## Authentication Commands

### /test-auth
**Purpose**: Run comprehensive authentication tests
**Implementation**:
```bash
echo "🔐 Running comprehensive auth tests..."

# 1. Test Google OAuth flow
echo "Testing Google OAuth..."
cd apps/web
npm test -- auth/google-oauth.test.ts --verbose

# 2. Test university SSO flows
echo "Testing university authentications..."
for university in bgu; do
  echo "  Testing $university..."
  npm test -- auth/university-auth.test.ts --verbose --testNamePattern="$university"
done

# 3. Test session management
echo "Testing session management..."
npm test -- auth/session.test.ts --verbose

# 4. Test API route authentication
echo "Testing API authentication..."
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/user/courses -H "Authorization: Bearer invalid"
curl -s http://localhost:3000/api/user/courses -H "Authorization: Bearer valid-test-token"

# 5. Test auth middleware
echo "Testing auth middleware..."
npm test -- middleware/auth.test.ts --verbose

# 6. Generate auth test report
cat > auth-test-report.md << 'EOF'
# Authentication Test Report - $(date)

## Test Results:
- Google OAuth: $(npm test -- auth/google-oauth.test.ts 2>&1 | grep -c "PASS" || echo "FAIL")
- University SSO: $(for u in bgu; do npm test -- auth/university-auth.test.ts --testNamePattern="$u" 2>&1 | grep -c "PASS"; done | paste -sd+ | bc)
- Session Management: $(npm test -- auth/session.test.ts 2>&1 | grep -c "PASS" || echo "FAIL")
- API Routes: $(curl -s http://localhost:3000/api/health | jq -r '.status' || echo "FAIL")

## Security Checklist:
- [ ] CSRF protection enabled
- [ ] Secure session cookies
- [ ] JWT tokens properly signed  
- [ ] Rate limiting on auth endpoints
- [ ] Proper error handling (no credential leaks)
EOF

echo "📊 Report saved to auth-test-report.md"
```

### /reset-auth
**Purpose**: Reset authentication state and clear sessions
**Implementation**:
```bash
echo "🔄 Resetting authentication state..."

# 1. Clear Next.js cache
cd apps/web
rm -rf .next/cache

# 2. Clear browser session data (if using playwright)
npx playwright-core install
rm -rf test-results/
rm -rf playwright-report/

# 3. Reset test database auth tables
cd ../../
npm run db:reset -- --table=users,sessions,accounts,verification_tokens

# 4. Restart development servers
pkill -f "next dev"
pkill -f "turbo dev"
sleep 2
npm run dev &

echo "✅ Authentication state reset complete"
```

## Moodle Integration Commands

### /sync-moodle [university]
**Purpose**: Test Moodle scraping for specific university
**Implementation**:
```bash
university="$1"
if [ -z "$university" ]; then
  echo "Usage: /sync-moodle [university]"
  echo "Available: bgu (other universities coming soon)"
  exit 1
fi

echo "🔄 Testing Moodle sync for $university..."

# 1. Check environment variables
case $university in
  "bgu")
    url_var="BGU_MOODLE_URL"
    user_var="BGU_MOODLE_USERNAME"
    pass_var="BGU_MOODLE_PASSWORD"
    ;;
  "technion")
    url_var="TECHNION_MOODLE_URL"
    user_var="TECHNION_USERNAME"  
    pass_var="TECHNION_PASSWORD"
    ;;
  "huji")
    url_var="HUJI_MOODLE_URL"
    user_var="HUJI_USERNAME"
    pass_var="HUJI_PASSWORD"
    ;;
  "tau")
    url_var="TAU_MOODLE_URL"
    user_var="TAU_USERNAME"
    pass_var="TAU_PASSWORD"
    ;;
  *)
    echo "❌ Unknown university: $university"
    exit 1
    ;;
esac

# 2. Validate environment setup
if [ -z "${!url_var}" ]; then
  echo "❌ Missing $url_var in environment"
  exit 1
fi

# 3. Test Moodle connectivity
echo "🌐 Testing connectivity to ${!url_var}..."
if ! curl -s --head "${!url_var}" | head -n 1 | grep -q "200 OK"; then
  echo "❌ Cannot connect to Moodle server"
  exit 1
fi

# 4. Run scraper test
cd apps/scraper
python3 -c "
import sys
sys.path.append('src')
from universities.$university.scrapers.courses import ${university}CourseScraper
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    scraper = ${university}CourseScraper(page)
    
    # Test login
    print('Testing login...')
    success = scraper.test_login('${!user_var}', '${!pass_var}')
    if success:
        print('✅ Login successful')
        
        # Test course scraping
        print('Testing course scraping...')
        courses = scraper.scrape_courses()
        print(f'✅ Found {len(courses)} courses')
        
        for course in courses[:3]:  # Show first 3 courses
            print(f'  - {course[\"name\"]} ({course[\"code\"]})')
    else:
        print('❌ Login failed')
    
    browser.close()
"

# 5. Test data synchronization to database
echo "💾 Testing database synchronization..."
cd ../web
curl -X POST http://localhost:3000/api/sync-moodle-data \
  -H "Content-Type: application/json" \
  -d "{\"university\": \"$university\", \"test_mode\": true}"

echo "✅ Moodle sync test completed for $university"
```

### /debug-scraper [university] [--headful]
**Purpose**: Debug university scraper with visual browser
**Implementation**:
```bash
university="$1"
headful="$2"

if [ -z "$university" ]; then
  echo "Usage: /debug-scraper [university] [--headful]"
  exit 1
fi

echo "🐛 Debugging $university scraper..."

cd apps/scraper

# Set browser mode
if [ "$headful" = "--headful" ]; then
  export HEADLESS=false
  echo "🖥️  Running in headful mode"
else
  export HEADLESS=true
  echo "👻 Running in headless mode"
fi

# Run debugger
python3 -c "
import sys
sys.path.append('src')
from universities.$university.debug import DebugScraper
import asyncio

async def main():
    debugger = DebugScraper()
    await debugger.run_debug_session()

asyncio.run(main())
"

echo "🔍 Debug session completed"
```

## Development Workflow Commands

### /dev-start
**Purpose**: Start full development environment
**Implementation**:
```bash
echo "🚀 Starting Spike development environment..."

# 1. Start database (if using local Supabase)
# supabase start

# 2. Start all services
npm run dev &

# 3. Start scraper services
cd apps/scraper
python3 -m uvicorn main:app --reload --port 8001 &

# 4. Wait for services to be ready
sleep 5

# 5. Check health
echo "🏥 Health check:"
curl -s http://localhost:3000/api/health | jq .
curl -s http://localhost:8001/health | jq .

echo "✅ Development environment ready!"
echo "🌐 Web app: http://localhost:3000"
echo "🐍 Scraper API: http://localhost:8001"
```

### /build-check
**Purpose**: Run full build and type checking
**Implementation**:
```bash
echo "🔨 Running full build check..."

# 1. Clean previous builds
npm run clean

# 2. Install dependencies
npm install

# 3. Generate types
npm run db:generate

# 4. Run type checking
npm run type-check

# 5. Run linting
npm run lint

# 6. Run tests
npm run test:unit

# 7. Build all packages
npm run build

# 8. Check bundle sizes
cd apps/web
npx next build --debug
npx next build | grep "Built at"

echo "✅ Build check completed successfully!"
```

## Quick Reference

### Environment Variables Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `AUTH_SECRET` - NextAuth secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `[UNIVERSITY]_MOODLE_URL` - University Moodle URLs
- `[UNIVERSITY]_USERNAME` - Test university credentials
- `[UNIVERSITY]_PASSWORD` - Test university credentials

### Key Directories:
- `apps/web/` - Next.js application
- `apps/scraper/` - Python Playwright scraper
- `packages/database/` - Supabase utilities and types
- `packages/shared/` - Shared TypeScript types
- `packages/ui/` - Reusable UI components
- `supabase/` - Database migrations and config

### RTL Classes Reference:
- Use `ms-*` instead of `ml-*` (margin start)
- Use `me-*` instead of `mr-*` (margin end)  
- Use `ps-*` instead of `pl-*` (padding start)
- Use `pe-*` instead of `pr-*` (padding end)
- Add `rtl:rotate-180` for directional icons
- Use `dir="rtl"` on Hebrew content containers