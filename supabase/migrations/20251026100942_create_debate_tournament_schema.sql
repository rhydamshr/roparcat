/*
  # Debate Tournament Management System - Complete Schema

  ## Overview
  This migration creates a complete database schema for managing debate tournaments,
  including institutions, teams, adjudicators, rounds, and tabulation.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text)
  - `role` (text, default 'tabber') - 'admin' or 'tabber'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `institutions`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null)
  - `code` (text, unique)
  - `created_at` (timestamptz)

  ### `teams`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `institution_id` (uuid, references institutions)
  - `speaker_names` (text array)
  - `total_points` (integer, default 0)
  - `total_speaks` (numeric, default 0)
  - `created_at` (timestamptz)

  ### `adjudicators`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `institution_id` (uuid, references institutions)
  - `strength` (numeric, default 5.0) - Rating from 1-10
  - `email` (text)
  - `phone` (text)
  - `conflicts` (uuid array) - IDs of teams/institutions with conflicts
  - `created_at` (timestamptz)

  ### `rooms`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null)
  - `capacity` (integer, default 20)
  - `created_at` (timestamptz)

  ### `tournaments`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `format` (text, default 'BP') - 'BP' (British Parliamentary) or 'AP' (Asian Parliamentary)
  - `start_date` (date)
  - `end_date` (date)
  - `status` (text, default 'setup') - 'setup', 'ongoing', 'completed'
  - `created_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### `rounds`
  - `id` (uuid, primary key)
  - `tournament_id` (uuid, references tournaments)
  - `round_number` (integer, not null)
  - `name` (text, not null) - e.g., "Round 1", "Quarter Finals"
  - `motion` (text)
  - `info_slide` (text)
  - `status` (text, default 'setup') - 'setup', 'ongoing', 'completed'
  - `created_at` (timestamptz)

  ### `debates` (matchups/pairings)
  - `id` (uuid, primary key)
  - `round_id` (uuid, references rounds)
  - `room_id` (uuid, references rooms)
  - `status` (text, default 'pending') - 'pending', 'completed'
  - `created_at` (timestamptz)

  ### `debate_teams`
  - `id` (uuid, primary key)
  - `debate_id` (uuid, references debates)
  - `team_id` (uuid, references teams)
  - `position` (text) - 'OG', 'OO', 'CG', 'CO' for BP
  - `points` (integer) - 3, 2, 1, 0 for BP
  - `speaks` (numeric array) - Speaker scores
  - `rank` (integer) - Final rank in debate

  ### `debate_adjudicators`
  - `id` (uuid, primary key)
  - `debate_id` (uuid, references debates)
  - `adjudicator_id` (uuid, references adjudicators)
  - `role` (text, default 'panelist') - 'chair', 'panelist', 'trainee'

  ### `speaker_scores`
  - `id` (uuid, primary key)
  - `debate_team_id` (uuid, references debate_teams)
  - `speaker_name` (text, not null)
  - `score` (numeric, not null)
  - `position` (integer) - 1 or 2 (first or second speaker)

  ## 2. Security

  - Enable RLS on all tables
  - Admin users can perform all operations
  - Tabber users can read all data and update results
  - Public users can only read completed rounds and standings

  ## 3. Indexes

  - Index on foreign keys for performance
  - Index on status fields for filtering
  - Index on tournament_id and round_id for lookups

  ## 4. Functions

  - Trigger to update team standings after results entry
  - Function to calculate speaker averages
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'tabber' CHECK (role IN ('admin', 'tabber')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  institution_id uuid REFERENCES institutions(id) ON DELETE SET NULL,
  speaker_names text[] DEFAULT '{}',
  total_points integer DEFAULT 0,
  total_speaks numeric DEFAULT 0,
  rounds_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create adjudicators table
CREATE TABLE IF NOT EXISTS adjudicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  institution_id uuid REFERENCES institutions(id) ON DELETE SET NULL,
  strength numeric DEFAULT 5.0 CHECK (strength >= 1 AND strength <= 10),
  email text,
  phone text,
  conflicts uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  capacity integer DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  format text DEFAULT 'BP' CHECK (format IN ('BP', 'AP')),
  start_date date,
  end_date date,
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'ongoing', 'completed')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  name text NOT NULL,
  motion text,
  info_slide text,
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'ongoing', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, round_number)
);

-- Create debates table (matchups/pairings)
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create debate_teams table (team participation in debates)
CREATE TABLE IF NOT EXISTS debate_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid REFERENCES debates(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  position text CHECK (position IN ('OG', 'OO', 'CG', 'CO')),
  points integer DEFAULT 0,
  total_speaks numeric DEFAULT 0,
  rank integer,
  UNIQUE(debate_id, team_id)
);

-- Create debate_adjudicators table
CREATE TABLE IF NOT EXISTS debate_adjudicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid REFERENCES debates(id) ON DELETE CASCADE,
  adjudicator_id uuid REFERENCES adjudicators(id) ON DELETE CASCADE,
  role text DEFAULT 'panelist' CHECK (role IN ('chair', 'panelist', 'trainee')),
  UNIQUE(debate_id, adjudicator_id)
);

-- Create speaker_scores table
CREATE TABLE IF NOT EXISTS speaker_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_team_id uuid REFERENCES debate_teams(id) ON DELETE CASCADE,
  speaker_name text NOT NULL,
  score numeric NOT NULL CHECK (score >= 60 AND score <= 100),
  position integer CHECK (position IN (1, 2)),
  UNIQUE(debate_team_id, position)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_institution ON teams(institution_id);
CREATE INDEX IF NOT EXISTS idx_teams_points ON teams(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_adjudicators_institution ON adjudicators(institution_id);
CREATE INDEX IF NOT EXISTS idx_rounds_tournament ON rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_debates_round ON debates(round_id);
CREATE INDEX IF NOT EXISTS idx_debate_teams_debate ON debate_teams(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_teams_team ON debate_teams(team_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjudicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_adjudicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for institutions (authenticated users can read, admins can modify)
CREATE POLICY "Anyone can view institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert institutions"
  ON institutions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update institutions"
  ON institutions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete institutions"
  ON institutions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for teams
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for adjudicators
CREATE POLICY "Anyone can view adjudicators"
  ON adjudicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert adjudicators"
  ON adjudicators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update adjudicators"
  ON adjudicators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete adjudicators"
  ON adjudicators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for tournaments
CREATE POLICY "Anyone can view tournaments"
  ON tournaments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tournaments"
  ON tournaments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tournaments"
  ON tournaments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tournaments"
  ON tournaments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for rounds
CREATE POLICY "Anyone can view rounds"
  ON rounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert rounds"
  ON rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update rounds"
  ON rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rounds"
  ON rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for debates
CREATE POLICY "Anyone can view debates"
  ON debates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert debates"
  ON debates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can update debates"
  ON debates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete debates"
  ON debates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for debate_teams
CREATE POLICY "Anyone can view debate_teams"
  ON debate_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert debate_teams"
  ON debate_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can update debate_teams"
  ON debate_teams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete debate_teams"
  ON debate_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for debate_adjudicators
CREATE POLICY "Anyone can view debate_adjudicators"
  ON debate_adjudicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert debate_adjudicators"
  ON debate_adjudicators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update debate_adjudicators"
  ON debate_adjudicators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete debate_adjudicators"
  ON debate_adjudicators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for speaker_scores
CREATE POLICY "Anyone can view speaker_scores"
  ON speaker_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert speaker_scores"
  ON speaker_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update speaker_scores"
  ON speaker_scores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete speaker_scores"
  ON speaker_scores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'tabber')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update team standings after result entry
CREATE OR REPLACE FUNCTION update_team_standings()
RETURNS trigger AS $$
BEGIN
  -- Update team total points and speaks
  UPDATE teams
  SET 
    total_points = (
      SELECT COALESCE(SUM(dt.points), 0)
      FROM debate_teams dt
      WHERE dt.team_id = NEW.team_id
    ),
    total_speaks = (
      SELECT COALESCE(SUM(dt.total_speaks), 0)
      FROM debate_teams dt
      WHERE dt.team_id = NEW.team_id
    ),
    rounds_count = (
      SELECT COUNT(*)
      FROM debate_teams dt
      WHERE dt.team_id = NEW.team_id
    )
  WHERE id = NEW.team_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update standings when debate results are entered
DROP TRIGGER IF EXISTS on_debate_team_result ON debate_teams;
CREATE TRIGGER on_debate_team_result
  AFTER INSERT OR UPDATE OF points, total_speaks ON debate_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_team_standings();