-- Create script_nodes table for decision tree scripts within stages
CREATE TABLE public.script_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.playbook_stages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.script_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'branch', -- 'root', 'branch', 'leaf'
  script_text TEXT NOT NULL,
  trigger_condition TEXT, -- what customer response triggers this node (null for root)
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- success rates, avg time, notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for stage lookup
CREATE INDEX idx_script_nodes_stage_id ON public.script_nodes(stage_id);

-- Create index for tree traversal
CREATE INDEX idx_script_nodes_parent_id ON public.script_nodes(parent_id);

-- Enable RLS
ALTER TABLE public.script_nodes ENABLE ROW LEVEL SECURITY;

-- Admins can manage script nodes
CREATE POLICY "Admins can manage script nodes"
  ON public.script_nodes
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Authenticated users can view script nodes
CREATE POLICY "Authenticated users can view script nodes"
  ON public.script_nodes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_script_nodes_updated_at
  BEFORE UPDATE ON public.script_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();