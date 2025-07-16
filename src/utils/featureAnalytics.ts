
// Feature Analytics for production monitoring and optimization
interface FeatureEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  data?: Record<string, any>; // Allow flexible data structure
  page?: string;
  userAgent?: string;
}

interface CustomerWorkflowEvent {
  customerId: string;
  workflowStep: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserEngagementEvent {
  engagementType: string;
  timestamp: number;
  sessionDuration?: number;
  metadata?: Record<string, any>;
}

class FeatureAnalytics {
  private events: FeatureEvent[] = [];
  private customerEvents: CustomerWorkflowEvent[] = [];
  private engagementEvents: UserEngagementEvent[] = [];
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🎯 Feature Analytics initialized');
    
    // Clean up old events periodically
    setInterval(() => {
      this.cleanupOldEvents();
    }, 300000); // Every 5 minutes
  }

  trackUserAction(eventName: string, data?: Record<string, any>, userId?: string) {
    if (!this.isInitialized) {
      console.warn('Feature Analytics not initialized');
      return;
    }

    const event: FeatureEvent = {
      eventName,
      userId,
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      data: data || {},
      page: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
    };

    this.events.push(event);
    console.log('📊 Feature Event:', eventName, data);

    // Auto-send critical events immediately
    if (this.isCriticalEvent(eventName)) {
      this.sendEventsBatch([event]);
    }
  }

  trackCustomerWorkflow(workflowStep: string, customerId: string, metadata?: Record<string, any>) {
    const event: CustomerWorkflowEvent = {
      customerId,
      workflowStep,
      timestamp: Date.now(),
      metadata: metadata || {}
    };

    this.customerEvents.push(event);
    console.log('🔄 Customer Workflow:', workflowStep, customerId);
  }

  trackUserEngagement(engagementType: string, metadata?: Record<string, any>) {
    const event: UserEngagementEvent = {
      engagementType,
      timestamp: Date.now(),
      metadata: metadata || {}
    };

    this.engagementEvents.push(event);
    console.log('👤 User Engagement:', engagementType);
  }

  // Analytics aggregation methods
  getEventsSummary() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp > hourAgo);
    
    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      topEvents: this.getTopEvents(recentEvents),
      activeUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
      customerWorkflows: this.customerEvents.length,
      engagementEvents: this.engagementEvents.length
    };
  }

  // Add the missing getUsageSummary method
  getUsageSummary() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp > hourAgo);
    const dailyEvents = this.events.filter(event => event.timestamp > dayAgo);
    
    // Calculate error rate
    const errorEvents = dailyEvents.filter(event => 
      event.eventName.includes('error') || 
      event.eventName.includes('failed') ||
      event.eventName.includes('violation')
    );
    
    const errorRate = dailyEvents.length > 0 ? errorEvents.length / dailyEvents.length : 0;
    
    // Get top features
    const featureCounts = dailyEvents.reduce((acc, event) => {
      const feature = event.eventName.split('_')[0] || 'unknown';
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topFeatures = Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));
    
    // Get unique features
    const uniqueFeatures = Array.from(new Set(dailyEvents.map(event => 
      event.eventName.split('_')[0] || 'unknown'
    )));
    
    // Calculate session duration (approximate)
    const sessionDuration = this.calculateSessionDuration();
    
    return {
      totalEvents: dailyEvents.length,
      recentEvents: recentEvents.length,
      errorRate,
      topFeatures,
      uniqueFeatures,
      sessionDuration,
      activeUsers: new Set(dailyEvents.map(e => e.userId).filter(Boolean)).size
    };
  }

  private calculateSessionDuration(): number {
    if (this.events.length < 2) return 0;
    
    const sortedEvents = [...this.events].sort((a, b) => a.timestamp - b.timestamp);
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    return lastEvent.timestamp - firstEvent.timestamp;
  }

  getTopEvents(events: FeatureEvent[], limit = 5) {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  // Utility methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'login_failed',
      'customer_create_failed',
      'user_creation_failed',
      'security_violation',
      'system_error'
    ];
    return criticalEvents.includes(eventName);
  }

  private cleanupOldEvents() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    this.events = this.events.filter(event => event.timestamp > cutoff);
    this.customerEvents = this.customerEvents.filter(event => event.timestamp > cutoff);
    this.engagementEvents = this.engagementEvents.filter(event => event.timestamp > cutoff);
  }

  private async sendEventsBatch(events: FeatureEvent[]) {
    try {
      // In production, send to analytics service
      console.log('📤 Sending analytics batch:', events.length, 'events');
      
      // For now, just log the events
      // In production: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(events) });
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
    }
  }

  // Data export for monitoring dashboards
  exportData() {
    return {
      events: this.events.slice(-1000), // Last 1000 events
      customerWorkflows: this.customerEvents.slice(-500),
      engagementEvents: this.engagementEvents.slice(-500),
      summary: this.getEventsSummary(),
      timestamp: Date.now()
    };
  }

  clearData() {
    this.events = [];
    this.customerEvents = [];
    this.engagementEvents = [];
    sessionStorage.removeItem('analytics_session_id');
    console.log('🧹 Analytics data cleared');
  }
}

export default new FeatureAnalytics();
