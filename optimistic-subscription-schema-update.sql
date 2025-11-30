-- Update pro_subscriptions table to support optimistic subscription processing
-- Execute this in Supabase SQL editor

-- Add new status values for optimistic processing
DO $$ 
BEGIN
    -- Check if the status column has the correct constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%status%' 
        AND table_name = 'pro_subscriptions'
    ) THEN
        -- Drop existing constraint and recreate with new values
        ALTER TABLE pro_subscriptions DROP CONSTRAINT IF EXISTS pro_subscriptions_status_check;
        
        ALTER TABLE pro_subscriptions 
        ADD CONSTRAINT pro_subscriptions_status_check 
        CHECK (status IN (
          'active', 
          'canceled', 
          'past_due', 
          'unpaid', 
          'trialing', 
          'incomplete', 
          'incomplete_expired',
          'expired',
          'revoked',
          'refunded',
          'processing',
          'pending_user_validation',
          'validation_failed'
        ));
    END IF;
END $$;

-- Add index for processing status lookups
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_processing_status 
ON pro_subscriptions(status) 
WHERE status IN ('processing', 'pending_user_validation', 'validation_failed');

-- Function to check for processing subscriptions that need cleanup
CREATE OR REPLACE FUNCTION cleanup_stale_processing_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Mark subscriptions as validation_failed if they've been processing for more than 10 minutes
  UPDATE pro_subscriptions 
  SET 
    status = 'validation_failed',
    updated_at = NOW()
  WHERE 
    status = 'processing' 
    AND created_at < NOW() - INTERVAL '10 minutes';
    
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO apple_transaction_attempts (
    user_id,
    product_id,
    transaction_id,
    original_transaction_id,
    validation_result,
    environment
  )
  SELECT 
    user_id,
    price_id,
    apple_transaction_id,
    apple_original_transaction_id,
    jsonb_build_object(
      'step', 'automated_cleanup',
      'message', 'Marked stale processing subscription as validation_failed',
      'processing_duration_minutes', EXTRACT(EPOCH FROM (NOW() - created_at))/60
    ),
    apple_environment
  FROM pro_subscriptions 
  WHERE status = 'validation_failed' 
    AND updated_at = NOW()
    AND apple_transaction_id IS NOT NULL;
    
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run periodically (this would typically be done via cron or scheduled job)
-- For now, we'll just create the function and it can be called manually or via a job

-- Grant execution rights
GRANT EXECUTE ON FUNCTION cleanup_stale_processing_subscriptions TO service_role;

-- Update the complete_apple_subscription_validation function to handle processing status
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
  v_processing_subscription UUID;
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
  WHERE apple_original_transaction_id = p_original_transaction_id
    AND status != 'processing'; -- Exclude processing subscriptions
  
  -- Check for processing subscription that we can upgrade
  SELECT id INTO v_processing_subscription
  FROM pro_subscriptions 
  WHERE apple_original_transaction_id = p_original_transaction_id
    AND user_id = p_user_id
    AND status = 'processing';
  
  IF v_processing_subscription IS NOT NULL THEN
    -- Upgrade the processing subscription to validated
    UPDATE pro_subscriptions SET
      apple_transaction_id = p_transaction_id,
      status = CASE WHEN v_is_active THEN 'active' ELSE 'expired' END,
      current_period_start = p_purchase_date,
      current_period_end = p_expiration_date,
      price_id = p_product_id,
      apple_environment = p_environment,
      receipt_validation_status = 'validated',
      transaction_finished_at = NOW(),
      validation_attempts = COALESCE(validation_attempts, 0) + 1,
      updated_at = NOW()
    WHERE id = v_processing_subscription
    RETURNING id INTO v_subscription_id;
    
  ELSIF v_existing_subscription IS NOT NULL THEN
    -- Update existing subscription (renewal case)
    UPDATE pro_subscriptions SET
      apple_transaction_id = p_transaction_id,
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