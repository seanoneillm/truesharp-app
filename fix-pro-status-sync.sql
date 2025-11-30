-- Fix Pro Status Synchronization Issues
-- This SQL script creates a centralized function to properly sync pro status
-- and fixes race conditions between Stripe and Apple subscription systems

-- Centralized function to determine if a user should have pro status
-- Returns: 'yes', 'no', or 'preserve' (for manual assignments with no subscriptions)
CREATE OR REPLACE FUNCTION should_user_have_pro_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  has_active_stripe BOOLEAN := FALSE;
  has_active_apple BOOLEAN := FALSE;
  has_any_subscriptions BOOLEAN := FALSE;
  current_pro_status TEXT;
BEGIN
  -- Check for active Stripe subscriptions
  SELECT EXISTS(
    SELECT 1 FROM pro_subscriptions 
    WHERE user_id = p_user_id 
    AND stripe_subscription_id IS NOT NULL
    AND status = 'active'
    AND current_period_end > NOW()
  ) INTO has_active_stripe;
  
  -- Check for active Apple subscriptions
  SELECT EXISTS(
    SELECT 1 FROM pro_subscriptions 
    WHERE user_id = p_user_id 
    AND apple_original_transaction_id IS NOT NULL
    AND status = 'active'
    AND current_period_end > NOW()
  ) INTO has_active_apple;
  
  -- Check if user has ANY subscriptions (active or inactive)
  SELECT EXISTS(
    SELECT 1 FROM pro_subscriptions 
    WHERE user_id = p_user_id
  ) INTO has_any_subscriptions;
  
  -- Get current pro status
  SELECT pro INTO current_pro_status FROM profiles WHERE id = p_user_id;
  
  -- Decision logic:
  IF (has_active_stripe OR has_active_apple) THEN
    -- Has active subscriptions -> should be 'yes'
    RETURN 'yes';
  ELSIF has_any_subscriptions THEN
    -- Has subscriptions but none active -> should be 'no'
    RETURN 'no';
  ELSE
    -- No subscriptions at all -> preserve current status (manual assignment)
    RETURN 'preserve';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Centralized function to sync pro status based on all subscriptions
CREATE OR REPLACE FUNCTION sync_user_pro_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  should_be_pro_result TEXT;
  current_pro_status TEXT;
  subscription_details JSONB;
  should_update BOOLEAN := FALSE;
  new_status TEXT;
