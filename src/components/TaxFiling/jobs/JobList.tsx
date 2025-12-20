import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCcw,
  FileText,
  Loader2
} from 'lucide-react';
import { JobCard } from './JobCard';
import { TaxFilingJob } from '@/hooks/useTaxFilingJobs';

interface JobListProps {
  jobs: TaxFilingJob[];
  loading: boolean;
  selectedJob: TaxFilingJob | null;
  onSelectJob: (job: TaxFilingJob) => void;
  onCreateJob: () => void;
  onRefresh: () => void;
}

export function JobList({ 
  jobs, 
  loading, 
  selectedJob, 
  onSelectJob, 
  onCreateJob,
  onRefresh 
}: JobListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [queueFilter, setQueueFilter] = useState<string>('all');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !search || 
      job.reference_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesQueue = queueFilter === 'all' || job.current_queue === queueFilter;
    return matchesSearch && matchesStatus && matchesQueue;
  });

  const statuses = ['pending', 'queued', 'processing', 'awaiting_review', 'approved', 'submitted', 'completed', 'failed'];
  const queues = [...new Set(jobs.map(j => j.current_queue))];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Tax Filing Jobs
            <Badge variant="secondary">{filteredJobs.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={onCreateJob} className="gap-2">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={queueFilter} onValueChange={setQueueFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Queue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queues</SelectItem>
              {queues.map(q => (
                <SelectItem key={q} value={q} className="capitalize">
                  {q.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No Jobs Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {jobs.length === 0 
                ? "Create your first tax filing job to get started"
                : "No jobs match your filters"
              }
            </p>
            {jobs.length === 0 && (
              <Button onClick={onCreateJob} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Job
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  onClick={() => onSelectJob(job)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
