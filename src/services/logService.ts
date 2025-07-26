import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface EnhancedLogEntry {
  id: string;
  message: string;
  level: string;
  component?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  stack_trace?: string | null;
  created_at: string;
  source: 'frontend' | 'backend' | 'database';
  context?: Record<string, any>;
  session_id?: string;
  error_code?: string;
  url?: string;
  user_agent?: string;
}

export interface LogFilters {
  level?: string;
  source?: string;
  timeRange?: string;
  search?: string;
  component?: string;
  user_id?: string;
}

export interface LogSummary {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: number;
  topErrors: Array<{ message: string; count: number; level: string }>;
  criticalErrors: number;
  errorTrends: Array<{ timestamp: string; count: number }>;
}

class LogService {
  private static instance: LogService;

  private constructor() {}

  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  // Enhanced error logging with context
  async logError(
    message: string, 
    error?: Error, 
    context?: Record<string, any>
  ): Promise<void> {
    const errorEntry = {
      message,
      level: 'error' as const,
      component: context?.component || 'unknown',
      stack_trace: error?.stack,
      context: JSON.stringify(context || {}),
      url: window.location.href,
      user_agent: navigator.userAgent.substring(0, 200),
      session_id: this.getSessionId(),
      error_code: context?.code
    };

    // Log to existing logger
    await logger.error(message, context?.component, error);
    
    // Log to console for debugging
    console.error('🔥 Enhanced Error Log:', {
      message,
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Get all logs with advanced filtering
  async getLogs(filters: LogFilters = {}): Promise<EnhancedLogEntry[]> {
    try {
      let query = supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.level && filters.level !== 'all') {
        query = query.eq('level', filters.level);
      }

      if (filters.component) {
        query = query.eq('component', filters.component);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.search) {
        query = query.or(`message.ilike.%${filters.search}%,component.ilike.%${filters.search}%`);
      }

      // Time range filtering
      if (filters.timeRange && filters.timeRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.timeRange) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      query = query.limit(1000);

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(log => ({
        ...log,
        source: 'frontend' as const
      })) || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  // Generate comprehensive log summary
  async getLogSummary(timeRange: string = '24h'): Promise<LogSummary> {
    try {
      const logs = await this.getLogs({ timeRange });
      
      const now = Date.now();
      const hourAgo = now - (60 * 60 * 1000);
      const recentLogs = logs.filter(log => 
        new Date(log.created_at).getTime() > hourAgo
      );

      // Group by level
      const errorsByLevel = logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by source
      const errorsBySource = logs.reduce((acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by component
      const errorsByComponent = logs.reduce((acc, log) => {
        if (log.component) {
          acc[log.component] = (acc[log.component] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Top errors
      const errorCounts = logs.reduce((acc, log) => {
        const shortMessage = log.message.substring(0, 100);
        if (!acc[shortMessage]) {
          acc[shortMessage] = { count: 0, level: log.level };
        }
        acc[shortMessage].count++;
        return acc;
      }, {} as Record<string, { count: number; level: string }>);

      const topErrors = Object.entries(errorCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([message, data]) => ({
          message,
          count: data.count,
          level: data.level
        }));

      // Critical errors (fatal and error level)
      const criticalErrors = logs.filter(log => 
        log.level === 'fatal' || log.level === 'error'
      ).length;

      // Error trends (last 24 hours, grouped by hour)
      const errorTrends: Array<{ timestamp: string; count: number }> = [];
      const last24Hours = now - (24 * 60 * 60 * 1000);
      
      for (let i = 0; i < 24; i++) {
        const hourStart = last24Hours + (i * 60 * 60 * 1000);
        const hourEnd = hourStart + (60 * 60 * 1000);
        
        const hourlyCount = logs.filter(log => {
          const logTime = new Date(log.created_at).getTime();
          return logTime >= hourStart && logTime < hourEnd;
        }).length;

        errorTrends.push({
          timestamp: new Date(hourStart).toISOString(),
          count: hourlyCount
        });
      }

      return {
        totalErrors: logs.length,
        errorsByLevel,
        errorsBySource,
        errorsByComponent,
        recentErrors: recentLogs.length,
        topErrors,
        criticalErrors,
        errorTrends
      };
    } catch (error) {
      console.error('Error generating log summary:', error);
      return {
        totalErrors: 0,
        errorsByLevel: {},
        errorsBySource: {},
        errorsByComponent: {},
        recentErrors: 0,
        topErrors: [],
        criticalErrors: 0,
        errorTrends: []
      };
    }
  }

  // Export logs in various formats
  async exportLogs(
    filters: LogFilters = {}, 
    format: 'json' | 'csv' = 'json'
  ): Promise<void> {
    try {
      const logs = await this.getLogs(filters);
      const summary = await this.getLogSummary(filters.timeRange);

      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          totalLogs: logs.length,
          filters,
          format
        },
        summary,
        logs
      };

      let blob: Blob;
      let filename: string;

      if (format === 'csv') {
        const csvContent = this.convertToCSV(logs);
        blob = new Blob([csvContent], { type: 'text/csv' });
        filename = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        filename = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw new Error('Failed to export logs');
    }
  }

  // Clear logs (admin only)
  async clearLogs(): Promise<void> {
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw new Error('Failed to clear logs');
    }
  }

  // Get unique components for filtering
  async getComponents(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('component')
        .not('component', 'is', null);

      if (error) throw error;

      const components = [...new Set(data?.map(log => log.component).filter(Boolean))];
      return components.sort();
    } catch (error) {
      console.error('Error fetching components:', error);
      return [];
    }
  }

  // Private helper methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('log-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('log-session-id', sessionId);
    }
    return sessionId;
  }

  private convertToCSV(logs: EnhancedLogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'ID', 'Timestamp', 'Level', 'Message', 'Component', 
      'Source', 'User Email', 'Stack Trace'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.created_at,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.component || '',
        log.source,
        log.user_email || '',
        log.stack_trace ? `"${log.stack_trace.replace(/"/g, '""')}"` : ''
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

export const logService = LogService.getInstance();