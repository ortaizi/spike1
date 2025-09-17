import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      isSetupComplete?: boolean;
      universityId?: string;
      provider?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    universityId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    googleId?: string;
    provider?: string;
  }
}
