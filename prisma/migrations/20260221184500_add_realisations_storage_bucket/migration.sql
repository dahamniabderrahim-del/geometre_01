-- Create/update public bucket for realisation images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'realisations-images',
  'realisations-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for bucket files
DROP POLICY IF EXISTS "public read realisations images" ON storage.objects;
CREATE POLICY "public read realisations images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'realisations-images');

-- Only active admins can upload/update/delete files
DROP POLICY IF EXISTS "admin upload realisations images" ON storage.objects;
CREATE POLICY "admin upload realisations images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'realisations-images'
  AND EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.email = (auth.jwt() ->> 'email')
      AND a.active = true
  )
);

DROP POLICY IF EXISTS "admin update realisations images" ON storage.objects;
CREATE POLICY "admin update realisations images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'realisations-images'
  AND EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.email = (auth.jwt() ->> 'email')
      AND a.active = true
  )
)
WITH CHECK (
  bucket_id = 'realisations-images'
  AND EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.email = (auth.jwt() ->> 'email')
      AND a.active = true
  )
);

DROP POLICY IF EXISTS "admin delete realisations images" ON storage.objects;
CREATE POLICY "admin delete realisations images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'realisations-images'
  AND EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.email = (auth.jwt() ->> 'email')
      AND a.active = true
  )
);
