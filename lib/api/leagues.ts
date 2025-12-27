/**
 * Leagues API functions for admin operations
 * Client-side wrappers that call server-side API routes
 */

import type { League } from '@/lib/types/league';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get currently active league
 */
export async function getActiveLeague(): Promise<ApiResponse<League | null>> {
  try {
    const response = await fetch('/api/leagues?type=active', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch active league' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch active league' };
  }
}

/**
 * Get draft league (if exists)
 */
export async function getDraftLeague(): Promise<ApiResponse<League | null>> {
  try {
    const response = await fetch('/api/leagues?type=draft', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch draft league' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch draft league' };
  }
}

/**
 * Create a new league (status='draft', admin only)
 */
export async function createLeague(): Promise<ApiResponse<League>> {
  try {
    const response = await fetch('/api/leagues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to create league' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to create league' };
  }
}

/**
 * Start a league (admin only)
 * Updates status to 'active'
 * Note: Match generation will be handled in Task 4.0
 */
export async function startLeague(leagueId: string): Promise<ApiResponse<League>> {
  try {
    const response = await fetch('/api/leagues/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ leagueId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to start league' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to start league' };
  }
}

/**
 * Finish a league (admin only)
 * Updates status to 'archived' and sets finished_at timestamp
 */
export async function finishLeague(leagueId: string): Promise<ApiResponse<League>> {
  try {
    const response = await fetch('/api/leagues/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ leagueId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to finish league' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to finish league' };
  }
}

/**
 * Get all archived leagues
 */
export async function getArchivedLeagues(): Promise<ApiResponse<League[]>> {
  try {
    const response = await fetch('/api/leagues/archived', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch archived leagues' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch archived leagues' };
  }
}

