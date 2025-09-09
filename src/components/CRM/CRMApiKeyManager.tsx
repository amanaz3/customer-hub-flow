import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Key, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { crmService } from '@/services/crmService';
import type { CRMApiKey } from '@/types/crm';

interface CRMApiKeyManagerProps {
  apiKeys: CRMApiKey[];
  onRefresh: () => void;
}

export const CRMApiKeyManager: React.FC<CRMApiKeyManagerProps> = ({
  apiKeys,
  onRefresh
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please provide a key name');
      return;
    }

    try {
      setLoading(true);
      const response = await crmService.createApiKey(keyName, ['read', 'write']);
      setNewApiKey(response.data.key || null);
      toast.success('API key created successfully');
      onRefresh();
      setKeyName('');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateKey = async (keyId: string) => {
    try {
      await crmService.deactivateApiKey(keyId);
      toast.success('API key deactivated');
      onRefresh();
    } catch (error) {
      console.error('Error deactivating API key:', error);
      toast.error('Failed to deactivate API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewApiKey(null);
    setKeyName('');
    setShowKey(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage API keys for external CRM system access
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys</h3>
              <p className="text-muted-foreground mb-4">
                Create API keys for external CRM systems to access your data
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First API Key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div className="font-medium">{key.key_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {key.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {key.last_used_at 
                            ? new Date(key.last_used_at).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(key.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateKey(key.id)}
                          disabled={!key.is_active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for external CRM system access
            </DialogDescription>
          </DialogHeader>

          {newApiKey ? (
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Your API key has been created. Copy it now as it won't be shown again.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={newApiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newApiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Usage Instructions:</strong>
                  <br />
                  Include this key in the <code>x-crm-api-key</code> header when making requests to:
                  <br />
                  <code>https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1/crm-api-partners</code>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production CRM, HubSpot Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              <Alert>
                <AlertDescription>
                  This API key will have read and write permissions for partner and application data.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCreateDialog}
            >
              {newApiKey ? 'Close' : 'Cancel'}
            </Button>
            {!newApiKey && (
              <Button
                onClick={handleCreateKey}
                disabled={loading || !keyName.trim()}
              >
                {loading ? 'Creating...' : 'Create API Key'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};