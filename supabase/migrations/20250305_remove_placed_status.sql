-- Remove 'Placed' from bet_status enum and update constraints
-- Update any existing 'Placed' status to 'Pending'
UPDATE public.bets 
SET status = 'Pending' 
WHERE status = 'Placed';

UPDATE public.bet_selections 
SET status = 'Pending' 
WHERE status = 'Placed';

-- Create new enum without 'Placed'
CREATE TYPE bet_status_new AS ENUM ('Pending', 'Won', 'Lost', 'Void');

-- Drop default values temporarily
ALTER TABLE public.bets 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.bet_selections 
ALTER COLUMN status DROP DEFAULT;

-- Update tables to use new enum
ALTER TABLE public.bets 
ALTER COLUMN status TYPE bet_status_new 
USING status::text::bet_status_new;

ALTER TABLE public.bet_selections 
ALTER COLUMN status TYPE bet_status_new 
USING status::text::bet_status_new;

-- Drop old enum
DROP TYPE bet_status;

-- Rename new enum to original name
ALTER TYPE bet_status_new RENAME TO bet_status;

-- Restore default values
ALTER TABLE public.bets 
ALTER COLUMN status SET DEFAULT 'Pending';

ALTER TABLE public.bet_selections 
ALTER COLUMN status SET DEFAULT 'Pending';

-- Update constraints
ALTER TABLE public.bets 
DROP CONSTRAINT IF EXISTS bets_status_check,
ADD CONSTRAINT bets_status_check 
CHECK (status IN ('Pending', 'Won', 'Lost', 'Void'));

ALTER TABLE public.bet_selections 
DROP CONSTRAINT IF EXISTS bet_selections_status_check,
ADD CONSTRAINT bet_selections_status_check 
CHECK (status IN ('Pending', 'Won', 'Lost', 'Void'));
