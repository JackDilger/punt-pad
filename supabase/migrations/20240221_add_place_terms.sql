-- Add place_terms column to bets table
ALTER TABLE public.bets ADD COLUMN place_terms decimal(3,2) default 0.25;
