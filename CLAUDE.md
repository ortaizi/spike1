# Spike Academic Management Platform - Claude Code Context

> **CRITICAL**: This is the primary context file for Claude Code. Always read this file first when starting any task.

## 🎯 Quick Start Commands

```bash
# Essential workflows - use these exact commands:
npm run dev                 # Start all services with Hebrew RTL
npm run db:generate        # Sync Supabase types (run after ANY schema change)
npm run test:hebrew        # Test all components with Hebrew content
npm run lint:rtl           # Check RTL compliance
```

## 🚀 Server Management Protocol

### ALWAYS Before Starting Server:
```bash
# 1. Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Start server with npm
npm run dev
```

### When User Says "הרץ שרת" or "run server":
1. **ALWAYS** kill existing processes on port 3000 first
2. **ALWAYS** use `npm run dev` (not pnpm)
3. **ALWAYS** run in background mode
4. **ALWAYS** confirm server is running on http://localhost:3000

## 🚨 Critical Requirements - NEVER IGNORE

### Hebrew/RTL is MANDATORY
- **EVERY** component must support RTL layout
- **ALWAYS** test with Hebrew strings: `"מבוא למדעי המחשב"`, `"תרגיל בית 3"`, `"מועד א'"`
- **NEVER** use `ml-`, `mr-`, `pl-`, `pr-` - use `ms-`, `me-`, `ps-`, `pe-`
- **ALWAYS** verify screenshots in RTL mode before completing any UI task

### Before ANY Database Change
1. Create migration: `npm run db:migration:create [name]`
2. Test locally: `npm run db:migration:up`
3. Generate types: `npm run db:generate`
4. Update ALL affected components
5. Test real-time subscriptions

## 🏗️ Architecture & Structure

```
spike/
├── apps/
│   ├── web/                    # Next.js 14 (App Router) - Hebrew UI
│   │   ├── app/               # App router pages (all RTL)
│   │   ├── components/        # Local components (Hebrew-first)
│   │   ├── lib/              # Utilities (date formatting for IL)
│   │   └── locales/he/       # Hebrew translations
│   ├── scraper/               # Python + Playwright
│   │   ├── src/universities/ # University-specific scrapers
│   │   ├── fixtures/         # Moodle HTML samples for testing
│   │   └── tests/           # Pytest tests with Hebrew data
│   └── api/                   # Express.js API
├── packages/
│   ├── database/              # Supabase (Hebrew-capable schema)
│   │   ├── migrations/       # SQL migrations
│   │   ├── types/           # Generated TypeScript types
│   │   └── queries/         # Prepared queries with RTL sorting
│   ├── shared/               # Shared types & utils
│   │   ├── types/          # TypeScript definitions
│   │   ├── utils/          # Hebrew text processing
│   │   └── __tests__/      # Testing patterns
│   └── ui/                   # Component library
│       ├── components/      # All with RTL support
│       └── hebrew/         # Hebrew-specific components
```

## 📋 Essential Workflows

### 🔴 [WORKFLOW: Adding ANY New Feature]
```bash
# ALWAYS follow this sequence:
1. explore     # "Explore existing patterns in apps/web/app/[similar-feature]"
2. think hard  # "Think hard about Hebrew UI requirements and data flow"
3. plan        # "Plan component structure with TypeScript types"
4. implement   # "Implement with Hebrew test data throughout"
5. test        # "Test with screenshots in RTL mode"
6. verify      # "Run npm run test:hebrew && npm run lint:rtl"
```

### 🟡 [WORKFLOW: Hebrew/RTL UI Component]
```typescript
// MANDATORY checklist for EVERY component:
// 1. Container has dir="rtl"
// 2. All spacing uses logical properties (ms-, me-, ps-, pe-)
// 3. Flexbox/Grid uses logical alignment (start/end not left/right)
// 4. Icons flip correctly (use transform: scaleX(-1) in RTL)
// 5. Test with mixed Hebrew/English content
// 6. Verify date format: DD/MM/YYYY (Israeli format)
// 7. Numbers remain LTR within RTL text

// Example component structure:
export function CourseCard({ course }: { course: Course }) {
  return (
    <div dir="rtl" className="rounded-lg border p-4 ms-auto">
      <h3 className="text-xl font-bold text-right">
        {course.nameHe || course.name}
      </h3>
      <p className="text-sm text-gray-600 mt-2">
        מרצה: {course.instructor}
      </p>
      <div className="flex justify-between mt-4">
        <span>{formatHebrewDate(course.date)}</span>
        <span className="font-medium">{course.grade} :ציון</span>
      </div>
    </div>
  );
}
```

