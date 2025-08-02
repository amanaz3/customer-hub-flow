import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load components for better performance
const OptimizedDashboard = React.lazy(() => import('@/pages/OptimizedDashboard'));
const CustomerList = React.lazy(() => import('@/pages/CustomerList'));
const CustomerNew = React.lazy(() => import('@/pages/CustomerNew'));
const CustomerDetail = React.lazy(() => import('@/pages/CustomerDetail'));
const SecureUserManagement = React.lazy(() => import('@/pages/SecureUserManagement'));
const CompletedApplications = React.lazy(() => import('@/pages/CompletedApplications'));
const RejectedApplications = React.lazy(() => import('@/pages/RejectedApplications'));

const Settings = React.lazy(() => import('@/pages/Settings'));
const ProductManagement = React.lazy(() => import('@/pages/ProductManagement'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Heavy components
const ProductionMonitor = React.lazy(() => import('@/components/Performance/ProductionMonitor'));
const SecurityCompliance = React.lazy(() => import('@/components/Security/SecurityCompliance'));
const CIATriadDashboard = React.lazy(() => import('@/components/Security/CIATriadDashboard'));

// Loading fallback component
const LoadingFallback: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  </div>
);

// Page loading fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Loading Page</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Please wait while we load the page...</p>
      </CardContent>
    </Card>
  </div>
);

// HOC for lazy loading with error boundary
const withLazyLoading = <P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>,
  fallbackText?: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<LoadingFallback text={fallbackText} />}>
      <Component {...props} ref={ref} />
    </Suspense>
  ));
};

// Export lazy-loaded components with proper loading states
export const LazyOptimizedDashboard = withLazyLoading(OptimizedDashboard, "Loading dashboard...");
export const LazyCustomerList = withLazyLoading(CustomerList, "Loading customer list...");
export const LazyCustomerNew = withLazyLoading(CustomerNew, "Loading customer form...");
export const LazyCustomerDetail = withLazyLoading(CustomerDetail, "Loading customer details...");
export const LazySecureUserManagement = withLazyLoading(SecureUserManagement, "Loading user management...");
export const LazyCompletedApplications = withLazyLoading(CompletedApplications, "Loading completed applications...");
export const LazyRejectedApplications = withLazyLoading(RejectedApplications, "Loading rejected applications...");

export const LazySettings = withLazyLoading(Settings, "Loading settings...");
export const LazyProductManagement = withLazyLoading(ProductManagement, "Loading product management...");
export const LazyNotFound = withLazyLoading(NotFound, "Loading page...");

export const LazyProductionMonitor = withLazyLoading(ProductionMonitor, "Loading performance monitor...");
export const LazySecurityCompliance = withLazyLoading(SecurityCompliance, "Loading security compliance...");
export const LazyCIATriadDashboard = withLazyLoading(CIATriadDashboard, "Loading security dashboard...");

export { LoadingFallback, PageLoadingFallback };