-- Apply promotional upgrade to users who signed up on 11/28/2024
-- This script manually applies the same logic as the trigger for existing users

DO $$
DECLARE
    user_record RECORD;
    subscription_start timestamp with time zone;
    subscription_end timestamp with time zone;
    users_processed integer := 0;
    users_skipped integer := 0;
BEGIN
    -- Set subscription period (3 months from now)
    subscription_start := NOW();
    subscription_end := NOW() + INTERVAL '3 months';
    
    -- Loop through users who signed up yesterday (11/28/2024)
    FOR user_record IN 
        SELECT au.id, au.created_at, p.pro
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE DATE(au.created_at) = '2024-11-28'
    LOOP
        -- Skip if user already has pro status
        IF user_record.pro = 'yes' THEN
            RAISE NOTICE 'Skipping user % - already has pro status', user_record.id;
            users_skipped := users_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Skip if user already has any subscription
        IF EXISTS (
            SELECT 1 FROM public.pro_subscriptions 
            WHERE user_id = user_record.id
        ) THEN
            RAISE NOTICE 'Skipping user % - already has subscription record', user_record.id;
            users_skipped := users_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Update the profile to set pro status to 'yes'
        UPDATE public.profiles 
        SET 
            pro = 'yes',
            updated_at = NOW()
        WHERE id = user_record.id;
        
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
            user_record.id,
            'active',
            subscription_start,
            subscription_end,
            'monthly',
            'promo_3month_2025',
            NOW(),
            NOW()
        );
        
        users_processed := users_processed + 1;
        RAISE NOTICE 'Promotional upgrade applied to user % (signed up: %) - subscription ends %', 
            user_record.id, user_record.created_at, subscription_end;
    END LOOP;
    
    -- Final summary
    RAISE NOTICE 'SUMMARY: Processed % users, Skipped % users who already had pro/subscriptions', 
        users_processed, users_skipped;
END $$;