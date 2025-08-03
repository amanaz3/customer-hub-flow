import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LazyLoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      <p className="text-sm text-muted-foreground">Loading component...</p>
    </div>
  </div>
);

const DefaultErrorFallback = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center space-y-3">
      <div className="text-red-500">⚠️</div>
      <p className="text-sm text-muted-foreground">Failed to load component</p>
    </div>
  </div>
);

export const LazyLoadingBoundary: React.FC<LazyLoadingBoundaryProps> = ({
  children,
  fallback = <DefaultFallback />,
  errorFallback = <DefaultErrorFallback />
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};