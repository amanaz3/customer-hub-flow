import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  score?: number;
  flags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, jobId, taskId, batchJobIds } = await req.json();

    console.log(`Tax Filing Orchestrator: ${action}`, { jobId, taskId, batchJobIds });

    switch (action) {
      case 'execute_task': {
        return await executeTask(supabase, jobId, taskId);
      }
      case 'run_job': {
        return await runJob(supabase, jobId);
      }
      case 'run_batch': {
        return await runBatch(supabase, batchJobIds);
      }
      case 'process_queue': {
        return await processQueue(supabase);
      }
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeTask(supabase: any, jobId: string, taskId: string): Promise<Response> {
  // Get task details
  const { data: task, error: taskError } = await supabase
    .from('tax_filing_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return new Response(
      JSON.stringify({ error: 'Task not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update task to in_progress
  await supabase
    .from('tax_filing_tasks')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', taskId);

  // Execute task based on task_key
  let result: TaskResult;
  
  try {
    switch (task.task_key) {
      case 'check_bookkeeping':
        result = await executeCheckBookkeeping(supabase, jobId);
        break;
      case 'run_bookkeeping':
        result = await executeRunBookkeeping(supabase, jobId);
        break;
      case 'verify_inputs':
        result = await executeVerifyInputs(supabase, jobId);
        break;
      case 'anomaly_detection':
        result = await executeAnomalyDetection(supabase, jobId);
        break;
      case 'tax_computation':
        result = await executeTaxComputation(supabase, jobId);
        break;
      case 'prefill_checklist':
        result = await executePrefillChecklist(supabase, jobId);
        break;
      case 'risk_scoring':
        result = await executeRiskScoring(supabase, jobId);
        break;
      case 'human_review':
        // Human review requires manual intervention
        result = { success: true, data: { requires_human: true } };
        break;
      default:
        result = { success: false, error: 'Unknown task type' };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  // Update task with result
  const newStatus = result.success ? 'completed' : 'failed';
  await supabase
    .from('tax_filing_tasks')
    .update({
      status: newStatus,
      completed_at: result.success ? new Date().toISOString() : null,
      result: result.data || null,
      error_message: result.error || null,
    })
    .eq('id', taskId);

  // Update job progress
  await updateJobProgress(supabase, jobId);

  return new Response(
    JSON.stringify({ success: true, task: task.task_key, result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runJob(supabase: any, jobId: string): Promise<Response> {
  // Get job and tasks
  const { data: job } = await supabase
    .from('tax_filing_jobs')
    .select('*, tax_filing_tasks(*)')
    .eq('id', jobId)
    .single();

  if (!job) {
    return new Response(
      JSON.stringify({ error: 'Job not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update job status
  await supabase
    .from('tax_filing_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  // Get pending tasks sorted by order
  const pendingTasks = job.tax_filing_tasks
    .filter((t: any) => t.status === 'pending')
    .sort((a: any, b: any) => a.task_order - b.task_order);

  const results: any[] = [];

  for (const task of pendingTasks) {
    // Skip human_review in AI mode - it will be done separately
    if (task.task_key === 'human_review') {
      continue;
    }

    const response = await executeTask(supabase, jobId, task.id);
    const taskResult = await response.json();
    results.push(taskResult);

    // Stop if task failed
    if (!taskResult.result?.success) {
      break;
    }
  }

  // Move to human review queue if all AI tasks completed
  const { data: updatedJob } = await supabase
    .from('tax_filing_jobs')
    .select('*, tax_filing_tasks(*)')
    .eq('id', jobId)
    .single();

  const allAiTasksComplete = updatedJob.tax_filing_tasks
    .filter((t: any) => t.task_key !== 'human_review')
    .every((t: any) => t.status === 'completed');

  if (allAiTasksComplete) {
    await supabase
      .from('tax_filing_jobs')
      .update({ current_queue: 'human_review', status: 'pending_review' })
      .eq('id', jobId);
  }

  return new Response(
    JSON.stringify({ success: true, jobId, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runBatch(supabase: any, jobIds: string[]): Promise<Response> {
  const results: any[] = [];

  for (const jobId of jobIds) {
    const response = await runJob(supabase, jobId);
    const result = await response.json();
    results.push({ jobId, ...result });
  }

  return new Response(
    JSON.stringify({ success: true, batch: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processQueue(supabase: any): Promise<Response> {
  // Get jobs from AI preparation queue
  const { data: jobs } = await supabase
    .from('tax_filing_jobs')
    .select('id, priority')
    .eq('current_queue', 'ai_preparation')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(10);

  if (!jobs || jobs.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'No jobs to process' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const jobIds = jobs.map((j: any) => j.id);
  return await runBatch(supabase, jobIds);
}

async function updateJobProgress(supabase: any, jobId: string): Promise<void> {
  const { data: tasks } = await supabase
    .from('tax_filing_tasks')
    .select('status')
    .eq('job_id', jobId);

  if (!tasks) return;

  const total = tasks.length;
  const completed = tasks.filter((t: any) => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  await supabase
    .from('tax_filing_jobs')
    .update({ progress })
    .eq('id', jobId);
}

// Task execution functions
async function executeCheckBookkeeping(supabase: any, jobId: string): Promise<TaskResult> {
  // Simulate checking bookkeeping readiness
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      bookkeeping_ready: true,
      last_updated: new Date().toISOString(),
      completeness_score: 95,
    }
  };
}

async function executeRunBookkeeping(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: {
      transactions_processed: 150,
      reconciliation_status: 'complete',
    }
  };
}

async function executeVerifyInputs(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      inputs_verified: true,
      missing_documents: [],
      warnings: [],
    }
  };
}

async function executeAnomalyDetection(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const anomalies = Math.random() > 0.7 ? ['Unusual expense pattern detected'] : [];
  
  return {
    success: true,
    data: {
      anomalies_detected: anomalies.length,
      anomaly_details: anomalies,
    },
    flags: anomalies.length > 0 ? ['anomaly_detected'] : [],
  };
}

async function executeTaxComputation(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const taxableIncome = Math.floor(Math.random() * 1000000) + 100000;
  const taxRate = 0.09; // UAE corporate tax rate
  const taxDue = taxableIncome > 375000 ? (taxableIncome - 375000) * taxRate : 0;
  
  return {
    success: true,
    data: {
      taxable_income: taxableIncome,
      tax_rate: taxRate,
      tax_due: Math.round(taxDue),
      computation_date: new Date().toISOString(),
    }
  };
}

async function executePrefillChecklist(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    success: true,
    data: {
      checklist_items: [
        { item: 'Financial statements attached', status: 'complete' },
        { item: 'Supporting documents uploaded', status: 'complete' },
        { item: 'Tax computation verified', status: 'pending_review' },
        { item: 'Authorized signatory confirmed', status: 'pending' },
      ],
      prefill_complete: true,
    }
  };
}

async function executeRiskScoring(supabase: any, jobId: string): Promise<TaskResult> {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const riskScore = Math.floor(Math.random() * 100);
  const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
  
  // Update job with risk score
  await supabase
    .from('tax_filing_jobs')
    .update({ 
      risk_score: riskScore,
      anomaly_flags: riskScore > 70 ? ['high_risk'] : []
    })
    .eq('id', jobId);
  
  return {
    success: true,
    data: {
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskScore > 70 ? ['Complex transactions', 'High value adjustments'] : [],
    },
    score: riskScore,
  };
}
