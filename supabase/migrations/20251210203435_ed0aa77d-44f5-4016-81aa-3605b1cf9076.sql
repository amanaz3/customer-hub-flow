-- Add script column to playbook_stages for agent talking points
ALTER TABLE playbook_stages ADD COLUMN script text;

-- Add opening_lines column for stage introduction phrases
ALTER TABLE playbook_stages ADD COLUMN opening_lines text[];

COMMENT ON COLUMN playbook_stages.script IS 'The main script or talking points for agents to follow during this stage';
COMMENT ON COLUMN playbook_stages.opening_lines IS 'Suggested opening phrases for this stage';