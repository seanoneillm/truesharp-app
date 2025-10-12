-- Check for triggers on the odds table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.trigger_schema,
    t.event_object_table
FROM information_schema.triggers t
WHERE t.event_object_table IN ('odds', 'open_odds')
ORDER BY t.event_object_table, t.trigger_name;

-- Check for functions that might be called by triggers
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND (p.prosrc ILIKE '%odds%' OR p.proname ILIKE '%odds%')
ORDER BY p.proname;

-- Check for any rules on the tables
SELECT 
    r.rulename,
    r.ev_type,
    r.ev_class,
    pg_get_ruledef(r.oid) as rule_definition
FROM pg_rewrite r
JOIN pg_class c ON r.ev_class = c.oid
WHERE c.relname IN ('odds', 'open_odds');