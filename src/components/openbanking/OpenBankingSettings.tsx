import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Bell, 
  Globe, 
  Key, 
  RefreshCw, 
  Building2,
  Lock,
  Eye,
  Languages,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface Props {
  demoMode: boolean;
}

const OpenBankingSettings: React.FC<Props> = ({ demoMode }) => {
  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Lean Technologies Integration
          </CardTitle>
          <CardDescription>Configure your Open Banking API connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select defaultValue="sandbox">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Status</Label>
              <div className="flex items-center gap-2 h-10">
                <Badge className="bg-emerald-500 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">Last ping: 2 seconds ago</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>App Token</Label>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value="lean_app_token_xxxxxxxxxxxxx" 
                readOnly 
                className="font-mono"
              />
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline">Regenerate</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Webhook URL</p>
              <p className="text-sm text-muted-foreground font-mono">
                https://api.yourdomain.com/webhooks/lean
              </p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Settings
          </CardTitle>
          <CardDescription>Configure automatic transaction syncing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-sync Transactions</Label>
              <p className="text-sm text-muted-foreground">Automatically fetch new transactions</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Sync Frequency</Label>
              <p className="text-sm text-muted-foreground">How often to check for new transactions</p>
            </div>
            <Select defaultValue="hourly">
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="15min">Every 15 mins</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-categorize</Label>
              <p className="text-sm text-muted-foreground">Use AI to categorize new transactions</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-match Invoices</Label>
              <p className="text-sm text-muted-foreground">Automatically match transactions to invoices</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Large Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when transaction exceeds threshold</p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue="10000" 
                className="w-[120px]"
              />
              <span className="text-sm text-muted-foreground">AED</span>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Unmatched Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">Daily summary of pending reconciliations</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Low Balance Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when account falls below threshold</p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue="5000" 
                className="w-[120px]"
              />
              <span className="text-sm text-muted-foreground">AED</span>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Consent Expiry Reminders</Label>
              <p className="text-sm text-muted-foreground">Remind before bank consent expires</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Notification Channels</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" className="justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                Email
              </Button>
              <Button variant="outline" className="justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                In-App
              </Button>
              <Button variant="outline" className="justify-start text-muted-foreground">
                SMS
              </Button>
              <Button variant="outline" className="justify-start text-muted-foreground">
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>UAE data protection and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for sensitive operations</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Log all financial operations</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium">Compliance Status</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Your setup complies with UAE Central Bank Open Banking regulations and PDPL data protection requirements.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    UAE Central Bank Compliant
                  </Badge>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    PDPL Compliant
                  </Badge>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    PCI DSS Level 1
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>Language and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency Display</Label>
              <Select defaultValue="aed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aed">AED - UAE Dirham</SelectItem>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="dd-mm-yyyy">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue="gst">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gst">GST (UTC+4) - Dubai</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for assistance with Open Banking integration
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                View Documentation
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button>Contact Support</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenBankingSettings;
