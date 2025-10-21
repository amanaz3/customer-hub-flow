import { Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { TeamLeaderboard } from '@/components/Dashboard/TeamLeaderboard';
import { ConversionFunnel } from '@/components/Dashboard/ConversionFunnel';
import { LazyLoadingBoundary } from '@/components/Performance/LazyLoadingBoundary';

const UserAnalytics = lazy(() => import('@/components/Analytics/UserAnalytics'));

export default function Analytics() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive analytics and performance insights
        </p>
      </div>

      {/* Team Performance & Leaderboard */}
      {isAdmin && <TeamLeaderboard />}
      
      {/* Conversion Funnel */}
      <ConversionFunnel />
      
      {/* Detailed Analytics */}
      <LazyLoadingBoundary>
        <Suspense fallback={<div className="text-center py-8">Loading analytics...</div>}>
          <UserAnalytics />
        </Suspense>
      </LazyLoadingBoundary>
    </div>
  );
}
