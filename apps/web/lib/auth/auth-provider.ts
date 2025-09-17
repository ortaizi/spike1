import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { supabase } from '../db';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import bcrypt from 'bcryptjs'; // Unused import
import type { UniversityConfig } from './types';
import { env } from "../env"

// University configuration using environment variables
export const UNIVERSITIES: UniversityConfig[] = [
  {
    id: 'bgu',
    name: 'אוניברסיטת בן-גוריון בנגב',
    domain: 'post.bgu.ac.il',
    moodleUrl: env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il',
    apiEndpoint: `${env.BGU_MOODLE_URL || 'https://moodle.bgu.ac.il'}/login/index.php`,
    logo: '/universities/bgu-logo.png'
  }
  // Other universities coming soon:
  // {
  //   id: 'technion',
  //   name: 'הטכניון',
  //   domain: 'technion.ac.il',
  //   moodleUrl: env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il',
  //   apiEndpoint: `${env.TECHNION_MOODLE_URL || 'https://moodle.technion.ac.il'}/login/index.php`,
  //   logo: '/universities/technion-logo.png'
  // },
  // {
  //   id: 'hebrew',
  //   name: 'האוניברסיטה העברית',
  //   domain: 'mail.huji.ac.il',
  //   moodleUrl: env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il',
  //   apiEndpoint: `${env.HUJI_MOODLE_URL || 'https://moodle.huji.ac.il'}/login/index.php`,
  //   logo: '/universities/huji-logo.png'
  // },
  // {
  //   id: 'tau',
  //   name: 'אוניברסיטת תל אביב',
  //   domain: 'post.tau.ac.il',
  //   moodleUrl: env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il',
  //   apiEndpoint: `${env.TAU_MOODLE_URL || 'https://moodle.tau.ac.il'}/login/index.php`,
  //   logo: '/universities/tau-logo.png'
  // }
];

// Function to scrape data from Moodle
async function scrapeMoodleData(
  username: string,
  _password: string,
  university: UniversityConfig
) {
  try {
    console.log('Scraping Moodle data for:', username, 'at:', university.name);
    
    // Get scraping configuration from environment
    // const timeout = parseInt(env.SCRAPING_TIMEOUT || '30000'); // Reserved for future use
    // const userAgent = env.SCRAPING_USER_AGENT || 'Spike-Platform/1.0'; // Reserved for future use
    // const retryAttempts = parseInt(env.SCRAPING_RETRY_ATTEMPTS || '3'); // Reserved for future use
    const delay = parseInt(env.SCRAPING_DELAY || '1000');
    
    // Simulate scraping process
    // In production, this would use a library like Puppeteer or Playwright
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulated scraped data
    const scrapedData = {
      courses: [
        {
          id: 'CS101',
          name: 'מבוא למדעי המחשב',
          code: 'CS101',
          semester: '2024A',
          grade: 85,
          assignments: [
            { id: 1, name: 'תרגיל 1', grade: 90, dueDate: '2024-01-15' },
            { id: 2, name: 'תרגיל 2', grade: 85, dueDate: '2024-01-22' }
          ]
        },
        {
          id: 'MATH101',
          name: 'חשבון דיפרנציאלי ואינטגרלי',
          code: 'MATH101',
          semester: '2024A',
          grade: 92,
          assignments: [
            { id: 3, name: 'תרגיל 1', grade: 95, dueDate: '2024-01-20' }
          ]
        }
      ],
      profile: {
        studentId: username,
        fullName: 'אורטאי זיידמן',
        email: `${username}@${university.domain}`,
        department: 'מדעי המחשב',
        year: 2
      }
    };
    
    console.log('Successfully scraped Moodle data from:', university.moodleUrl);
    return scrapedData;
  } catch (error) {
    console.error('Error scraping Moodle data:', error);
    return null;
  }
}

// Function to fetch user data from Moodle (now uses scraping)
async function fetchUserDataFromMoodle(
  username: string,
  password: string,
  university: UniversityConfig
) {
  try {
    console.log('Fetching user data from Moodle for:', username);
    
    // Use scraping to get data from Moodle
    const scrapedData = await scrapeMoodleData(username, password, university);
    
    if (!scrapedData) {
      console.error('Failed to scrape data from Moodle');
      return null;
    }
    
    console.log('Successfully fetched user data via scraping');
    return scrapedData;
  } catch (error) {
    console.error('Error fetching user data from Moodle:', error);
    return null;
  }
}

