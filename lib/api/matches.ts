/**
 * Matches API functions
 * Client-side wrappers that call server-side API routes
 */

import type { MatchWithResult } from '@/lib/types/match';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get all matches for a division in a league
 */
export async function getMatchesByDivision(
  divisionId: string,
  leagueId: string
): Promise<ApiResponse<MatchWithResult[]>> {
  try {
    const response = await fetch(
      `/api/matches?divisionId=${encodeURIComponent(divisionId)}&leagueId=${encodeURIComponent(leagueId)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch matches' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch matches' };
  }
}

/**
 * Get all matches for a specific player in a league
 */
export async function getMatchesByPlayer(
  playerId: string,
  leagueId: string
): Promise<ApiResponse<MatchWithResult[]>> {
  try {
    const response = await fetch(
      `/api/matches?playerId=${encodeURIComponent(playerId)}&leagueId=${encodeURIComponent(leagueId)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch matches' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch matches' };
  }
}

/**
 * Generate matches for all divisions in a league (admin only)
 */
export async function generateMatches(
  leagueId: string
): Promise<ApiResponse<{ success: boolean; matchesGenerated: number; warnings?: string[] }>> {
  try {
    const response = await fetch('/api/matches/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ leagueId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to generate matches' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to generate matches' };
  }
}

