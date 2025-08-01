
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
  selectedMonths?: number[];
  revenueYear?: number;
  onWidgetClick?: (widget: 'applications' | 'completed' | 'pending' | 'revenue') => void;
  activeWidget?: 'applications' | 'completed' | 'pending' | 'revenue';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  selectedMonths, 
  revenueYear, 
  onWidgetClick,
  activeWidget = 'applications'
}) => {
  const { isAdmin } = useAuth();
  const completionRate = stats.totalCustomers > 0 ? (stats.completedCases / stats.totalCustomers) * 100 : 0;
  
  // Generate description for admin revenue based on selected months
  const getRevenueDescription = () => {
    if (!isAdmin) return "From your completed cases only";
    
    if (!selectedMonths || selectedMonths.length === 0) {
      return "No months selected";
    }
    
    if (selectedMonths.length === 1) {
      const monthName = new Date(2000, selectedMonths[0] - 1).toLocaleString('default', { month: 'long' });
      return `${monthName} ${revenueYear} completed cases`;
    }
    
    if (selectedMonths.length === 12) {
      return `All months of ${revenueYear}`;
    }
    
    return `${selectedMonths.length} months of ${revenueYear}`;
  };
  
  const revenueDescription = getRevenueDescription();
  
  const statCards = [
    {
      id: 'applications' as const,
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
      id: 'completed' as const,
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
      id: 'pending' as const,
      title: "Submitted Cases",
      value: stats.pendingCases,
      icon: Clock,
      description: "Submitted and in progress",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
      trend: stats.pendingCases > 5 ? "attention" : null,
      subtitle: "In progress",
      badge: null
    },
    {
      id: 'revenue' as const,
      title: isAdmin ? "Total Revenue" : "My Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: revenueDescription,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      trend: stats.totalRevenue > 0 ? "up" : null,
      subtitle: "Revenue generated",
      badge: isAdmin ? "All Users" : "Personal"
    }
  ];

  const handleCardClick = (cardId: 'applications' | 'completed' | 'pending' | 'revenue') => {
    if (onWidgetClick) {
      onWidgetClick(cardId);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const isActive = activeWidget === stat.id;
        const isClickable = onWidgetClick !== undefined;
        
        return (
          <Card 
            key={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
            className={`group relative overflow-hidden enhanced-card border-0 ${
              isClickable ? 'cursor-pointer interactive-element' : ''
            } ${
              isActive ? 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105 bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-gradient-to-br from-card to-card/90'
            }`}
            onClick={() => isClickable && handleCardClick(stat.id)}
          >
            {/* Enhanced background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Animated border */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.borderColor.replace('border-', 'bg-')} transition-all duration-300 group-hover:w-2`}></div>
            
            {/* Subtle glow effect */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
            )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
            <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {stat.title}
                  </CardTitle>
                  {stat.badge && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {stat.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <Badge className="text-xs font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                      Active
                    </Badge>
                  )}
                </div>
              <p className="text-xs text-muted-foreground/80 font-medium">
                {stat.subtitle}
              </p>
            </div>
            <div className={`relative p-4 rounded-xl ${stat.bgColor} ring-1 ring-border/30 group-hover:ring-border/50 transition-all duration-300 group-hover:scale-110`}>
              <stat.icon className={`h-6 w-6 ${stat.color} transition-all duration-300`} />
              {/* Icon glow effect */}
              <div className={`absolute inset-0 rounded-xl ${stat.bgColor} blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300`}></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {stat.description}
                </p>
              </div>
              {stat.trend && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ring-1 ring-border/20 transition-all duration-300 ${
                  stat.trend === 'up' 
                    ? 'text-green-700 bg-gradient-to-r from-green-50 to-green-100 dark:text-green-400 dark:from-green-900/20 dark:to-green-800/20' 
                    : stat.trend === 'attention'
                    ? 'text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:text-orange-400 dark:from-orange-900/20 dark:to-orange-800/20'
                    : 'text-red-700 bg-gradient-to-r from-red-50 to-red-100 dark:text-red-400 dark:from-red-900/20 dark:to-red-800/20'
                }`}>
                  {stat.trend === 'up' ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      <span>Active</span>
                    </>
                  ) : stat.trend === 'attention' ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Review</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      <span>Down</span>
                    </>
                  )}
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
