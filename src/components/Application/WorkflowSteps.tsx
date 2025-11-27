import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useWorkflowSteps } from '@/hooks/useWorkflowSteps';
import { useAuth } from '@/contexts/SecureAuthContext';

interface WorkflowStepsProps {
  applicationId: string;
}

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  blocked: AlertCircle,
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  blocked: 'bg-destructive/10 text-destructive',
};

export const WorkflowSteps = ({ applicationId }: WorkflowStepsProps) => {
  const { steps, loading, updating, updateStepStatus } = useWorkflowSteps(applicationId);
  const { isAdmin } = useAuth();
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'in_progress' | 'completed' | 'blocked'>('pending');

  const handleUpdateStep = async (stepId: string) => {
    await updateStepStatus(stepId, newStatus, notes);
    setEditingStep(null);
    setNotes('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No workflow steps have been configured for this application yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Workflow Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const StatusIcon = statusIcons[step.status as keyof typeof statusIcons];
          const isEditing = editingStep === step.id;

          return (
            <div
              key={step.id}
              className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <StatusIcon className={`h-5 w-5 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'blocked' ? 'text-destructive' :
                      step.status === 'in_progress' ? 'text-primary' :
                      'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                      <Badge variant="outline" className={statusColors[step.status as keyof typeof statusColors]}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{step.step_name}</h4>
                    {step.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {step.notes}
                      </p>
                    )}
                    {step.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(step.completed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditing && !isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingStep(step.id);
                      setNewStatus(step.status as any);
                      setNotes(step.notes || '');
                    }}
                    disabled={updating}
                  >
                    Update
                  </Button>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this step..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStep(step.id)}
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingStep(null);
                        setNotes('');
                      }}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
