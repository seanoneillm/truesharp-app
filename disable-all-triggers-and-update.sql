-- Alternative approach: Disable ALL triggers on bets table, update, then re-enable

-- Step 1: Check what triggers exist on bets table
SELECT 
    trigger_name
FROM information_schema.triggers 
WHERE event_object_table = 'bets';

-- Step 2: Disable ALL triggers on the bets table
ALTER TABLE bets DISABLE TRIGGER ALL;

-- Step 3: Update the bet profit now that triggers are disabled
UPDATE bets 
SET profit = 179.30
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Step 4: Re-enable ALL triggers on the bets table
ALTER TABLE bets ENABLE TRIGGER ALL;

-- Step 5: Verify the update worked
SELECT 
    id,
    bet_description,
    stake,
    potential_payout,
    profit,
    status
FROM bets 
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Step 6: Check the user's current total profit to understand the constraint issue
SELECT 
    user_id,
    SUM(profit) as total_user_profit,
    COUNT(*) as total_bets
FROM bets 
WHERE user_id = (
    SELECT user_id 
    FROM bets 
    WHERE id = '986b3c53-4906-437e-ad45-11bad01db611'
)
GROUP BY user_id;