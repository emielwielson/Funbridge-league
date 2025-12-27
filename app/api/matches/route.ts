import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { MatchWithResult } from '@/lib/types/match';

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
 * GET /api/matches - Get matches by division or by player
 * Query params:
 *   - divisionId & leagueId: Get all matches for a division
 *   - playerId & leagueId: Get all matches for a specific player
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

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get('divisionId');
    const playerId = searchParams.get('playerId');
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { data: null, error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Validate that either divisionId or playerId is provided, but not both
    if (!divisionId && !playerId) {
      return NextResponse.json(
        { data: null, error: 'Either divisionId or playerId is required' },
        { status: 400 }
      );
    }

    if (divisionId && playerId) {
      return NextResponse.json(
        { data: null, error: 'Provide either divisionId or playerId, not both' },
        { status: 400 }
      );
    }

    // If fetching by player, ensure user can only access their own matches (unless admin)
    if (playerId && user.id !== playerId && user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: 'Forbidden: You can only access your own matches' },
        { status: 403 }
      );
    }

    // If fetching by division, ensure user is in that division (unless admin)
    if (divisionId && user.role !== 'admin') {
      const { data: assignment } = await supabase
        .from('player_divisions')
        .select('division_id')
        .eq('player_id', user.id)
        .eq('league_id', leagueId)
        .eq('division_id', divisionId)
        .maybeSingle();

      if (!assignment) {
        return NextResponse.json(
          { data: null, error: 'Forbidden: You can only access matches from your division' },
          { status: 403 }
        );
      }
    }

    // Build query to fetch matches with player names, handicaps, and results
    let query = supabase
      .from('matches')
      .select(`
        id,
        league_id,
        division_id,
        player_a_id,
        player_b_id,
        created_at,
        player_a:users!matches_player_a_id_fkey(name, handicap),
        player_b:users!matches_player_b_id_fkey(name, handicap),
        match_results(*)
      `)
      .eq('league_id', leagueId);

    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }

    if (playerId) {
      query = query.or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`);
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) {
      return NextResponse.json(
        { data: null, error: matchesError.message || 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    // Transform the data to MatchWithResult format
    const matchesWithResults: MatchWithResult[] = (matches || []).map((match: any) => ({
      id: match.id,
      league_id: match.league_id,
      division_id: match.division_id,
      player_a_id: match.player_a_id,
      player_b_id: match.player_b_id,
      created_at: match.created_at,
      player_a_name: match.player_a?.name,
      player_b_name: match.player_b?.name,
      player_a_handicap: match.player_a?.handicap ?? 0,
      player_b_handicap: match.player_b?.handicap ?? 0,
      result: match.match_results && match.match_results.length > 0
        ? {
            id: match.match_results[0].id,
            match_id: match.match_results[0].match_id,
            player_a_imp_score: match.match_results[0].player_a_imp_score,
            player_b_imp_score: match.match_results[0].player_b_imp_score,
            entered_by_user_id: match.match_results[0].entered_by_user_id,
            created_at: match.match_results[0].created_at,
            updated_at: match.match_results[0].updated_at,
          }
        : undefined,
    }));

    return NextResponse.json({ data: matchesWithResults, error: null });
  } catch (error: any) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

