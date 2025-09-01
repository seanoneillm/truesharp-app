-- Add missing display_name column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- Create index for display_name for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Update trigger to handle display_name updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Make sure the trigger exists for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets for profile pictures (critical for image upload)
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile pictures" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = owner);

CREATE POLICY "Allow users to delete their own profile pictures" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = owner);

CREATE POLICY "Allow public access to profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

-- Verify profile table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;