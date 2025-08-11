import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { supabase } from '../db';
import { env } from '../env';
import type { AuthOptions, SessionStrategy } from 'next-auth';
import { UNIVERSITIES } from './auth-provider';
import { authenticateWithUniversity } from './auth-provider';
import { validateUniversityEmail, formatHebrewError } from './hebrew-auth-errors';

// Enhanced interface for dual-stage authentication
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      googleId?: string;
      provider: 'google' | 'dual-stage-complete';
      universityId?: string;
      universityName?: string;
      lastSync?: string;
      isDualStageComplete: boolean;
      hasValidCredentials?: boolean;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    googleId?: string;
    provider: 'google' | 'dual-stage-complete';
    universityId?: string;
    universityName?: string;
    lastSync?: string;
    isDualStageComplete?: boolean;
  }
  
  interface JWT {
    provider?: string;
    universityId?: string;
    universityName?: string;
    lastSync?: string;
    isDualStageComplete?: boolean;
  }
}

// Helper function to create or update Google user
async function createOrUpdateGoogleUser(user: any, account: any) {
  try {
    console.log('🔄 Creating/updating Google user:', user.email);
    console.log('🔍 User object:', { id: user.id, name: user.name, email: user.email, image: user.image });
    
    // Check if user exists by email (since google_id might not exist)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return null;
    }

    console.log('🔍 User lookup result:', { existingUser: !!existingUser, fetchError: fetchError?.code });

    if (!existingUser) {
      console.log('👤 Creating new user...');
      // Create new user using only columns that exist in the database
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name,
          google_id: user.id,
          profile_picture: user.image,
          university_id: null,
          is_setup_complete: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
        return null;
      }
      
      console.log('✅ New Google user created:', newUser?.email);
      console.log('✅ New user data:', { id: newUser?.id, email: newUser?.email });
      return newUser;
    } else {
      // Update existing user with available fields
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          updatedat: new Date().toISOString(),
          profile_picture: user.image // Update avatar in case it changed
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
      }
      
      console.log('✅ Existing Google user updated:', existingUser.email);
      return updatedUser || existingUser;
    }
  } catch (error) {
    console.error('❌ CRITICAL Error in createOrUpdateGoogleUser:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return null;
  }
}

// Helper function to verify Google user exists for credentials auth
async function verifyGoogleUserExists(googleUserId: string) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleUserId)
      .single();

    if (error || !user) {
      console.error('Google user not found for credentials auth:', googleUserId);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying Google user:', error);
    return null;
  }
}

