import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUserFromRequest } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { Division } from '@/lib/types/division';

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
 * GET /api/divisions - Get all divisions
 */
export async function GET(request: NextRequest) {
  try {
    // All authenticated users can read divisions
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .order('name', { ascending: true });

    if (divisionsError) {
      return NextResponse.json(
        { data: null, error: divisionsError.message || 'Failed to fetch divisions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: divisions || [], error: null });
  } catch (error: any) {
    console.error('Get divisions error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/divisions - Create a new division (admin only)
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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'Division name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'A division with this name already exists' },
        { status: 400 }
      );
    }

    // Create division
    const { data: division, error: createError } = await supabase
      .from('divisions')
      .insert({ name: name.trim() } as any)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { data: null, error: createError.message || 'Failed to create division' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: division, error: null });
  } catch (error: any) {
    console.error('Create division error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to create division' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/divisions - Delete a division (admin only)
 * Moves all players in the division to "no division" before deleting
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
    const divisionId = searchParams.get('divisionId');

    if (!divisionId) {
      return NextResponse.json(
        { data: null, error: 'Division ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if division exists
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name')
      .eq('id', divisionId)
      .single<{ id: string; name: string }>();

    if (divisionError || !division) {
      return NextResponse.json(
        { data: null, error: 'Division not found' },
        { status: 404 }
      );
    }

    // Get all leagues (active or draft) to check player assignments
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, status')
      .in('status', ['draft', 'active']);
    
    const typedLeagues = (leagues || []) as Array<{ id: string; status: string }>;

    if (!typedLeagues || typedLeagues.length === 0) {
      // No leagues exist, safe to delete division
      const { error: deleteError } = await supabase
        .from('divisions')
        .delete()
        .eq('id', divisionId);

      if (deleteError) {
        return NextResponse.json(
          { data: null, error: deleteError.message || 'Failed to delete division' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: { success: true }, error: null });
    }

    // Check if any league is active (can't delete division if league is active)
    const activeLeague = typedLeagues.find(l => l.status === 'active');
    if (activeLeague) {
      return NextResponse.json(
        { data: null, error: 'Cannot delete division while a league is active. Please finish the active league first.' },
        { status: 400 }
      );
    }

    // Get all player assignments for this division across all draft leagues
    const draftLeagueIds = typedLeagues.filter(l => l.status === 'draft').map(l => l.id);
    
    if (draftLeagueIds.length > 0) {
      // Remove all player assignments for this division (moves players to "no division")
      const { error: removeAssignmentsError } = await supabase
        .from('player_divisions')
        .delete()
        .eq('division_id', divisionId)
        .in('league_id', draftLeagueIds);

      if (removeAssignmentsError) {
        return NextResponse.json(
          { data: null, error: removeAssignmentsError.message || 'Failed to remove player assignments' },
          { status: 500 }
        );
      }
    }

    // Now delete the division
    const { error: deleteError } = await supabase
      .from('divisions')
      .delete()
      .eq('id', divisionId);

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: deleteError.message || 'Failed to delete division' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Delete division error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to delete division' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/divisions - Update a division name (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { divisionId, name } = body;

    if (!divisionId || typeof divisionId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'Division ID is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'Division name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if division exists
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id')
      .eq('id', divisionId)
      .single<{ id: string }>();

    if (divisionError || !division) {
      return NextResponse.json(
        { data: null, error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current division)
    const { data: existing } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name.trim())
      .neq('id', divisionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'A division with this name already exists' },
        { status: 400 }
      );
    }

    // Update division name
    const { data: updatedDivision, error: updateError } = await (supabase
      .from('divisions') as any)
      .update({ 
        name: name.trim(), 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', divisionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to update division' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedDivision, error: null });
  } catch (error: any) {
    console.error('Update division error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to update division' },
      { status: 500 }
    );
  }
}

