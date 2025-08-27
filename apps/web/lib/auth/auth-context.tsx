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
    setIsClient(true);
  }, []);

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

  // Check for dual-stage authentication completion
  const isDualStageComplete = session?.user?.isDualStageComplete === true;
  
  const value: AuthContextType = {
    isAuthenticated: isClient ? !!session && isDualStageComplete : false,
    isLoading: isLoading,
    isInitializing: status === 'loading' || !isClient,
    user: session?.user,
    login,
    logout,
    universities: UNIVERSITIES,
    selectedUniversity,
    setSelectedUniversity,
  };

  // Prevent hydration mismatch by ensuring consistent initial state
  if (!isClient) {
    return (
      <AuthContext.Provider value={{
        ...value,
        isAuthenticated: false,
        isInitializing: true
      }}>
        {children}
      </AuthContext.Provider>
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