-- Function to check if triggers exist and are enabled
CREATE OR REPLACE FUNCTION check_triggers_exist()
RETURNS TABLE(
    trigger_name text,
    table_name text,
    function_name text,
    enabled boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tgname::text as trigger_name,
        t.tgrelid::regclass::text as table_name,
        p.proname::text as function_name,
        (t.tgenabled = 'O') as enabled
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgname IN ('trigger_manage_odds_duplicates', 'trigger_manage_open_odds_duplicates')
    ORDER BY t.tgname;
END;
$$ LANGUAGE plpgsql;
