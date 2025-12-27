import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { League } from '@/lib/types/league';

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
 * Updates status to 'active'
 * Note: Match generation will be handled in Task 4.0
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
    // Note: Match generation will be handled in Task 4.0
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

    return NextResponse.json({ data: updatedLeague, error: null });
  } catch (error: any) {
    console.error('Start league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to start league' },
      { status: 500 }
    );
  }
}

