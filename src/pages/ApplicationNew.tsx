import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerSelectionCard, NewCustomerData } from '@/components/Application/CustomerSelectionCard';
import { MultiStepApplicationForm } from '@/components/Application/MultiStepApplicationForm';

const ApplicationNew = () => {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData | null>(null);

  const handleCustomerSelected = (customerId: string | null, customerData: NewCustomerData | null) => {
    setSelectedCustomerId(customerId);
    setNewCustomerData(customerData);
  };

  const isCustomerSelected = selectedCustomerId !== null || newCustomerData !== null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/applications')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold">Create New Application</h1>
          <p className="text-muted-foreground mt-1">
            Select a customer and fill out the application details
          </p>
        </div>
      </div>

      {/* Customer Selection Card */}
      <CustomerSelectionCard
        onCustomerSelected={handleCustomerSelected}
        selectedCustomerId={selectedCustomerId}
        newCustomerData={newCustomerData}
      />

      {/* Multi-Step Application Form */}
      <MultiStepApplicationForm
        customerId={selectedCustomerId}
        isEnabled={isCustomerSelected}
      />
    </div>
  );
};

export default ApplicationNew;
