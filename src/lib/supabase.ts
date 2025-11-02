import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'tabber';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'tabber';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'tabber';
          created_at?: string;
          updated_at?: string;
        };
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          institution_id: string | null;
          speaker_names: string[];
          total_points: number;
          total_speaks: number;
          rounds_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          institution_id?: string | null;
          speaker_names?: string[];
          total_points?: number;
          total_speaks?: number;
          rounds_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          institution_id?: string | null;
          speaker_names?: string[];
          total_points?: number;
          total_speaks?: number;
          rounds_count?: number;
          created_at?: string;
        };
      };
      adjudicators: {
        Row: {
          id: string;
          name: string;
          institution_id: string | null;
          strength: number;
          email: string | null;
          phone: string | null;
          conflicts: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          institution_id?: string | null;
          strength?: number;
          email?: string | null;
          phone?: string | null;
          conflicts?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          institution_id?: string | null;
          strength?: number;
          email?: string | null;
          phone?: string | null;
          conflicts?: string[];
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          capacity?: number;
          created_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          format: 'BP' | 'AP';
          start_date: string | null;
          end_date: string | null;
          status: 'setup' | 'ongoing' | 'completed';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          format?: 'BP' | 'AP';
          start_date?: string | null;
          end_date?: string | null;
          status?: 'setup' | 'ongoing' | 'completed';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          format?: 'BP' | 'AP';
          start_date?: string | null;
          end_date?: string | null;
          status?: 'setup' | 'ongoing' | 'completed';
          created_by?: string | null;
          created_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          tournament_id: string;
          round_number: number;
          name: string;
          motion: string | null;
          motion_1: string | null;
          motion_2: string | null;
          motion_3: string | null;
          info_slide: string | null;
          status: 'setup' | 'ongoing' | 'completed';
          round_type: 'inround' | 'outround' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round_number: number;
          name: string;
          motion?: string | null;
          motion_1?: string | null;
          motion_2?: string | null;
          motion_3?: string | null;
          info_slide?: string | null;
          status?: 'setup' | 'ongoing' | 'completed';
          round_type?: 'inround' | 'outround' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round_number?: number;
          name?: string;
          motion?: string | null;
          motion_1?: string | null;
          motion_2?: string | null;
          motion_3?: string | null;
          info_slide?: string | null;
          status?: 'setup' | 'ongoing' | 'completed';
          round_type?: 'inround' | 'outround' | null;
          created_at?: string;
        };
      };
      debates: {
        Row: {
          id: string;
          round_id: string;
          room_id: string | null;
          motion_used: string | null;
          status: 'pending' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          room_id?: string | null;
          motion_used?: string | null;
          status?: 'pending' | 'completed';
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          room_id?: string | null;
          motion_used?: string | null;
          status?: 'pending' | 'completed';
          created_at?: string;
        };
      };
      debate_teams: {
        Row: {
          id: string;
          debate_id: string;
          team_id: string;
          position: 'government' | 'opposition' | 'OG' | 'OO' | 'CG' | 'CO';
          points: number;
          total_speaks: number;
          rank: number | null;
        };
        Insert: {
          id?: string;
          debate_id: string;
          team_id: string;
          position: 'government' | 'opposition' | 'OG' | 'OO' | 'CG' | 'CO';
          points?: number;
          total_speaks?: number;
          rank?: number | null;
        };
        Update: {
          id?: string;
          debate_id?: string;
          team_id?: string;
          position?: 'government' | 'opposition' | 'OG' | 'OO' | 'CG' | 'CO';
          points?: number;
          total_speaks?: number;
          rank?: number | null;
        };
      };
      debate_adjudicators: {
        Row: {
          id: string;
          debate_id: string;
          adjudicator_id: string;
          role: 'chair' | 'panelist' | 'trainee';
        };
        Insert: {
          id?: string;
          debate_id: string;
          adjudicator_id: string;
          role?: 'chair' | 'panelist' | 'trainee';
        };
        Update: {
          id?: string;
          debate_id?: string;
          adjudicator_id?: string;
          role?: 'chair' | 'panelist' | 'trainee';
        };
      };
      speaker_scores: {
        Row: {
          id: string;
          debate_team_id: string;
          speaker_name: string;
          score: number;
          position: 1 | 2 | 3;
        };
        Insert: {
          id?: string;
          debate_team_id: string;
          speaker_name: string;
          score: number;
          position: 1 | 2 | 3;
        };
        Update: {
          id?: string;
          debate_team_id?: string;
          speaker_name?: string;
          score?: number;
          position?: 1 | 2 | 3;
        };
      };
    };
  };
};
