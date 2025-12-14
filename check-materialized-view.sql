-- First, let's check what materialized views exist and their definitions
-- This will help us recreate them properly after altering the column

-- Check all materialized views that reference profit column
SELECT 
    schemaname, 
    matviewname, 
    definition 
FROM pg_matviews 
WHERE definition ILIKE '%profit%'
   OR definition ILIKE '%stake%'
   OR definition ILIKE '%potential_payout%';

-- Also check for any regular views
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE definition ILIKE '%profit%'
   OR definition ILIKE '%stake%'
   OR definition ILIKE '%potential_payout%';

-- Check current column definitions
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bets' 
AND column_name IN ('profit', 'stake', 'potential_payout')
ORDER BY column_name;