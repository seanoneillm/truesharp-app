-- First run this to drop all existing function versions
-- This handles multiple overloads by querying the system catalog

DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all versions of complete_apple_subscription_validation
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'complete_apple_subscription_validation'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ')';
    END LOOP;
    
    -- Drop all versions of find_user_by_apple_transaction  
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'find_user_by_apple_transaction'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ')';
    END LOOP;
    
    -- Drop all versions of get_user_subscription_status
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'get_user_subscription_status'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ')';
    END LOOP;
END $$;