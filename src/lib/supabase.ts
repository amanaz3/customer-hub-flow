
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = 'https://gddibkhyhcnejxthsyzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGlia2h5aGNuZWp4dGhzeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgyMDksImV4cCI6MjA2NDM2NDIwOX0.KTJmWfvaeEjg6cI0v9ettbQjg_jDDi323uVNHtI_A-s'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Helper function to get the correct function URL
export const getFunctionUrl = (functionName: string) => {
  return `${supabaseUrl}/functions/v1/${functionName}`
}
