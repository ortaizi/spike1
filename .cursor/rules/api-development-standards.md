# API Development Standards - Spike Platform

## **🏗️ Architecture Principles**

### **Technology Stack**
- **Next.js 14+** - React framework with App Router
- **Supabase** - Database and authentication backend
- **NextAuth v5** - Authentication framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### **Monorepo Structure**
- Use Turborepo for build orchestration
- Follow NPM workspaces pattern
- Maintain clear separation between apps and packages

### **Database Layer**
- **Use Supabase exclusively** - No Prisma or other ORMs
- Use `@supabase/supabase-js` client for all database operations
- Implement proper error handling for Supabase operations
- Use TypeScript interfaces for type safety

### **API Routes (Next.js App Router)**
```typescript
// ✅ Correct pattern
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('column', value);
    
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## **🔐 Authentication & Authorization**

### **NextAuth v5 Integration**
- Use NextAuth v5 for authentication
- Implement university-specific login (BGU, TAU, HUJI)
- Store user data in Supabase users table
- Use JWT strategy for sessions

### **Protected Routes**
```typescript
// ✅ Correct pattern for protected API routes
import { auth } from '@/lib/auth/auth-provider';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of the logic
}
```

## **📊 Data Management**

### **Supabase Operations**
- Use proper error handling for all Supabase operations
- Implement optimistic updates where appropriate
- Use real-time subscriptions for live data
- Cache frequently accessed data

### **Type Safety**
```typescript
// ✅ Define interfaces for all database tables
export interface User {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  faculty: string | null;
  department: string | null;
  yearOfStudy: number | null;
  avatar: string | null;
  preferences: any;
  moodleUsername: string | null;
  moodlePassword: string | null;
  moodleLastSync: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## **🔄 State Management**

### **TanStack Query (React Query)**
- Use for server state management
- Implement proper caching strategies
- Handle loading and error states
- Use optimistic updates for better UX

### **Zustand**
- Use for client state management
- Keep stores simple and focused
- Implement proper TypeScript types

## **🎨 UI/UX Standards**

### **Component Architecture**
- Use Radix UI primitives for accessibility
- Implement proper loading states
- Handle error states gracefully
- Support RTL (Hebrew) layout

### **Styling**
- Use Tailwind CSS for styling
- Follow design system colors and spacing
- Implement responsive design
- Support dark/light themes

## **🌐 Internationalization**

### **Hebrew Support**
- Use Next.js i18n for Hebrew/English
- Implement RTL layout support
- Use proper Hebrew fonts (Noto Sans Hebrew)
- Handle text direction correctly

## **🔧 Development Standards**

### **Environment Variables**
- Use `.env.development` and `.env.production` for environment-specific configs
- Update `env.example` when adding new variables
- Use proper TypeScript types for env vars

### **Error Handling**
```typescript
// ✅ Proper error handling pattern
try {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch users');
  }
  return Response.json({ data });
} catch (error) {
  console.error('API error:', error);
  return Response.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  );
}
```

### **Logging**
- Use console.log for development
- Implement proper error logging
- Log authentication events
- Track user interactions

## **🚀 Performance**

### **Optimization**
- Use Next.js App Router for better performance
- Implement proper caching strategies
- Optimize bundle size with Turborepo
- Use image optimization

### **Monitoring**
- Monitor API response times
- Track database query performance
- Monitor authentication success rates
- Track user engagement metrics

## **🔒 Security**

### **Authentication**
- Use NextAuth v5 for secure authentication
- Validate university credentials
- Implement proper session management
- Use secure environment variables

### **Data Protection**
- Validate all input data
- Sanitize user inputs
- Implement proper CORS policies
- Use HTTPS in production

## **📝 Code Quality**

### **TypeScript**
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Use type guards where appropriate
- Avoid `any` types

### **Testing**
- Write unit tests for API routes
- Test authentication flows
- Test error handling scenarios
- Use proper mocking for external services

## **🔄 Integration**

### **Moodle Integration**
- Implement proper scraping with Python
- Handle authentication with university systems
- Sync data with Supabase
- Implement proper error handling for external APIs

### **Real-time Features**
- Use Supabase real-time subscriptions
- Implement proper connection management
- Handle reconnection scenarios
- Optimize for mobile devices

---

**Remember:** Always prioritize user experience, security, and maintainability in all API development decisions. 