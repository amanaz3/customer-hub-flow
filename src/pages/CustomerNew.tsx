
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
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
        {/* Page Header */}
        <Card className="border-primary/20 shadow-elegant">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">New Application</CardTitle>
                <CardDescription className="text-sm mt-0.5">
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
