-- Create statuses table
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
-- Allow anyone to view statuses
CREATE POLICY "Anyone can view statuses" 
ON public.statuses 
FOR SELECT 
USING (true);
-- Allow authenticated users to insert their own statuses
CREATE POLICY "Users can insert their own statuses" 
ON public.statuses 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());
-- Delete old statuses (optional auto-cleanup or manual policy)
-- For now, allow users to delete their own
CREATE POLICY "Users can delete their own statuses" 
ON public.statuses 
FOR DELETE 
USING (profile_id = auth.uid());
-- Set up storage policies for status_media
CREATE POLICY "Public read access to status media"
ON storage.objects FOR SELECT
USING (bucket = 'status_media');
CREATE POLICY "Authenticated users can upload status media"
ON storage.objects FOR INSERT
WITH CHECK (bucket = 'status_media' AND auth.role() = 'authenticated');
