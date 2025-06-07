
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'user';

export interface AuthUser extends User {
  role?: UserRole;
  profile?: {
    name: string;
    role: UserRole;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  createUser: (email: string, name: string, role: UserRole) => Promise<{ error: any }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  getUsers: () => Promise<{ data: any[], error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!session?.user;
  const isAdmin = user?.profile?.role === 'admin';

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('name, role')
                .eq('id', session.user.id)
                .single();

              if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist, create one
                if (error.code === 'PGRST116') {
                  await createProfile(session.user.id, session.user.email || '', 'user');
                }
              } else {
                setUser({
                  ...session.user,
                  profile
                });
              }
            } catch (error) {
              console.error('Profile fetch error:', error);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Check if this is the first user - make them admin
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const isFirstUser = !existingUsers || existingUsers.length === 0;
    const role = isFirstUser ? 'admin' : 'user';
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name,
          role
        }
      }
    });

    if (!error && data.user) {
      // Create profile manually if needed
      await createProfile(data.user.id, email, role);
      
      toast({
        title: 'Account Created',
        description: isFirstUser ? 'Welcome! You have been granted admin access.' : 'Please check your email to verify your account.',
      });
    }

    setIsLoading(false);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const createUser = async (email: string, name: string, role: UserRole) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized' } };
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'TempPassword123!',
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (!error && data.user) {
      await createProfile(data.user.id, email, role);
    }

    return { error };
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized' } };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    return { error };
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin || userId === user?.id) {
      return { error: { message: 'Cannot delete yourself or unauthorized' } };
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    return { error };
  };

  const getUsers = async () => {
    if (!isAdmin) {
      return { data: [], error: { message: 'Unauthorized' } };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated,
      isAdmin,
      isLoading,
      signUp,
      signIn,
      signOut,
      createUser,
      updateUserRole,
      deleteUser,
      getUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
