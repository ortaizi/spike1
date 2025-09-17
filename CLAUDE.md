# CLAUDE.md - Project Constitution & Control Panel

Spike is an academic management platform for Israeli university students,
focusing on BGU (Ben Gurion University) with Hebrew/RTL first design and Moodle
integration.

**This document serves as the project constitution for Claude to understand the
codebase context, conventions, and critical instructions.**
I've analyzed the image you uploaded. Here is the text from the document, which outlines a set of Git workflow requirements.

**\*\*STOP! READ THIS FIRST!\*\***

## MANDATORY Git Workflow – DO NOT SKIP

Before writing ANY code, you MUST:
1.  Create a feature branch: `git checkout -b feature/[name]`
2.  Commit changes FREQUENTLY (every file/component)
3.  NEVER work on main branch directly

**\*\*If you complete a task without proper Git commits = TASK INCOMPLETE\*\***

## ⚠️ **CRITICAL:** Git Workflow Requirements

**\*\*IMPORTANT\*\***: You MUST follow the Git workflow for ALL code changes.

1.  **\*\*ALWAYS create a feature branch BEFORE making changes\*\***

    ```bash
    git checkout -b feature/[feature-name] # or bug/[bug-name]
    ```

2.  **\*\*Commit changes REGULARLY during development\*\***

      * After completing each major step
      * When switching between different files/features
      * Before running build tests
      * Use meaningful commit messages with `[Type]` prefix

3.  **\*\*NEVER work directly on main branch\*\***

      * All changes must go through feature branches
      * Create pull requests for review

4.  **\*\*Commit message format\*\***

    ```bash
    git commit -m "[Type] Brief description"
    ```

**\*\*Failure to follow Git workflow = Incomplete task\*\***

## 📚 Context Files Reference

**Essential project documentation in `/context/` folder:**

- **Design System:** `/context/design-principles.md` - UI/UX guidelines & checklist
- **Brand Guide:** `/context/style-guide.md` - Visual identity & styling rules
- **Backend Architecture:** `/context/backend-principles.md` - API & data patterns
- **Testing Standards:** `/context/testing-principles.md` - Test coverage & strategies
- **Security Guidelines:** `/context/security-principles.md` - Security best practices

**ALWAYS consult these files when working on related areas.**

## 🚀 Server Management (CRITICAL)

**Start server (ALWAYS from apps/web):**

```bash
# Kill existing processes
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start from correct directory
cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
```

## ⚙️ Developer Environment Setup

**Required Tools & Versions:**

- Node.js: v18.17+ (LTS recommended)
- npm: v9.6+
- Python: 3.9+ (for BGU Moodle scraper)
- PostgreSQL: 14+ (via Supabase)
- Playwright: Latest (for E2E testing)

**Initial Setup:**

```bash
# Clone and install
git clone [repo-url]
npm install

# Environment variables
cp .env.example .env.local
# Configure: SUPABASE_URL, SUPABASE_ANON_KEY, NEXTAUTH_SECRET, etc.

# Database setup
npm run db:generate
npm run db:push
```

## 📋 Essential Commands

**Development:**

- `npm run dev` - Start all servers
- `npm run build` - Build monorepo
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint with Hebrew/RTL rules
- `npm run validate` - Full validation pipeline (lint + type-check + test)
- `npm run format` - Prettier code formatting
- `npm run clean` - Clean build artifacts

**Testing:**

- `npm run test` - All tests
- `npm run test:auth` - Auth tests (critical)
- `npm run test:hebrew` - Hebrew/RTL tests
- `npm run test:e2e` - E2E tests
- `npm run test:watch` - Watch mode for TDD
- `npm run test:coverage` - Coverage report

**Database:**

- `npm run db:studio` - Supabase Studio GUI
- `npm run db:generate` - Generate TypeScript types
- `npm run db:push` - Push schema changes
- `npm run db:reset` - Reset database (CAUTION)
- `npm run db:seed` - Seed development data

## 🏗️ Architecture

**Tech Stack:**

