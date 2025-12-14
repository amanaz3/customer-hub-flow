import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserSelector } from '@/components/Customer/UserSelector';
import { Loader2, Upload } from 'lucide-react';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCampaign: (campaign: {
    name: string;
    description?: string;
    assigned_to?: string;
    expected_completion_date?: string;
  }) => Promise<any>;
  onUploadFile?: (campaignId: string, file: File) => Promise<boolean>;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onCreateCampaign,
  onUploadFile,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      const campaign = await onCreateCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        assigned_to: assignedTo || undefined,
        expected_completion_date: expectedDate || undefined,
      });

      if (campaign && file && onUploadFile) {
        await onUploadFile(campaign.id, file);
      }

      // Reset form
      setName('');
      setDescription('');
      setAssignedTo('');
      setExpectedDate('');
      setFile(null);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Lead Campaign</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2025 Dubai Prospects"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign details and goals..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign to Agent</Label>
            <UserSelector
              value={assignedTo}
              onValueChange={setAssignedTo}
              placeholder="Select agent..."
              showWorkload
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDate">Expected Completion Date</Label>
            <Input
              id="expectedDate"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Excel File (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {file ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload Excel file
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
