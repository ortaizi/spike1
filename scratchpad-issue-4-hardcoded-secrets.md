# Issue #4: CRITICAL Hardcoded Secrets in Test Files

**GitHub Issue**: https://github.com/ortaizi/spike1/issues/4
**Severity**: CRITICAL 🔴
**OWASP**: A03:2021 - Sensitive Data Exposure
**Priority**: IMMEDIATE - Must be fixed in Week 1

## Problem Analysis

The security audit revealed **21 critical security vulnerabilities** related to hardcoded secrets and credentials throughout the codebase. This poses severe security risks including:

### Primary Vulnerable Files Identified:

1. **Test Credentials** - `/tests/phase4-validation.spec.ts:13-15`
   ```typescript
   bgu: { email: 'test@bgu.ac.il', password: 'test123' },
   tau: { email: 'test@tau.ac.il', password: 'test123' },
   ```

2. **NextAuth Secret** - `/playwright.config.ts:233`
   ```typescript
   NEXTAUTH_SECRET: 'test-secret-for-e2e',
   ```

3. **Database Credentials** - `/services/academic-service/database/migrations/tenant-setup.sh`
   ```bash
   'academic_service_password'
   ```

4. **API Keys** - `/mcp.json`
   ```json
   "ctx7sk-b41f1263-decd-4c2b-b844-2785aa919b33"
   ```

5. **Fallback Secrets** - `/shared/session/distributed-session.ts`
   ```typescript
   'fallback-secret-key'
   ```

### Security Risks:
- **Credential exposure** in public repositories
- **Session hijacking** through JWT token forgery
- **Database compromise** through exposed passwords
- **API abuse** with exposed third-party keys
- **Compliance violations** (GDPR, HIPAA, PCI-DSS, SOC 2, ISO 27001)

## Security Audit Analysis

The security-auditor identified:
- ✅ **Comprehensive security report** created: `SECURITY_AUDIT_HARDCODED_SECRETS.md`
- ✅ **Secret generation script** created: `scripts/generate-secrets.sh`
- ✅ **Environment template** created: `.env.example`
- ✅ **21 critical vulnerabilities** catalogued with remediation steps

## Solution Plan

### Phase 1: Immediate Security Fixes (24-48 Hours)
1. **Create new branch** for issue #4 fixes
2. **Generate secure secrets** using the provided script
3. **Remove hardcoded credentials** from test files
4. **Update configuration files** to use environment variables
5. **Update Docker configurations** and CI/CD configs
6. **Test all changes** to ensure functionality

### Phase 2: Environment Configuration
1. **Set up .env files** for all environments (dev, test, prod)
2. **Update test configurations** to use env variables
3. **Update Docker compose** and deployment configs
4. **Document environment setup** in README/CLAUDE.md

### Phase 3: Security Hardening
1. **Add pre-commit hooks** for secret detection
2. **Set up CI/CD secret scanning**
3. **Implement secret rotation policies**
4. **Add runtime secret validation**

### Phase 4: Testing & Validation
1. **Test with Playwright** to ensure UI functionality
2. **Run full test suite** with new environment setup
3. **Verify authentication flows** work correctly
4. **Test in all environments** (dev, test, prod)

## Implementation Steps

1. ✅ **ANALYSIS COMPLETE**: Security audit identified 21 vulnerabilities
2. 🔄 **IN PROGRESS**: Create detailed plan document (this scratchpad)
3. ⏳ **PENDING**: Switch to main branch and create issue #4 branch
4. ⏳ **PENDING**: Generate secure secrets using provided script
5. ⏳ **PENDING**: Update `/tests/phase4-validation.spec.ts` to use env vars
6. ⏳ **PENDING**: Update `/playwright.config.ts` to use env vars
7. ⏳ **PENDING**: Fix database migration scripts
8. ⏳ **PENDING**: Remove exposed API keys from `/mcp.json`
9. ⏳ **PENDING**: Update fallback secrets in session management
10. ⏳ **PENDING**: Test changes with Playwright
11. ⏳ **PENDING**: Run full test suite validation
12. ⏳ **PENDING**: Run security validation (lint, type-check)
13. ⏳ **PENDING**: Commit changes with proper security fix message
14. ⏳ **PENDING**: Open PR for security review

## Technical Implementation Details

### Environment Variable Mapping:
```bash
# Test Credentials
TEST_BGU_EMAIL=test@bgu.ac.il
TEST_BGU_PASSWORD=<secure-generated>
TEST_TAU_EMAIL=test@tau.ac.il
TEST_TAU_PASSWORD=<secure-generated>

# NextAuth
NEXTAUTH_SECRET=<secure-32-char-generated>

# Database
ACADEMIC_SERVICE_DB_PASSWORD=<secure-generated>

# API Keys
CONTEXT7_API_KEY=<new-rotated-key>
```

### Files to Update:
1. **`/tests/phase4-validation.spec.ts`** - Replace hardcoded test credentials
2. **`/playwright.config.ts`** - Replace hardcoded NEXTAUTH_SECRET
3. **`/services/academic-service/database/migrations/tenant-setup.sh`** - Environment variable
4. **`/mcp.json`** - Remove/rotate API key
5. **`/shared/session/distributed-session.ts`** - Use environment variable for fallback

### Testing Strategy:
1. **Playwright E2E Tests** - Verify authentication flows still work
2. **Unit Tests** - Test environment variable loading
3. **Integration Tests** - Test database connections with new credentials
4. **Security Tests** - Verify no hardcoded secrets remain

## Security Best Practices Implementation

### Secret Management:
- **32+ character secrets** generated cryptographically
- **Environment-based configuration** for all secrets
- **No secrets in version control** ever
- **Secret rotation policies** every 30-90 days

### CI/CD Security:
- **Pre-commit hooks** to detect hardcoded secrets
- **Secret scanning** in CI pipeline
- **Runtime validation** of required environment variables
- **Secure secret injection** in deployment

### Compliance:
- **OWASP guidelines** followed for secret management
- **Industry standards** (GDPR, HIPAA, SOC 2) compliance
- **Security documentation** and training materials
- **Audit trails** for secret rotation and access

## Risk Assessment

**Current State**: 🔴 CRITICAL
- Multiple production-ready secrets exposed in version control
- Authentication system can be compromised
- Database credentials visible to anyone with code access
- Third-party API keys exposed for potential abuse
- Complete system compromise possible

**After Remediation**: 🟢 SECURE
- All secrets stored in environment variables
- Cryptographically secure secret generation
- Continuous monitoring and rotation
- Pre-commit and CI/CD security scanning
- Compliance with industry security standards

## Priority Actions

### IMMEDIATE (Next 2 Hours):
1. **Rotate exposed API keys** - Context7 key must be regenerated
2. **Generate new secrets** using provided secure script
3. **Remove hardcoded secrets** from critical files
4. **Update test configurations** to prevent auth failures

### THIS WEEK:
1. **Complete all code updates** with environment variables
2. **Set up secret management infrastructure**
3. **Implement CI/CD security scanning**
4. **Train team** on secure development practices

**Status**: 🔄 IN PROGRESS - Plan complete, ready for implementation

## Notes
- **Security auditor deliverables** available in root directory
- **Follow Hebrew/RTL conventions** when updating test files
- **Use TypeScript interfaces** for environment variable types
- **Test with actual BGU credentials** sparingly as per CLAUDE.md guidelines
- **Document changes** in commit messages with security focus