// Database types for TypeScript
// This file should be generated using: npx supabase gen types typescript --project-id <project-id>
// For now, we'll define basic types manually

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          password_hash: string;
          role: 'player' | 'admin';
          handicap: number;
          email?: string | null;
          funbridge_username?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          password_hash: string;
          role?: 'player' | 'admin';
          handicap?: number;
          email?: string | null;
          funbridge_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          password_hash?: string;
          role?: 'player' | 'admin';
          handicap?: number;
          email?: string | null;
          funbridge_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      divisions: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          status: 'draft' | 'active' | 'archived';
          created_at: string;
          updated_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          status?: 'draft' | 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          status?: 'draft' | 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
          finished_at?: string | null;
        };
      };
      matches: {
        Row: {
          id: string;
          league_id: string;
          division_id: string;
          player_a_id: string;
          player_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          division_id: string;
          player_a_id: string;
          player_b_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          division_id?: string;
          player_a_id?: string;
          player_b_id?: string;
          created_at?: string;
        };
      };
      match_results: {
        Row: {
          id: string;
          match_id: string;
          player_a_imp_score: number;
          player_b_imp_score: number;
          entered_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_a_imp_score?: number;
          player_b_imp_score?: number;
          entered_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_a_imp_score?: number;
          player_b_imp_score?: number;
          entered_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_divisions: {
        Row: {
          id: string;
          player_id: string;
          division_id: string;
          league_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          division_id: string;
          league_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          division_id?: string;
          league_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

