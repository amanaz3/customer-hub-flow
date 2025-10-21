// Re-export the singleton Supabase client to avoid multiple instances
export { supabase } from '@/integrations/supabase/client'

// Helper function to get the correct function URL
export const getFunctionUrl = (functionName: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/functions/v1/${functionName}`
}
