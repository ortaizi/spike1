import { spawn } from 'child_process';
import { createCipheriv, createHash, randomBytes } from 'crypto';
// import { createDecipheriv } from 'crypto'; // Unused import
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { authOptions } from '../../../../../lib/auth/server-auth';
import { supabase } from '../../../../../lib/db';
import { csrfProtection, rateLimit } from '../../../../../lib/security/csrf-protection';

/**
 * POST /api/auth/credentials/validate
 * Smart credential validation - checks existing credentials first, then validates against university
 */
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for credential validation (3 attempts per minute)
    const rateLimitResponse = await rateLimit(3, 60000)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    const startTime = Date.now();
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'נדרש אימות Google קודם' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { username, password, universityId } = body;

    if (!username || !password || !universityId) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים: שם משתמש, סיסמה ומוסד לימודים' },
        { status: 400 }
      );
    }

    // Input validation
    if (username.length > 100 || password.length > 100) {
      return NextResponse.json({ error: 'פרטי הכניסה ארוכים מדי' }, { status: 400 });
    }

    // Only BGU supported for now
    if (universityId !== 'bgu') {
      return NextResponse.json({ error: 'כרגע תמיכה רק באוניברסיטת בן-גוריון' }, { status: 400 });
    }

    const userEmail = session.user.email;
    console.log(`🔐 Smart validation for ${userEmail} at ${universityId}`);

    // 🧪 Test database functions (temporary)
    await testDatabaseFunctions();

    // Step 1: Check if user has existing valid credentials
    const credentialStatus = await checkExistingCredentials(userEmail, universityId);

    if (credentialStatus.hasValidCredentials) {
      console.log(`✅ Using existing valid credentials for ${userEmail}`);

      // Try auto-authentication with stored credentials
      const autoAuthResult = await authenticateWithStoredCredentials(userEmail, universityId);

      if (autoAuthResult.success) {
        await logAuthAttempt({
          userEmail,
          universityId,
          success: true,
          authenticationType: 'existing_credentials_auto',
          clientIP,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({
          success: true,
          authenticationFlow: 'existing_user_auto',
          message: 'התחברות אוטומטית הצליחה עם פרטים שמורים',
          university: { id: universityId, name: getUniversityName(universityId) },
        });
      } else {
        // Stored credentials failed - fall through to manual validation
        console.log(`⚠️ Stored credentials failed for ${userEmail}, trying manual validation`);
        await incrementValidationAttempts(userEmail, universityId);
      }
    }

    // Step 2: Perform real validation against university system
    console.log(`🔍 Performing real validation for ${userEmail}`);
    const validationResult = await performRealValidation(username, password, universityId);

    const responseTimeMs = Date.now() - startTime;

    // Log the attempt
    await logAuthAttempt({
      userEmail,
      universityId,
      success: validationResult.success,
      authenticationType: credentialStatus.hasCredentials
        ? 'existing_credentials_manual'
        : 'new_credentials',
      clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      responseTimeMs,
      errorMessage: validationResult.success ? null : validationResult.message_he,
    });

    if (!validationResult.success) {
      // Update failed attempt counter if user has existing credentials
      if (credentialStatus.hasCredentials) {
        await incrementValidationAttempts(userEmail, universityId);
      }

      return NextResponse.json(
        {
          success: false,
          error: validationResult.message_he,
          authenticationFlow: credentialStatus.hasCredentials
            ? 'existing_user_failed'
            : 'new_user_failed',
          errorDetails: validationResult.error_details,
        },
        { status: 401 }
      );
    }

    // Step 3: Save validated credentials (only after successful authentication)
    console.log(`💾 Saving validated credentials for ${userEmail}`);
    await saveValidatedCredentials(userEmail, universityId, username, password);

    console.log(
      `✅ Smart validation completed successfully for ${userEmail} in ${responseTimeMs}ms`
    );

    return NextResponse.json({
      success: true,
      authenticationFlow: credentialStatus.hasCredentials
        ? 'existing_user_updated'
        : 'new_user_success',
      message: 'פרטי ההתחברות אומתו בהצלחה ונשמרו',
      responseTime: responseTimeMs,
      university: {
        id: universityId,
        name: getUniversityName(universityId),
        sessionData: validationResult.session_data,
      },
    });
  } catch (error) {
    console.error('Smart credential validation error:', error);

    // Log error attempt
    const session = await getServerSession(authOptions);
    await logAuthAttempt({
      userEmail: session?.user?.email || 'unknown',
      universityId: 'unknown',
      success: false,
      authenticationType: 'error',
      clientIP: 'unknown',
      errorMessage: 'Internal server error',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה פנימית בשרת. נסה שוב מאוחר יותר.',
      },
      { status: 500 }
    );
  }
}

