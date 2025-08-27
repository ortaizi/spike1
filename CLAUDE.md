# Spike Academic Platform - Claude Development Guide

## 🎯 Project Overview
Spike is a comprehensive academic management platform for Ben Gurion University students featuring Moodle integration, Hebrew/RTL support, and multi-university authentication.

## 🚀 SuperClaude Framework Integration
SuperClaude v4.0.8 is now integrated into the project, providing:

### Available SuperClaude Commands (use `/sc:` prefix)
- `/sc:brainstorm` - Interactive requirements discovery through Socratic dialogue
- `/sc:analyze` - Deep analysis of code, architecture, and systems
- `/sc:design` - Design system architecture and component patterns
- `/sc:implement` - Structured implementation with best practices
- `/sc:test` - Comprehensive testing strategies and execution
- `/sc:document` - Generate technical documentation
- `/sc:troubleshoot` - Systematic problem diagnosis and resolution
- `/sc:refactor` - Code improvement and optimization
- `/sc:build` - Build and deployment orchestration
- `/sc:workflow` - Development workflow optimization

### Available Specialized Agents (use `@agent-` prefix)
- `@agent-frontend` - React/Next.js/UI specialist for your dashboard and Hebrew/RTL components
- `@agent-backend` - API/database/server-side logic specialist for Moodle integration
- `@agent-security` - Security analysis for authentication and data protection
- `@agent-devops` - CI/CD, deployment, and infrastructure specialist
- `@agent-quality` - Code quality, testing, and validation expert
- `@agent-system` - System architecture and design patterns specialist

### Behavioral Modes (activated automatically)
- **Brainstorming Mode** - For feature ideation and requirements discovery
- **Task Management Mode** - For complex multi-step implementations
- **Token Efficiency Mode** - For optimized context usage in large codebases
- **Orchestration Mode** - For coordinated tool usage and workflow automation
- **Introspection Mode** - For meta-analysis and reflection on development decisions

### SuperClaude + Spike Synergies
- Hebrew/RTL development with specialized frontend agent
- BGU authentication system analysis with security agent  
- Moodle integration architecture with backend agent
- Academic platform design patterns with system architect
- Multi-university deployment with devops agent

## 📋 Essential Commands

### 🚀 Development Server Management (Critical)
**ALWAYS maintain a background development server on port 3000:**

```bash
# Kill any existing processes on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start development server in background (from apps/web directory)
cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
```

**Server Management Rules:**
- Always run server on port 3000 (never other ports)
- Kill existing processes before starting new ones
- Run from `apps/web` directory to avoid path alias issues
- Use background mode (`&` or bash background tools) for persistent development

### Turborepo Development (Optimized Builds)
- `npm run dev` - Start all development servers (persistent, cached) - **Use only for full stack development**
- `npm run build` - Build entire monorepo with dependency graph optimization
- `turbo dev` - Direct Turbo execution with caching - **May cause path resolution issues**
- `turbo build --filter=@spike/web` - Build specific app only
- `turbo clean` - Clear all build caches and artifacts

### Development & Type Checking
- `npm run type-check` - TypeScript validation across all packages (cached)
- `npm run lint` - ESLint with Hebrew/RTL rules (dependency-aware)
- `npm run lint:fix` - Auto-fix linting issues across monorepo
- `turbo type-check --continue` - Type-check all packages, continue on errors

### Testing (Critical - Always run after changes)
- `npm run test` - All tests with Turbo caching and parallelization
- `npm run test:unit` - Unit tests only (cached builds)
- `npm run test:e2e` - E2E tests (requires built packages)
- `npm run test:visual` - Visual regression tests
- `npm run test:coverage` - Test coverage reports
- `npm run test:auth` - Authentication unit tests (critical path)
- `npm run test:auth-e2e` - BGU authentication E2E tests
- `npm run test:hebrew` - Hebrew/RTL specific tests
- `npm run test:auth-flow` - Complete auth test suite
- `npm run test:real-bgu` - Real BGU system tests (headed mode)

### Database Operations (Build Dependencies)
- `npm run db:generate` - Generate types from Supabase schema
- `npm run db:push` - Push schema changes to Supabase
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Supabase studio (persistent)
- `npm run db:reset` - Reset database (no cache)
- `npm run scraper:dev` - Run Python scraper in development

