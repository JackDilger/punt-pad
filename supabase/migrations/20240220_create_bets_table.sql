-- Create bets table
create table public.bets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    bet_type text not null check (bet_type in ('Single', 'Accumulator')),
    stake decimal(10,2) not null,
    total_odds text not null,
    is_each_way boolean default false,
    is_free_bet boolean default false,
    status text default 'Pending' check (status in ('Pending', 'Won', 'Lost', 'Void')),
    potential_return decimal(10,2)
);

-- Create bet selections table for individual selections within a bet
create table public.bet_selections (
    id uuid default gen_random_uuid() primary key,
    bet_id uuid references public.bets(id) on delete cascade not null,
    event text not null,
    horse text not null,
    odds text not null,
    is_win boolean default true,
    status text default 'Pending' check (status in ('Pending', 'Won', 'Lost', 'Void'))
);

-- Set up RLS (Row Level Security)
alter table public.bets enable row level security;
alter table public.bet_selections enable row level security;

-- Create policies
create policy "Users can view their own bets"
    on bets for select
    using (auth.uid() = user_id);

create policy "Users can insert their own bets"
    on bets for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own bets"
    on bets for update
    using (auth.uid() = user_id);

create policy "Users can view their own bet selections"
    on bet_selections for select
    using (
        exists (
            select 1 from bets
            where bets.id = bet_selections.bet_id
            and bets.user_id = auth.uid()
        )
    );

create policy "Users can insert their own bet selections"
    on bet_selections for insert
    with check (
        exists (
            select 1 from bets
            where bets.id = bet_selections.bet_id
            and bets.user_id = auth.uid()
        )
    );

create policy "Users can update their own bet selections"
    on bet_selections for update
    using (
        exists (
            select 1 from bets
            where bets.id = bet_selections.bet_id
            and bets.user_id = auth.uid()
        )
    );
