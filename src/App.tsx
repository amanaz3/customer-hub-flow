
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SecureAuthContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ProtectedRoute from '@/components/Security/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import SecureLogin from '@/pages/SecureLogin';
import OptimizedDashboard from '@/pages/OptimizedDashboard';
import CustomerList from '@/pages/CustomerList';
import CustomerNew from '@/pages/CustomerNew';
import CustomerDetail from '@/pages/CustomerDetail';
import SecureUserManagement from '@/pages/SecureUserManagement';
import CompletedCases from '@/pages/CompletedCases';
import Security from '@/pages/Security';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import FeatureAnalytics from '@/utils/featureAnalytics';

function App() {
  useEffect(() => {
    // Initialize monitoring systems
    ErrorTracker.init();
    PerformanceMonitor.init();
    PerformanceMonitor.trackPageLoad();
    FeatureAnalytics.init();

    // Track app initialization
    FeatureAnalytics.trackUserEngagement('session_start');

    return () => {
      // Cleanup on unmount
      PerformanceMonitor.cleanup();
      FeatureAnalytics.clearData();
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CustomerProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<SecureLogin />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <OptimizedDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CustomerList />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/customers/new" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CustomerNew />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/customers/:id" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CustomerDetail />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute requireAdmin>
                    <MainLayout>
                      <SecureUserManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/completed" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CompletedCases />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/security" element={
                  <ProtectedRoute requireAdmin>
                    <MainLayout requiredRole="admin">
                      <Security />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </NotificationProvider>
        </CustomerProvider>
      </AuthProvider>
      <Toaster />
    </Router>
  );
}

export default App;
