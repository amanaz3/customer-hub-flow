import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Plus, Trash2, Edit2, Settings, CalendarIcon, AlertTriangle, Check, X, Users, Lock, AlertCircle, Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/SecureAuthContext";

type ConflictStrategy = 'user_overrides_role' | 'most_restrictive' | 'most_permissive' | 'admin_review';
type ExpiryBehavior = 'auto_revoke_silent' | 'auto_revoke_notify' | 'flag_for_review';

interface AccessPermission {
  id: string;
  user_id: string | null;
  role: string | null;
  page_key: string;
  feature_key: string | null;
  is_allowed: boolean;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
  is_sensitive: boolean;
  created_at: string;
  user_name?: string;
}

interface AccessSettings {
  id: string;
  conflict_strategy: ConflictStrategy;
  expiry_behavior: ExpiryBehavior;
}

interface ConflictGroup {
  pageKey: string;
  featureKey: string | null;
  userId: string;
  userName: string;
  userPermission: AccessPermission;
  rolePermission: AccessPermission;
}

// Define sensitive pages
const SENSITIVE_PAGES = [
  { key: 'configure', label: 'Configure', sensitive: true, enabled: true },
  { key: 'legacy', label: 'Sandbox', sensitive: true, enabled: true },
  { key: 'dev-tools', label: 'DevTools', sensitive: true, enabled: true },
  { key: 'users', label: 'User Management', sensitive: true, enabled: true },
  { key: 'access-management', label: 'Access Management', sensitive: true, enabled: true },
];

const ALL_PAGES_DEFAULT = [
  ...SENSITIVE_PAGES,
  { key: 'dashboard', label: 'Dashboard', sensitive: false, enabled: true },
  { key: 'applications', label: 'Applications', sensitive: false, enabled: true },
  { key: 'customers', label: 'Customers', sensitive: false, enabled: true },
  { key: 'leads', label: 'Leads', sensitive: false, enabled: true },
  { key: 'tracker', label: 'Tracker', sensitive: false, enabled: true },
  { key: 'analytics', label: 'Analytics', sensitive: false, enabled: true },
  { key: 'products', label: 'Products', sensitive: false, enabled: true },
  { key: 'service-fees', label: 'Service Fees', sensitive: false, enabled: true },
  { key: 'playbook-editor', label: 'Playbook Editor', sensitive: false, enabled: true },
];

const PAGE_FEATURES_DEFAULT: Record<string, { key: string; label: string; enabled: boolean }[]> = {
  'applications': [
    { key: 'bulk_delete', label: 'Bulk Delete', enabled: true },
    { key: 'export', label: 'Export Data', enabled: true },
    { key: 'reassign', label: 'Reassign Applications', enabled: true },
  ],
  'customers': [
    { key: 'bulk_delete', label: 'Bulk Delete', enabled: true },
    { key: 'export', label: 'Export Data', enabled: true },
    { key: 'archive', label: 'Archive Customers', enabled: true },
  ],
  'leads': [
    { key: 'import', label: 'Import Leads', enabled: true },
    { key: 'export', label: 'Export Leads', enabled: true },
    { key: 'bulk_reassign', label: 'Bulk Reassign', enabled: true },
  ],
};

