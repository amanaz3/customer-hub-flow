
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${table} changes`);
        }
      });

    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up subscription for ${table}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, schema]); // Removed onUpdate from dependencies to prevent recreation

  // Use a separate effect for onUpdate changes
  useEffect(() => {
    // This effect handles when onUpdate function changes
    // but doesn't recreate the subscription
  }, [onUpdate]);
};
