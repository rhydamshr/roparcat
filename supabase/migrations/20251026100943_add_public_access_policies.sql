-- Add public access policies for participant URLs
-- This allows unauthenticated users to view specific team data and standings

-- Public can view teams (for participant URLs)
CREATE POLICY "Public can view teams"
  ON teams FOR SELECT
  TO public
  USING (true);

-- Public can view institutions
CREATE POLICY "Public can view institutions"
  ON institutions FOR SELECT
  TO public
  USING (true);

-- Public can view adjudicators
CREATE POLICY "Public can view adjudicators"
  ON adjudicators FOR SELECT
  TO public
  USING (true);

-- Public can view rooms
CREATE POLICY "Public can view rooms"
  ON rooms FOR SELECT
  TO public
  USING (true);

-- Public can view tournaments
CREATE POLICY "Public can view tournaments"
  ON tournaments FOR SELECT
  TO public
  USING (true);

-- Public can view rounds
CREATE POLICY "Public can view rounds"
  ON rounds FOR SELECT
  TO public
  USING (true);

-- Public can view debates
CREATE POLICY "Public can view debates"
  ON debates FOR SELECT
  TO public
  USING (true);

-- Public can view debate_teams
CREATE POLICY "Public can view debate_teams"
  ON debate_teams FOR SELECT
  TO public
  USING (true);

-- Public can view debate_adjudicators
CREATE POLICY "Public can view debate_adjudicators"
  ON debate_adjudicators FOR SELECT
  TO public
  USING (true);

-- Public can view speaker_scores
CREATE POLICY "Public can view speaker_scores"
  ON speaker_scores FOR SELECT
  TO public
  USING (true);

-- Keep existing authenticated policies for write operations
-- Only authenticated users can insert/update/delete


