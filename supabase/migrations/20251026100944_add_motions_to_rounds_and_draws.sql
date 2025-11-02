-- Add support for 3 motions per round and motion assignment to debates

-- Add motion columns to rounds table
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS motion_1 text,
ADD COLUMN IF NOT EXISTS motion_2 text,
ADD COLUMN IF NOT EXISTS motion_3 text;

-- Add motion_id to debates table to track which motion is used
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS motion_used text;

-- Update existing rounds to move motion to motion_1
UPDATE rounds SET motion_1 = motion WHERE motion IS NOT NULL;


