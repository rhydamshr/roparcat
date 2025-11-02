/*
  # Breaks Feature Migration
  
  Adds support for inrounds (normal rounds) and outrounds (breaks - semi-finals, finals).
  
  ## Changes:
  1. Add `round_type` to `rounds` table ('inround' | 'outround')
  2. Create `breaking_teams` table to track which teams have broken to which rounds
*/

-- Add round_type column to rounds table (allow NULL for backward compatibility)
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS round_type text 
CHECK (round_type IS NULL OR round_type IN ('inround', 'outround'));

-- Update existing rounds to be 'inround' by default
UPDATE rounds SET round_type = 'inround' WHERE round_type IS NULL;

-- Create index for round_type
CREATE INDEX IF NOT EXISTS idx_rounds_type ON rounds(round_type);

-- Create breaking_teams table to track teams that have broken
CREATE TABLE IF NOT EXISTS breaking_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  break_rank integer NOT NULL, -- The rank at which they broke (1, 2, 3, 4 for top 4)
  broke_to_round_id uuid REFERENCES rounds(id) ON DELETE CASCADE, -- The round they broke to
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, team_id, broke_to_round_id)
);

-- Create indexes for breaking_teams
CREATE INDEX IF NOT EXISTS idx_breaking_teams_tournament ON breaking_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_breaking_teams_team ON breaking_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_breaking_teams_round ON breaking_teams(round_id);
CREATE INDEX IF NOT EXISTS idx_breaking_teams_broke_to ON breaking_teams(broke_to_round_id);

-- Enable RLS for breaking_teams
ALTER TABLE breaking_teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for breaking_teams
CREATE POLICY "Anyone can view breaking_teams"
  ON breaking_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view breaking_teams"
  ON breaking_teams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert breaking_teams"
  ON breaking_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update breaking_teams"
  ON breaking_teams FOR UPDATE
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

CREATE POLICY "Admins can delete breaking_teams"
  ON breaking_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

