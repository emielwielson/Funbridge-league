/**
 * Rankings types and interfaces
 */

export interface PlayerRanking {
  rank: number;
  playerId: string;
  playerName: string;
  handicap: number;
  matchesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  totalVP: number; // Total Victory Points accumulated across all matches
  finalScoreDifference: number; // (IMP+handicap won) - (IMP+handicap lost)
}