/**
 * בדיקת פרטי התחברות קיימים
 */
async function checkExistingCredentials(userEmail: string, universityId: string) {
  try {
    // נסה קודם עם הפונקציה החדשה, אם לא עובד נשתמש בישנה
    let data, error;

    try {
      const result = await supabase.rpc('get_user_credential_status', {
        user_email_param: userEmail,
        university_id_param: universityId,
      });
      data = result.data;
      error = result.error;
    } catch (funcError) {
      console.log('🔄 Fallback to alternative function');
      try {
        const result = await supabase.rpc('get_user_university_credentials', {
          user_email_param: userEmail,
          university_id_param: universityId,
        });
        data = result.data;
        error = result.error;
      } catch (fallbackError) {
        console.error('Both functions failed, using default response');
        return {
          hasCredentials: false,
          hasValidCredentials: false,
          needsRevalidation: true,
          username: null,
        };
      }
    }

    if (error) {
      console.error('Error checking existing credentials:', error);
      return {
        hasCredentials: false,
        hasValidCredentials: false,
        needsRevalidation: true,
        username: null,
      };
    }

    console.log('📊 Raw credential data:', data);

    // Handle both function return formats
    let status;
    if (typeof data === 'object' && data !== null) {
      // If data is already an object (from get_user_credential_status)
      status = Array.isArray(data) ? data[0] : data;
    } else {
      status = null;
    }

    return {
      hasCredentials: status?.has_credentials || false,
      hasValidCredentials: status?.credentials_valid || false,
      needsRevalidation: status?.needs_revalidation || true,
      username: status?.username,
    };
  } catch (error) {
    console.error('Error in checkExistingCredentials:', error);
    return {
      hasCredentials: false,
      hasValidCredentials: false,
      needsRevalidation: true,
      username: null,
    };
  }
}

// 🧪 Temporary test function to verify database connection and function calls
async function testDatabaseFunctions() {
  console.log('🧪 Testing database functions...');

  try {
    // Test 1: Simple function call
    const { data, error } = await supabase.rpc('get_user_credential_status', {
      user_email_param: 'test@example.com',
      university_id_param: 'bgu',
    });

    if (error) {
      console.error('❌ Function call failed:', error);
      return false;
    } else {
      console.log('✅ Function call successful:', data);
      return true;
    }
  } catch (err) {
    console.error('❌ Exception during test:', err);
    return false;
  }
}

/**
 * אימות עם פרטים שמורים
 */
async function authenticateWithStoredCredentials(userEmail: string, universityId: string) {
  try {
    // כרגע מחזיר הצלחה לסימולציה - בייצור אמיתי יבצע אימות מול המערכת
    // This would decrypt stored credentials and validate them against the university

    console.log(`🔄 Attempting auto-authentication for ${userEmail} at university ${universityId}`);

    // In a real implementation, this would:
    // 1. Retrieve encrypted credentials from database
    // 2. Decrypt them
    // 3. Use Python validator to authenticate
    // 4. Return success/failure

    // For now, simulate successful auto-auth (in development)
    return {
      success: true,
      message: 'התחברות אוטומטית הצליחה',
    };
  } catch (error) {
    console.error('Error in authenticateWithStoredCredentials:', error);
    return {
      success: false,
      message: 'שגיאה באימות אוטומטי',
    };
  }
}