### Code Quality (Run before commits)
- `npm run format` - Prettier formatting
- `npm run lint:rtl` - RTL-specific linting rules
- `npm run validate` - Complete validation pipeline (type-check + lint + format + test)

## 🏗️ Architecture

### Turborepo Monorepo Structure
```
apps/
├── web/           # @spike/web - Next.js 14 frontend + API routes
└── scraper/       # Python Moodle scraper (external to Turbo pipeline)

packages/
├── database/      # @spike/database - Supabase schema & client
├── shared/        # @spike/shared - Shared TypeScript types
└── ui/           # @spike/ui - Radix UI components

turbo.json        # Turborepo pipeline configuration
```

### Turborepo Pipeline Configuration
- **Build Dependencies**: `^build` ensures packages build before apps
- **Persistent Tasks**: `dev` and `db:studio` run continuously
- **Cached Tasks**: All builds, tests, and type-checking for faster iterations
- **Environment Variables**: Managed per task with proper scoping
- **Output Tracking**: `.next/`, `dist/`, `coverage/`, `test-results/`

### Key Technologies
- **Build System**: Turborepo with intelligent caching and task orchestration
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL), NextAuth.js, Python scraper
- **Testing**: Playwright (E2E), Vitest (Unit), Hebrew/RTL testing
- **Code Quality**: ESLint (strict rules), Prettier, Husky
- **Package Management**: npm workspaces with Turbo optimization

## 🎨 Code Style Guidelines

### TypeScript Best Practices
- Use `interface` over `type` for object definitions
- Import types with `import type { ... }`
- Explicit return types for functions (enforced by ESLint)
- Prefer nullish coalescing (`??`) over logical OR (`||`)

### React/Next.js Patterns
- Use App Router file conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- Prefer Server Components over Client Components
- Use `"use client"` directive only when necessary
- Follow component prop sorting (ESLint enforced)

### Hebrew/RTL Conventions
- Use logical CSS properties (`marginInlineStart` not `marginLeft`)
- Hebrew locale as default (`he-IL`)
- Academic terminology in Hebrew
- BGU-specific course codes and calendar support

### Import Organization (Auto-sorted by ESLint)
```typescript
// 1. React/Next.js
import React from 'react'
import { NextRequest } from 'next/server'

// 2. External libraries
import { supabase } from '@supabase/supabase-js'
import { z } from 'zod'

// 3. Internal packages
import { Database } from '@spike/database'
import { CourseData } from '@spike/shared'

// 4. Local imports
import { authConfig } from '@/lib/auth'
import type { User } from '@/types/database'
```

## 🧪 Testing Strategy

### Critical Test Paths
1. **Authentication Flow**: BGU SSO → Credential validation → Dashboard redirect
2. **Hebrew/RTL Rendering**: UI components with Hebrew text
3. **Moodle Integration**: Course data sync and validation
4. **Multi-University Support**: Different university auth systems

### Test Commands by Area
```bash
# Authentication (most critical)
npm run test:auth-critical     # Only critical auth tests
npm run test:middleware        # Middleware auth logic
npm run test:onboarding        # User onboarding flow

# E2E Testing
npm run test:auth-e2e         # Real BGU authentication
npm run visual:rtl            # Hebrew/RTL visual tests
npm run a11y:hebrew           # Hebrew accessibility tests
```

## 🔧 Development Workflows

### Workflow 1: Explore, Plan, Code, Commit
**Best for**: Complex features, system integrations, authentication flows, Hebrew/RTL implementations

**Use Cases in Spike**:
- BGU Moodle integration and scraping logic
- Multi-university authentication systems
- Hebrew/RTL layout and localization features
- Database schema changes and migrations
- Academic calendar integration

**Steps**:
1. **Explore**: Read relevant files without writing code
   ```bash
   # Research existing auth implementations
   grep -r "authentication" apps/web/lib/auth/
   # Check Hebrew/RTL patterns
   grep -r "rtl\|hebrew" apps/web/components/
   ```
