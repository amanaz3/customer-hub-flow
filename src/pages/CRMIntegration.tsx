import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { CRMIntegrationDashboard } from '@/components/CRM/CRMIntegrationDashboard';
import ProtectedRoute from '@/components/Security/ProtectedRoute';

const CRMIntegration: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <MainLayout>
        <div className="container mx-auto py-6">
          <CRMIntegrationDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default CRMIntegration;