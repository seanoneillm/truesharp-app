-- Check for any constraints on the profit column that might be limiting values
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'bets' 
    AND (cc.check_clause ILIKE '%profit%' OR kcu.column_name = 'profit')
ORDER BY tc.constraint_type;

-- Check for triggers on the bets table that might be affecting profit updates
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bets'
    AND action_statement ILIKE '%profit%';

-- Check the actual definition of the profit column
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bets' 
    AND column_name = 'profit';