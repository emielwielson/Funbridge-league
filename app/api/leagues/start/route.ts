import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { League } from '@/lib/types/league';
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
 * POST /api/leagues/start - Start a league (admin only)
 * Updates status to 'active' and automatically generates matches for all divisions
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

    // Check if another league is active (database constraint will also prevent this)
    const { data: activeLeague } = await supabase
      .from('leagues')
      .select('id')
      .eq('status', 'active')
      .maybeSingle<{ id: string }>();

    if (activeLeague && activeLeague.id !== leagueId) {
      return NextResponse.json(
        { data: null, error: 'Another league is already active. Please finish it first.' },
        { status: 400 }
      );
    }

    // Verify league is in draft status
    const { data: league } = await supabase
      .from('leagues')
      .select('status')
      .eq('id', leagueId)
      .single<{ status: string }>();

    if (!league) {
      return NextResponse.json(
        { data: null, error: 'League not found' },
        { status: 404 }
      );
    }

    if (league.status !== 'draft') {
      return NextResponse.json(
        { data: null, error: 'Only draft leagues can be started.' },
        { status: 400 }
      );
    }

    // Update league status to active
    const { data: updatedLeague, error: updateError } = await supabase
      .from('leagues')
      .update({ status: 'active', updated_at: new Date().toISOString() } as any)
      .eq('id', leagueId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to start league' },
        { status: 500 }
      );
    }

    // Generate matches for all divisions
    try {
      // Get all divisions that have players assigned in this league
      const { data: playerDivisions, error: playerDivisionsError } = await supabase
        .from('player_divisions')
        .select('division_id')
        .eq('league_id', leagueId);

      if (playerDivisionsError) {
        // Log error but don't fail the league start
        console.error('Error fetching player divisions for match generation:', playerDivisionsError);
      } else if (playerDivisions && playerDivisions.length > 0) {
        // Get unique division IDs
        const uniqueDivisionIds = [...new Set(playerDivisions.map((pd) => pd.division_id))];

        let totalMatchesGenerated = 0;

        // Generate matches for each division
        for (const divisionId of uniqueDivisionIds) {
          // Get all players in this division for this league
          const { data: players, error: playersError } = await supabase
            .from('player_divisions')
            .select('player_id')
            .eq('league_id', leagueId)
            .eq('division_id', divisionId);

          if (playersError || !players || players.length < 2) {
            // Skip divisions with less than 2 players
            continue;
          }

          const playerIds = players.map((p) => p.player_id);
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
            // Log error but continue with other divisions
            console.error(`Failed to insert matches for division ${divisionId}:`, insertError);
            continue;
          }

          totalMatchesGenerated += matchPairs.length;
        }

        // Log match generation result
        console.log(`Generated ${totalMatchesGenerated} matches for league ${leagueId}`);
      }
    } catch (matchGenError: any) {
      // Log error but don't fail the league start
      // The league is already active, matches can be generated manually if needed
      console.error('Error during match generation:', matchGenError);
    }

    return NextResponse.json({ data: updatedLeague, error: null });
  } catch (error: any) {
    console.error('Start league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to start league' },
      { status: 500 }
    );
  }
}

