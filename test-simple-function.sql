-- Simple test function to verify RPC connectivity
CREATE OR REPLACE FUNCTION analytics.test_connection()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'Analytics functions are working!'::text;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION analytics.test_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION analytics.test_connection() TO anon;