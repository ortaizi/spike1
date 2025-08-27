import { createSyncJob, updateSyncJob } from './database/sync-jobs';
import { withRetry } from './error-handler';
import { supabase } from './db';

export interface SyncCredentials {
  moodle_username: string;
  moodle_password: string;
  university_id: string;
}

export interface SyncResult {
  success: boolean;
  jobId: string;
  message: string;
  data?: any;
}

/**
 * התחלת תהליך סנכרון רקע אסינכרוני
 */
export async function startBackgroundSync(
  userId: string, 
  credentials: SyncCredentials
): Promise<SyncResult> {
  try {
    console.log('🚀 מתחיל תהליך סנכרון רקע עבור משתמש:', userId);
    console.log('🔑 פרטי התחברות:', {
      username: credentials.moodle_username,
      university_id: credentials.university_id
    });
    
    // יצירת job חדש
    const jobId = await createSyncJob(userId);
    console.log('✅ נוצר job חדש:', jobId);
    
    // הפעלת תהליך רקע (לא חוסם את התגובה)
    console.log('🔄 מפעיל תהליך רקע...');
    setImmediate(() => {
      console.log('🔄 תהליך רקע התחיל...');
      performBackgroundSync(jobId, userId, credentials).catch(error => {
        console.error('❌ שגיאה בתהליך רקע:', error);
        updateSyncJob(jobId, {
          status: 'error',
          progress: -1,
          message: `שגיאה: ${error.message}`
        }).catch(console.error);
      });
    });
    
    console.log('✅ תהליך רקע הופעל בהצלחה');
    return {
      success: true,
      jobId,
      message: 'תהליך סנכרון הופעל בהצלחה'
    };
    
  } catch (error) {
    console.error('❌ שגיאה בהתחלת סנכרון רקע:', error);
    return {
      success: false,
      jobId: '',
      message: `שגיאה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
    };
  }
}

/**
 * ביצוע תהליך הסנכרון בפועל
 */
async function performBackgroundSync(
  jobId: string, 
  userId: string, 
  credentials: SyncCredentials
): Promise<void> {
  try {
    console.log('🔄 מתחיל ביצוע סנכרון עבור job:', jobId);
    
    // שלב 1: בדיקת/יצירת טבלאות
    await updateSyncJob(jobId, {
      status: 'creating_tables',
      progress: 10,
      message: 'בודק ומייצר טבלאות נדרשות...'
    });
    
    await withRetry(async () => {
      await ensureUserTables(userId);
    });
    
    // שלב 2: איסוף נתונים ראשוני
    await updateSyncJob(jobId, {
      status: 'fetching_courses',
      progress: 20,
      message: 'אוסף נתוני קורסים מהמודל...'
    });
    
    const coursesData = await withRetry(async () => {
      return await fetchUserCourses(userId, credentials);
    });
    
    // שלב 3: איסוף מפורט לכל קורס
    await updateSyncJob(jobId, {
      status: 'analyzing_content',
      progress: 40,
      message: 'מנתח תוכן קורסים...'
    });
    
    let processedCourses = 0;
    for (const course of coursesData) {
      await withRetry(async () => {
        await analyzeCourse(course, jobId);
      });
      
      processedCourses++;
      const progress = 40 + Math.floor((processedCourses / coursesData.length) * 30);
      await updateSyncJob(jobId, {
        status: 'analyzing_content',
        progress,
        message: `מנתח קורס ${processedCourses} מתוך ${coursesData.length}...`
      });
    }
    
    // שלב 4: סיווג וארגון
    await updateSyncJob(jobId, {
      status: 'classifying_data',
      progress: 70,
      message: 'מסווג ומארגן נתונים...'
    });
    
    const classifiedData = await withRetry(async () => {
      return await classifyAllContent(coursesData);
    });
    
    // שלב 5: שמירה בDB
    await updateSyncJob(jobId, {
      status: 'saving_to_database',
      progress: 90,
      message: 'שומר נתונים בדטה בייס...'
    });
    
    await withRetry(async () => {
      await saveToDatabase(userId, classifiedData);
    });
    
    // שלב 6: סיום
    await updateSyncJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'סנכרון הושלם בהצלחה!',
      data: {
        totalCourses: coursesData.length,
        totalItems: classifiedData.totalItems,
        processingTime: Date.now()
      }
    });
    
    console.log('✅ סנכרון הושלם בהצלחה עבור job:', jobId);
    
  } catch (error) {
    console.error('❌ שגיאה בתהליך סנכרון:', error);
    await updateSyncJob(jobId, {
      status: 'error',
      progress: -1,
      message: `שגיאה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
    });
    throw error;
  }
}

