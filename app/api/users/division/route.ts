import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/api/auth-utils';
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
 * GET /api/users/division - Get current user's division assignment for a league
 * Query params: leagueId
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { data: null, error: 'League ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get user's division assignment for this league
    const { data: assignment, error: assignmentError } = await supabase
      .from('player_divisions')
      .select('division_id, divisions(name)')
      .eq('player_id', user.id)
      .eq('league_id', leagueId)
      .maybeSingle() as any;

    if (assignmentError) {
      return NextResponse.json(
        { data: null, error: assignmentError.message || 'Failed to fetch division assignment' },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json({ data: null, error: null });
    }

    return NextResponse.json({
      data: {
        division_id: assignment.division_id,
        division_name: assignment.divisions?.name,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Get user division error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch division assignment' },
      { status: 500 }
    );
  }
}

