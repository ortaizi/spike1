# 🎓 Spike Academic Platform - Development Setup Guide

**Enterprise-Grade Configuration System for Israeli Academic Management Platform**

---

## 📋 Overview

This document provides a comprehensive guide for setting up the Spike Academic Platform development environment with the new unified configuration system. The platform is designed specifically for Israeli university students with Hebrew-first design and RTL support.

## 🏗️ Architecture Overview

```
spike/
├── .cursorrules                 # ✨ NEW: Unified development rules
├── .eslintrc.js                # ✨ NEW: Enterprise ESLint config
├── .prettierrc                 # ✨ NEW: RTL-aware formatting
├── .prettierignore             # ✨ NEW: Format exclusions
├── tsconfig.json               # 🔄 ENHANCED: Strict production config
├── package.json                # 🔄 ENHANCED: New scripts & deps
├── .lintstagedrc.js            # ✨ NEW: Pre-commit validation
├── .husky/                     # ✨ NEW: Git hooks
│   ├── pre-commit              # Hebrew/RTL validation
│   └── pre-push                # Comprehensive testing
├── .github/workflows/          # ✨ NEW: CI/CD pipeline
│   └── ci.yml                  # Academic platform CI
├── env.example                 # ✨ NEW: Complete env template
├── vitest.config.ts            # ✨ NEW: Testing configuration
├── test-setup.ts               # ✨ NEW: Hebrew test environment
├── playwright.config.ts        # ✨ NEW: E2E with Hebrew locale
└── DEVELOPMENT_SETUP.md        # ✨ NEW: This guide
```

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Required software
node >= 18.0.0
npm >= 10.0.0
git >= 2.30.0

# For Python scraper service
python >= 3.11
```

### 2. Clone & Install
```bash
# Clone repository
git clone <repository-url>
cd Spike

# Install dependencies with new configuration
npm run fresh-install

# Setup environment
cp env.example .env.development
# Edit .env.development with your credentials
```

### 3. Initialize Git Hooks
```bash
# Setup Husky hooks (automatic with npm install)
npm run prepare

# Test pre-commit hooks
npm run pre-commit
```

### 4. Start Development
```bash
# Start with full validation
npm run dev

# Debug mode
npm run dev:debug

# Development with type checking
npm run type-check && npm run dev
```

---

## 🔧 New Configuration System

### 📝 `.cursorrules` - Unified Development Rules

**The central source of truth for all development standards.**

Key features:
- ✅ Enterprise-grade TypeScript standards
- ✅ Hebrew-first UI/UX guidelines
- ✅ Academic platform specific patterns
- ✅ Next.js 14 + Supabase best practices
- ✅ RTL layout requirements
- ✅ BGU integration standards

### 🔍 ESLint Configuration (`.eslintrc.js`)

**Enterprise-grade linting with academic focus.**

New rules include:
- 🚨 **Critical Rules**: No `any`, strict type checking
- 🎨 **React & JSX**: RTL component validation
- 🌍 **Hebrew/RTL**: Text direction checking
- 🎓 **Academic Specific**: Course code validation
- ♿ **Accessibility**: ARIA compliance for Hebrew content

```bash
# Lint with new rules
npm run lint

# Auto-fix issues
npm run lint:fix
```

### 🎨 Prettier Configuration (`.prettierrc`)

**RTL-aware code formatting.**

Features:
- ✅ Hebrew text preservation
- ✅ RTL-compatible formatting
- ✅ Academic file type support
- ✅ Consistent styling across monorepo

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### 🔒 TypeScript Configuration (`tsconfig.json`)

**Production-grade TypeScript with enterprise standards.**

Enhanced with:
- 🔒 **Strict Mode**: All strict checks enabled
- 🚨 **Error Prevention**: Runtime error prevention
- 📁 **Monorepo Paths**: Complete path mapping
- ⚡ **Performance**: Optimized compilation

```bash
# Type check
npm run type-check
```

---

## 🧪 Testing System

### Unit Testing (Vitest)

**Hebrew-aware component testing.**

```bash
# Run unit tests
npm run test:unit

