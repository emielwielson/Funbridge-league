/**
 * Division types and interfaces
 */

export interface Division {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DivisionWithPlayerCount extends Division {
  player_count?: number;
}

