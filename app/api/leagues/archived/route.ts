import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/api/auth-utils';
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
 * GET /api/leagues/archived - Get all archived leagues
 */
export async function GET(request: NextRequest) {
  try {
    // All authenticated users can read archived leagues
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('status', 'archived')
      .order('finished_at', { ascending: false });

    if (leaguesError) {
      return NextResponse.json(
        { data: null, error: leaguesError.message || 'Failed to fetch archived leagues' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: leagues || [], error: null });
  } catch (error: any) {
    console.error('Get archived leagues error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch archived leagues' },
      { status: 500 }
    );
  }
}

