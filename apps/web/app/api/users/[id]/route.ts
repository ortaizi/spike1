import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/db'
import { csrfProtection, rateLimit } from '../../../../lib/security/csrf-protection'
import { getServerSession } from 'next-auth'
import { unifiedAuthOptions } from '../../../../lib/auth/unified-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(20, 60000)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // CRITICAL SECURITY: Authentication check to prevent unauthorized access
    const session = await getServerSession(unifiedAuthOptions);
    if (!session?.user?.id) {
      console.warn('SECURITY: Unauthenticated access attempt to GET /api/users/[id]');
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // CRITICAL SECURITY: Authorization check to prevent IDOR attacks
    if (session.user.id !== params.id) {
      console.warn(`SECURITY: User ${session.user.id} attempted unauthorized access to user ${params.id}`);
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own profile' },
        { status: 403 }
      );
    }

    // Secure data query with selective field access (data minimization)
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, university_id, is_setup_complete, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(10, 60000)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Verify user can only update their own data
    const session = await getServerSession(unifiedAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is updating their own profile or is admin
    if (session.user.id !== params.id) {
      console.warn(`User ${session.user.id} attempted to update user ${params.id}`);
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('users')
      .update({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting (strict for DELETE operations)
    const rateLimitResponse = await rateLimit(5, 60000)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply CSRF protection
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Verify user can only delete their own data
    const session = await getServerSession(unifiedAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is deleting their own account
    if (session.user.id !== params.id) {
      console.warn(`User ${session.user.id} attempted to delete user ${params.id}`);
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own account' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 