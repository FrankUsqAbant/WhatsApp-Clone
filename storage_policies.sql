CREATE POLICY "Allow authenticated uploads to chat_attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat_attachments');

CREATE POLICY "Allow public reads from chat_attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat_attachments');

CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public reads from avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
