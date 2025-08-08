import 'next-auth';

declare module "next-auth" {
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

export interface UniversityConfig {
  id: string;
  name: string;
  domain: string;
  moodleUrl: string;
  apiEndpoint: string;
  logo: string;
}

export interface AuthError {
  type: 'CredentialsSignin' | 'CallbackRouteError' | 'ConfigurationError';
  message: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  universityId: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
} 