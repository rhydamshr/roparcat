-- Debug script to check standings update issues
-- Run this in Supabase SQL Editor

-- 1. Check if debates table has status column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'debates' AND column_name = 'status';

-- 2. Check if teams table has the required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('total_points', 'total_speaks', 'rounds_count');

-- 3. Check current debate statuses
SELECT id, status, created_at 
FROM debates 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check current team standings
SELECT id, name, total_points, total_speaks, rounds_count 
FROM teams 
ORDER BY total_points DESC 
LIMIT 10;

-- 5. Check debate_teams data
SELECT dt.id, dt.points, dt.total_speaks, dt.rank, t.name as team_name
FROM debate_teams dt
JOIN teams t ON dt.team_id = t.id
ORDER BY dt.created_at DESC
LIMIT 10;

-- 6. Check RLS policies for debates table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'debates';

-- 7. Check RLS policies for teams table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teams';

-- 8. Test updating a debate status (replace with actual debate ID)
-- UPDATE debates SET status = 'completed' WHERE id = 'your-debate-id-here';

-- 9. Test updating team standings (replace with actual team ID)
-- UPDATE teams SET total_points = 1, total_speaks = 75, rounds_count = 1 WHERE id = 'your-team-id-here';

