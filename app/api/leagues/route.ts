import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUserFromRequest } from '@/lib/api/auth-utils';
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
 * GET /api/leagues - Get active or draft league
 * Query params: ?type=active|draft
 */
export async function GET(request: NextRequest) {
  try {
    // All authenticated users can read leagues
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active';

    const supabase = getSupabaseClient();

    if (type === 'active') {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (leagueError) {
        return NextResponse.json(
          { data: null, error: leagueError.message || 'Failed to fetch active league' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: league, error: null });
    } else if (type === 'draft') {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leagueError) {
        return NextResponse.json(
          { data: null, error: leagueError.message || 'Failed to fetch draft league' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: league, error: null });
    } else {
      return NextResponse.json(
        { data: null, error: 'Invalid type parameter. Use "active" or "draft"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Get league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch league' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues - Create a new league (status='draft', admin only)
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

    const supabase = getSupabaseClient();

    // Check if there's already a draft league
    const { data: existingDraft } = await supabase
      .from('leagues')
      .select('id')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraft) {
      return NextResponse.json(
        { data: null, error: 'A draft league already exists. Please use the existing league or finish it first.' },
        { status: 400 }
      );
    }

    // Create new league
    const { data: league, error: createError } = await supabase
      .from('leagues')
      .insert({ status: 'draft' } as any)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { data: null, error: createError.message || 'Failed to create league' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: league, error: null });
  } catch (error: any) {
    console.error('Create league error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to create league' },
      { status: 500 }
    );
  }
}

