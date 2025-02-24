-- Add points_if_places column to fantasy_horses table
ALTER TABLE fantasy_horses
ADD COLUMN IF NOT EXISTS points_if_places INTEGER;

-- Update existing records to have place points (roughly half of win points)
UPDATE fantasy_horses
SET points_if_places = 
    CASE 
        WHEN fixed_odds <= 2.0 THEN 5
        WHEN fixed_odds <= 4.0 THEN 7
        WHEN fixed_odds <= 8.0 THEN 10
        ELSE 12
    END
WHERE points_if_places IS NULL;
