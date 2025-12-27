/**
 * Divisions API functions for admin operations
 */

import { supabase } from '@/lib/supabase/client';
import type { Division } from '@/lib/types/division';

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
      return 'A division with this name already exists.';
    default:
      return error.message || 'An error occurred';
  }
}

/**
 * Get all divisions
 */
export async function getAllDivisions(): Promise<ApiResponse<Division[]>> {
  try {
    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .order('name', { ascending: true });

    if (divisionsError) {
      return { data: null, error: mapError(divisionsError) };
    }

    return { data: divisions || [], error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Create a new division (admin only)
 */
export async function createDivision(name: string): Promise<ApiResponse<Division>> {
  try {
    if (!name || name.trim() === '') {
      return { data: null, error: 'Division name is required' };
    }

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
        error: 'Permission denied. Only admins can create divisions.',
      };
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existing) {
      return { data: null, error: 'A division with this name already exists' };
    }

    // Create division
    const { data: division, error: createError } = await supabase
      .from('divisions')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (createError) {
      return { data: null, error: mapError(createError) };
    }

    return { data: division, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Assign a player to a division (admin only)
 * Removes existing assignment for the league if one exists
 */
export async function assignPlayerToDivision(
  playerId: string,
  divisionId: string,
  leagueId: string
): Promise<ApiResponse<{ success: boolean }>> {
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
        error: 'Permission denied. Only admins can assign players.',
      };
    }

    // Check league status - can only assign when league is in draft
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
        error: 'Players can only be assigned to divisions when the league is in draft status.',
      };
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
      });

    if (assignError) {
      return { data: null, error: mapError(assignError) };
    }

    return { data: { success: true }, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Remove a player from a division (admin only)
 */
export async function removePlayerFromDivision(
  playerId: string,
  leagueId: string
): Promise<ApiResponse<{ success: boolean }>> {
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
        error: 'Permission denied. Only admins can remove players from divisions.',
      };
    }

    // Check league status
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
        error: 'Players can only be removed from divisions when the league is in draft status.',
      };
    }

    // Remove assignment
    const { error: removeError } = await supabase
      .from('player_divisions')
      .delete()
      .eq('player_id', playerId)
      .eq('league_id', leagueId);

    if (removeError) {
      return { data: null, error: mapError(removeError) };
    }

    return { data: { success: true }, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