- Next.js 14 (App Router) + TypeScript
- Supabase PostgreSQL + NextAuth.js
- Tailwind CSS with Hebrew/RTL support
- Python scraper for BGU Moodle integration

**Key Directories:**

- `apps/web/` - Main Next.js application
- `apps/web/app/` - App Router pages & layouts
- `apps/web/components/` - Reusable UI components
- `apps/web/lib/` - Utility functions & core logic
- `apps/web/lib/auth/` - Authentication system
- `apps/web/middleware.ts` - Route protection & redirects
- `packages/database/` - Supabase schema & migrations
- `packages/shared/` - Shared types & utilities
- `tests/e2e/` - Playwright E2E tests
- `tests/unit/` - Unit tests
- `context/` - Project documentation & guidelines
- `scripts/` - Build & deployment scripts

## 🎨 Code Style & Conventions

**Hebrew/RTL Rules:**

- Use logical CSS properties (`marginInlineStart` not `marginLeft`)
- Default locale: `he-IL`
- Hebrew academic terminology

**TypeScript:**

- Use `interface` over `type` for object shapes
- Import types with `import type { ... }`
- Explicit return types for all functions
- Strict mode enabled (`strict: true`)
- No `any` types - use `unknown` if needed

**Import/Export Style:**

```typescript
// Preferred import style
import type { User } from '@/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Named exports for utilities
export { functionName }

// Default exports for pages/components
export default ComponentName
```

**File Naming:**

- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`authHelpers.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Pages: lowercase (`page.tsx`, `layout.tsx`)

## 🧪 Testing

**Critical Tests:**

- `npm run test:auth-critical` - Must pass before commits
- `npm run test:hebrew` - Hebrew/RTL tests
- `npm run test:real-bgu` - BGU integration (use sparingly)

**Debugging:**

```bash
# Visual debugging
npx playwright test --headed --debug

