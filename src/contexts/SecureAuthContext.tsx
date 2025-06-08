
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

export type { UserRole };

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
        toast({
          title: 'Account Created',
          description: isFirstUser ? 'Welcome! You have been granted admin access.' : 'Account created successfully! Please check your email to verify your account.',
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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
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
      // Generate a temporary password
      const tempPassword = 'TempPassword123!';
      
      // Use the regular signUp API instead of admin API
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name,
            role
          }
        }
      });

      if (!error && data.user) {
        // The trigger will automatically create the profile
        toast({
          title: 'User Created',
          description: `User ${name} has been created successfully. They will receive an email with login instructions.`,
        });
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
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (!error) {
        toast({
          title: 'Role Updated',
          description: `User role has been updated to ${role}.`,
        });
      }

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
      // First delete the profile (this will help with cleanup)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        return { error: profileError };
      }

      // Note: We can't delete from auth.users directly via the client
      // In a production app, you'd need a server-side function for this
      toast({
        title: 'User Removed',
        description: 'User profile has been removed from the system.',
      });

      return { error: null };
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
