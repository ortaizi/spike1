# Scratchpad: Issue #6 - CSRF Protection Implementation

**GitHub Issue**: https://github.com/ortaizi/spike1-1/issues/6 **Severity**:
Critical 🔴 **Priority**: IMMEDIATE - Week 1 **OWASP**: A01:2021 - Broken Access
Control

## Problem Analysis

### Current State

- **No CSRF protection** on any state-changing API endpoints
- NextAuth is configured but not leveraging built-in CSRF protection
- All POST/PUT/DELETE/PATCH routes rely only on session validation
- Critical vulnerable endpoints identified:
  - `POST /api/auth/credentials/save` - saves university login credentials
  - `POST /api/user/onboarding` - updates user setup status
  - `PATCH /api/user/onboarding` - updates university credentials status
  - `PUT /api/users/[id]` - modifies user data
  - `DELETE /api/users/[id]` - deletes user data

### Security Risks

1. **Cross-Site Request Forgery attacks** against authenticated users
2. **Unauthorized credential updates** via malicious websites
3. **Account takeover potential** through unauthorized data modification
4. **Data manipulation without user consent**

## Implementation Plan

### Phase 1: NextAuth CSRF Integration

1. **Enable NextAuth CSRF tokens** in configuration
2. **Create CSRF validation middleware** for API routes
3. **Add CSRF token injection** to forms and API calls

### Phase 2: Cookie Security Hardening

1. **Add SameSite=Strict** to all authentication cookies
2. **Implement proper origin validation** for state-changing requests
3. **Add Secure flag** for HTTPS-only cookies in production

### Phase 3: Origin and Referer Validation

1. **Validate request origins** against allowed domains
2. **Check Referer headers** for additional protection
3. **Implement custom X-Requested-With** header validation

### Phase 4: Testing and Validation

1. **Create CSRF attack tests** using Playwright
2. **Test legitimate request flows** still work
3. **Verify protection across all vulnerable endpoints**

## Technical Approach

### NextAuth CSRF Configuration

```typescript
// In unified-auth.ts
export const unifiedAuthOptions: AuthOptions = {
  // ... existing config
  cookies: {
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
```

### CSRF Validation Middleware

```typescript
// middleware/csrf.ts
export async function validateCSRF(request: NextRequest) {
  const token = request.headers.get('x-csrf-token');
  const session = await getServerSession();

  if (!token || !verifyCSRFToken(token, session)) {
    throw new Error('Invalid CSRF token');
  }
}
```

### Client-Side Integration

- Add CSRF tokens to all forms
- Include tokens in fetch requests
- Handle token refresh on session renewal

## Files to Modify

### Backend

- `apps/web/lib/auth/unified-auth.ts` - Enable CSRF in NextAuth config
- `apps/web/lib/middleware/csrf.ts` - Create CSRF validation middleware
- `apps/web/middleware.ts` - Add CSRF validation to routes
- All API route files - Add CSRF validation calls

### Frontend

- Form components - Add CSRF token fields
- API utility functions - Include CSRF tokens in requests
- Auth context - Handle CSRF token management

## Testing Strategy

### Playwright Tests

1. **Attack simulation**: Attempt CSRF attacks from external origin
2. **Legitimate usage**: Verify normal user flows work
3. **Token validation**: Test token expiry and renewal
4. **Cross-origin**: Test requests from different origins fail

### Manual Testing

1. Use browser dev tools to attempt CSRF attacks
2. Test with curl from different origins
3. Verify error messages don't leak sensitive info

## Success Criteria

- [ ] All POST/PUT/DELETE/PATCH endpoints validate CSRF tokens
- [ ] Legitimate requests with valid tokens succeed
- [ ] Malicious cross-origin requests are blocked
- [ ] SameSite cookies prevent cookie-based attacks
- [ ] Origin validation blocks unauthorized domains
- [ ] Tests pass for both attack scenarios and normal usage
- [ ] No breaking changes to existing functionality

## Rollback Plan

If issues arise:

1. Feature flag to disable CSRF temporarily
2. Revert commits in order
3. Monitor error logs for validation issues
4. Gradual re-enablement by endpoint

## Notes

- This is a **critical security fix** - must not break existing functionality
- **Hebrew RTL interface** - ensure error messages are localized
- **University integration** - CSRF must not interfere with Moodle auth flows
- **Mobile responsiveness** - tokens must work across all viewports
