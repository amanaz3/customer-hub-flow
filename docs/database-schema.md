
# Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the Customer Management System.

## Overview

The system uses PostgreSQL through Supabase with the following key characteristics:
- Row Level Security (RLS) enabled on all tables
- UUID primary keys for enhanced security
- Audit trails for all critical operations
- Type-safe enums for status and role management

## Tables

### 1. profiles

User profile information and role management.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Columns:
- `id` (UUID): Primary key, references auth.users
- `email` (TEXT): User's email address
- `name` (TEXT): User's display name
- `role` (app_role): User role (admin, user)
- `created_at` (TIMESTAMPTZ): Profile creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

#### Relationships:
- One-to-many with `customers` (user_id)
- One-to-many with `status_changes` (changed_by)

### 2. customers

Core customer application data.

```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  company TEXT NOT NULL,
  lead_source lead_source_type NOT NULL,
  license_type license_type_enum NOT NULL,
  status customer_status NOT NULL DEFAULT 'Draft',
  amount NUMERIC NOT NULL,
  user_id UUID NOT NULL,
  payment_received BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  drive_folder_id TEXT
);
```

#### Columns:
- `id` (UUID): Primary key
- `name` (TEXT): Customer full name
- `email` (TEXT): Customer email
- `mobile` (TEXT): Customer phone number
- `company` (TEXT): Customer company name
- `lead_source` (lead_source_type): How customer found us
- `license_type` (license_type_enum): Type of license requested
- `status` (customer_status): Current application status
- `amount` (NUMERIC): Application fee amount
- `user_id` (UUID): Associated user/agent
- `payment_received` (BOOLEAN): Payment status
- `payment_date` (TIMESTAMPTZ): Payment received date
- `created_at` (TIMESTAMPTZ): Record creation time
- `updated_at` (TIMESTAMPTZ): Last update time
- `drive_folder_id` (TEXT): Legacy Google Drive folder ID

#### Relationships:
- Many-to-one with `profiles` (user_id)
- One-to-many with `documents` (customer_id)
- One-to-many with `status_changes` (customer_id)
- One-to-many with `comments` (customer_id)

### 3. documents

Document metadata and upload tracking.

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_uploaded BOOLEAN NOT NULL DEFAULT false,
  category document_category NOT NULL,
  requires_license_type license_type_enum,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Columns:
- `id` (UUID): Primary key
- `customer_id` (UUID): Associated customer
- `name` (TEXT): Document name/description
- `is_mandatory` (BOOLEAN): Required for application
- `is_uploaded` (BOOLEAN): Upload status
- `category` (document_category): Document categorization
- `requires_license_type` (license_type_enum): License type requirement
- `file_path` (TEXT): Supabase storage path
- `created_at` (TIMESTAMPTZ): Record creation time
- `updated_at` (TIMESTAMPTZ): Last update time

#### Relationships:
- Many-to-one with `customers` (customer_id)

### 4. status_changes

Audit trail for all status modifications.

```sql
CREATE TABLE public.status_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  previous_status customer_status NOT NULL,
  new_status customer_status NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_role app_role NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Columns:
- `id` (UUID): Primary key
- `customer_id` (UUID): Associated customer
- `previous_status` (customer_status): Status before change
- `new_status` (customer_status): Status after change
- `changed_by` (UUID): User who made the change
- `changed_by_role` (app_role): Role of user making change
- `comment` (TEXT): Optional change reason/comment
- `created_at` (TIMESTAMPTZ): Change timestamp

#### Relationships:
- Many-to-one with `customers` (customer_id)
- Many-to-one with `profiles` (changed_by)

### 5. comments

Application comments and notes.

```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Columns:
- `id` (UUID): Primary key
- `customer_id` (UUID): Associated customer
- `comment` (TEXT): Comment content
- `created_by` (UUID): User who created comment
- `created_at` (TIMESTAMPTZ): Comment timestamp

#### Relationships:
- Many-to-one with `customers` (customer_id)
- Many-to-one with `profiles` (created_by)

