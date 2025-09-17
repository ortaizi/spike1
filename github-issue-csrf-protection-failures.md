# 🔒 Fix CSRF Protection Test Failures (40 failures)

## Priority: **HIGH** 🚨
**Impact:** 40 failing tests (22% of all test failures)
**Category:** Security Infrastructure
**Test File:** `tests/unit/security/csrf-protection.test.ts`

---

## 🎯 Problem Summary

The CSRF (Cross-Site Request Forgery) protection tests are failing due to **mock function setup issues** and **JWT token validation problems**. This is blocking critical security validation for the academic platform.

## 🔍 Root Cause Analysis

**Primary Issue: Mock Function Setup Problems**
```
mockGetToken.mockResolvedValue is not a function
```

**Secondary Issue: Missing JWT Mock Infrastructure**
The tests expect JWT token mocking but the mock setup is incomplete or incorrectly configured.

**Affected Test Categories:**
- 🌐 Origin Validation (valid/invalid origins, referer checking)
- 🔑 CSRF Token Validation (header tokens, body tokens, form data)
- 🔐 CSRF Token Generation (length validation, uniqueness)
- 🛡️ CSRF Protection Middleware (safe methods, token enforcement)

## 🧩 Technical Details

### **Mock Infrastructure Problems**
1. **JWT Token Mock Not Properly Set Up**
   ```typescript
   // Current broken setup
   const mockGetToken = vi.fn(); // Not properly mocked
   mockGetToken.mockResolvedValue(...); // Fails because vi.fn() doesn't have mockResolvedValue
   ```

2. **Missing NextAuth JWT Integration**
   ```typescript
   // Expected import but not properly mocked
   import { getToken } from 'next-auth/jwt';
   ```

### **Test Infrastructure Issues**
1. **Origin Validation Testing**
   - Cannot test localhost origin validation
   - NEXTAUTH_URL origin checking fails
   - Referer header validation broken
   - Malformed URL handling untested

2. **CSRF Token Validation**
   - X-CSRF-Token header validation fails
   - Request body token validation broken
   - Form data token extraction fails
   - NextAuth cookie token validation broken

3. **Token Generation Testing**
   - Token length validation cannot run
   - Token uniqueness testing fails
   - Cryptographic token validation broken

## 🔧 Proposed Solution Strategy

### **Phase 1: Fix JWT Mock Infrastructure**
1. **Proper NextAuth JWT Mocking**
   ```typescript
   // In test setup
   vi.mock('next-auth/jwt', () => ({
     getToken: vi.fn(),
     encode: vi.fn(),
     decode: vi.fn(),
   }));

   // In test file
   const mockGetToken = vi.mocked(getToken);
   ```

2. **Mock Function Factory Setup**
   ```typescript
   const createJWTMocks = () => ({
     validToken: { sub: 'user-123', email: 'test@bgu.ac.il' },
     invalidToken: null,
     expiredToken: { sub: 'user-123', exp: Date.now() - 1000 },
   });
   ```

### **Phase 2: CSRF Protection System Mocking**
1. **Origin Validation Mock Setup**
   ```typescript
   const mockOriginValidation = {
     validOrigins: ['http://localhost:3000', 'https://spike.bgu.ac.il'],
     invalidOrigins: ['https://malicious.com', 'http://evil.site'],
   };
   ```

2. **CSRF Token Mock Infrastructure**
   ```typescript
   const mockCSRFTokens = {
     validToken: 'csrf-token-123456789012345678901234567890',
     shortToken: 'short',
     invalidToken: 'invalid-token',
   };
   ```

### **Phase 3: Request/Response Mock Setup**
1. **Mock Request Builders**
   ```typescript
   const createMockRequest = (options) => ({
     method: options.method || 'GET',
     headers: new Map(Object.entries(options.headers || {})),
     url: options.url || 'http://localhost:3000',
   });
   ```

2. **Response Assertion Helpers**
   ```typescript
   const expectCSRFResponse = (response, expectedStatus) => {
     expect(response.status).toBe(expectedStatus);
     if (expectedStatus >= 400) {
       expect(response.headers.get('content-type')).toBe('application/json');
     }
   };
   ```

## 📋 Implementation Checklist

### **Mock Infrastructure Fixes**
- [ ] Fix NextAuth JWT mocking (`next-auth/jwt`)
- [ ] Create proper mock function factories
- [ ] Set up JWT token validation mocks
- [ ] Configure CSRF token generation mocks

### **Test Category Fixes**
- [ ] **Origin Validation Tests** (12+ tests)
  - Valid localhost origins in development
  - NEXTAUTH_URL origin acceptance
  - Referer header validation
  - Malformed URL rejection

- [ ] **CSRF Token Validation Tests** (15+ tests)
  - X-CSRF-Token header validation
  - Request body token validation
  - Form data token extraction
  - NextAuth cookie token validation
  - Invalid token rejection

- [ ] **CSRF Token Generation Tests** (8+ tests)
  - Token length requirements
  - Token uniqueness verification
  - Cryptographic strength validation

- [ ] **CSRF Protection Middleware Tests** (5+ tests)
  - Safe method allowance (GET, HEAD)
  - POST request token enforcement
  - Error handling and responses

### **Environment-Specific Testing**
- [ ] Development vs Production behavior
- [ ] Different authentication states
- [ ] Various token validation scenarios
- [ ] Error handling edge cases

## 🎯 Success Metrics

**Target:** 40/40 tests passing (100% CSRF protection test success)
**Current:** 0/40 tests passing (0% success rate)
**Expected Impact:** +22% overall test success rate

## 🔗 Dependencies & Related Issues

**Blocking Issues:**
- NextAuth JWT module mocking
- Mock function factory setup
- Request/Response mock infrastructure

**Related Security Tests:**
- Authentication middleware tests
- API route protection tests
- Session validation tests

## ⚡ Priority Actions

1. **Fix JWT mock setup** (affects all 40 tests)
2. **Create CSRF token mock infrastructure**
3. **Set up proper request/response mocking**
4. **Validate security middleware functionality**

## 🛡️ Security Test Coverage

**Critical Security Scenarios:**
- ✅ Origin validation (prevents CSRF attacks)
- ✅ Token validation (ensures request authenticity)
- ✅ Safe method handling (GET/HEAD without tokens)
- ✅ Error handling (secure failure modes)

This fix is **essential for platform security validation** and represents the second-highest impact on overall test success rate.