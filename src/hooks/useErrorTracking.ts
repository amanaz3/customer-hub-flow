import { useCallback, useEffect } from 'react';
import { logService } from '@/services/logService';
import ErrorTracker from '@/utils/errorTracking';
import { logger } from '@/utils/logger';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  customerId?: string;
  page?: string;
  [key: string]: any;
}

export const useErrorTracking = () => {
  // Initialize error tracking on mount
  useEffect(() => {
    ErrorTracker.init();
  }, []);

  // Comprehensive error handler
  const trackError = useCallback(async (
    error: Error | string,
    context: ErrorContext = {}
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Enhanced context with additional data
    const enhancedContext = {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 200),
      timestamp: Date.now(),
      sessionId: getSessionId(),
    };

    try {
      // Track with existing error tracker
      ErrorTracker.captureError(error, enhancedContext);
      
      // Log with enhanced logger service
      await logService.logError(errorMessage, error instanceof Error ? error : undefined, enhancedContext);
      
      // Log with existing logger
      await logger.error(errorMessage, context.component, error instanceof Error ? error : undefined);
      
      console.error('🚨 Comprehensive Error Tracking:', {
        message: errorMessage,
        stack: stackTrace,
        context: enhancedContext
      });
    } catch (trackingError) {
      // Fallback if tracking fails
      console.error('Error tracking failed:', trackingError);
      console.error('Original error:', error);
    }
  }, []);

  // Track API errors specifically
  const trackApiError = useCallback(async (
    endpoint: string,
    method: string,
    statusCode: number,
    errorMessage: string,
    context: ErrorContext = {}
  ) => {
    await trackError(new Error(`API Error: ${method} ${endpoint} - ${statusCode} ${errorMessage}`), {
      ...context,
      type: 'api_error',
      endpoint,
      method,
      statusCode,
      component: context.component || 'api'
    });
  }, [trackError]);

  // Track user action errors
  const trackUserActionError = useCallback(async (
    action: string,
    error: Error | string,
    context: ErrorContext = {}
  ) => {
    await trackError(error, {
      ...context,
      type: 'user_action_error',
      action,
      component: context.component || 'user_action'
    });
  }, [trackError]);

  // Track performance issues
  const trackPerformanceIssue = useCallback(async (
    metric: string,
    value: number,
    threshold: number,
    context: ErrorContext = {}
  ) => {
    if (value > threshold) {
      await trackError(`Performance Issue: ${metric} took ${value}ms (threshold: ${threshold}ms)`, {
        ...context,
        type: 'performance_issue',
        metric,
        value,
        threshold,
        component: context.component || 'performance'
      });
    }
  }, [trackError]);

  // Track authentication errors
  const trackAuthError = useCallback(async (
    errorType: string,
    error: Error | string,
    context: ErrorContext = {}
  ) => {
    await trackError(error, {
      ...context,
      type: 'auth_error',
      errorType,
      component: context.component || 'auth'
    });
  }, [trackError]);

  // Track file upload errors
  const trackFileUploadError = useCallback(async (
    fileName: string,
    fileSize: number,
    error: Error | string,
    context: ErrorContext = {}
  ) => {
    await trackError(error, {
      ...context,
      type: 'file_upload_error',
      fileName,
      fileSize,
      component: context.component || 'file_upload'
    });
  }, [trackError]);

  // Track database errors
  const trackDatabaseError = useCallback(async (
    operation: string,
    table: string,
    error: Error | string,
    context: ErrorContext = {}
  ) => {
    await trackError(error, {
      ...context,
      type: 'database_error',
      operation,
      table,
      component: context.component || 'database'
    });
  }, [trackError]);

  return {
    trackError,
    trackApiError,
    trackUserActionError,
    trackPerformanceIssue,
    trackAuthError,
    trackFileUploadError,
    trackDatabaseError
  };
};

// Helper function to get session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('error-tracking-session');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error-tracking-session', sessionId);
  }
  return sessionId;
}

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // Enhanced window error handler
  window.addEventListener('error', (event) => {
    logService.logError(
      `Uncaught Error: ${event.error?.message || event.message}`,
      event.error,
      {
        component: 'window',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'uncaught_error'
      }
    );
  });

  // Enhanced promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logService.logError(
      `Unhandled Promise Rejection: ${error.message}`,
      error,
      {
        component: 'promise',
        type: 'unhandled_rejection'
      }
    );
  });

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const element = event.target as HTMLElement;
      logService.logError(
        `Resource loading error: ${element.tagName} - ${(element as any).src || (element as any).href}`,
        undefined,
        {
          component: 'resource_loader',
          type: 'resource_error',
          tagName: element.tagName,
          src: (element as any).src || (element as any).href
        }
      );
    }
  }, true);
};