# Security Documentation - Spike Platform

## Table of Contents
1. [CSRF Protection](#csrf-protection)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting](#rate-limiting)
4. [Security Headers](#security-headers)
5. [API Security](#api-security)
6. [Client-Side Security](#client-side-security)
7. [Best Practices](#best-practices)
8. [Security Checklist](#security-checklist)

---

## CSRF Protection

### Overview
Cross-Site Request Forgery (CSRF) protection has been implemented across all state-changing operations in the Spike platform. This prevents malicious websites from performing unauthorized actions on behalf of authenticated users.

### Implementation Details

#### 1. NextAuth CSRF Configuration
Located in `/apps/web/lib/auth/unified-auth.ts`:
```typescript
cookies: {
  csrfToken: {
    name: `__Host-next-auth.csrf-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

**Key Features:**
- `__Host-` prefix prevents subdomain attacks
- `httpOnly` flag prevents JavaScript access
- `sameSite=lax` provides CSRF protection for most scenarios
- `secure` flag ensures HTTPS-only transmission in production

#### 2. Middleware Protection
Located in `/apps/web/middleware.ts`:
- Validates origin headers for all POST/PUT/DELETE/PATCH API requests
- Blocks requests from unauthorized origins
- Allows specific public API endpoints without CSRF checks

#### 3. API Route Protection
Located in `/apps/web/lib/security/csrf-protection.ts`:

**Protection Layers:**
1. **Origin Validation**: Checks `Origin` and `Referer` headers
2. **CSRF Token Validation**: Validates tokens from headers, body, or cookies
3. **Session Verification**: Ensures authenticated session exists
4. **Rate Limiting**: Prevents brute force attacks

**Usage in API Routes:**
```typescript
import { csrfProtection, rateLimit } from '@/lib/security/csrf-protection';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(10, 60000)(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Apply CSRF protection
  const csrfResponse = await csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // Your API logic here
}
```

#### 4. Client-Side Implementation
Located in `/apps/web/hooks/use-csrf-token.ts`:

**Features:**
- Automatic CSRF token fetching
- Token refresh on expiration
- Secure fetch wrapper with automatic token inclusion

**Usage:**
```typescript
import { useCsrfToken } from '@/hooks/use-csrf-token';

const Component = () => {
  const { secureFetch } = useCsrfToken();

  const handleSubmit = async (data) => {
    const response = await secureFetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };
};
```

### Protected Endpoints

The following critical endpoints are protected with CSRF tokens:

| Endpoint | Method | Protection Level | Rate Limit |
|----------|--------|-----------------|------------|
| `/api/auth/credentials/save` | POST | High - Credentials | 10/min |
| `/api/auth/credentials/validate` | POST | High - Validation | 3/min |
| `/api/user/onboarding` | POST/PATCH | Medium - User Setup | 20/min |
| `/api/users/[id]` | PUT/DELETE | High - User Data | 10/min (PUT), 5/min (DELETE) |
| `/api/moodle/validate` | POST | High - External Auth | 5/min |

---

## Authentication & Authorization

### Multi-Stage Authentication Flow
1. **Google OAuth**: Initial authentication via university email
2. **University Credentials**: Secondary validation with Moodle
3. **Session Management**: JWT-based session with dual-stage tracking

### Session Security
- 30-day maximum session duration
- Secure, httpOnly session cookies
- Automatic session refresh on credentials update
- Session invalidation on logout

### Authorization Checks
- User can only modify their own data
- API routes verify session user matches resource owner
- Admin endpoints require elevated privileges (future implementation)

---

## Rate Limiting

### Implementation
Rate limiting is implemented per-user/IP to prevent abuse:

```typescript
const rateLimitResponse = await rateLimit(
  10,    // max requests
  60000  // window in ms (1 minute)
)(request);
```

### Limits by Endpoint Type

| Action Type | Limit | Window | Justification |
|------------|-------|--------|---------------|
| Credential Validation | 3/min | 60s | Prevent brute force |
| Credential Save | 10/min | 60s | Normal usage pattern |
| User Updates | 10/min | 60s | Profile updates |
| User Deletion | 5/min | 60s | Destructive action |
| Onboarding | 20/min | 60s | Initial setup flow |

### Response Headers
Rate-limited responses include:
- `Retry-After`: Seconds until next request allowed
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

---

## Security Headers

### Global Headers
Applied to all responses via middleware and API routes:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Content Security Policy (CSP)
Implemented for Hebrew/RTL support with secure directives:
- Script sources limited to self and trusted CDNs
- Style sources include unsafe-inline for RTL support
- Frame ancestors set to 'none'

---

## API Security

### Request Validation
1. **Input Sanitization**: Zod schemas validate all inputs
2. **SQL Injection Prevention**: Parameterized queries via Supabase
3. **XSS Prevention**: Output encoding and React's built-in protection
4. **File Upload Security**: Type validation and size limits

### Error Handling
- Generic error messages to prevent information leakage
- Detailed errors logged server-side only
- Stack traces never exposed to clients

### Encryption
- Passwords encrypted with bcrypt (cost factor 10)
- University credentials encrypted with AES-256
- TLS 1.2+ enforced for all production traffic

---

## Client-Side Security

### Secure State Management
- Sensitive data not stored in localStorage
- Session storage cleared on logout
- Redux DevTools disabled in production

### API Communication
- All API calls use HTTPS in production
- Credentials included only for same-origin requests
- CSRF tokens automatically included

### Hebrew/RTL Security Considerations
- Input validation for Hebrew characters
- RTL-aware XSS prevention
- Proper encoding for Hebrew content

---

## Best Practices

### Development Guidelines

1. **Never Trust User Input**
   ```typescript
   // Bad
   const { id } = req.body;
   await db.delete(id);

   // Good
   const { id } = req.body;
   if (session.user.id !== id) {
     return res.status(403).json({ error: 'Forbidden' });
   }
   await db.delete(id);
   ```

2. **Use Type-Safe Validation**
   ```typescript
   const schema = z.object({
     email: z.string().email(),
     password: z.string().min(8)
   });
   const validated = schema.parse(req.body);
   ```

3. **Implement Defense in Depth**
   - Multiple validation layers
   - Fail securely by default
   - Log security events

4. **Handle Errors Securely**
   ```typescript
   try {
     // Operation
   } catch (error) {
     console.error('Detailed error:', error); // Server log
     return res.status(500).json({
       error: 'An error occurred' // Generic client message
     });
   }
   ```

### Deployment Security

1. **Environment Variables**
   - Never commit secrets to git
   - Use `.env.local` for development
   - Rotate secrets regularly

2. **HTTPS Configuration**
   - Force HTTPS redirects
   - HSTS headers with preload
   - Certificate pinning for mobile apps

3. **Database Security**
   - Row Level Security (RLS) enabled
   - Encrypted connections
   - Regular backups

---

## Security Checklist

### Pre-Deployment

- [ ] All API endpoints have CSRF protection
- [ ] Rate limiting configured for all endpoints
- [ ] Input validation on all user inputs
- [ ] Error messages don't leak sensitive info
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Secrets stored securely
- [ ] Dependencies updated and scanned

### Regular Audits

- [ ] Review authentication logs
- [ ] Check rate limit effectiveness
- [ ] Audit failed login attempts
- [ ] Review error logs for security issues
- [ ] Update dependencies
- [ ] Penetration testing (quarterly)
- [ ] Security training for developers

### Incident Response

1. **Detection**: Monitor logs and alerts
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Remediation**: Fix vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update procedures

---

## Security Contacts

**Security Team**: security@spike-platform.com
**Bug Bounty**: https://spike-platform.com/security/bug-bounty
**Security Updates**: https://spike-platform.com/security/updates

---

## Compliance

The Spike platform implements security measures compliant with:
- OWASP Top 10 (2021)
- Israeli Privacy Protection Law
- GDPR (for EU users)
- University data protection policies

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-16 | Initial CSRF protection implementation |
| 1.0.1 | 2024-01-16 | Added rate limiting and security headers |
| 1.0.2 | 2024-01-16 | Enhanced client-side security |

---

*Last Updated: January 16, 2024*
*Next Review: February 16, 2024*