2. **Plan**: Create detailed implementation plan using thinking modes
   - Analyze existing codebase patterns
   - Consider Hebrew/RTL implications
   - Plan database schema changes
   - Design API endpoints and types
3. **Code**: Implement solution following established patterns
4. **Commit**: Create meaningful commit with Hebrew context
   ```bash
   npm run validate && git commit -m "feat: implement BGU dual-stage auth with Hebrew support"
   ```

### Workflow 2: Test-Driven Development (TDD)
**Best for**: Critical authentication logic, API endpoints, data validation, Hebrew text processing

**Use Cases in Spike**:
- Authentication middleware and validation
- BGU credential verification functions  
- Hebrew text processing and RTL validation
- Course data parsing and transformation
- API route input/output validation

**Steps**:
1. **Write Tests**: Create tests for expected behavior
   ```bash
   # Authentication tests
   npm run test:auth-critical
   # Hebrew-specific validation
   npm run test:hebrew
   ```
2. **Confirm Failure**: Ensure tests fail initially
3. **Commit Tests**: 
   ```bash
   git add tests/ && git commit -m "test: add BGU auth validation tests"
   ```
4. **Implement**: Write code to pass tests
5. **Iterate**: Refine until all tests pass with Turbo caching
6. **Commit Code**:
   ```bash
   npm run validate && git commit -m "feat: implement BGU auth validation logic"
   ```

### Workflow 3: Visual Design Implementation
**Best for**: UI components, Hebrew/RTL layouts, dashboard interfaces, responsive design

**Use Cases in Spike**:
- Dashboard components with Hebrew text
- RTL layout fixes and responsive design
- BGU branding and academic UI elements
- Mobile responsive Hebrew interfaces
- Course cards and assignment displays

**Steps**:
1. **Screenshot Current State**:
   ```bash
   npm run visual:rtl  # Visual regression tests
   ```
2. **Provide Design Reference**: Hebrew UI mockups or BGU design system
3. **Implement Design**: Following RTL and Hebrew conventions
4. **Screenshot Result**: Compare with reference
5. **Iterate**: Claude's outputs improve with visual feedback
6. **Commit**: 
   ```bash
   npm run visual:rtl && git commit -m "ui: implement Hebrew dashboard with RTL support"
   ```

### Choosing the Right Workflow

| Task Type | Recommended Workflow | Spike Examples |
|-----------|---------------------|----------------|
| **Complex System Integration** | Workflow 1 (Explore, Plan, Code) | BGU SSO, Moodle API, Multi-university support |
| **Critical Business Logic** | Workflow 2 (TDD) | Authentication middleware, Hebrew validation, Course parsing |
| **UI/UX Implementation** | Workflow 3 (Visual Design) | Dashboard components, RTL layouts, Mobile responsive |
| **Bug Fixes** | Workflow 1 or 2 | Depends on complexity and testability |
| **Performance Optimization** | Workflow 2 (TDD) | With performance benchmarks as tests |

### After Any Workflow (Turbo-Optimized)
1. **Required**: `npm run type-check` (TypeScript validation with caching)
2. **Required**: `npm run lint` (Code quality across affected packages)
3. **Required**: `npm run test:auth` (Authentication tests - cached builds)
4. **Recommended**: `npm run test:hebrew` (Hebrew-specific tests)
5. **Optimal**: `turbo type-check lint test --filter=...^` (Only affected packages)

### Before Committing (Simplified Hooks)
- **Pre-commit**: Security checks, Hebrew/RTL validation, lint-staged
- **Pre-push**: Type checking, unit tests, Hebrew tests
- **Critical**: All authentication tests must pass
- Verify Hebrew/RTL layout isn't broken
- Turbo cache ensures fast validation of unchanged packages

### Turbo Performance Tips
- Use `--filter=@spike/web` to work on specific apps
- `--continue` flag continues execution despite errors
- Cache hits dramatically speed up repeated operations
- `turbo clean` when experiencing cache issues

## 🌍 Hebrew/RTL Development

### Key Considerations
- Default locale: `he-IL` (Hebrew, Israel)
- Academic year format: Hebrew academic calendar
- Course codes: BGU format (e.g., "ארגון מחשבים")
- UI direction: RTL layout support

