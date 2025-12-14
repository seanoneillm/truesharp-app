-- Check all numeric columns in the bets table that might have DECIMAL(5,2) constraint
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bets' 
    AND data_type = 'numeric'
ORDER BY column_name;

-- Also check if settled_at column exists and its type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bets' 
    AND column_name IN ('settled_at', 'updated_at')
ORDER BY column_name;