# With coverage
npm run test:coverage

# Watch mode
npm run test:unit -- --watch
```

Test setup includes:
- 🌍 Hebrew locale (`he-IL`)
- 📅 Academic calendar context
- 🎓 BGU-specific mocks
- ♿ RTL accessibility testing

### E2E Testing (Playwright)

**Multi-browser testing with Hebrew support.**

```bash
# Run E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual

# Interactive mode
npx playwright test --ui
```

Features:
- 🌍 Hebrew locale testing
- 📱 Mobile RTL validation
- 🎓 Academic workflow testing
- 📊 Accessibility compliance

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Comprehensive academic platform validation.**

Pipeline stages:
1. **🔧 Setup & Validation**
   - Package validation
   - Hebrew content checking
   - Dependency caching

2. **🔍 Code Quality**
   - TypeScript type checking
   - ESLint validation
   - Prettier formatting
   - Hebrew/RTL validation

3. **🧪 Testing**
   - Unit tests with coverage
   - Integration testing
   - E2E testing (Hebrew locale)

4. **🔒 Security**
   - NPM audit
   - Secret scanning
   - Academic data compliance

5. **📦 Build & Deploy**
   - Production build
   - Bundle analysis
   - Vercel deployment

```bash
# Run full validation locally
npm run validate

# Security audit
npm run security:audit
```

---

## 🎓 Academic Platform Features

### Hebrew/RTL Support

**Complete right-to-left layout system.**

Configuration includes:
- 🌍 `he-IL` locale throughout
- 📅 Hebrew calendar integration
- 🎨 RTL-aware component styling
- ♿ Accessibility for Hebrew users

### BGU Integration

**Ben Gurion University specific features.**

Standards cover:
- 🏫 Course code format (`201-1-1234`)
- 🎓 Student ID validation (`123456789`)
- 📅 Academic year cycle (Oct-Sep)
- 📚 Hebrew course names

### Environment Management

**Comprehensive configuration template.**

The `env.example` file includes:
- 🗄️ **Database**: Supabase configuration
- 🔐 **Authentication**: NextAuth v5 setup
- 🏫 **Moodle**: BGU integration settings
- 📊 **Monitoring**: Analytics and error tracking
- 🌍 **Localization**: Hebrew/RTL configuration

---

## 🔄 Development Workflow

### Daily Development

```bash
# Start new feature
git checkout -b feature/hebrew-assignment-ui

# Development with validation
npm run dev

# Before committing (automatic via husky)
npm run pre-commit

# Push with full validation
git push origin feature/hebrew-assignment-ui
```

### Code Quality Gates

**Automatic validation at every step:**

1. **Pre-commit** (`.husky/pre-commit`):
   - ✅ Merge conflict detection
   - ✅ Secret scanning
   - ✅ Hebrew text validation
   - ✅ Lint-staged execution

2. **Pre-push** (`.husky/pre-push`):
   - ✅ TypeScript validation
   - ✅ Unit tests
   - ✅ Linting
   - ✅ Format checking

3. **CI Pipeline**:
   - ✅ Full test suite
   - ✅ Security audit
   - ✅ Build validation
   - ✅ Deployment

### Scripts Overview

```bash
# Development
npm run dev                     # Start development server
npm run dev:debug              # Development with debugging
npm run build                  # Production build
npm run start:prod             # Production server

# Code Quality
npm run type-check             # TypeScript validation
npm run lint                   # ESLint checking
npm run lint:fix               # Auto-fix linting issues
npm run format                 # Format with Prettier
npm run format:check           # Check formatting

# Testing
npm run test                   # Run all tests
npm run test:unit              # Unit tests only
npm run test:e2e               # E2E tests only
npm run test:visual            # Visual regression tests
npm run test:coverage          # Coverage report

# Database
npm run db:generate            # Generate database types
npm run db:push                # Push schema changes
npm run db:migrate             # Run migrations
npm run db:seed                # Seed test data
npm run db:studio              # Open Prisma studio