/**
 * בדיקהיצירת טבלאות נדרשות
 */
async function ensureUserTables(userId: string): Promise<void> {
  console.log('🏗️ בודק טבלאות עבור משתמש:', userId);
  
  // כאן תהיה לוגיקה ליצירת טבלאות נדרשות
  // כרגע נשתמש ב-mock
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ טבלאות מוכנות');
}

/**
 * איסוף נתוני קורסים מהמודל
 */
async function fetchUserCourses(userId: string, _credentials: SyncCredentials): Promise<any[]> {
  console.log('📊 אוסף נתוני קורסים עבור:', userId);
  
  // נחזיר נתונים מדומים כרגע - מותאם למבנה הדטה בייס
  const mockCourses = [
    {
      id: 'course_1',
      name: 'מבוא למדעי המחשב',
      nameEn: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'קורס מבוא למדעי המחשב',
      instructor: 'ד"ר כהן',
      semester: 'א',
      year: 2024,
      faculty: 'מדעי המחשב',
      department: 'מדעי המחשב',
      credits: 3,
      moodleId: 'moodle_course_1',
      sections: [
        {
          id: 'section_1',
          title: 'מבוא לתכנות',
          description: 'הכרות עם עקרונות התכנות',
          orderIndex: 1,
          items: [
            {
              id: 'item_1',
              title: 'סרטון מבוא',
              type: 'video',
              description: 'סרטון מבוא לתכנות',
              duration: '45 דקות',
              url: 'https://example.com/video1',
              fileType: 'mp4',
              orderIndex: 1,
              moodleId: 'moodle_item_1',
              lastModified: new Date().toISOString(),
              metadata: { duration: 2700 }
            },
            {
              id: 'item_2',
              title: 'מצגת מבוא',
              type: 'document',
              description: 'מצגת מבוא לתכנות',
              url: 'https://example.com/presentation1',
              fileType: 'pdf',
              orderIndex: 2,
              moodleId: 'moodle_item_2',
              lastModified: new Date().toISOString(),
              metadata: { pages: 25 }
            }
          ]
        },
        {
          id: 'section_2',
          title: 'תרגול מעשי',
          description: 'תרגול מעשי בתכנות',
          orderIndex: 2,
          items: [
            {
              id: 'item_3',
              title: 'תרגיל 1 - משתנים',
              type: 'assignment',
              description: 'תרגיל על משתנים ולולאות',
              dueDate: '2024-12-15T23:59:59Z',
              url: 'https://example.com/assignment1',
              fileType: 'pdf',
              orderIndex: 1,
              moodleId: 'moodle_item_3',
              lastModified: new Date().toISOString(),
              metadata: { weight: 10 }
            }
          ]
        }
      ],
      assignments: [
        {
          id: 'assignment_1',
          title: 'תרגיל 1 - משתנים ולולאות',
          description: 'תרגיל על משתנים ולולאות',
          dueDate: '2024-12-15T23:59:59Z',
          priority: 'MEDIUM',
          status: 'PENDING',
          weight: 10,
          maxGrade: 100,
          attachments: ['assignment1.pdf'],
          submissionStatus: 'not_submitted',
          gradeStatus: 'not_graded',
          feedback: null,
          maxAttempts: 3,
          currentAttempt: 0,
          submissionTypes: ['file']
        }
      ],
      files: [
        {
          id: 'file_1',
          name: 'סילבוס הקורס',
          type: 'document',
          fileType: 'pdf',
          url: 'https://example.com/syllabus.pdf'
        },
        {
          id: 'file_2',
          name: 'ספר הקורס',
          type: 'document',
          fileType: 'pdf',
          url: 'https://example.com/textbook.pdf'
        }
      ],
      teachingStaff: [
        {
          id: 'staff_1',
          name: 'ד"ר כהן',
          title: 'מרצה בכיר',
          email: 'cohen@university.ac.il',
          officeHours: 'יום ב׳ 14:00-16:00',
          phone: '03-1234567',
          office: 'בניין 34, חדר 201'
        }
      ],
      announcements: [
        {
          id: 'announcement_1',
          title: 'שינוי מועד הגשה',
          content: 'תרגיל 1 יוגש עד יום ראשון במקום יום חמישי',
          instructor: 'ד"ר כהן',
          isNew: true,
          priority: 'high',
          category: 'assignment',
          publishedAt: new Date().toISOString()
        }
      ],
      exams: [
        {
          id: 'exam_1',
          title: 'מבחן אמצע',
          type: 'midterm',
          examDate: '2024-12-20T09:00:00Z',
          duration: 90,
          location: 'אולם 101',
          instructions: 'להביא עט ונייר',
          weight: 30
        }
      ]
    },
    {
      id: 'course_2', 
      name: 'מבני נתונים',
      nameEn: 'Data Structures',
      code: 'CS201',
      description: 'קורס מבני נתונים מתקדם',
      instructor: 'פרופ׳ לוי',
      semester: 'א',
      year: 2024,
      faculty: 'מדעי המחשב',
      department: 'מדעי המחשב',
      credits: 4,
      moodleId: 'moodle_course_2',
      sections: [
        {
          id: 'section_3',
          title: 'רשימות מקושרות',
          description: 'הכרות עם רשימות מקושרות',
          orderIndex: 1,
          items: [
            {
              id: 'item_4',
              title: 'תרגיל 2 - רשימות מקושרות',
              type: 'assignment',
              description: 'תרגיל על רשימות מקושרות',
              dueDate: '2024-12-20T23:59:59Z',
              url: 'https://example.com/assignment2',
              fileType: 'pdf',
              orderIndex: 1,
              moodleId: 'moodle_item_4',
              lastModified: new Date().toISOString(),
              metadata: { weight: 15 }
            }
          ]
        }
      ],
      assignments: [
        {
          id: 'assignment_2',
          title: 'תרגיל 2 - רשימות מקושרות',
          description: 'תרגיל על רשימות מקושרות',
          dueDate: '2024-12-20T23:59:59Z',
          priority: 'HIGH',
          status: 'PENDING',
          weight: 15,
          maxGrade: 100,
          attachments: ['assignment2.pdf'],
          submissionStatus: 'not_submitted',
          gradeStatus: 'not_graded',
          feedback: null,
          maxAttempts: 2,
          currentAttempt: 0,
          submissionTypes: ['file', 'code']
        }
      ],
      files: [
        {
          id: 'file_3',
          name: 'ספר מבני נתונים',
          type: 'document',
          fileType: 'pdf',
          url: 'https://example.com/datastructures.pdf'
        }
      ],
      teachingStaff: [
        {
          id: 'staff_2',
          name: 'פרופ׳ לוי',
          title: 'פרופסור',
          email: 'levy@university.ac.il',
          officeHours: 'יום ג׳ 10:00-12:00',
          phone: '03-1234568',
          office: 'בניין 34, חדר 205'
        }
      ],
      announcements: [],
      exams: [
        {
          id: 'exam_2',
          title: 'מבחן סוף',
          type: 'final',
          examDate: '2025-01-15T09:00:00Z',
          duration: 120,
          location: 'אולם 102',
          instructions: 'להביא מחשבון',
          weight: 50
        }
      ]
    }
  ];
  
  console.log('✅ איסוף נתונים הושלם (mock data)');
  console.log(`📊 נמצאו ${mockCourses.length} קורסים`);
  
  return mockCourses;
}

