-- Fix for promo signup trigger: Use UPSERT instead of UPDATE
-- This resolves the conflict with manual profile creation in signup route

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS promo_auto_upgrade_trigger ON auth.users;
DROP FUNCTION IF EXISTS promo_auto_upgrade_new_user();

-- Create the fixed function that uses UPSERT
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
        
        -- UPSERT the profile to set pro status (handles both new and existing profiles)
        INSERT INTO public.profiles (
            id,
            pro,
            updated_at
        ) VALUES (
            NEW.id,
            'yes',
            NOW()
        ) 
        ON CONFLICT (id) 
        DO UPDATE SET 
            pro = 'yes',
            updated_at = NOW();
        
        -- Create a promotional subscription record (avoid duplicates)
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
        )
        ON CONFLICT (user_id, price_id) DO NOTHING; -- Avoid duplicate promo subscriptions
        
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

-- Display status
SELECT 
    'Fixed promotional signup trigger created successfully' as status,
    'Uses UPSERT to avoid conflicts with manual profile creation' as fix_description,
    'Active until: 2025-12-26' as promo_period;