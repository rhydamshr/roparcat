-- Update speaker_scores to support AP format (3 speakers)
ALTER TABLE speaker_scores DROP CONSTRAINT IF EXISTS speaker_scores_position_check;
ALTER TABLE speaker_scores ADD CONSTRAINT speaker_scores_position_check 
  CHECK (position IN (1, 2, 3));