# View test results
npx playwright show-report
```

## 🔐 Authentication System

**Multi-Stage Flow:**

1. University selection (BGU)
2. Google OAuth + BGU credentials
3. Moodle integration + Dashboard access

**Key Files:**

- `lib/auth/unified-auth.ts` - NextAuth config
- `middleware.ts` - Route protection
- `app/api/auth/credentials/validate/route.ts` - Credential validation

## 🌍 Hebrew/RTL Development

- Default locale: `he-IL`
- Use logical CSS properties (`marginInlineStart` not `marginLeft`)
- BGU academic terminology in Hebrew
- Test with `npm run visual:rtl` and `npm run lint:rtl`

## 🐛 Common Issues

**Server Issues (CRITICAL):**

```bash
# Import path errors? Kill & restart from apps/web
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
```

**Other Issues:**

- Turborepo cache: `turbo clean && npm run build`
- Auth debugging: `npm run test:auth-critical`
- Hebrew/RTL: `npm run visual:rtl`

## 🏗️ Core Files & Utilities

**Authentication:**
- `lib/auth/unified-auth.ts` - NextAuth configuration
- `lib/auth/session.ts` - Session management
- `lib/auth/validators.ts` - Credential validation

**Database:**
- `lib/db/client.ts` - Supabase client
- `lib/db/queries/` - Database query functions
- `lib/db/types.ts` - Generated DB types

**UI Components:**
- `components/ui/` - Base UI components (Radix UI)
- `components/hebrew/` - Hebrew-specific components
- `components/layout/` - Layout components

**Utilities:**
- `lib/utils/cn.ts` - Class name helper
- `lib/utils/hebrew.ts` - Hebrew text utilities
- `lib/utils/date.ts` - Date formatting (Hebrew calendar)

## 🚨 Before Commits

- [ ] `npm run validate` passes (lint + type-check + test)
- [ ] `npm run test:auth-critical` passes
- [ ] `npm run test:hebrew` passes
- [ ] No console.logs or debugger statements
- [ ] Secrets not exposed in code
- [ ] Use conventional commits:
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `docs:` - Documentation
  - `style:` - Formatting, no code change
  - `refactor:` - Code restructuring
  - `test:` - Adding tests
  - `chore:` - Maintenance

## 🚫 Do Not Touch Areas

**Protected Files (DO NOT MODIFY):**

- `.env.production` - Production environment variables
- `supabase/migrations/` - Database migrations (append only)
- `lib/auth/providers/` - OAuth provider configs
- `public/bgu-assets/` - Official BGU assets

**Critical Systems (MODIFY WITH CAUTION):**

- Authentication middleware
- Payment processing logic
- BGU API integration
- Student data handlers

## ⚠️ Known Issues & Warnings

**Common Pitfalls:**

1. **Hebrew Text:** Always test with actual Hebrew content, not Lorem Ipsum
2. **RTL Layout:** Check all components in RTL mode before committing
3. **BGU API:** Rate limited - use mock data for development
4. **Supabase RLS:** Row Level Security must be configured for all tables
5. **Next.js Caching:** Clear `.next/cache` if seeing stale data

**Unexpected Behaviors:**

- Middleware runs on every request - keep it lightweight
- Hebrew fonts may load slowly - use font preloading
- BGU login may timeout - implement retry logic
- Moodle scraper needs VPN for off-campus access

## 🔄 Repository Etiquette

**Branch Naming:**

- `feature/[ticket-id]-description` - New features
- `fix/[ticket-id]-description` - Bug fixes
- `hotfix/critical-issue` - Production hotfixes
- `chore/description` - Maintenance tasks


**Pull Request Guidelines:**

1. Fill out PR template completely
2. Link related issues
3. Include screenshots for UI changes
4. Ensure CI/CD passes
5. Request review from code owners

## 🎯 Claude Protocol

**EVERY session:**

1. Check server: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
2. If not 200, restart server from `apps/web`
3. Verify before proceeding
4. **ALWAYS use subagents proactively** - Don't ask, just use them based on task
   type

## 🤖 Subagent Usage Guidelines

**Use specialized subagents for specific tasks:**

**Frontend Development:**

- `frontend-developer` - React components, UI fixes, responsive layouts
- `ui-ux-designer` - Design systems, user flows, interface optimization

**Backend & Architecture:**

- `backend-architect` - API design, microservices, database schemas
- `architect-review` - System design reviews, architectural decisions

**Testing & Quality:**

- `test-automator` - Test automation, quality engineering
- `tdd-orchestrator` - TDD implementation and governance
- `debugger` - Error debugging, test failures, unexpected behavior

**Security & Performance:**

- `security-auditor` - Security audits, vulnerability assessment, compliance
- `performance-engineer` - Performance optimization, observability, scalability

**DevOps & Operations:**

- `devops-troubleshooter` - Incident response, system troubleshooting
- `error-detective` - Log analysis, error pattern detection

**Code Quality:**

- `code-reviewer` - Code quality assurance, security scanning
- `docs-architect` - Technical documentation, architecture guides

**When to Use Subagents (MANDATORY):**

- **ANY debugging task** - ALWAYS use `debugger` agent first
- **ANY UI/frontend issue** - ALWAYS use `frontend-developer` agent
- **ANY performance issue** - ALWAYS use `performance-engineer` agent
- **ANY security concern** - ALWAYS use `security-auditor` agent
- **ANY testing task** - ALWAYS use `test-automator` agent
- **ANY code review** - ALWAYS use `code-reviewer` agent
- Complex multi-step tasks requiring specialized expertise
- Architecture decisions and reviews

**🚨 CRITICAL: Use subagents IMMEDIATELY when encountering:**

- Errors, bugs, or unexpected behavior → `debugger`
- UI/UX issues or layout problems → `frontend-developer`
- Performance bottlenecks → `performance-engineer`
- Test failures → `test-automator`
- Code quality issues → `code-reviewer`

**Hebrew/RTL Specific:**

- Use `frontend-developer` for RTL layout fixes
- Use `ui-ux-designer` for Hebrew interface optimization
- Use `test-automator` for Hebrew content testing


## Visual Development

### Design Principles

- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for
  guidance

### Quick Visual Check

IMMEDIATELY after implementing any front-end change:

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to
   visit each changed view
3. **Verify design compliance** - Compare against
   `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's
   specific request
