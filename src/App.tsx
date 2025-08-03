
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SecureAuthContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import ProtectedRoute from '@/components/Security/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import SecureLogin from '@/pages/SecureLogin';
import {
  LazyOptimizedDashboard,
  LazyCustomerList,
  LazyCustomerNew,
  LazyCustomerDetail,
  LazySecureUserManagement,
  LazyCompletedApplications,
  LazyRejectedApplications,
  LazySettings,
  LazyProductManagement,
  LazyNotFound,
  PageLoadingFallback
} from '@/components/LazyComponents';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import FeatureAnalytics from '@/utils/featureAnalytics';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Log application-level errors
          ErrorTracker.captureError(error, { component: 'App', ...errorInfo });
        }}
      >
        <Router>
          <AuthProvider>
            <CustomerProvider>
              <NotificationProvider>
                <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/login" element={
                    <PageErrorBoundary pageName="Login">
                      <SecureLogin />
                    </PageErrorBoundary>
                  } />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Dashboard">
                          <LazyOptimizedDashboard />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer List">
                          <LazyCustomerList />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers/new" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="New Customer">
                          <LazyCustomerNew />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer Details">
                          <LazyCustomerDetail />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/users" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="User Management">
                          <LazySecureUserManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/completed" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Completed Applications">
                          <LazyCompletedApplications />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/rejected" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Rejected Applications">
                          <LazyRejectedApplications />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/products" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Product Management">
                          <LazyProductManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Settings">
                          <LazySettings />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={
                    <PageErrorBoundary pageName="Not Found">
                      <LazyNotFound />
                    </PageErrorBoundary>
                  } />
                  </Routes>
                </div>
              </NotificationProvider>
            </CustomerProvider>
          </AuthProvider>
          <Toaster />
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
