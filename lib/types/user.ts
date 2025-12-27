/**
 * User types and interfaces
 */

export type UserRole = 'player' | 'admin';

export interface User {
  id: string;
  username: string;
  email?: string;
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
  email: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface UserWithDivision extends User {
  division_id?: string;
  division_name?: string;
  league_id?: string;
}