5. **Check acceptance criteria** - Review any provided context files or
   requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px)
   of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

Invoke the `@agent-design-review` subagent for thorough design validation when:

- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

## 📖 Additional Documentation

**External References:**

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [BGU Moodle API](internal-docs-link)
- [Hebrew Localization Guide](internal-docs-link)

**Internal Architecture Docs:**

- Architecture Decision Records (ADRs) in `/docs/adr/`
- API Documentation in `/docs/api/`
- Component Storybook (when available): `npm run storybook`

## 🛠️ Deployment & CI/CD

**Deployment Commands:**

```bash
# Production deployment
npm run deploy:prod

# Staging deployment
npm run deploy:staging

# Preview deployment
npm run deploy:preview
```

**CI/CD Pipeline:**

1. **Pre-commit:** Husky hooks run validation
2. **PR Checks:** GitHub Actions run tests
3. **Merge to main:** Auto-deploy to staging
4. **Tagged release:** Deploy to production

**Environment Variables:**

- Development: `.env.local`
- Staging: `.env.staging`
- Production: `.env.production` (managed via CI/CD)

## 🔍 Performance & Monitoring

**Performance Guidelines:**

- Lighthouse score target: 90+ for all metrics
- Bundle size budget: < 200KB for initial load
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

**Monitoring Tools:**

- Error tracking: Sentry
- Analytics: Google Analytics 4
- Performance: Vercel Analytics
- Uptime: Better Uptime

As an expert in full-stack coding, I've transcribed the content from the two images you uploaded, which cover best practices for documentation and analytics.

-----

### Documentation Practice

#### Feature Development Workflow

When implementing new features or making significant changes, maintain comprehensive documentation:

1.  **\*\*Before Implementation\*\***: Create or update `app_info/YYYY-MM-DD_desired_app_functionality.md`

      * Document the desired changes and requirements
      * Specify tier restrictions and business logic
      * Define success criteria

2.  **\*\*After Implementation\*\***: Create `app_info/YYYY-MM-DD_implementation_update.md`

      * List all files created/modified
      * Document technical implementation details
      * Include build status and test results
      * Note any pending items or known issues

3.  **\*\*Current State Documentation\*\***: Maintain `app_info/YYYY-MM-DD_app_functionality.md`

      * Keep an up-to-date snapshot of current functionality
      * Organize by features and tiers
      * Include both implemented and planned features
      * Mark items clearly as ✅ Completed or ❌ Pending

### Documentation Structure

#### Desired Functionality Document

```markdown
# [App Name] - Desired Functionality
**Date\*\***: YYYY-MM-DD
**Version\*\***: X.X
```

#### Requested Changes

  * Clear list of requirements
  * Tier restrictions

-----

### Common Mistakes to Avoid

❌ **\*\*Don't Do This\*\***:

  * Add new features without any analytics
  * Modify existing features without updating events
  * Use generic event names like "button\_clicked"
  * Forget to test events before release

✅ **\*\*Do This\*\***:

  * Plan analytics events during feature design
  * Update existing events when behavior changes
  * Use specific, descriptive event names
  * Test events thoroughly during development

### Analytics Event Files to Review

When modifying features, check these files:

  * `Services/AnalyticsService.swift` – Main analytics implementation
  * `Utils/Analytics.swift` – Event definitions and tracking methods
  * Any view files related to your feature changes

### Quick Analytics Update Workflow

1.  **\*\*Identify affected features\*\*** from your changes
2.  **\*\*Find existing analytics events\*\*** in those features
3.  **\*\*Plan new/updated events\*\*** needed
4.  **\*\*Implement analytics changes\*\*** alongside feature changes
5.  **\*\*Test events work\*\*** before completing feature



## 📝 Summary

This CLAUDE.md serves as the comprehensive control panel for understanding and
working with the Spike platform. Always refer to this document and the context
files when making decisions about architecture, implementation, or debugging.

**Remember:**
- Consult `/context/` files for detailed guidelines
- Use subagents proactively for specialized tasks
- Maintain high code quality and test coverage
- Respect protected areas and known limitations
