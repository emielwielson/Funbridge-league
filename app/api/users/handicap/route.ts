import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * PUT /api/users/handicap - Update a player's handicap (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { userId, handicap } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate handicap is a number
    if (typeof handicap !== 'number' || isNaN(handicap)) {
      return NextResponse.json(
        { data: null, error: 'Handicap must be a valid number' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Update handicap
    const { data: updatedUser, error: updateError } = await (supabase
      .from('users') as any)
      .update({
        handicap: Math.round(handicap), // Ensure it's an integer
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to update handicap' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedUser, error: null });
  } catch (error: any) {
    console.error('Update handicap error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to update handicap' },
      { status: 500 }
    );
  }
}

