import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, FileText, Phone, CalendarIcon, CheckCircle2, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  company?: string | null;
  estimated_value?: number | null;
  product_interest_id?: string | null;
  notes?: string | null;
  reference_number: number;
}

interface LeadConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onConvert: (lead: Lead, options: ConversionOptions) => Promise<void>;
  isLoading?: boolean;
}

export interface ConversionOptions {
  // Portal Access
  grantPortalAccess: boolean;
  portalAccessMethod: 'send_invitation' | 'auto_create' | 'manual_flag';
  
  // Document Checklist
  sendDocumentChecklist: boolean;
  documentChecklistMethod: 'email' | 'portal_link' | 'manual_task';
  documentChecklistNotes: string;
  
  // Onboarding Call
  scheduleOnboardingCall: boolean;
  onboardingCallMethod: 'calendar_integration' | 'notification_only';
  onboardingCallDate: Date | undefined;
  onboardingCallNotes: string;
  
  // Services
  servicesPurchased: string[];
  
  // Additional Notes
  conversionNotes: string;
}

const defaultOptions: ConversionOptions = {
  grantPortalAccess: true,
  portalAccessMethod: 'send_invitation',
  sendDocumentChecklist: true,
  documentChecklistMethod: 'email',
  documentChecklistNotes: '',
  scheduleOnboardingCall: true,
  onboardingCallMethod: 'calendar_integration',
  onboardingCallDate: undefined,
  onboardingCallNotes: '',
  servicesPurchased: [],
  conversionNotes: '',
};

const availableServices = [
  'Company Formation',
  'Bank Account Opening',
  'Home Finance',
  'Business Finance',
  'Corporate Tax',
  'VAT Registration',
  'Bookkeeping',
  'AML Compliance',
  'PRO Services',
  'Visa Services',
];

export function LeadConversionDialog({ 
  open, 
  onOpenChange, 
  lead, 
  onConvert,
  isLoading = false 
}: LeadConversionDialogProps) {
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);

  const handleConvert = async () => {
    if (!lead) return;
    await onConvert(lead, options);
    setOptions(defaultOptions);
  };

  const toggleService = (service: string) => {
    setOptions(prev => ({
      ...prev,
      servicesPurchased: prev.servicesPurchased.includes(service)
        ? prev.servicesPurchased.filter(s => s !== service)
        : [...prev.servicesPurchased, service]
    }));
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convert Lead to Customer
          </DialogTitle>
          <DialogDescription>
            Configure onboarding workflow for {lead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Lead Summary */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Lead Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {lead.name}</div>
            <div><span className="text-muted-foreground">Company:</span> {lead.company || 'N/A'}</div>
            <div><span className="text-muted-foreground">Email:</span> {lead.email || 'N/A'}</div>
            <div><span className="text-muted-foreground">Mobile:</span> {lead.mobile || 'N/A'}</div>
            <div><span className="text-muted-foreground">Est. Value:</span> AED {lead.estimated_value?.toLocaleString() || '0'}</div>
            <div><span className="text-muted-foreground">Ref #:</span> {lead.reference_number}</div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Portal Access Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="portal-access" 
                checked={options.grantPortalAccess}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, grantPortalAccess: !!checked }))}
              />
              <Label htmlFor="portal-access" className="flex items-center gap-2 font-medium cursor-pointer">
                <Mail className="h-4 w-4 text-blue-500" />
                Grant Portal Access
              </Label>
            </div>
            
            {options.grantPortalAccess && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm text-muted-foreground">Access Method</Label>
                <Select 
                  value={options.portalAccessMethod} 
                  onValueChange={(value: 'send_invitation' | 'auto_create' | 'manual_flag') => 
                    setOptions(prev => ({ ...prev, portalAccessMethod: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_invitation">
                      📧 Send Invitation Email (customer sets password)
                    </SelectItem>
                    <SelectItem value="auto_create">
                      🔐 Auto-create Account (send credentials via email)
                    </SelectItem>
                    <SelectItem value="manual_flag">
                      🚩 Manual Flag Only (no email sent)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Document Checklist Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="doc-checklist" 
                checked={options.sendDocumentChecklist}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, sendDocumentChecklist: !!checked }))}
              />
              <Label htmlFor="doc-checklist" className="flex items-center gap-2 font-medium cursor-pointer">
                <FileText className="h-4 w-4 text-green-500" />
                Send Document Checklist
              </Label>
            </div>
            
            {options.sendDocumentChecklist && (
              <div className="ml-6 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Delivery Method</Label>
                  <Select 
                    value={options.documentChecklistMethod} 
                    onValueChange={(value: 'email' | 'portal_link' | 'manual_task') => 
                      setOptions(prev => ({ ...prev, documentChecklistMethod: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        📧 Send via Email
                      </SelectItem>
                      <SelectItem value="portal_link">
                        🔗 Portal Link (customer views in portal)
                      </SelectItem>
                      <SelectItem value="manual_task">
                        📋 Manual Task (create follow-up task)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Additional notes for document checklist (optional)..."
                  value={options.documentChecklistNotes}
                  onChange={(e) => setOptions(prev => ({ ...prev, documentChecklistNotes: e.target.value }))}
                  className="h-16"
                />
              </div>
            )}
          </div>

          {/* Onboarding Call Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="onboarding-call" 
                checked={options.scheduleOnboardingCall}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, scheduleOnboardingCall: !!checked }))}
              />
              <Label htmlFor="onboarding-call" className="flex items-center gap-2 font-medium cursor-pointer">
                <Phone className="h-4 w-4 text-orange-500" />
                Schedule Onboarding Call
              </Label>
            </div>
            
            {options.scheduleOnboardingCall && (
              <div className="ml-6 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Scheduling Method</Label>
                  <Select 
                    value={options.onboardingCallMethod} 
                    onValueChange={(value: 'calendar_integration' | 'notification_only') => 
                      setOptions(prev => ({ ...prev, onboardingCallMethod: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calendar_integration">
                        📅 Calendar Integration (sync with Google/Outlook)
                      </SelectItem>
                      <SelectItem value="notification_only">
                        🔔 Notification Only (reminder without calendar sync)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !options.onboardingCallDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {options.onboardingCallDate ? format(options.onboardingCallDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={options.onboardingCallDate}
                        onSelect={(date) => setOptions(prev => ({ ...prev, onboardingCallDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  placeholder="Call notes (time preference, topics to discuss...)"
                  value={options.onboardingCallNotes}
                  onChange={(e) => setOptions(prev => ({ ...prev, onboardingCallNotes: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Services Purchased Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4 text-purple-500" />
              Services Purchased
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableServices.map((service) => (
                <Badge
                  key={service}
                  variant={options.servicesPurchased.includes(service) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleService(service)}
                >
                  {options.servicesPurchased.includes(service) && (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Conversion Notes</Label>
            <Textarea
              placeholder="Any additional notes about this conversion..."
              value={options.conversionNotes}
              onChange={(e) => setOptions(prev => ({ ...prev, conversionNotes: e.target.value }))}
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? 'Converting...' : 'Convert to Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
