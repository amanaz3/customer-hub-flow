-- Create secure storage buckets and policies for document privacy

-- First, let's create a private bucket for customer documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-documents-private', 'customer-documents-private', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create RLS policies for secure document access
-- Only allow authenticated users to upload files to their own folder structure
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'customer-documents-private' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-documents-private' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-documents-private' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'customer-documents-private' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'customer-documents-private' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to manage all documents
CREATE POLICY "Admins can manage all documents" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'customer-documents-private' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a function to generate secure signed URLs for document access
CREATE OR REPLACE FUNCTION get_secure_document_url(
  file_path text,
  expires_in_seconds integer DEFAULT 3600
) RETURNS text
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  customer_user_id uuid;
  requesting_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get the requesting user
  requesting_user_id := auth.uid();
  
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM profiles 
  WHERE id = requesting_user_id;
  
  -- Extract customer user ID from file path (first folder in path)
  customer_user_id := (string_to_array(file_path, '/'))[1]::uuid;
  
  -- Allow access if user owns the file or is admin
  IF requesting_user_id = customer_user_id OR is_admin THEN
    -- This would normally call Supabase's signed URL function
    -- For now, return a placeholder indicating secure access granted
    RETURN 'SECURE_ACCESS_GRANTED:' || file_path;
  ELSE
    RAISE EXCEPTION 'Access denied to document';
  END IF;
END;
$$;