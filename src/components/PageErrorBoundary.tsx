import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

const PageErrorFallback: React.FC<{ pageName?: string }> = ({ pageName }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Page Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              {pageName ? `The ${pageName} page` : 'This page'} encountered an error
            </p>
            <p className="text-muted-foreground">
              We're sorry for the inconvenience. The page failed to load properly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={handleRefresh} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children, pageName }) => {
  return (
    <ErrorBoundary 
      fallback={<PageErrorFallback pageName={pageName} />}
      onError={(error, errorInfo) => {
        // Log page-specific errors with context
        console.error(`Page Error (${pageName || 'Unknown'}):`, error, errorInfo);
        
        // You could send this to an error tracking service
        // ErrorTracker.logPageError(pageName, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary;