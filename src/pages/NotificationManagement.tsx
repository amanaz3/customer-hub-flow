import { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
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
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Management</h1>
          <p className="text-muted-foreground">
            Configure which application status changes trigger notifications for admins and users.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Status Notifications</CardTitle>
            <CardDescription>
              Enable or disable notifications for specific status changes. When enabled, both admins
              and the user who submitted the application will receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-start justify-between space-x-4 py-4 border-b last:border-0"
              >
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor={pref.status_type}
                    className="text-base font-medium cursor-pointer"
                  >
                    {STATUS_LABELS[pref.status_type]?.label || pref.status_type}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {STATUS_LABELS[pref.status_type]?.description ||
                      `Notify when status changes to ${pref.status_type}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {updating === pref.status_type && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    id={pref.status_type}
                    checked={pref.is_enabled}
                    onCheckedChange={() => handleToggle(pref.status_type, pref.is_enabled)}
                    disabled={updating === pref.status_type}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Who receives notifications?</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>All active admins (except the one making the change)</li>
            <li>The user who submitted the application (if different from the admin making the change)</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
