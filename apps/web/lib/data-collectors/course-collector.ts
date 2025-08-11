/**
 * מודול איסוף קורסים ממודל
 * =========================
 * 
 * מודול זה מטפל באיסוף רשימת הקורסים של המשתמש ממודל
 * כולל מיפוי המבנה של דפי הקורסים וטיפול בכמה דפים
 */

import { MoodleConnector, MoodleCredentials, MoodleSession } from '../moodle-connector';
import { createClient } from '@supabase/supabase-js';
import { env } from "../env"

// טיפוסים
export interface CourseInfo {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  description?: string;
  instructor?: string;
  semester?: string;
  year?: number;
  faculty?: string;
  department?: string;
  credits?: number;
  moodleId: string;
  moodleUrl: string;
  lastModified: Date;
  isActive: boolean;
}

export interface CourseCollectionResult {
  success: boolean;
  courses?: CourseInfo[];
  error?: string;
  totalCourses?: number;
  collectionTime?: Date;
}

export interface CoursePageStructure {
  hasPagination: boolean;
  totalPages?: number;
  currentPage: number;
  coursesPerPage: number;
  totalCourses: number;
}

// חיבור ל-Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * מחלקת איסוף קורסים
 */
export class CourseCollector {
  private moodleConnector: MoodleConnector;
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor() {
    this.moodleConnector = new MoodleConnector();
  }

