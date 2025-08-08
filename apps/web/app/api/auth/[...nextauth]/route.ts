import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { supabase } from "../../../../lib/db"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'שם משתמש', type: 'text' },
        password: { label: 'סיסמה', type: 'password' },
        universityId: { label: 'מוסד לימודים', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.universityId) {
          console.log('Missing credentials');
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;
        const universityId = credentials.universityId as string;

        try {
          console.log('Attempting authentication for:', username, 'at university:', universityId);
          
          // For now, just return a mock user for credentials
          // In a real app, you'd authenticate with the university
          return {
            id: `user_${Date.now()}`,
            name: username,
            email: `${username}@university.com`,
            studentId: username,
            universityId: universityId,
            universityName: universityId
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback called with user:', user);
      
      // If this is a Google sign-in, create or update user in database
      if (account?.provider === 'google' && user) {
        try {
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
          }

          if (!existingUser) {
            // Create new user
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                google_id: user.id,
                name: user.name,
                email: user.email,
                profile_picture: user.image,
                is_setup_complete: false
              });

            if (insertError) {
              console.error('Error creating user:', insertError);
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }
      
      return !!user;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl);
      
      // Use APP_URL from environment variables
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      console.log('Using APP_URL:', appUrl);
      
      // If the URL is the signin page, redirect to dashboard
      if (url.includes('/auth/signin')) {
        console.log('User authenticated, redirecting to dashboard');
        return `${appUrl}/dashboard`;
      }
      
      // If URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${appUrl}${url}`;
      }
      
      // If URL is already absolute and matches our domain, return as is
      if (url.startsWith(appUrl)) {
        return url;
      }
      
      // For external URLs or other cases, return the original URL
      console.log('Returning original URL:', url);
      return url;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback - token:', token, 'user:', user);
      if (user) {
        token.id = user.id;
        if (account?.provider === 'google') {
          token.provider = 'google';
        } else if (account?.provider === 'credentials') {
          token.provider = 'credentials';
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (token) {
        session.user.id = token.sub!;
        // Add provider to session if it exists in token
        if (token.provider) {
          (session.user as any).provider = token.provider as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('SignIn event - user:', user, 'isNewUser:', isNewUser);
    },
    async signOut({ session, token }: any) {
      console.log('SignOut event - session:', session, 'token:', token);
    },
    async session({ session, token }) {
      console.log('Session event - session:', session, 'token:', token);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === 'true',
})

export { handler as GET, handler as POST } 