/**
 * Rankings calculation utilities
 * Functions to calculate player rankings based on match results
 */

import type { MatchWithResult } from '@/lib/types/match';
import type { PlayerRanking } from '@/lib/types/rankings';
import { calculateMatchOutcome, calculateVP } from './match-calculations';

/**
 * Calculate statistics for a single player based on their matches
 */
export function calculatePlayerStats(
  matches: MatchWithResult[],
  playerId: string,
  handicap: number
): {
  matchesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  totalVP: number;
  finalScoreDifference: number;
} {
  // Filter to matches where player is involved and has results
  const playerMatches = matches.filter(
    (match) =>
      match.result &&
      (match.player_a_id === playerId || match.player_b_id === playerId)
  );

  let wins = 0;
  let ties = 0;
  let losses = 0;
  let totalVP = 0;
  let finalScoreDifference = 0; // Sum of (your final score - opponent's final score) for each match

  for (const match of playerMatches) {
    if (!match.result) continue;

    const isPlayerA = match.player_a_id === playerId;
    const playerAImp = match.result.player_a_imp_score;
    const playerBImp = match.result.player_b_imp_score;
    const playerAHandicap = match.player_a_handicap ?? 0;
    const playerBHandicap = match.player_b_handicap ?? 0;

    // Calculate outcome
    const outcome = calculateMatchOutcome(
      playerAImp,
      playerAHandicap,
      playerBImp,
      playerBHandicap
    );

    // Calculate final scores
    const playerAFinalScore = playerAImp + playerAHandicap;
    const playerBFinalScore = playerBImp + playerBHandicap;

    // Calculate VP for this player
    const player = isPlayerA ? 'a' : 'b';
    const vp = calculateVP(
      playerAImp,
      playerAHandicap,
      playerBImp,
      playerBHandicap,
      player
    );
    totalVP += vp;

    // Calculate score difference for this match: (your final score) - (opponent's final score)
    const matchScoreDifference = isPlayerA
      ? playerAFinalScore - playerBFinalScore
      : playerBFinalScore - playerAFinalScore;
    finalScoreDifference += matchScoreDifference;

    // Track wins, ties, losses
    if (outcome === 'tie') {
      ties++;
    } else if (
      (isPlayerA && outcome === 'player_a_wins') ||
      (!isPlayerA && outcome === 'player_b_wins')
    ) {
      wins++;
    } else {
      losses++;
    }
  }

  return {
    matchesPlayed: playerMatches.length,
    wins,
    ties,
    losses,
    totalVP,
    finalScoreDifference,
  };
}

/**
 * Calculate rankings for all players in a division
 */
export function calculateRankingsForDivision(
  matches: MatchWithResult[],
  players: Array<{ id: string; name: string; handicap: number }>
): Omit<PlayerRanking, 'rank'>[] {
  return players.map((player) => {
    const stats = calculatePlayerStats(matches, player.id, player.handicap);

    return {
      playerId: player.id,
      playerName: player.name,
      handicap: player.handicap,
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      ties: stats.ties,
      losses: stats.losses,
      totalVP: stats.totalVP,
      finalScoreDifference: stats.finalScoreDifference,
    };
  });
}

/**
 * Sort rankings and assign rank numbers
 * Sorts by total VP (descending), then by wins (descending), then by matches played (ascending)
 * Handles tied ranks appropriately
 */
export function sortRankings(
  rankings: Omit<PlayerRanking, 'rank'>[]
): PlayerRanking[] {
  // Sort by total VP descending, then by wins descending, then by matches played ascending
  const sorted = [...rankings].sort((a, b) => {
    if (b.totalVP !== a.totalVP) {
      return b.totalVP - a.totalVP;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return a.matchesPlayed - b.matchesPlayed;
  });

  // Assign ranks
  const ranked: PlayerRanking[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const ranking = sorted[i];

    // If this is not the first player and has different stats than previous, update rank
    if (
      i > 0 &&
      (ranking.totalVP !== sorted[i - 1].totalVP ||
        ranking.wins !== sorted[i - 1].wins ||
        ranking.matchesPlayed !== sorted[i - 1].matchesPlayed)
    ) {
      currentRank = i + 1;
    }

    ranked.push({
      ...ranking,
      rank: currentRank,
    });
  }

  return ranked;
}

