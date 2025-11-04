-- Convert from British Parliamentary (BP) to Asian Parliamentary (AP) format

-- Update debate_teams position enum to support AP
-- AP positions: 'government', 'opposition'
ALTER TABLE debate_teams DROP CONSTRAINT IF EXISTS debate_teams_position_check;
ALTER TABLE debate_teams ADD CONSTRAINT debate_teams_position_check 
  CHECK (position IN ('government', 'opposition', 'OG', 'OO', 'CG', 'CO'));

-- Note: We keep the old positions (OG, OO, CG, CO) for backward compatibility
-- but new debates will use 'government' and 'opposition'

-- Update rounds to have info about speaker positions
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS speakers_per_team integer DEFAULT 3;

-- Update existing data if needed
UPDATE rounds SET speakers_per_team = 3 WHERE speakers_per_team IS NULL;




