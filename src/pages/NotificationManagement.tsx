import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  FileEdit, 
  Send, 
  ArrowLeftCircle, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Bell,
  Users,
  Shield,
  UserCog,
  User
} from "lucide-react";

interface StatusPreference {
  id: string;
  status_type: string;
  is_enabled: boolean;
}

interface RolePreference {
  id: string;
  status_type: string;
  role: 'admin' | 'manager' | 'user';
  is_enabled: boolean;
}

interface UserPreference {
  id: string;
  status_type: string;
  user_id: string;
  is_enabled: boolean;
}

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

const STATUS_LABELS: Record<string, { label: string; description: string; icon: any }> = {
  draft: {
    label: "Draft",
    description: "Application created but not submitted",
    icon: FileEdit,
  },
  submitted: {
    label: "Submitted",
    description: "Application has been submitted",
    icon: Send,
  },
  returned: {
    label: "Returned",
    description: "Application returned for corrections",
    icon: ArrowLeftCircle,
  },
  paid: {
    label: "Paid",
    description: "Payment received for application",
    icon: DollarSign,
  },
  completed: {
    label: "Completed",
    description: "Application successfully completed",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    description: "Application rejected",
    icon: XCircle,
  },
};

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-red-600 dark:text-red-500",
  },
  manager: {
    label: "Manager",
    icon: UserCog,
    color: "text-blue-600 dark:text-blue-500",
  },
  user: {
    label: "User",
    icon: User,
    color: "text-green-600 dark:text-green-500",
  },
};

export default function NotificationManagement() {
  const [preferences, setPreferences] = useState<StatusPreference[]>([]);
  const [rolePreferences, setRolePreferences] = useState<RolePreference[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [prefsResult, rolePrefsResult, userPrefsResult, profilesResult] = await Promise.all([
        supabase.from("application_status_preferences").select("*").order("status_type"),
        supabase.from("notification_role_preferences").select("*").order("status_type, role"),
        supabase.from("notification_user_preferences").select("*").order("status_type"),
        supabase.from("profiles").select("id, email, name, role").eq("is_active", true).order("email"),
      ]);

      if (prefsResult.error) throw prefsResult.error;
      if (rolePrefsResult.error) throw rolePrefsResult.error;
      if (userPrefsResult.error) throw userPrefsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      setPreferences(prefsResult.data || []);
      setRolePreferences(rolePrefsResult.data || []);
      setUserPreferences(userPrefsResult.data || []);
      setProfiles(profilesResult.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
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

  const handleRoleToggle = async (statusType: string, role: 'admin' | 'manager' | 'user', currentValue: boolean) => {
    const key = `${statusType}-${role}`;
    setUpdating(key);
    try {
      const { error } = await supabase
        .from("notification_role_preferences")
        .update({ is_enabled: !currentValue })
        .eq("status_type", statusType)
        .eq("role", role);

      if (error) throw error;

      setRolePreferences((prev) =>
        prev.map((pref) =>
          pref.status_type === statusType && pref.role === role
            ? { ...pref, is_enabled: !currentValue }
            : pref
        )
      );

      toast({
        title: "Updated",
        description: `${ROLE_LABELS[role]?.label} notifications ${!currentValue ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update role notification preference",
        variant: "destructive",
      });
      console.error("Error updating role preference:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleUserToggle = async (statusType: string, userId: string, currentEnabled: boolean) => {
    const key = `${statusType}-${userId}`;
    setUpdating(key);
    
    try {
      if (currentEnabled) {
        // Delete the preference
        const { error } = await supabase
          .from("notification_user_preferences")
          .delete()
          .eq("status_type", statusType)
          .eq("user_id", userId);

        if (error) throw error;

        setUserPreferences((prev) =>
          prev.filter((pref) => !(pref.status_type === statusType && pref.user_id === userId))
        );
      } else {
        // Create the preference
        const { data, error } = await supabase
          .from("notification_user_preferences")
          .insert({ status_type: statusType, user_id: userId, is_enabled: true })
          .select()
          .single();

        if (error) throw error;

        setUserPreferences((prev) => [...prev, data]);
      }

      const userEmail = profiles.find((p) => p.id === userId)?.email || "User";
      toast({
        title: "Updated",
        description: `Notifications ${!currentEnabled ? "enabled" : "disabled"} for ${userEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user notification preference",
        variant: "destructive",
      });
      console.error("Error updating user preference:", error);
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
              {preferences.map((pref) => {
                const StatusIcon = STATUS_LABELS[pref.status_type]?.icon || Bell;
                return (
                  <div
                    key={pref.id}
                    className="group flex items-center justify-between gap-4 py-3 px-4 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-md transition-colors ${
                        pref.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold min-w-[2.5rem] text-right transition-colors ${
                        pref.is_enabled ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      }`}>
                        {pref.is_enabled ? 'ON' : 'OFF'}
                      </span>
                      <Switch
                        id={pref.status_type}
                        checked={pref.is_enabled}
                        onCheckedChange={() => handleToggle(pref.status_type, pref.is_enabled)}
                        disabled={updating === pref.status_type}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Role-Based Notifications</CardTitle>
            <CardDescription className="text-xs">
              Configure which roles receive notifications for each status change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                const StatusIcon = statusInfo.icon;
                const rolePrefs = rolePreferences.filter((p) => p.status_type === statusType);
                
                return (
                  <div key={statusType} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{statusInfo.label}</h3>
                        <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['admin', 'manager', 'user'] as const).map((role) => {
                        const pref = rolePrefs.find((p) => p.role === role);
                        const RoleIcon = ROLE_LABELS[role].icon;
                        const updateKey = `${statusType}-${role}`;
                        
                        return (
                          <div
                            key={role}
                            className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                              pref?.is_enabled ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${ROLE_LABELS[role].color}`} />
                              <span className="text-xs font-medium truncate">{ROLE_LABELS[role].label}</span>
                            </div>
                            <Switch
                              checked={pref?.is_enabled || false}
                              onCheckedChange={() => handleRoleToggle(statusType, role, pref?.is_enabled || false)}
                              disabled={updating === updateKey}
                              className="scale-75"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User-Specific Notifications</CardTitle>
            <CardDescription className="text-xs">
              Add specific users to receive notifications for status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                const StatusIcon = statusInfo.icon;
                const userPrefs = userPreferences.filter((p) => p.status_type === statusType);
                
                return (
                  <div key={statusType} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{statusInfo.label}</h3>
                        <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
                      </div>
                      {userPrefs.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {userPrefs.length} {userPrefs.length === 1 ? 'user' : 'users'}
                        </Badge>
                      )}
                    </div>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {profiles.map((profile) => {
                        const isEnabled = userPrefs.some((p) => p.user_id === profile.id);
                        const updateKey = `${statusType}-${profile.id}`;
                        const RoleIcon = ROLE_LABELS[profile.role].icon;
                        
                        return (
                          <div
                            key={profile.id}
                            className={`flex items-center justify-between p-2 px-3 rounded-md border text-sm transition-colors ${
                              isEnabled ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${ROLE_LABELS[profile.role].color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{profile.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleUserToggle(statusType, profile.id, isEnabled)}
                              disabled={updating === updateKey}
                              className="scale-75"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
