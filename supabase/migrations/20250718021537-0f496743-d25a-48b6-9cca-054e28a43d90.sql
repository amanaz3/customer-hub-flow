-- Fix RLS policies for proper admin/user access

-- First, drop duplicate and problematic policies
DROP POLICY IF EXISTS "Admins can create any status change" ON status_changes;
DROP POLICY IF EXISTS "Users can view status changes for their customers" ON status_changes;
DROP POLICY IF EXISTS "Users can view status changes of their customers" ON status_changes;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;

-- Clean up status_changes policies
DROP POLICY IF EXISTS "Admins can create status changes" ON status_changes;
DROP POLICY IF EXISTS "Users can create status changes for their customers" ON status_changes;
DROP POLICY IF EXISTS "Admins can view all status changes" ON status_changes;

-- Create simplified, working status_changes policies
CREATE POLICY "Admins can manage all status changes" 
ON status_changes 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can create status changes for own customers" 
ON status_changes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = status_changes.customer_id 
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view status changes for own customers" 
ON status_changes 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = status_changes.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- Clean up customers policies  
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers or admins can update all" ON customers;
DROP POLICY IF EXISTS "Users can view own customers" ON customers;

-- Create simplified customers policies
CREATE POLICY "Users can manage their own customers" 
ON customers 
FOR ALL 
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Fix documents policies to ensure proper access
DROP POLICY IF EXISTS "Users can manage documents for their customers" ON documents;
DROP POLICY IF EXISTS "Users can update documents of their customers" ON documents;
DROP POLICY IF EXISTS "Users can view documents for their customers" ON documents;
DROP POLICY IF EXISTS "Users can view documents of their customers" ON documents;

CREATE POLICY "Users can manage documents for own customers" 
ON documents 
FOR ALL 
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = documents.customer_id 
    AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = documents.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- Fix comments policies
DROP POLICY IF EXISTS "Users can create comments for their customers" ON comments;
DROP POLICY IF EXISTS "Users can view comments for their customers" ON comments;
DROP POLICY IF EXISTS "Users can view comments of their customers" ON comments;

CREATE POLICY "Users can manage comments for own customers" 
ON comments 
FOR ALL 
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = comments.customer_id 
    AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = comments.customer_id 
    AND customers.user_id = auth.uid()
  )
);