### 🟢 [WORKFLOW: University Integration]
```python
# Working in apps/scraper/src/universities/

# Step 1: Create test file first (TDD)
# apps/scraper/tests/test_[university].py
def test_hebrew_course_extraction():
    """Test Hebrew course name extraction"""
    html = load_fixture('bgu/courses_page.html')
    courses = scraper.extract_courses(html)
    assert courses[0]['name_he'] == "מבוא למדעי המחשב"
    assert courses[0]['course_code'] == "202.1.1011"

# Step 2: Implement scraper
# apps/scraper/src/universities/bgu.py
class BGUScraper(BaseScraper):
    def extract_hebrew_content(self, element):
        """Extract and preserve Hebrew text"""
        # NEVER use .strip() on Hebrew text without checking
        # Always preserve RTL marks
        return element.text.strip('\u200e\u200f')  # Remove only LTR/RTL marks

# Step 3: Test with real Moodle data
python -m pytest tests/test_bgu.py -v --hebrew
```

### 🔵 [WORKFLOW: Database Changes]
```sql
-- apps/packages/database/migrations/001_add_hebrew_fields.sql

-- ALWAYS include Hebrew fields for user-facing content
ALTER TABLE courses ADD COLUMN name_he TEXT;
ALTER TABLE courses ADD COLUMN description_he TEXT;
ALTER TABLE assignments ADD COLUMN title_he TEXT;

-- Add indexes for Hebrew search
CREATE INDEX idx_courses_name_he ON courses USING gin(to_tsvector('hebrew', name_he));

-- After migration, IMMEDIATELY run:
-- npm run db:generate
-- Then update ALL TypeScript interfaces
```

### 🟣 [WORKFLOW: Debugging Production Issues]
```bash
# Emergency RTL fix protocol:
1. screenshot  # "Take screenshot of the RTL issue in production"
2. reproduce   # "Reproduce locally with Hebrew content"
3. identify    # "grep -r 'ComponentName' apps/web --include='*.tsx'"
4. fix         # "Fix using logical properties, not directional"
5. test        # "Test with Hebrew, English, and mixed content"
6. screenshot  # "Verify fix with screenshot"
7. deploy      # "Deploy with npm run deploy:production"
```

## 🛠️ Development Commands

### Daily Development
```bash
# ALWAYS kill port 3000 first, then start:
lsof -ti:3000 | xargs kill -9 2>/dev/null || true && npm run dev
npm run dev:web          # Start only web with Hebrew locale
npm run dev:scraper      # Start Python scraper with debug mode
npm run build            # Build all apps
npm run test             # Run all tests with Hebrew fixtures
```

### Database Operations
```bash
npm run db:generate      # Generate TypeScript types from Supabase
npm run db:push         # Push schema changes to Supabase
npm run db:seed         # Seed with Hebrew test data
npm run db:reset        # Reset and reseed (dev only!)
```

### Hebrew/RTL Specific
```bash
npm run test:hebrew     # Test all components with Hebrew content
npm run lint:rtl        # Lint for RTL issues
npm run visual:rtl      # Visual regression testing for RTL
npm run a11y:hebrew     # Accessibility testing in Hebrew
```

### University Scrapers
```bash
# In apps/scraper directory:
python test_login.py --university bgu      # Test BGU login
python sync_courses.py --university all    # Sync all universities
python debug_moodle.py --url [moodle_url] # Debug specific page
pytest tests/ -k hebrew                    # Run Hebrew-specific tests
```

## 🔧 Tech Stack Details

