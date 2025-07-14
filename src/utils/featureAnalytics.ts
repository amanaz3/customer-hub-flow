// Feature usage analytics for production insights
import React from 'react';

interface UserEvent {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: number;
}

interface FeatureUsage {
  feature: string;
  usage_count: number;
  unique_users: number;
  avg_session_duration: number;
  success_rate: number;
}

class FeatureAnalytics {
  private static events: UserEvent[] = [];
  private static sessionStart = Date.now();
  
  // Track feature usage
  static trackFeature(feature: string, properties?: Record<string, any>, userId?: string) {
    const event: UserEvent = {
      eventName: `feature_used_${feature}`,
      properties: {
        ...properties,
        session_duration: Date.now() - this.sessionStart,
        page_url: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      },
      userId,
      timestamp: Date.now()
    };

    this.events.push(event);
    console.log('Feature tracked:', feature, properties);

    // In production, send to PostHog/Amplitude:
    /*
    if (window.posthog) {
      window.posthog.capture(event.eventName, event.properties);
    }
    */
  }

  // Track user actions with context
  static trackUserAction(action: string, context?: {
    customerId?: string;
    documentType?: string;
    statusChange?: { from: string; to: string };
    errorContext?: string;
  }, userId?: string) {
    this.trackFeature('user_action', {
      action,
      ...context,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Track business metrics
  static trackBusinessMetric(metric: string, value: number, metadata?: Record<string, any>) {
    this.trackFeature('business_metric', {
      metric,
      value,
      ...metadata
    });
  }

  // Track performance-related events
  static trackPerformance(operation: string, duration: number, success: boolean, metadata?: any) {
    this.trackFeature('performance', {
      operation,
      duration,
      success,
      ...metadata
    });
  }

  // Get usage analytics summary
  static getUsageSummary(): {
    totalEvents: number;
    uniqueFeatures: string[];
    topFeatures: Array<{ feature: string; count: number }>;
    sessionDuration: number;
    errorRate: number;
  } {
    const featureCounts: Record<string, number> = {};
    const uniqueFeatures = new Set<string>();
    let errorEvents = 0;

    this.events.forEach(event => {
      const feature = event.eventName.replace('feature_used_', '');
      uniqueFeatures.add(feature);
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      
      if (event.properties?.errorContext) {
        errorEvents++;
      }
    });

    const topFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      uniqueFeatures: Array.from(uniqueFeatures),
      topFeatures,
      sessionDuration: Date.now() - this.sessionStart,
      errorRate: this.events.length > 0 ? errorEvents / this.events.length : 0
    };
  }

  // Customer workflow analytics
  static trackCustomerWorkflow(stage: 'created' | 'documents_uploaded' | 'status_changed' | 'completed', customerId: string, metadata?: any) {
    this.trackFeature('customer_workflow', {
      stage,
      customer_id: customerId,
      workflow_step: stage,
      ...metadata
    });
  }

  // Document management analytics
  static trackDocumentAction(action: 'upload' | 'view' | 'download' | 'delete', documentType: string, success: boolean, metadata?: any) {
    this.trackFeature('document_management', {
      action,
      document_type: documentType,
      success,
      ...metadata
    });
  }

  // User engagement analytics
  static trackUserEngagement(metric: 'session_start' | 'page_view' | 'action_completed' | 'feature_discovery', metadata?: any) {
    this.trackFeature('user_engagement', {
      engagement_metric: metric,
      ...metadata
    });
  }

  // A/B testing support
  static trackExperiment(experimentName: string, variant: string, outcome?: 'success' | 'failure', metadata?: any) {
    this.trackFeature('experiment', {
      experiment_name: experimentName,
      variant,
      outcome,
      ...metadata
    });
  }

  // Funnel analysis
  static trackFunnel(funnelName: string, step: string, stepIndex: number, metadata?: any) {
    this.trackFeature('funnel', {
      funnel_name: funnelName,
      step,
      step_index: stepIndex,
      ...metadata
    });
  }

  // Export data for analysis
  static exportAnalytics(): {
    events: UserEvent[];
    summary: ReturnType<typeof FeatureAnalytics.getUsageSummary>;
    recommendations: string[];
  } {
    const summary = this.getUsageSummary();
    const recommendations: string[] = [];

    // Generate insights
    if (summary.errorRate > 0.1) {
      recommendations.push('High error rate detected. Review error tracking and user experience.');
    }

    if (summary.sessionDuration < 60000) {
      recommendations.push('Short session duration. Consider improving user onboarding.');
    }

    if (summary.topFeatures.length < 3) {
      recommendations.push('Low feature adoption. Consider improving feature discoverability.');
    }

    return {
      events: this.events,
      summary,
      recommendations
    };
  }

  // Clear analytics data (for privacy compliance)
  static clearData() {
    this.events = [];
    this.sessionStart = Date.now();
  }

  // Initialize analytics
  static init(userId?: string) {
    // In production, initialize PostHog/Amplitude:
    /*
    if (typeof window !== 'undefined') {
      // PostHog initialization
      posthog.init('YOUR_POSTHOG_KEY', {
        api_host: 'https://app.posthog.com',
        person_profiles: 'identified_only'
      });
      
      if (userId) {
        posthog.identify(userId);
      }
    }
    */
    
    this.trackUserEngagement('session_start');
  }
}

// React hook for feature analytics
export const useFeatureAnalytics = (featureName: string, userId?: string) => {
  React.useEffect(() => {
    FeatureAnalytics.trackFeature(`${featureName}_mounted`, {}, userId);
    
    return () => {
      FeatureAnalytics.trackFeature(`${featureName}_unmounted`, {}, userId);
    };
  }, [featureName, userId]);

  const trackAction = (action: string, properties?: Record<string, any>) => {
    FeatureAnalytics.trackUserAction(`${featureName}_${action}`, properties, userId);
  };

  const trackMetric = (metric: string, value: number) => {
    FeatureAnalytics.trackBusinessMetric(`${featureName}_${metric}`, value);
  };

  return { trackAction, trackMetric };
};

export default FeatureAnalytics;