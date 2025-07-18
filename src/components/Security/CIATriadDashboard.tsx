
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Eye, Lock, Server, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

const CIATriadDashboard: React.FC = () => {
  const [confidentialityMetrics, setConfidentialityMetrics] = useState<SecurityMetric[]>([
    { name: 'Data Encryption', score: 95, status: 'excellent', description: 'All sensitive data encrypted at rest and in transit' },
    { name: 'Access Controls', score: 88, status: 'good', description: 'Role-based access control implemented' },
    { name: 'Authentication', score: 92, status: 'excellent', description: 'Multi-factor authentication enforced' }
  ]);

  const [integrityMetrics, setIntegrityMetrics] = useState<SecurityMetric[]>([
    { name: 'Data Validation', score: 90, status: 'excellent', description: 'Input validation and sanitization active' },
    { name: 'Audit Logging', score: 85, status: 'good', description: 'Comprehensive audit trail maintained' },
    { name: 'Checksums', score: 88, status: 'good', description: 'Data integrity verification in place' }
  ]);

  const [availabilityMetrics, setAvailabilityMetrics] = useState<SecurityMetric[]>([
    { name: 'System Uptime', score: 99.9, status: 'excellent', description: 'High availability maintained' },
    { name: 'Backup Systems', score: 95, status: 'excellent', description: 'Regular automated backups' },
    { name: 'DDoS Protection', score: 87, status: 'good', description: 'Protection mechanisms active' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateOverallScore = (metrics: SecurityMetric[]) => {
    return metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidentiality */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <CardTitle>Confidentiality</CardTitle>
            </div>
            <CardDescription>
              Protection of sensitive information from unauthorized access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateOverallScore(confidentialityMetrics).toFixed(1)}%
                </span>
              </div>
              <Progress value={calculateOverallScore(confidentialityMetrics)} className="w-full" />
              
              {confidentialityMetrics.map((metric, index) => (
                <div key={`confidentiality-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrity */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-green-600" />
              <CardTitle>Integrity</CardTitle>
            </div>
            <CardDescription>
              Ensuring data accuracy and preventing unauthorized modifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold text-green-600">
                  {calculateOverallScore(integrityMetrics).toFixed(1)}%
                </span>
              </div>
              <Progress value={calculateOverallScore(integrityMetrics)} className="w-full" />
              
              {integrityMetrics.map((metric, index) => (
                <div key={`integrity-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-purple-600" />
              <CardTitle>Availability</CardTitle>
            </div>
            <CardDescription>
              Ensuring systems and data are accessible when needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold text-purple-600">
                  {calculateOverallScore(availabilityMetrics).toFixed(1)}%
                </span>
              </div>
              <Progress value={calculateOverallScore(availabilityMetrics)} className="w-full" />
              
              {availabilityMetrics.map((metric, index) => (
                <div key={`availability-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall CIA Security Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>Overall CIA Triad Security Score</CardTitle>
          </div>
          <CardDescription>
            Combined assessment of Confidentiality, Integrity, and Availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {((calculateOverallScore(confidentialityMetrics) + 
                   calculateOverallScore(integrityMetrics) + 
                   calculateOverallScore(availabilityMetrics)) / 3).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calculateOverallScore(confidentialityMetrics).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Confidentiality</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calculateOverallScore(integrityMetrics).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Integrity</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calculateOverallScore(availabilityMetrics).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Availability</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CIATriadDashboard;
