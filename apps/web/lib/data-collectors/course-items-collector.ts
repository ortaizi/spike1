/**
 * מודול איסוף פריטי קורס ממודל
 * ==============================
 * 
 * מודול זה מטפל באיסוף כל הפריטים מכל קורס במודל
 * כולל sections, files, assignments, announcements, exams, emails, teaching staff
 */

import { MoodleConnector, MoodleCredentials, MoodleSession } from '../moodle-connector.js';
import { createClient } from '@supabase/supabase-js';
import { env } from "../env"

// טיפוסים
export interface CourseItem {
  id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  type: 'assignment' | 'file' | 'announcement' | 'exam' | 'email' | 'lecture' | 'resource' | 'link';
  description?: string;
  url?: string;
  fileType?: string;
  fileSize?: number;
  dueDate?: Date;
  isActive: boolean;
  orderIndex: number;
  moodleId?: string;
  moodleUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  moodleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeachingStaff {
  id: string;
  courseId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  office?: string;
  officeHours?: string;
  isActive: boolean;
  moodleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseItemsCollectionResult {
  success: boolean;
  courseId?: string;
  sections?: CourseSection[];
  items?: CourseItem[];
  teachingStaff?: TeachingStaff[];
  error?: string;
  totalItems?: number;
  totalSections?: number;
  totalStaff?: number;
  collectionTime?: Date;
}

// חיבור ל-Supabase
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * מחלקת איסוף פריטי קורס
 */
export class CourseItemsCollector {
  private moodleConnector: MoodleConnector;
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor() {
    this.moodleConnector = new MoodleConnector();
  }

  /**
   * איסוף כל הפריטים מקורס ספציפי
   */
  async collectCourseItems(
    credentials: MoodleCredentials, 
    courseId: string, 
    courseUrl: string
  ): Promise<CourseItemsCollectionResult> {
    let session: MoodleSession | undefined;

    try {
      console.log(`📚 מתחיל איסוף פריטים מקורס ${courseId}...`);

      // התחברות למודל
      const connectionResult = await this.moodleConnector.connect(credentials);
      
      if (!connectionResult.success || !connectionResult.session) {
        return {
          success: false,
          error: connectionResult.error || 'שגיאה בהתחברות למודל'
        };
      }

      session = connectionResult.session;

      // ניווט לדף הקורס
      await session.page.goto(courseUrl);
      await session.page.waitForLoadState('networkidle');

      // איסוף sections
      const sections = await this.extractCourseSections(session.page, courseId);
      console.log(`📋 נמצאו ${sections.length} sections`);

      // איסוף פריטים מכל section
      const allItems: CourseItem[] = [];
      for (const section of sections) {
        const sectionItems = await this.extractItemsFromSection(session.page, courseId, section);
        allItems.push(...sectionItems);
      }

      // איסוף teaching staff
      const teachingStaff = await this.extractTeachingStaff(session.page, courseId);

      // איסוף announcements
      const announcements = await this.extractAnnouncements(session.page, courseId);

      // איסוף emails
      const emails = await this.extractEmails(session.page, courseId);

      // איסוף exams
      const exams = await this.extractExams(session.page, courseId);

      // שילוב כל הפריטים
      const allCourseItems = [
        ...allItems,
        ...announcements,
        ...emails,
        ...exams
      ];

      console.log(`✅ איסוף הושלם: ${allCourseItems.length} פריטים, ${sections.length} sections, ${teachingStaff.length} צוות הוראה`);

      return {
        success: true,
        courseId,
        sections,
        items: allCourseItems,
        teachingStaff,
        totalItems: allCourseItems.length,
        totalSections: sections.length,
        totalStaff: teachingStaff.length,
        collectionTime: new Date()
      };

    } catch (error) {
      console.error(`❌ שגיאה באיסוף פריטים מקורס ${courseId}:`, error);
      return {
        success: false,
        courseId,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
    } finally {
      if (session) {
        await session.browser.close();
      }
    }
  }

  /**
   * חילוץ sections של הקורס
   */
  private async extractCourseSections(page: any, courseId: string): Promise<CourseSection[]> {
    const sections: CourseSection[] = [];

    try {
      // Moodle section selectors
      const sectionSelectors = [
        '.section',
        '.course-content .section',
        '.course-content .sectionname',
        '.course-content .section-title',
        '.course-content .sectionname a',
        '.course-content .section-title a'
      ];

      for (const selector of sectionSelectors) {
        const elements = await page.$$(selector);
        
        if (elements.length > 0) {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            try {
              const title = await element.textContent() || `Section ${i + 1}`;
              const sectionId = `section_${courseId}_${i + 1}`;
              
              const section: CourseSection = {
                id: sectionId,
                courseId,
                title: title.trim(),
                orderIndex: i + 1,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              sections.push(section);
            } catch (error) {
              console.warn(`⚠️ שגיאה בעיבוד section ${i + 1}:`, error);
              continue;
            }
          }
          break; // אם מצאנו sections, לא נמשיך לשאר ה-selectors
        }
      }

      return sections;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ sections:', error);
      return [];
    }
  }

  /**
   * חילוץ פריטים מ-section ספציפי
   */
  private async extractItemsFromSection(
    page: any, 
    courseId: string, 
    section: CourseSection
  ): Promise<CourseItem[]> {
    const items: CourseItem[] = [];

    try {
      // Moodle item selectors
      const itemSelectors = [
        '.activity a[href]',
        '.resource a[href]',
        '.assign a[href]',
        '.quiz a[href]',
        '.forum a[href]',
        '.url a[href]',
        '.file a[href]',
        '.page a[href]',
        '.book a[href]',
        '.folder a[href]',
        '.label a[href]',
        'a[href*="mod/assign"]',
        'a[href*="mod/quiz"]',
        'a[href*="mod/forum"]',
        'a[href*="mod/resource"]',
        'a[href*="mod/url"]',
        'a[href*="mod/page"]',
        'a[href*="mod/book"]',
        'a[href*="mod/folder"]',
        'a[href*="mod/label"]'
      ];

      for (const selector of itemSelectors) {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          try {
            const url = await element.getAttribute('href');
            const title = await element.textContent() || `Item ${i + 1}`;
            
            if (url && title) {
              const itemType = this.classifyItemType(url, title, element);
              const itemId = `item_${courseId}_${section.id}_${i + 1}`;
              
              const item: CourseItem = {
                id: itemId,
                courseId,
                sectionId: section.id,
                title: title.trim(),
                type: itemType,
                url,
                isActive: true,
                orderIndex: i + 1,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              items.push(item);
            }
          } catch (error) {
            console.warn(`⚠️ שגיאה בעיבוד פריט ${i + 1}:`, error);
            continue;
          }
        }
      }

      return items;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ פריטים:', error);
      return [];
    }
  }

  /**
   * חילוץ teaching staff
   */
  private async extractTeachingStaff(page: any, courseId: string): Promise<TeachingStaff[]> {
    const staff: TeachingStaff[] = [];

    try {
      // Moodle teaching staff selectors
      const staffSelectors = [
        '.teacher',
        '.instructor',
        '.course-teacher',
        '.course-instructor',
        '.staff-member',
        '.course-staff'
      ];

      for (const selector of staffSelectors) {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          try {
            const name = await element.textContent() || `Staff ${i + 1}`;
            const staffId = `staff_${courseId}_${i + 1}`;
            
            const staffMember: TeachingStaff = {
              id: staffId,
              courseId,
              name: name.trim(),
              role: 'Instructor',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            staff.push(staffMember);
          } catch (error) {
            console.warn(`⚠️ שגיאה בעיבוד צוות הוראה ${i + 1}:`, error);
            continue;
          }
        }
      }

      return staff;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ צוות הוראה:', error);
      return [];
    }
  }

  /**
   * חילוץ announcements
   */
  private async extractAnnouncements(page: any, courseId: string): Promise<CourseItem[]> {
    const announcements: CourseItem[] = [];

    try {
      // Moodle announcement selectors
      const announcementSelectors = [
        '.forum a[href*="forum"]',
        '.announcement a[href]',
        'a[href*="mod/forum"]',
        '.news a[href]'
      ];

      for (const selector of announcementSelectors) {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          try {
            const url = await element.getAttribute('href');
            const title = await element.textContent() || `Announcement ${i + 1}`;
            
            if (url && title) {
              const announcementId = `announcement_${courseId}_${i + 1}`;
              
              const announcement: CourseItem = {
                id: announcementId,
                courseId,
                title: title.trim(),
                type: 'announcement',
                url,
                isActive: true,
                orderIndex: i + 1,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              announcements.push(announcement);
            }
          } catch (error) {
            console.warn(`⚠️ שגיאה בעיבוד הודעה ${i + 1}:`, error);
            continue;
          }
        }
      }

      return announcements;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ הודעות:', error);
      return [];
    }
  }

  /**
   * חילוץ emails
   */
  private async extractEmails(page: any, courseId: string): Promise<CourseItem[]> {
    const emails: CourseItem[] = [];

    try {
      // Moodle email selectors
      const emailSelectors = [
        '.email a[href]',
        'a[href*="mailto:"]',
        '.contact a[href]'
      ];

      for (const selector of emailSelectors) {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          try {
            const url = await element.getAttribute('href');
            const title = await element.textContent() || `Email ${i + 1}`;
            
            if (url && title) {
              const emailId = `email_${courseId}_${i + 1}`;
              
              const email: CourseItem = {
                id: emailId,
                courseId,
                title: title.trim(),
                type: 'email',
                url,
                isActive: true,
                orderIndex: i + 1,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              emails.push(email);
            }
          } catch (error) {
            console.warn(`⚠️ שגיאה בעיבוד אימייל ${i + 1}:`, error);
            continue;
          }
        }
      }

      return emails;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ אימיילים:', error);
      return [];
    }
  }

  /**
   * חילוץ exams
   */
  private async extractExams(page: any, courseId: string): Promise<CourseItem[]> {
    const exams: CourseItem[] = [];

    try {
      // Moodle exam selectors
      const examSelectors = [
        '.quiz a[href]',
        '.exam a[href]',
        '.test a[href]',
        'a[href*="mod/quiz"]',
        'a[href*="mod/assign"][href*="test"]'
      ];

      for (const selector of examSelectors) {
        const elements = await page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          try {
            const url = await element.getAttribute('href');
            const title = await element.textContent() || `Exam ${i + 1}`;
            
            if (url && title) {
              const examId = `exam_${courseId}_${i + 1}`;
              
              const exam: CourseItem = {
                id: examId,
                courseId,
                title: title.trim(),
                type: 'exam',
                url,
                isActive: true,
                orderIndex: i + 1,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              exams.push(exam);
            }
          } catch (error) {
            console.warn(`⚠️ שגיאה בעיבוד מבחן ${i + 1}:`, error);
            continue;
          }
        }
      }

      return exams;
    } catch (error) {
      console.error('❌ שגיאה בחילוץ מבחנים:', error);
      return [];
    }
  }

  /**
   * סיווג סוג הפריט לפי URL ותוכן
   */
  private classifyItemType(url: string, title: string, element: any): CourseItem['type'] {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    // בדיקה לפי URL
    if (urlLower.includes('mod/assign')) return 'assignment';
    if (urlLower.includes('mod/quiz')) return 'exam';
    if (urlLower.includes('mod/forum')) return 'announcement';
    if (urlLower.includes('mod/resource')) return 'resource';
    if (urlLower.includes('mod/url')) return 'link';
    if (urlLower.includes('mod/page')) return 'lecture';
    if (urlLower.includes('mod/file')) return 'file';

    // בדיקה לפי כותרת
    if (titleLower.includes('תרגיל') || titleLower.includes('מטלה') || titleLower.includes('assignment')) return 'assignment';
    if (titleLower.includes('בחינה') || titleLower.includes('מבחן') || titleLower.includes('test') || titleLower.includes('quiz')) return 'exam';
    if (titleLower.includes('הרצאה') || titleLower.includes('lecture')) return 'lecture';
    if (titleLower.includes('קובץ') || titleLower.includes('file')) return 'file';
    if (titleLower.includes('קישור') || titleLower.includes('link')) return 'link';

    // ברירת מחדל
    return 'resource';
  }

  /**
   * שמירת פריטי קורס בדאטהבייס
   */
  async saveCourseItemsToDatabase(
    userId: string, 
    result: CourseItemsCollectionResult
  ): Promise<void> {
    if (!result.success || !result.courseId) {
      throw new Error('אין נתונים לשמירה');
    }

    try {
      // שמירת sections
      if (result.sections && result.sections.length > 0) {
        const { error: sectionsError } = await supabase
          .from('course_sections')
          .upsert(result.sections);

        if (sectionsError) {
          console.error('❌ שגיאה בשמירת sections:', sectionsError);
        }
      }

      // שמירת פריטים
      if (result.items && result.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('course_items')
          .upsert(result.items);

        if (itemsError) {
          console.error('❌ שגיאה בשמירת פריטים:', itemsError);
        }
      }

      // שמירת teaching staff
      if (result.teachingStaff && result.teachingStaff.length > 0) {
        const { error: staffError } = await supabase
          .from('teaching_staff')
          .upsert(result.teachingStaff);

        if (staffError) {
          console.error('❌ שגיאה בשמירת צוות הוראה:', staffError);
        }
      }

      console.log(`✅ נשמרו ${result.items?.length || 0} פריטים, ${result.sections?.length || 0} sections, ${result.teachingStaff?.length || 0} צוות הוראה`);
    } catch (error) {
      console.error('❌ שגיאה בשמירה בדאטהבייס:', error);
      throw error;
    }
  }

  /**
   * בדיקת איסוף פריטי קורס
   */
  async testCourseItemsCollection(
    credentials: MoodleCredentials,
    courseId: string,
    courseUrl: string
  ): Promise<CourseItemsCollectionResult> {
    console.log(`🧪 מתחיל בדיקת איסוף פריטים מקורס ${courseId}...`);
    
    const result = await this.collectCourseItems(credentials, courseId, courseUrl);
    
    if (result.success) {
      console.log(`✅ בדיקה הושלמה בהצלחה:`);
      console.log(`   - ${result.totalItems} פריטים`);
      console.log(`   - ${result.totalSections} sections`);
      console.log(`   - ${result.totalStaff} צוות הוראה`);
    } else {
      console.log(`❌ בדיקה נכשלה: ${result.error}`);
    }

    return result;
  }
} 