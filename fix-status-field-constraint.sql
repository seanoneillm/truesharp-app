-- Fix status field constraint for Apple subscription webhooks
-- The status field needs to be expanded to support 'pending_user_validation' status

-- Expand the status column to accommodate longer status values
ALTER TABLE pro_subscriptions 
ALTER COLUMN status TYPE VARCHAR(30);

-- Update status column constraint to include the new status
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

-- Also expand apple_environment column while we're at it to ensure it can handle future values
ALTER TABLE pro_subscriptions 
ALTER COLUMN apple_environment TYPE VARCHAR(20);

-- Update apple_environment constraint
ALTER TABLE pro_subscriptions 
DROP CONSTRAINT IF EXISTS pro_subscriptions_apple_environment_check,
ADD CONSTRAINT pro_subscriptions_apple_environment_check 
CHECK (apple_environment IN ('sandbox', 'production'));