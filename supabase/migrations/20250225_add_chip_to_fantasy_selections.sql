-- Add chip column to fantasy_selections table
ALTER TABLE fantasy_selections
ADD COLUMN chip TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN fantasy_selections.chip IS 'Stores the chip type (superBoost, doubleChance, tripleThreat) applied to this selection';
