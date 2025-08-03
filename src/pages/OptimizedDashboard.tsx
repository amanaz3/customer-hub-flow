import React from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import UserDashboard from '@/components/User/UserDashboard';

const OptimizedDashboard = () => {
  const { isAdmin } = useAuth();

  // Render role-specific dashboard
  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

export default OptimizedDashboard;