// Helper function to save university credentials (encrypted)
async function saveUniversityCredentials(userId: string, credentials: any) {
  try {
    // Import encryption utilities
    const { CredentialsEncryption } = await import('./encryption');
    
    // Encrypt credentials
    const encrypted = CredentialsEncryption.encryptCredentials(
      credentials.username,
      credentials.password
    );
    
    // Save to database
    const { error } = await supabase
      .from('university_credentials')
      .upsert({
        user_id: userId,
        university_id: credentials.universityId,
        encrypted_username: encrypted.encryptedUsername,
        encrypted_password: encrypted.encryptedPassword,
        auth_tag: encrypted.authTag,
        iv: encrypted.iv,
        last_sync: null,
        is_valid: true,
        credentials_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,university_id'
      });
      
    if (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
    
    // Update user setup status
    await supabase
      .from('users')
      .update({ 
        is_setup_complete: true,
        updatedat: new Date().toISOString()
      })
      .eq('id', userId);
    
    console.log('✅ University credentials saved successfully');
    
  } catch (error) {
    console.error('Error in saveUniversityCredentials:', error);
    throw error;
  }
}

// Unified NextAuth configuration
export const unifiedAuthOptions: AuthOptions = {
  providers: [
    // Stage 1: Google OAuth
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        }
      }
    }),
    
    // Stage 2: University Credentials (Enhanced)
    Credentials({
      id: 'university-credentials',
      name: 'university-credentials', 
      credentials: {
        username: { label: 'שם משתמש', type: 'text' },
        password: { label: 'סיסמה', type: 'password' },
        universityId: { label: 'מוסד לימודים', type: 'text' },
        googleUserId: { label: 'Google User ID', type: 'hidden' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password || !credentials?.universityId || !credentials?.googleUserId) {
            console.log('Missing required credentials for dual-stage auth');
            return null;
          }

          // Verify Google user exists and is authenticated
          const googleUser = await verifyGoogleUserExists(credentials.googleUserId);
          if (!googleUser) {
            console.log('Google user not found for dual-stage auth');
            return null;
          }
          
          // Authenticate with university
          console.log('🔐 Authenticating with university:', credentials.universityId);
          const authResult = await authenticateWithUniversity(
            credentials.username,
            credentials.password, 
            credentials.universityId
          );
          
          if (!authResult.success) {
            console.log('University authentication failed:', authResult.message);
            
            // Log failed attempt
            await supabase.from('auth_attempts').insert({
              user_identifier: googleUser.email,
              attempt_type: 'moodle',
              university_id: credentials.universityId,
              success: false,
              error_message: authResult.message,
              created_at: new Date().toISOString()
            });
            
            return null;
          }
          
          // Save encrypted credentials
          await saveUniversityCredentials(googleUser.id, credentials);
          
          // Log successful attempt
          await supabase.from('auth_attempts').insert({
            user_identifier: googleUser.email,
            attempt_type: 'moodle',
            university_id: credentials.universityId,
            success: true,
            created_at: new Date().toISOString()
          });
          
          // Start background sync
          try {
            const { startBackgroundSync } = await import('../background-sync');
            const syncResult = await startBackgroundSync(googleUser.id, {
              moodle_username: credentials.username,
              moodle_password: credentials.password,
              university_id: credentials.universityId
            });
            
            console.log('🔄 Background sync started:', syncResult.jobId);
          } catch (syncError) {
            console.warn('⚠️ Background sync failed to start:', syncError);
          }
          
          return {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            image: googleUser.profile_picture,
            googleId: googleUser.google_id,
            provider: 'dual-stage-complete',
            universityId: credentials.universityId,
            universityName: authResult.university?.name,
            isDualStageComplete: true
          };
        } catch (error) {
          console.error('Error in university credentials authorization:', error);
          return null;
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback:', { provider: account?.provider, userId: user?.id });
      console.log('🔐 Full user object:', user);
      console.log('🔐 Full account object:', account);
      
      if (account?.provider === 'google') {
        console.log('🎯 Processing Google OAuth...');
        
        // Validate university email domain
        const emailValidation = validateUniversityEmail(user.email!);
        if (!emailValidation.isValid) {
          console.error('❌ Invalid university domain:', emailValidation.error);
          console.error('🏫 User email domain not supported:', user.email?.split('@')[1]);
          
          // Log failed attempt
          await supabase.from('auth_attempts').insert({
            user_identifier: user.email!,
            attempt_type: 'google',
            success: false,
            error_message: formatHebrewError('InvalidDomain', emailValidation.error),
            created_at: new Date().toISOString()
          });
          
          return false;
        }
        
        console.log('✅ Valid university domain:', emailValidation.university?.name);
        
        // Stage 1: Google OAuth completed
        const googleUser = await createOrUpdateGoogleUser(user, account);
        
        if (!googleUser) {
          console.error('❌ Failed to create/update Google user - returning false');
          return false;
        }
        
        console.log('✅ Google user processed successfully');
        
        // Log successful Google auth
        await supabase.from('auth_attempts').insert({
          user_identifier: user.email!,
          attempt_type: 'google',
          success: true,
          created_at: new Date().toISOString()
        });
        
        console.log('✅ Google authentication successful, proceeding to Stage 2');
        return true;
      }
      
      if (account?.provider === 'university-credentials') {
        // Stage 2: University credentials completed
        console.log('✅ Dual-stage authentication completed successfully');
        return true;
      }
      
      return false;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect callback:', { url, baseUrl });
      
      const appUrl = env.APP_URL || baseUrl;
      
      // After Google OAuth → check onboarding status
      if (url.includes('/api/auth/callback/google')) {
        // For now, always redirect to onboarding
        // TODO: Add logic to check if user already completed onboarding
        console.log('Redirecting to onboarding after Google auth');
        return `${appUrl}/onboarding`;
      }
      
      // After university credentials → redirect to verification
      if (url.includes('university-credentials')) {
        console.log('Redirecting to verification after university auth');
        return `${appUrl}/auth/verify`;
      }
      
      // Default redirect handling
      if (url.startsWith('/')) {
        return `${appUrl}${url}`;
      }
      
      if (url.startsWith(appUrl)) {
        return url;
      }
      
      return appUrl;
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log('🎫 JWT callback:', { trigger, provider: account?.provider, userId: user?.id });
      
      if (user && account) {
        token.provider = account.provider;
        
        if (account.provider === 'google') {
          // Store Google user info in JWT
          token.googleId = user.id;
          token.isDualStageComplete = false;
        } else if (account.provider === 'university-credentials') {
          // Store university info in JWT
          token.universityId = (user as any).universityId;
          token.universityName = (user as any).universityName;
          token.isDualStageComplete = true;
          token.lastSync = new Date().toISOString();
        }
      }
      
      // Refresh session data if needed
      if (trigger === 'update' && token.sub) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select(`
              *,
              university_credentials (
                university_id,
                last_sync
              )
            `)
            .eq('id', token.sub)
            .single();
            
          if (userData) {
            token.isDualStageComplete = userData.is_setup_complete;
            token.universityId = userData.university_credentials?.[0]?.university_id;
            token.lastSync = userData.university_credentials?.[0]?.last_sync;
            
            if (token.universityId) {
              const university = UNIVERSITIES.find(u => u.id === token.universityId);
              token.universityName = university?.name;
            }
          }
        } catch (error) {
          console.error('Error refreshing JWT session data:', error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      console.log('🏠 Session callback:', { userId: token.sub, provider: token.provider });
      
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.googleId = token.googleId as string;
        session.user.provider = token.provider === 'university-credentials' ? 'dual-stage-complete' : 'google';
        session.user.universityId = token.universityId as string;
        session.user.universityName = token.universityName as string;
        session.user.lastSync = token.lastSync as string;
        session.user.isDualStageComplete = token.isDualStageComplete as boolean || false;
        session.user.hasValidCredentials = !!token.universityId;
      }
      
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('📊 SignIn event:', { 
        provider: account?.provider, 
        userId: user.id, 
        isNewUser,
        email: user.email 
      });
      
      // Track user session
      if (user.id && account) {
        try {
          await supabase.from('user_sessions').insert({
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: user.id,
            session_type: account.provider === 'university-credentials' ? 'dual_stage_complete' : 'google_only',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to track user session:', error);
        }
      }
    },
    
    async signOut({ session, token }) {
      console.log('👋 SignOut event:', { userId: token?.sub });
      
      // Deactivate user sessions
      if (token?.sub) {
        try {
          await supabase
            .from('user_sessions')
            .update({ 
              is_active: false,
              last_activity: new Date().toISOString()
            })
            .eq('user_id', token.sub)
            .eq('is_active', true);
        } catch (error) {
          console.warn('Failed to deactivate user sessions:', error);
        }
      }
    }
  },
  
  secret: env.AUTH_SECRET,
  debug: env.AUTH_DEBUG,
  trustHost: true
};

// Export the configured NextAuth instance
const authInstance = NextAuth(unifiedAuthOptions);
export const { handlers, auth, signIn, signOut } = authInstance;

// Export for backward compatibility with existing code
export default unifiedAuthOptions;