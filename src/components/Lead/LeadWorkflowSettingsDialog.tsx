import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Zap, Users, Clock } from 'lucide-react';
import { useWorkflowSettings } from '@/hooks/useLeadWorkflowSteps';

interface LeadWorkflowSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadWorkflowSettingsDialog: React.FC<LeadWorkflowSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { settings, loading, updateSetting } = useWorkflowSettings();
  
  // Bulk Processing Settings
  const [bulkEnabled, setBulkEnabled] = useState(true);
  const [maxBatchSize, setMaxBatchSize] = useState(50);

  // Auto Qualify Settings
  const [autoQualifyEnabled, setAutoQualifyEnabled] = useState(false);
  const [autoScore, setAutoScore] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [assignmentMethod, setAssignmentMethod] = useState('round_robin');

  // Auto Nurture Triggers
  const [autoNurtureEnabled, setAutoNurtureEnabled] = useState(false);
  const [daysNoResponseToCold, setDaysNoResponseToCold] = useState(7);
  const [autoMoveToNurture, setAutoMoveToNurture] = useState(true);

  useEffect(() => {
    if (settings.length > 0) {
      const bulkSetting = settings.find(s => s.setting_key === 'bulk_processing');
      if (bulkSetting) {
        setBulkEnabled(bulkSetting.is_enabled);
        setMaxBatchSize(bulkSetting.setting_value?.max_batch_size || 50);
      }

      const qualifySetting = settings.find(s => s.setting_key === 'auto_qualify_on_import');
      if (qualifySetting) {
        setAutoQualifyEnabled(qualifySetting.is_enabled);
        setAutoScore(qualifySetting.setting_value?.auto_score ?? true);
        setAutoAssign(qualifySetting.setting_value?.auto_assign ?? false);
        setAssignmentMethod(qualifySetting.setting_value?.assignment_method || 'round_robin');
      }

      const nurtureSetting = settings.find(s => s.setting_key === 'auto_nurture_triggers');
      if (nurtureSetting) {
        setAutoNurtureEnabled(nurtureSetting.is_enabled);
        setDaysNoResponseToCold(nurtureSetting.setting_value?.days_no_response_to_cold || 7);
        setAutoMoveToNurture(nurtureSetting.setting_value?.auto_move_to_nurture ?? true);
      }
    }
  }, [settings]);

  const handleSaveBulkSettings = () => {
    updateSetting('bulk_processing', { max_batch_size: maxBatchSize, enabled: bulkEnabled }, bulkEnabled);
  };

  const handleSaveAutoQualify = () => {
    updateSetting('auto_qualify_on_import', {
      auto_score: autoScore,
      auto_assign: autoAssign,
      assignment_method: assignmentMethod
    }, autoQualifyEnabled);
  };

  const handleSaveAutoNurture = () => {
    updateSetting('auto_nurture_triggers', {
      days_no_response_to_cold: daysNoResponseToCold,
      auto_move_to_nurture: autoMoveToNurture
    }, autoNurtureEnabled);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Workflow Settings
          </DialogTitle>
          <DialogDescription>
            Configure bulk processing and automated workflow triggers
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bulk Processing
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto Triggers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Bulk Lead Processing
                </CardTitle>
                <CardDescription>
                  Move multiple leads through workflow steps at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulk-enabled">Enable Bulk Processing</Label>
                  <Switch
                    id="bulk-enabled"
                    checked={bulkEnabled}
                    onCheckedChange={setBulkEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-batch">Maximum Batch Size</Label>
                  <Input
                    id="max-batch"
                    type="number"
                    min={1}
                    max={200}
                    value={maxBatchSize}
                    onChange={(e) => setMaxBatchSize(parseInt(e.target.value) || 50)}
                    disabled={!bulkEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of leads to process in a single batch operation
                  </p>
                </div>

                <Button onClick={handleSaveBulkSettings} className="w-full">
                  Save Bulk Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Auto-Qualify on Import
                </CardTitle>
                <CardDescription>
                  Automatically score and assign leads when imported
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-qualify-enabled">Enable Auto-Qualify</Label>
                  <Switch
                    id="auto-qualify-enabled"
                    checked={autoQualifyEnabled}
                    onCheckedChange={setAutoQualifyEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-score">Auto-Score (Hot/Warm/Cold)</Label>
                  <Switch
                    id="auto-score"
                    checked={autoScore}
                    onCheckedChange={setAutoScore}
                    disabled={!autoQualifyEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-assign">Auto-Assign to Agent</Label>
                  <Switch
                    id="auto-assign"
                    checked={autoAssign}
                    onCheckedChange={setAutoAssign}
                    disabled={!autoQualifyEnabled}
                  />
                </div>

                {autoAssign && (
                  <div className="space-y-2">
                    <Label>Assignment Method</Label>
                    <Select value={assignmentMethod} onValueChange={setAssignmentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="load_balanced">Load Balanced</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleSaveAutoQualify} className="w-full">
                  Save Auto-Qualify Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Auto-Nurture Triggers
                </CardTitle>
                <CardDescription>
                  Automatically move leads based on time conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-nurture-enabled">Enable Auto-Nurture</Label>
                  <Switch
                    id="auto-nurture-enabled"
                    checked={autoNurtureEnabled}
                    onCheckedChange={setAutoNurtureEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days-cold">Days Without Response → Mark Cold</Label>
                  <Input
                    id="days-cold"
                    type="number"
                    min={1}
                    max={30}
                    value={daysNoResponseToCold}
                    onChange={(e) => setDaysNoResponseToCold(parseInt(e.target.value) || 7)}
                    disabled={!autoNurtureEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-move-nurture">Auto-Move to Nurture After Qualify</Label>
                  <Switch
                    id="auto-move-nurture"
                    checked={autoMoveToNurture}
                    onCheckedChange={setAutoMoveToNurture}
                    disabled={!autoNurtureEnabled}
                  />
                </div>

                <Button onClick={handleSaveAutoNurture} className="w-full">
                  Save Auto-Nurture Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadWorkflowSettingsDialog;
