/**
 * API endpoint לבדיקת הקורסים שנשמרו בדאטהבייס
 * ===============================================
 * 
 * endpoint זה בודק את הקורסים שנשמרו בטבלת courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from "../../../lib/env"

export async function GET() {
  try {
    console.log('🔍 בודק קורסים שנשמרו בדאטהבייס...');

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

    // בדיקת כל הקורסים
    const { data: allCourses, error: allCoursesError } = await supabase
      .from('courses')
      .select('*')
      .order('createdat', { ascending: false });

    if (allCoursesError) {
      console.error('❌ שגיאה בבדיקת כל הקורסים:', allCoursesError);
      return NextResponse.json({
        success: false,
        error: allCoursesError.message
      }, { status: 500 });
    }

    console.log(`✅ נמצאו ${allCourses?.length || 0} קורסים בדאטהבייס`);

    // בדיקת הרשמות
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('*')
      .order('enrolledat', { ascending: false });

    if (enrollmentsError) {
      console.error('❌ שגיאה בבדיקת הרשמות:', enrollmentsError);
    } else {
      console.log(`✅ נמצאו ${enrollments?.length || 0} הרשמות בדאטהבייס`);
    }

    // סיווג קורסים
    const realCourses = allCourses?.filter(course => 
      !course.id.startsWith('test_course_') && 
      course.name !== 'קורס בדיקה'
    ) || [];

    const testCourses = allCourses?.filter(course => 
      course.id.startsWith('test_course_') || 
      course.name === 'קורס בדיקה'
    ) || [];

    console.log(`📊 סיווג קורסים:`);
    console.log(`   - קורסים אמיתיים: ${realCourses.length}`);
    console.log(`   - קורסי בדיקה: ${testCourses.length}`);

    return NextResponse.json({
      success: true,
      message: 'בדיקת קורסים הושלמה בהצלחה',
      data: {
        totalCourses: allCourses?.length || 0,
        realCourses: realCourses.length,
        testCourses: testCourses.length,
        totalEnrollments: enrollments?.length || 0,
        courses: realCourses,
        testCourses: testCourses,
        enrollments: enrollments || []
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