import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { MatchWithResult } from '@/lib/types/match';
import type { PlayerRanking } from '@/lib/types/rankings';
import {
  calculateRankingsForDivision,
  sortRankings,
} from '@/lib/utils/rankings';

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
 * GET /api/rankings - Get calculated rankings for a division
 * Query params:
 *   - divisionId & leagueId: Get rankings for a division
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
    const leagueId = searchParams.get('leagueId');

    if (!divisionId || !leagueId) {
      return NextResponse.json(
        { data: null, error: 'Division ID and League ID are required' },
        { status: 400 }
      );
    }

    // Fetch all matches for the division
    const { data: matches, error: matchesError } = await supabase
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
      .eq('league_id', leagueId)
      .eq('division_id', divisionId);

    if (matchesError) {
      return NextResponse.json(
        { data: null, error: matchesError.message || 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    console.log('Rankings API - Raw matches from database:', JSON.stringify(matches, null, 2));

    // Transform matches to MatchWithResult format (using same logic as matches API)
    const matchesWithResults: MatchWithResult[] = (matches || []).map(
      (match: any) => ({
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
        result: (() => {
          // Handle different possible structures: array, single object, or null
          const results = match.match_results;
          if (!results) return undefined;
          
          // If it's an array, get the first element
          const result = Array.isArray(results) ? results[0] : results;
          
          // If we have a result object with the required fields
          if (result && result.id && result.match_id !== undefined) {
            return {
              id: result.id,
              match_id: result.match_id,
              player_a_imp_score: result.player_a_imp_score,
              player_b_imp_score: result.player_b_imp_score,
              entered_by_user_id: result.entered_by_user_id,
              created_at: result.created_at,
              updated_at: result.updated_at,
            };
          }
          
          return undefined;
        })(),
      })
    );

    // Fetch all players assigned to this division in this league
    const { data: assignments, error: assignmentsError } = await supabase
      .from('player_divisions')
      .select(`
        player_id,
        users!player_divisions_player_id_fkey(id, name, handicap)
      `)
      .eq('division_id', divisionId)
      .eq('league_id', leagueId);

    if (assignmentsError) {
      return NextResponse.json(
        {
          data: null,
          error: assignmentsError.message || 'Failed to fetch player assignments',
        },
        { status: 500 }
      );
    }

    // Transform assignments to player array
    const players = (assignments || [])
      .map((assignment: any) => {
        const user = assignment.users;
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          handicap: user.handicap ?? 0,
        };
      })
      .filter((p: any) => p !== null) as Array<{
      id: string;
      name: string;
      handicap: number;
    }>;

    console.log('Rankings API - Transformed matches:', JSON.stringify(matchesWithResults, null, 2));
    console.log('Rankings API - Matches with results:', matchesWithResults.filter(m => m.result).length, 'out of', matchesWithResults.length);

    // Calculate rankings
    const rankingsWithoutRanks = calculateRankingsForDivision(
      matchesWithResults,
      players
    );
    const rankings = sortRankings(rankingsWithoutRanks);

    console.log('Rankings API - Calculated rankings:', JSON.stringify(rankings, null, 2));

    return NextResponse.json({ data: rankings, error: null });
  } catch (error: any) {
    console.error('Get rankings error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

