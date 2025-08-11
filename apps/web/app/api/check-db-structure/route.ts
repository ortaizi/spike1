/**
 * API endpoint לבדיקת מבנה הטבלה courses
 * =======================================
 * 
 * endpoint זה בודק את מבנה הטבלה courses ומחזיר את שמות העמודות
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from "../../../lib/env"

export async function GET() {
  try {
    console.log('🔍 בודק מבנה טבלת courses...');

    // חיבור ל-Supabase
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'חסרים משתני סביבה: NEXT_PUBLIC_SUPABASE_URL או SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // בדיקת נתונים בטבלה
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (coursesError) {
      console.error('❌ שגיאה בבדיקת נתונים:', coursesError);
      return NextResponse.json({
        success: false,
        error: coursesError.message
      }, { status: 500 });
    }

    console.log(`✅ נמצאו ${courses?.length || 0} קורסים בטבלה`);

    // בדיקת מבנה הטבלה על ידי ניסיון להוסיף קורס
    const testCourse = {
      id: 'test_course_' + Date.now(),
      code: 'TEST101',
      name: 'קורס בדיקה',
      description: 'קורס לבדיקת מבנה הטבלה',
      credits: 3,
      semester: '2024A',
      academicyear: 2024,
      faculty: 'בדיקה',
      department: 'בדיקה',
      instructor: 'מערכת הבדיקה',
      isactive: true,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { data: insertedCourse, error: insertError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select();

    if (insertError) {
      console.log('❌ שגיאה בהוספת קורס:', insertError);
      
      return NextResponse.json({
        success: false,
        error: insertError.message,
        data: {
          sampleCourses: courses || [],
          totalCourses: courses?.length || 0,
          testCourse,
          insertError
        }
      });
    }

    console.log('✅ קורס נוסף בהצלחה!');

    return NextResponse.json({
      success: true,
      message: 'בדיקת מבנה טבלה הושלמה בהצלחה',
      data: {
        sampleCourses: courses || [],
        totalCourses: courses?.length || 0,
        insertedCourse: insertedCourse?.[0]
      }
    });

  } catch (error) {
    console.error('❌ שגיאה ב-API endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
} 