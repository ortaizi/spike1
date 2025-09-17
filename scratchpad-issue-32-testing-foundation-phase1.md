# Phase 1 Implementation Plan: Testing Foundation Setup

**Issue**:
[#32 - Comprehensive Testing Strategy & Implementation Plan](https://github.com/ortaizi/spike1/issues/32)

## Current State Analysis

### ✅ What Exists

- **Dependencies**: Vitest, @testing-library/react, @testing-library/jest-dom
  already installed
- **Playwright**: Full E2E setup with Hebrew/RTL support
- **Security Test**: One Jest-based CSRF protection test
- **Scripts**: Test scripts defined in package.json (but configs/files missing)

### ❌ What's Missing

- **Vitest Configuration**: `vitest.config.ts` and `vitest.config.simple.ts`
  don't exist
- **Unit Tests**: Referenced test files don't exist
- **Test Utilities**: No Hebrew/RTL testing helpers
- **Mock Setup**: No MSW or Supabase mocking infrastructure
- **Coverage Reports**: No coverage configuration

## Phase 1 Implementation Plan

### Task 1: Core Vitest Configuration Setup

**Priority**: Critical **Files to Create**:

- `vitest.config.ts` - Main configuration with Hebrew support
- `vitest.config.simple.ts` - Simplified config for quick tests
- `vitest.setup.ts` - Global test setup and Hebrew locale configuration

**Key Features**:

- TypeScript support for Next.js
- RTL/Hebrew locale configuration
- Custom test environment with Supabase mocking
- Coverage reporting with Hebrew file support
- Integration with existing Playwright setup

### Task 2: Test Utilities Library

**Priority**: Critical **Files to Create**:

- `tests/utils/test-utils.tsx` - Custom render with Hebrew providers
- `tests/utils/hebrew-assertions.ts` - Hebrew text validation helpers
- `tests/utils/academic-data.ts` - Hebrew academic test data factories
- `tests/utils/auth-mocks.ts` - Authentication mocking utilities
- `tests/utils/supabase-mocks.ts` - Database mocking utilities

### Task 3: Unit Test Foundation

**Priority**: High **Files to Create**:

- `tests/unit/middleware-authentication-logic.test.ts` (referenced in
  package.json)
- `tests/unit/onboarding-api-logic.test.ts` (referenced in package.json)
- `tests/unit/hebrew-utils.test.ts` - Hebrew text processing tests
- `tests/unit/academic-calendar.test.ts` - Academic year/semester logic tests

### Task 4: Hebrew/RTL Testing Setup

**Priority**: High **Features to Implement**:

- RTL text direction validation
- Hebrew character encoding tests
- Academic terminology validation (Hebrew terms)
- Date/time formatting for Hebrew locale
- Right-to-left component layout tests

### Task 5: CI Integration

**Priority**: Medium **Files to Create**:

- `.github/workflows/test.yml` - GitHub Actions test automation
- Update existing CI to include unit tests
- Coverage reporting integration
- Hebrew test result notifications

## Implementation Steps

### Step 1: Create Branch and Basic Setup

```bash
git checkout -b feature/testing-foundation-phase1
```

### Step 2: Vitest Configuration

Create comprehensive Vitest configs that support:

- Next.js/React testing
- Hebrew locale and RTL testing
- TypeScript support
- Custom test environment
- Coverage with Hebrew files

### Step 3: Test Utilities

Build reusable testing utilities that:

- Render components with Hebrew providers
- Mock authentication with university data
- Generate realistic Hebrew academic data
- Validate Hebrew text content
- Support RTL layout testing

### Step 4: Foundation Unit Tests

Implement the missing unit tests referenced in package.json:

- Authentication middleware logic
- Onboarding API logic
- Core Hebrew utilities
- Academic calendar functions

### Step 5: Validate and Test

- Run all existing tests to ensure no regressions
- Validate Hebrew text rendering in tests
- Test coverage reporting
- Ensure CI integration works

## Success Criteria

### Coverage Targets for Phase 1

- [ ] Vitest configuration complete and working
- [ ] Test utilities library functional
- [ ] Referenced unit tests implemented and passing
- [ ] Hebrew/RTL testing infrastructure operational
- [ ] CI integration configured
- [ ] Documentation updated

### Quality Gates

- [ ] All existing Playwright tests still pass
- [ ] New unit tests achieve >80% coverage for tested files
- [ ] Hebrew text validation working correctly
- [ ] Academic data factories generate realistic test data
- [ ] No performance regression in test execution

## Technical Considerations

### Hebrew/RTL Challenges

1. **Text Encoding**: Ensure UTF-8 support in test environment
2. **RTL Layout**: Component layout validation for right-to-left text
3. **Academic Terms**: Hebrew academic vocabulary in test data
4. **Date/Time**: Israeli academic calendar and Hebrew date formatting

### Next.js/React Testing

1. **App Router**: Test setup for Next.js 14 App Router
2. **Server Components**: Mocking and testing approach
3. **Middleware**: Testing Next.js middleware with auth logic
4. **API Routes**: Integration testing approach

### Supabase Integration

1. **Database Mocking**: Test database setup and teardown
2. **Auth Integration**: NextAuth + Supabase testing
3. **Real-time Features**: WebSocket mocking for real-time updates
4. **Row-level Security**: Multi-tenant testing approach

## Dependencies and Blockers

### Dependencies

- Current Playwright setup (✅ exists)
- Supabase configuration (✅ exists)
- NextAuth setup (✅ exists)
- Hebrew font loading (✅ exists)

### Potential Blockers

- Complex Next.js 14 App Router testing setup
- Supabase testing environment configuration
- Hebrew text encoding in test environment
- Performance impact of comprehensive testing

## Next Steps After Phase 1

After completing Phase 1, we'll move to **Phase 2: Unit Testing Implementation**
which will focus on:

- Component testing with Hebrew scenarios
- Custom hooks testing
- Utility functions testing
- Service layer testing

This foundation setup is critical for all subsequent phases and will enable
comprehensive testing of the Hebrew/RTL academic platform.

---

**Timeline**: Week 1-3 of 12-week plan **Status**: Ready to implement
**Branch**: `feature/testing-foundation-phase1`
