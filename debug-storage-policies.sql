-- Debug Storage Policies
-- Run this to see what's actually happening with storage

-- 1. Check if policies exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
ORDER BY policyname;

-- 2. Check bucket configuration
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';

-- 3. Test auth context (this should show your user ID if you're logged in)
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 4. Try to see if there are any existing objects in the bucket
SELECT name, bucket_id, owner FROM storage.objects WHERE bucket_id = 'profile-pictures' LIMIT 5;

-- 5. Create an even more permissive policy temporarily for testing
DROP POLICY IF EXISTS "TEMP_Allow_All_Profile_Operations" ON storage.objects;
CREATE POLICY "TEMP_Allow_All_Profile_Operations" ON storage.objects
FOR ALL 
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');