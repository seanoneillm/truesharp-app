-- Fix Storage RLS Policies for Profile Pictures
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile pictures" ON storage.objects;

-- 3. Create new comprehensive storage policies
-- Allow authenticated users to insert (upload) their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to all profile pictures
CREATE POLICY "Profile pictures are publicly accessible" ON storage.objects
FOR SELECT 
USING (bucket_id = 'profile-pictures');

-- Alternative: If the above policies are too restrictive, use these simpler ones
-- DROP ALL THE ABOVE POLICIES AND USE THESE IF NEEDED:

-- Simple policy: Allow any authenticated user to upload to profile-pictures
-- CREATE POLICY "Allow authenticated uploads to profile pictures" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- Simple policy: Allow public read access
-- CREATE POLICY "Allow public read access to profile pictures" ON storage.objects  
-- FOR SELECT USING (bucket_id = 'profile-pictures');

-- 4. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. Check the bucket exists
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';