-- Fix apple_environment constraint to allow Apple's actual values
-- Execute this in Supabase SQL editor immediately

-- Drop the existing constraint and recreate with correct values
ALTER TABLE pro_subscriptions DROP CONSTRAINT IF EXISTS pro_subscriptions_apple_environment_check;

-- Add constraint that matches Apple's actual environment values
ALTER TABLE pro_subscriptions 
ADD CONSTRAINT pro_subscriptions_apple_environment_check 
CHECK (apple_environment IN ('Sandbox', 'Production', 'sandbox', 'production'));

-- Also update the claimable subscription function to normalize the environment
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
  v_normalized_environment TEXT;
  result JSONB;
BEGIN
  -- Validate input parameters
  IF p_transaction_id IS NULL OR p_product_id IS NULL OR p_original_transaction_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters for claimable subscription creation';
  END IF;

  -- Normalize environment (Apple sends "Sandbox"/"Production", we also accept lowercase)
  v_normalized_environment := CASE 
    WHEN UPPER(p_environment) = 'SANDBOX' THEN 'Sandbox'
    WHEN UPPER(p_environment) = 'PRODUCTION' THEN 'Production'
    ELSE p_environment -- Keep as-is for backward compatibility
  END;

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
      v_normalized_environment
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
        NULL,  -- No user_id yet - this makes it claimable
        'pending_user_validation',  -- Special status for webhook-created subscriptions
        v_plan,
        p_purchase_date,
        p_expiration_date,
        p_product_id,
        p_transaction_id,
        p_original_transaction_id,
        v_normalized_environment,  -- Use normalized environment
        'pending',
        NOW(),
        0,
        NOW(),
        NOW()
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
        v_normalized_environment
      );
    END IF;
  END IF;
  
  -- Build and return result
  result := jsonb_build_object(
    'subscription_id', v_subscription_id,
    'is_active', v_is_active,
    'plan', v_plan,
    'expiration_date', p_expiration_date,
    'environment', v_normalized_environment,
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