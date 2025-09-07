
-- Add Stripe product and price ID columns to strategies table
ALTER TABLE strategies 
ADD COLUMN stripe_product_id VARCHAR(255),
ADD COLUMN stripe_price_id_weekly VARCHAR(255),
ADD COLUMN stripe_price_id_monthly VARCHAR(255),
ADD COLUMN stripe_price_id_yearly VARCHAR(255);

-- Add Stripe customer ID to profiles table
ALTER TABLE profiles
ADD COLUMN stripe_customer_id VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_strategies_stripe_product_id ON strategies(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Create functions for managing subscriber counts
CREATE OR REPLACE FUNCTION increment_subscriber_count(strategy_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE strategies 
  SET subscriber_count = COALESCE(subscriber_count, 0) + 1,
      updated_at = NOW()
  WHERE id = strategy_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_subscriber_count(strategy_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE strategies 
  SET subscriber_count = GREATEST(COALESCE(subscriber_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = strategy_id_param;
END;
$$ LANGUAGE plpgsql;

