-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily digest emails at 9 AM UTC
SELECT cron.schedule(
  'daily-target-digest',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1/monthly-digest-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGlia2h5aGNuZWp4dGhzeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgyMDksImV4cCI6MjA2NDM2NDIwOX0.KTJmWfvaeEjg6cI0v9ettbQjg_jDDi323uVNHtI_A-s"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);