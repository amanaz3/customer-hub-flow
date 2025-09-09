import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CRMConnectRequest } from '@/types/crm';

interface CRMConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (config: CRMConnectRequest) => Promise<void>;
}

export const CRMConnectDialog: React.FC<CRMConnectDialogProps> = ({
  open,
  onOpenChange,
  onConnect
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CRMConnectRequest>({
    name: '',
    crm_type: '',
    api_endpoint: '',
    api_key: '',
    webhook_secret: '',
    field_mappings: {},
    sync_settings: {}
  });

  const crmTypes = [
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'salesforce', label: 'Salesforce' },
    { value: 'pipedrive', label: 'Pipedrive' },
    { value: 'zoho', label: 'Zoho CRM' },
    { value: 'custom', label: 'Custom API' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.crm_type || !formData.api_endpoint || !formData.api_key) {
      return;
    }

    try {
      setLoading(true);
      await onConnect(formData);
      setFormData({
        name: '',
        crm_type: '',
        api_endpoint: '',
        api_key: '',
        webhook_secret: '',
        field_mappings: {},
        sync_settings: {}
      });
    } catch (error) {
      console.error('Error connecting CRM:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEndpointPlaceholder = () => {
    switch (formData.crm_type) {
      case 'hubspot':
        return 'https://api.hubapi.com';
      case 'salesforce':
        return 'https://your-instance.salesforce.com';
      case 'pipedrive':
        return 'https://your-company.pipedrive.com/api/v1';
      case 'zoho':
        return 'https://www.zohoapis.com/crm/v2';
      default:
        return 'https://api.your-crm.com';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect CRM System</DialogTitle>
          <DialogDescription>
            Add a new CRM system to sync customer and application data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
              <CardDescription>
                Configure the basic connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    placeholder="My CRM System"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm_type">CRM Type</Label>
                  <Select
                    value={formData.crm_type}
                    onValueChange={(value) => setFormData({ ...formData, crm_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CRM type" />
                    </SelectTrigger>
                    <SelectContent>
                      {crmTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_endpoint">API Endpoint</Label>
                <Input
                  id="api_endpoint"
                  type="url"
                  placeholder={getEndpointPlaceholder()}
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  placeholder="Optional webhook secret for security"
                  value={formData.webhook_secret}
                  onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Configuration</CardTitle>
              <CardDescription>
                Configure field mappings and sync settings (JSON format)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field_mappings">Field Mappings</Label>
                <Textarea
                  id="field_mappings"
                  placeholder='{"customer_name": "contact_name", "email": "email_address"}'
                  value={JSON.stringify(formData.field_mappings, null, 2)}
                  onChange={(e) => {
                    try {
                      const mappings = JSON.parse(e.target.value);
                      setFormData({ ...formData, field_mappings: mappings });
                    } catch {
                      // Invalid JSON, keep current value
                    }
                  }}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync_settings">Sync Settings</Label>
                <Textarea
                  id="sync_settings"
                  placeholder='{"sync_interval": "hourly", "batch_size": 100}'
                  value={JSON.stringify(formData.sync_settings, null, 2)}
                  onChange={(e) => {
                    try {
                      const settings = JSON.parse(e.target.value);
                      setFormData({ ...formData, sync_settings: settings });
                    } catch {
                      // Invalid JSON, keep current value
                    }
                  }}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect CRM'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
