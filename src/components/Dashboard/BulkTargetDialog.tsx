import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { targetManagementService } from "@/services/targetManagementService";

interface BulkTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  selectedUserNames: string[];
  month: number;
  year: number;
  onSuccess: () => void;
}

export const BulkTargetDialog = ({
  open,
  onOpenChange,
  selectedUserIds,
  selectedUserNames,
  month,
  year,
  onSuccess,
}: BulkTargetDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState({
    target_applications: 0,
    target_completed: 0,
    target_revenue: 0,
  });

  const handleSubmit = async () => {
    if (targets.target_applications <= 0) {
      toast({
        title: "Invalid Input",
        description: "Target applications must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await targetManagementService.bulkSetTargets(
        selectedUserIds,
        month,
        year,
        targets
      );

      toast({
        title: "Success",
        description: `Targets set for ${selectedUserIds.length} user(s)`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error setting bulk targets:', error);
      toast({
        title: "Error",
        description: "Failed to set targets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Targets for Multiple Users</DialogTitle>
          <DialogDescription>
            Setting targets for {selectedUserIds.length} user(s): {selectedUserNames.join(', ')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="applications">Target Applications</Label>
            <Input
              id="applications"
              type="number"
              min="0"
              value={targets.target_applications}
              onChange={(e) =>
                setTargets({ ...targets, target_applications: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="completed">Target Completed</Label>
            <Input
              id="completed"
              type="number"
              min="0"
              value={targets.target_completed}
              onChange={(e) =>
                setTargets({ ...targets, target_completed: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="revenue">Target Revenue (AED)</Label>
            <Input
              id="revenue"
              type="number"
              min="0"
              value={targets.target_revenue}
              onChange={(e) =>
                setTargets({ ...targets, target_revenue: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Setting..." : "Set Targets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
