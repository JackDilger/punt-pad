-- Remove team_name column from fantasy_selections table
alter table public.fantasy_selections
drop column if exists team_name;
