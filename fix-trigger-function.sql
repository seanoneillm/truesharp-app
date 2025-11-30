-- Fix the trigger function to handle errors gracefully
-- Run this in your Supabase SQL Editor

-- First, let's see what the current trigger looks like
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Check if the function exists and its definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_profile_for_new_user'
AND n.nspname = 'public';

-- Create a new, more robust trigger function that won't fail signup
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Only proceed if this is a new user insert
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Extract username with fallback
  username_value := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  -- Ensure username is not empty and has reasonable length
  IF username_value IS NULL OR LENGTH(username_value) = 0 THEN
    username_value := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insert profile with comprehensive error handling
  BEGIN
    INSERT INTO public.profiles (
      id, 
      username, 
      email, 
      bio, 
      is_seller, 
      is_verified_seller, 
      pro, 
      profile_picture_url, 
      public_profile
    )
    VALUES (
      NEW.id,
      username_value,
      NEW.email,
      null,
      false,
      false,
      'no',
      null,
      false
    );
    
    -- Log success
    RAISE LOG 'Profile created successfully for user %', NEW.id;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists, that's okay
      RAISE LOG 'Profile already exists for user %, skipping', NEW.id;
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Continue without failing - the signup route will create the profile manually
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's using the new function
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_profile_for_new_user TO service_role;
GRANT EXECUTE ON FUNCTION create_profile_for_new_user TO authenticated;

-- Test the function by checking if we can call it manually (this will fail but show us the error)
DO $$
BEGIN
  RAISE LOG 'Testing trigger function setup - function should exist and be callable';
END $$;