# TypeScript Coding Standards - Spike Platform

## **🏗️ Technology Stack**
- **Next.js 14+** - React framework with App Router
- **Supabase** - Database and authentication backend
- **NextAuth v5** - Authentication framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## **📝 Code Style & Organization**

### **File Naming Convention**
```
✅ Correct naming:
- components/UserProfile.tsx
- lib/auth/auth-provider.ts
- types/database.ts
- hooks/useAuth.ts
- utils/formatDate.ts

❌ Avoid:
- userProfile.tsx
- authProvider.ts
- database-types.ts
```

### **Import Organization**
```typescript
// ✅ Correct import order
// 1. React and Next.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { supabase } from '@supabase/supabase-js';
import { QueryClient, useQuery } from '@tanstack/react-query';

// 3. Internal components and utilities
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// 4. Types and interfaces
import type { User, Course } from '@/types/database';
```

## **🏗️ TypeScript Configuration**

### **Strict TypeScript Settings**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **Type Definitions**
```typescript
// ✅ Define interfaces for all data structures
export interface User {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  faculty: string | null;
  department: string | null;
  yearOfStudy: number | null;
  avatar: string | null;
  preferences: UserPreferences;
  moodleUsername: string | null;
  moodlePassword: string | null;
  moodleLastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: 'he' | 'en';
  notifications: boolean;
  theme: 'light' | 'dark';
  onboardingCompleted: boolean;
  universityId: string;
  universityName: string;
  moodleData?: any;
}
```

## **🔧 Component Standards**

### **React Component Structure**
```typescript
// ✅ Correct component structure
import React from 'react';
import { useSession } from 'next-auth/react';
import type { User } from '@/types/database';

interface DashboardProps {
  userId?: string;
  onUserUpdate?: (user: User) => void;
}

export default function Dashboard({ userId, onUserUpdate }: DashboardProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  // Custom hooks first
  const { user, updateUser } = useAuth(userId);

  // Event handlers
  const handleUserUpdate = useCallback((updatedUser: User) => {
    setLoading(true);
    updateUser(updatedUser)
      .then(() => {
        onUserUpdate?.(updatedUser);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [updateUser, onUserUpdate]);

  // Effects
  useEffect(() => {
    if (status === 'loading') return;
    // Component logic
  }, [status]);

  // Early returns
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <UnauthorizedMessage />;
  }

  // Main render
  return (
    <div className="dashboard">
      <UserProfile user={user} onUpdate={handleUserUpdate} />
    </div>
  );
}
```

### **Custom Hooks**
```typescript
// ✅ Custom hook pattern
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';
import type { User } from '@/types/database';

interface UseUserOptions {
  userId?: string;
  autoRefresh?: boolean;
}

export function useUser({ userId, autoRefresh = true }: UseUserOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}
```

## **🗄️ Database Operations**

### **Supabase Operations**
```typescript
// ✅ Proper Supabase operation pattern
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}
```

### **Type-Safe Database Queries**
```typescript
// ✅ Type-safe database operations
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}
```

## **🔐 Authentication Types**

### **NextAuth v5 Integration**
```typescript
// ✅ Extend NextAuth types
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      studentId: string;
      universityId: string;
      universityName: string;
      moodleData?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    studentId: string;
    universityId: string;
    universityName: string;
    moodleData?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    studentId: string;
    universityId: string;
    universityName: string;
    moodleData?: any;
  }
}
```

## **🔄 State Management**

### **TanStack Query (React Query)**
```typescript
// ✅ React Query pattern
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', updatedUser.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### **Zustand Store**
```typescript
// ✅ Zustand store pattern
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-store' }
  )
);
```

## **🎨 UI Component Types**

### **Component Props**
```typescript
// ✅ Component props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'button',
          `button--${variant}`,
          `button--${size}`,
          loading && 'button--loading'
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

## **🌐 Internationalization**

### **Hebrew RTL Support**
```typescript
// ✅ RTL support types
interface LocalizedText {
  he: string;
  en: string;
}

interface LocalizedContent {
  title: LocalizedText;
  description: LocalizedText;
  button: LocalizedText;
}

// ✅ RTL component
interface RTLContainerProps {
  children: React.ReactNode;
  direction?: 'rtl' | 'ltr';
}

export function RTLContainer({ children, direction = 'rtl' }: RTLContainerProps) {
  return (
    <div dir={direction} className={`rtl-container ${direction}`}>
      {children}
    </div>
  );
}
```

## **🔧 Utility Types**

### **Common Type Utilities**
```typescript
// ✅ Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ✅ API response types
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
```

## **🚀 Performance Types**

### **Lazy Loading**
```typescript
// ✅ Lazy component types
import { lazy, Suspense } from 'react';

const LazyDashboard = lazy(() => import('@/components/Dashboard'));

interface LazyComponentProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyComponent({ fallback, children }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}
```

## **📊 Error Handling**

### **Type-Safe Error Handling**
```typescript
// ✅ Error handling types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }
  
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR');
}
```

## **🔍 Type Guards**

### **Runtime Type Checking**
```typescript
// ✅ Type guards
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    response.error !== null
  );
}
```

---

**Remember:** Always prioritize type safety, maintainability, and developer experience in all TypeScript code. 