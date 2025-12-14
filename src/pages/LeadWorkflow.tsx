import React from 'react';
import { cn } from '@/lib/utils';
import LeadWorkflowStepper from '@/components/Lead/LeadWorkflowStepper';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeadWorkflow = () => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/legacy')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Lead Workflow</h1>
          <p className="text-muted-foreground">Manage leads from import to customer conversion</p>
        </div>
      </div>

      <LeadWorkflowStepper />
    </div>
  );
};

export default LeadWorkflow;
