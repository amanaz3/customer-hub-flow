import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface StatusPreference {
  id: string;
  status_type: string;
  is_enabled: boolean;
}

interface InAppPreference {
  id?: string;
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

interface InAppRolePreference {
  status_type: string;
  role: 'admin' | 'manager' | 'user';
  is_enabled: boolean;
}

interface InAppUserPreference {
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

const STATUS_LABELS: Record<string, { label: string; description: string; icon: any; color: string }> = {
  Draft: {
    label: "Draft",
    description: "Application created but not submitted",
    icon: FileEdit,
    color: "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400",
  },
  Submitted: {
    label: "Submitted",
    description: "Application has been submitted",
    icon: Send,
    color: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  Returned: {
    label: "Returned",
    description: "Application returned for corrections",
    icon: ArrowLeftCircle,
    color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  },
  "Sent to Bank": {
    label: "Sent to Bank",
    description: "Application sent to bank for processing",
    icon: Send,
    color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
  },
  Complete: {
    label: "Complete",
    description: "Application successfully completed",
    icon: CheckCircle,
    color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  },
  Rejected: {
    label: "Rejected",
    description: "Application rejected",
    icon: XCircle,
    color: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
  },
  "Need More Info": {
    label: "Need More Info",
    description: "Additional information required",
    icon: Bell,
    color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  },
  Paid: {
    label: "Paid",
    description: "Payment received for application",
    icon: DollarSign,
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
  "Ready for Bank": {
    label: "Ready for Bank",
    description: "Application ready to be sent to bank",
    icon: Star,
    color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
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
  const [inAppPreferences, setInAppPreferences] = useState<InAppPreference[]>([]);
  const [rolePreferences, setRolePreferences] = useState<RolePreference[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [inAppRolePreferences, setInAppRolePreferences] = useState<InAppRolePreference[]>([]);
  const [inAppUserPreferences, setInAppUserPreferences] = useState<InAppUserPreference[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedRoleStatus, setSelectedRoleStatus] = useState<string>("completed");
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>("completed");
  const [selectedInAppRoleStatus, setSelectedInAppRoleStatus] = useState<string>("completed");
  const [selectedInAppUserStatus, setSelectedInAppUserStatus] = useState<string>("completed");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Collapsible state
  const [emailOpen, setEmailOpen] = useState(true);
  const [inAppOpen, setInAppOpen] = useState(true);
  const [advancedEmailOpen, setAdvancedEmailOpen] = useState(false);
  const [advancedInAppOpen, setAdvancedInAppOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [prefsResult, inAppResult, rolePrefsResult, userPrefsResult, profilesResult, settingsResult, inAppRoleResult, inAppUserResult] = await Promise.all([
        supabase.from("application_status_preferences").select("*").order("status_type"),
        supabase.from("notification_settings").select("*").like("setting_key", "in_app_%").not("setting_key", "like", "in_app_role_%").not("setting_key", "like", "in_app_user_%"),
        supabase.from("notification_role_preferences").select("*").order("status_type, role"),
        supabase.from("notification_user_preferences").select("*").order("status_type"),
        supabase.from("profiles").select("id, email, name, role").eq("is_active", true).order("email"),
        supabase.from("notification_settings").select("*").eq("setting_key", "advanced_notifications_enabled").single(),
        supabase.from("notification_settings").select("*").like("setting_key", "in_app_role_%"),
        supabase.from("notification_settings").select("*").like("setting_key", "in_app_user_%"),
      ]);

      if (prefsResult.error) throw prefsResult.error;
      if (rolePrefsResult.error) throw rolePrefsResult.error;
      if (userPrefsResult.error) throw userPrefsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      setPreferences(prefsResult.data || []);
      
      // Parse in-app preferences
      const inAppPrefs: InAppPreference[] = Object.keys(STATUS_LABELS).map(statusType => {
        const existing = inAppResult.data?.find(s => s.setting_key === `in_app_${statusType}`);
        return {
          id: existing?.id,
          status_type: statusType,
          is_enabled: existing?.setting_value ?? true
        };
      });
      setInAppPreferences(inAppPrefs);
      
      // Parse in-app role preferences
      const inAppRolePrefs: InAppRolePreference[] = [];
      Object.keys(STATUS_LABELS).forEach(statusType => {
        (['admin', 'manager', 'user'] as const).forEach(role => {
          const key = `in_app_role_${role}_${statusType}`;
          const existing = inAppRoleResult.data?.find(s => s.setting_key === key);
          inAppRolePrefs.push({
            status_type: statusType,
            role,
            is_enabled: existing?.setting_value ?? true
          });
        });
      });
      setInAppRolePreferences(inAppRolePrefs);
      
      // Parse in-app user preferences
      const inAppUserPrefs: InAppUserPreference[] = [];
      inAppUserResult.data?.forEach(setting => {
        const match = setting.setting_key.match(/^in_app_user_(.+)_(.+)$/);
        if (match) {
          inAppUserPrefs.push({
            user_id: match[1],
            status_type: match[2],
            is_enabled: setting.setting_value
          });
        }
      });
      setInAppUserPreferences(inAppUserPrefs);
      
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

  const handleInAppRoleToggle = async (statusType: string, role: 'admin' | 'manager' | 'user', currentValue: boolean) => {
    const key = `in-app-role-${statusType}-${role}`;
    setUpdating(key);
    try {
      const settingKey = `in_app_role_${role}_${statusType}`;
      const { data: existing } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("setting_key", settingKey)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from("notification_settings")
          .update({ 
            setting_value: !currentValue,
            updated_at: new Date().toISOString()
          })
          .eq("setting_key", settingKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({ 
            setting_key: settingKey,
            setting_value: !currentValue
          });
        if (error) throw error;
      }

      setInAppRolePreferences(prev =>
        prev.map(pref =>
          pref.status_type === statusType && pref.role === role
            ? { ...pref, is_enabled: !currentValue }
            : pref
        )
      );

      toast({
        title: "Updated",
        description: `${ROLE_LABELS[role]?.label} in-app notifications ${!currentValue ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update in-app role notification preference",
        variant: "destructive",
      });
      console.error("Error updating in-app role preference:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleInAppUserToggle = async (statusType: string, userId: string, currentEnabled: boolean) => {
    const key = `in-app-user-${statusType}-${userId}`;
    setUpdating(key);
    
    try {
      const settingKey = `in_app_user_${userId}_${statusType}`;
      
      if (currentEnabled) {
        const { error } = await supabase
          .from("notification_settings")
          .delete()
          .eq("setting_key", settingKey);
        if (error) throw error;

        setInAppUserPreferences(prev =>
          prev.filter(pref => !(pref.status_type === statusType && pref.user_id === userId))
        );
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({ 
            setting_key: settingKey,
            setting_value: true
          });
        if (error) throw error;

        setInAppUserPreferences(prev => [...prev, {
          user_id: userId,
          status_type: statusType,
          is_enabled: true
        }]);
      }

      const userEmail = profiles.find((p) => p.id === userId)?.email || "User";
      toast({
        title: "Updated",
        description: `In-app notifications ${!currentEnabled ? "enabled" : "disabled"} for ${userEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user in-app notification preference",
        variant: "destructive",
      });
      console.error("Error updating user in-app preference:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleInAppToggle = async (statusType: string, currentValue: boolean) => {
    const key = `in-app-${statusType}`;
    setUpdating(key);
    try {
      const settingKey = `in_app_${statusType}`;
      const existingPref = inAppPreferences.find(p => p.status_type === statusType);
      
      if (existingPref?.id) {
        const { error } = await supabase
          .from("notification_settings")
          .update({ 
            setting_value: !currentValue,
            updated_at: new Date().toISOString()
          })
          .eq("setting_key", settingKey);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({ 
            setting_key: settingKey,
            setting_value: !currentValue
          });

        if (error) throw error;
      }

      setInAppPreferences(prev =>
        prev.map(pref =>
          pref.status_type === statusType
            ? { ...pref, is_enabled: !currentValue }
            : pref
        )
      );

      toast({
        title: "Updated",
        description: `In-app notifications ${!currentValue ? "enabled" : "disabled"} for ${
          STATUS_LABELS[statusType]?.label || statusType
        }`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update in-app notification preference",
        variant: "destructive",
      });
      console.error("Error updating in-app preference:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdvancedToggle = async (enabled: boolean) => {
    setUpdating("advanced");
    try {
      const { error } = await supabase
        .from("notification_settings")
        .update({
          setting_value: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "advanced_notifications_enabled");

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
    <div className="space-y-6">
      {/* Email Notifications */}
      <Collapsible open={emailOpen} onOpenChange={setEmailOpen}>
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email Notifications</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Control email alerts sent to users' inboxes
                  </CardDescription>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {emailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {preferences.map((pref, index) => {
                  const statusInfo = STATUS_LABELS[pref.status_type];
                  const StatusIcon = statusInfo?.icon || Bell;
                  return (
                    <div key={pref.id}>
                      <div
                        className={`group relative flex items-center justify-between gap-4 py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
                          statusInfo?.color || 'bg-muted/30'
                        } ${pref.is_enabled ? 'shadow-sm hover:shadow-md' : 'opacity-60 hover:opacity-80'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-md ${pref.is_enabled ? 'bg-background/80 shadow-sm' : 'bg-background/40'}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`email-${pref.status_type}`}
                              className="text-sm font-semibold cursor-pointer block"
                            >
                              {statusInfo?.label || pref.status_type}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {statusInfo?.description || ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {updating === pref.status_type && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          <Switch
                            id={`email-${pref.status_type}`}
                            checked={pref.is_enabled}
                            onCheckedChange={() => handleToggle(pref.status_type, pref.is_enabled)}
                            disabled={updating === pref.status_type}
                            className={`${
                              pref.is_enabled 
                                ? 'data-[state=checked]:bg-green-600' 
                                : 'data-[state=unchecked]:bg-gray-400'
                            }`}
                          />
                          <Badge 
                            variant={pref.is_enabled ? "default" : "secondary"}
                            className="text-xs font-medium min-w-[60px] justify-center"
                          >
                            {pref.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      {index < preferences.length - 1 && (
                        <Separator className="my-2 opacity-50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* In-App Notifications */}
      <Collapsible open={inAppOpen} onOpenChange={setInAppOpen}>
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">In-App Notifications</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Control alerts shown in the notification bell
                  </CardDescription>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {inAppOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {inAppPreferences.filter(pref => !['Sent to Bank', 'Need More Info', 'Ready for Bank'].includes(pref.status_type)).map((pref, index) => {
                  const statusInfo = STATUS_LABELS[pref.status_type];
                  const StatusIcon = statusInfo?.icon || Bell;
                  const key = `in-app-${pref.status_type}`;
                  return (
                    <div key={pref.status_type}>
                      <div
                        className={`group relative flex items-center justify-between gap-4 py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
                          statusInfo?.color || 'bg-muted/30'
                        } ${pref.is_enabled ? 'shadow-sm hover:shadow-md' : 'opacity-60 hover:opacity-80'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-md ${pref.is_enabled ? 'bg-background/80 shadow-sm' : 'bg-background/40'}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`inapp-${pref.status_type}`}
                              className="text-sm font-semibold cursor-pointer block"
                            >
                              {statusInfo?.label || pref.status_type}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {statusInfo?.description || ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {updating === key && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          <Switch
                            id={`inapp-${pref.status_type}`}
                            checked={pref.is_enabled}
                            onCheckedChange={() => handleInAppToggle(pref.status_type, pref.is_enabled)}
                            disabled={updating === key}
                            className={`${
                              pref.is_enabled 
                                ? 'data-[state=checked]:bg-green-600' 
                                : 'data-[state=unchecked]:bg-gray-400'
                            }`}
                          />
                          <Badge 
                            variant={pref.is_enabled ? "default" : "secondary"}
                            className="text-xs font-medium min-w-[60px] justify-center"
                          >
                            {pref.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      {index < inAppPreferences.filter(p => !['Sent to Bank', 'Need More Info', 'Ready for Bank'].includes(p.status_type)).length - 1 && (
                        <Separator className="my-2 opacity-50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Advanced Email Settings */}
      <Collapsible open={advancedEmailOpen} onOpenChange={setAdvancedEmailOpen}>
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Advanced Email Settings
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                      Pro
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Role-based and user-specific email notification controls
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {updating === "advanced" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <Switch
                  checked={advancedEnabled}
                  onCheckedChange={handleAdvancedToggle}
                  disabled={updating === "advanced"}
                />
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {advancedEmailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className={`pt-6 space-y-6 ${!advancedEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Role-Based Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold">Role-Based Configuration</h4>
                </div>
                <Select 
                  value={selectedRoleStatus} 
                  onValueChange={setSelectedRoleStatus}
                  disabled={!advancedEnabled}
                >
                  <SelectTrigger className="w-full border-2 h-11 bg-background">
                    <SelectValue placeholder="Select status type to configure" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 z-50">
                    {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                      const StatusIcon = statusInfo.icon;
                      return (
                        <SelectItem 
                          key={statusType} 
                          value={statusType}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium">{statusInfo.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedRoleStatus && advancedEnabled && (
                  <div className="border-2 rounded-lg p-4 bg-gradient-to-br from-background to-muted/30 shadow-sm">
                    <div className="grid grid-cols-3 gap-3">
                      {(['admin', 'manager', 'user'] as const).map((role) => {
                        const pref = rolePreferences.find(
                          (p) => p.status_type === selectedRoleStatus && p.role === role
                        );
                        const RoleIcon = ROLE_LABELS[role].icon;
                        const updateKey = `${selectedRoleStatus}-${role}`;
                        
                        return (
                          <div
                            key={role}
                            className={`flex flex-col gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                              pref?.is_enabled 
                                ? 'bg-primary/5 border-primary/40 shadow-sm' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <RoleIcon className={`h-4 w-4 ${ROLE_LABELS[role].color}`} />
                              <span className="text-xs font-semibold">{ROLE_LABELS[role].label}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              {updating === updateKey && (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              )}
                              <Switch
                                checked={pref?.is_enabled || false}
                                onCheckedChange={() => handleRoleToggle(selectedRoleStatus, role, pref?.is_enabled || false)}
                                disabled={updating === updateKey || !advancedEnabled}
                                className="ml-auto"
                              />
                            </div>
                            <Badge 
                              variant={pref?.is_enabled ? "default" : "secondary"}
                              className="text-[10px] w-full justify-center"
                            >
                              {pref?.is_enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* User-Specific Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold">User-Specific Configuration</h4>
                </div>
                <Select 
                  value={selectedUserStatus} 
                  onValueChange={setSelectedUserStatus}
                  disabled={!advancedEnabled}
                >
                  <SelectTrigger className="w-full border-2 h-11 bg-background">
                    <SelectValue placeholder="Select status type to configure" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 z-50">
                    {Object.entries(STATUS_LABELS).map(([statusType, statusInfo]) => {
                      const StatusIcon = statusInfo.icon;
                      const userPrefs = userPreferences.filter((p) => p.status_type === statusType);
                      return (
                        <SelectItem 
                          key={statusType} 
                          value={statusType}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <span className="font-medium">{statusInfo.label}</span>
                            </div>
                            {userPrefs.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
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
                  <div className="border-2 rounded-lg p-4 bg-gradient-to-br from-background to-muted/30 shadow-sm">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {profiles.map((profile) => {
                        const isEnabled = userPreferences.some(
                          (p) => p.status_type === selectedUserStatus && p.user_id === profile.id
                        );
                        const updateKey = `${selectedUserStatus}-${profile.id}`;
                        const RoleIcon = ROLE_LABELS[profile.role]?.icon;
                        
                        return (
                          <div
                            key={profile.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                              isEnabled 
                                ? 'bg-primary/5 border-primary/40 shadow-sm' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <RoleIcon className={`h-4 w-4 flex-shrink-0 ${ROLE_LABELS[profile.role]?.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{profile.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{profile.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {updating === updateKey && (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              )}
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => handleUserToggle(selectedUserStatus, profile.id, isEnabled)}
                                disabled={updating === updateKey || !advancedEnabled}
                              />
                              <Badge 
                                variant={isEnabled ? "default" : "secondary"}
                                className="text-[10px] min-w-[50px] justify-center"
                              >
                                {isEnabled ? 'On' : 'Off'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Advanced In-App Settings */}
      <Collapsible open={advancedInAppOpen} onOpenChange={setAdvancedInAppOpen}>
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-cyan-500/5 to-teal-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Advanced In-App Settings
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0">
                      Pro
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Role-based and user-specific in-app notification controls
                  </CardDescription>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {advancedInAppOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className={`pt-6 space-y-6 ${!advancedEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Role-Based In-App */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <h4 className="text-sm font-semibold">Role-Based Configuration</h4>
                </div>
                <Select 
                  value={selectedInAppRoleStatus} 
                  onValueChange={setSelectedInAppRoleStatus}
                  disabled={!advancedEnabled}
                >
                  <SelectTrigger className="w-full border-2 h-11 bg-background">
                    <SelectValue placeholder="Select status type to configure" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 z-50">
                    {Object.entries(STATUS_LABELS).filter(([statusType]) => !['Sent to Bank', 'Need More Info', 'Ready for Bank'].includes(statusType)).map(([statusType, statusInfo]) => {
                      const StatusIcon = statusInfo.icon;
                      return (
                        <SelectItem 
                          key={statusType} 
                          value={statusType}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium">{statusInfo.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedInAppRoleStatus && advancedEnabled && (
                  <div className="border-2 rounded-lg p-4 bg-gradient-to-br from-background to-muted/30 shadow-sm">
                    <div className="grid grid-cols-3 gap-3">
                      {(['admin', 'manager', 'user'] as const).map((role) => {
                        const pref = inAppRolePreferences.find(
                          (p) => p.status_type === selectedInAppRoleStatus && p.role === role
                        );
                        const RoleIcon = ROLE_LABELS[role].icon;
                        const updateKey = `in-app-role-${selectedInAppRoleStatus}-${role}`;
                        
                        return (
                          <div
                            key={role}
                            className={`flex flex-col gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                              pref?.is_enabled 
                                ? 'bg-primary/5 border-primary/40 shadow-sm' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <RoleIcon className={`h-4 w-4 ${ROLE_LABELS[role].color}`} />
                              <span className="text-xs font-semibold">{ROLE_LABELS[role].label}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              {updating === updateKey && (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              )}
                              <Switch
                                checked={pref?.is_enabled || false}
                                onCheckedChange={() => handleInAppRoleToggle(selectedInAppRoleStatus, role, pref?.is_enabled || false)}
                                disabled={updating === updateKey || !advancedEnabled}
                                className="ml-auto"
                              />
                            </div>
                            <Badge 
                              variant={pref?.is_enabled ? "default" : "secondary"}
                              className="text-[10px] w-full justify-center"
                            >
                              {pref?.is_enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* User-Specific In-App */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="text-sm font-semibold">User-Specific Configuration</h4>
                </div>
                <Select 
                  value={selectedInAppUserStatus} 
                  onValueChange={setSelectedInAppUserStatus}
                  disabled={!advancedEnabled}
                >
                  <SelectTrigger className="w-full border-2 h-11 bg-background">
                    <SelectValue placeholder="Select status type to configure" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 z-50">
                    {Object.entries(STATUS_LABELS).filter(([statusType]) => !['Sent to Bank', 'Need More Info', 'Ready for Bank'].includes(statusType)).map(([statusType, statusInfo]) => {
                      const StatusIcon = statusInfo.icon;
                      const userPrefs = inAppUserPreferences.filter((p) => p.status_type === statusType);
                      return (
                        <SelectItem 
                          key={statusType} 
                          value={statusType}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <span className="font-medium">{statusInfo.label}</span>
                            </div>
                            {userPrefs.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {userPrefs.length}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedInAppUserStatus && advancedEnabled && (
                  <div className="border-2 rounded-lg p-4 bg-gradient-to-br from-background to-muted/30 shadow-sm">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {profiles.map((profile) => {
                        const isEnabled = inAppUserPreferences.some(
                          (p) => p.status_type === selectedInAppUserStatus && p.user_id === profile.id
                        );
                        const updateKey = `in-app-user-${selectedInAppUserStatus}-${profile.id}`;
                        const RoleIcon = ROLE_LABELS[profile.role]?.icon;
                        
                        return (
                          <div
                            key={profile.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                              isEnabled 
                                ? 'bg-primary/5 border-primary/40 shadow-sm' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <RoleIcon className={`h-4 w-4 flex-shrink-0 ${ROLE_LABELS[profile.role]?.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{profile.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{profile.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {updating === updateKey && (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              )}
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => handleInAppUserToggle(selectedInAppUserStatus, profile.id, isEnabled)}
                                disabled={updating === updateKey || !advancedEnabled}
                              />
                              <Badge 
                                variant={isEnabled ? "default" : "secondary"}
                                className="text-[10px] min-w-[50px] justify-center"
                              >
                                {isEnabled ? 'On' : 'Off'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
