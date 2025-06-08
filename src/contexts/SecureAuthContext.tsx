
import React, { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';

type UserRole = 'admin' | 'user';

export interface AuthUser extends User {
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

export { UserRole };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isLoading, setUser, setSession, setIsLoading, createProfile } = useAuthState();
  const { toast } = useToast();

  const isAuthenticated = !!session?.user;
  const isAdmin = user?.profile?.role === 'admin';

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
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

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Check if there's an active session before attempting logout
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // User is already logged out, just clear local state
        setUser(null);
        setSession(null);
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setSession(null);
        toast({
          title: 'Signed Out',
          description: 'You have been successfully signed out.',
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      return { error };
    }
  };

  const createUser = async (email: string, name: string, role: UserRole) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized' } };
    }

    try {
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
    } catch (error) {
      console.error('Create user error:', error);
      return { error };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized' } };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      return { error };
    } catch (error) {
      console.error('Update user role error:', error);
      return { error };
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin || userId === user?.id) {
      return { error: { message: 'Cannot delete yourself or unauthorized' } };
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      return { error };
    } catch (error) {
      console.error('Delete user error:', error);
      return { error };
    }
  };

  const getUsers = async () => {
    if (!isAdmin) {
      return { data: [], error: { message: 'Unauthorized' } };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Get users error:', error);
      return { data: [], error };
    }
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
