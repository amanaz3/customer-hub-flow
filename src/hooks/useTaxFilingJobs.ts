import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxFilingJob {
  id: string;
  reference_number: string;
  customer_id: string | null;
  filing_period_type: 'quarterly' | 'monthly_internal';
  tax_year: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'queued' | 'processing' | 'awaiting_review' | 'approved' | 'submitted' | 'completed' | 'failed' | 'cancelled';
  current_task: string | null;
  workflow_state: Record<string, any>;
  current_queue: string;
  queue_history: Array<{ queue: string; timestamp: string; reason?: string }>;
  priority: 'low' | 'standard' | 'high' | 'premium' | 'urgent';
  risk_score: number | null;
  risk_category: 'low' | 'medium' | 'high' | 'critical' | null;
  anomaly_flags: string[];
  execution_mode: 'manual' | 'ai_orchestrated' | 'background';
  trigger_type: 'manual' | 'auto' | 'scheduled' | 'batch';
  assigned_to: string | null;
  worker_id: string | null;
  machine_id: string | null;
  total_revenue: number | null;
  total_expenses: number | null;
  taxable_income: number | null;
  tax_liability: number | null;
  notes: Array<{ text: string; timestamp: string; user_id?: string }>;
  audit_log: Array<{ action: string; timestamp: string; user_id?: string; details?: any }>;
  created_at: string;
  updated_at: string;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  execution_time_ms: number | null;
  retry_count: number;
  last_error: string | null;
}

export interface TaxFilingTask {
  id: string;
  job_id: string;
  task_key: string;
  task_name: string;
  task_order: number;
  task_type: 'sequential' | 'parallel';
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'skipped' | 'blocked';
  depends_on: string[] | null;
  executed_by: 'ai' | 'human' | 'system' | null;
  assigned_to: string | null;
  worker_id: string | null;
  result: Record<string, any> | null;
  output_data: Record<string, any> | null;
  confidence_score: number | null;
  requires_verification: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  notes: Array<{ text: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  execution_time_ms: number | null;
  retry_count: number;
  last_error: string | null;
}

export interface QueueConfig {
  id: string;
  queue_name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  is_paused: boolean;
  max_workers: number;
  max_batch_size: number;
  max_parallel_jobs: number;
  rate_limit_per_minute: number | null;
  cooldown_seconds: number;
  priority_weight: number;
  risk_threshold: number | null;
  auto_assign: boolean;
  auto_start: boolean;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueueWorker {
  id: string;
  worker_id: string;
  machine_id: string | null;
  queue_name: string | null;
  status: 'idle' | 'busy' | 'paused' | 'offline' | 'error';
  current_job_id: string | null;
  jobs_processed: number;
  jobs_failed: number;
  avg_processing_time_ms: number | null;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TASKS = [
  { task_key: 'check_bookkeeping', task_name: 'Check Bookkeeping', task_order: 1, executed_by: 'system' as const },
  { task_key: 'run_bookkeeping', task_name: 'Run Bookkeeping', task_order: 2, executed_by: 'ai' as const },
  { task_key: 'verify_inputs', task_name: 'Verify Inputs', task_order: 3, executed_by: 'ai' as const },
  { task_key: 'anomaly_detection', task_name: 'Anomaly Detection', task_order: 4, executed_by: 'ai' as const },
  { task_key: 'tax_computation', task_name: 'Tax Computation', task_order: 5, executed_by: 'ai' as const },
  { task_key: 'prefill_verification', task_name: 'Prefill Verification Checklist', task_order: 6, executed_by: 'ai' as const },
  { task_key: 'risk_scoring', task_name: 'Risk Scoring', task_order: 7, executed_by: 'ai' as const },
  { task_key: 'human_review', task_name: 'Human Review', task_order: 8, executed_by: 'human' as const, requires_verification: true },
  { task_key: 'submission', task_name: 'Submission', task_order: 9, executed_by: 'human' as const, requires_verification: true },
];

export function useTaxFilingJobs() {
  const [jobs, setJobs] = useState<TaxFilingJob[]>([]);
  const [queues, setQueues] = useState<QueueConfig[]>([]);
  const [workers, setWorkers] = useState<QueueWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<TaxFilingJob | null>(null);
  const [jobTasks, setJobTasks] = useState<TaxFilingTask[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tax_filing_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as unknown as TaxFilingJob[]);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
    }
  }, []);

  const fetchQueues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tax_filing_queue_config')
        .select('*')
        .order('priority_weight', { ascending: false });

