
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users, 
  Database,
  Network
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastChecked: string;
  category: 'confidentiality' | 'integrity' | 'availability';
}

const SecurityCompliance: React.FC = () => {
  const [complianceItems] = useState<ComplianceItem[]>([
    {
      id: '1',
      title: 'Data Encryption at Rest',
      description: 'All sensitive data must be encrypted using AES-256 encryption',
      status: 'compliant',
      lastChecked: '2024-01-15',
      category: 'confidentiality'
    },
    {
      id: '2',
      title: 'Access Control Matrix',
      description: 'Role-based access controls implemented and regularly reviewed',
      status: 'compliant',
      lastChecked: '2024-01-14',
      category: 'confidentiality'
    },
    {
      id: '3',
      title: 'Data Backup Procedures',
      description: 'Regular automated backups with integrity verification',
      status: 'compliant',
      lastChecked: '2024-01-15',
      category: 'availability'
    },
    {
      id: '4',
      title: 'Audit Trail Completeness',
      description: 'All user actions and system changes are logged',
      status: 'partial',
      lastChecked: '2024-01-13',
      category: 'integrity'
    },
    {
      id: '5',
      title: 'Incident Response Plan',
      description: 'Documented procedures for security incident handling',
      status: 'compliant',
      lastChecked: '2024-01-12',
      category: 'availability'
    },
    {
      id: '6',
      title: 'Data Validation Controls',
      description: 'Input validation and sanitization mechanisms',
      status: 'compliant',
      lastChecked: '2024-01-15',
      category: 'integrity'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'confidentiality':
        return <Users className="h-4 w-4" />;
      case 'integrity':
        return <Database className="h-4 w-4" />;
      case 'availability':
        return <Network className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const filterByCategory = (category: string) => {
    return complianceItems.filter(item => item.category === category);
  };

  const getComplianceStats = () => {
    const total = complianceItems.length;
    const compliant = complianceItems.filter(item => item.status === 'compliant').length;
    const partial = complianceItems.filter(item => item.status === 'partial').length;
    
    return {
      total,
      compliant,
      partial,
      percentage: Math.round((compliant / total) * 100)
    };
  };

  const stats = getComplianceStats();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>CIA Triad Compliance Overview</CardTitle>
          </div>
          <CardDescription>
            Security compliance status across all CIA Triad components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.percentage}%</div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
              <div className="text-sm text-muted-foreground">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Details by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="confidentiality">Confidentiality</TabsTrigger>
          <TabsTrigger value="integrity">Integrity</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {complianceItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{item.title}</h3>
                        {getCategoryIcon(item.category)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last checked: {new Date(item.lastChecked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="confidentiality" className="space-y-4">
          {filterByCategory('confidentiality').map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last checked: {new Date(item.lastChecked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          {filterByCategory('integrity').map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last checked: {new Date(item.lastChecked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          {filterByCategory('availability').map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last checked: {new Date(item.lastChecked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityCompliance;
