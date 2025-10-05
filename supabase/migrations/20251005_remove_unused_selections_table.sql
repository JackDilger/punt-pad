-- Remove unused selections table from old schema
-- This table is not used in the current application
-- bet_selections table is used instead

DROP TABLE IF EXISTS selections CASCADE;
