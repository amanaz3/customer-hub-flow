
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, FileText, BarChart3 } from 'lucide-react';

interface EmptyDashboardStateProps {
  onCreateCustomer: () => void;
}

const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onCreateCustomer }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Icon Stack */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-3 w-3 text-orange-600" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-3 w-3 text-green-600" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Welcome to Your Dashboard
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                You haven't created any customer applications yet. Get started by adding your first customer to begin tracking and managing their application process.
              </p>
            </div>

            {/* Action Button */}
            <Button 
              onClick={onCreateCustomer}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Customer
            </Button>

            {/* Help Text */}
            <p className="text-xs text-gray-400">
              Once you add customers, you'll see analytics, progress tracking, and more here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyDashboardState;
