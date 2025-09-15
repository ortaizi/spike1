# CLAUDE.md

Spike is an academic management platform for Israeli university students, focusing on BGU (Ben Gurion University) with Hebrew/RTL first design and Moodle integration.

## 🚀 Server Management (CRITICAL)

**Start server (ALWAYS from apps/web):**
```bash
# Kill existing processes
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start from correct directory
cd apps/web && NODE_OPTIONS='--max-old-space-size=4096' npx next dev --port 3000 &
```

## 📋 Essential Commands

**Development:**
- `npm run dev` - Start all servers
- `npm run build` - Build monorepo
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint with Hebrew/RTL rules
- `npm run validate` - Full validation pipeline

**Testing:**
- `npm run test` - All tests
- `npm run test:auth` - Auth tests (critical)
- `npm run test:hebrew` - Hebrew/RTL tests
- `npm run test:e2e` - E2E tests

**Database:**
- `npm run db:studio` - Supabase interface
- `npm run db:generate` - Generate types

## 🏗️ Architecture

**Tech Stack:**
- Next.js 14 (App Router) + TypeScript
- Supabase PostgreSQL + NextAuth.js
- Tailwind CSS with Hebrew/RTL support
- Python scraper for BGU Moodle integration

**Key Directories:**
- `apps/web/` - Main Next.js app
- `apps/web/lib/auth/` - Authentication system
- `apps/web/middleware.ts` - Route protection
- `packages/database/` - Supabase schema
- `tests/e2e/` - Playwright tests

## 🎨 Code Style

**Hebrew/RTL Rules:**
- Use logical CSS properties (`marginInlineStart` not `marginLeft`)
- Default locale: `he-IL`
- Hebrew academic terminology

**TypeScript:**
- Use `interface` over `type`
- Import types with `import type { ... }`
- Explicit return types for functions

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

## 🚨 Before Commits
- [ ] `npm run validate` passes
- [ ] `npm run test:auth-critical` passes
- [ ] `npm run test:hebrew` passes
- [ ] Use conventional commits (`feat:`, `fix:`, etc.)

## 🎯 Claude Protocol
**EVERY session:**
1. Check server: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
2. If not 200, restart server from `apps/web`
3. Verify before proceeding

## 📋 Best Practices

### 🚀 Server Management
- Always start from `apps/web` directory
- Use port 3000 exclusively
- Kill existing processes before restart
- Monitor for import path errors
- Use background mode for persistence

### 🔧 Development
- Run `npm run validate` before commits
- Use TypeScript interfaces over types
- Import types with `import type { ... }`
- Prefer Server Components over Client Components
- Use App Router conventions (`page.tsx`, `layout.tsx`)

### 🧪 Testing
- Run auth tests before every commit
- Test Hebrew/RTL content with real data
- Use Playwright for E2E with `--headed` for debugging
- Test BGU integration sparingly
- Maintain test isolation and clean state

### 🔐 Authentication
- Validate credentials server-side
- Use middleware for route protection
- Store university credentials encrypted
- Implement proper session management
- Support multi-stage auth flow

### 🌍 Hebrew/RTL
- Use logical CSS properties (`marginInlineStart`)
- Default to `he-IL` locale
- Test with actual Hebrew academic content
- Verify RTL layout in all components
- Use Hebrew terminology consistently

### 📁 Code Organization
- Group related functionality in `/lib`
- Separate auth logic in `/lib/auth`
- Keep components focused and small
- Use proper TypeScript types
- Follow conventional commit format

### 🐛 Debugging
- Check browser console for middleware logs
- Use Playwright traces for E2E debugging
- Monitor Hebrew font loading
- Test API endpoints with curl
- Use React DevTools for component debugging

### 🎨 UI/UX
- Design mobile-first for Hebrew content
- Use Radix UI for accessibility
- Test with Hebrew academic terminology
- Ensure proper RTL text alignment
- Optimize Hebrew font loading