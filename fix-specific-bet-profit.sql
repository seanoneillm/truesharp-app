-- Update the specific bet to have the correct profit of 179.30 instead of capped 99.99
-- Bet ID: 986b3c53-4906-437e-ad45-11bad01db611
-- Original calculation: $189.30 payout - $10.00 stake = $179.30 profit

UPDATE bets 
SET profit = 179.30
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Verify the update
SELECT 
    id,
    bet_description,
    stake,
    potential_payout,
    profit,
    status,
    odds,
    parlay_id,
    is_parlay
FROM bets 
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';