// Dynamic authentication function
export async function authenticateWithUniversity(
  username: string, 
  password: string, 
  universityId: string
) {
  const university = UNIVERSITIES.find(u => u.id === universityId);
  if (!university) {
    throw new Error('מוסד לימודים לא נתמך');
  }

  try {
    // For development/testing, we'll simulate successful authentication
    // In production, this would make a real API call to the university's Moodle
    console.log('Simulating authentication for:', username, 'at:', university.name);
    
    // Simulate a delay to mimic real API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, accept any non-empty username and password
    // In production, this would validate against the actual Moodle API
    const isValidCredentials = username && password && username.length > 0 && password.length > 0;
    
    if (isValidCredentials) {
      console.log('Authentication successful for:', username);
      return {
        success: true,
        message: 'התחברות מוצלחת',
        university: university
      };
    } else {
      console.log('Authentication failed - invalid credentials');
      return {
        success: false,
        message: 'שם משתמש או סיסמה אינם נכונים',
        university: university
      };
    }
    
    /* 
    // Real Moodle authentication (for production)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(university.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Spike-Platform/1.0'
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isSuccessful = response.ok && !response.url.includes('login');

      return {
        success: isSuccessful,
        message: isSuccessful ? 'התחברות מוצלחת' : 'שם משתמש או סיסמה אינם נכונים',
        university: university
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          message: 'פג תוקף הבקשה - נסה שוב',
          university: university
        };
      }
      throw fetchError;
    }
    */
  } catch (error) {
    console.error('University authentication error:', error);
    return {
      success: false,
      message: 'שגיאה בהתחברות למערכת',
      university: university
    };
  }
}