BEGIN
  -- Get current pro status
  SELECT pro INTO current_pro_status FROM profiles WHERE id = p_user_id;
  
  -- Determine what the pro status should be
  SELECT should_user_have_pro_status(p_user_id) INTO should_be_pro_result;
  
  -- Determine if we should update and what the new status should be
  IF should_be_pro_result = 'yes' THEN
    should_update := (current_pro_status != 'yes');
    new_status := 'yes';
  ELSIF should_be_pro_result = 'no' THEN
    should_update := (current_pro_status != 'no');
    new_status := 'no';
  ELSE -- should_be_pro_result = 'preserve'
    should_update := FALSE;
    new_status := current_pro_status; -- Keep current status
  END IF;

  -- Get subscription details for response
  WITH subscription_summary AS (
    SELECT 
      COUNT(*) as total_subscriptions,
      COUNT(CASE WHEN status = 'active' AND current_period_end > NOW() THEN 1 END) as active_subscriptions,
      COUNT(CASE WHEN stripe_subscription_id IS NOT NULL AND status = 'active' AND current_period_end > NOW() THEN 1 END) as active_stripe,
      COUNT(CASE WHEN apple_original_transaction_id IS NOT NULL AND status = 'active' AND current_period_end > NOW() THEN 1 END) as active_apple,
      MAX(current_period_end) as latest_expiration
    FROM pro_subscriptions 
    WHERE user_id = p_user_id
  )
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'sync_decision', should_be_pro_result,
    'current_status', current_pro_status,
    'total_subscriptions', total_subscriptions,
    'active_subscriptions', active_subscriptions,
    'active_stripe_subscriptions', active_stripe,
    'active_apple_subscriptions', active_apple,
    'latest_expiration', latest_expiration,
    'has_subscriptions', CASE WHEN total_subscriptions > 0 THEN true ELSE false END
  ) INTO subscription_details
  FROM subscription_summary;
  
  -- Update pro status only if needed and not preserved
  IF should_update THEN
    UPDATE profiles 
    SET 
      pro = new_status,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    subscription_details := subscription_details || jsonb_build_object(
      'status_updated', true,
      'new_status', new_status,
      'previous_status', current_pro_status,
      'reason', CASE 
        WHEN should_be_pro_result = 'yes' THEN 'has_active_subscriptions'
        WHEN should_be_pro_result = 'no' THEN 'no_active_subscriptions_but_has_expired'
        ELSE 'unknown'
      END
    );
  ELSE
    subscription_details := subscription_details || jsonb_build_object(
      'status_updated', false,
      'status', current_pro_status,
      'reason', CASE 
        WHEN should_be_pro_result = 'preserve' THEN 'manual_assignment_preserved'
        ELSE 'status_already_correct'
      END
    );
  END IF;
  
  RETURN subscription_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated Apple subscription validation function with proper pro status sync
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
  sync_result JSONB;
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
    -- Check for duplicate transaction ID
    SELECT id INTO v_existing_subscription
    FROM pro_subscriptions 
    WHERE apple_transaction_id = p_transaction_id;
    
    IF v_existing_subscription IS NOT NULL THEN
      -- Transaction already processed, just return existing data
      SELECT id, plan INTO v_subscription_id, v_plan
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
  
  -- FIXED: Use centralized function to sync pro status
  -- This will check ALL subscription types (Stripe + Apple) before updating
  SELECT sync_user_pro_status(p_user_id) INTO sync_result;
  
  -- Build and return result
  result := jsonb_build_object(
    'subscription_id', v_subscription_id,
    'is_active', v_is_active,
    'plan', v_plan,
    'expiration_date', p_expiration_date,
    'environment', p_environment,
    'transaction_id', p_transaction_id,
    'original_transaction_id', p_original_transaction_id,
    'pro_status_sync', sync_result
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Subscription validation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a claimable Apple subscription (for webhook notifications)
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
  result JSONB;
BEGIN
  -- Determine plan from product ID
  v_plan := CASE 
    WHEN p_product_id LIKE '%year%' THEN 'yearly' 
    ELSE 'monthly' 
  END;
  
  -- Check if subscription is currently active
  v_is_active := (p_expiration_date > NOW());
  
  -- Create claimable subscription (user_id is NULL until claimed)
  INSERT INTO pro_subscriptions (
    user_id, -- NULL - will be set when user claims
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
    NULL, -- Claimable subscription
    'pending_user_validation', -- Special status for claimable subscriptions
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
  
  result := jsonb_build_object(
    'subscription_id', v_subscription_id,
    'status', 'claimable',
    'transaction_id', p_transaction_id,
    'original_transaction_id', p_original_transaction_id,
    'expiration_date', p_expiration_date
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create claimable subscription: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION should_user_have_pro_status TO service_role;
GRANT EXECUTE ON FUNCTION sync_user_pro_status TO service_role;
GRANT EXECUTE ON FUNCTION complete_apple_subscription_validation TO service_role;
GRANT EXECUTE ON FUNCTION create_claimable_apple_subscription TO service_role;

-- Create a function to fix all currently inconsistent pro statuses
CREATE OR REPLACE FUNCTION fix_all_pro_status_inconsistencies()
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  sync_result JSONB;
  results JSONB[] := '{}';
  total_fixed INTEGER := 0;
BEGIN
  -- Loop through all users who have subscriptions
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM pro_subscriptions 
    WHERE user_id IS NOT NULL
  LOOP
    -- Sync each user's pro status
    SELECT sync_user_pro_status(user_record.user_id) INTO sync_result;
    
    -- If status was updated, add to results
    IF (sync_result->>'status_updated')::boolean THEN
      results := array_append(results, sync_result);
      total_fixed := total_fixed + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_users_fixed', total_fixed,
    'fixes_applied', results,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fix_all_pro_status_inconsistencies TO service_role;

-- Create an audit table to track pro status changes
CREATE TABLE IF NOT EXISTS pro_status_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  change_reason TEXT,
  subscription_context JSONB,
  changed_by TEXT, -- webhook, api, function, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_status_audit_user_id ON pro_status_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_status_audit_created_at ON pro_status_audit(created_at);

-- Function to log pro status changes
CREATE OR REPLACE FUNCTION log_pro_status_change(
  p_user_id UUID,
  p_old_status TEXT,
  p_new_status TEXT,
  p_change_reason TEXT,
  p_subscription_context JSONB DEFAULT NULL,
  p_changed_by TEXT DEFAULT 'system'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO pro_status_audit (
    user_id, old_status, new_status, change_reason, 
    subscription_context, changed_by
  ) VALUES (
    p_user_id, p_old_status, p_new_status, p_change_reason,
    p_subscription_context, p_changed_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_pro_status_change TO service_role;

-- Trigger to automatically audit pro status changes
CREATE OR REPLACE FUNCTION audit_profile_pro_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pro IS DISTINCT FROM NEW.pro THEN
    PERFORM log_pro_status_change(
      NEW.id,
      OLD.pro,
      NEW.pro,
      'Profile updated directly',
      jsonb_build_object(
        'trigger', 'profile_update',
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at
      ),
      'trigger'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_profile_pro_status_changes ON profiles;
CREATE TRIGGER audit_profile_pro_status_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_pro_changes();