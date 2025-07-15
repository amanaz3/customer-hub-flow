
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown
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
  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: "Active customer accounts",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null
    },
    {
      title: "Completed Cases",
      value: stats.completedCases,
      icon: CheckCircle,
      description: "Successfully processed",
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: stats.completedCases > 0 ? "up" : null
    },
    {
      title: "Pending Cases",
      value: stats.pendingCases,
      icon: Clock,
      description: "Awaiting processing",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: stats.pendingCases > 5 ? "down" : null
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: FileText,
      description: "From completed cases",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: stats.totalRevenue > 0 ? "up" : null
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
              {stat.trend && (
                <div className={`flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
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
