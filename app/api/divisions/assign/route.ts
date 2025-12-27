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
 * POST /api/divisions/assign - Assign a player to a division (admin only)
 * Removes existing assignment for the league if one exists
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
    const { playerId, divisionId, leagueId } = body;

    if (!playerId || !divisionId || !leagueId) {
      return NextResponse.json(
        { data: null, error: 'Player ID, Division ID, and League ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check league status - can only assign when league is in draft
    const { data: league, error: leagueError } = await supabase
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
        { data: null, error: 'Players can only be assigned to divisions when the league is in draft status.' },
        { status: 400 }
      );
    }

    // Remove existing assignment for this player in this league
    await supabase
      .from('player_divisions')
      .delete()
      .eq('player_id', playerId)
      .eq('league_id', leagueId);

    // Create new assignment
    const { error: assignError } = await supabase
      .from('player_divisions')
      .insert({
        player_id: playerId,
        division_id: divisionId,
        league_id: leagueId,
      } as any);

    if (assignError) {
      return NextResponse.json(
        { data: null, error: assignError.message || 'Failed to assign player' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Assign player error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to assign player' },
      { status: 500 }
    );
  }
}