### Testing RTL
```bash
npm run visual:rtl           # Visual regression for RTL
npm run lint:rtl             # RTL-specific linting
```

## 🔐 Authentication System

### Multi-Stage Authentication
1. **University Selection**: Choose BGU or other supported universities
2. **Credential Validation**: BGU SSO or manual credentials
3. **Moodle Integration**: Course data synchronization
4. **Dashboard Access**: Authenticated user experience

### Critical Files
- `lib/auth/unified-auth.ts` - Main authentication logic
- `lib/auth/university-auth.ts` - University-specific auth
- `middleware.ts` - Route protection and auth middleware
- `app/api/auth/credentials/validate/route.ts` - Credential validation

## 🐛 Common Issues & Solutions

### 🚨 Development Server Issues (Priority Fix)
**Path alias resolution problems (`@/` imports failing):**
```bash
# Immediate fix - kill and restart server from correct directory
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
```

**Common symptoms:**
- `Module not found: Can't resolve '@/components/ui/button'`
- `Module not found: Can't resolve '@/lib/utils'`
- 500 errors on page load

**Root causes:**
- Running server from wrong directory (root vs apps/web)
- Turborepo path mapping conflicts
- Stale cache from different server instances

**Prevention:**
- Always verify server runs from `apps/web` directory
- Use port 3000 consistently
- Check server status with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`

### Turborepo & Development Server Issues
- **Memory errors**: Use `NODE_OPTIONS='--max-old-space-size=4096'` (configured in web app)
- **Port conflicts**: Kill existing processes: `lsof -ti :3000 | xargs kill -9`
- **Supabase connection**: Check `.env.local` for valid `DATABASE_URL`
- **Turbo cache issues**: Run `turbo clean` to clear stale cache
- **Package resolution**: Run `npm install` in root after package changes
- **Build dependency errors**: Ensure packages build before apps with `^build` dependencies

### Turborepo-Specific Debugging
```bash
# Clear all caches and rebuild
turbo clean && npm run build

# Run tasks with verbose logging
turbo dev --log-level=error

# Target specific packages
turbo build --filter=@spike/database --filter=@spike/web

# Debug pipeline execution
turbo run build --dry-run --graph
```

### Authentication Debugging
```bash
# Test BGU login specifically
npm run test:real-bgu

# Debug authentication API
node test-authentication-fix.js

# Check credential validation
npm run test:auth-critical

# Run only auth tests with Turbo caching
turbo test --filter=@spike/web -- --grep="auth"
```

### Hebrew/RTL Issues
- Verify logical CSS properties are used
- Check text direction in components
- Test with Hebrew content in all states
- Run `npm run visual:rtl` for regression testing

### Turbo Pipeline Troubleshooting
- **Task hanging**: Check for circular dependencies in turbo.json
- **Cache misses**: Verify `globalDependencies` includes config files
- **Env var issues**: Ensure environment variables are declared in pipeline tasks
- **Output not cached**: Verify `outputs` array includes all generated files

## 📁 Key Directories

### Frontend (`apps/web/`)
- `app/api/` - Next.js API routes
- `components/dashboard/` - Main dashboard components
- `lib/auth/` - Authentication utilities
- `lib/data-collectors/` - Course data collection
- `types/` - TypeScript type definitions

### Backend Integration
- `apps/scraper/` - Python Moodle scraper
- `supabase/migrations/` - Database schema changes

## 🚨 Critical Requirements

### Before Any Commit
- [ ] TypeScript compilation succeeds
- [ ] All authentication tests pass
- [ ] Hebrew/RTL layout verified
- [ ] ESLint passes with no errors
- [ ] No Hebrew text hardcoded in components

### Before Production Deploy
- [ ] E2E tests pass in all browsers
- [ ] BGU integration tests succeed
- [ ] Performance tests with Hebrew content
- [ ] Accessibility tests pass

## 🔗 External Dependencies

### University Systems
- **BGU Moodle**: Primary integration target
- **BGU SSO**: Authentication system
- **Academic Calendar**: Hebrew academic year support

### Required Environment Variables
```bash
DATABASE_URL=              # Supabase PostgreSQL
NEXTAUTH_SECRET=          # Authentication secret
NEXTAUTH_URL=             # Application URL
GOOGLE_CLIENT_ID=         # OAuth integration
GOOGLE_CLIENT_SECRET=     # OAuth integration
```

## 📞 Emergency Contacts & Resources

### Critical System Dependencies
- Supabase database connectivity
- BGU Moodle API availability
- Authentication service uptime

### Debug Tools
- Supabase Studio: Database inspection
- Next.js DevTools: React component debugging
- Playwright UI: E2E test debugging with `--ui` flag

## 🤖 Claude Workflow Selection Guide

**Before each response, Claude will analyze your request and select the appropriate workflow:**

### Workflow Selection Criteria

**For Workflow 1 (Explore, Plan, Code)** - Use when request contains:
- "implement", "create", "add feature", "integrate"
- System-level changes (auth, database, API integration)
- Hebrew/RTL layout changes
- Multi-step complex tasks
- BGU/Moodle integration work

**For Workflow 2 (Test-Driven Development)** - Use when request contains:
- "fix bug", "test", "validate", "verify"
- API endpoints or data processing
- Authentication logic
- Hebrew text processing
- Critical business logic

**For Workflow 3 (Visual Design)** - Use when request contains:
- "UI", "component", "design", "layout"
- "responsive", "mobile", "visual"
- Hebrew/RTL interface issues
- Dashboard or component styling
- Screenshots or visual references provided

### Response Format
Each Claude response will start with:
```
🔄 WORKFLOW SELECTED: [1/2/3] - [Workflow Name]
📋 REASONING: [Why this workflow fits your request]
```

## 🤖 Claude Server Management Protocol

### Mandatory Server Checks (Every Session)
**BEFORE any development work, Claude must:**

1. **Check server status:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   ```

