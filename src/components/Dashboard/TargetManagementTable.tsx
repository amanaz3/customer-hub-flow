import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X } from "lucide-react";
import { UserTargetSummary } from "@/services/targetManagementService";
import { useToast } from "@/hooks/use-toast";
import { targetService } from "@/services/targetService";

interface TargetManagementTableProps {
  data: UserTargetSummary[];
  period: 'monthly' | 'quarterly' | 'half-yearly' | 'annual';
  periodValue: number;
  year: number;
  onRefresh: () => void;
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export const TargetManagementTable = ({
  data,
  period,
  periodValue,
  year,
  onRefresh,
  selectedUserIds,
  onSelectionChange,
}: TargetManagementTableProps) => {
  const { toast } = useToast();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    target_applications: 0,
    target_completed: 0,
    target_revenue: 0,
  });

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (percentage >= 50) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const handleEdit = (user: UserTargetSummary) => {
    setEditingUserId(user.user_id);
    setEditValues({
      target_applications: user.target_applications,
      target_completed: user.target_completed,
      target_revenue: user.target_revenue,
    });
  };

  const handleSave = async (userId: string) => {
    if (period !== 'monthly') {
      toast({
        title: "Info",
        description: "Direct editing is only available for monthly targets. For other periods, set monthly targets first.",
        variant: "default",
      });
      setEditingUserId(null);
      return;
    }

    try {
      await targetService.setMonthlyTarget(userId, periodValue, year, editValues);
      toast({
        title: "Success",
        description: "Target updated successfully",
      });
      setEditingUserId(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        title: "Error",
        description: "Failed to update target",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(user => user.user_id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUserIds, userId]);
    } else {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="w-[50px]">
              <Checkbox
                checked={selectedUserIds.length === data.length && data.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead rowSpan={2} className="min-w-[180px]">User</TableHead>
            <TableHead colSpan={2} className="text-center border-l bg-muted/30">Applications</TableHead>
            <TableHead colSpan={2} className="text-center border-l bg-muted/30">Completed</TableHead>
            <TableHead colSpan={2} className="text-center border-l bg-muted/30">Revenue</TableHead>
            <TableHead rowSpan={2} className="text-center border-l">Progress</TableHead>
            <TableHead rowSpan={2} className="text-center border-l">Actions</TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="text-right bg-primary/5 border-l">Target</TableHead>
            <TableHead className="text-right bg-secondary/10">Actual</TableHead>
            <TableHead className="text-right bg-primary/5 border-l">Target</TableHead>
            <TableHead className="text-right bg-secondary/10">Actual</TableHead>
            <TableHead className="text-right bg-primary/5 border-l">Target</TableHead>
            <TableHead className="text-right bg-secondary/10">Actual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => {
            const isEditing = editingUserId === user.user_id;

            return (
              <TableRow key={user.user_id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUserIds.includes(user.user_id)}
                    onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium sticky left-0 bg-background">
                  <div>
                    <div>{user.user_name}</div>
                    <div className="text-xs text-muted-foreground">{user.user_email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right bg-primary/5 border-l">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues.target_applications}
                      onChange={(e) =>
                        setEditValues({ ...editValues, target_applications: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 h-8 text-right"
                    />
                  ) : (
                    user.target_applications
                  )}
                </TableCell>
                <TableCell className="text-right bg-secondary/10">
                  <span className={user.actual_applications >= user.target_applications ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                    {user.actual_applications}
                  </span>
                </TableCell>
                <TableCell className="text-right bg-primary/5 border-l">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues.target_completed}
                      onChange={(e) =>
                        setEditValues({ ...editValues, target_completed: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 h-8 text-right"
                    />
                  ) : (
                    user.target_completed
                  )}
                </TableCell>
                <TableCell className="text-right bg-secondary/10">
                  <span className={user.actual_completed >= user.target_completed ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                    {user.actual_completed}
                  </span>
                </TableCell>
                <TableCell className="text-right bg-primary/5 border-l">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editValues.target_revenue}
                      onChange={(e) =>
                        setEditValues({ ...editValues, target_revenue: parseFloat(e.target.value) || 0 })
                      }
                      className="w-24 h-8 text-right"
                    />
                  ) : (
                    formatCurrency(user.target_revenue)
                  )}
                </TableCell>
                <TableCell className="text-right bg-secondary/10">
                  <span className={user.actual_revenue >= user.target_revenue ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                    {formatCurrency(user.actual_revenue)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={getStatusColor(user.progress_percentage)}>
                    {user.progress_percentage.toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleSave(user.user_id)} className="h-7 w-7">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(user)}
                      className="h-7 w-7"
                      disabled={period !== 'monthly'}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
