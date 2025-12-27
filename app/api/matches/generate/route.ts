import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { generateRoundRobinMatches } from '@/lib/utils/match-generation';

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
 * POST /api/matches/generate - Generate matches for all divisions in a league (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { leagueId } = body;

    if (!leagueId || typeof leagueId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'League ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify league exists
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, status')
      .eq('id', leagueId)
      .single<{ id: string; status: string }>();

    if (leagueError || !league) {
      return NextResponse.json(
        { data: null, error: 'League not found' },
        { status: 404 }
      );
    }

    // Get all divisions that have players assigned in this league
    const { data: playerDivisions, error: playerDivisionsError } = await supabase
      .from('player_divisions')
      .select('division_id')
      .eq('league_id', leagueId);

    if (playerDivisionsError) {
      return NextResponse.json(
        { data: null, error: playerDivisionsError.message || 'Failed to fetch player divisions' },
        { status: 500 }
      );
    }

    if (!playerDivisions || playerDivisions.length === 0) {
      return NextResponse.json(
        { data: { success: true, matchesGenerated: 0, warnings: ['No players assigned to divisions'] }, error: null }
      );
    }

    // Get unique division IDs
    const typedPlayerDivisions = playerDivisions as Array<{ division_id: string }>;
    const uniqueDivisionIds = [...new Set(typedPlayerDivisions.map((pd) => pd.division_id))];

    let totalMatchesGenerated = 0;
    const warnings: string[] = [];

    // Generate matches for each division
    for (const divisionId of uniqueDivisionIds) {
      // Get all players in this division for this league
      const { data: players, error: playersError } = await supabase
        .from('player_divisions')
        .select('player_id')
        .eq('league_id', leagueId)
        .eq('division_id', divisionId);

      if (playersError) {
        warnings.push(`Failed to fetch players for division ${divisionId}`);
        continue;
      }

      if (!players || players.length < 2) {
        warnings.push(`Division ${divisionId} has less than 2 players, skipping match generation`);
        continue;
      }

      const typedPlayers = players as Array<{ player_id: string }>;
      const playerIds = typedPlayers.map((p) => p.player_id);
      const matchPairs = generateRoundRobinMatches(playerIds);

      if (matchPairs.length === 0) {
        continue;
      }

      // Insert matches into database
      const matchesToInsert = matchPairs.map((pair) => ({
        league_id: leagueId,
        division_id: divisionId,
        player_a_id: pair.playerA,
        player_b_id: pair.playerB,
      }));

      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert as any);

      if (insertError) {
        warnings.push(`Failed to insert matches for division ${divisionId}: ${insertError.message}`);
        continue;
      }

      totalMatchesGenerated += matchPairs.length;
    }

    return NextResponse.json({
      data: {
        success: true,
        matchesGenerated: totalMatchesGenerated,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Generate matches error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to generate matches' },
      { status: 500 }
    );
  }
}

