import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { Division } from '@/lib/types/division';

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
 * GET /api/divisions/by-league - Get all divisions that have players assigned in a specific league
 * Query params: leagueId
 */
export async function GET(request: NextRequest) {
  try {
    // All authenticated users can read divisions
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

    // Get unique division IDs that have players assigned in this league
    const { data: assignments, error: assignmentsError } = await supabase
      .from('player_divisions')
      .select('division_id')
      .eq('league_id', leagueId);

    if (assignmentsError) {
      return NextResponse.json(
        { data: null, error: assignmentsError.message || 'Failed to fetch division assignments' },
        { status: 500 }
      );
    }

    // Extract unique division IDs
    const uniqueDivisionIds = Array.from(
      new Set((assignments || []).map((a: any) => a.division_id).filter(Boolean))
    );

    if (uniqueDivisionIds.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    // Fetch divisions
    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .in('id', uniqueDivisionIds)
      .order('name', { ascending: true });

    if (divisionsError) {
      return NextResponse.json(
        { data: null, error: divisionsError.message || 'Failed to fetch divisions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: divisions || [], error: null });
  } catch (error: any) {
    console.error('Get divisions by league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}