  /**
   * איסוף רשימת קורסים ממודל
   */
  async collectCourses(credentials: MoodleCredentials): Promise<CourseCollectionResult> {
    let session: MoodleSession | undefined;

    try {
      console.log(`📚 מתחיל איסוף קורסים עבור ${credentials.university}...`);

      // התחברות למודל
      const connectionResult = await this.moodleConnector.connect(credentials);
      
      if (!connectionResult.success || !connectionResult.session) {
        return {
          success: false,
          error: connectionResult.error || 'שגיאה בהתחברות למודל'
        };
      }

      session = connectionResult.session;

      // ניווט לדף הקורסים
      const coursesPageUrl = await this.getCoursesPageUrl(credentials.university);
      await session.page.goto(coursesPageUrl);
      await session.page.waitForLoadState('networkidle');

      // ניתוח מבנה הדף
      const pageStructure = await this.analyzePageStructure(session.page);
      console.log(`📊 מבנה דף: ${pageStructure.totalCourses} קורסים, ${pageStructure.totalPages || 1} דפים`);

      // איסוף קורסים מכל הדפים
      const allCourses: CourseInfo[] = [];
      
      for (let page = 1; page <= (pageStructure.totalPages || 1); page++) {
        console.log(`📄 אוסף קורסים מדף ${page}/${pageStructure.totalPages || 1}...`);
        
        const pageCourses = await this.extractCoursesFromPage(session.page, credentials.university);
        allCourses.push(...pageCourses);
        
        // מעבר לדף הבא אם יש
        if (page < (pageStructure.totalPages || 1)) {
          const nextPageResult = await this.navigateToNextPage(session.page);
          if (!nextPageResult) {
            console.log(`⚠️ לא ניתן לעבור לדף הבא, מסיים איסוף`);
            break;
          }
        }
      }

      console.log(`✅ איסוף הושלם בהצלחה: ${allCourses.length} קורסים`);

      return {
        success: true,
        courses: allCourses,
        totalCourses: allCourses.length,
        collectionTime: new Date()
      };

    } catch (error) {
      console.error('❌ שגיאה באיסוף קורסים:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    } finally {
      if (session) {
        await this.moodleConnector.closeSession(session);
      }
    }
  }

  /**
   * קבלת URL דף הקורסים לפי אוניברסיטה
   */
  private async getCoursesPageUrl(university: string): Promise<string> {
    const baseUrls = {
      bgu: 'https://moodle.bgu.ac.il/moodle/my/',
      technion: 'https://moodle.technion.ac.il/my/',
      huji: 'https://moodle.huji.ac.il/my/',
      tau: 'https://moodle.tau.ac.il/my/'
    };

    return baseUrls[university as keyof typeof baseUrls] || baseUrls.bgu;
  }

  /**
   * ניתוח מבנה דף הקורסים
   */
  private async analyzePageStructure(page: any): Promise<CoursePageStructure> {
    try {
      // בדיקה אם יש pagination
      const paginationElement = await page.$('.pagination, .paging, .page-numbers');
      const hasPagination = !!paginationElement;

      let totalPages = 1;
      let currentPage = 1;
      let coursesPerPage = 0;

      if (hasPagination) {
        // חילוץ מידע על pagination
        const paginationInfo = await page.evaluate(() => {
          const pagination = document.querySelector('.pagination, .paging, .page-numbers');
          if (!pagination) return { totalPages: 1, currentPage: 1 };

          const pageNumbers = Array.from(pagination.querySelectorAll('a, span'))
            .map(el => el.textContent?.trim())
            .filter(text => text && /^\d+$/.test(text))
            .map(num => parseInt(num || '0'));

          return {
            totalPages: Math.max(...pageNumbers, 1),
            currentPage: pageNumbers.find(num => 
              document.querySelector(`.pagination a[href*="page=${num}"], .paging a[href*="page=${num}"]`)
            ) || 1
          };
        });

        totalPages = paginationInfo.totalPages;
        currentPage = paginationInfo.currentPage;
      }

      // ספירת קורסים בדף הנוכחי
      coursesPerPage = await page.evaluate(() => {
        const courseElements = document.querySelectorAll('.course-list .course, .coursebox, .course-item');
        return courseElements.length;
      });

      // הערכת מספר הקורסים הכולל
      const totalCourses = hasPagination ? (totalPages * coursesPerPage) : coursesPerPage;

      return {
        hasPagination,
        totalPages,
        currentPage,
        coursesPerPage,
        totalCourses
      };

    } catch (error) {
      console.error('שגיאה בניתוח מבנה דף:', error);
      return {
        hasPagination: false,
        currentPage: 1,
        coursesPerPage: 0,
        totalCourses: 0
      };
    }
  }

  /**
   * חילוץ קורסים מדף נוכחי
   */
  private async extractCoursesFromPage(page: any, university: string): Promise<CourseInfo[]> {
    try {
      const courses = await page.evaluate((univ: string) => {
        const courseElements = document.querySelectorAll('.course-list .course, .coursebox, .course-item, .course-card');
        const extractedCourses: any[] = [];

        courseElements.forEach((element, index) => {
          try {
            // חילוץ מידע בסיסי
            const nameElement = element.querySelector('.course-name, .course-title, h3, h4, .title');
            const name = nameElement?.textContent?.trim() || `קורס ${index + 1}`;

            // חילוץ קוד קורס
            const codeElement = element.querySelector('.course-code, .code, .course-id');
            const code = codeElement?.textContent?.trim() || '';

            // חילוץ תיאור
            const descriptionElement = element.querySelector('.course-description, .description, .summary');
            const description = descriptionElement?.textContent?.trim() || '';

            // חילוץ מרצה
            const instructorElement = element.querySelector('.instructor, .teacher, .lecturer');
            const instructor = instructorElement?.textContent?.trim() || '';

            // חילוץ URL
            const linkElement = element.querySelector('a[href*="course"]');
            const moodleUrl = linkElement?.getAttribute('href') || '';
            
            // חילוץ course ID מה-URL
            let moodleId = '';
            if (moodleUrl) {
              const match = moodleUrl.match(/id=(\d+)/);
              moodleId = match ? match[1] : `course_${index}`;
            } else {
              moodleId = `course_${index}`;
            }

            // חילוץ מידע נוסף לפי אוניברסיטה
            let faculty = '';
            let department = '';
            let semester = '';
            let year = new Date().getFullYear();
            let credits = 0;

            // מיפוי ספציפי לכל אוניברסיטה
            if (univ === 'bgu') {
              const facultyElement = element.querySelector('.faculty, .school');
              faculty = facultyElement?.textContent?.trim() || '';

              const semesterElement = element.querySelector('.semester, .term');
              semester = semesterElement?.textContent?.trim() || 'א';

              // חילוץ שנת לימודים
              const yearMatch = name.match(/(\d{4})/);
              if (yearMatch) {
                year = parseInt(yearMatch[1]);
              }
            }

            extractedCourses.push({
              id: `course_${moodleId}_${index}`,
              name,
              code,
              description,
              instructor,
              faculty,
              department,
              semester,
              year,
              credits,
              moodleId,
              moodleUrl,
              lastModified: new Date().toISOString(),
              isActive: true
            });

          } catch (error) {
            console.error('שגיאה בחילוץ קורס:', error);
          }
        });

        return extractedCourses;
      }, university);

      console.log(`📋 חולצו ${courses.length} קורסים מהדף`);
      return courses;

    } catch (error) {
      console.error('שגיאה בחילוץ קורסים:', error);
      return [];
    }
  }

  /**
   * מעבר לדף הבא
   */
  private async navigateToNextPage(page: any): Promise<boolean> {
    try {
      // חיפוש כפתור "הבא" או מספר הדף הבא
      const nextButton = await page.$('.pagination .next, .paging .next, a[aria-label="Next"], a[rel="next"]');
      
                if (nextButton) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            return true;
          }

      // חיפוש קישור לדף הבא לפי מספר
      const currentPage = await page.evaluate(() => {
        const activePage = document.querySelector('.pagination .active, .paging .active');
        return activePage ? parseInt(activePage.textContent || '1') : 1;
      });

      const nextPageLink = await page.$(`.pagination a[href*="page=${currentPage + 1}"], .paging a[href*="page=${currentPage + 1}"]`);
      
                if (nextPageLink) {
            await nextPageLink.click();
            await page.waitForLoadState('networkidle');
            return true;
          }

      return false;

    } catch (error) {
      console.error('שגיאה במעבר לדף הבא:', error);
      return false;
    }
  }

