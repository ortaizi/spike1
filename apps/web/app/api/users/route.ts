import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const faculty = searchParams.get('faculty') || undefined;
    const department = searchParams.get('department') || undefined;
    const yearOfStudy = searchParams.get('yearOfStudy')
      ? parseInt(searchParams.get('yearOfStudy')!)
      : undefined;

    let query = supabase.from('users').select('*', { count: 'exact' });

    if (faculty) {
      query = query.eq('faculty', faculty);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (yearOfStudy) {
      query = query.eq('yearOfStudy', yearOfStudy);
    }

    const {
      data: users,
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
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
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
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
