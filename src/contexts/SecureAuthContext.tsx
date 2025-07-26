import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getFunctionUrl } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthOptimized } from '@/hooks/useAuthOptimized';
import ErrorTracker from '@/utils/errorTracking';
import FeatureAnalytics from '@/utils/featureAnalytics';
import { ProductionRateLimit } from '@/utils/productionRateLimit';

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
  createUser: (email: string, name: string, role: UserRole, password: string) => Promise<{ error: any }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  getUsers: () => Promise<{ data: any[], error: any }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ error: any }>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { UserRole };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, session, isLoading, isAuthenticated } = useAuthOptimized();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ role: UserRole; name: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch profile data when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', authUser.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          setProfile(null);
        } else {
          console.log('Profile loaded:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [authUser?.id]);

  // Convert auth user to AuthUser type with profile
  const user = useMemo(() => {
    if (!authUser) return null;
    return {
      ...authUser,
      profile
    } as AuthUser;
  }, [authUser, profile]);

  const isAdmin = useMemo(() => {
    const adminStatus = profile?.role === 'admin';
    console.log('Admin status check:', { profile, adminStatus });
    return adminStatus;
  }, [profile]);

  const signIn = async (email: string, password: string) => {
    const rateLimitResult = ProductionRateLimit.checkRateLimitWithBackoff(email, 'login');
    
    if (!rateLimitResult.allowed) {
      const message = `Too many login attempts. Please wait ${Math.ceil((rateLimitResult.backoffMs || 60000) / 1000)} seconds before trying again.`;
      toast({
        title: 'Rate Limited',
        description: message,
        variant: 'destructive',
      });
      return { error: { message } };
    }

    try {
      FeatureAnalytics.trackUserAction('login_attempt', { email_domain: email.split('@')[1] });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        ErrorTracker.captureError(error, { 
          userId: email, 
          page: 'login',
          userRole: 'unauthenticated'
        });
        FeatureAnalytics.trackUserAction('login_failed', { error: error.message });
      } else {
        FeatureAnalytics.trackUserAction('login_success');
      }

      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      ErrorTracker.captureError(error as Error, { 
        userId: email, 
        page: 'login'
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        // Clear any cached session data and redirect to login
        window.location.href = '/login';
        FeatureAnalytics.trackUserAction('logout_success');
        toast({
          title: 'Signed Out',
          description: 'You have been successfully signed out.',
        });
      } else {
        ErrorTracker.captureError(error, { 
          userId: user?.id, 
          page: 'logout'
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      ErrorTracker.captureError(error as Error, { 
        userId: user?.id, 
        page: 'logout'
      });
      return { error };
    }
  };

  const createUser = async (email: string, name: string, role: UserRole, password: string) => {
    if (!isAdmin) {
      return { error: { message: 'Unauthorized - Admin access required' } };
    }

    // Rate limiting for user creation
    const rateLimitResult = ProductionRateLimit.checkRateLimit(user?.id || 'unknown', 'customerCreate');
    if (!rateLimitResult.allowed) {
      toast({
        title: 'Rate Limited',
        description: 'Too many user creation attempts. Please wait before trying again.',
        variant: 'destructive',
      });
      return { error: { message: 'Rate limited' } };
    }

    try {
      FeatureAnalytics.trackUserAction('user_create_attempt', { target_role: role }, user?.id);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name,
            role,
            email_confirm: false,
            force_password_change: true
          }
        }
      });

      if (error) {
        console.error('User creation error:', error);
        ErrorTracker.captureError(error, {
          userId: user?.id,
          userRole: user?.profile?.role,
          page: 'user_management'
        });
        return { error };
      }

      if (data.user) {
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
          ErrorTracker.captureError(profileError, {
            userId: user?.id,
            userRole: user?.profile?.role,
            page: 'user_management'
          });
        }

        FeatureAnalytics.trackUserAction('user_create_success', { target_role: role }, user?.id);

        toast({
          title: 'User Created Successfully',
          description: `User ${name} has been created. They must change their password on first login.`,
          duration: 8000,
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Create user error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user?.id,
        userRole: user?.profile?.role,
        page: 'user_management'
      });
      return { error: { message: 'Failed to create user account' } };
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
        FeatureAnalytics.trackUserAction('user_role_updated', { new_role: role }, user?.id);
        toast({
          title: 'Role Updated',
          description: `User role has been updated to ${role}.`,
        });
      }

      return { error };
    } catch (error) {
      console.error('Update user role error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user?.id,
        userRole: user?.profile?.role,
        page: 'user_management'
      });
      return { error };
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin || userId === user?.id) {
      return { error: { message: 'Cannot delete yourself or unauthorized' } };
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        return { error: { message: 'No active session' } };
      }

      const response = await fetch(getFunctionUrl('delete-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: { message: result.error || 'Failed to delete user' } };
      }

      FeatureAnalytics.trackUserAction('user_deleted', { deleted_user_id: userId }, user?.id);

      toast({
        title: 'User Deleted',
        description: 'User has been completely removed from the system.',
      });

      return { error: null };
    } catch (error) {
      console.error('Delete user error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user?.id,
        userRole: user?.profile?.role,
        page: 'user_management'
      });
      return { error: { message: 'Failed to delete user' } };
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
      ErrorTracker.captureError(error as Error, {
        userId: user?.id,
        userRole: user?.profile?.role,
        page: 'user_management'
      });
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

      FeatureAnalytics.trackUserAction('password_reset', { target_user_id: userId }, user?.id);

      toast({
        title: 'Password Reset',
        description: 'Password has been reset successfully.',
      });

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user?.id,
        userRole: user?.profile?.role,
        page: 'user_management'
      });
      return { error: { message: 'Failed to reset password' } };
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    return await resetUserPassword(userId, newPassword);
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    isAuthenticated,
    isAdmin,
    isLoading: isLoading || profileLoading,
    signIn,
    signOut,
    createUser,
    updateUserRole,
    deleteUser,
    getUsers,
    resetUserPassword,
    changeUserPassword
  }), [user, session, isAuthenticated, isAdmin, isLoading, profileLoading]);

  // Don't render children until auth is initialized (not loading)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
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
