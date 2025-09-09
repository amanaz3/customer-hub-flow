import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RotateCw, Key, Webhook, Settings, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { crmService } from '@/services/crmService';
import type { CRMConfiguration, CRMSyncLog, CRMApiKey } from '@/types/crm';
import { CRMConnectDialog } from './CRMConnectDialog';
import { CRMSyncHistory } from './CRMSyncHistory';
import { CRMApiKeyManager } from './CRMApiKeyManager';

export const CRMIntegrationDashboard: React.FC = () => {
  const [configurations, setConfigurations] = useState<CRMConfiguration[]>([]);
  const [syncLogs, setSyncLogs] = useState<CRMSyncLog[]>([]);
  const [apiKeys, setApiKeys] = useState<CRMApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configsData, syncData, keysData] = await Promise.all([
        crmService.getCRMStatus(),
        crmService.getSyncHistory(1, 10),
        crmService.getApiKeys()
      ]);

      setConfigurations(configsData.data);
      setSyncLogs(syncData.data);
      setApiKeys(keysData.data);
    } catch (error) {
      console.error('Error loading CRM data:', error);
      toast.error('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (config: any) => {
    try {
      await crmService.connectCRM(config);
      toast.success('CRM connected successfully');
      setConnectDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error connecting CRM:', error);
      toast.error('Failed to connect CRM');
    }
  };

  const handleSync = async (configId: string, entityType: 'partners' | 'applications' | 'customers') => {
    try {
      await crmService.triggerSync({
        crm_config_id: configId,
        sync_type: 'manual',
        entity_type: entityType
      });
      toast.success('Sync triggered successfully');
      loadData();
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to trigger sync');
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const getSyncStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      error: 'destructive' as const,
      pending: 'secondary' as const
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Integration</h1>
          <p className="text-muted-foreground">
            Manage external CRM connections and data synchronization
          </p>
        </div>
        <Button onClick={() => setConnectDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect CRM
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configurations.length}</div>
            <p className="text-xs text-muted-foreground">
              CRM systems connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              Active API keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Syncs</CardTitle>
            <RotateCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Sync operations today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncLogs.length > 0 
                ? Math.round((syncLogs.filter(log => log.status === 'success').length / syncLogs.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful sync operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CRM Connections</CardTitle>
              <CardDescription>
                Manage your external CRM system connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configurations.length === 0 ? (
                <div className="text-center py-8">
                  <Webhook className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No CRM connections</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your first CRM system to start syncing data
                  </p>
                  <Button onClick={() => setConnectDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect CRM
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {configurations.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.name}</h4>
                          {getStatusBadge(config.is_active)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {config.crm_type} • {config.api_endpoint}
                        </p>
                        {config.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(config.last_sync_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(config.id, 'partners')}
                        >
                          <RotateCw className="mr-2 h-4 w-4" />
                          Sync Partners
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(config.id, 'applications')}
                        >
                          <RotateCw className="mr-2 h-4 w-4" />
                          Sync Applications
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-history">
          <CRMSyncHistory syncLogs={syncLogs} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="api-keys">
          <CRMApiKeyManager apiKeys={apiKeys} onRefresh={loadData} />
        </TabsContent>
      </Tabs>

      <CRMConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onConnect={handleConnect}
      />
    </div>
  );
};