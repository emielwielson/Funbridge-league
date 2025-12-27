/**
 * Match results API functions
 * Client-side wrappers that call server-side API routes
 */

import type { MatchResult } from '@/lib/types/match';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Submit or update a match result
 */
export async function submitMatchResult(
  matchId: string,
  playerAImpScore: number,
  playerBImpScore: number
): Promise<ApiResponse<MatchResult>> {
  try {
    const response = await fetch('/api/match-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        matchId,
        playerAImpScore,
        playerBImpScore,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to submit match result' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to submit match result' };
  }
}

/**
 * Update a match result (admin only)
 */
export async function updateMatchResult(
  matchResultId: string,
  playerAImpScore: number,
  playerBImpScore: number
): Promise<ApiResponse<MatchResult>> {
  try {
    const response = await fetch('/api/match-results', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        matchResultId,
        playerAImpScore,
        playerBImpScore,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to update match result' };
    }

    return { data: data.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to update match result' };
  }
}

/**
 * Get match result for a specific match
 */
export async function getMatchResult(
  matchId: string
): Promise<ApiResponse<MatchResult | null>> {
  try {
    const response = await fetch(
      `/api/match-results?matchId=${encodeURIComponent(matchId)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch match result' };
    }

    return { data: data.data || null, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch match result' };
  }
}

