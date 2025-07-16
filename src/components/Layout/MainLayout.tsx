
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'any';
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  requiredRole = 'any'
}) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  
  console.log('MainLayout render:', { isAuthenticated, isAdmin, user: user?.email, requiredRole });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'user' && isAdmin) {
    // Allow admin to access user pages
    // If you want to restrict admin from user pages, uncomment:
    // return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
