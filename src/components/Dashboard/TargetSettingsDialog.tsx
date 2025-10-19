import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface TargetSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTargets?: {
    target_applications: number;
    target_completed: number;
    target_revenue: number;
  };
  onSave: (targets: {
    target_applications: number;
    target_completed: number;
    target_revenue: number;
  }) => void;
  isLoading?: boolean;
}

export const TargetSettingsDialog = ({
  open,
  onOpenChange,
  currentTargets,
  onSave,
  isLoading,
}: TargetSettingsDialogProps) => {
  const [applications, setApplications] = useState(currentTargets?.target_applications || 0);
  const [completed, setCompleted] = useState(currentTargets?.target_completed || 0);
  const [revenue, setRevenue] = useState(currentTargets?.target_revenue || 0);

  const handleSave = () => {
    onSave({
      target_applications: applications,
      target_completed: completed,
      target_revenue: revenue,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Set Monthly Targets
          </DialogTitle>
          <DialogDescription>
            Define your goals for this month. These targets will help track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="target-applications">
              Total Applications Target
            </Label>
            <Input
              id="target-applications"
              type="number"
              min="0"
              value={applications}
              onChange={(e) => setApplications(parseInt(e.target.value) || 0)}
              placeholder="e.g., 20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target-completed">
              Completed Applications Target
            </Label>
            <Input
              id="target-completed"
              type="number"
              min="0"
              value={completed}
              onChange={(e) => setCompleted(parseInt(e.target.value) || 0)}
              placeholder="e.g., 15"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target-revenue">
              Revenue Target (AED)
            </Label>
            <Input
              id="target-revenue"
              type="number"
              min="0"
              step="100"
              value={revenue}
              onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 50000"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Targets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
