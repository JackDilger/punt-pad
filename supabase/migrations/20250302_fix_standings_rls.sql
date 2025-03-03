-- Drop existing policies
drop policy if exists "Enable insert/update for users based on user_id" on public.fantasy_league_standings;

-- Create new policy that allows admin to update any standings
create policy "Enable admin to update any standings"
    on public.fantasy_league_standings
    for all
    using (
        auth.uid() in (
            select id from public.profiles where is_admin = true
        )
        or auth.uid() = user_id
    )
    with check (
        auth.uid() in (
            select id from public.profiles where is_admin = true
        )
        or auth.uid() = user_id
    );