/**
 * ניתוח קורס בודד
 */
async function analyzeCourse(course: any, _jobId: string): Promise<void> {
  console.log('🔍 מנתח קורס:', course.name || course.id);
  
  // נשתמש ב-mock analysis במקום API call
  await new Promise(resolve => setTimeout(resolve, 1000)); // simulate processing time
  
  console.log('✅ ניתוח קורס הושלם (mock)');
}

/**
 * סיווג וארגון כל התוכן
 */
async function classifyAllContent(coursesData: any[]): Promise<any> {
  console.log('🗂️ מסווג ומארגן תוכן...');
  
  const classifiedData = {
    totalItems: 0,
    categories: {
      assignments: 0,
      lectures: 0,
      exams: 0,
      materials: 0,
      files: 0,
      announcements: 0,
      teachingStaff: 0,
      sections: 0,
      courseItems: 0
    },
    courses: coursesData.map(course => ({
      id: course.id,
      name: course.name,
      nameEn: course.nameEn,
      code: course.code,
      description: course.description,
      instructor: course.instructor,
      semester: course.semester,
      year: course.year,
      faculty: course.faculty,
      department: course.department,
      credits: course.credits,
      moodleId: course.moodleId,
      sections: course.sections || [],
      assignments: course.assignments || [],
      files: course.files || [],
      teachingStaff: course.teachingStaff || [],
      announcements: course.announcements || [],
      exams: course.exams || [],
      items: course.items || []
    }))
  };
  
  // חישוב סטטיסטיקות
  for (const course of classifiedData.courses) {
    // מטלות
    classifiedData.totalItems += course.assignments.length;
    classifiedData.categories.assignments += course.assignments.length;
    
    // קבצים
    classifiedData.totalItems += course.files.length;
    classifiedData.categories.files += course.files.length;
    
    // הודעות
    classifiedData.totalItems += course.announcements.length;
    classifiedData.categories.announcements += course.announcements.length;
    
    // מבחנים
    classifiedData.totalItems += course.exams.length;
    classifiedData.categories.exams += course.exams.length;
    
    // צוות הוראה
    classifiedData.totalItems += course.teachingStaff.length;
    classifiedData.categories.teachingStaff += course.teachingStaff.length;
    
    // sections
    classifiedData.totalItems += course.sections.length;
    classifiedData.categories.sections += course.sections.length;
    
    // פריטי קורס
    for (const section of course.sections) {
      if (section.items) {
        classifiedData.totalItems += section.items.length;
        classifiedData.categories.courseItems += section.items.length;
        
        // סיווג פריטים לפי סוג
        for (const item of section.items) {
          switch (item.type) {
            case 'video':
              classifiedData.categories.lectures++;
              break;
            case 'document':
              classifiedData.categories.materials++;
              break;
            case 'assignment':
              classifiedData.categories.assignments++;
              break;
            default:
              classifiedData.categories.materials++;
          }
        }
      }
    }
  }
  
  console.log('✅ סיווג הושלם');
  console.log(`📊 סטטיסטיקות: ${classifiedData.totalItems} פריטים, ${classifiedData.courses.length} קורסים`);
  console.log(`📋 פירוט: ${classifiedData.categories.assignments} מטלות, ${classifiedData.categories.files} קבצים, ${classifiedData.categories.exams} מבחנים, ${classifiedData.categories.announcements} הודעות`);
  
  return classifiedData;
}

