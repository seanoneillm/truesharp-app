-- Add push notification support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON public.profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Create index for notification settings
CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled ON public.profiles(notifications_enabled) WHERE notifications_enabled = true;

-- Update RLS policy to allow users to update their own push token
CREATE POLICY "Users can update their own push token" ON profiles
    FOR UPDATE USING (auth.uid() = id);