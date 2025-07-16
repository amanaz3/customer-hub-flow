
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import CIATriadDashboard from '@/components/Security/CIATriadDashboard';
import SecurityCompliance from '@/components/Security/SecurityCompliance';
import SecurityAuditLog from '@/components/Security/SecurityAuditLog';

const Security: React.FC = () => {
  return (
    <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">Security Center</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive security monitoring based on CIA Triad principles
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">CIA Triad Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CIATriadDashboard />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <SecurityCompliance />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <SecurityAuditLog />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

export default Security;
