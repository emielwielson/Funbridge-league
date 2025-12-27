import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { UserWithDivision } from '@/lib/types/user';

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
 * GET /api/users - Get all registered users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const supabase = getSupabaseClient();

    // Get active or draft league to fetch division assignments
    const { data: activeLeague } = await supabase
      .from('leagues')
      .select('id')
      .eq('status', 'active')
      .maybeSingle<{ id: string }>();

    const { data: draftLeague } = activeLeague
      ? { data: null }
      : await supabase
          .from('leagues')
          .select('id')
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string }>();

    const currentLeague = activeLeague || draftLeague;

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (usersError) {
      return NextResponse.json(
        { data: null, error: usersError.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users) {
      return NextResponse.json({ data: [], error: null });
    }

    // If there's a current league (active or draft), fetch division assignments
    if (currentLeague) {
      const { data: assignments } = await supabase
        .from('player_divisions')
        .select('player_id, division_id, divisions(name)')
        .eq('league_id', currentLeague.id) as any;

      // Map assignments to users
      const typedUsers = users as any[];
      const usersWithDivisions: UserWithDivision[] = typedUsers.map((user: any) => {
        const assignment = assignments?.find((a: any) => a.player_id === user.id);
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          handicap: user.handicap,
          email: user.email,
          funbridge_username: user.funbridge_username,
          division_id: (assignment as { division_id: string } | null)?.division_id,
          division_name: assignment?.divisions
            ? (assignment.divisions as any).name
            : undefined,
          league_id: currentLeague.id,
        };
      });

      return NextResponse.json({ data: usersWithDivisions, error: null });
    }

    // No current league, return users without division info
    const typedUsersForResponse = users as any[];
    return NextResponse.json({
      data: typedUsersForResponse.map((user: any) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        handicap: user.handicap,
        email: user.email,
        funbridge_username: user.funbridge_username,
      })),
      error: null,
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

