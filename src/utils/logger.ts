import { supabase } from '@/lib/supabase';

export interface LogEntry {
  message: string;
  component?: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  user_email?: string;
  user_id?: string;
  stack_trace?: string;
}

class Logger {
  private static instance: Logger;
  private queue: LogEntry[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  async log(entry: LogEntry): Promise<void> {
    this.queue.push({
      level: 'info',
      ...entry,
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async error(message: string, component?: string, error?: Error): Promise<void> {
    await this.log({
      message,
      component,
      level: 'error',
      stack_trace: error?.stack,
    });
  }

  async warning(message: string, component?: string): Promise<void> {
    await this.log({
      message,
      component,
      level: 'warning',
    });
  }

  async info(message: string, component?: string): Promise<void> {
    await this.log({
      message,
      component,
      level: 'info',
    });
  }

  async debug(message: string, component?: string): Promise<void> {
    await this.log({
      message,
      component,
      level: 'debug',
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process logs in batches
      const batch = this.queue.splice(0, 10);
      
      // Get current user info if available
      const { data: { user } } = await supabase.auth.getUser();
      
      const logsToInsert = batch.map(entry => ({
        ...entry,
        user_id: entry.user_id || user?.id,
        user_email: entry.user_email || user?.email,
      }));

      const { error } = await supabase
        .from('logs')
        .insert(logsToInsert);

      if (error) {
        console.error('Failed to insert logs:', error);
        // Re-add failed logs to the beginning of the queue
        this.queue.unshift(...batch);
      }
    } catch (error) {
      console.error('Error processing log queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Process remaining logs
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  // Method to clear all logs (admin only)
  async clearLogs(): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      return { error };
    } catch (error) {
      return { error };
    }
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  Logger.getInstance().error(
    `Uncaught Error: ${event.error?.message || event.message}`,
    'window',
    event.error
  );
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  Logger.getInstance().error(
    `Unhandled Promise Rejection: ${event.reason}`,
    'promise',
    event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  );
});

export const logger = Logger.getInstance();