## Custom Types (Enums)

### app_role
User role enumeration:
```sql
CREATE TYPE app_role AS ENUM ('admin', 'user');
```

### customer_status
Application status workflow:
```sql
CREATE TYPE customer_status AS ENUM (
  'Draft',
  'Submitted', 
  'Returned',
  'Sent to Bank',
  'Complete',
  'Rejected',
  'Need More Info',
  'Paid'
);
```

### lead_source_type
Customer acquisition channels:
```sql
CREATE TYPE lead_source_type AS ENUM (
  'Website',
  'Referral', 
  'Social Media',
  'Other'
);
```

### license_type_enum
License categories:
```sql
CREATE TYPE license_type_enum AS ENUM (
  'Mainland',
  'Freezone',
  'Offshore'
);
```

### document_category
Document classification:
```sql
CREATE TYPE document_category AS ENUM (
  'mandatory',
  'signatory',
  'freezone',
  'supporting'
);
```

## Database Functions

### get_user_role(user_id UUID)
Returns the role of a specific user:
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$
```

### is_admin(user_id UUID)
Checks if a user has admin role:
```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER  
AS $function$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = user_id), false);
$function$
```

### has_role(_user_id UUID, _role app_role)
Generic role checking function:
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$function$
```

### create_default_documents()
Trigger function to create default documents for new customers:
```sql
CREATE OR REPLACE FUNCTION public.create_default_documents()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert mandatory documents for all license types
  INSERT INTO public.documents (customer_id, name, is_mandatory, category) VALUES
    (NEW.id, 'Trade Licence', TRUE, 'mandatory'),
    (NEW.id, 'Full MOA / POA', TRUE, 'mandatory'),
    -- ... additional documents
    
  -- Insert freezone-specific documents if applicable
  IF NEW.license_type = 'Freezone' THEN
    INSERT INTO public.documents (customer_id, name, is_mandatory, category, requires_license_type) VALUES
      (NEW.id, 'Share Certificate', TRUE, 'freezone', 'Freezone');
  END IF;
  
  RETURN NEW;
END;
$function$
```

### handle_new_user()
Trigger function for automatic profile creation:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
    user_role app_role := 'user';
    user_name text;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, user_name, user_role, now(), now());
    
    RETURN NEW;
END;
$function$
```

## Row Level Security (RLS) Policies

### profiles Table
Currently no RLS policies are defined. Consider adding:
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));
```

### customers Table
```sql
-- Users can view customers they created
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT USING (is_admin(auth.uid()));

-- Users can create customers
CREATE POLICY "Users can create customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own customers
CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any customer
CREATE POLICY "Admins can update any customer" ON customers
  FOR UPDATE USING (is_admin(auth.uid()));
```

## Indexes and Performance

### Recommended Indexes:
```sql
-- Customer lookups by user
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Status changes by customer
CREATE INDEX idx_status_changes_customer_id ON status_changes(customer_id);

-- Documents by customer
CREATE INDEX idx_documents_customer_id ON documents(customer_id);

-- Comments by customer
CREATE INDEX idx_comments_customer_id ON comments(customer_id);

-- Status changes by timestamp
CREATE INDEX idx_status_changes_created_at ON status_changes(created_at DESC);
```

## Data Integrity Constraints

### Foreign Key Constraints:
```sql
-- Customer user reference
ALTER TABLE customers 
ADD CONSTRAINT fk_customers_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Document customer reference
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Status change customer reference
ALTER TABLE status_changes 
ADD CONSTRAINT fk_status_changes_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
```

## Backup and Migration Strategy

### Backup Considerations:
- Daily automated backups through Supabase
- Point-in-time recovery available
- Export capabilities for data portability

### Migration Strategy:
- Version-controlled schema changes
- Rollback procedures for each migration
- Data validation after migrations
- Zero-downtime deployment strategies

This schema provides a robust foundation for the customer management system with proper audit trails, security, and scalability considerations.
