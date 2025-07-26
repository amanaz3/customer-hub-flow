
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, FileText, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

interface EmptyDashboardStateProps {
  onCreateCustomer: () => void;
}

const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onCreateCustomer }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-background via-background to-muted/20 border-dashed border-2 border-border/50">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-8">
            {/* Animated Icon Stack */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-pulse">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
                <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Welcome to Your Dashboard
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                  Ready to get started? Create your first license application and begin the approval process.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-sm">
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-foreground">Track Customers</span>
                  <span className="text-muted-foreground text-center">Manage applications and progress</span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-foreground">Document Flow</span>
                  <span className="text-muted-foreground text-center">Handle documents seamlessly</span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-foreground">Analytics</span>
                  <span className="text-muted-foreground text-center">Insights and reporting</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-4">
              <Button 
                onClick={onCreateCustomer}
                className="w-full sm:w-auto px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <Plus className="mr-3 h-5 w-5" />
                Create Your First Customer
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>

              {/* Help Text */}
              <p className="text-xs text-muted-foreground">
                Once you add customers, you'll see comprehensive analytics, progress tracking, and more powerful features right here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyDashboardState;
