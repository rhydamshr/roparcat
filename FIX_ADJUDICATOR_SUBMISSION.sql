-- FIX ADJUDICATOR SUBMISSION - Run this in Supabase SQL Editor
-- This fixes the issue where adjudicator submissions don't update standings

-- 1. Add public UPDATE policies for adjudicator submissions
CREATE POLICY "Public can update debates"
  ON debates FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can update debate_teams"
  ON debate_teams FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can insert speaker_scores"
  ON speaker_scores FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update speaker_scores"
  ON speaker_scores FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can update teams"
  ON teams FOR UPDATE
  TO public
  USING (true);

-- 2. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('debates', 'debate_teams', 'speaker_scores', 'teams')
AND policyname LIKE '%Public%'
ORDER BY tablename, policyname;

-- 3. Test that we can update a debate status (replace with actual debate ID)
-- UPDATE debates SET status = 'completed' WHERE id = 'your-debate-id-here';

-- 4. Test that we can update team standings (replace with actual team ID)
-- UPDATE teams SET total_points = 1, total_speaks = 75, rounds_count = 1 WHERE id = 'your-team-id-here';

-- 5. Check current debate statuses
SELECT id, status, created_at 
FROM debates 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check current team standings
SELECT id, name, total_points, total_speaks, rounds_count 
FROM teams 
ORDER BY total_points DESC 
LIMIT 5;
