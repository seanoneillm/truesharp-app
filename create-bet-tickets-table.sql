-- Create bet_tickets table for reporting issues with TrueSharp bets
CREATE TABLE bet_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bet_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    custom_reason TEXT,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_bet_tickets_bet_id 
        FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
    CONSTRAINT fk_bet_tickets_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bet_tickets_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_bet_tickets_bet_id ON bet_tickets(bet_id);
CREATE INDEX idx_bet_tickets_user_id ON bet_tickets(user_id);
CREATE INDEX idx_bet_tickets_status ON bet_tickets(status);
CREATE INDEX idx_bet_tickets_created_at ON bet_tickets(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bet_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bet_tickets_updated_at
    BEFORE UPDATE ON bet_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_bet_tickets_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE bet_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own tickets
CREATE POLICY "Users can view their own bet tickets" 
ON bet_tickets FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create tickets for their own bets
CREATE POLICY "Users can create tickets for their own bets" 
ON bet_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own open tickets
CREATE POLICY "Users can update their own open tickets" 
ON bet_tickets FOR UPDATE 
USING (auth.uid() = user_id AND status = 'open')
WITH CHECK (auth.uid() = user_id);

-- Add a comment explaining the table purpose
COMMENT ON TABLE bet_tickets IS 'Stores user-submitted tickets for reporting issues with TrueSharp bets (mock sportsbook)';
COMMENT ON COLUMN bet_tickets.reason IS 'Preset reason category for the ticket';
COMMENT ON COLUMN bet_tickets.custom_reason IS 'Custom reason when "other" is selected';
COMMENT ON COLUMN bet_tickets.description IS 'Additional details about the issue';
COMMENT ON COLUMN bet_tickets.status IS 'Current status of the ticket (open, in_review, resolved, closed)';
COMMENT ON COLUMN bet_tickets.admin_notes IS 'Internal notes from admin reviewing the ticket';