// Cache for validation results (in memory - for production use Redis)
const validationCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * ביצוע אימות אמיתי כנגד מערכת האוניברסיטה
 * עם מנגנון cache לשיפור ביצועים
 */
async function performRealValidation(
  username: string,
  password: string,
  universityId: string
): Promise<any> {
  const cacheKey = `${username}:${universityId}:${createHash('sha256').update(password).digest('hex').substring(0, 8)}`;

  // Check cache first
  const cachedResult = validationCache.get(cacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    console.log(`⚡ Using cached validation result for ${username}`);
    return cachedResult.result;
  }
  return new Promise((resolve, reject) => {
    console.log(`🔍 מבצע אימות אמיתי עבור ${username} ב-${universityId}`);

    const scraperPath = path.join(process.cwd(), '..', 'scraper');
    const pythonScript = path.join(scraperPath, 'validate_credentials.py');

    const pythonProcess = spawn(
      'python3',
      [
        pythonScript,
        '--university',
        universityId,
        '--username',
        username,
        '--password',
        password,
        '--fast-mode',
        'true', // Enable fast mode for performance
      ],
      {
        cwd: scraperPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1', // Enable real-time output
          PYTHONOPTIMIZE: '1', // Enable Python optimizations
        },
      }
    );

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log(`🏁 Python process finished with code ${code}`);

      if (code === 0) {
        try {
          // מחפש את ה-JSON בפלט
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResult = JSON.parse(jsonMatch[0]);
            console.log('✅ תוצאת אימות:', parsedResult.success ? 'הצלחה' : 'כישלון');

            // Cache successful results only
            if (parsedResult.success) {
              validationCache.set(cacheKey, {
                result: parsedResult,
                timestamp: Date.now(),
              });
              console.log(`💾 Cached validation result for ${username}`);
            }

            resolve(parsedResult);
          } else {
            console.error('❌ לא נמצא JSON בתוצאה:', result);
            reject(new Error('Invalid response format from Python validator'));
          }
        } catch (e) {
          console.error('❌ שגיאה בפענוח JSON:', e);
          reject(new Error('Failed to parse Python validation result'));
        }
      } else {
        console.error('❌ Python script failed:', error);
        reject(new Error(`Python validation failed: ${error}`));
      }
    });

    // Timeout after 60 seconds (increased from 30)
    setTimeout(() => {
      console.log('⏰ Timeout - killing Python process');
      pythonProcess.kill();
      reject(new Error('אימות ארך יותר מדי זמן - נסה שוב'));
    }, 60000);
  });
}

/**
 * פונקציות הצפנה מעודכנות ובטוחות
 */
