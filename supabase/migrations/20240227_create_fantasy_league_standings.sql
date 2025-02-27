-- Create fantasy_league_standings table
create table if not exists public.fantasy_league_standings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    total_points integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint fantasy_league_standings_user_id_key unique (user_id)
);

-- Enable RLS
alter table public.fantasy_league_standings enable row level security;

-- Create policies
create policy "Enable read access for all users"
    on public.fantasy_league_standings
    for select
    using (true);

create policy "Enable insert/update for users based on user_id"
    on public.fantasy_league_standings
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create function to update updated_at on changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger to update updated_at
create trigger handle_updated_at
    before update on public.fantasy_league_standings
    for each row
    execute function public.handle_updated_at();
