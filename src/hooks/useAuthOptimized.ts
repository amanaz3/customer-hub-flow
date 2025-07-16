// Optimized auth hook for production load handling
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useAuthOptimized = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authAttempts, setAuthAttempts] = useState(0);
  const initRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Exponential backoff for auth retries
  const attemptAuth = useCallback(async (attempt = 0) => {
    if (attempt > 3) {
      console.error('Max auth attempts reached');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error, attempt', attempt + 1, ':', error);
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        
        retryTimeoutRef.current = setTimeout(() => {
          attemptAuth(attempt + 1);
        }, delay);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setAuthAttempts(attempt);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Auth attempt failed:', error);
      attemptAuth(attempt + 1);
    }
  }, []);

  // Optimized auth state listener with debouncing
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let debounceTimeout: NodeJS.Timeout;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }, 100); // 100ms debounce
      }
    );

    // Initial auth check with retry logic
    attemptAuth();

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimeout);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [attemptAuth]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    authAttempts, // For monitoring
  };
};