-- Create CRM integration tables

-- Table to store CRM connection configurations
CREATE TABLE public.crm_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  crm_type TEXT NOT NULL, -- 'hubspot', 'salesforce', 'pipedrive', etc.
  api_endpoint TEXT NOT NULL,
  api_key_hash TEXT NOT NULL, -- Store hashed version for security
  webhook_secret TEXT,
  field_mappings JSONB DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track CRM sync operations
CREATE TABLE public.crm_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crm_config_id UUID NOT NULL REFERENCES public.crm_configurations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'webhook'
  entity_type TEXT NOT NULL, -- 'partners', 'applications', 'customers'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table to manage webhook configurations for external CRMs
CREATE TABLE public.crm_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to listen for
  api_key_hash TEXT NOT NULL, -- For authenticating incoming requests
  secret_token TEXT NOT NULL, -- For webhook signature verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store API keys for external CRM access
CREATE TABLE public.crm_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}', -- Array of allowed permissions
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crm_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_configurations
CREATE POLICY "Admins can manage all CRM configurations" 
ON public.crm_configurations 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view active CRM configurations" 
ON public.crm_configurations 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for crm_sync_logs
CREATE POLICY "Admins can view all sync logs" 
ON public.crm_sync_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert sync logs" 
ON public.crm_sync_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for crm_webhooks
CREATE POLICY "Admins can manage webhooks" 
ON public.crm_webhooks 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for crm_api_keys
CREATE POLICY "Admins can manage API keys" 
ON public.crm_api_keys 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_crm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_crm_configurations_updated_at
BEFORE UPDATE ON public.crm_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_crm_updated_at_column();

CREATE TRIGGER update_crm_webhooks_updated_at
BEFORE UPDATE ON public.crm_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_crm_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_crm_configurations_active ON public.crm_configurations(is_active);
CREATE INDEX idx_crm_sync_logs_config_id ON public.crm_sync_logs(crm_config_id);
CREATE INDEX idx_crm_sync_logs_status ON public.crm_sync_logs(status);
CREATE INDEX idx_crm_webhooks_active ON public.crm_webhooks(is_active);
CREATE INDEX idx_crm_api_keys_active ON public.crm_api_keys(is_active);