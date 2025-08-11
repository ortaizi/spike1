# 🧪 Hebrew/RTL Testing Infrastructure

**Comprehensive testing setup for Spike Academic Management Platform**

This document outlines the complete testing infrastructure specifically designed for Hebrew/RTL academic platform testing, following the requirements from CLAUDE.md.

## 📋 Overview

The Spike testing infrastructure includes:
- ✅ Hebrew/RTL Git hooks and validation
- ✅ Practical slash commands for daily development  
- ✅ Comprehensive Hebrew test data fixtures
- ✅ RTL component testing utilities
- ✅ Supabase testing with Hebrew content
- ✅ Hebrew accessibility testing
- ✅ Visual regression testing for RTL layout
- ✅ E2E testing with Hebrew academic workflows

## 🏗️ Infrastructure Components

### 1. 🔗 Git Hooks & Validation

#### Enhanced Pre-commit Hook (`.husky/pre-commit`)
- **Hebrew text encoding validation** - Ensures UTF-8 encoding for all Hebrew files
- **RTL compliance checks** - Blocks forbidden directional CSS properties
- **Tailwind RTL validation** - Prevents `ml-`, `mr-`, `pl-`, `pr-` classes
- **Hebrew component validation** - Warns about missing `dir="rtl"` attributes
- **Hebrew test data validation** - Ensures proper test strings

#### Enhanced Pre-push Hook (`.husky/pre-push`)
- **Hebrew component tests** - Runs `pnpm test:hebrew` if available
- **RTL lint checks** - Runs `pnpm lint:rtl` validation
- **All existing validations** - TypeScript, ESLint, formatting, build tests

### 2. ⚡ NPM Scripts for Hebrew Development

```json
{
  "test:hebrew": "vitest run --grep='Hebrew|RTL|עברית' --reporter=verbose",
  "lint:rtl": "eslint with RTL-specific rules",
  "visual:rtl": "playwright test --project='Hebrew RTL Desktop'",
  "a11y:hebrew": "playwright test Hebrew accessibility"
}
```

### 3. 🎯 Claude Code Integration

#### Slash Commands (`.claude/slash-commands.json`)
12 practical commands for daily Hebrew development:
- `/dev-hebrew` - Start development with Hebrew RTL focus
- `/test-rtl` - Run comprehensive Hebrew/RTL testing
- `/fix-rtl` - Auto-fix common RTL issues
- `/db-sync` - Sync database types (mandatory after schema changes)
- `/hebrew-check` - Validate Hebrew/RTL compliance
- `/screenshot-rtl` - Take RTL screenshots for verification
- And more...

#### Development Hooks (`.claude/hooks.json`)
7 intelligent hooks for:
- **Hebrew/RTL validation** before file edits
- **Database sync reminders** after schema changes  
- **Component testing reminders** for new components
- **RTL CSS blocking** to prevent directional properties
- **Academic context validation** for course/assignment files

### 4. 🧪 Testing Utilities

#### Hebrew Test Data (`tests/fixtures/hebrew-data.ts`)
Comprehensive Hebrew academic data including:
- **Courses** - Computer Science, Math, Physics courses in Hebrew
- **Assignments** - Hebrew homework and projects with due dates
- **Exams** - Hebrew exam information with academic calendar
- **Users** - Hebrew student and instructor profiles
- **University Data** - BGU-specific Hebrew content
- **Text Patterns** - Common Hebrew academic terms for testing

#### RTL Testing Utilities (`tests/utils/rtl-testing.ts`)
- **RTL Render Wrapper** - Custom render function with RTL context
- **RTL Matchers** - Custom Jest/Vitest matchers for RTL validation
- **RTL Interactions** - Keyboard navigation and Hebrew text input
- **Layout Validators** - Form, navigation, and card RTL validation
- **Visual RTL Tester** - Screenshot and visual regression testing

#### Supabase Testing (`tests/utils/supabase-testing.ts`)
- **Mock Supabase Client** - Complete mock with Hebrew data support
- **Database Test Utils** - Hebrew text storage and retrieval testing
- **Real-time Testing** - Hebrew content real-time subscription testing
- **Performance Tests** - Hebrew query performance validation

#### Hebrew Accessibility (`tests/utils/hebrew-a11y.ts`)
- **Hebrew A11y Checker** - ARIA labels, screen reader, form validation
- **Screen Reader Simulator** - Hebrew content announcement simulation
- **Keyboard Navigation** - RTL keyboard navigation testing
- **Color Contrast** - Hebrew text contrast validation
- **Comprehensive Test Suite** - Full accessibility testing with Hebrew focus

### 5. 🎭 E2E Testing

#### Global Setup (`tests/e2e/global-setup.ts`)
- Hebrew locale and RTL environment setup
- Hebrew fonts and typography configuration
- Academic context and test data seeding
- Browser configuration for Hebrew testing

#### Hebrew E2E Tests (`tests/e2e/hebrew-course-management.spec.ts`)
Comprehensive E2E test suite covering:
- **Course Display** - Hebrew course names and RTL layout
- **Assignment Management** - Hebrew assignments and due dates
- **Grades and Analytics** - Hebrew grade information and tables
- **Academic Calendar** - Hebrew semester names and dates
- **Accessibility** - Screen reader and keyboard navigation
- **Mobile RTL** - Mobile Hebrew interface testing
- **Dark Mode** - Hebrew content in dark theme

### 6. 🔧 Component Testing

#### Example: CourseCard Hebrew Test (`tests/components/CourseCard.hebrew.test.tsx`)
Demonstrates comprehensive component testing with:
- **Hebrew Content Rendering** - Proper Hebrew text display
- **RTL Layout** - Direction attributes and logical properties
- **Component Interactions** - Hebrew UI interactions
- **Accessibility** - Hebrew ARIA labels and screen reader support
- **Responsive Design** - Mobile Hebrew interface
- **Theme Support** - Dark mode Hebrew readability
- **Real-time Updates** - Hebrew content updates
- **Integration Testing** - Hebrew component integration

