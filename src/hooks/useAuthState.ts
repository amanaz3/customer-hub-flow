
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/contexts/SecureAuthContext';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeRef = useRef(false);
  const mountedRef = useRef(true);

  const createProfile = async (userId: string, email: string, role: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: email.split('@')[0],
        role
      });
    
    if (error) {
      console.error('Error creating profile:', error);
    }
    return { error };
  };

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        name: profile.name,
        role: profile.role as UserRole
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }, []);

  const updateAuthState = useCallback(async (newSession: Session | null) => {
    if (!mountedRef.current) return;

    try {
      setSession(newSession);
      
      if (newSession?.user) {
        console.log('Updating auth state for user:', newSession.user.email);
        const profile = await fetchUserProfile(newSession.user.id);
        
        if (mountedRef.current) {
          setUser({
            ...newSession.user,
            profile
          } as AuthUser);
        }
      } else {
        console.log('User not authenticated, clearing data');
        setUser(null);
      }
    } catch (error) {
      console.error('Error updating auth state:', error);
      if (mountedRef.current) {
        setUser(null);
        setSession(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializeRef.current) return;
    initializeRef.current = true;

    let subscription: any;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Set up auth state listener first
        const { data: authData } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mountedRef.current) return;
            console.log('Auth state changed:', event, session?.user?.email);
            await updateAuthState(session);
          }
        );
        
        subscription = authData.subscription;

        // Get initial session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          await updateAuthState(null);
          return;
        }

        await updateAuthState(currentSession);
      } catch (error) {
        console.error('Auth initialization error:', error);
        await updateAuthState(null);
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [updateAuthState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    setUser: useCallback((newUser: AuthUser | null) => {
      if (mountedRef.current) {
        setUser(newUser);
      }
    }, []),
    setSession: useCallback((newSession: Session | null) => {
      if (mountedRef.current) {
        setSession(newSession);
      }
    }, []),
    setIsLoading: useCallback((loading: boolean) => {
      if (mountedRef.current) {
        setIsLoading(loading);
      }
    }, []),
    createProfile
  };
};
