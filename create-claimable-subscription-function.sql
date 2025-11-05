-- Add new status to pro_subscriptions table
ALTER TABLE pro_subscriptions 
  DROP CONSTRAINT IF EXISTS pro_subscriptions_status_check;

ALTER TABLE pro_subscriptions 
  ADD CONSTRAINT pro_subscriptions_status_check 
  CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing', 'expired', 'revoked', 'refunded', 'pending_user_validation'));

-- Function to create a claimable subscription record from webhook notifications
-- This allows webhooks to create subscription records before user validation
CREATE OR REPLACE FUNCTION create_claimable_apple_subscription(
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
  IF p_transaction_id IS NULL OR p_product_id IS NULL OR p_original_transaction_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters for claimable subscription creation';
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
    -- Subscription already exists, just return existing data
    SELECT id, plan, (current_period_end > NOW()) 
    INTO v_subscription_id, v_plan, v_is_active
    FROM pro_subscriptions 
    WHERE id = v_existing_subscription;
    
    -- Log that we found existing subscription
    INSERT INTO apple_transaction_attempts (
      user_id,
      product_id,
      transaction_id,
      original_transaction_id,
      validation_result,
      environment
    ) VALUES (
      (SELECT user_id FROM pro_subscriptions WHERE id = v_existing_subscription),
      p_product_id,
      p_transaction_id,
      p_original_transaction_id,
      jsonb_build_object(
        'step', 'webhook_duplicate',
        'message', 'Subscription already exists for this original transaction ID'
      ),
      p_environment
    );
    
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
      -- Create new claimable subscription (no user_id yet)
      INSERT INTO pro_subscriptions (
        user_id,  -- NULL initially - will be set when user validates
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
        NULL,  -- No user_id yet - this makes it claimable
        'pending_user_validation',  -- Special status for webhook-created subscriptions
        v_plan,
        p_purchase_date,
        p_expiration_date,
        p_product_id,
        p_transaction_id,
        p_original_transaction_id,
        p_environment,
        'pending',
        NOW(),
        0
      )
      RETURNING id INTO v_subscription_id;
      
      -- Log the creation
      INSERT INTO apple_transaction_attempts (
        user_id,
        product_id,
        transaction_id,
        original_transaction_id,
        validation_result,
        environment
      ) VALUES (
        NULL,  -- No user yet
        p_product_id,
        p_transaction_id,
        p_original_transaction_id,
        jsonb_build_object(
          'step', 'webhook_created_claimable',
          'subscription_id', v_subscription_id,
          'message', 'Created claimable subscription from webhook'
        ),
        p_environment
      );
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
    'original_transaction_id', p_original_transaction_id,
    'status', 'claimable'
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error and re-raise
  RAISE EXCEPTION 'Claimable subscription creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a subscription (link it to a user)
CREATE OR REPLACE FUNCTION claim_apple_subscription(
  p_user_id UUID,
  p_original_transaction_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_subscription_id UUID;
  v_plan TEXT;
  v_is_active BOOLEAN;
  v_current_period_end TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Find the claimable subscription
  SELECT id, plan, current_period_end, (current_period_end > NOW())
  INTO v_subscription_id, v_plan, v_current_period_end, v_is_active
  FROM pro_subscriptions 
  WHERE apple_original_transaction_id = p_original_transaction_id
    AND user_id IS NULL
    AND status = 'pending_user_validation';
  
  IF v_subscription_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No claimable subscription found for this transaction'
    );
  END IF;
  
  -- Claim the subscription by setting the user_id and updating status
  UPDATE pro_subscriptions SET
    user_id = p_user_id,
    status = CASE WHEN v_is_active THEN 'active' ELSE 'expired' END,
    transaction_validation_status = 'validated',
    transaction_finished_at = NOW(),
    validation_attempts = validation_attempts + 1,
    updated_at = NOW()
  WHERE id = v_subscription_id;
  
  -- Update profile pro status if subscription is active
  IF v_is_active THEN
    UPDATE profiles SET pro = 'yes', updated_at = NOW() WHERE id = p_user_id;
  END IF;
  
  -- Log the claim
  INSERT INTO apple_transaction_attempts (
    user_id,
    product_id,
    transaction_id,
    original_transaction_id,
    validation_result,
    environment
  ) SELECT 
    p_user_id,
    price_id,
    apple_transaction_id,
    apple_original_transaction_id,
    jsonb_build_object(
      'step', 'subscription_claimed',
      'subscription_id', v_subscription_id,
      'message', 'User claimed webhook-created subscription'
    ),
    apple_environment
  FROM pro_subscriptions WHERE id = v_subscription_id;
  
  result := jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'is_active', v_is_active,
    'plan', v_plan,
    'expiration_date', v_current_period_end
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION create_claimable_apple_subscription TO service_role;
GRANT EXECUTE ON FUNCTION claim_apple_subscription TO service_role;