/**
 * שמירה בדטה בייס
 */
async function saveToDatabase(userId: string, classifiedData: any): Promise<void> {
  console.log('💾 שומר נתונים בדטה בייס...');
  
  try {
    const { saveWithServiceRole } = await import('./database/service-role');
    
    console.log('🔐 משתמש ב-Service Role לעקיפת RLS...');
    
    // שמירת קורסים
    for (const course of classifiedData.courses) {
      console.log(`📝 שומר קורס: ${course.name}`);
      
      try {
        // שמירת קורס עם Service Role - מותאם למבנה הנוכחי
        const courseData = {
          id: course.id,
          code: course.code || course.id,
          name: course.name,
          nameen: course.nameEn || course.name,
          description: course.description,
          credits: course.credits || 0,
          semester: course.semester || 'א',
          academicyear: course.year || 2024,
          faculty: course.faculty || 'מדעי המחשב',
          department: course.department || 'מדעי המחשב',
          instructor: course.instructor,
          isactive: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          moodle_course_id: course.moodleId || course.id,
          last_sync: new Date().toISOString(),
          sync_enabled: true,
          course_format: 'topics',
          visibility: 'visible',
          user_id: userId // הוספת user_id לעקיפת RLS
        };
        
        const courseResult = await saveWithServiceRole('courses', courseData, 'upsert');
        
        if (!courseResult.success) {
          console.error('שגיאה בשמירת קורס:', courseResult.error);
          // נמשיך גם אם יש שגיאה
          continue;
        } else {
          console.log(`✅ קורס נשמר בהצלחה: ${course.name}`);
        }

        // שמירת הרשמה לקורס - מותאם למבנה הנוכחי
        const enrollmentData = {
          id: `enrollment_${userId}_${course.id}`,
          userid: userId,
          courseid: course.id,
          status: 'ACTIVE',
          enrolledat: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const enrollmentResult = await saveWithServiceRole('course_enrollments', enrollmentData, 'upsert');
        
        if (!enrollmentResult.success) {
          console.error('שגיאה בשמירת הרשמה:', enrollmentResult.error);
        } else {
          console.log(`✅ הרשמה לקורס נשמרה: ${course.name}`);
        }

        // יצירת sections לקורס
        if (course.sections) {
          for (const section of course.sections) {
            console.log(`📂 שומר section: ${section.title}`);
            
            const sectionData = {
              id: section.id,
              courseid: course.id,
              title: section.title,
              description: section.description,
              orderindex: section.orderIndex || 0,
              isactive: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const sectionResult = await saveWithServiceRole('course_sections', sectionData, 'upsert');
            
            if (!sectionResult.success) {
              console.error('שגיאה בשמירת section:', sectionResult.error);
              continue;
            }

            // שמירת פריטי הקורס
            if (section.items) {
              for (const item of section.items) {
                console.log(`📄 שומר פריט: ${item.title}`);
                
                const itemData = {
                  id: item.id,
                  sectionid: section.id,
                  title: item.title,
                  type: item.type || 'document',
                  description: item.description,
                  duration: item.duration,
                  duedate: item.dueDate,
                  url: item.url,
                  filetype: item.fileType,
                  isactive: true,
                  orderindex: item.orderIndex || 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  moodle_id: item.moodleId || item.id,
                  last_modified: item.lastModified ? new Date(item.lastModified).toISOString() : null,
                  sync_status: 'completed',
                  is_hidden: false,
                  metadata: item.metadata || {}
                };
                
                const itemResult = await saveWithServiceRole('course_items', itemData, 'upsert');
                
                if (!itemResult.success) {
                  console.error('שגיאה בשמירת פריט:', itemResult.error);
                } else {
                  console.log(`✅ פריט נשמר: ${item.title}`);
                }
              }
            }
          }
        }

        // שמירת מטלות - מותאם למבנה הנוכחי
        if (course.assignments) {
          for (const assignment of course.assignments) {
            console.log(`📝 שומר מטלה: ${assignment.title}`);
            
            const { error: assignmentError } = await supabase
              .from('assignments')
              .upsert({
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                courseid: course.id,
                duedate: assignment.dueDate,
                priority: assignment.priority || 'MEDIUM',
                status: assignment.status || 'PENDING',
                weight: assignment.weight || 0,
                maxgrade: assignment.maxGrade || 100,
                attachments: assignment.attachments || [],
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString(),
                submission_status: assignment.submissionStatus || 'not_submitted',
                grade_status: assignment.gradeStatus || 'not_graded',
                feedback: assignment.feedback,
                max_attempts: assignment.maxAttempts || 1,
                current_attempt: assignment.currentAttempt || 0,
                submission_types: assignment.submissionTypes || ['file']
              }, {
                onConflict: 'id'
              });

            if (assignmentError) {
              console.error('שגיאה בשמירת מטלה:', assignmentError);
            } else {
              console.log(`✅ מטלה נשמרה בהצלחה: ${assignment.title}`);
            }
          }
        }

        // שמירת קבצי קורס
        if (course.files) {
          for (const file of course.files) {
            console.log(`📁 שומר קובץ: ${file.name}`);
            
            const { error: fileError } = await supabase
              .from('course_files')
              .upsert({
                id: file.id,
                courseid: course.id,
                name: file.name,
                type: file.type,
                filetype: file.fileType,
                url: file.url,
                lastupdated: new Date().toISOString(),
                isactive: true,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (fileError) {
              console.error('שגיאה בשמירת קובץ:', fileError);
            } else {
              console.log(`✅ קובץ נשמר: ${file.name}`);
            }
          }
        }

        // שמירת צוות ההוראה
        if (course.teachingStaff) {
          for (const staff of course.teachingStaff) {
            console.log(`👨‍🏫 שומר צוות הוראה: ${staff.name}`);
            
            const { error: staffError } = await supabase
              .from('teaching_staff')
              .upsert({
                id: staff.id,
                courseid: course.id,
                name: staff.name,
                title: staff.title,
                email: staff.email,
                officehours: staff.officeHours,
                phone: staff.phone,
                office: staff.office,
                isactive: true,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (staffError) {
              console.error('שגיאה בשמירת צוות הוראה:', staffError);
            } else {
              console.log(`✅ צוות הוראה נשמר: ${staff.name}`);
            }
          }
        }

        // שמירת הודעות
        if (course.announcements) {
          for (const announcement of course.announcements) {
            console.log(`📢 שומר הודעה: ${announcement.title}`);
            
            const { error: announcementError } = await supabase
              .from('announcements')
              .upsert({
                id: announcement.id,
                courseid: course.id,
                title: announcement.title,
                content: announcement.content,
                instructor: announcement.instructor,
                isnew: announcement.isNew || true,
                priority: announcement.priority || 'normal',
                category: announcement.category || 'general',
                publishedat: announcement.publishedAt ? new Date(announcement.publishedAt).toISOString() : new Date().toISOString(),
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (announcementError) {
              console.error('שגיאה בשמירת הודעה:', announcementError);
            } else {
              console.log(`✅ הודעה נשמרה: ${announcement.title}`);
            }
          }
        }

        // שמירת מבחנים
        if (course.exams) {
          for (const exam of course.exams) {
            console.log(`📋 שומר מבחן: ${exam.title}`);
            
            const { error: examError } = await supabase
              .from('exams')
              .upsert({
                id: exam.id,
                courseid: course.id,
                title: exam.title,
                type: exam.type,
                examdate: exam.examDate,
                duration: exam.duration,
                location: exam.location,
                instructions: exam.instructions,
                weight: exam.weight,
                isactive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (examError) {
              console.error('שגיאה בשמירת מבחן:', examError);
            } else {
              console.log(`✅ מבחן נשמר: ${exam.title}`);
            }
          }
        }

      } catch (courseError) {
        console.error(`❌ שגיאה בשמירת קורס ${course.name}:`, courseError);
        // נמשיך לקורס הבא
        continue;
      }
    }

    // שמירת נתוני ניתוח וסיווג
    try {
      console.log('📊 שומר נתוני ניתוח...');
      
      // שמירת נתוני ניתוח לטבלת content_analysis
      for (const course of classifiedData.courses) {
        if (course.assignments && course.assignments.length > 0) {
          for (const assignment of course.assignments) {
            const analysisData = {
              id: `analysis_${assignment.id}`,
              course_item_id: assignment.id,
              content_type: 'assignment',
              difficulty_level: assignment.priority === 'HIGH' ? 3 : assignment.priority === 'MEDIUM' ? 2 : 1,
              estimated_hours: assignment.weight || 5,
              priority_score: assignment.priority === 'HIGH' ? 90 : assignment.priority === 'MEDIUM' ? 60 : 30,
              tags: ['assignment', course.faculty, course.department],
              ai_summary: `מטלה בקורס ${course.name}: ${assignment.title}`,
              key_topics: [course.name, assignment.title],
              confidence_score: 0.85,
              analysis_version: '1.0',
              analyzed_at: new Date().toISOString()
            };
            
            const analysisResult = await saveWithServiceRole('content_analysis', analysisData, 'upsert');
            
            if (!analysisResult.success) {
              console.error('שגיאה בשמירת ניתוח:', analysisResult.error);
            } else {
              console.log(`✅ ניתוח נשמר: ${assignment.title}`);
            }
          }
        }
      }
      
      console.log('✅ נתוני ניתוח נשמרו');
    } catch (analysisError) {
      console.error('שגיאה בשמירת נתוני ניתוח:', analysisError);
    }

    // עדכון סטטוס המשתמש
    try {
      const userUpdateData = {
        moodleLastSync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const userResult = await saveWithServiceRole('users', userUpdateData, 'update');
      
      if (!userResult.success) {
        console.error('שגיאה בעדכון סטטוס משתמש:', userResult.error);
      } else {
        console.log('✅ סטטוס משתמש עודכן');
      }
    } catch (userError) {
      console.error('שגיאה בעדכון סטטוס משתמש:', userError);
    }

    console.log('✅ שמירה הושלמה');
    console.log(`🎉 סה"כ נשמרו: ${classifiedData.courses.length} קורסים, ${classifiedData.totalItems} מטלות`);
    
  } catch (error) {
    console.error('❌ שגיאה בשמירה בדטה בייס:', error);
    throw error;
  }
} 