const AccessManagement = () => {
  const { isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [settings, setSettings] = useState<AccessSettings | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showScopeConfigDialog, setShowScopeConfigDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<AccessPermission | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'sensitive' | 'conflicts'>('all');
  const [selectedConflict, setSelectedConflict] = useState<ConflictGroup | null>(null);

  // Scope configuration (pages and features that can be controlled)
  const [enabledPages, setEnabledPages] = useState<string[]>(ALL_PAGES_DEFAULT.map(p => p.key));
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, string[]>>(() => {
    const features: Record<string, string[]> = {};
    Object.entries(PAGE_FEATURES_DEFAULT).forEach(([page, feats]) => {
      features[page] = feats.map(f => f.key);
    });
    return features;
  });

  // Form state
  const [formData, setFormData] = useState({
    assignmentType: 'user' as 'user' | 'role',
    userId: '',
    role: '',
    pageKey: '',
    featureKey: '',
    isAllowed: true,
    startDate: null as Date | null,
    endDate: null as Date | null,
    reason: '',
  });

  // Filtered pages and features based on enabled config
  const ALL_PAGES = useMemo(() => 
    ALL_PAGES_DEFAULT.filter(p => enabledPages.includes(p.key)),
    [enabledPages]
  );

  const PAGE_FEATURES = useMemo(() => {
    const result: Record<string, { key: string; label: string }[]> = {};
    Object.entries(PAGE_FEATURES_DEFAULT).forEach(([page, feats]) => {
      if (enabledFeatures[page]) {
        result[page] = feats.filter(f => enabledFeatures[page].includes(f.key));
      }
    });
    return result;
  }, [enabledFeatures]);

  // Detect conflicts: same user has both user-level and role-level permissions for same page/feature
  const conflicts = useMemo(() => {
    const conflictGroups: ConflictGroup[] = [];
    
    // Get all user-level permissions
    const userPerms = permissions.filter(p => p.user_id);
    
    // For each user permission, check if there's a conflicting role permission
    userPerms.forEach(userPerm => {
      const user = users.find(u => u.id === userPerm.user_id);
      if (!user) return;
      
      // Find role permissions that apply to this user's role
      const rolePerms = permissions.filter(p => 
        p.role === user.role && 
        p.page_key === userPerm.page_key &&
        p.feature_key === userPerm.feature_key &&
        p.is_allowed !== userPerm.is_allowed // Only conflicts if different access level
      );
      
      rolePerms.forEach(rolePerm => {
        conflictGroups.push({
          pageKey: userPerm.page_key,
          featureKey: userPerm.feature_key,
          userId: userPerm.user_id!,
          userName: user.name,
          userPermission: userPerm,
          rolePermission: rolePerm
        });
      });
    });
    
    return conflictGroups;
  }, [permissions, users]);

  useEffect(() => {
    fetchData();
    loadScopeConfig();
  }, []);

  const loadScopeConfig = () => {
    // Load from localStorage for now (could be moved to DB)
    const savedPages = localStorage.getItem('access_enabled_pages');
    const savedFeatures = localStorage.getItem('access_enabled_features');
    if (savedPages) setEnabledPages(JSON.parse(savedPages));
    if (savedFeatures) setEnabledFeatures(JSON.parse(savedFeatures));
  };

  const saveScopeConfig = () => {
    localStorage.setItem('access_enabled_pages', JSON.stringify(enabledPages));
    localStorage.setItem('access_enabled_features', JSON.stringify(enabledFeatures));
    toast.success('Scope configuration saved');
    setShowScopeConfigDialog(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: permissionsData, error: permError } = await supabase
        .from('access_permissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (permError) throw permError;

      const { data: settingsData, error: settingsError } = await supabase
        .from('access_management_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('is_active', true);
      
      if (usersError) throw usersError;

      const enrichedPermissions = (permissionsData || []).map(perm => ({
        ...perm,
        user_name: usersData?.find(u => u.id === perm.user_id)?.name || perm.user_id
      }));

      setPermissions(enrichedPermissions);
      setSettings(settingsData);
      setUsers(usersData || []);
    } catch (error: any) {
      toast.error('Failed to load access data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermission = async () => {
    try {
      const roleValue = formData.assignmentType === 'role' ? formData.role as 'admin' | 'manager' | 'user' : null;
      
      const payload = {
        user_id: formData.assignmentType === 'user' ? formData.userId : null,
        role: roleValue,
        page_key: formData.pageKey,
        feature_key: formData.featureKey || null,
        is_allowed: formData.isAllowed,
        start_date: formData.startDate?.toISOString() || null,
        end_date: formData.endDate?.toISOString() || null,
        reason: formData.reason || null,
        is_sensitive: SENSITIVE_PAGES.some(p => p.key === formData.pageKey),
      };

      if (editingPermission) {
        const { error } = await supabase
          .from('access_permissions')
          .update(payload)
          .eq('id', editingPermission.id);
        if (error) throw error;
        toast.success('Permission updated');
      } else {
        const { error } = await supabase
          .from('access_permissions')
          .insert([payload]);
        if (error) throw error;
        toast.success('Permission added');
      }

      setShowAddDialog(false);
      setEditingPermission(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save permission: ' + error.message);
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_permissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Permission deleted');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete permission: ' + error.message);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      const { error } = await supabase
        .from('access_management_settings')
        .update({
          conflict_strategy: settings.conflict_strategy,
          expiry_behavior: settings.expiry_behavior,
        })
        .eq('id', settings.id);
      if (error) throw error;
      toast.success('Settings saved');
      setShowSettingsDialog(false);
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    }
  };

  const handleResolveConflict = async (resolution: 'keep_user' | 'keep_role' | 'allow' | 'deny') => {
    if (!selectedConflict) return;
    
    try {
      if (resolution === 'keep_user') {
        // Delete the role permission
        await supabase.from('access_permissions').delete().eq('id', selectedConflict.rolePermission.id);
        toast.success('Kept user-level permission, removed role-level');
      } else if (resolution === 'keep_role') {
        // Delete the user permission
        await supabase.from('access_permissions').delete().eq('id', selectedConflict.userPermission.id);
        toast.success('Kept role-level permission, removed user-level');
      } else if (resolution === 'allow' || resolution === 'deny') {
        // Update both to the same value
        const isAllowed = resolution === 'allow';
        await Promise.all([
          supabase.from('access_permissions').update({ is_allowed: isAllowed }).eq('id', selectedConflict.userPermission.id),
          supabase.from('access_permissions').update({ is_allowed: isAllowed }).eq('id', selectedConflict.rolePermission.id),
        ]);
        toast.success(`Set both permissions to ${resolution}`);
      }
      
      setShowConflictDialog(false);
      setSelectedConflict(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to resolve conflict: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      assignmentType: 'user',
      userId: '',
      role: '',
      pageKey: '',
      featureKey: '',
      isAllowed: true,
      startDate: null,
      endDate: null,
      reason: '',
    });
  };

  const openEditDialog = (permission: AccessPermission) => {
    setEditingPermission(permission);
    setFormData({
      assignmentType: permission.user_id ? 'user' : 'role',
      userId: permission.user_id || '',
      role: permission.role || '',
      pageKey: permission.page_key,
      featureKey: permission.feature_key || '',
      isAllowed: permission.is_allowed,
      startDate: permission.start_date ? new Date(permission.start_date) : null,
      endDate: permission.end_date ? new Date(permission.end_date) : null,
      reason: permission.reason || '',
    });
    setShowAddDialog(true);
  };

  const openConflictReview = (conflict: ConflictGroup) => {
    setSelectedConflict(conflict);
    setShowConflictDialog(true);
  };

  const filteredPermissions = scopeFilter === 'sensitive' 
    ? permissions.filter(p => p.is_sensitive)
    : scopeFilter === 'conflicts'
    ? permissions.filter(p => conflicts.some(c => c.userPermission.id === p.id || c.rolePermission.id === p.id))
    : permissions;

  const getPageLabel = (key: string) => ALL_PAGES_DEFAULT.find(p => p.key === key)?.label || key;
  const getFeatureLabel = (pageKey: string, featureKey: string) => 
    PAGE_FEATURES_DEFAULT[pageKey]?.find(f => f.key === featureKey)?.label || featureKey;

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Access Management</h1>
            <p className="text-muted-foreground">Manage granular access to pages and features</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScopeConfigDialog(true)}>
            <Sliders className="h-4 w-4 mr-2" />
            Configure Scope
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => { resetForm(); setEditingPermission(null); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        </div>
      </div>

      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-amber-700">
                  {conflicts.length} Permission Conflict{conflicts.length !== 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  Some users have conflicting user-level and role-level permissions. Review and resolve them.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScopeFilter('conflicts')}>
                Review Conflicts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope Filter */}
      <Tabs value={scopeFilter} onValueChange={(v) => setScopeFilter(v as 'all' | 'sensitive' | 'conflicts')}>
        <TabsList>
          <TabsTrigger value="all">All Pages</TabsTrigger>
          <TabsTrigger value="sensitive">
            <Lock className="h-4 w-4 mr-1" />
            Sensitive Only
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="relative">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Conflicts
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {conflicts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={scopeFilter} className="mt-4">
          {scopeFilter === 'conflicts' && conflicts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permission Conflicts</CardTitle>
                <CardDescription>
                  Users with conflicting access rules. Click to review and resolve.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conflicts.map((conflict, idx) => (
                    <div 
                      key={idx}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => openConflictReview(conflict)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium">{conflict.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {getPageLabel(conflict.pageKey)}
                              {conflict.featureKey && ` → ${getFeatureLabel(conflict.pageKey, conflict.featureKey)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={conflict.userPermission.is_allowed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                            User: {conflict.userPermission.is_allowed ? 'Allow' : 'Deny'}
                          </Badge>
                          <span className="text-muted-foreground">vs</span>
                          <Badge className={conflict.rolePermission.is_allowed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                            Role: {conflict.rolePermission.is_allowed ? 'Allow' : 'Deny'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Permissions</CardTitle>
                <CardDescription>
                  {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : filteredPermissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {scopeFilter === 'conflicts' 
                      ? 'No conflicts detected. All permissions are consistent.'
                      : 'No permissions configured. Click "Add Permission" to create one.'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Feature</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Time Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissions.map((perm) => {
                        const isExpired = perm.end_date && new Date(perm.end_date) < new Date();
                        const isActive = !perm.start_date || new Date(perm.start_date) <= new Date();
                        const hasConflict = conflicts.some(c => c.userPermission.id === perm.id || c.rolePermission.id === perm.id);
                        return (
                          <TableRow key={perm.id} className={hasConflict ? 'bg-amber-500/5' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasConflict && <AlertCircle className="h-4 w-4 text-amber-500" />}
                                {perm.user_id ? (
                                  <>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{perm.user_name}</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="outline">{perm.role}</Badge>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {perm.is_sensitive && <Lock className="h-3 w-3 text-amber-500" />}
                                {getPageLabel(perm.page_key)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {perm.feature_key ? getFeatureLabel(perm.page_key, perm.feature_key) : '-'}
                            </TableCell>
                            <TableCell>
                              {perm.is_allowed ? (
                                <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                                  <Check className="h-3 w-3 mr-1" /> Allowed
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" /> Denied
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {perm.start_date || perm.end_date ? (
                                <span className="text-sm">
                                  {perm.start_date && format(new Date(perm.start_date), 'MMM d, yyyy')}
                                  {perm.start_date && perm.end_date && ' - '}
                                  {perm.end_date && format(new Date(perm.end_date), 'MMM d, yyyy')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Permanent</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="outline" className="text-red-500 border-red-500/30">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Expired
                                </Badge>
                              ) : isActive ? (
                                <Badge variant="outline" className="text-green-600 border-green-500/30">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline">Scheduled</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(perm)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeletePermission(perm.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Permission Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPermission ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
            <DialogDescription>Configure access for a user or role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={formData.assignmentType} onValueChange={(v) => setFormData({ ...formData, assignmentType: v as 'user' | 'role' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Specific User</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.assignmentType === 'user' ? (
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Page</Label>
              <Select value={formData.pageKey} onValueChange={(v) => setFormData({ ...formData, pageKey: v, featureKey: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PAGES.map(p => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.sensitive && <Lock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.pageKey && PAGE_FEATURES[formData.pageKey] && PAGE_FEATURES[formData.pageKey].length > 0 && (
              <div className="space-y-2">
                <Label>Feature (Optional)</Label>
                <Select value={formData.featureKey} onValueChange={(v) => setFormData({ ...formData, featureKey: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All features</SelectItem>
                    {PAGE_FEATURES[formData.pageKey].map(f => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Allow Access</Label>
              <Switch 
                checked={formData.isAllowed} 
                onCheckedChange={(v) => setFormData({ ...formData, isAllowed: v })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={formData.startDate || undefined} 
                      onSelect={(d) => setFormData({ ...formData, startDate: d || null })} 
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={formData.endDate || undefined} 
                      onSelect={(d) => setFormData({ ...formData, endDate: d || null })} 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input 
                value={formData.reason} 
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Why is this permission being set?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePermission} disabled={!formData.pageKey || (formData.assignmentType === 'user' ? !formData.userId : !formData.role)}>
              {editingPermission ? 'Update' : 'Add'} Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Permission Conflict</DialogTitle>
            <DialogDescription>
              {selectedConflict && (
                <>
                  <span className="font-medium">{selectedConflict.userName}</span> has conflicting permissions for{' '}
                  <span className="font-medium">{getPageLabel(selectedConflict.pageKey)}</span>
                  {selectedConflict.featureKey && <> → {getFeatureLabel(selectedConflict.pageKey, selectedConflict.featureKey)}</>}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConflict && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className={`p-3 ${selectedConflict.userPermission.is_allowed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className="text-sm font-medium mb-1">User-Level</p>
                  <Badge className={selectedConflict.userPermission.is_allowed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                    {selectedConflict.userPermission.is_allowed ? 'Allow' : 'Deny'}
                  </Badge>
                  {selectedConflict.userPermission.reason && (
                    <p className="text-xs text-muted-foreground mt-2">{selectedConflict.userPermission.reason}</p>
                  )}
                </Card>
                <Card className={`p-3 ${selectedConflict.rolePermission.is_allowed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className="text-sm font-medium mb-1">Role-Level ({selectedConflict.rolePermission.role})</p>
                  <Badge className={selectedConflict.rolePermission.is_allowed ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                    {selectedConflict.rolePermission.is_allowed ? 'Allow' : 'Deny'}
                  </Badge>
                  {selectedConflict.rolePermission.reason && (
                    <p className="text-xs text-muted-foreground mt-2">{selectedConflict.rolePermission.reason}</p>
                  )}
                </Card>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">How would you like to resolve this conflict?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleResolveConflict('keep_user')} className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Keep User-Level</p>
                      <p className="text-xs text-muted-foreground">Remove role permission</p>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={() => handleResolveConflict('keep_role')} className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Keep Role-Level</p>
                      <p className="text-xs text-muted-foreground">Remove user permission</p>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={() => handleResolveConflict('allow')} className="h-auto py-3 border-green-500/30 hover:bg-green-500/10">
                    <div className="text-left">
                      <Check className="h-4 w-4 text-green-600 mb-1" />
                      <p className="font-medium">Allow Both</p>
                      <p className="text-xs text-muted-foreground">Set both to allow</p>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={() => handleResolveConflict('deny')} className="h-auto py-3 border-red-500/30 hover:bg-red-500/10">
                    <div className="text-left">
                      <X className="h-4 w-4 text-red-600 mb-1" />
                      <p className="font-medium">Deny Both</p>
                      <p className="text-xs text-muted-foreground">Set both to deny</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Configuration Dialog */}
      <Dialog open={showScopeConfigDialog} onOpenChange={setShowScopeConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Permission Scope</DialogTitle>
            <DialogDescription>
              Select which pages and features can have access permissions configured
            </DialogDescription>
          </DialogHeader>
          
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="pages">
              <AccordionTrigger>Pages ({enabledPages.length} enabled)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_PAGES_DEFAULT.map(page => (
                    <div key={page.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`page-${page.key}`}
                        checked={enabledPages.includes(page.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEnabledPages([...enabledPages, page.key]);
                          } else {
                            setEnabledPages(enabledPages.filter(p => p !== page.key));
                          }
                        }}
                      />
                      <label htmlFor={`page-${page.key}`} className="text-sm flex items-center gap-1 cursor-pointer">
                        {page.sensitive && <Lock className="h-3 w-3 text-amber-500" />}
                        {page.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {Object.entries(PAGE_FEATURES_DEFAULT).map(([pageKey, features]) => (
              <AccordionItem key={pageKey} value={`features-${pageKey}`}>
                <AccordionTrigger>
                  {getPageLabel(pageKey)} Features ({enabledFeatures[pageKey]?.length || 0} enabled)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3">
                    {features.map(feature => (
                      <div key={feature.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${pageKey}-${feature.key}`}
                          checked={enabledFeatures[pageKey]?.includes(feature.key) || false}
                          onCheckedChange={(checked) => {
                            const current = enabledFeatures[pageKey] || [];
                            if (checked) {
                              setEnabledFeatures({
                                ...enabledFeatures,
                                [pageKey]: [...current, feature.key]
                              });
                            } else {
                              setEnabledFeatures({
                                ...enabledFeatures,
                                [pageKey]: current.filter(f => f !== feature.key)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`feature-${pageKey}-${feature.key}`} className="text-sm cursor-pointer">
                          {feature.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScopeConfigDialog(false)}>Cancel</Button>
            <Button onClick={saveScopeConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Management Settings</DialogTitle>
            <DialogDescription>Configure how access conflicts and expiry are handled</DialogDescription>
          </DialogHeader>
          {settings && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Conflict Resolution Strategy</Label>
                <Select 
                  value={settings.conflict_strategy} 
                  onValueChange={(v) => setSettings({ ...settings, conflict_strategy: v as ConflictStrategy })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_overrides_role">User-level overrides Role-level</SelectItem>
                    <SelectItem value="most_restrictive">Most restrictive wins</SelectItem>
                    <SelectItem value="most_permissive">Most permissive wins</SelectItem>
                    <SelectItem value="admin_review">Admin review (user takes precedence)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How to handle when both user and role permissions exist for the same page/feature
                </p>
              </div>

              <div className="space-y-2">
                <Label>Expiry Behavior</Label>
                <Select 
                  value={settings.expiry_behavior} 
                  onValueChange={(v) => setSettings({ ...settings, expiry_behavior: v as ExpiryBehavior })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_revoke_silent">Auto-revoke silently</SelectItem>
                    <SelectItem value="auto_revoke_notify">Auto-revoke with notification</SelectItem>
                    <SelectItem value="flag_for_review">Flag for admin review</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  What happens when a time-limited access permission expires
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessManagement;
