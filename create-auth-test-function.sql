-- Create helper function to test auth.uid() from app context
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;