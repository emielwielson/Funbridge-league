/**
 * Leagues API functions for admin operations
 */

import { supabase } from '@/lib/supabase/client';
import type { League } from '@/lib/types/league';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Map Supabase errors to user-friendly messages
 */
function mapError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  switch (error.code) {
    case 'PGRST301':
      return 'Permission denied. You must be an admin to perform this action.';
    case '23505':
      return 'Another league is already active. Please finish the current league first.';
    default:
      return error.message || 'An error occurred';
  }
}

/**
 * Get currently active league
 */
export async function getActiveLeague(): Promise<ApiResponse<League | null>> {
  try {
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();

    if (leagueError) {
      return { data: null, error: mapError(leagueError) };
    }

    return { data: league, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Get draft league (if exists)
 */
export async function getDraftLeague(): Promise<ApiResponse<League | null>> {
  try {
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leagueError) {
      return { data: null, error: mapError(leagueError) };
    }

    return { data: league, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Create a new league (status='draft', admin only)
 */
export async function createLeague(): Promise<ApiResponse<League>> {
  try {
    // Verify current user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { data: null, error: 'You must be logged in to perform this action' };
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (currentUser?.role !== 'admin') {
      return {
        data: null,
        error: 'Permission denied. Only admins can create leagues.',
      };
    }

    // Check if there's already a draft league
    const draftResult = await getDraftLeague();
    if (draftResult.data) {
      return {
        data: null,
        error: 'A draft league already exists. Please use the existing league or finish it first.',
      };
    }

    // Create new league
    const { data: league, error: createError } = await supabase
      .from('leagues')
      .insert({ status: 'draft' })
      .select()
      .single();

    if (createError) {
      return { data: null, error: mapError(createError) };
    }

    return { data: league, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Start a league (admin only)
 * Updates status to 'active' and triggers match generation
 */
export async function startLeague(leagueId: string): Promise<ApiResponse<League>> {
  try {
    // Verify current user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { data: null, error: 'You must be logged in to perform this action' };
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (currentUser?.role !== 'admin') {
      return {
        data: null,
        error: 'Permission denied. Only admins can start leagues.',
      };
    }

    // Check if another league is active (database constraint will also prevent this)
    const activeResult = await getActiveLeague();
    if (activeResult.data && activeResult.data.id !== leagueId) {
      return {
        data: null,
        error: 'Another league is already active. Please finish it first.',
      };
    }

    // Verify league is in draft status
    const { data: league } = await supabase
      .from('leagues')
      .select('status')
      .eq('id', leagueId)
      .single();

    if (!league) {
      return { data: null, error: 'League not found' };
    }

    if (league.status !== 'draft') {
      return {
        data: null,
        error: 'Only draft leagues can be started.',
      };
    }

    // Update league status to active
    // Note: Match generation will be handled in Task 4
    const { data: updatedLeague, error: updateError } = await supabase
      .from('leagues')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', leagueId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: mapError(updateError) };
    }

    return { data: updatedLeague, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Finish a league (admin only)
 * Updates status to 'archived' and sets finished_at timestamp
 */
export async function finishLeague(leagueId: string): Promise<ApiResponse<League>> {
  try {
    // Verify current user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { data: null, error: 'You must be logged in to perform this action' };
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (currentUser?.role !== 'admin') {
      return {
        data: null,
        error: 'Permission denied. Only admins can finish leagues.',
      };
    }

    // Verify league is active
    const { data: league } = await supabase
      .from('leagues')
      .select('status')
      .eq('id', leagueId)
      .single();

    if (!league) {
      return { data: null, error: 'League not found' };
    }

    if (league.status !== 'active') {
      return {
        data: null,
        error: 'Only active leagues can be finished.',
      };
    }

    // Update league status to archived
    const { data: updatedLeague, error: updateError } = await supabase
      .from('leagues')
      .update({
        status: 'archived',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leagueId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: mapError(updateError) };
    }

    return { data: updatedLeague, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Get all archived leagues
 */
export async function getArchivedLeagues(): Promise<ApiResponse<League[]>> {
  try {
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('status', 'archived')
      .order('finished_at', { ascending: false });

    if (leaguesError) {
      return { data: null, error: mapError(leaguesError) };
    }

    return { data: leagues || [], error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

