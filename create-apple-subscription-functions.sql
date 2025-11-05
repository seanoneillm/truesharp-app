-- Database functions for Apple subscription validation
-- Compatible with existing pro_subscriptions schema

-- Function to complete Apple subscription validation
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

-- Function to find user by Apple transaction ID
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

-- Grant execution rights to authenticated users for status check
GRANT EXECUTE ON FUNCTION get_user_subscription_status TO authenticated;