// Auth.js v5 configuration
export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'שם משתמש', type: 'text' },
        password: { label: 'סיסמה', type: 'password' },
        universityId: { label: 'מוסד לימודים', type: 'text' }
      },
      async authorize(credentials, _req) {
        if (!credentials?.username || !credentials?.password || !credentials?.universityId) {
          console.log('Missing credentials');
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;
        const universityId = credentials.universityId as string;

        try {
          console.log('Attempting authentication for:', username, 'at university:', universityId);
          
          // Authenticate with university
          const authResult = await authenticateWithUniversity(
            username,
            password,
            universityId
          );

          console.log('Auth result:', authResult);

          if (!authResult.success) {
            console.log('Authentication failed:', authResult.message);
            return null;
          }

          const university = authResult.university;

          // Find existing user by email
          const { data: existingUsers, error: _findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', `${username}@${university.domain}`)
            .limit(1);
          
          const existingUser = existingUsers?.[0] || null;

          // Fetch user data from Moodle
          const moodleData = await fetchUserDataFromMoodle(username, password, university);
          
          if (existingUser) {
            console.log('Updating existing user:', existingUser.id);
            // Update existing user
            await supabase
              .from('users')
              .update({
                moodleLastSync: new Date().toISOString(),
                updatedat: new Date().toISOString(),
                preferences: {
                  ...(existingUser.preferences as object || {}),
                  universityId: universityId,
                  universityName: university.name,
                  moodleData: moodleData // Save Moodle data
                }
              })
              .eq('id', existingUser.id);

            // הפעלת סנכרון אוטומטי ברקע
            try {
              console.log('🔄 הפעלת סנכרון אוטומטי עבור משתמש קיים...');
              
              // יצירת job ID ייחודי
              // const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Reserved for future use
              
              // הפעלת תהליך רקע אסינכרוני
              const { startBackgroundSync } = await import('../background-sync');
              const syncResult = await startBackgroundSync(existingUser.id, {
                moodle_username: username,
                moodle_password: password,
                university_id: universityId
              });
              
              if (syncResult.success) {
                console.log('✅ סנכרון אוטומטי הופעל בהצלחה, job ID:', syncResult.jobId);
              } else {
                console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncResult.message);
              }
            } catch (syncError) {
              console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncError);
            }

            // הפעלת סנכרון אוטומטי גם למשתמשים קיימים
            try {
              console.log('🔄 הפעלת סנכרון אוטומטי עבור משתמש קיים...');
              
              const { startBackgroundSync } = await import('../background-sync');
              const syncResult = await startBackgroundSync(existingUser.id, {
                moodle_username: username,
                moodle_password: password,
                university_id: universityId
              });
              
              if (syncResult.success) {
                console.log('✅ סנכרון אוטומטי הופעל בהצלחה, job ID:', syncResult.jobId);
              } else {
                console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncResult.message);
              }
            } catch (syncError) {
              console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncError);
            }

            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              studentId: existingUser.studentid || '',
              universityId: universityId,
              universityName: university.name,
              provider: 'dual-stage-complete',
              moodleData: moodleData
            };
          } else {
            console.log('Creating new user for:', username);
            
            // Check if Supabase is available (not using placeholder values)
            const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
            const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
            
            if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
              console.log('Using mock user creation (Supabase not configured)');
              // Create mock user for development
              const mockUserId = `mock_${Date.now()}`;
              return {
                id: mockUserId,
                email: `${username}@${university.domain}`,
                name: username,
                studentId: username,
                universityId: universityId,
                universityName: university.name,
                provider: 'dual-stage-complete' as const,
                moodleData: moodleData
              };
            }
            
            // Create new user in Supabase
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const { data: newUsers, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: `${username}@${university.domain}`,
                name: username,
                studentid: username,
                moodleusername: username,
                preferences: {
                  language: 'he',
                  notifications: true,
                  theme: 'light',
                  onboardingCompleted: false,
                  universityId: universityId,
                  universityName: university.name,
                  moodleData: moodleData // Save Moodle data
                }
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating user:', createError);
              return null;
            }
            
            if (!newUsers) {
              console.error('No user data returned from insert');
              return null;
            }

            const newUser = newUsers;

            // הפעלת סנכרון אוטומטי ברקע
            try {
              console.log('🔄 הפעלת סנכרון אוטומטי עבור משתמש חדש...');
              
              // הפעלת תהליך רקע אסינכרוני
              const { startBackgroundSync } = await import('../background-sync');
              const syncResult = await startBackgroundSync(newUser.id, {
                moodle_username: username,
                moodle_password: password,
                university_id: universityId
              });
              
              if (syncResult.success) {
                console.log('✅ סנכרון אוטומטי הופעל בהצלחה, job ID:', syncResult.jobId);
              } else {
                console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncResult.message);
              }
            } catch (syncError) {
              console.warn('⚠️ שגיאה בהפעלת סנכרון אוטומטי:', syncError);
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              studentId: newUser.studentid || '',
              universityId: universityId,
              universityName: university.name,
              provider: 'dual-stage-complete',
              moodleData: moodleData
            };
          }
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  events: {
    async signIn({ user, account: _account, profile: _profile, isNewUser }: { user: any; account: any; profile: any; isNewUser: boolean }) {
      console.log('SignIn event - user:', user, 'isNewUser:', isNewUser);
    },
    async signOut({ session, token }: any) {
      console.log('SignOut event - session:', session, 'token:', token);
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('Session event - session:', session, 'token:', token);
    }
  },
  callbacks: {
    async signIn({ user, account: _account, profile: _profile }: { user: any; account: any; profile: any }) {
      console.log('SignIn callback called with user:', user);
      return !!user;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl);
      
      // Use APP_URL from environment variables
      const appUrl = env.APP_URL || 'http://localhost:3000';
      console.log('Using APP_URL:', appUrl);
      
      // If user is trying to access signin page but is already authenticated,
      // check if they need onboarding
      if (url.includes('/auth/signin')) {
        console.log('User trying to access signin, checking onboarding status');
        // For now, redirect to onboarding for new users
        // In a real app, you'd check the user's onboarding status
        return `${appUrl}/onboarding`;
      }
      
      // For other URLs, use APP_URL for all redirects
      const correctedUrl = url.replace(/http:\/\/localhost:\d+/, appUrl);
      console.log('Corrected URL:', correctedUrl);
      return correctedUrl;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback - token:', token, 'user:', user);
      if (user) {
        token.studentId = (user as any).studentId;
        token.universityId = (user as any).universityId;
        token.universityName = (user as any).universityName;
        token.moodleData = (user as any).moodleData;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (token) {
        session.user.id = token.sub!;
        session.user.studentId = token.studentId as string;
        session.user.universityId = token.universityId as string;
        session.user.universityName = token.universityName as string;
        session.user.moodleData = token.moodleData as any;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.AUTH_SECRET,
  debug: env.AUTH_DEBUG === 'true' ? true : false,
  trustHost: true
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);