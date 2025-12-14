import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Clock, Play, Pause, RefreshCw, Settings, Calendar, Mail, BellRing } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ScheduleSettings {
  id: string;
  is_enabled: boolean;
  schedule_time: string;
  timezone: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

const TIMEZONES = [
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
];

const SCHEDULE_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
];

interface LeadReminderScheduleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LeadReminderScheduleDialog({ open: controlledOpen, onOpenChange }: LeadReminderScheduleDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_reminder_schedule')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data as ScheduleSettings);
      }
    } catch (error) {
      console.error('Error fetching schedule settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const handleToggleEnabled = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const newEnabled = !settings.is_enabled;
      
      const { error } = await supabase
        .from('lead_reminder_schedule')
        .update({ 
          is_enabled: newEnabled,
          next_run_at: newEnabled ? calculateNextRun(settings.schedule_time, settings.timezone) : null,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, is_enabled: newEnabled });
      toast({
        title: newEnabled ? 'Reminders Enabled' : 'Reminders Paused',
        description: newEnabled 
          ? `Daily reminders will be sent at ${formatTime(settings.schedule_time)}`
          : 'Daily lead reminders have been paused',
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTime = async (time: string) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lead_reminder_schedule')
        .update({ 
          schedule_time: time + ':00',
          next_run_at: settings.is_enabled ? calculateNextRun(time + ':00', settings.timezone) : null,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, schedule_time: time + ':00' });
      toast({
        title: 'Schedule Updated',
        description: `Reminders will be sent at ${formatTime(time + ':00')}`,
      });
    } catch (error) {
      console.error('Error updating time:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule time',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTimezone = async (tz: string) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lead_reminder_schedule')
        .update({ 
          timezone: tz,
          next_run_at: settings.is_enabled ? calculateNextRun(settings.schedule_time, tz) : null,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, timezone: tz });
      toast({
        title: 'Timezone Updated',
        description: `Schedule set to ${TIMEZONES.find(t => t.value === tz)?.label}`,
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update timezone',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    setTestingSend(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-lead-reminder', {
        body: {},
      });

      if (error) throw error;

      // Update last_run_at
      await supabase
        .from('lead_reminder_schedule')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', settings?.id);

      await fetchSettings();

      toast({
        title: 'Test Sent Successfully',
        description: `Sent to ${data?.processedUsers || 0} users`,
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test reminders',
        variant: 'destructive',
      });
    } finally {
      setTestingSend(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateNextRun = (time: string, tz: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  };

  const isControlled = controlledOpen !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Daily Lead Reminder Schedule
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className={settings.is_enabled ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-muted'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.is_enabled ? (
                      <Play className="h-5 w-5 text-green-600" />
                    ) : (
                      <Pause className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {settings.is_enabled ? 'Active' : 'Paused'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {settings.is_enabled 
                          ? `Sending daily at ${formatTime(settings.schedule_time)}`
                          : 'Reminders are currently paused'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={handleToggleEnabled}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Send Time
                </Label>
                <Select
                  value={settings.schedule_time.slice(0, 5)}
                  onValueChange={handleUpdateTime}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TIMES.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time + ':00')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timezone
                </Label>
                <Select
                  value={settings.timezone}
                  onValueChange={handleUpdateTimezone}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Run Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Sent</p>
                <p className="text-sm font-medium">
                  {settings.last_run_at 
                    ? formatDistanceToNow(new Date(settings.last_run_at), { addSuffix: true })
                    : 'Never'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Next Send</p>
                <p className="text-sm font-medium">
                  {settings.is_enabled && settings.next_run_at
                    ? format(new Date(settings.next_run_at), 'MMM d, h:mm a')
                    : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Delivery Methods */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Delivery Methods</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BellRing className="h-3 w-3" />
                  In-App Banner
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Push Notification
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Badge>
              </div>
            </div>

            {/* Test Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleTestSend}
                disabled={testingSend}
                variant="outline"
                className="w-full"
              >
                {testingSend ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Send Test Now
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Sends reminders to all users with assigned leads
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No schedule settings found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
