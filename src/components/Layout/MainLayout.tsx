
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
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
  const isMobile = useIsMobile();
  
  console.log('MainLayout render:', { isAuthenticated, isAdmin, user: user?.email, requiredRole });
  console.log('MainLayout DOM mounting check - should only see this once per page');

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
    <div className="flex h-screen bg-background transition-all duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden w-full min-w-0">
        <Navbar />
        <main className={cn(
          "flex-1 overflow-y-auto bg-background transition-all duration-300",
          "p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10",
          isMobile ? "pt-4" : "pt-2"
        )}>
          <div className="max-w-full mx-auto min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
