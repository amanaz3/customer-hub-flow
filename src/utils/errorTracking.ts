// Error tracking utility for production monitoring
interface ErrorContext {
  userId?: string;
  userRole?: string;
  page?: string;
  customerId?: string;
  action?: string;
  company?: string;
  documentType?: string;
  statusChange?: {
    from: string;
    to: string;
  };
  errorContext?: string;
  email_domain?: string;
  error?: string;
  target_role?: string;
  new_role?: string;
  deleted_user_id?: string;
  target_user_id?: string;
  customerContext?: {
    action: string;
    company: string;
  };
  [key: string]: any; // Allow any additional properties
}

class ErrorTracker {
  private errors: { message: string; context: ErrorContext; timestamp: number }[] = [];
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('🚨 Error Tracker initialized');

    // Clean up old errors periodically
    setInterval(() => {
      this.cleanupOldErrors();
    }, 300000); // Every 5 minutes
  }

  captureError(error: Error | string, context: ErrorContext = {}) {
    if (!this.isInitialized) {
      console.warn('Error Tracker not initialized');
      return;
    }

    const message = typeof error === 'string' ? error : error.message;

    const errorEntry = {
      message: message,
      context: {
        ...context,
        page: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
      },
      timestamp: Date.now()
    };

    this.errors.push(errorEntry);
    console.error('🔥 Error Captured:', message, context);

    // Send critical errors immediately
    if (this.isCriticalError(message)) {
      this.sendErrorsBatch([errorEntry]);
    }
  }

  private isCriticalError(message: string): boolean {
    const criticalErrors = [
      'Failed to fetch',
      'Uncaught (in promise)',
      'TypeError:',
      'ReferenceError:'
    ];
    return criticalErrors.some(phrase => message.includes(phrase));
  }

  private cleanupOldErrors() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.errors = this.errors.filter(error => error.timestamp > cutoff);
  }

  private async sendErrorsBatch(errors: { message: string; context: ErrorContext; timestamp: number }[]) {
    try {
      // In production, send to error tracking service
      console.log('📤 Sending error batch:', errors.length, 'errors');
      
      // For now, just log the errors
      // In production: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errors) });
    } catch (error) {
      console.error('Failed to send error batch:', error);
    }
  }

  // Data export for monitoring dashboards
  exportData() {
    return {
      errors: this.errors.slice(-500), // Last 500 errors
      summary: this.getErrorSummary(),
      timestamp: Date.now()
    };
  }

  getErrorSummary() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const recentErrors = this.errors.filter(error => error.timestamp > hourAgo);

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      topErrors: this.getTopErrors(recentErrors)
    };
  }

  getTopErrors(errors: { message: string; context: ErrorContext; timestamp: number }[], limit = 5) {
    const errorCounts = errors.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([message, count]) => ({ message, count }));
  }

  clearData() {
    this.errors = [];
    console.log('🧹 Error data cleared');
  }
}

export default new ErrorTracker();
