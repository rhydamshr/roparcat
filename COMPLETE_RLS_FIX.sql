-- COMPLETE RLS FIX - Adjudicator Submission Not Working
-- This fixes the issue where adjudicators can't submit scores because of missing UPDATE/INSERT policies

-- Step 1: Add UPDATE policies for public users (adjudicators submitting scores)
CREATE POLICY "Public can update debates" ON debates FOR UPDATE TO public USING (true);
CREATE POLICY "Public can update debate_teams" ON debate_teams FOR UPDATE TO public USING (true);
CREATE POLICY "Public can update teams" ON teams FOR UPDATE TO public USING (true);

-- Step 2: Add INSERT policies for public users (speaker scores)
CREATE POLICY "Public can insert speaker_scores" ON speaker_scores FOR INSERT TO public WITH CHECK (true);

-- Step 3: Add UPDATE policies for speaker_scores (in case scores already exist)
CREATE POLICY "Public can update speaker_scores" ON speaker_scores FOR UPDATE TO public USING (true);

-- Step 4: Verify all policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('debates', 'debate_teams', 'teams', 'speaker_scores')
ORDER BY tablename, policyname;

-- Step 5: Test a simple update (replace with actual IDs from your database)
-- UPDATE debates SET status = 'completed' WHERE id = 'your-debate-id-here';
-- UPDATE teams SET total_points = 1 WHERE id = 'your-team-id-here';
