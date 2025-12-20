import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowLeft, Settings2, ListChecks, CalendarClock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LeadSettingsDialog } from "@/components/Lead/LeadSettingsDialog";
import { FollowupSequenceConfig } from "@/components/Lead/FollowupSequenceConfig";
import { LeadReminderScheduleDialog } from "@/components/Lead/LeadReminderScheduleDialog";
import LeadWorkflowSettingsDialog from "@/components/Lead/LeadWorkflowSettingsDialog";

export default function Configure1SalesMarketing() {
  const navigate = useNavigate();
  const [showLeadSettings, setShowLeadSettings] = useState(false);
  const [showFollowupConfig, setShowFollowupConfig] = useState(false);
  const [showReminderSchedule, setShowReminderSchedule] = useState(false);
  const [showBulkSettings, setShowBulkSettings] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/configure-1')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="w-8 h-8" />
          Sales & Marketing Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage sales and marketing configuration settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Lead Settings Card */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setShowLeadSettings(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Lead Settings</CardTitle>
                <CardDescription>
                  Scoring, assignment and conversion rules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Follow-up Sequence Card */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setShowFollowupConfig(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ListChecks className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Follow-up Sequence</CardTitle>
                <CardDescription>
                  Configure automated follow-up actions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Reminder Schedule Card */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setShowReminderSchedule(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Reminder Schedule</CardTitle>
                <CardDescription>
                  Daily lead check reminder settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Lead Bulk Settings Card */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setShowBulkSettings(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Lead Bulk Settings</CardTitle>
                <CardDescription>
                  Bulk processing and auto triggers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
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
}
