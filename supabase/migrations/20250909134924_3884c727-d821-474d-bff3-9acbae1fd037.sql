-- Update existing 'user' roles to 'manager' and set proper defaults
UPDATE profiles SET role = 'manager' WHERE role = 'user';
UPDATE status_changes SET changed_by_role = 'manager' WHERE changed_by_role = 'user';

-- Set default role for new profiles to 'manager'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'manager'::app_role;