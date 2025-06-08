
import React, { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getFunctionUrl } from '@/lib/supabase';
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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  createUser: (email: string, name: string, role: UserRole) => Promise<{ error: any }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  getUsers: () => Promise<{ data: any[], error: any }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ error: any }>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { UserRole };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isLoading, setUser, setSession, setIsLoading, createProfile } = useAuthState();
  const { toast } = useToast();

  const isAuthenticated = !!session?.user;
  const isAdmin = user?.profile?.role === 'admin';

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
      // Use the default temporary password
      const tempPassword = 'support@143';
      
      // Create user with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: undefined, // Disable email redirect
          data: {
            name,
            role,
            email_confirm: false // Disable email confirmation
          }
        }
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Create profile entry manually
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            name,
            role
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway, as the user was created
        }

        toast({
          title: 'User Created',
          description: `User ${name} has been created successfully. Default password: ${tempPassword}`,
          duration: 10000,
        });
      }

      return { error: null };
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
      // Delete the profile (user deletion from auth.users requires service role)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        return { error: profileError };
      }

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

  const resetUserPassword = async (userId: string, newPassword: string) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized - Admin access required' } };
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        return { error: { message: 'No active session' } };
      }

      const response = await fetch(getFunctionUrl('reset-user-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          userId,
          newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: { message: result.error || 'Failed to reset password' } };
      }

      toast({
        title: 'Password Reset',
        description: 'Password has been reset successfully.',
      });

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: { message: 'Failed to reset password' } };
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    // Use the same function for both reset and change operations
    return await resetUserPassword(userId, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated,
      isAdmin,
      isLoading,
      signIn,
      signOut,
      createUser,
      updateUserRole,
      deleteUser,
      getUsers,
      resetUserPassword,
      changeUserPassword
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
