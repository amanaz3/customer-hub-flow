import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSelector } from './UserSelector';
import { Customer } from '@/types/customer';
import { 
  Users, 
  ArrowRight, 
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReassignBulkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onReassign: (customerId: string[], newUserId: string, reason: string) => Promise<void>;
}

export const ReassignBulkDialog: React.FC<ReassignBulkDialogProps> = ({
  isOpen,
  onClose,
  selectedCustomers,
  onReassign
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('');
      setReason('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleReassign = async () => {
    if (!selectedUserId || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a user and provide a reason for reassignment.",
        variant: "destructive"
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast({
        title: "No Applications Selected",
        description: "Please select applications to reassign.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const customerIds = selectedCustomers.map(c => c.id);
      await onReassign(customerIds, selectedUserId, reason.trim());
      
      toast({
        title: "Applications Reassigned",
        description: `Successfully reassigned ${selectedCustomers.length} application(s).`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error reassigning applications:', error);
      toast({
        title: "Reassignment Failed",
        description: "Failed to reassign applications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group customers by current user for better preview
  const customersByCurrentUser = selectedCustomers.reduce((acc, customer) => {
    const userId = customer.user_id || 'unassigned';
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(customer);
    return acc;
  }, {} as Record<string, Customer[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            Bulk Reassign Applications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Applications Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Selected Applications ({selectedCustomers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {Object.entries(customersByCurrentUser).map(([userId, customers]) => (
                    <div key={userId} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {customers.length}
                      </Badge>
                      <span className="text-muted-foreground">
                        Currently with: {userId === 'unassigned' ? 'Unassigned' : 'User'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select">Assign to User</Label>
            <UserSelector
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Select user to assign applications to..."
              showWorkload={true}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reassignment *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why these applications are being reassigned..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be logged in the audit trail for each application.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Bulk Reassignment Warning
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                This action will reassign all {selectedCustomers.length} selected applications to the chosen user. 
                This cannot be undone automatically.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={isLoading || !selectedUserId || !reason.trim()}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Reassign {selectedCustomers.length} Application{selectedCustomers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};