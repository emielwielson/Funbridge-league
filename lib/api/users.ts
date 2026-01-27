/**
 * Users API functions for admin operations
 * Client-side wrappers that call server-side API routes
 */

import type { User, UserWithDivision } from '@/lib/types/user';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get all registered users (admin only)
 * Includes division information if user is assigned to a division
 */
export async function getAllUsers(): Promise<ApiResponse<UserWithDivision[]>> {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch users' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch users' };
  }
}

/**
 * Promote a player to admin role (admin only)
 */
export async function promoteToAdmin(
  userId: string
): Promise<ApiResponse<User>> {
  try {
    const response = await fetch('/api/users/promote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to promote user' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to promote user' };
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

    const response = await fetch('/api/users/handicap', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, handicap }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to update handicap' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update handicap' };
  }
}

/**
 * Reset a user's password (admin only)
 * Returns a temporary password that should be shared with the user
 */
export async function resetPassword(
  userId: string
): Promise<ApiResponse<{ temporaryPassword: string; userName: string }>> {
  try {
    const response = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to reset password' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to reset password' };
  }
}

