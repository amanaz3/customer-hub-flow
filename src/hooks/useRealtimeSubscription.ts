
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseRealtimeSubscriptionProps {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate: () => void;
  schema?: string;
}

export const useRealtimeSubscription = ({
  table,
  event = '*',
  onUpdate,
  schema = 'public'
}: UseRealtimeSubscriptionProps) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table
        },
        (payload) => {
          console.log(`${table} change detected:`, payload);
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, onUpdate, schema]);
};