### Frontend (apps/web)
- **Framework**: Next.js 14 with App Router (NOT Pages Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with RTL utilities
- **State**: React Server Components + Zustand for client state
- **Forms**: React Hook Form with Hebrew validation
- **Auth**: NextAuth with custom Hebrew pages

### Backend (apps/api)
- **Framework**: Express.js with TypeScript
- **Validation**: Zod with Hebrew error messages
- **Queue**: Bull for scraping jobs
- **Cache**: Redis for Hebrew content caching

### Database (packages/database)
- **Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma for type safety
- **Real-time**: Supabase subscriptions
- **Search**: PostgreSQL full-text search with Hebrew support

### Scraper (apps/scraper)
- **Language**: Python 3.11+
- **Browser**: Playwright for dynamic content
- **Parser**: BeautifulSoup4 for HTML
- **Testing**: Pytest with Hebrew fixtures
- **Scheduling**: APScheduler for sync jobs

## 🌍 Environment Variables

### Required for Development
```env
# apps/web/.env.local
DATABASE_URL=postgresql://postgres:[password]@localhost:54322/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Hebrew/RTL
DEFAULT_LOCALE=he
RTL_ENABLED=true

# University Endpoints (Hebrew interfaces)
BGU_MOODLE_URL=https://moodle.bgu.ac.il
TECHNION_MOODLE_URL=https://moodle.technion.ac.il
HUJI_MOODLE_URL=https://moodle.huji.ac.il
TAU_MOODLE_URL=https://moodle.tau.ac.il
```

## 📝 Code Standards & Patterns

### TypeScript Patterns
```typescript
// ALWAYS use Hebrew-aware types
interface Course {
  id: string;
  name: string;
  nameHe: string;  // ALWAYS include Hebrew version
  instructor: string;
  instructorHe?: string;  // Optional if might not exist
  startDate: Date;  // Store as Date, format for display
}

// Hebrew-aware utility functions
export function formatHebrewDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).format(date);  // Returns: "25/04/2025"
}

// RTL-aware component props
interface ComponentProps {
  className?: string;
  dir?: 'rtl' | 'ltr';  // Allow override but default to RTL
  locale?: 'he' | 'en';
}
```

### Testing Patterns
```typescript
// packages/shared/__tests__/helpers.ts
export const hebrewTestData = {
  courseName: "מבוא למדעי המחשב",
  instructorName: "ד״ר ישראל ישראלי",
  assignmentTitle: "תרגיל בית 3",
  gradeText: "ציון: 95 (מועד א׳)",
  dateString: "25/04/2025"
};

// Always test with Hebrew
describe('CourseCard', () => {
  it('renders Hebrew content correctly', () => {
    render(<CourseCard course={hebrewCourse} />);
    expect(screen.getByText(/מבוא למדעי המחשב/)).toBeInTheDocument();
  });
  
  it('maintains RTL layout', () => {
    const { container } = render(<CourseCard />);
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
});
```

## ⚠️ Common Pitfalls & Solutions

### Hebrew Text Issues
```typescript
// ❌ WRONG - Breaks Hebrew
const title = hebrewText.trim().toLowerCase();

// ✅ CORRECT - Preserves Hebrew
const title = hebrewText.trim();  // OK to trim
// Use locale-aware operations for Hebrew
```

### RTL Layout Issues
```css
/* ❌ WRONG - Hardcoded direction */
.card {
  margin-left: 16px;
  padding-right: 8px;
}

/* ✅ CORRECT - Logical properties */
.card {
  margin-inline-start: 16px;  /* or use Tailwind: ms-4 */
  padding-inline-end: 8px;    /* or use Tailwind: pe-2 */
}
```

### Date Formatting
```typescript
// ❌ WRONG - American format
const formatted = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;

// ✅ CORRECT - Israeli format
const formatted = new Intl.DateTimeFormat('he-IL').format(date);
```

## 🚀 Quick Troubleshooting

### "Hebrew text appears as ???"
```bash
# Check database encoding
psql -d spike -c "SHOW server_encoding;"  # Should be UTF8
# Fix: ALTER DATABASE spike SET encoding = 'UTF8';
```

### "RTL layout broken"
```bash
# Quick audit
grep -r "margin-left\|margin-right\|padding-left\|padding-right" apps/web/
# Fix all to use logical properties
```

### "Supabase types out of sync"
```bash
npm run db:generate && npm run type-check
# If errors persist: npm run db:reset && npm run db:seed
```

### "University scraper failing"
```python
# Debug mode
cd apps/scraper
python -c "from src.universities.bgu import BGUScraper; BGUScraper().debug_login()"
```

## 📚 Resources & Documentation

### Internal Docs
- `/docs/hebrew-rtl-guide.md` - Complete RTL implementation guide
- `/docs/university-apis.md` - University integration details
- `/docs/database-schema.md` - Full schema documentation

### External Resources
- [Tailwind RTL Support](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [Hebrew Typography Best Practices](https://www.w3.org/International/articles/inline-bidi-markup/uba-basics)

## 🎯 Success Criteria

Before marking ANY task as complete, verify:
- [ ] Hebrew content displays correctly
- [ ] RTL layout works properly
- [ ] Mixed Hebrew/English text renders correctly
- [ ] Dates show in DD/MM/YYYY format
- [ ] All tests pass with Hebrew data
- [ ] Screenshots taken in RTL mode
- [ ] Database types are synchronized
- [ ] Real-time subscriptions work
- [ ] University integrations tested
- [ ] Performance acceptable with Hebrew content

---

**Remember**: When in doubt, always prioritize Hebrew/RTL support. This is an Israeli platform for Israeli students - Hebrew is not optional, it's mandatory.