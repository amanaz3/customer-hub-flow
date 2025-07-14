// Performance monitoring utilities for production
import React from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static observers: Map<string, PerformanceObserver> = new Map();

  static init() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor custom performance marks
    this.observeUserTiming();
    
    // Monitor resource loading
    this.observeResourceTiming();
  }

  private static observeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordMetric('CLS', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  private static observeUserTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric(entry.name, entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
      this.observers.set('timing', observer);
    }
  }

  private static observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resource.duration > 1000) {
            this.recordMetric(`slow-resource-${resource.name}`, resource.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    }
  }

  static startTiming(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  static endTiming(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }

  static recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Send to monitoring service in production
    console.log(`Performance Metric: ${name} = ${value.toFixed(2)}ms`);
    
    // In production, send to DataDog/New Relic:
    /*
    if (window.DD_RUM) {
      window.DD_RUM.addTiming(name, value);
    }
    */
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static trackPageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Track page load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('page-load-time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('ttfb', navigation.responseStart - navigation.fetchStart);
        this.recordMetric('dom-interactive', navigation.domInteractive - navigation.fetchStart);
      }
    });
  }

  static trackUserAction(action: string, duration?: number) {
    const timestamp = Date.now();
    const metric = duration || 0;
    
    this.recordMetric(`user-action-${action}`, metric);
    
    // Add context for debugging
    console.log(`User Action: ${action} at ${new Date(timestamp).toISOString()}`);
  }

  static getPerformanceReport(): {
    metrics: Record<string, number>;
    recommendations: string[];
    score: number;
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];
    let score = 100;

    // Analyze metrics and provide recommendations
    if (metrics['page-load-time'] > 3000) {
      recommendations.push('Page load time is slow (>3s). Consider code splitting.');
      score -= 20;
    }

    if (metrics['LCP'] > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Optimize images and critical resources.');
      score -= 15;
    }

    if (metrics['CLS'] > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Fix layout stability issues.');
      score -= 15;
    }

    if (metrics['FCP'] > 1800) {
      recommendations.push('First Contentful Paint is slow. Optimize CSS and fonts.');
      score -= 10;
    }

    return {
      metrics,
      recommendations,
      score: Math.max(0, score)
    };
  }

  static cleanup() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  React.useEffect(() => {
    PerformanceMonitor.startTiming(`component-${componentName}`);
    
    return () => {
      PerformanceMonitor.endTiming(`component-${componentName}`);
    };
  }, [componentName]);

  const trackAction = (action: string) => {
    PerformanceMonitor.trackUserAction(`${componentName}-${action}`);
  };

  return { trackAction };
};

export default PerformanceMonitor;