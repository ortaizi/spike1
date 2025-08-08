# Testing Standards - Spike Platform

## **🏗️ Technology Stack**
- **Next.js 14+** - React framework with App Router
- **Supabase** - Database and authentication backend
- **NextAuth v5** - Authentication framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## **🧪 Testing Strategy**

### **Testing Pyramid**
- **Unit Tests** (70%) - Individual components and functions
- **Integration Tests** (20%) - API routes and database operations
- **E2E Tests** (10%) - Critical user flows

### **Testing Tools**
- **Jest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW (Mock Service Worker)** - API mocking

## **🔧 Unit Testing**

### **Component Testing**
```typescript
// ✅ Correct component test pattern
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/app/dashboard/page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('Dashboard', () => {
  it('should display user information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/ברוך הבא/)).toBeInTheDocument();
  });
});
```

### **API Route Testing**
```typescript
// ✅ Correct API route test pattern
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/route';

describe('Users API', () => {
  it('should return users list', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('users');
  });
});
```

### **Supabase Operations Testing**
```typescript
// ✅ Correct Supabase test pattern
import { supabase } from '@/lib/db';

// Mock Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [{ id: '1', name: 'Test User' }],
          error: null
        }))
      }))
    }))
  }
}));

describe('User Operations', () => {
  it('should fetch user by email', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com');
    
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});
```

## **🔗 Integration Testing**

### **Authentication Flow Testing**
```typescript
// ✅ Test authentication flow
describe('Authentication Flow', () => {
  it('should authenticate university user', async () => {
    const credentials = {
      username: 'testuser',
      password: 'testpass',
      universityId: 'bgu'
    };
    
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    expect(response.status).toBe(200);
  });
});
```

### **Database Integration Testing**
```typescript
// ✅ Test database operations
describe('Database Operations', () => {
  it('should create and retrieve user', async () => {
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        name: 'Test User'
      })
      .select()
      .single();
    
    expect(createError).toBeNull();
    expect(newUser.email).toBe('test@example.com');
    
    // Retrieve user
    const { data: retrievedUser, error: retrieveError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    expect(retrieveError).toBeNull();
    expect(retrievedUser.name).toBe('Test User');
  });
});
```

## **🌐 E2E Testing**

### **Critical User Flows**
```typescript
// ✅ E2E test for login flow
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/signin');
  
  // Fill login form
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'testpass');
  await page.selectOption('[name="universityId"]', 'bgu');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('ברוך הבא');
});
```

### **Hebrew RTL Testing**
```typescript
// ✅ Test RTL layout
test('RTL layout displays correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Check RTL direction
  await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');
  
  // Check Hebrew text alignment
  const hebrewText = page.locator('.hebrew-text');
  await expect(hebrewText).toHaveCSS('text-align', 'right');
});
```

## **🎯 Test Categories**

### **Authentication Tests**
- University login flow
- Session management
- Password hashing
- JWT token validation
- Logout functionality

### **Database Tests**
- CRUD operations
- Data validation
- Error handling
- Real-time subscriptions
- Connection management

### **UI Component Tests**
- Component rendering
- User interactions
- Form validation
- Loading states
- Error states
- Accessibility

### **API Route Tests**
- Request/response handling
- Authentication middleware
- Error responses
- Data validation
- Rate limiting

## **📊 Test Coverage**

### **Required Coverage**
- **Components**: 80% minimum
- **API Routes**: 90% minimum
- **Database Operations**: 95% minimum
- **Authentication**: 100% minimum

### **Coverage Reporting**
```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report
npm run test:report
```

## **🔧 Test Configuration**

### **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/apps/web/$1',
  },
  collectCoverageFrom: [
    'apps/web/**/*.{ts,tsx}',
    '!apps/web/**/*.d.ts',
    '!apps/web/**/*.stories.{ts,tsx}',
  ],
};
```

### **Playwright Configuration**
```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

## **🚀 Performance Testing**

### **Load Testing**
- API response times
- Database query performance
- Authentication speed
- Real-time subscription latency

### **Memory Testing**
- Component memory leaks
- Database connection leaks
- Authentication session cleanup

## **🔒 Security Testing**

### **Authentication Security**
- Password strength validation
- Session hijacking prevention
- CSRF protection
- Rate limiting

### **Data Security**
- Input sanitization
- SQL injection prevention
- XSS protection
- Data encryption

## **📝 Test Documentation**

### **Test Naming Convention**
```typescript
// ✅ Descriptive test names
describe('User Authentication', () => {
  it('should authenticate valid university credentials', () => {});
  it('should reject invalid credentials', () => {});
  it('should handle network errors gracefully', () => {});
});
```

### **Test Organization**
```
tests/
├── unit/
│   ├── components/
│   ├── api/
│   └── utils/
├── integration/
│   ├── auth/
│   ├── database/
│   └── api/
└── e2e/
    ├── auth-flow.spec.ts
    ├── dashboard.spec.ts
    └── moodle-sync.spec.ts
```

---

**Remember:** Write tests that are maintainable, readable, and provide real value in catching regressions and ensuring code quality. 