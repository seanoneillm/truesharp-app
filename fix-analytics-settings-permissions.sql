-- Fix analytics_settings table permissions to allow triggers to work
-- This fixes the "permission denied for table analytics_settings" error

-- Grant necessary permissions to the service_role and authenticated roles
GRANT ALL ON public.analytics_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.analytics_settings TO authenticated;

-- Grant permissions on the function to necessary roles
GRANT EXECUTE ON FUNCTION public.create_default_analytics_settings() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_default_analytics_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_analytics_settings_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_analytics_settings_updated_at() TO authenticated;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own analytics settings
CREATE POLICY "Users can view their own analytics settings" ON public.analytics_settings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own analytics settings" ON public.analytics_settings
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Service role can insert new analytics settings (for triggers)
CREATE POLICY "Service role can insert analytics settings" ON public.analytics_settings
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to insert their own settings
CREATE POLICY "Users can insert their own analytics settings" ON public.analytics_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Verify the permissions and policies
SELECT 
    table_schema,
    table_name,
    grantor,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'analytics_settings';

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'analytics_settings';