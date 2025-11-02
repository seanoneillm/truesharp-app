-- Modern Apple Subscription Schema Update for App Store Server API
-- Execute this in Supabase SQL editor

-- Add/update Apple-specific fields for modern App Store Server API
ALTER TABLE pro_subscriptions 
  ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_environment TEXT CHECK (apple_environment IN ('sandbox', 'production')),
  ADD COLUMN IF NOT EXISTS transaction_validation_status TEXT DEFAULT 'pending' CHECK (transaction_validation_status IN ('pending', 'validated', 'failed')),
  ADD COLUMN IF NOT EXISTS transaction_finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_attempts INTEGER DEFAULT 0;

-- Add indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_apple_transaction_id 
  ON pro_subscriptions(apple_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_apple_original_transaction_id 
  ON pro_subscriptions(apple_original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_validation_status 
  ON pro_subscriptions(transaction_validation_status);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_environment 
  ON pro_subscriptions(apple_environment);

-- Update audit table for modern transaction attempts
CREATE TABLE IF NOT EXISTS apple_transaction_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  original_transaction_id TEXT,
  attempt_timestamp TIMESTAMPTZ DEFAULT NOW(),
  validation_result JSONB,
  error_message TEXT,
  environment TEXT,
  api_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apple_transaction_attempts_user_id ON apple_transaction_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_transaction_attempts_transaction_id ON apple_transaction_attempts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_apple_transaction_attempts_original_transaction_id ON apple_transaction_attempts(original_transaction_id);

-- Updated function for modern App Store Server API validation
CREATE OR REPLACE FUNCTION complete_apple_subscription_validation(
  p_user_id UUID,
  p_transaction_id TEXT,
  p_original_transaction_id TEXT,
  p_product_id TEXT,
  p_environment TEXT,
  p_purchase_date TIMESTAMPTZ,
  p_expiration_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_subscription_id UUID;
  v_plan TEXT;
  v_is_active BOOLEAN;
  v_existing_subscription UUID;
  result JSONB;
BEGIN
  -- Validate input parameters
  IF p_user_id IS NULL OR p_transaction_id IS NULL OR p_product_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters for subscription validation';
  END IF;

  -- Determine plan from product ID
  v_plan := CASE 
    WHEN p_product_id LIKE '%year%' THEN 'yearly' 
    ELSE 'monthly' 
  END;
  
  -- Check if subscription is currently active
  v_is_active := (p_expiration_date > NOW());
  
  -- Check for existing subscription with this original transaction ID
  SELECT id INTO v_existing_subscription
  FROM pro_subscriptions 
  WHERE apple_original_transaction_id = p_original_transaction_id;
  
  IF v_existing_subscription IS NOT NULL THEN
    -- Update existing subscription (renewal case)
    UPDATE pro_subscriptions SET
      apple_transaction_id = p_transaction_id, -- Update to latest transaction
      status = CASE WHEN v_is_active THEN 'active' ELSE 'expired' END,
      current_period_start = p_purchase_date,
      current_period_end = p_expiration_date,
      price_id = p_product_id,
      apple_environment = p_environment,
      transaction_validation_status = 'validated',
      transaction_finished_at = NOW(),
      validation_attempts = validation_attempts + 1,
      updated_at = NOW()
    WHERE id = v_existing_subscription
    RETURNING id INTO v_subscription_id;
    
  ELSE
    -- Check for duplicate transaction ID (edge case)
    SELECT id INTO v_existing_subscription
    FROM pro_subscriptions 
    WHERE apple_transaction_id = p_transaction_id;
    
    IF v_existing_subscription IS NOT NULL THEN
      -- Transaction already processed, just return existing data
      SELECT id, plan, (current_period_end > NOW()) 
      INTO v_subscription_id, v_plan, v_is_active
      FROM pro_subscriptions 
      WHERE id = v_existing_subscription;
      
    ELSE
      -- Create new subscription
      INSERT INTO pro_subscriptions (
        user_id, 
        status, 
        plan, 
        current_period_start, 
        current_period_end,
        price_id,
        apple_transaction_id,
        apple_original_transaction_id,
        apple_environment,
        transaction_validation_status,
        transaction_finished_at,
        validation_attempts
      ) VALUES (
        p_user_id,
        CASE WHEN v_is_active THEN 'active' ELSE 'expired' END,
        v_plan,
        p_purchase_date,
        p_expiration_date,
        p_product_id,
        p_transaction_id,
        p_original_transaction_id,
        p_environment,
        'validated',
        NOW(),
        1
      )
      RETURNING id INTO v_subscription_id;
    END IF;
  END IF;
  
  -- Update profile pro status based on active subscription
  IF v_is_active THEN
    UPDATE profiles SET pro = 'yes', updated_at = NOW() WHERE id = p_user_id;
  ELSE
    -- Check if user has any other active subscriptions before removing pro status
    IF NOT EXISTS (
      SELECT 1 FROM pro_subscriptions 
      WHERE user_id = p_user_id 
      AND status = 'active' 
      AND current_period_end > NOW()
      AND id != v_subscription_id
    ) THEN
      UPDATE profiles SET pro = 'no', updated_at = NOW() WHERE id = p_user_id;
    END IF;
  END IF;
  
  -- Build and return result
  result := jsonb_build_object(
    'subscription_id', v_subscription_id,
    'is_active', v_is_active,
    'plan', v_plan,
    'expiration_date', p_expiration_date,
    'environment', p_environment,
    'transaction_id', p_transaction_id,
    'original_transaction_id', p_original_transaction_id
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error and re-raise
  RAISE EXCEPTION 'Subscription validation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find user by transaction (for webhooks where user_id might not be known)
CREATE OR REPLACE FUNCTION find_user_by_apple_transaction(
  p_original_transaction_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM pro_subscriptions 
  WHERE apple_original_transaction_id = p_original_transaction_id
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription status by user
CREATE OR REPLACE FUNCTION get_user_subscription_status(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_subscription pro_subscriptions%ROWTYPE;
  result JSONB;
BEGIN
  -- Get the most recent active or recently expired subscription
  SELECT * INTO v_subscription
  FROM pro_subscriptions 
  WHERE user_id = p_user_id
  ORDER BY 
    CASE WHEN status = 'active' THEN 1 ELSE 2 END,
    current_period_end DESC
  LIMIT 1;
  
  IF v_subscription.id IS NULL THEN
    result := jsonb_build_object(
      'has_subscription', false,
      'is_active', false
    );
  ELSE
    result := jsonb_build_object(
      'has_subscription', true,
      'is_active', (v_subscription.current_period_end > NOW()),
      'plan', v_subscription.plan,
      'current_period_end', v_subscription.current_period_end,
      'status', v_subscription.status,
      'apple_environment', v_subscription.apple_environment
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION complete_apple_subscription_validation TO service_role;
GRANT EXECUTE ON FUNCTION find_user_by_apple_transaction TO service_role;
GRANT EXECUTE ON FUNCTION get_user_subscription_status TO service_role;

-- Enable RLS
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_transaction_attempts ENABLE ROW LEVEL SECURITY;

-- Updated RLS policies
DROP POLICY IF EXISTS "Service role can access transaction attempts" ON apple_transaction_attempts;
CREATE POLICY "Service role can access transaction attempts" ON apple_transaction_attempts
  FOR ALL USING (true) WITH CHECK (true);

-- Policy for users to read their own subscription data
DROP POLICY IF EXISTS "Users can view own subscriptions" ON pro_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON pro_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for service role to manage all subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON pro_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON pro_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Create view for easy subscription status checking
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  p.id as profile_id,
  p.email,
  p.pro,
  s.id as subscription_id,
  s.plan,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.apple_transaction_id,
  s.apple_original_transaction_id,
  s.apple_environment,
  (s.current_period_end > NOW()) as is_currently_active,
  s.transaction_validation_status,
  s.created_at as subscription_created_at
FROM profiles p
LEFT JOIN pro_subscriptions s ON p.id = s.user_id
WHERE s.id IS NULL 
   OR s.id = (
     SELECT id FROM pro_subscriptions s2 
     WHERE s2.user_id = p.id 
     ORDER BY s2.current_period_end DESC 
     LIMIT 1
   );

-- Grant access to the view
GRANT SELECT ON user_subscription_status TO service_role;
GRANT SELECT ON user_subscription_status TO authenticated;