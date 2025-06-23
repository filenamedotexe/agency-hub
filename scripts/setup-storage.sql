-- Create the attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Policy: Users can view their own uploaded files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Service managers and admins can view all files
CREATE POLICY "Service managers and admins can view all files" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role IN ('ADMIN', 'SERVICE_MANAGER')
  )
);

-- Policy: Service managers and admins can delete all files
CREATE POLICY "Service managers and admins can delete all files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role IN ('ADMIN', 'SERVICE_MANAGER')
  )
);