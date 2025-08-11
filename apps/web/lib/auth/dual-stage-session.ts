import { getServerSession } from 'next-auth';
import { unifiedAuthOptions } from './unified-auth';
import { CredentialsEncryption } from './encryption';
import { supabase } from '../db';
import { UNIVERSITIES, authenticateWithUniversity } from './auth-provider';
import type { UniversityConfig } from './types';

// Enhanced session interface for dual-stage authentication
export interface DualStageSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    
    // Google stage data
    googleId: string;
    provider: 'google' | 'dual-stage-complete';
    
    // University stage data (only after completion)
    universityId?: string;
    universityName?: string;
    lastSync?: string;
    isDualStageComplete: boolean;
    
    // Moodle credentials status (no actual credentials exposed)
    hasValidCredentials?: boolean;
    credentialsExpiry?: string;
    credentialsValid?: boolean;
  };
}

export interface UserDualStageData {
  isDualStageComplete: boolean;
  universityId?: string;
  universityName?: string;
  lastSync?: string;
  hasValidCredentials: boolean;
  credentialsExpiry?: string;
  credentialsValid?: boolean;
}

export interface StoredCredentials {
  username: string;
  password: string;
  universityId: string;
}

/**
 * Dual-Stage Session Manager
 * Manages authentication state between Google OAuth and University credentials
 */
export class DualStageSessionManager {
  
  /**
   * Get enhanced session with dual-stage authentication data
   * @returns Enhanced session object or null if not authenticated
   */
  static async getDualStageSession(): Promise<DualStageSession | null> {
    try {
      const session = await getServerSession(unifiedAuthOptions);
      
      if (!session?.user) {
        return null;
      }
      
      // If session already has dual-stage data, return it
      if ('isDualStageComplete' in session.user) {
        return session as DualStageSession;
      }
      
      // Enrich session with dual-stage data from database
      const userData = await this.fetchUserDualStageData(session.user.id);
      
      return {
        user: {
          ...session.user,
          googleId: session.user.googleId || session.user.id,
          provider: userData?.isDualStageComplete ? 'dual-stage-complete' : 'google',
          isDualStageComplete: userData?.isDualStageComplete || false,
          universityId: userData?.universityId,
          universityName: userData?.universityName,
          lastSync: userData?.lastSync,
          hasValidCredentials: userData?.hasValidCredentials || false,
          credentialsExpiry: userData?.credentialsExpiry,
          credentialsValid: userData?.credentialsValid
        }
      } as DualStageSession;
    } catch (error) {
      console.error('Error getting dual-stage session:', error);
      return null;
    }
  }
  
  /**
   * Check if user needs to complete university setup
   * @param userId User ID to check
   * @returns true if university setup is required
   */
  static async requiresUniversitySetup(userId: string): Promise<boolean> {
    try {
      const { data: credentials, error } = await supabase
        .from('university_credentials')
        .select('id, is_valid, credentials_expiry')
        .eq('user_id', userId)
        .single();
        
      if (error || !credentials) {
        return true; // No credentials found
      }
      
      // Check if credentials are still valid and not expired
      const now = new Date();
      const expiry = new Date(credentials.credentials_expiry);
      
      if (!credentials.is_valid || expiry < now) {
        return true; // Credentials invalid or expired
      }
      
      return false; // Setup complete and valid
    } catch (error) {
      console.error('Error checking university setup requirement:', error);
      return true; // Err on the side of requiring setup
    }
  }
  
