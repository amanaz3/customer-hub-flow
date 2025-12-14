import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Users, ArrowRight, Upload, Target, Heart, FileText, UserCheck } from 'lucide-react';
import { useBulkLeadWorkflow } from '@/hooks/useLeadWorkflowSteps';
import { Lead } from '@/types/lead';

interface BulkLeadWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onComplete?: () => void;
}

const WORKFLOW_STEPS = [
  { key: 'import', name: 'Import', icon: Upload },
  { key: 'qualify', name: 'Qualify', icon: Target },
  { key: 'nurture', name: 'Nurture', icon: Heart },
  { key: 'propose', name: 'Propose', icon: FileText },
  { key: 'convert', name: 'Convert', icon: UserCheck },
];

const BulkLeadWorkflowDialog: React.FC<BulkLeadWorkflowDialogProps> = ({
  open,
  onOpenChange,
  leads,
  onComplete,
}) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [targetStep, setTargetStep] = useState<string>('qualify');
  const { bulkMoveLeads, processing } = useBulkLeadWorkflow();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleToggleLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkMove = async () => {
    if (selectedLeads.length === 0) return;
    await bulkMoveLeads(selectedLeads, targetStep);
    onComplete?.();
    onOpenChange(false);
  };

  const getScoreBadge = (score: string | null) => {
    switch (score) {
      case 'hot': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Hot</Badge>;
      case 'warm': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Warm</Badge>;
      case 'cold': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Cold</Badge>;
      default: return <Badge variant="outline">Unscored</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk Move Leads
          </DialogTitle>
          <DialogDescription>
            Select leads to move through the workflow together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target Step Selection */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <Label className="whitespace-nowrap">Move to:</Label>
            <Select value={targetStep} onValueChange={setTargetStep}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STEPS.map((step) => (
                  <SelectItem key={step.key} value={step.key}>
                    <div className="flex items-center gap-2">
                      <step.icon className="h-4 w-4" />
                      {step.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {selectedLeads.length} leads selected
            </span>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-2 px-2">
            <Checkbox 
              id="select-all"
              checked={selectedLeads.length === leads.length && leads.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All ({leads.length} leads)
            </Label>
          </div>

          {/* Lead List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads available
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
                      selectedLeads.includes(lead.id) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => handleToggleLead(lead.id)}
                  >
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleToggleLead(lead.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company || 'No company'}
                      </p>
                    </div>
                    {getScoreBadge(lead.score)}
                    <Badge variant="outline" className="text-xs">
                      {lead.status || 'new'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkMove}
            disabled={selectedLeads.length === 0 || processing}
          >
            {processing ? 'Processing...' : `Move ${selectedLeads.length} Leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadWorkflowDialog;
