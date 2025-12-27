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
 * POST /api/leagues/finish - Finish a league (admin only)
 * Updates status to 'archived' and sets finished_at timestamp
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

    // Verify league is active
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

    if (league.status !== 'active') {
      return NextResponse.json(
        { data: null, error: 'Only active leagues can be finished.' },
        { status: 400 }
      );
    }

    // Update league status to archived
    const { data: updatedLeague, error: updateError } = await (supabase
      .from('leagues') as any)
      .update({
        status: 'archived',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', leagueId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to finish league' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedLeague, error: null });
  } catch (error: any) {
    console.error('Finish league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to finish league' },
      { status: 500 }
    );
  }
}

