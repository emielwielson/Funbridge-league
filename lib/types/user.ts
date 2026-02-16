/**
 * User types and interfaces
 */

export type UserRole = 'player' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string; // Internal use only (for Supabase Auth)
  funbridge_username?: string;
  role: UserRole;
  handicap: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
  };
}

export interface UserProfile extends User {
  funbridge_username?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

import type { LeagueStatus } from '@/lib/types/league';

export interface UserWithDivision extends User {
  division_id?: string;
  division_name?: string;
  league_id?: string;
  /** Present when league_id is set; used to show "Remove from league" only for draft leagues */
  league_status?: LeagueStatus;
}
