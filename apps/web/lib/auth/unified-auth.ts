import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { supabase } from '../db';
import { supabaseAdmin } from '../database/service-role';
import { env } from '../env';
import type { AuthOptions, SessionStrategy } from 'next-auth';
import { UNIVERSITIES, authenticateWithUniversity } from './university-auth';
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
    
    // Check if user exists by google_id first (primary), then by email
    let existingUser = null;
    let fetchError = null;
    
    // Try to find by google_id first
    const { data: existingByGoogleId, error: googleIdError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('google_id', user.id)
      .single();
      
    if (googleIdError && googleIdError.code !== 'PGRST116') {
      console.error('❌ Error fetching user by google_id:', googleIdError);
      return null;
    }
    
    if (existingByGoogleId) {
      existingUser = existingByGoogleId;
      console.log('🔍 Found existing user by google_id');
    } else {
      // If not found by google_id, try by email
      const { data: existingByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (emailError && emailError.code !== 'PGRST116') {
        console.error('❌ Error fetching user by email:', emailError);
        return null;
      }
      
      if (existingByEmail) {
        existingUser = existingByEmail;
        fetchError = emailError;
        console.log('🔍 Found existing user by email');
      }
    }

    console.log('🔍 User lookup result:', { existingUser: !!existingUser, fetchError: fetchError?.code });

    if (!existingUser) {
      console.log('👤 Creating new user with service role...');
      // Create new user using service role to bypass RLS
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name,
          google_id: user.id,
          avatar_url: user.image,
          university_id: null,
          is_setup_complete: false,
          created_at: new Date().toISOString()
          // Note: updated_at will be handled by database trigger
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
        
        // If it's a duplicate key error, try to fetch the existing user
        if (insertError.code === '23505') {
          console.log('🔄 Duplicate key detected, fetching existing user...');
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (existingUser && !fetchError) {
            console.log('✅ Found existing user after duplicate key error');
            return existingUser;
          }
        }
        
        return null;
      }
      
      console.log('✅ New Google user created:', newUser?.email);
      console.log('✅ New user data:', { id: newUser?.id, email: newUser?.email });
      return newUser;
    } else {
      // Update existing user with service role
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          avatar_url: user.image, // Update avatar in case it changed
          google_id: user.id // Ensure google_id is set
          // Note: updated_at will be handled by database trigger
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
    const { data: user, error } = await supabaseAdmin
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
async function saveUniversityCredentials(userEmail: string, credentials: any) {
  try {
    // Import encryption utilities
    const { CredentialsEncryption } = await import('./encryption');
    
    // Encrypt credentials
    const encrypted = CredentialsEncryption.encryptCredentials(
      credentials.username,
      credentials.password
    );
    
    // Save to database
    const { error } = await supabaseAdmin
      .from('user_credentials')
      .upsert({
        user_email: credentials.userEmail,
        university_id: credentials.universityId,
        username: credentials.username,
        encrypted_password: encrypted.encryptedPassword,
        is_active: true,
        last_validated_at: new Date().toISOString()
        // Note: updated_at will be handled by database trigger
      }, {
        onConflict: 'user_email,university_id'
      });
      
    if (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
    
    // Update user setup status
    await supabaseAdmin
      .from('users')
      .update({ 
        is_setup_complete: true
        // Note: updated_at will be handled by database trigger
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
    // Stage 1: Google OAuth (only if credentials are provided)
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "openid email profile",
            prompt: "select_account",
          }
        }
      })
    ] : []),
    
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
            await supabaseAdmin.from('auth_attempts').insert({
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
          await saveUniversityCredentials(googleUser.email, {
            ...credentials,
            userEmail: googleUser.email,
            username: credentials.username
          });
          
          // Log successful attempt
          await supabaseAdmin.from('auth_attempts').insert({
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
      // Minimal logging to prevent callback loops
      console.log('🔐 SignIn callback:', { provider: account?.provider, email: user?.email });
      
      if (account?.provider === 'google') {
        console.log('🎯 Processing Google OAuth...');
        
        // Validate university email domain
        const emailValidation = validateUniversityEmail(user.email!);
        
        if (!emailValidation.isValid) {
          console.log('❌ Email validation failed:', emailValidation.error);
          
          // Log failed attempt
          await supabaseAdmin.from('auth_attempts').insert({
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
          console.log('❌ Database user creation failed');
          
          // Log failed attempt
          await supabaseAdmin.from('auth_attempts').insert({
            user_identifier: user.email!,
            attempt_type: 'google',
            success: false,
            error_message: 'Database user creation failed',
            created_at: new Date().toISOString()
          });
          
          return false;
        }
        
        console.log('✅ Google user processed successfully');
        
        // Log successful Google auth
        await supabaseAdmin.from('auth_attempts').insert({
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
      // Smart redirect based on user setup status
      const appUrl = env.APP_URL || baseUrl;
      
      // Smart routing for Google OAuth callback
      if (url.includes('/api/auth/callback/google')) {
        try {
          // Use smart redirect to determine the best route based on user status
          return `${appUrl}/auth/smart-redirect`;
        } catch (error) {
          console.warn('⚠️ Error in smart redirect, falling back to smart redirect:', error);
          return `${appUrl}/auth/smart-redirect`;
        }
      }
      
      // For all other cases, just return the base URL to avoid redirect loops
      return appUrl;
    },
    
    async jwt({ token, user, account, trigger }) {
      // Enhanced JWT logging for debugging
      console.log('🎫 JWT Callback triggered:', { 
        trigger, 
        provider: account?.provider, 
        email: token?.email,
        isDualStageComplete: token?.isDualStageComplete 
      });
      
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
      
      // Refresh session data on update or always check for dual-stage completion
      if ((trigger === 'update' || !token.isDualStageComplete) && token.sub) {
        try {
          console.log('🔄 Refreshing JWT session data for:', token.email);
          
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', token.sub)
            .single();
            
          if (userData) {
            // Check user credentials using the new schema
            const { data: credentialsData } = await supabaseAdmin
              .from('user_university_connections')
              .select('university_id, last_verified_at, is_verified, is_active')
              .eq('user_id', userData.id)
              .eq('is_active', true)
              .single();
              
            const wasComplete = token.isDualStageComplete;
            token.isDualStageComplete = userData.is_setup_complete && !!credentialsData?.is_verified;
            token.universityId = credentialsData?.university_id;
            token.lastSync = credentialsData?.last_verified_at;
            
            if (token.universityId) {
              const university = UNIVERSITIES.find(u => u.id === token.universityId);
              token.universityName = university?.name;
            }
            
            if (wasComplete !== token.isDualStageComplete) {
              console.log('✅ JWT token dual-stage status updated:', { 
                from: wasComplete, 
                to: token.isDualStageComplete,
                userSetupComplete: userData.is_setup_complete,
                hasCredentials: !!credentialsData?.is_verified
              });
            }
          } else {
            console.warn('⚠️ User not found during JWT refresh');
          }
        } catch (error) {
          console.error('❌ Error refreshing JWT session data:', error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Minimal session logging
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.googleId = token.googleId as string;
        session.user.provider = token.provider === 'university-credentials' ? 'dual-stage-complete' : 'google';
        session.user.universityId = token.universityId as string;
        session.user.universityName = token.universityName as string;
        session.user.lastSync = token.lastSync as string;
        session.user.isDualStageComplete = token.isDualStageComplete as boolean;
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
          await supabaseAdmin.from('user_sessions').insert({
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: user.id,
            session_type: account.provider === 'university-credentials' ? 'dual_stage_complete' : 'google_only',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          });
          console.log('✅ User session tracked for:', user.email);
        } catch (error) {
          console.warn('⚠️ Failed to track user session:', error);
        }
      }
    },
    
    async signOut({ session, token }) {
      console.log('🚪 SignOut event for:', session?.user?.email || token?.email);
      
      // Log sign out attempt
      if (session?.user?.email) {
        try {
          await supabaseAdmin.from('auth_attempts').insert({
            user_identifier: session.user.email,
            attempt_type: 'signout',
            success: true,
            created_at: new Date().toISOString()
          });
          console.log('✅ Sign out logged for:', session.user.email);
        } catch (error) {
          console.error('❌ Error logging sign out:', error);
        }
      }
      
      // Deactivate user sessions
      if (token?.sub) {
        try {
          await supabaseAdmin
            .from('user_sessions')
            .update({ 
              is_active: false,
              last_activity: new Date().toISOString()
            })
            .eq('user_id', token.sub)
            .eq('is_active', true);
          console.log('✅ User sessions deactivated for:', token.sub);
        } catch (error) {
          console.warn('⚠️ Failed to deactivate user sessions:', error);
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