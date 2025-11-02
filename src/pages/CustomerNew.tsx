
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ComprehensiveCustomerForm from '@/components/Customer/ComprehensiveCustomerForm';
import { ClipboardList } from 'lucide-react';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = () => {
    refreshData();
    
    toast({
      title: "Success",
      description: "Customer created successfully",
    });
    navigate('/customers');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <Card className="border-primary/20 shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">New Application</CardTitle>
                <CardDescription className="text-base mt-1">
                  Complete this multi-step form to create a new customer application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Multi-Step Form */}
        <ComprehensiveCustomerForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default CustomerNew;
