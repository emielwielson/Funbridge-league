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
 * DELETE /api/divisions/remove - Remove a player from a division (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const leagueId = searchParams.get('leagueId');

    if (!playerId || !leagueId) {
      return NextResponse.json(
        { data: null, error: 'Player ID and League ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check league status
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
        { data: null, error: 'Players can only be removed from divisions when the league is in draft status.' },
        { status: 400 }
      );
    }

    // Remove assignment
    const { error: removeError } = await supabase
      .from('player_divisions')
      .delete()
      .eq('player_id', playerId)
      .eq('league_id', leagueId);

    if (removeError) {
      return NextResponse.json(
        { data: null, error: removeError.message || 'Failed to remove player' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Remove player error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to remove player' },
      { status: 500 }
    );
  }
}

