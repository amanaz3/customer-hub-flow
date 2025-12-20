import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  BarChart3, 
  Settings,
  Plus
} from 'lucide-react';
import { JobList } from './jobs/JobList';
import { JobDetail } from './jobs/JobDetail';
import { QueueDashboard } from './queues/QueueDashboard';
import { AdminControlsPanel } from './admin/AdminControlsPanel';
import { useTaxFilingJobs, TaxFilingJob } from '@/hooks/useTaxFilingJobs';

export function JobQueueManager() {
  const {
    jobs,
    queues,
    workers,
    loading,
    selectedJob,
    setSelectedJob,
    jobTasks,
    fetchJobs,
    fetchQueues,
    createJob,
    updateJob,
    updateQueue,
    assignJobToQueue,
    updateTask,
    getQueueStats,
  } = useTaxFilingJobs();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newJobData, setNewJobData] = useState({
    filing_period_type: 'quarterly' as 'quarterly' | 'monthly_internal',
    execution_mode: 'manual' as 'manual' | 'ai_orchestrated' | 'background',
    priority: 'standard' as 'low' | 'standard' | 'high' | 'premium' | 'urgent',
  });

  const handleCreateJob = async () => {
    await createJob(newJobData);
    setShowCreateDialog(false);
    setNewJobData({
      filing_period_type: 'quarterly',
      execution_mode: 'manual',
      priority: 'standard',
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="queues" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Queues</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[500px]">
            <JobList
              jobs={jobs}
              loading={loading}
              selectedJob={selectedJob}
              onSelectJob={setSelectedJob}
              onCreateJob={() => setShowCreateDialog(true)}
              onRefresh={fetchJobs}
            />
            {selectedJob ? (
              <JobDetail
                job={selectedJob}
                tasks={jobTasks}
                queues={queues}
                onClose={() => setSelectedJob(null)}
                onUpdateJob={(updates) => updateJob(selectedJob.id, updates)}
                onUpdateTask={updateTask}
                onAssignQueue={(queueName) => assignJobToQueue(selectedJob.id, queueName)}
              />
            ) : (
              <div className="hidden lg:flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center p-6">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold">Select a Job</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a job from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Queues Tab */}
        <TabsContent value="queues" className="mt-4">
          <QueueDashboard
            queues={queues}
            loading={loading}
            getQueueStats={getQueueStats}
            onUpdateQueue={updateQueue}
            onRefresh={fetchQueues}
          />
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="mt-4">
          <AdminControlsPanel 
            queues={queues} 
            onRefresh={() => {
              fetchJobs();
              fetchQueues();
            }} 
          />
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tax Filing Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Filing Period Type</Label>
              <Select 
                value={newJobData.filing_period_type} 
                onValueChange={(v: 'quarterly' | 'monthly_internal') => 
                  setNewJobData(prev => ({ ...prev, filing_period_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly (UAE Corporate Tax)</SelectItem>
                  <SelectItem value="monthly_internal">Monthly Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Execution Mode</Label>
              <Select 
                value={newJobData.execution_mode} 
                onValueChange={(v: 'manual' | 'ai_orchestrated' | 'background') => 
                  setNewJobData(prev => ({ ...prev, execution_mode: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (Step-by-step)</SelectItem>
                  <SelectItem value="ai_orchestrated">AI Orchestrated</SelectItem>
                  <SelectItem value="background">Background Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={newJobData.priority} 
                onValueChange={(v: 'low' | 'standard' | 'high' | 'premium' | 'urgent') => 
                  setNewJobData(prev => ({ ...prev, priority: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
