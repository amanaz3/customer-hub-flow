import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Mail, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WebflowEmailTemplateConfig } from '@/hooks/useWebflowConfig';

interface EmailTemplatesTabProps {
  emailTemplates: WebflowEmailTemplateConfig[];
  onUpdate: (templates: WebflowEmailTemplateConfig[]) => Promise<boolean>;
}

const TRIGGER_EVENTS = [
  { value: 'application_submitted', label: 'Application Submitted', description: 'When customer submits application' },
  { value: 'documents_requested', label: 'Documents Requested', description: 'When additional documents are required' },
  { value: 'status_approved', label: 'Application Approved', description: 'When application is approved' },
  { value: 'status_rejected', label: 'Application Rejected', description: 'When application is rejected' },
  { value: 'manual_review', label: 'Manual Review Required', description: 'When application needs manual review' },
  { value: 'reminder_incomplete', label: 'Incomplete Reminder', description: 'Reminder for incomplete applications' },
  { value: 'payment_received', label: 'Payment Received', description: 'When payment is confirmed' },
  { value: 'welcome', label: 'Welcome Email', description: 'Welcome message after completion' },
];

const getTriggerColor = (trigger: string) => {
  switch (trigger) {
    case 'application_submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'status_approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'status_rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'manual_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'documents_requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'reminder_incomplete': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'payment_received': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    case 'welcome': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function EmailTemplatesTab({ emailTemplates, onUpdate }: EmailTemplatesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WebflowEmailTemplateConfig | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WebflowEmailTemplateConfig | null>(null);
  const [formData, setFormData] = useState<Partial<WebflowEmailTemplateConfig>>({});

  const openNewDialog = () => {
    setEditingTemplate(null);
    setFormData({
      id: `template-${Date.now()}`,
      template_code: '',
      template_name: '',
      trigger_event: 'application_submitted',
      subject: '',
      body_html: '',
      body_text: '',
      sender_name: 'Company Name',
      reply_to: null,
      is_active: true,
      delay_minutes: 0,
      conditions: {}
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: WebflowEmailTemplateConfig) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setIsDialogOpen(true);
  };

  const openPreview = (template: WebflowEmailTemplateConfig) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSave = async () => {
    if (!formData.template_code || !formData.template_name || !formData.subject) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const template: WebflowEmailTemplateConfig = {
      id: formData.id || `template-${Date.now()}`,
      template_code: formData.template_code || '',
      template_name: formData.template_name || '',
      trigger_event: formData.trigger_event as any || 'application_submitted',
      subject: formData.subject || '',
      body_html: formData.body_html || '',
      body_text: formData.body_text || '',
      sender_name: formData.sender_name || 'Company Name',
      reply_to: formData.reply_to || null,
      is_active: formData.is_active ?? true,
      delay_minutes: formData.delay_minutes || 0,
      conditions: formData.conditions || {}
    };

    let updated: WebflowEmailTemplateConfig[];
    if (editingTemplate) {
      updated = emailTemplates.map(t => t.id === editingTemplate.id ? template : t);
    } else {
      updated = [...emailTemplates, template];
    }

    const success = await onUpdate(updated);
    if (success) {
      setIsDialogOpen(false);
      toast({ title: 'Success', description: editingTemplate ? 'Template updated' : 'Template created' });
    }
  };

  const handleDelete = async (id: string) => {
    const updated = emailTemplates.filter(t => t.id !== id);
    const success = await onUpdate(updated);
    if (success) {
      toast({ title: 'Deleted', description: 'Template removed' });
    }
  };

  const handleToggle = async (id: string) => {
    const updated = emailTemplates.map(t => 
      t.id === id ? { ...t, is_active: !t.is_active } : t
    );
    await onUpdate(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>Configure automated email notifications for customer journey</CardDescription>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </CardHeader>
      <CardContent>
        {emailTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email templates configured. Click "Add Template" to create your first template.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Trigger Event</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.template_name}</div>
                      <div className="text-xs text-muted-foreground">{template.template_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTriggerColor(template.trigger_event)}>
                      {TRIGGER_EVENTS.find(t => t.value === template.trigger_event)?.label || template.trigger_event}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{template.subject}</TableCell>
                  <TableCell>
                    {template.delay_minutes > 0 ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {template.delay_minutes} min
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Immediate</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {template.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch 
                        checked={template.is_active} 
                        onCheckedChange={() => handleToggle(template.id)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Email Template'}</DialogTitle>
              <DialogDescription>Configure email content and trigger conditions</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Code *</Label>
                  <Input
                    value={formData.template_code || ''}
                    onChange={e => setFormData({ ...formData, template_code: e.target.value })}
                    placeholder="e.g., app_submitted_confirmation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.template_name || ''}
                    onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="e.g., Application Submitted Confirmation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Event</Label>
                  <Select
                    value={formData.trigger_event}
                    onValueChange={v => setFormData({ ...formData, trigger_event: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[9999]">
                      {TRIGGER_EVENTS.map(event => (
                        <SelectItem key={event.value} value={event.value}>
                          <div>
                            <div>{event.label}</div>
                            <div className="text-xs text-muted-foreground">{event.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delay (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.delay_minutes || 0}
                    onChange={e => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">0 = send immediately</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender Name</Label>
                  <Input
                    value={formData.sender_name || ''}
                    onChange={e => setFormData({ ...formData, sender_name: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reply-To Email</Label>
                  <Input
                    type="email"
                    value={formData.reply_to || ''}
                    onChange={e => setFormData({ ...formData, reply_to: e.target.value || null })}
                    placeholder="support@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Subject *</Label>
                <Input
                  value={formData.subject || ''}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Your application has been received - {{reference_number}}"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {'{{name}}'}, {'{{email}}'}, {'{{reference_number}}'}, {'{{company_name}}'}, {'{{status}}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Body (HTML)</Label>
                <Textarea
                  value={formData.body_html || ''}
                  onChange={e => setFormData({ ...formData, body_html: e.target.value })}
                  placeholder="<h1>Hello {{name}},</h1><p>Your application has been received...</p>"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Plain Text Version</Label>
                <Textarea
                  value={formData.body_text || ''}
                  onChange={e => setFormData({ ...formData, body_text: e.target.value })}
                  placeholder="Hello {{name}}, Your application has been received..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Template Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview: {previewTemplate?.template_name}</DialogTitle>
              <DialogDescription>Subject: {previewTemplate?.subject}</DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-4 bg-background max-h-[400px] overflow-auto">
              {previewTemplate?.body_html ? (
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm">{previewTemplate?.body_text}</pre>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
