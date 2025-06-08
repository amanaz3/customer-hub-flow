
import { useEffect } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (loadTime > 100) { // Log if component takes more than 100ms to render
        console.log(`Performance: ${componentName} took ${loadTime.toFixed(2)}ms to render`);
      }
    };
  }, [componentName]);
};

export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Performance: ${operationName} completed in ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`Performance: ${operationName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};
