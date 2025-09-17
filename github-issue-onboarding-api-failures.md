# 🎓 Fix Onboarding API Logic Test Failures (39 failures)

## Priority: **HIGH** 📚
**Impact:** 39 failing tests (22% of all test failures)
**Category:** User Onboarding & API Integration
**Test File:** `tests/unit/onboarding-api-logic.test.ts`

---

## 🎯 Problem Summary

The onboarding API logic tests are failing due to **Next.js server module import resolution issues** and **authentication flow problems**. This is blocking the critical user onboarding flow testing for the Hebrew academic platform.

## 🔍 Root Cause Analysis

**Primary Issue: Same Next.js Import Resolution Problem**
```
Cannot find module '/Users/ortaizi/Desktop/spike1-1/node_modules/next/server'
imported from /Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts
Did you mean to import "next/server.js"?
```

**Secondary Issues:**
- Authentication session mocking problems
- Hebrew academic user flow validation failures
- BGU university-specific logic testing broken
- Database integration mock inconsistencies

**Affected Test Categories:**
- 📋 GET /api/user/onboarding - Status Check (authorization, email validation)
- ✅ POST /api/user/onboarding - Complete Onboarding (Hebrew data processing)
- 🎓 Hebrew Academic User Flows (BGU integration, Hebrew names)
- 🔐 Authentication Integration (session validation, unauthorized access)

## 🧩 Technical Details

### **Import Resolution Chain Problem**
The onboarding API tests fail because they import modules that depend on CSRF protection, which in turn imports `next/server`:

```typescript
// Chain of imports causing failure
onboarding-api-logic.test.ts
  → apps/web/app/api/user/onboarding/route.ts
    → apps/web/lib/security/csrf-protection.ts
      → next/server (FAILS in test environment)
```

### **Critical User Flow Testing (Broken)**
1. **New BGU Student Onboarding**
   ```typescript
   // Expected test scenario - currently broken
   should create new user for first-time BGU student
   - Email: 'new.student@post.bgu.ac.il'
   - Hebrew name: 'תלמיד חדש'
   - University: 'BGU'
   - Academic data: semester, year, faculty
   ```

2. **Authentication State Validation**
   ```typescript
   // Expected test scenarios - currently broken
   - should return unauthorized for missing session
   - should return unauthorized for session without email
   - should handle unsupported university email
   ```

3. **Hebrew Academic Data Processing**
   ```typescript
   // Expected test scenarios - currently broken
   - Hebrew name validation and storage
   - BGU faculty/department selection
   - Academic year and semester handling
   - Hebrew error message localization
   ```

## 🔧 Proposed Solution Strategy

### **Phase 1: Fix Import Resolution (Same as Middleware Issue)**
1. **Update Next.js Module Mocking**
   - This requires the same fix as the middleware authentication tests
   - The import resolution problem is blocking multiple test suites

2. **CSRF Protection Module Isolation**
   ```typescript
   // Mock the CSRF protection to avoid Next.js dependency
   vi.mock('apps/web/lib/security/csrf-protection', () => ({
     csrfProtection: vi.fn().mockResolvedValue(null),
     rateLimit: vi.fn(() => vi.fn().mockResolvedValue(null)),
   }));
   ```

### **Phase 2: Onboarding API Mock Infrastructure**
1. **Session and Authentication Mocking**
   ```typescript
   const mockOnboardingScenarios = {
     newBGUStudent: {
       session: {
         user: {
           email: 'new.student@post.bgu.ac.il',
           name: 'תלמיד חדש',
         },
       },
       expectation: 'create new user',
     },
     existingUser: {
       session: {
         user: {
           email: 'existing@post.bgu.ac.il',
           name: 'תלמיד קיים',
         },
       },
       expectation: 'return existing status',
     },
   };
   ```

2. **Database Integration Mocking**
   ```typescript
   const mockUserDatabase = {
     findUser: vi.fn(),
     createUser: vi.fn(),
     updateOnboardingStatus: vi.fn(),
     validateUniversityEmail: vi.fn(),
   };
   ```

