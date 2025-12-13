import React from 'react';
import CustomerPainPointAnalysis from '@/components/Analysis/CustomerPainPointAnalysis';

const BankPainAnalysis = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Account Pain Point Analysis</h1>
        <p className="text-muted-foreground">
          Upload customer data to identify potential challenges for UAE bank account opening
        </p>
      </div>
      
      <CustomerPainPointAnalysis />
    </div>
  );
};

export default BankPainAnalysis;
