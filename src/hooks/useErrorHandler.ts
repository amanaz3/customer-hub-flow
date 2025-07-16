
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface ErrorInfo {
  message: string;
  code?: string;
  context?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);

    let errorInfo: ErrorInfo = {
      message: 'An unexpected error occurred',
      context
    };

    if (error instanceof Error) {
      errorInfo.message = error.message;
      
      // Extract error code if available
      if ('code' in error) {
        errorInfo.code = error.code as string;
      }
    } else if (typeof error === 'string') {
      errorInfo.message = error;
    }

    // Show user-friendly error messages
    const userMessage = getUserFriendlyMessage(errorInfo);
    
    toast({
      title: "Error",
      description: userMessage,
      variant: "destructive",
    });

    return errorInfo;
  }, [toast]);

  const getUserFriendlyMessage = (errorInfo: ErrorInfo): string => {
    const { message, code } = errorInfo;

    // Map technical errors to user-friendly messages
    if (code === 'AUTH_FAILED' || message.includes('authentication')) {
      return 'Authentication failed. Please contact support to resolve this issue.';
    }

    if (code === 'NETWORK_ERROR' || message.includes('network')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    if (code === 'FOLDER_CREATION_FAILED') {
      return 'Failed to create folder. Please try again or contact support.';
    }

    if (code === 'UPLOAD_FAILED') {
      return 'File upload failed. Please check your file and try again.';
    }

    if (message.includes('File size exceeds')) {
      return message; // File size errors are already user-friendly
    }

    if (message.includes('File type not supported')) {
      return message; // File type errors are already user-friendly
    }

    if (message.includes('quota') || message.includes('storage')) {
      return 'Storage limit exceeded. Please contact support to increase your storage quota.';
    }

    // Return the original message if it's already user-friendly
    if (message.length < 100 && !message.includes('Error:') && !message.includes('Failed to')) {
      return message;
    }

    // Default fallback
    return 'An error occurred. Please try again or contact support if the problem persists.';
  };

  return { handleError };
};
