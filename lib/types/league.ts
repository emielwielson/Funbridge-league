/**
 * League types and interfaces
 */

export type LeagueStatus = 'draft' | 'active' | 'archived';

export interface League {
  id: string;
  status: LeagueStatus;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

