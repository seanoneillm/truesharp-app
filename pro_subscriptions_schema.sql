-- Pro Subscriptions Database Schema for TrueSharp Pro
-- Run this in your Supabase SQL editor

-- Update the existing pro_subscriptions table to match the requirements
-- First, let's check if we need to add any missing columns

-- Add missing columns if they don't exist
ALTER TABLE pro_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('monthly', 'yearly'));

-- Update existing columns to match requirements  
-- Note: Rename user_id to profile_id if needed (adjust based on your preference)
-- ALTER TABLE pro_subscriptions RENAME COLUMN user_id TO profile_id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_stripe_subscription_id 
  ON pro_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_stripe_customer_id 
  ON pro_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_profile_id 
  ON pro_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_status 
  ON pro_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_plan 
  ON pro_subscriptions(plan);

-- Add trigger for updated_at column
CREATE OR REPLACE FUNCTION update_pro_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pro_subscriptions_updated_at
  BEFORE UPDATE ON pro_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_pro_subscriptions_updated_at();

-- Add RLS policies for security
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own Pro subscriptions
CREATE POLICY "Users can view their own pro subscriptions" ON pro_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only authenticated users can insert their own Pro subscriptions (via service role)
CREATE POLICY "Service role can manage pro subscriptions" ON pro_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pro_subscriptions TO service_role;
GRANT SELECT ON pro_subscriptions TO authenticated;

-- Create a function to check if a user is Pro
CREATE OR REPLACE FUNCTION is_user_pro(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pro_subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_user_pro(UUID) TO authenticated;

-- Create a view for active Pro subscriptions with profile info
CREATE OR REPLACE VIEW active_pro_subscriptions AS
SELECT 
  ps.*,
  p.username,
  p.email,
  p.display_name
FROM pro_subscriptions ps
JOIN profiles p ON ps.user_id = p.id
WHERE ps.status = 'active'
  AND ps.current_period_end > NOW();

-- Grant select on the view
GRANT SELECT ON active_pro_subscriptions TO authenticated;
GRANT SELECT ON active_pro_subscriptions TO service_role;