
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/contexts/SecureAuthContext';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchUserProfile = async (userId: string) => {
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
  };

  const validateSession = async (currentSession: Session) => {
    try {
      // Check if the session is still valid by making a test request
      const { data, error } = await supabase.auth.getUser(currentSession.access_token);
      
      if (error || !data.user) {
        console.log('Session validation failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('Auth initialization timeout, setting as unauthenticated');
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout

        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (currentSession && isMounted) {
          console.log('Current session found, validating...', currentSession.user.email);
          
          // Validate the session
          const isValid = await validateSession(currentSession);
          
          if (!isValid) {
            console.log('Session is invalid, clearing auth state');
            if (isMounted) {
              setSession(null);
              setUser(null);
              setIsLoading(false);
            }
            return;
          }
          
          setSession(currentSession);
          
          // Fetch profile for the current user
          const profile = await fetchUserProfile(currentSession.user.id);
          if (isMounted) {
            setUser({
              ...currentSession.user,
              profile
            } as AuthUser);
          }
        } else if (isMounted) {
          console.log('No current session found');
          setSession(null);
          setUser(null);
        }
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        try {
          if (session?.user) {
            // Validate the new session
            const isValid = await validateSession(session);
            
            if (!isValid) {
              console.log('New session is invalid, clearing auth state');
              if (isMounted) {
                setSession(null);
                setUser(null);
                setIsLoading(false);
              }
              return;
            }
            
            setSession(session);
            
            // Fetch profile for the authenticated user
            const profile = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser({
                ...session.user,
                profile
              } as AuthUser);
            }
          } else {
            setSession(null);
            setUser(null);
          }
          
          if (isMounted) {
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    // Initialize auth state
    initializeAuth();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    setUser,
    setSession,
    setIsLoading,
    createProfile
  };
};
