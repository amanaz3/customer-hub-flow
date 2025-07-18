
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Eye, Lock, Server, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';

interface UserSecurityMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastAssessment: string;
}

interface UserCIAData {
  confidentiality: UserSecurityMetric[];
  integrity: UserSecurityMetric[];
  availability: UserSecurityMetric[];
}

const UserCIATriadMetrics: React.FC = () => {
  const { user } = useAuth();
  const [userCIAData, setUserCIAData] = useState<UserCIAData>({
    confidentiality: [
      { name: 'Password Strength', score: 85, status: 'good', lastAssessment: '2024-01-15' },
      { name: 'Session Security', score: 92, status: 'excellent', lastAssessment: '2024-01-15' },
      { name: 'Data Access', score: 88, status: 'good', lastAssessment: '2024-01-14' }
    ],
    integrity: [
      { name: 'Profile Verification', score: 95, status: 'excellent', lastAssessment: '2024-01-15' },
      { name: 'Action Logging', score: 90, status: 'excellent', lastAssessment: '2024-01-15' },
      { name: 'Data Validation', score: 87, status: 'good', lastAssessment: '2024-01-14' }
    ],
    availability: [
      { name: 'Account Status', score: 99, status: 'excellent', lastAssessment: '2024-01-15' },
      { name: 'Access Reliability', score: 94, status: 'excellent', lastAssessment: '2024-01-15' },
      { name: 'Service Uptime', score: 98, status: 'excellent', lastAssessment: '2024-01-15' }
    ]
  });

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
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      default:
        return <Shield className="h-3 w-3 text-gray-600" />;
    }
  };

  const calculateCategoryScore = (metrics: UserSecurityMetric[]) => {
    return metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
  };

  const overallScore = (
    calculateCategoryScore(userCIAData.confidentiality) +
    calculateCategoryScore(userCIAData.integrity) +
    calculateCategoryScore(userCIAData.availability)
  ) / 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Your Security Profile (CIA Triad)</CardTitle>
        </div>
        <CardDescription>
          Personal security assessment based on Confidentiality, Integrity, and Availability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{overallScore.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Overall Security Score</div>
            <Progress value={overallScore} className="w-full mt-2" />
          </div>

          {/* CIA Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Confidentiality */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Confidentiality</span>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {calculateCategoryScore(userCIAData.confidentiality).toFixed(0)}%
                </Badge>
              </div>
              {userCIAData.confidentiality.map((metric, index) => (
                <div key={`user-confidentiality-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(metric.status)}
                    <span>{metric.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(metric.status)} text-xs`}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>

            {/* Integrity */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Integrity</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {calculateCategoryScore(userCIAData.integrity).toFixed(0)}%
                </Badge>
              </div>
              {userCIAData.integrity.map((metric, index) => (
                <div key={`user-integrity-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(metric.status)}
                    <span>{metric.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(metric.status)} text-xs`}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Availability</span>
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  {calculateCategoryScore(userCIAData.availability).toFixed(0)}%
                </Badge>
              </div>
              {userCIAData.availability.map((metric, index) => (
                <div key={`user-availability-${metric.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(metric.status)}
                    <span>{metric.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(metric.status)} text-xs`}>
                    {metric.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Security Recommendations</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Consider enabling two-factor authentication for enhanced security</li>
              <li>• Review your data access permissions regularly</li>
              <li>• Keep your profile information up to date</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCIATriadMetrics;
