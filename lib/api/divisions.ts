/**
 * Divisions API functions for admin operations
 * Client-side wrappers that call server-side API routes
 */

import type { Division } from '@/lib/types/division';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get all divisions
 */
export async function getAllDivisions(): Promise<ApiResponse<Division[]>> {
  try {
    const response = await fetch('/api/divisions', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch divisions' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch divisions' };
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

    const response = await fetch('/api/divisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to create division' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create division' };
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
    const response = await fetch('/api/divisions/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ playerId, divisionId, leagueId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to assign player' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to assign player' };
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
    const response = await fetch(
      `/api/divisions/remove?playerId=${encodeURIComponent(playerId)}&leagueId=${encodeURIComponent(leagueId)}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to remove player' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to remove player' };
  }
}

