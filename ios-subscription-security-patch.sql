-- TrueSharp iOS Subscription Security Schema Update
-- Execute this in Supabase SQL editor FIRST

-- Add Apple-specific fields to pro_subscriptions table
ALTER TABLE pro_subscriptions 
  ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS apple_receipt_data TEXT,
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_environment TEXT CHECK (apple_environment IN ('sandbox', 'production')),
  ADD COLUMN IF NOT EXISTS receipt_validation_status TEXT DEFAULT 'pending' CHECK (receipt_validation_status IN ('pending', 'validated', 'failed')),
  ADD COLUMN IF NOT EXISTS transaction_finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_attempts INTEGER DEFAULT 0;

-- Add indexes for Apple transaction lookups
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_apple_transaction_id 
  ON pro_subscriptions(apple_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_apple_original_transaction_id 
  ON pro_subscriptions(apple_original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_validation_status 
  ON pro_subscriptions(receipt_validation_status);

-- Create audit table for transaction attempts
CREATE TABLE IF NOT EXISTS apple_transaction_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  attempt_timestamp TIMESTAMPTZ DEFAULT NOW(),
  validation_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apple_transaction_attempts_user_id ON apple_transaction_attempts(user_id);
CREATE INDEX idx_apple_transaction_attempts_transaction_id ON apple_transaction_attempts(transaction_id);

-- Create function to safely update subscription status after Apple validation
CREATE OR REPLACE FUNCTION complete_apple_subscription_validation(
  p_user_id UUID,
  p_transaction_id TEXT,
  p_original_transaction_id TEXT,
  p_product_id TEXT,
  p_receipt_data TEXT,
  p_environment TEXT,
  p_purchase_date TIMESTAMPTZ,
  p_expiration_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_subscription_id UUID;
  v_plan TEXT;
  v_is_active BOOLEAN;
  result JSONB;
BEGIN
  -- Determine plan from product ID
  v_plan := CASE WHEN p_product_id LIKE '%year%' THEN 'yearly' ELSE 'monthly' END;
  v_is_active := (p_expiration_date > NOW());
  
  -- Insert or update subscription
  INSERT INTO pro_subscriptions (
    user_id, 
    status, 
    plan, 
    current_period_start, 
    current_period_end,
    price_id,
    apple_transaction_id,
    apple_original_transaction_id,
    apple_receipt_data,
    apple_environment,
    receipt_validation_status,
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
    LEFT(p_receipt_data, 500), -- Store first 500 chars only
    p_environment,
    'validated',
    NOW(),
    1
  )
  ON CONFLICT (apple_transaction_id) 
  DO UPDATE SET
    receipt_validation_status = 'validated',
    transaction_finished_at = NOW(),
    validation_attempts = pro_subscriptions.validation_attempts + 1,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;
  
  -- Update profile pro status only if subscription is active
  IF v_is_active THEN
    UPDATE profiles SET pro = 'yes' WHERE id = p_user_id;
  END IF;
  
  -- Return result
  result := jsonb_build_object(
    'subscription_id', v_subscription_id,
    'is_active', v_is_active,
    'plan', v_plan,
    'profile_updated', v_is_active
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION complete_apple_subscription_validation TO service_role;

-- Enable RLS if not already enabled
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_transaction_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "Service role can access transaction attempts" ON apple_transaction_attempts
  FOR ALL USING (true) WITH CHECK (true);