  /**
   * שמירת קורסים בדאטהבייס
   */
  async saveCoursesToDatabase(userId: string, courses: CourseInfo[]): Promise<void> {
    try {
      console.log(`💾 שומר ${courses.length} קורסים בדאטהבייס...`);

      for (const course of courses) {
        // שמירת קורס
        const { error: courseError } = await supabase
          .from('courses')
          .upsert({
            id: course.id,
            code: course.code,
            name: course.name,
            description: course.description,
            credits: course.credits,
            semester: course.semester,
            academicyear: course.year,
            faculty: course.faculty,
            department: course.department,
            instructor: course.instructor,
            isactive: course.isActive,
            moodleid: course.moodleId,
            moodleurl: course.moodleUrl,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (courseError) {
          console.error(`שגיאה בשמירת קורס ${course.name}:`, courseError);
          continue;
        }

        // יצירת הרשמה לקורס
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .upsert({
            userid: userId,
            courseid: course.id,
            status: 'ACTIVE',
            enrolledat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }, {
            onConflict: 'userid,courseid'
          });

        if (enrollmentError) {
          console.error(`שגיאה בהרשמה לקורס ${course.name}:`, enrollmentError);
        }
      }

      console.log(`✅ קורסים נשמרו בהצלחה`);

    } catch (error) {
      console.error('שגיאה בשמירת קורסים:', error);
      throw error;
    }
  }

  /**
   * בדיקת חיבור ואיסוף קורסים
   */
  async testCourseCollection(credentials: MoodleCredentials): Promise<CourseCollectionResult> {
    try {
      console.log(`🧪 בודק איסוף קורסים...`);
      
      const result = await this.collectCourses(credentials);
      
      if (result.success && result.courses) {
        console.log(`✅ בדיקה הושלמה בהצלחה: ${result.courses.length} קורסים נמצאו`);
      } else {
        console.log(`❌ בדיקה נכשלה: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    }
  }
}

// יצירת instance גלובלי
export const courseCollector = new CourseCollector(); 