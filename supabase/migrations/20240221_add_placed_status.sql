-- Add 'Placed' to bet_status enum
ALTER TYPE bet_status ADD VALUE 'Placed';

-- Update check constraint on bets table
ALTER TABLE public.bets 
DROP CONSTRAINT bets_status_check,
ADD CONSTRAINT bets_status_check 
CHECK (status IN ('Pending', 'Won', 'Lost', 'Void', 'Placed'));

-- Update check constraint on bet_selections table
ALTER TABLE public.bet_selections 
DROP CONSTRAINT bet_selections_status_check,
ADD CONSTRAINT bet_selections_status_check 
CHECK (status IN ('Pending', 'Won', 'Lost', 'Void', 'Placed'));
