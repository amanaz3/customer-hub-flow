import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  User,
  Check,
  X
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
  const [selectedRoleStatus, setSelectedRoleStatus] = useState<string>("completed");
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>("completed");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [prefsResult, rolePrefsResult, userPrefsResult, profilesResult, settingsResult] = await Promise.all([
        supabase.from("application_status_preferences").select("*").order("status_type"),
        supabase.from("notification_role_preferences").select("*").order("status_type, role"),
        supabase.from("notification_user_preferences").select("*").order("status_type"),
        supabase.from("profiles").select("id, email, name, role").eq("is_active", true).order("email"),
        supabase.from("notification_settings").select("*").eq("setting_key", "advanced_notifications_enabled").single(),
      ]);

      if (prefsResult.error) throw prefsResult.error;
      if (rolePrefsResult.error) throw rolePrefsResult.error;
      if (userPrefsResult.error) throw userPrefsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      setPreferences(prefsResult.data || []);
      setRolePreferences(rolePrefsResult.data || []);
      setUserPreferences(userPrefsResult.data || []);
      setProfiles(profilesResult.data || []);
      setAdvancedEnabled(settingsResult.data?.setting_value || false);
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

  const handleAdvancedToggle = async (enabled: boolean) => {
    setUpdating("advanced");
    try {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          setting_key: "advanced_notifications_enabled",
          setting_value: enabled,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setAdvancedEnabled(enabled);
      toast({
        title: "Updated",
        description: `Advanced notifications ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update advanced notifications setting",
        variant: "destructive",
      });
      console.error("Error updating advanced setting:", error);
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
    <div className="container mx-auto py-4 px-4 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Notification Settings</h1>
        <p className="text-xs text-muted-foreground">
          Configure email notifications for application status changes
        </p>
      </div>

      <div className="grid gap-3">
        <Card>
          <CardHeader className="pb-2 space-y-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Status Change Notifications</CardTitle>
              <Badge variant="default" className="text-[10px] bg-blue-500">Recommended</Badge>
            </div>
            <CardDescription className="text-[11px]">
              Toggle notifications for each status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid gap-1.5">
              {preferences.map((pref) => {
                const StatusIcon = STATUS_LABELS[pref.status_type]?.icon || Bell;
                return (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-1.5 rounded transition-colors ${
                        pref.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={pref.status_type}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {STATUS_LABELS[pref.status_type]?.label || pref.status_type}
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {updating === pref.status_type && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      <div className="relative">
                        <Switch
                          id={pref.status_type}
                          checked={pref.is_enabled}
                          onCheckedChange={() => handleToggle(pref.status_type, pref.is_enabled)}
                          disabled={updating === pref.status_type}
                          className={`scale-75 ${
                            pref.is_enabled 
                              ? 'data-[state=checked]:bg-green-500' 
                              : 'data-[state=unchecked]:bg-red-500'
                          }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          {pref.is_enabled ? (
                            <Check className="h-2.5 w-2.5 text-white" />
                          ) : (
                            <X className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Advanced Notifications</CardTitle>
                <Badge variant="secondary" className="text-[10px]">Advanced</Badge>
              </div>
              <div className="relative">
                <Switch
                  checked={advancedEnabled}
                  onCheckedChange={handleAdvancedToggle}
                  disabled={updating === "advanced"}
                  className={`scale-90 ${
                    advancedEnabled 
                      ? 'data-[state=checked]:bg-green-500' 
                      : 'data-[state=unchecked]:bg-red-500'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {advancedEnabled ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
            </div>
            <CardDescription className="text-[11px]">
              Configure role-based and user-specific notification controls
            </CardDescription>
          </CardHeader>
          
          <CardContent className={`space-y-4 ${!advancedEnabled ? 'opacity-50' : ''}`}>
            {/* Role-Based Notifications Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-semibold">Role-Based Notifications</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Configure which roles receive notifications
              </p>
              <Select 
                value={selectedRoleStatus} 
                onValueChange={setSelectedRoleStatus}
                disabled={!advancedEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                    const StatusIcon = statusInfo.icon;
                    return (
                      <SelectItem key={statusType} value={statusType}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedRoleStatus && advancedEnabled && (
                <div className="border rounded-md p-3 bg-card">
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'manager', 'user'] as const).map((role) => {
                      const pref = rolePreferences.find(
                        (p) => p.status_type === selectedRoleStatus && p.role === role
                      );
                      const RoleIcon = ROLE_LABELS[role].icon;
                      const updateKey = `${selectedRoleStatus}-${role}`;
                      
                      return (
                        <div
                          key={role}
                          className={`flex items-center justify-between p-2.5 rounded border transition-colors ${
                            pref?.is_enabled ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${ROLE_LABELS[role].color}`} />
                            <span className="text-xs font-medium truncate">{ROLE_LABELS[role].label}</span>
                          </div>
                          <div className="relative">
                            <Switch
                              checked={pref?.is_enabled || false}
                              onCheckedChange={() => handleRoleToggle(selectedRoleStatus, role, pref?.is_enabled || false)}
                              disabled={updating === updateKey || !advancedEnabled}
                              className={`scale-75 ${
                                pref?.is_enabled 
                                  ? 'data-[state=checked]:bg-green-500' 
                                  : 'data-[state=unchecked]:bg-red-500'
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {pref?.is_enabled ? (
                                <Check className="h-2.5 w-2.5 text-white" />
                              ) : (
                                <X className="h-2.5 w-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            {/* User-Specific Notifications Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-semibold">User-Specific Notifications</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Add specific users to receive notifications
              </p>
              <Select 
                value={selectedUserStatus} 
                onValueChange={setSelectedUserStatus}
                disabled={!advancedEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                    const StatusIcon = statusInfo.icon;
                    const userPrefs = userPreferences.filter((p) => p.status_type === statusType);
                    return (
                      <SelectItem key={statusType} value={statusType}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                          {userPrefs.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">
                              {userPrefs.length}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedUserStatus && advancedEnabled && (
                <div className="border rounded-md p-2.5 bg-card">
                  <div className="grid gap-1.5 max-h-60 overflow-y-auto pr-1">
                    {profiles.map((profile) => {
                      const isEnabled = userPreferences.some(
                        (p) => p.status_type === selectedUserStatus && p.user_id === profile.id
                      );
                      const updateKey = `${selectedUserStatus}-${profile.id}`;
                      const RoleIcon = ROLE_LABELS[profile.role].icon;
                      
                      return (
                        <div
                          key={profile.id}
                          className={`flex items-center justify-between p-2 px-2.5 rounded border transition-colors ${
                            isEnabled ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${ROLE_LABELS[profile.role].color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{profile.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleUserToggle(selectedUserStatus, profile.id, isEnabled)}
                              disabled={updating === updateKey || !advancedEnabled}
                              className={`scale-75 ${
                                isEnabled 
                                  ? 'data-[state=checked]:bg-green-500' 
                                  : 'data-[state=unchecked]:bg-red-500'
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {isEnabled ? (
                                <Check className="h-2.5 w-2.5 text-white" />
                              ) : (
                                <X className="h-2.5 w-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
