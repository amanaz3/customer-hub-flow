import React, { useState, useCallback, useEffect } from 'react';

// Standardized loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const createInitialLoadingState = (): LoadingState => ({
  isLoading: false,
  error: null,
  lastUpdated: null
});

// Hook for consistent loading state management
export const useLoadingState = (initialLoading: boolean = false) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    lastUpdated: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error // Clear error when starting new operation
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      lastUpdated: error ? null : new Date()
    }));
  }, []);

  const setSuccess = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastUpdated: new Date()
    });
  }, []);

  const reset = useCallback(() => {
    setState(createInitialLoadingState());
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset
  };
};

// Async operation wrapper with loading state
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: {
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    initialLoading?: boolean;
  } = {}
) => {
  const loadingState = useLoadingState(options.initialLoading);

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      loadingState.setLoading(true);
      const result = await operation(...args);
      loadingState.setSuccess();
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      loadingState.setError(errorMessage);
      options.onError?.(error as Error);
      return null;
    }
  }, [operation, loadingState, options]);

  return {
    ...loadingState,
    execute
  };
};

// Hook for data fetching with loading state
export const useDataFetching = <T>(
  fetchFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const loadingState = useLoadingState(true);

  const refetch = useCallback(async () => {
    try {
      loadingState.setLoading(true);
      const result = await fetchFunction();
      setData(result);
      loadingState.setSuccess();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      loadingState.setError(errorMessage);
      return null;
    }
  }, [fetchFunction, loadingState]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    refetch();
  }, dependencies);

  return {
    data,
    ...loadingState,
    refetch
  };
};

export default useLoadingState;