-- Admin queries for managing bet tickets

-- Get all open tickets with bet and user information
SELECT 
    bt.id,
    bt.reason,
    bt.custom_reason,
    bt.description,
    bt.status,
    bt.created_at,
    bt.updated_at,
    
    -- User information
    u.email as user_email,
    
    -- Bet information
    b.id as bet_id,
    b.bet_description,
    b.sportsbook,
    b.stake,
    b.potential_payout,
    b.odds,
    b.status as bet_status,
    b.placed_at,
    b.profit
FROM bet_tickets bt
JOIN auth.users u ON bt.user_id = u.id
JOIN bets b ON bt.bet_id = b.id
WHERE bt.status = 'open'
ORDER BY bt.created_at ASC;

-- Get ticket statistics
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM bet_tickets 
GROUP BY status;

-- Get tickets by reason
SELECT 
    CASE 
        WHEN reason = 'Other' THEN custom_reason 
        ELSE reason 
    END as reason_text,
    COUNT(*) as count
FROM bet_tickets 
GROUP BY 
    CASE 
        WHEN reason = 'Other' THEN custom_reason 
        ELSE reason 
    END
ORDER BY count DESC;

-- Get recent tickets (last 7 days)
SELECT 
    bt.id,
    bt.reason,
    bt.custom_reason,
    bt.status,
    bt.created_at,
    u.email as user_email,
    b.bet_description,
    b.sportsbook
FROM bet_tickets bt
JOIN auth.users u ON bt.user_id = u.id
JOIN bets b ON bt.bet_id = b.id
WHERE bt.created_at >= NOW() - INTERVAL '7 days'
ORDER BY bt.created_at DESC;

-- Example: Update ticket status (admin operation)
-- UPDATE bet_tickets 
-- SET 
--     status = 'resolved',
--     admin_notes = 'Bet has been manually settled correctly',
--     resolved_at = NOW(),
--     resolved_by = 'admin_user_id_here'
-- WHERE id = 'ticket_id_here';

-- Example: Get all tickets for a specific bet
-- SELECT * FROM bet_tickets 
-- WHERE bet_id = 'specific_bet_id_here'
-- ORDER BY created_at ASC;