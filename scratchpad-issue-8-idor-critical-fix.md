# Issue #8: Critical IDOR Security Fix - Insecure Direct Object References

**GitHub Issue**: https://github.com/ortaizi/spike1-1/issues/8 **Severity**: 🔴
CRITICAL **OWASP**: A01:2021 - Broken Access Control

## Problem Analysis

### Vulnerability Details

- **File**: `/apps/web/app/api/users/[id]/route.ts`
- **Issue**: GET endpoint allows unauthorized access to any user's data
- **Risk**: Complete user data exposure, privacy violations, potential data
  breach

### Current State Analysis

```typescript
// VULNERABLE: GET endpoint (lines 7-34)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // NO AUTHENTICATION CHECK ❌
  // NO AUTHORIZATION CHECK ❌
  // Direct database query with user-provided ID ❌
  const { data, error } = await supabase
    .from('users')
    .select('*') // Exposes ALL user data ❌
    .eq('id', params.id)
    .single();

  return NextResponse.json(data); // Returns sensitive data ❌
}

// SECURE: PUT endpoint (lines 36-99) ✅
// SECURE: DELETE endpoint (lines 101-157) ✅
```

### Authorization Pattern in Codebase

```typescript
// Standard auth pattern used in PUT/DELETE:
const session = await getServerSession(unifiedAuthOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Ownership verification:
if (session.user.id !== params.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Security Requirements

### 1. Authentication

- ✅ Verify user is logged in via NextAuth session
- ✅ Return 401 for unauthenticated requests

### 2. Authorization (IDOR Prevention)

- ✅ Users can only access their own data
- ✅ Return 403 for unauthorized access attempts
- ✅ Log security violations for monitoring

### 3. Data Minimization

- ✅ Only return necessary user data fields
- ✅ Exclude sensitive fields (encrypted passwords, etc.)

### 4. Security Logging

- ✅ Log unauthorized access attempts
- ✅ Include user IP, attempted resource, timestamp

## Implementation Plan

### Step 1: Fix GET Endpoint Authorization

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(unifiedAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization check (IDOR prevention)
    if (session.user.id !== params.id) {
      // Log security violation
      console.warn(
        `SECURITY: User ${session.user.id} attempted unauthorized access to user ${params.id}`
      );
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own profile' },
        { status: 403 }
      );
    }

    // 3. Secure data query with field selection
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, email, name, avatar_url, university_id, is_setup_complete, created_at, updated_at'
      )
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 2: Add Comprehensive Tests

#### 2.1 Authentication Tests

- Test unauthenticated access returns 401
- Test malformed session returns 401

#### 2.2 Authorization Tests (IDOR Prevention)

- Test user accessing own data succeeds
- Test user accessing other user's data returns 403
- Test admin privileges (if implemented)

#### 2.3 Data Validation Tests

- Test only safe fields are returned
- Test sensitive fields are excluded
- Test proper error handling

### Step 3: Security Audit

- Review all similar endpoints in `/apps/web/app/api/`
- Check for consistent authorization patterns
- Verify no other IDOR vulnerabilities exist

## Test Implementation

### Test File: `tests/auth/idor-prevention.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET } from '../../apps/web/app/api/users/[id]/route';

describe('IDOR Prevention - GET /api/users/[id]', () => {
  it('should return 401 for unauthenticated requests', async () => {
    // Test implementation
  });

  it("should return 403 when user tries to access another user's data", async () => {
    // Test implementation
  });

  it('should return user data when accessing own profile', async () => {
    // Test implementation
  });

  it('should exclude sensitive fields from response', async () => {
    // Test implementation
  });
});
```

## Related Issues & PRs

Found multiple similar IDOR fixes in the repository:

- PR #52: Book Record Access URLs
- PR #30: Generic API View
- PR #48: User and Reading List Endpoints
- PR #61: User Profile Access via URL Parameter
- PR #24: User Data Access via IDOR

This indicates a **systematic IDOR problem** requiring comprehensive audit.

## Security Impact Assessment

### Before Fix

- **Risk Level**: Critical 🔴
- **Attack Vector**: Direct URL manipulation
- **Data Exposure**: Complete user profiles
- **Affected Users**: All users in database

### After Fix

- **Risk Level**: Mitigated ✅
- **Protection**: Session-based authorization
- **Data Exposure**: Own data only
- **Monitoring**: Security violation logging

## Validation Checklist

- [ ] GET endpoint requires authentication
- [ ] Users can only access own data
- [ ] Proper error messages (no info leakage)
- [ ] Security violations are logged
- [ ] Tests cover all scenarios
- [ ] No regressions in existing functionality
- [ ] Code follows existing patterns
- [ ] Documentation updated if needed

## Implementation Timeline

1. **Immediate**: Fix critical GET endpoint vulnerability
2. **Short-term**: Add comprehensive tests
3. **Medium-term**: Audit all API endpoints for similar issues
4. **Long-term**: Implement automated IDOR scanning in CI/CD

---

**Next Steps**:

1. Create feature branch
2. Implement fix with proper authorization
3. Add comprehensive tests
4. Run security validation
5. Submit PR for review
