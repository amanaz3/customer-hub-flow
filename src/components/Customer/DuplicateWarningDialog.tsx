import { AlertCircle, Building2, Mail, Phone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types/customer';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateCustomer: Customer | null;
  onViewExisting: () => void;
  onCreateAnyway: () => void;
}

export const DuplicateWarningDialog = ({
  open,
  onOpenChange,
  duplicateCustomer,
  onViewExisting,
  onCreateAnyway,
}: DuplicateWarningDialogProps) => {
  if (!duplicateCustomer) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>Potential Duplicate Customer Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4 pt-4">
            <p>
              A customer with similar information already exists in the system. Creating a duplicate 
              may lead to data inconsistencies and confusion.
            </p>

            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <p className="font-medium text-foreground">Existing Customer:</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium text-foreground">{duplicateCustomer.company}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{duplicateCustomer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium text-foreground">{duplicateCustomer.mobile}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Customer Name</p>
                  <p className="font-medium text-foreground">{duplicateCustomer.name}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(duplicateCustomer.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="p-3 bg-info/10 border border-info/20 rounded-md">
              <p className="text-sm text-foreground">
                <strong>Recommendation:</strong> Instead of creating a duplicate, you can view the 
                existing customer and create a new application for them.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={onViewExisting}>
            View Existing Customer
          </Button>
          <AlertDialogAction onClick={onCreateAnyway} className="bg-warning hover:bg-warning/90">
            Create Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