# Maintenance
npm run clean                  # Clean build artifacts
npm run fresh-install          # Clean install dependencies
npm run deps:update            # Update dependencies
npm run security:audit         # Security audit

# Validation
npm run validate               # Full validation suite
npm run pre-commit             # Pre-commit checks
npm run pre-push               # Pre-push validation
```

---

## 🛠️ IDE Setup

### VS Code Configuration

**Recommended extensions:**

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

**Settings for Hebrew development:**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.associations": {
    ".cursorrules": "plaintext"
  }
}
```

---

## 🎯 Best Practices

### Code Quality

1. **Follow .cursorrules**: The unified source of truth
2. **Hebrew-First**: Design for Hebrew users first
3. **Type Safety**: Use strict TypeScript throughout
4. **Testing**: Write tests for Hebrew content
5. **Accessibility**: Support screen readers in Hebrew

### Academic Platform

1. **BGU Standards**: Follow university conventions
2. **Academic Calendar**: Use Hebrew calendar integration
3. **Course Codes**: Validate BGU format (`XXX-X-XXXX`)
4. **Grade Scale**: Use Israeli 0-100 scale
5. **Student Privacy**: Protect academic data

### Performance

1. **Bundle Size**: Monitor with `npm run build:analyze`
2. **Core Web Vitals**: Maintain green scores
3. **Hebrew Fonts**: Optimize font loading
4. **RTL Layout**: Efficient CSS for direction changes
5. **Academic Data**: Cache course and assignment data

---

## 🚨 Troubleshooting

### Common Issues

**1. TypeScript Errors**
```bash
# Clear cache and reinstall
npm run clean && npm run fresh-install
npm run type-check
```

**2. Linting Issues**
```bash
# Auto-fix most issues
npm run lint:fix
npm run format
```

**3. Test Failures**
```bash
# Clear test cache
npx vitest run --reporter=verbose
npx playwright test --debug
```

**4. Hebrew Text Issues**
```bash
# Check file encoding
file -bi apps/web/components/**/*.tsx
# Should show: charset=utf-8
```

**5. Build Failures**
```bash
# Clean build
npm run clean
npm run build

# Check environment
cp env.example .env.development
# Fill in required values
```

### Getting Help

1. **Check .cursorrules**: Complete development guide
2. **Review ESLint errors**: Specific rule violations
3. **Test with Hebrew locale**: Use `he-IL` for testing
4. **Academic context**: Consider BGU-specific requirements
5. **RTL validation**: Test right-to-left layouts

---

## 📊 Summary of Changes

### ✨ New Files Created

| File | Purpose | Features |
|------|---------|----------|
| `.cursorrules` | Unified development rules | Enterprise standards, Hebrew support |
| `.eslintrc.js` | Code quality enforcement | Academic-specific linting |
| `.prettierrc` | Code formatting | RTL-aware formatting |
| `.lintstagedrc.js` | Pre-commit validation | Hebrew content validation |
| `.husky/pre-commit` | Git hooks | Comprehensive checking |
| `.github/workflows/ci.yml` | CI/CD pipeline | Academic platform testing |
| `env.example` | Environment template | Complete configuration guide |
| `vitest.config.ts` | Unit testing setup | Hebrew locale testing |
| `test-setup.ts` | Test environment | Academic context mocking |
| `playwright.config.ts` | E2E testing | Multi-browser Hebrew testing |

### 🔄 Enhanced Files

| File | Enhancements | Benefits |
|------|-------------|----------|
| `tsconfig.json` | Strict configuration | Production-grade type safety |
| `package.json` | New scripts & dependencies | Enhanced development workflow |
| `.gitignore` | Updated patterns | Better file exclusions |

---

**🎯 Result: Enterprise-grade development environment specifically designed for Hebrew-first academic platform development with complete automation and validation.**

**Next Steps:**
1. Set up your local environment using this guide
2. Review the `.cursorrules` file for detailed standards
3. Start developing with automatic validation
4. Contribute to the academic platform with confidence

---

**Questions? Check the `.cursorrules` file for comprehensive documentation or reach out to the development team.**
