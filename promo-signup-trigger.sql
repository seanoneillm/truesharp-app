-- Promotional signup trigger: Auto-upgrade users to pro for 3 months
-- Active until December 26, 2025
-- This trigger will automatically:
-- 1. Set user's pro status to 'yes' on signup
-- 2. Create a pro subscription record that expires 3 months later

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS promo_auto_upgrade_trigger ON auth.users;
DROP FUNCTION IF EXISTS promo_auto_upgrade_new_user();

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION promo_auto_upgrade_new_user()
RETURNS TRIGGER AS $$
DECLARE
    promo_end_date date := '2025-12-26';
    subscription_start timestamp with time zone;
    subscription_end timestamp with time zone;
BEGIN
    -- Only apply promo if current date is before end date
    IF CURRENT_DATE <= promo_end_date THEN
        -- Set subscription period (3 months from now)
        subscription_start := NOW();
        subscription_end := NOW() + INTERVAL '3 months';
        
        -- Update the profile to set pro status to 'yes'
        UPDATE public.profiles 
        SET 
            pro = 'yes',
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Create a promotional subscription record
        INSERT INTO public.pro_subscriptions (
            user_id,
            status,
            current_period_start,
            current_period_end,
            plan,
            price_id,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            'active',
            subscription_start,
            subscription_end,
            'monthly',
            'promo_3month_2025',
            NOW(),
            NOW()
        );
        
        -- Log the promotional upgrade
        RAISE NOTICE 'Promotional upgrade applied to user % with subscription ending %', NEW.id, subscription_end;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
CREATE TRIGGER promo_auto_upgrade_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION promo_auto_upgrade_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION promo_auto_upgrade_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION promo_auto_upgrade_new_user() TO service_role;

-- Create a cleanup function to disable expired promotional subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_promo_subscriptions()
RETURNS void AS $$
BEGIN
    -- Update expired promotional subscriptions
    UPDATE public.pro_subscriptions 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND price_id = 'promo_3month_2025'
        AND current_period_end < NOW();
    
    -- Update profiles for users whose promotional subscriptions have expired
    -- Only if they don't have other active subscriptions
    UPDATE public.profiles 
    SET 
        pro = 'no',
        updated_at = NOW()
    WHERE 
        pro = 'yes'
        AND id IN (
            SELECT user_id 
            FROM public.pro_subscriptions 
            WHERE 
                price_id = 'promo_3month_2025' 
                AND status = 'expired'
                AND current_period_end < NOW()
                AND user_id NOT IN (
                    -- Exclude users with other active subscriptions
                    SELECT user_id 
                    FROM public.pro_subscriptions 
                    WHERE 
                        status = 'active' 
                        AND price_id != 'promo_3month_2025'
                        AND current_period_end > NOW()
                )
        );
        
    RAISE NOTICE 'Cleaned up expired promotional subscriptions at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_promo_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_promo_subscriptions() TO service_role;

-- Comments for documentation
COMMENT ON FUNCTION promo_auto_upgrade_new_user() IS 'Promotional trigger function: Auto-upgrades new users to pro for 3 months until December 26, 2025';
COMMENT ON FUNCTION cleanup_expired_promo_subscriptions() IS 'Cleanup function for expired promotional subscriptions - should be run periodically via cron job';

-- Display trigger status
SELECT 
    'Promotional signup trigger created successfully' as status,
    'Active until: 2025-12-26' as promo_period,
    'Grants: 3 months pro access to new signups' as benefit;