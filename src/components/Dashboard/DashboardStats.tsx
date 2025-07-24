
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalCustomers: number;
    completedCases: number;
    pendingCases: number;
    totalRevenue: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { isAdmin } = useAuth();
  const completionRate = stats.totalCustomers > 0 ? (stats.completedCases / stats.totalCustomers) * 100 : 0;
  
  const statCards = [
    {
      title: isAdmin ? "Total Applications" : "My Applications",
      value: stats.totalCustomers,
      icon: Users,
      description: isAdmin ? "System-wide applications" : "Applications you submitted",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-200 dark:border-blue-800",
      trend: null,
      subtitle: isAdmin ? "All users" : "Personal",
      badge: isAdmin ? "Admin View" : "User View"
    },
    {
      title: "Completed Cases",
      value: stats.completedCases,
      icon: CheckCircle,
      description: `${completionRate.toFixed(1)}% completion rate`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
      trend: stats.completedCases > 0 ? "up" : null,
      subtitle: "Successfully processed",
      badge: null
    },
    {
      title: "Active Cases",
      value: stats.pendingCases,
      icon: Clock,
      description: "Currently in progress",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
      trend: stats.pendingCases > 5 ? "attention" : null,
      subtitle: "In progress",
      badge: null
    },
    {
      title: isAdmin ? "Total Revenue" : "My Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: isAdmin ? "From all completed cases" : "From your completed cases only",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      trend: stats.totalRevenue > 0 ? "up" : null,
      subtitle: "Revenue generated",
      badge: isAdmin ? "All Users" : "Personal"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card 
          key={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
          className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 ${stat.borderColor} bg-gradient-to-br from-background to-muted/20`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70">
                {stat.subtitle}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bgColor} ring-1 ring-border/20`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight">
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
              {stat.trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20' 
                    : stat.trend === 'attention'
                    ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                }`}>
                  {stat.trend === 'up' ? (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      <span>Active</span>
                    </>
                  ) : stat.trend === 'attention' ? (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>Review</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3" />
                      <span>Down</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
