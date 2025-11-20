-- Create cycle_status enum
CREATE TYPE cycle_status AS ENUM ('planning', 'active', 'completed');

-- Create cycles table (Linear-style)
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status cycle_status NOT NULL DEFAULT 'planning',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Validation: end date must be after start date
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Add cycle_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_tasks_cycle_id ON public.tasks(cycle_id);
CREATE INDEX idx_cycles_status ON public.cycles(status);
CREATE INDEX idx_cycles_dates ON public.cycles(start_date, end_date);

-- Enable RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cycles
CREATE POLICY "Users can view all cycles"
  ON public.cycles FOR SELECT
  USING (true);

CREATE POLICY "Users can create cycles"
  ON public.cycles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update cycles"
  ON public.cycles FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete cycles"
  ON public.cycles FOR DELETE
  USING (is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE public.cycles IS 'Linear-style cycles (sprints) for time-boxed work periods';
COMMENT ON COLUMN public.cycles.status IS 'Cycle status: planning (not started), active (current sprint), completed (finished)';
COMMENT ON COLUMN public.tasks.cycle_id IS 'Optional link to cycle - tasks can belong to a cycle for sprint planning';