-- Create initial fantasy league tables for Phase 1
CREATE TABLE fantasy_festival_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    cutoff_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial data for the four festival days
INSERT INTO fantasy_festival_days (day_number, date, is_published, cutoff_time)
VALUES 
    (1, '2025-03-11', false, '2025-03-11 12:30:00+00'),
    (2, '2025-03-12', false, '2025-03-12 12:30:00+00'),
    (3, '2025-03-13', false, '2025-03-13 12:30:00+00'),
    (4, '2025-03-14', false, '2025-03-14 12:30:00+00');
