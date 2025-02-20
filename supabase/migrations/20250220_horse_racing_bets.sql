-- Create enum for bet types
CREATE TYPE bet_type AS ENUM ('single', 'accumulator');

-- Create enum for bet status
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'void');

-- Create table for selections (for both singles and accumulators)
CREATE TABLE selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_name TEXT NOT NULL,
    horse_name TEXT NOT NULL,
    odds_decimal DECIMAL(10,2) NOT NULL,
    odds_fractional TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create table for bets
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bet_type bet_type NOT NULL,
    stake DECIMAL(10,2) NOT NULL,
    total_odds_decimal DECIMAL(10,2) NOT NULL,
    total_odds_fractional TEXT NOT NULL,
    is_each_way BOOLEAN DEFAULT false NOT NULL,
    is_free_bet BOOLEAN DEFAULT false NOT NULL,
    status bet_status DEFAULT 'pending' NOT NULL,
    potential_return DECIMAL(10,2) NOT NULL,
    actual_return DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create junction table for bets and selections (allows for accumulators)
CREATE TABLE bet_selections (
    bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
    selection_id UUID REFERENCES selections(id) ON DELETE CASCADE NOT NULL,
    selection_order INTEGER NOT NULL,
    PRIMARY KEY (bet_id, selection_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_created_at ON bets(created_at);
CREATE INDEX idx_bet_selections_bet_id ON bet_selections(bet_id);
CREATE INDEX idx_bet_selections_selection_id ON bet_selections(selection_id);

-- Create RLS policies
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_selections ENABLE ROW LEVEL SECURITY;

-- Policy for bets: users can only see their own bets
CREATE POLICY "Users can view their own bets"
    ON bets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets"
    ON bets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for selections: users can view selections related to their bets
CREATE POLICY "Users can view selections related to their bets"
    ON selections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bet_selections bs
        JOIN bets b ON bs.bet_id = b.id
        WHERE bs.selection_id = selections.id
        AND b.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert selections"
    ON selections FOR INSERT
    WITH CHECK (true);

-- Policy for bet_selections: users can view their own bet selections
CREATE POLICY "Users can view their own bet selections"
    ON bet_selections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bets b
        WHERE b.id = bet_selections.bet_id
        AND b.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own bet selections"
    ON bet_selections FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM bets b
        WHERE b.id = bet_selections.bet_id
        AND b.user_id = auth.uid()
    ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_selections_updated_at
    BEFORE UPDATE ON selections
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
