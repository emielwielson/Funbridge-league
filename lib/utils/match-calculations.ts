/**
 * Match calculation utilities
 * Functions to calculate match outcomes, points, and scores
 */

import type { MatchOutcome } from '@/lib/types/match';

/**
 * VP conversion table based on IMP difference
 * Maps IMP difference to [Winner VP, Loser VP]
 */
const VP_TABLE: Record<number, [number, number]> = {
  0: [10.0, 10.0],
  1: [10.55, 9.45],
  2: [11.08, 8.92],
  3: [11.59, 8.41],
  4: [12.07, 7.93],
  5: [12.53, 7.47],
  6: [12.98, 7.02],
  7: [13.41, 6.59],
  8: [13.81, 6.19],
  9: [14.20, 5.80],
  10: [14.58, 5.42],
  11: [14.94, 5.06],
  12: [15.28, 4.72],
  13: [15.61, 4.39],
  14: [15.92, 4.08],
  15: [16.23, 3.77],
  16: [16.52, 3.48],
  17: [16.79, 3.21],
  18: [17.06, 2.94],
  19: [17.31, 2.69],
  20: [17.56, 2.44],
  21: [17.79, 2.21],
  22: [18.01, 1.99],
  23: [18.23, 1.77],
  24: [18.43, 1.57],
  25: [18.63, 1.37],
  26: [18.82, 1.18],
  27: [19.0, 1.0],
  28: [19.17, 0.83],
  29: [19.33, 0.67],
  30: [19.49, 0.51],
  31: [19.64, 0.36],
  32: [19.79, 0.21],
  33: [19.93, 0.07],
  34: [20.0, 0.0],
};

/**
 * Convert IMP difference to VP
 * @param impDifference The absolute IMP difference (final score difference)
 * @returns [Winner VP, Loser VP]
 */
function convertImpDifferenceToVP(impDifference: number): [number, number] {
  const absDiff = Math.abs(impDifference);
  
  // Clamp to valid range (0-34)
  const clampedDiff = Math.min(Math.max(Math.round(absDiff), 0), 34);
  
  // Return VP values from table
  return VP_TABLE[clampedDiff] || [20.0, 0.0];
}

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
 * Calculate VP (Victory Points) for a player based on IMP difference
 * @param playerAImp Player A's IMP score
 * @param playerAHandicap Player A's handicap
 * @param playerBImp Player B's IMP score
 * @param playerBHandicap Player B's handicap
 * @param player Which player ('a' or 'b')
 * @returns VP for the specified player
 */
export function calculateVP(
  playerAImp: number,
  playerAHandicap: number,
  playerBImp: number,
  playerBHandicap: number,
  player: 'a' | 'b'
): number {
  const playerAFinalScore = playerAImp + playerAHandicap;
  const playerBFinalScore = playerBImp + playerBHandicap;
  const impDifference = playerAFinalScore - playerBFinalScore;
  
  const [winnerVP, loserVP] = convertImpDifferenceToVP(impDifference);
  
  if (impDifference === 0) {
    // Tie - both players get 10.0 VP
    return 10.0;
  } else if (impDifference > 0) {
    // Player A wins
    return player === 'a' ? winnerVP : loserVP;
  } else {
    // Player B wins
    return player === 'b' ? winnerVP : loserVP;
  }
}

/**
 * Calculate match points for a player based on the outcome
 * @deprecated Use calculateVP instead
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

