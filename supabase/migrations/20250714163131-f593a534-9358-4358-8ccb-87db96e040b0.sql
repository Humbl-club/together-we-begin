-- Check and fix storage policies for posts bucket
-- Allow authenticated users to upload to posts bucket
CREATE POLICY "Allow authenticated users to upload posts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to posts
CREATE POLICY "Allow public read access to posts" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

-- Allow authenticated users to update their own posts
CREATE POLICY "Allow authenticated users to update own posts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own posts
CREATE POLICY "Allow authenticated users to delete own posts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);