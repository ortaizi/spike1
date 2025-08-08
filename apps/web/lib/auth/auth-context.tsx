'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { UNIVERSITIES } from './auth-provider';
import type { UniversityConfig, AuthResult } from './types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  user: any;
  login: (username: string, password: string, universityId: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  universities: UniversityConfig[];
  selectedUniversity: UniversityConfig | null;
  setSelectedUniversity: (university: UniversityConfig | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('🔍 HYDRATION DEBUG - AuthProvider mounting', {
      isServer: typeof window === 'undefined',
      status,
      hasSession: !!session
    });
    setIsClient(true);
  }, [status, session]);

  const login = async (username: string, password: string, universityId: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        username,
        password,
        universityId,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'אחד הפרטים אינו נכון, נסה שוב' };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'שגיאה בהתחברות למערכת' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!session,
    isLoading: isLoading, // רק טעינה של תהליך ההתחברות
    isInitializing: status === 'loading', // טעינה ראשונית של NextAuth
    user: session?.user,
    login,
    logout,
    universities: UNIVERSITIES,
    selectedUniversity,
    setSelectedUniversity,
  };

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 