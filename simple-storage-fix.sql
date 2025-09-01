-- Simple Storage Fix for Profile Pictures
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop ALL existing policies to start completely fresh
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
        AND policyname ILIKE '%profile%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- 3. Create VERY simple and permissive policies
-- Allow ANY authenticated user to upload to profile-pictures bucket
CREATE POLICY "Allow authenticated uploads to profile-pictures" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- Allow ANY authenticated user to update in profile-pictures bucket
CREATE POLICY "Allow authenticated updates to profile-pictures" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- Allow ANY authenticated user to delete from profile-pictures bucket
CREATE POLICY "Allow authenticated deletes to profile-pictures" ON storage.objects
FOR DELETE 
USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- Allow ANYONE to read profile pictures (public access)
CREATE POLICY "Allow public read access to profile-pictures" ON storage.objects
FOR SELECT 
USING (bucket_id = 'profile-pictures');

-- 4. Verify the bucket and policies
SELECT 
    'Bucket exists:' as check_type,
    id as name,
    public as is_public 
FROM storage.buckets 
WHERE id = 'profile-pictures'

UNION ALL

SELECT 
    'Policies created:' as check_type,
    policyname as name,
    cmd as is_public
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname ILIKE '%profile%';