/**
 * Match calculation utilities
 * Functions to calculate match outcomes, points, and scores
 */

import type { MatchOutcome } from '@/lib/types/match';

/**
 * Calculate the outcome of a match based on IMP scores and handicaps
 * @param playerAImp Player A's IMP score
 * @param playerAHandicap Player A's handicap
 * @param playerBImp Player B's IMP score
 * @param playerBHandicap Player B's handicap
 * @returns The match outcome
 */
export function calculateMatchOutcome(
  playerAImp: number,
  playerAHandicap: number,
  playerBImp: number,
  playerBHandicap: number
): MatchOutcome {
  const playerAFinalScore = playerAImp + playerAHandicap;
  const playerBFinalScore = playerBImp + playerBHandicap;

  if (playerAFinalScore > playerBFinalScore) {
    return 'player_a_wins';
  } else if (playerBFinalScore > playerAFinalScore) {
    return 'player_b_wins';
  } else {
    return 'tie';
  }
}

/**
 * Calculate match points for a player based on the outcome
 * @param outcome The match outcome
 * @param player Which player ('a' or 'b')
 * @returns Match points (1 for win, 0.5 for tie, 0 for loss)
 */
export function calculateMatchPoints(
  outcome: MatchOutcome,
  player: 'a' | 'b'
): number {
  if (outcome === 'tie') {
    return 0.5;
  }

  if (
    (outcome === 'player_a_wins' && player === 'a') ||
    (outcome === 'player_b_wins' && player === 'b')
  ) {
    return 1;
  }

  return 0;
}

/**
 * Calculate final score (IMP + handicap)
 * @param impScore IMP score
 * @param handicap Handicap value
 * @returns Final score
 */
export function calculateFinalScore(impScore: number, handicap: number): number {
  return impScore + handicap;
}

/**
 * Calculate score difference for tiebreaker purposes
 * @param playerAImp Player A's IMP score
 * @param playerAHandicap Player A's handicap
 * @param playerBImp Player B's IMP score
 * @param playerBHandicap Player B's handicap
 * @returns Score difference (positive if Player A wins, negative if Player B wins)
 */
export function calculateScoreDifference(
  playerAImp: number,
  playerAHandicap: number,
  playerBImp: number,
  playerBHandicap: number
): number {
  const playerAFinalScore = playerAImp + playerAHandicap;
  const playerBFinalScore = playerBImp + playerBHandicap;
  return playerAFinalScore - playerBFinalScore;
}

