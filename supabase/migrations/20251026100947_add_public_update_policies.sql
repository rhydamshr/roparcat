-- Add public update policies for adjudicator submissions
-- This allows adjudicators to submit scores from their private URLs

-- Public can update debates (for marking as completed)
CREATE POLICY "Public can update debates"
  ON debates FOR UPDATE
  TO public
  USING (true);

-- Public can update debate_teams (for points and speaks)
CREATE POLICY "Public can update debate_teams"
  ON debate_teams FOR UPDATE
  TO public
  USING (true);

-- Public can insert speaker_scores (for individual speaker scores)
CREATE POLICY "Public can insert speaker_scores"
  ON speaker_scores FOR INSERT
  TO public
  WITH CHECK (true);

-- Public can update speaker_scores (for updating existing scores)
CREATE POLICY "Public can update speaker_scores"
  ON speaker_scores FOR UPDATE
  TO public
  USING (true);

-- Public can update teams (for standings updates)
CREATE POLICY "Public can update teams"
  ON teams FOR UPDATE
  TO public
  USING (true);

