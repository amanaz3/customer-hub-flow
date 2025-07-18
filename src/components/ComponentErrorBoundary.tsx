import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallbackClassName?: string;
}

const ComponentErrorFallback: React.FC<{ 
  componentName?: string; 
  onRetry: () => void;
  className?: string;
}> = ({ componentName, onRetry, className }) => {
  return (
    <div className={className}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {componentName ? `${componentName} failed to load` : 'Component error'}
          </span>
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({ 
  children, 
  componentName,
  fallbackClassName = "p-4"
}) => {
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
  };

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={
        <ComponentErrorFallback 
          componentName={componentName}
          onRetry={handleRetry}
          className={fallbackClassName}
        />
      }
      onError={(error, errorInfo) => {
        // Log component-specific errors with context
        console.error(`Component Error (${componentName || 'Unknown'}):`, error, errorInfo);
        
        // You could send this to an error tracking service
        // ErrorTracker.logComponentError(componentName, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ComponentErrorBoundary;