      if (error) throw error;
      setQueues((data || []) as unknown as QueueConfig[]);
    } catch (error: any) {
      console.error('Error fetching queues:', error);
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tax_filing_workers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkers((data || []) as unknown as QueueWorker[]);
    } catch (error: any) {
      console.error('Error fetching workers:', error);
    }
  }, []);

  const fetchJobTasks = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('tax_filing_tasks')
        .select('*')
        .eq('job_id', jobId)
        .order('task_order', { ascending: true });

      if (error) throw error;
      setJobTasks((data || []) as unknown as TaxFilingTask[]);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const createJob = useCallback(async (jobData: Partial<TaxFilingJob>) => {
    try {
      const refNumber = `TF-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data: job, error: jobError } = await supabase
        .from('tax_filing_jobs')
        .insert({
          reference_number: refNumber,
          tax_year: new Date().getFullYear(),
          period_start: jobData.period_start || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          period_end: jobData.period_end || new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
          filing_period_type: jobData.filing_period_type || 'quarterly',
          execution_mode: jobData.execution_mode || 'manual',
          priority: jobData.priority || 'standard',
          customer_id: jobData.customer_id,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create default tasks for the job
      const tasks = DEFAULT_TASKS.map(task => ({
        job_id: job.id,
        task_key: task.task_key,
        task_name: task.task_name,
        task_order: task.task_order,
        executed_by: task.executed_by,
        requires_verification: task.requires_verification || false,
      }));

      const { error: tasksError } = await supabase
        .from('tax_filing_tasks')
        .insert(tasks);

      if (tasksError) throw tasksError;

      toast.success('Job created successfully');
      await fetchJobs();
      return job;
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job: ' + error.message);
      throw error;
    }
  }, [fetchJobs]);

  const updateJob = useCallback(async (jobId: string, updates: Partial<TaxFilingJob>) => {
    try {
      const { error } = await supabase
        .from('tax_filing_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Job updated');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  }, [fetchJobs]);

  const updateQueue = useCallback(async (queueName: string, updates: Partial<QueueConfig>) => {
    try {
      const { error } = await supabase
        .from('tax_filing_queue_config')
        .update(updates)
        .eq('queue_name', queueName);

      if (error) throw error;
      toast.success('Queue updated');
      await fetchQueues();
    } catch (error: any) {
      console.error('Error updating queue:', error);
      toast.error('Failed to update queue');
    }
  }, [fetchQueues]);

  const assignJobToQueue = useCallback(async (jobId: string, queueName: string, reason?: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const newHistory = [
        ...(job.queue_history || []),
        { queue: queueName, timestamp: new Date().toISOString(), reason }
      ];

      await updateJob(jobId, {
        current_queue: queueName,
        queue_history: newHistory,
        queued_at: new Date().toISOString(),
        status: 'queued',
      } as Partial<TaxFilingJob>);
    } catch (error: any) {
      console.error('Error assigning job to queue:', error);
    }
  }, [jobs, updateJob]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<TaxFilingTask>) => {
    try {
      const { error } = await supabase
        .from('tax_filing_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      if (selectedJob) {
        await fetchJobTasks(selectedJob.id);
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  }, [selectedJob, fetchJobTasks]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchQueues(), fetchWorkers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchJobs, fetchQueues, fetchWorkers]);

  useEffect(() => {
    if (selectedJob) {
      fetchJobTasks(selectedJob.id);
    }
  }, [selectedJob, fetchJobTasks]);

  // Queue statistics
  const getQueueStats = useCallback((queueName: string) => {
    const queueJobs = jobs.filter(j => j.current_queue === queueName);
    return {
      total: queueJobs.length,
      pending: queueJobs.filter(j => j.status === 'pending' || j.status === 'queued').length,
      processing: queueJobs.filter(j => j.status === 'processing').length,
      awaiting_review: queueJobs.filter(j => j.status === 'awaiting_review').length,
      completed: queueJobs.filter(j => j.status === 'completed').length,
      failed: queueJobs.filter(j => j.status === 'failed').length,
    };
  }, [jobs]);

  return {
    jobs,
    queues,
    workers,
    loading,
    selectedJob,
    setSelectedJob,
    jobTasks,
    fetchJobs,
    fetchQueues,
    fetchWorkers,
    fetchJobTasks,
    createJob,
    updateJob,
    updateQueue,
    assignJobToQueue,
    updateTask,
    getQueueStats,
  };
}
