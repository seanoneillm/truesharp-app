-- Corrected SQL for existing pro_subscriptions table with actual column names
-- Execute this in Supabase SQL editor

-- Add missing columns to existing apple_transaction_attempts table
DO $$ 
BEGIN
    -- Add environment column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apple_transaction_attempts' 
        AND column_name = 'environment'
    ) THEN
        ALTER TABLE apple_transaction_attempts 
        ADD COLUMN environment TEXT;
    END IF;

    -- Add api_response_time_ms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apple_transaction_attempts' 
        AND column_name = 'api_response_time_ms'
    ) THEN
        ALTER TABLE apple_transaction_attempts 
        ADD COLUMN api_response_time_ms INTEGER;
    END IF;
END $$;

-- CORRECTED: Function using actual column names from your existing table
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
  
  -- Check for existing subscription by original transaction ID
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
      receipt_validation_status = 'validated',
      transaction_finished_at = NOW(),
      validation_attempts = COALESCE(validation_attempts, 0) + 1,
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
        receipt_validation_status,
        transaction_finished_at,
        validation_attempts,
        created_at,
        updated_at
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
        1,
        NOW(),
        NOW()
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

-- Enable RLS if not already enabled
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_transaction_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for apple_transaction_attempts
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

-- Update trigger for pro_subscriptions (if not exists)
CREATE OR REPLACE FUNCTION update_pro_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pro_subscriptions_updated_at ON pro_subscriptions;
CREATE TRIGGER update_pro_subscriptions_updated_at
    BEFORE UPDATE ON pro_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_pro_subscriptions_updated_at();