### **Phase 3: Hebrew Academic Data Testing**
1. **BGU-Specific Logic Testing**
   ```typescript
   const bguTestData = {
     validEmails: [
       'student@post.bgu.ac.il',
       'faculty@bgu.ac.il',
       'researcher@bgu.ac.il',
     ],
     invalidEmails: [
       'student@tau.ac.il', // Tel Aviv University
       'user@gmail.com',    // Not academic
     ],
     hebrewNames: [
       'דני כהן',
       'רחל לוי',
       'יוסי ישראלי',
     ],
   };
   ```

2. **Academic Year and Semester Validation**
   ```typescript
   const academicTestData = {
     validSemesters: ['א', 'ב', 'קיץ'],
     validYears: [2023, 2024, 2025],
     faculties: [
       'מדעי הטבע ומתמטיקה',
       'מדעי ההנדסה',
       'מדעי הרוח והחברה',
     ],
   };
   ```

## 📋 Implementation Checklist

### **Core Infrastructure Fixes**
- [ ] Fix Next.js import resolution (shared with middleware issue)
- [ ] Mock CSRF protection module properly
- [ ] Set up authentication session mocking
- [ ] Create database integration mocks

### **Test Category Fixes**
- [ ] **GET /api/user/onboarding Tests** (15+ tests)
  - Unauthorized access handling
  - Missing session validation
  - Email validation for BGU domain
  - New user detection and creation
  - Existing user status retrieval

- [ ] **POST /api/user/onboarding Tests** (12+ tests)
  - Complete onboarding flow
  - Hebrew name processing
  - Academic data validation
  - University-specific logic
  - Error handling with Hebrew messages

- [ ] **Hebrew Academic User Flow Tests** (8+ tests)
  - BGU email domain validation
  - Hebrew name storage and retrieval
  - Academic calendar integration
  - Faculty/department selection
  - Semester and year validation

- [ ] **Authentication Integration Tests** (4+ tests)
  - Session state validation
  - Unauthorized access prevention
  - Token validation
  - Error response formatting

### **BGU-Specific Validation**
- [ ] Email domain validation (`@post.bgu.ac.il`, `@bgu.ac.il`)
- [ ] Hebrew name processing and validation
- [ ] Academic calendar and semester logic
- [ ] Faculty and department data structure
- [ ] Error message localization in Hebrew

## 🎯 Success Metrics

**Target:** 39/39 tests passing (100% onboarding test success)
**Current:** 0/39 tests passing (0% success rate)
**Expected Impact:** +22% overall test success rate

## 🔗 Dependencies & Relationships

**Blocking Dependencies:**
- Next.js import resolution fix (shared with middleware tests)
- CSRF protection module mocking
- Authentication infrastructure mocking

**Integration Points:**
- User authentication system
- Database user management
- Hebrew/RTL content processing
- BGU academic data integration

**Related Test Suites:**
- Middleware authentication tests (shared import issue)
- Hebrew content validation tests
- Database integration tests

## ⚡ Priority Actions

1. **Fix Next.js import resolution** (blocking all tests - shared fix)
2. **Create onboarding-specific mock infrastructure**
3. **Set up Hebrew academic data test scenarios**
4. **Validate BGU university integration logic**

## 🎓 Academic Platform Features Tested

**Critical User Onboarding Scenarios:**
- ✅ New BGU student registration
- ✅ Existing user status checking
- ✅ Hebrew name processing
- ✅ Academic data validation
- ✅ University email verification
- ✅ Semester and year handling
- ✅ Faculty/department assignment

## 📝 Hebrew/RTL Considerations

**Hebrew Text Processing:**
- Hebrew name validation and storage
- Academic term translation (סמסטר א', ב', קיץ)
- Faculty names in Hebrew
- Error messages in Hebrew
- RTL layout data handling

This fix is **critical for user onboarding flow validation** and represents significant coverage of the Hebrew academic platform's core functionality.