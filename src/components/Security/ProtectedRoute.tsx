
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading, session } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    hasSession: !!session,
    requireAdmin,
    currentPath: location.pathname 
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto" />
            <div className="h-4 w-48 bg-muted rounded mx-auto" />
            <div className="h-3 w-32 bg-muted/60 rounded mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !session) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated but admin access required and user is not admin
  if (requireAdmin && !isAdmin) {
    console.log('Admin access required but user is not admin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this resource.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
