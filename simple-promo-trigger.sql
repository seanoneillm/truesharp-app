-- Simple promo trigger: Only update existing profiles from 'no' to 'yes'
-- This runs AFTER profile creation, so it won't interfere with signup

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS promo_auto_upgrade_trigger ON auth.users;
DROP TRIGGER IF EXISTS simple_promo_upgrade_trigger ON public.profiles;
DROP FUNCTION IF EXISTS promo_auto_upgrade_new_user();
DROP FUNCTION IF EXISTS simple_promo_upgrade();

-- Create simple function that updates profiles and creates subscription record
CREATE OR REPLACE FUNCTION simple_promo_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    promo_end_date date := '2025-12-26';
    subscription_end timestamp with time zone;
BEGIN
    -- Only apply promo if current date is before end date
    IF CURRENT_DATE <= promo_end_date THEN
        -- Calculate 3 months from signup date
        subscription_end := NOW() + INTERVAL '3 months';
        
        -- Simply update the pro status from 'no' to 'yes' if profile exists
        UPDATE public.profiles 
        SET pro = 'yes', updated_at = NOW()
        WHERE id = NEW.id AND pro = 'no';
        
        -- Create subscription record to track when to revert back
        -- Only if one doesn't exist already
        IF NOT EXISTS (
            SELECT 1 FROM public.pro_subscriptions 
            WHERE user_id = NEW.id AND price_id = 'promo_3month_2025'
        ) THEN
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
                NOW(),
                subscription_end,
                'monthly',
                'promo_3month_2025',
                NOW(),
                NOW()
            );
        END IF;
        
        RAISE NOTICE 'Promo upgrade applied to user % expires %', NEW.id, subscription_end;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table instead of auth.users
-- This fires AFTER a profile is inserted, not when auth user is created
CREATE TRIGGER simple_promo_upgrade_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION simple_promo_upgrade();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION simple_promo_upgrade() TO authenticated;
GRANT EXECUTE ON FUNCTION simple_promo_upgrade() TO service_role;

-- Create cleanup function to revert expired promos back to 'no'
CREATE OR REPLACE FUNCTION cleanup_expired_promo_users()
RETURNS void AS $$
BEGIN
    -- Update profiles back to 'no' for expired promo subscriptions
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
                AND status = 'active'
                AND current_period_end < NOW()
                AND user_id NOT IN (
                    -- Don't revert users with other active subscriptions
                    SELECT user_id 
                    FROM public.pro_subscriptions 
                    WHERE 
                        status = 'active' 
                        AND price_id != 'promo_3month_2025'
                        AND current_period_end > NOW()
                )
        );
    
    -- Mark expired promo subscriptions as expired
    UPDATE public.pro_subscriptions 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND price_id = 'promo_3month_2025'
        AND current_period_end < NOW();
        
    RAISE NOTICE 'Cleaned up expired promo users at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_promo_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_promo_users() TO service_role;

SELECT 'Simple promo trigger created - triggers on profile creation, not auth user creation' as status;
SELECT 'Run cleanup_expired_promo_users() periodically via cron to revert expired promos' as cleanup_info;