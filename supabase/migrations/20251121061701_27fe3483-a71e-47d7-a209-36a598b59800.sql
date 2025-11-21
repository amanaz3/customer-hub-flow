-- Add new stage types to cycle_status enum
ALTER TYPE cycle_status ADD VALUE IF NOT EXISTS 'loveable-stage';
ALTER TYPE cycle_status ADD VALUE IF NOT EXISTS 'dev-stage';
ALTER TYPE cycle_status ADD VALUE IF NOT EXISTS 'qa-stage';
ALTER TYPE cycle_status ADD VALUE IF NOT EXISTS 'live-stage';