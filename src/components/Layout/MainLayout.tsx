
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
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-background/95 responsive-transition">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Navbar />
        <main className={cn(
          "flex-1 overflow-y-auto bg-transparent responsive-transition",
          "container-responsive",
          "p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12",
          isMobile ? "pt-20" : "pt-6" // Account for enhanced mobile menu button
        )}>
          <div className="max-w-full mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
