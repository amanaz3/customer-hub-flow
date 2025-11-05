import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StatusPreference {
  id: string;
  status_type: string;
  is_enabled: boolean;
}

const STATUS_LABELS: Record<string, { label: string; description: string }> = {
  draft: {
    label: "Draft",
    description: "Application created but not submitted",
  },
  submitted: {
    label: "Submitted",
    description: "Application has been submitted",
  },
  returned: {
    label: "Returned",
    description: "Application returned for corrections",
  },
  paid: {
    label: "Paid",
    description: "Payment received for application",
  },
  completed: {
    label: "Completed",
    description: "Application successfully completed",
  },
  rejected: {
    label: "Rejected",
    description: "Application rejected",
  },
};

export default function NotificationManagement() {
  const [preferences, setPreferences] = useState<StatusPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("application_status_preferences")
        .select("*")
        .order("status_type");

      if (error) throw error;

      setPreferences(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (statusType: string, currentValue: boolean) => {
    setUpdating(statusType);
    try {
      const { error } = await supabase
        .from("application_status_preferences")
        .update({ is_enabled: !currentValue })
        .eq("status_type", statusType);

      if (error) throw error;

      setPreferences((prev) =>
        prev.map((pref) =>
          pref.status_type === statusType
            ? { ...pref, is_enabled: !currentValue }
            : pref
        )
      );

      toast({
        title: "Updated",
        description: `Notifications ${!currentValue ? "enabled" : "disabled"} for ${
          STATUS_LABELS[statusType]?.label || statusType
        }`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive",
      });
      console.error("Error updating preference:", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure email notifications for application status changes
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status Change Notifications</CardTitle>
            <CardDescription className="text-xs">
              Toggle notifications for each status. Admins and submitters will be notified when enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="group flex items-center justify-between gap-4 py-3 px-4 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor={pref.status_type}
                        className="font-semibold cursor-pointer"
                      >
                        {STATUS_LABELS[pref.status_type]?.label || pref.status_type}
                      </Label>
                      {updating === pref.status_type && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {STATUS_LABELS[pref.status_type]?.description ||
                        `Notify when status changes to ${pref.status_type}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium min-w-[2.5rem] text-right ${
                      pref.is_enabled ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {pref.is_enabled ? 'ON' : 'OFF'}
                    </span>
                    <Switch
                      id={pref.status_type}
                      checked={pref.is_enabled}
                      onCheckedChange={() => handleToggle(pref.status_type, pref.is_enabled)}
                      disabled={updating === pref.status_type}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Notification Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>All active admins (except the one making the change)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>The user who submitted the application (if different from admin)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
