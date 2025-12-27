/**
 * Rankings API functions
 * Client-side wrappers that call server-side API routes
 */

import type { PlayerRanking } from '@/lib/types/rankings';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get calculated rankings for a division in a league
 */
export async function getRankingsForDivision(
  divisionId: string,
  leagueId: string
): Promise<ApiResponse<PlayerRanking[]>> {
  try {
    const response = await fetch(
      `/api/rankings?divisionId=${encodeURIComponent(divisionId)}&leagueId=${encodeURIComponent(leagueId)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch rankings' };
    }

    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch rankings' };
  }
}

