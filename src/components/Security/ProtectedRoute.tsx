
import React, { useEffect } from 'react';
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

  // Force redirect after a reasonable timeout if still loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('ProtectedRoute: Loading timeout reached, user should be redirected');
        if (isLoading && !session) {
          window.location.href = '/login';
        }
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, session]);

  // Show loading state only for a reasonable time
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
          <p className="mt-1 text-sm text-gray-500">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // If not loading and not authenticated, redirect to login
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
