/**
 * Users API functions for admin operations
 */

import { supabase } from '@/lib/supabase/client';
import type { User, UserWithDivision } from '@/lib/types/user';

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
      return 'A user with this information already exists.';
    default:
      return error.message || 'An error occurred';
  }
}

/**
 * Get all registered users (admin only)
 * Includes division information if user is assigned to a division
 */
export async function getAllUsers(): Promise<ApiResponse<UserWithDivision[]>> {
  try {
    // Get active or draft league to fetch division assignments
    const { data: activeLeague } = await supabase
      .from('leagues')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    const { data: draftLeague } = activeLeague
      ? { data: null }
      : await supabase
          .from('leagues')
          .select('id')
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    const currentLeague = activeLeague || draftLeague;

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (usersError) {
      return { data: null, error: mapError(usersError) };
    }

    if (!users) {
      return { data: [], error: null };
    }

    // If there's a current league (active or draft), fetch division assignments
    if (currentLeague) {
      const { data: assignments } = await supabase
        .from('player_divisions')
        .select('player_id, division_id, divisions(name)')
        .eq('league_id', currentLeague.id);

      // Map assignments to users
      const usersWithDivisions: UserWithDivision[] = users.map((user) => {
        const assignment = assignments?.find((a) => a.player_id === user.id);
        return {
          ...user,
          division_id: assignment?.division_id,
          division_name: assignment?.divisions
            ? (assignment.divisions as any).name
            : undefined,
          league_id: currentLeague.id,
        };
      });

      return { data: usersWithDivisions, error: null };
    }

    // No current league, return users without division info
    return {
      data: users.map((user) => ({ ...user })),
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Promote a player to admin role (admin only)
 */
export async function promoteToAdmin(
  userId: string
): Promise<ApiResponse<User>> {
  try {
    // Verify current user is admin (RLS will handle this, but double-check)
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
        error: 'Permission denied. Only admins can promote users.',
      };
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: mapError(updateError) };
    }

    return { data: updatedUser, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

/**
 * Update a player's handicap (admin only)
 */
export async function updateHandicap(
  userId: string,
  handicap: number
): Promise<ApiResponse<User>> {
  try {
    // Validate handicap is a number
    if (typeof handicap !== 'number' || isNaN(handicap)) {
      return { data: null, error: 'Handicap must be a valid number' };
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
        error: 'Permission denied. Only admins can update handicaps.',
      };
    }

    // Update handicap
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        handicap: Math.round(handicap), // Ensure it's an integer
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: mapError(updateError) };
    }

    return { data: updatedUser, error: null };
  } catch (error: any) {
    return { data: null, error: mapError(error) };
  }
}

