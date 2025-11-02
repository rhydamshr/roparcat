-- Test script to check if adjudicator access is working
-- Run this in Supabase SQL Editor to test

-- 1. Check if adjudicator exists
SELECT id, name FROM adjudicators LIMIT 5;

-- 2. Check if public policies are working
-- This should work if RLS policies are correct
SELECT id, name FROM adjudicators WHERE id = 'YOUR_ADJUDICATOR_ID_HERE';

-- 3. Check if debate_adjudicators table is accessible
SELECT * FROM debate_adjudicators LIMIT 5;

-- 4. Check if debates are accessible
SELECT * FROM debates LIMIT 5;

-- 5. Test the full query that the app uses
SELECT 
  da.*,
  d.*,
  r.name as room_name,
  rt.motion_1,
  rt.motion_2,
  rt.motion_3
FROM debate_adjudicators da
LEFT JOIN debates d ON da.debate_id = d.id
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN rounds rt ON d.round_id = rt.id
WHERE da.adjudicator_id = 'YOUR_ADJUDICATOR_ID_HERE'
LIMIT 5;

