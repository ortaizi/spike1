import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const faculty = searchParams.get('faculty') || undefined;
    const department = searchParams.get('department') || undefined;
    const semester = searchParams.get('semester') || undefined;
    const academicYear = searchParams.get('academicYear')
      ? parseInt(searchParams.get('academicYear')!)
      : undefined;
    const isActive = searchParams.get('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined;
    const instructor = searchParams.get('instructor') || undefined;

    let query = supabase.from('courses').select('*', { count: 'exact' });

    if (faculty) {
      query = query.eq('faculty', faculty);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    if (academicYear) {
      query = query.eq('academicYear', academicYear);
    }
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive);
    }
    if (instructor) {
      query = query.eq('instructor', instructor);
    }

    const {
      data: courses,
      error,
      count,
    } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      data: courses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.code ||
      !body.name ||
      !body.credits ||
      !body.semester ||
      !body.academicYear ||
      !body.faculty ||
      !body.department
    ) {
      return NextResponse.json(
        {
          error:
            'Code, name, credits, semester, academic year, faculty, and department are required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
