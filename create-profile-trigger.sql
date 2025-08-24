-- Create profile trigger function with better error handling
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Extract username with fallback
  username_value := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  -- Ensure username is not empty and has reasonable length
  IF username_value IS NULL OR LENGTH(username_value) = 0 THEN
    username_value := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insert profile with error handling
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable the trigger for profile creation
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