### 7. 📊 Configuration

#### Enhanced Vitest Config (`vitest.config.ts`)
- Hebrew locale environment variables
- Academic year context
- Hebrew test pattern matching
- Coverage thresholds for academic components

#### Enhanced Playwright Config (`playwright.config.ts`)
- Hebrew RTL Desktop project
- BGU Network Simulation project  
- Accessibility Test project
- Hebrew locale and timezone settings

## 🚀 Quick Start Guide

### Daily Development Workflow

1. **Start Hebrew Development**
   ```bash
   /dev-hebrew  # or pnpm dev with Hebrew focus
   ```

2. **Create/Edit Components**
   - Hooks automatically validate Hebrew/RTL compliance
   - Warnings for missing `dir="rtl"` attributes

3. **Run Hebrew Tests**
   ```bash
   /test-rtl    # Full Hebrew/RTL testing suite
   /quick-hebrew # Quick Hebrew validation
   ```

4. **Before Commit**
   ```bash
   /validate-all # Complete validation workflow
   ```

5. **After Schema Changes**
   ```bash
   /db-sync     # Sync database types (mandatory)
   ```

### Testing New Components

1. **Create Component with Hebrew Content**
   ```typescript
   const MyComponent = ({ title }: { title: string }) => (
     <div dir="rtl" lang="he" className="p-4 text-right">
       <h2>{title}</h2>
     </div>
   );
   ```

2. **Write Hebrew Tests**
   ```typescript
   describe('MyComponent Hebrew', () => {
     it('displays Hebrew correctly', () => {
       rtlTesting.render(<MyComponent title="כותרת בעברית" />);
       expect(screen.getByText('כותרת בעברית')).toBeRTLAligned();
     });
   });
   ```

3. **Test RTL Layout**
   ```typescript
   it('has proper RTL layout', () => {
     const { container } = rtlTesting.render(<MyComponent />);
     const validator = new rtlTesting.validator.validateCardListRTL(container);
     expect(validator.isValid).toBe(true);
   });
   ```

## 📈 Testing Checklist

### ✅ Hebrew Content Requirements
- [ ] Hebrew text displays correctly
- [ ] UTF-8 encoding preserved
- [ ] Mixed Hebrew/English handled properly
- [ ] Date format: DD/MM/YYYY (Israeli format)
- [ ] Proper Hebrew academic terminology

### ✅ RTL Layout Requirements  
- [ ] `dir="rtl"` attribute present
- [ ] Logical properties used (ms-, me-, ps-, pe-)
- [ ] No directional properties (ml-, mr-, pl-, pr-)
- [ ] Text aligned right for Hebrew content
- [ ] Icons flip correctly in RTL
- [ ] Navigation flows right-to-left

### ✅ Accessibility Requirements
- [ ] `lang="he"` for Hebrew content
- [ ] ARIA labels in Hebrew
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works in RTL
- [ ] Color contrast meets WCAG standards

### ✅ Database Requirements
- [ ] Hebrew text storage/retrieval works
- [ ] Hebrew search functionality
- [ ] RTL-aware sorting
- [ ] Academic calendar queries
- [ ] Real-time updates with Hebrew content

## 🎯 Key Features

### Intelligent Validation
- **Pre-commit Hooks** automatically validate Hebrew/RTL compliance
- **Claude Code Hooks** provide real-time feedback during development
- **RTL CSS Blocking** prevents common directional property mistakes

### Comprehensive Test Coverage
- **Unit Tests** with Hebrew test data and RTL utilities
- **Integration Tests** with Supabase Hebrew content
- **E2E Tests** covering complete Hebrew academic workflows  
- **Accessibility Tests** ensuring Hebrew screen reader compatibility
- **Visual Tests** for RTL layout regression detection

### Developer Experience
- **Slash Commands** for quick Hebrew testing workflows
- **Intelligent Hooks** for automatic validation and reminders
- **Rich Test Utilities** for easy Hebrew component testing
- **Visual Feedback** through screenshots and reports

### Academic Focus
- **Hebrew Academic Data** - Realistic Israeli university content
- **BGU Integration** - Ben-Gurion University specific testing
- **Academic Calendar** - Hebrew semester and holiday support
- **Course Management** - Complete Hebrew academic workflow testing

## 📚 Resources

### Documentation Files
- `CLAUDE.md` - Main project context and requirements
- `TESTING_INFRASTRUCTURE.md` - This comprehensive testing guide
- `DEVELOPMENT_SETUP.md` - Development environment setup

### Test Files
- `tests/fixtures/hebrew-data.ts` - Hebrew academic test data
- `tests/utils/rtl-testing.ts` - RTL component testing utilities
- `tests/utils/supabase-testing.ts` - Database testing with Hebrew
- `tests/utils/hebrew-a11y.ts` - Hebrew accessibility testing
- `tests/e2e/` - E2E tests with Hebrew workflows
- `tests/components/` - Hebrew component test examples

### Configuration
- `.husky/pre-commit` - Enhanced pre-commit validation
- `.husky/pre-push` - Hebrew testing integration
- `.claude/slash-commands.json` - Development commands
- `.claude/hooks.json` - Intelligent development hooks
- `vitest.config.ts` - Enhanced testing configuration
- `playwright.config.ts` - Hebrew E2E configuration

---

**🎓 Ready for Hebrew Academic Platform Development!**

This infrastructure ensures that every component, every feature, and every interaction properly supports Hebrew content and RTL layout, meeting the strict requirements outlined in CLAUDE.md for Israeli university students.