import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerPainPointAnalysis from '@/components/Analysis/CustomerPainPointAnalysis';

const BankPainAnalysis = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/analysis')}
          className="mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Bank Account Pain Point Analysis</h1>
          <p className="text-muted-foreground">
            Upload customer data to identify potential challenges for UAE bank account opening
          </p>
        </div>
      </div>
      
      <CustomerPainPointAnalysis />
    </div>
  );
};

export default BankPainAnalysis;