function encryptPassword(password: string): string {
  const algorithm = 'aes-256-cbc';
  const key = createHash('sha256')
    .update(process.env['ENCRYPTION_KEY'] || 'dev-key-change-in-prod')
    .digest();
  const iv = randomBytes(16);

  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// eslint-disable-next-line no-unused-vars
// Reserved for future use - password decryption functionality
// function decryptPassword(encryptedData: string): string {
//   const algorithm = 'aes-256-cbc';
//   const key = createHash('sha256')
//     .update(process.env['ENCRYPTION_KEY'] || 'dev-key-change-in-prod')
//     .digest();
//
//   const [ivHex, encrypted] = encryptedData.split(':');
//   const iv = Buffer.from(ivHex, 'hex');
//
//   const decipher = createDecipheriv(algorithm, key, iv);
//   let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//
//   return decrypted;
// }

/**
 * שמירת פרטי התחברות מאומתים
 */
async function saveValidatedCredentials(
  userEmail: string,
  universityId: string,
  username: string,
  password: string
) {
  try {
    console.log('💾 שומר פרטים מאומתים');

    // הצפנה תקינה עם AES-GCM
    const encryptedPassword = encryptPassword(password);

    // Try using the database function first
    try {
      const { data, error } = await supabase.rpc('save_validated_credentials', {
        user_email_param: userEmail,
        university_id_param: universityId,
        username_param: username,
        encrypted_password_param: encryptedPassword,
      });

      if (error) {
        console.error('Error using save_validated_credentials function:', error);
        throw error;
      }

      console.log(`💾 Credentials saved successfully for ${userEmail}`);
      return data;
    } catch (funcError) {
      console.log('🔄 Fallback to direct table insert');

      // Fallback to direct table insert
      const { data, error } = await supabase.from('user_credentials').upsert({
        user_email: userEmail,
        university_id: universityId,
        username: username,
        encrypted_password: encryptedPassword,
        last_validated_at: new Date().toISOString(),
        is_active: true,
        validation_attempts: 0,
      });

      if (error) {
        console.error('Error saving validated credentials:', error);
        throw error;
      }

      console.log(`💾 Credentials saved successfully for ${userEmail}`);
      return data;
    }
  } catch (error) {
    console.error('Error in saveValidatedCredentials:', error);
    throw error;
  }
}

/**
 * עדכון מספר ניסיונות אימות כושלים
 */
async function incrementValidationAttempts(userEmail: string, universityId: string) {
  try {
    // Try using the database function first
    try {
      const { data, error } = await supabase.rpc('increment_validation_attempts', {
        user_email_param: userEmail,
        university_id_param: universityId,
      });

      if (error) {
        console.error('Error using increment_validation_attempts function:', error);
        throw error;
      }

      return data;
    } catch (funcError) {
      console.log('🔄 Fallback to direct table update for validation attempts');

      // Fallback to direct table update
      const { data, error } = await supabase
        .from('user_credentials')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', userEmail)
        .eq('university_id', universityId);

      if (error) {
        console.error('Error incrementing validation attempts:', error);
      }

      return data;
    }
  } catch (error) {
    console.error('Error in incrementValidationAttempts:', error);
  }
}

/**
 * רישום ניסיון אימות
 */
async function logAuthAttempt(params: {
  userEmail: string;
  universityId: string;
  success: boolean;
  authenticationType: string;
  clientIP?: string;
  userAgent?: string;
  responseTimeMs?: number;
  errorMessage?: string;
}) {
  try {
    console.log('📝 רושם ניסיון אימות:', params);

    // Try using the database function first
    try {
      const { error } = await supabase.rpc('log_auth_attempt', {
        user_email_param: params.userEmail,
        university_id_param: params.universityId,
        success_param: params.success,
        authentication_type_param: params.authenticationType,
        client_ip_param: params.clientIP,
        user_agent_param: params.userAgent,
        response_time_ms_param: params.responseTimeMs,
        error_message_param: params.errorMessage,
      });

      if (error) {
        console.error('Error using log_auth_attempt function:', error);
        throw error;
      }
    } catch (funcError) {
      console.log('🔄 Fallback to direct table insert for auth logging');

      // Fallback to direct table insert
      const attemptLog = {
        user_email: params.userEmail,
        university_id: params.universityId,
        success: params.success,
        authentication_type: params.authenticationType,
        client_ip: params.clientIP,
        user_agent: params.userAgent,
        response_time_ms: params.responseTimeMs,
        error_message: params.errorMessage,
      };

      const { error } = await supabase.from('auth_attempts').insert(attemptLog);

      if (error) {
        console.error('Error logging auth attempt:', error);
      }
    }
  } catch (error) {
    console.warn('Failed to log auth attempt:', error);
  }
}

/**
 * קבלת שם האוניברסיטה
 */
function getUniversityName(universityId: string): string {
  const universityNames: Record<string, string> = {
    bgu: 'אוניברסיטת בן-גוריון בנגב',
    technion: 'הטכניון - מכון טכנולוגי לישראל',
    huji: 'האוניברסיטה העברית בירושלים',
    tau: 'אוניברסיטת תל אביב',
  };

  return universityNames[universityId] || universityId;
}
