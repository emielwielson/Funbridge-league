/**
 * Match types and interfaces
 */

export type MatchOutcome = 'player_a_wins' | 'player_b_wins' | 'tie';

export interface Match {
  id: string;
  league_id: string;
  division_id: string;
  player_a_id: string;
  player_b_id: string;
  created_at: string;
  // Optional fields for display purposes
  player_a_name?: string;
  player_b_name?: string;
  player_a_handicap?: number;
  player_b_handicap?: number;
}

export interface MatchResult {
  id: string;
  match_id: string;
  player_a_imp_score: number;
  player_b_imp_score: number;
  entered_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MatchWithResult extends Match {
  result?: MatchResult;
}

