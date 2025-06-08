
import { useEffect, useRef } from 'react';
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
  const channelRef = useRef<any>(null);
  const subscriptionIdRef = useRef<string>('');

  useEffect(() => {
    // Create a unique channel name to avoid conflicts
    const uniqueChannelName = `${table}-changes-${Math.random().toString(36).substring(7)}`;
    
    // Clean up existing subscription if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(uniqueChannelName);
    channelRef.current = channel;
    subscriptionIdRef.current = uniqueChannelName;

    channel
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table
        },
        (payload) => {
          onUpdate();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed
        } else if (status === 'CHANNEL_ERROR') {
          // Error subscribing
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, schema, onUpdate]);
};