  /**
   * Check if stored credentials are still valid by testing them
   * @param userId User ID to check
   * @returns true if credentials are valid
   */
  static async areCredentialsValid(userId: string): Promise<boolean> {
    try {
      const credentials = await this.getUserCredentials(userId);
      if (!credentials) {
        return false;
      }
      
      // Test credentials against university
      const testResult = await this.testStoredCredentials(credentials);
      
      // Update validity in database
      await supabase
        .from('university_credentials')
        .update({
          is_valid: testResult.success,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      return testResult.success;
      
    } catch (error) {
      console.error('Error validating credentials:', error);
      
      // Mark as invalid on error
      try {
        await supabase
          .from('university_credentials')
          .update({
            is_valid: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } catch (updateError) {
        console.error('Error updating credential validity:', updateError);
      }
      
      return false;
    }
  }
  
  /**
   * Get and decrypt user credentials (for internal use only)
   * @param userId User ID
   * @returns Decrypted credentials or null
   */
  static async getUserCredentials(userId: string): Promise<StoredCredentials | null> {
    try {
      const { data: credData, error } = await supabase
        .from('university_credentials')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !credData) {
        return null;
      }
      
      // Validate encryption structure
      if (!CredentialsEncryption.validateEncryptionStructure(credData)) {
        console.error('Invalid encryption structure in stored credentials');
        return null;
      }
      
      try {
        const decrypted = CredentialsEncryption.decryptCredentials(
          credData.encrypted_username,
          credData.encrypted_password,
          credData.auth_tag,
          credData.iv
        );
        
        return {
          username: decrypted.username,
          password: decrypted.password,
          universityId: credData.university_id
        };
      } catch (decryptionError) {
        console.error('Error decrypting credentials:', decryptionError);
        
        // Mark credentials as invalid
        await supabase
          .from('university_credentials')
          .update({ is_valid: false })
          .eq('user_id', userId);
          
        return null;
      }
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return null;
    }
  }
  
  /**
   * Test stored credentials against university
   * @param credentials Decrypted credentials to test
   * @returns Authentication result
   */
  private static async testStoredCredentials(credentials: StoredCredentials): Promise<{success: boolean; message?: string}> {
    try {
      const university = UNIVERSITIES.find(u => u.id === credentials.universityId);
      if (!university) {
        return { success: false, message: 'University not supported' };
      }
      
      const result = await authenticateWithUniversity(
        credentials.username,
        credentials.password,
        credentials.universityId
      );
      
      // Log authentication attempt
      await supabase.from('auth_attempts').insert({
        user_identifier: credentials.username,
        attempt_type: 'credential_test',
        university_id: credentials.universityId,
        success: result.success,
        error_message: result.success ? null : result.message,
        created_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error testing stored credentials:', error);
      return { success: false, message: 'Testing failed' };
    }
  }
  
  /**
   * Fetch user dual-stage data from database
   * @param userId User ID
   * @returns User dual-stage data
   */
  private static async fetchUserDualStageData(userId: string): Promise<UserDualStageData | null> {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          university_credentials (
            university_id,
            last_sync,
            created_at,
            is_valid,
            credentials_expiry
          )
        `)
        .eq('id', userId)
        .single();
        
      if (error || !userData) {
        return null;
      }
      
      const credentials = userData.university_credentials?.[0];
      const hasCredentials = !!credentials;
      
      // Check if credentials are expired
      const now = new Date();
      const expiry = credentials?.credentials_expiry ? new Date(credentials.credentials_expiry) : null;
      const credentialsValid = hasCredentials && credentials.is_valid && (!expiry || expiry > now);
      
      return {
        isDualStageComplete: hasCredentials && userData.is_setup_complete,
        universityId: credentials?.university_id,
        universityName: UNIVERSITIES.find(
          u => u.id === credentials?.university_id
        )?.name,
        lastSync: credentials?.last_sync,
        hasValidCredentials: hasCredentials,
        credentialsExpiry: credentials?.credentials_expiry,
        credentialsValid
      };
    } catch (error) {
      console.error('Error fetching user dual-stage data:', error);
      return null;
    }
  }
  
  /**
   * Update user's last sync time
   * @param userId User ID
   * @param syncTime Sync timestamp
   */
  static async updateLastSync(userId: string, syncTime?: string): Promise<void> {
    try {
      await supabase
        .from('university_credentials')
        .update({
          last_sync: syncTime || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }
  
  /**
   * Mark user's dual-stage setup as complete
   * @param userId User ID
   */
  static async markSetupComplete(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({
          is_setup_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error marking setup complete:', error);
    }
  }
  
  /**
   * Remove user's university credentials (logout from university)
   * @param userId User ID
   */
  static async removeUniversityCredentials(userId: string): Promise<void> {
    try {
      await supabase
        .from('university_credentials')
        .delete()
        .eq('user_id', userId);
        
      await supabase
        .from('users')
        .update({
          is_setup_complete: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      console.log('✅ University credentials removed for user:', userId);
    } catch (error) {
      console.error('Error removing university credentials:', error);
      throw error;
    }
  }
  
  /**
   * Get user's university information
   * @param userId User ID
   * @returns University configuration or null
   */
  static async getUserUniversity(userId: string): Promise<UniversityConfig | null> {
    try {
      const { data: credentials, error } = await supabase
        .from('university_credentials')
        .select('university_id')
        .eq('user_id', userId)
        .single();
        
      if (error || !credentials) {
        return null;
      }
      
      return UNIVERSITIES.find(u => u.id === credentials.university_id) || null;
    } catch (error) {
      console.error('Error getting user university:', error);
      return null;
    }
  }
  
  /**
   * Check if a user has a valid session
   * @param userId User ID
   * @returns true if user has a valid session
   */
  static async hasValidSession(userId: string): Promise<boolean> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .limit(1);
        
      return !error && sessions && sessions.length > 0;
    } catch (error) {
      console.error('Error checking valid session:', error);
      return false;
    }
  }
  
  /**
   * Clean up expired sessions and credentials
   * @returns Number of cleaned up records
   */
  static async cleanupExpiredData(): Promise<{ sessions: number; credentials: number }> {
    try {
      const now = new Date().toISOString();
      
      // Clean expired sessions
      const { data: expiredSessions } = await supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', now)
        .select('id');
        
      // Mark expired credentials as invalid
      const { data: expiredCredentials } = await supabase
        .from('university_credentials')
        .update({ is_valid: false })
        .lt('credentials_expiry', now)
        .eq('is_valid', true)
        .select('id');
        
      const cleaned = {
        sessions: expiredSessions?.length || 0,
        credentials: expiredCredentials?.length || 0
      };
      
      if (cleaned.sessions > 0 || cleaned.credentials > 0) {
        console.log(`🧹 Cleanup completed: ${cleaned.sessions} sessions, ${cleaned.credentials} credentials`);
      }
      
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
      return { sessions: 0, credentials: 0 };
    }
  }
}

export default DualStageSessionManager;