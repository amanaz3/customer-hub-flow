
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import { ProductionRateLimit } from '@/utils/productionRateLimit';
import FeatureAnalytics from '@/utils/featureAnalytics';
import ErrorTracker from '@/utils/errorTracking';
import { AlertTriangle, CheckCircle, Activity, Users, Database } from 'lucide-react';

// Type definitions for better type safety
interface RateLimitOffender {
  key: string;
  attempts: number;
}

interface RateLimitAnalytics {
  totalAttempts: number;
  activeKeys: number;
  topOffenders: RateLimitOffender[];
}

interface FeatureUsageItem {
  feature: string;
  count: number;
}

interface FeatureUsage {
  totalEvents: number;
  uniqueFeatures: string[];
  sessionDuration: number;
  errorRate: number;
  topFeatures: FeatureUsageItem[];
}

type SystemHealth = 'healthy' | 'warning' | 'critical';

const ProductionMonitor: React.FC = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, number>>({});
  const [rateLimitAnalytics, setRateLimitAnalytics] = useState<RateLimitAnalytics>({
    totalAttempts: 0,
    activeKeys: 0,
    topOffenders: []
  });
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage>({
    totalEvents: 0,
    uniqueFeatures: [],
    sessionDuration: 0,
    errorRate: 0,
    topFeatures: []
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>('healthy');

  useEffect(() => {
    const updateMetrics = () => {
      // Get performance metrics
      const perfMetrics = PerformanceMonitor.getMetrics();
      setPerformanceMetrics(perfMetrics);

      // Get rate limiting analytics
      const rateLimitData = ProductionRateLimit.getAnalytics();
      setRateLimitAnalytics(rateLimitData);

      // Get feature usage analytics
      const usageData = FeatureAnalytics.getUsageSummary();
      setFeatureUsage(usageData);

      // Determine system health
      let health: SystemHealth = 'healthy';
      
      if (perfMetrics['page-load-time'] > 3000 || perfMetrics['LCP'] > 2500) {
        health = 'warning';
      }
      if (usageData.errorRate > 0.1) {
        health = 'critical';
      }
      
      setSystemHealth(health);
    };

    // Update metrics immediately
    updateMetrics();

    // Set up periodic updates
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getHealthIcon(systemHealth)}
            System Health Status
            <Badge variant={systemHealth === 'healthy' ? 'default' : systemHealth === 'warning' ? 'secondary' : 'destructive'}>
              {systemHealth.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(performanceMetrics['page-load-time'] || 0)}ms
              </div>
              <div className="text-sm text-gray-600">Page Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((1 - featureUsage.errorRate) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rateLimitAnalytics.activeKeys || 0}
              </div>
              <div className="text-sm text-gray-600">Active Rate Limits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">First Contentful Paint</div>
              <div className="text-lg font-semibold">
                {Math.round(performanceMetrics['FCP'] || 0)}ms
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Largest Contentful Paint</div>
              <div className="text-lg font-semibold">
                {Math.round(performanceMetrics['LCP'] || 0)}ms
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
              <div className="text-lg font-semibold">
                {(performanceMetrics['CLS'] || 0).toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time to Interactive</div>
              <div className="text-lg font-semibold">
                {Math.round(performanceMetrics['dom-interactive'] || 0)}ms
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Rate Limiting Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Attempts</span>
              <Badge variant="outline">{rateLimitAnalytics.totalAttempts || 0}</Badge>
            </div>
            
            {rateLimitAnalytics.topOffenders && rateLimitAnalytics.topOffenders.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Top Rate Limited Keys</h4>
                <div className="space-y-2">
                  {rateLimitAnalytics.topOffenders.slice(0, 3).map((offender: RateLimitOffender) => (
                    <div key={`offender-${offender.key}-${offender.attempts}`} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{offender.key}</span>
                      <Badge variant="secondary">{offender.attempts} attempts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Feature Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Events</div>
                <div className="text-lg font-semibold">{featureUsage.totalEvents || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Unique Features</div>
                <div className="text-lg font-semibold">{featureUsage.uniqueFeatures?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Session Duration</div>
                <div className="text-lg font-semibold">
                  {Math.round((featureUsage.sessionDuration || 0) / 1000 / 60)}min
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Error Rate</div>
                <div className={`text-lg font-semibold ${featureUsage.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.round((featureUsage.errorRate || 0) * 100)}%
                </div>
              </div>
            </div>

            {featureUsage.topFeatures && featureUsage.topFeatures.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Most Used Features</h4>
                <div className="space-y-2">
                  {featureUsage.topFeatures.slice(0, 5).map((feature: FeatureUsageItem) => (
                    <div key={`feature-${feature.feature}-${feature.count}`} className="flex justify-between items-center">
                      <span className="text-sm">{feature.feature}</span>
                      <Badge variant="outline">{feature.count} uses</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      {systemHealth !== 'healthy' && (
        <Alert variant={systemHealth === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {systemHealth === 'critical' 
              ? 'Critical performance issues detected. Immediate attention required.'
              : 'Performance warnings detected. Monitor closely and consider optimization.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProductionMonitor;
