-- Fix status field constraint for Apple subscription webhooks
-- Handle view dependencies that prevent column type changes

-- Step 1: Drop ALL views that depend on the status column
DROP VIEW IF EXISTS active_pro_subscriptions;
DROP VIEW IF EXISTS temp_active_pro_subscriptions_backup;

-- Step 2: Expand the status column to accommodate longer status values
ALTER TABLE pro_subscriptions 
ALTER COLUMN status TYPE VARCHAR(30);

-- Step 3: Update status column constraint to include the new status
ALTER TABLE pro_subscriptions 
DROP CONSTRAINT IF EXISTS pro_subscriptions_status_check,
ADD CONSTRAINT pro_subscriptions_status_check 
CHECK (status IN (
  'active', 
  'past_due', 
  'canceled', 
  'unpaid', 
  'incomplete', 
  'incomplete_expired', 
  'trialing', 
  'expired', 
  'revoked', 
  'refunded', 
  'pending_user_validation'
));

-- Step 4: Also expand apple_environment column while we're at it
ALTER TABLE pro_subscriptions 
ALTER COLUMN apple_environment TYPE VARCHAR(20);

-- Update apple_environment constraint
ALTER TABLE pro_subscriptions 
DROP CONSTRAINT IF EXISTS pro_subscriptions_apple_environment_check,
ADD CONSTRAINT pro_subscriptions_apple_environment_check 
CHECK (apple_environment IN ('sandbox', 'production'));

-- Step 5: Recreate the active_pro_subscriptions view
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

-- Grant select permissions on the recreated view
GRANT SELECT ON active_pro_subscriptions TO authenticated;
GRANT SELECT ON active_pro_subscriptions TO service_role;

-- Step 6: No cleanup needed since we dropped everything at the start

-- Verify the fix by showing the column info
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pro_subscriptions' 
  AND column_name IN ('status', 'apple_environment')
ORDER BY column_name;