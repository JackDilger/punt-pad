-- Create fantasy_races table
CREATE TABLE fantasy_races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    race_time TIMESTAMP WITH TIME ZONE NOT NULL,
    day_id UUID NOT NULL REFERENCES fantasy_festival_days(id),
    race_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fantasy_horses table for race entries
CREATE TABLE fantasy_horses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES fantasy_races(id),
    name TEXT,
    fixed_odds DECIMAL(10,2),
    points_if_wins INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_odds CHECK (fixed_odds IS NULL OR fixed_odds >= 1),
    CONSTRAINT valid_points CHECK (points_if_wins IS NULL OR points_if_wins >= 1)
);

-- Add indexes for common queries
CREATE INDEX idx_fantasy_races_day_id ON fantasy_races(day_id);
CREATE INDEX idx_fantasy_races_status ON fantasy_races(status);
CREATE INDEX idx_fantasy_horses_race_id ON fantasy_horses(race_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_fantasy_races_updated_at
    BEFORE UPDATE ON fantasy_races
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fantasy_horses_updated_at
    BEFORE UPDATE ON fantasy_horses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Day 1 races (Tuesday)
INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Supreme Novices Hurdle',
    '2025-03-11 13:30:00+00',
    id,
    1
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Arkle Challenge Trophy',
    '2025-03-11 14:10:00+00',
    id,
    2
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Ultima Handicap Chase',
    '2025-03-11 14:50:00+00',
    id,
    3
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Champion Hurdle Challenge Trophy',
    '2025-03-11 15:30:00+00',
    id,
    4
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Mares Hurdle',
    '2025-03-11 16:10:00+00',
    id,
    5
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'Boodles Juvenile Handicap Hurdle',
    '2025-03-11 16:50:00+00',
    id,
    6
FROM fantasy_festival_days 
WHERE day_number = 1;

INSERT INTO fantasy_races (name, race_time, day_id, race_order) 
SELECT 
    'National Hunt Chase Challenge Cup',
    '2025-03-11 17:30:00+00',
    id,
    7
FROM fantasy_festival_days 
WHERE day_number = 1;

-- Insert sample horses for testing
INSERT INTO fantasy_horses (race_id, name, fixed_odds, points_if_wins)
SELECT 
    r.id,
    'Ballyburn',
    2.50,
    CASE 
        WHEN fixed_odds <= 2.0 THEN 10
        WHEN fixed_odds <= 4.0 THEN 15
        WHEN fixed_odds <= 8.0 THEN 20
        ELSE 25
    END
FROM fantasy_races r
WHERE name = 'Supreme Novices Hurdle';

INSERT INTO fantasy_horses (race_id, name, fixed_odds, points_if_wins)
SELECT 
    r.id,
    'Mystical Power',
    4.00,
    CASE 
        WHEN fixed_odds <= 2.0 THEN 10
        WHEN fixed_odds <= 4.0 THEN 15
        WHEN fixed_odds <= 8.0 THEN 20
        ELSE 25
    END
FROM fantasy_races r
WHERE name = 'Supreme Novices Hurdle';
