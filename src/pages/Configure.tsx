import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Shield, BookOpen, UserCog, Building2, Flag, DollarSign, Settings2, Box, Target, CalendarClock, ListChecks, KeyRound, Layers, Globe, Briefcase, FileText } from "lucide-react";
import { LeadSettingsDialog } from "@/components/Lead/LeadSettingsDialog";
import { FollowupSequenceConfig } from "@/components/Lead/FollowupSequenceConfig";
import { LeadReminderScheduleDialog } from "@/components/Lead/LeadReminderScheduleDialog";
import LeadWorkflowSettingsDialog from "@/components/Lead/LeadWorkflowSettingsDialog";

const Manage = () => {
  const navigate = useNavigate();
  const [showLeadSettings, setShowLeadSettings] = useState(false);
  const [showFollowupConfig, setShowFollowupConfig] = useState(false);
  const [showReminderSchedule, setShowReminderSchedule] = useState(false);
  const [showBulkSettings, setShowBulkSettings] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configure</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Configuration Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>User</CardTitle>
                <CardDescription>User and business configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/users')}
            >
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">User Management</p>
                <p className="text-xs text-muted-foreground">Manage users, roles and permissions</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Messages</p>
                <p className="text-xs text-muted-foreground">Notification settings and preferences</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/admin/help-editor')}
            >
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Help Editor</p>
                <p className="text-xs text-muted-foreground">Manage help content and documentation</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/access-management')}
            >
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Access Management</p>
                <p className="text-xs text-muted-foreground">Granular page and feature access control</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Configuration Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Business</CardTitle>
                <CardDescription>Business configuration and settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/products')}
            >
              <Box className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Product Management</p>
                <p className="text-xs text-muted-foreground">Manage products and categories</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/customer-services')}
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Services</p>
                <p className="text-xs text-muted-foreground">Manage services and products</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/service-fees')}
            >
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Service Fees</p>
                <p className="text-xs text-muted-foreground">Configure fee structures and pricing</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/service-form-configuration')}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Service Details Form</p>
                <p className="text-xs text-muted-foreground">Configure dynamic forms for services</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/settings?tab=features')}
            >
              <Flag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Feature Flags</p>
                <p className="text-xs text-muted-foreground">Enable or disable workflow features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales & Marketing Configuration Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Sales & Marketing</CardTitle>
                <CardDescription>Lead and outreach configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => setShowLeadSettings(true)}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Lead Settings</p>
                <p className="text-xs text-muted-foreground">Scoring, assignment and conversion rules</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => setShowFollowupConfig(true)}
            >
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Follow-up Sequence</p>
                <p className="text-xs text-muted-foreground">Configure automated follow-up actions</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => setShowReminderSchedule(true)}
            >
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Reminder Schedule</p>
                <p className="text-xs text-muted-foreground">Daily lead check reminder settings</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => setShowBulkSettings(true)}
            >
              <Layers className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Lead Bulk Settings</p>
                <p className="text-xs text-muted-foreground">Bulk processing and auto triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webflow Decision Engine Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Webflow
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">New</span>
                </CardTitle>
                <CardDescription>Self-serve flow configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/webflow-config')}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Decision Engine</p>
                <p className="text-xs text-muted-foreground">Countries, jurisdictions, activities, pricing</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/webflow-config?tab=documents')}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Document Matrix</p>
                <p className="text-xs text-muted-foreground">Required documents configuration</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => window.open('/webflow', '_blank')}
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Preview Flow</p>
                <p className="text-xs text-muted-foreground">Test the customer self-serve flow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <LeadSettingsDialog 
        open={showLeadSettings} 
        onOpenChange={setShowLeadSettings} 
      />
      <FollowupSequenceConfig 
        open={showFollowupConfig} 
        onOpenChange={setShowFollowupConfig} 
      />
      <LeadReminderScheduleDialog 
        open={showReminderSchedule} 
        onOpenChange={setShowReminderSchedule} 
      />
      <LeadWorkflowSettingsDialog 
        open={showBulkSettings} 
        onOpenChange={setShowBulkSettings} 
      />
    </div>
  );
};

export default Manage;
