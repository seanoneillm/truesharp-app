-- Create a function to delete user account and all associated data
-- This should be run in the Supabase SQL editor

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result JSONB;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    -- Verify the user is trying to delete their own account
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Not authenticated'
        );
    END IF;
    
    IF current_user_id != user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot delete another user''s account'
        );
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete user data in proper order to respect foreign key constraints
        
        -- 1. Delete user settings
        DELETE FROM user_settings WHERE user_settings.user_id = delete_user_account.user_id;
        
        -- 2. Delete pro subscriptions
        DELETE FROM pro_subscriptions WHERE pro_subscriptions.user_id = delete_user_account.user_id;
        
        -- 3. Delete subscriptions (both as subscriber and seller)
        DELETE FROM subscriptions 
        WHERE subscriber_id = delete_user_account.user_id 
           OR seller_id = delete_user_account.user_id;
        
        -- 4. Delete notifications
        DELETE FROM notifications WHERE notifications.user_id = delete_user_account.user_id;
        
        -- 5. Delete seller accounts
        DELETE FROM seller_accounts WHERE seller_accounts.user_id = delete_user_account.user_id;
        
        -- 6. Delete sportsbook connections
        DELETE FROM sportsbooks WHERE sportsbooks.user_id = delete_user_account.user_id;
        
        -- 7. Delete bets
        DELETE FROM bets WHERE bets.user_id = delete_user_account.user_id;
        
        -- 8. Delete strategies (this may cascade delete related data)
        DELETE FROM strategies WHERE strategies.user_id = delete_user_account.user_id;
        
        -- 9. Delete profile (this should be last)
        DELETE FROM profiles WHERE profiles.id = delete_user_account.user_id;
        
        -- Note: We don't delete the auth.users record here as that requires admin privileges
        -- The auth user will remain but with no associated data
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Account data successfully deleted'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        result := jsonb_build_object(
            'success', false,
            'error', 'Failed to delete account data: ' || SQLERRM
        );
    END;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account(UUID) IS 'Safely deletes a user account and all associated data. Can only be called by the user themselves.';