2. **If server not running or returning errors:**
   ```bash
   # Kill any existing processes
   lsof -ti :3000 | xargs kill -9 2>/dev/null || true
   pkill -f "next dev" || true
   
   # Start fresh server from correct directory
   cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
   ```

3. **Verify successful startup:**
   - Wait for "Ready" message
   - Test with curl to ensure 200 response
   - If 500 errors, check for import path issues

### Server Maintenance Rules
- **Always use port 3000** - never accept other ports
- **Run from apps/web directory** - prevents path resolution issues
- **Use background mode** - keeps server persistent during development
- **Monitor server logs** - watch for compilation errors or import issues
- **Kill and restart** if any path alias errors occur

### Import Path Issue Resolution
When encountering `Module not found` errors with `@/` imports:
1. Stop current server immediately
2. Use relative paths as temporary fix (e.g., `../ui/button` instead of `@/components/ui/button`)
3. Restart server from `apps/web` directory
4. Verify resolution with test request

## 🔧 Simplified Git Hooks

### Current Hook Setup (Optimized)
- **Pre-commit** (16 lines): Security + Hebrew/RTL + lint-staged
- **Pre-push** (18 lines): Type-check + tests + Hebrew tests
- **Performance**: ~90% faster than previous complex hooks
- **Maintenance**: Simplified, debuggable, future-proof

### Hook Validation Rules
- ❌ **Forbidden**: Secrets, credentials in code
- ❌ **Forbidden**: Directional CSS (`margin-left`, `padding-right`)
- ✅ **Required**: Hebrew/RTL logical properties
- ✅ **Required**: All authentication tests pass
- ✅ **Required**: TypeScript compilation

---

## 🎯 Critical Reminders for Claude

### Server First Protocol
**EVERY Claude session must begin with:**
1. Check if server is running on port 3000
2. If not, kill any existing processes and start fresh server
3. Verify 200 response before proceeding with any development tasks

### Path Resolution Priority
- **Use relative paths** when `@/` aliases fail (`../ui/button` instead of `@/components/ui/button`)
- **Run from apps/web directory** to avoid Turborepo path conflicts
- **Restart server immediately** if encountering import resolution errors

### Development Flow
1. **Server Status Check** → 2. **Fix Import Issues** → 3. **Development Work** → 4. **Maintain Server**

---

**Always prioritize:** 
1. **Server availability on port 3000** 
2. **Authentication stability and Hebrew/RTL support** 
3. **Import path resolution**