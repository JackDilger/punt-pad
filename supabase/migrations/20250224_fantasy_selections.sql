CREATE TABLE fantasy_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    horse_id UUID NOT NULL REFERENCES fantasy_horses(id),
    race_id UUID NOT NULL REFERENCES fantasy_races(id),
    day_id UUID NOT NULL REFERENCES fantasy_festival_days(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, race_id) -- Ensure one selection per race per user
);
