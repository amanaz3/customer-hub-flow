import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import SimplifiedCustomerForm from '@/components/Customer/SimplifiedCustomerForm';
import { RequiredDocumentsSidebar } from '@/components/Customer/RequiredDocumentsSidebar';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Track form state for sidebar
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const handleSuccess = () => {
    refreshData();
    
    toast({
      title: "Success",
      description: "Customer created successfully",
    });
    navigate('/customers');
  };
  
  // Determine product type for sidebar
  const getProductType = (): 'goaml' | 'home_finance' | 'bank_account' | null => {
    if (!selectedProduct) return null;
    const productLower = selectedProduct.toLowerCase();
    const productNoSpaces = productLower.replace(/\s+/g, '');
    
    // GoAML and AML Services
    if (productLower.includes('aml') || productLower.includes('goaml')) {
      return 'goaml';
    }
    
    // Home Finance / Mortgage
    if ((productLower.includes('home') && productLower.includes('finance')) || 
        productLower.includes('mortgage')) {
      return 'home_finance';
    }
    
    // Business Bank Account
    if (productLower.includes('bank') && productLower.includes('account')) {
      return 'bank_account';
    }
    
    return null;
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
      <div className="w-full max-w-5xl px-6">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                New Application
              </h1>
              <p className="text-muted-foreground text-lg">
                Create a new customer application in 3 simple steps
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/customers')}
              className="gap-2 hover-scale shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Customers
            </Button>
          </div>
        </div>

        <div className="w-full">
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pr-12' : 'lg:pr-80'}`}>
            {/* Simplified Form */}
            <SimplifiedCustomerForm
            onSuccess={handleSuccess}
            onProductChange={setSelectedProduct}
            onEmailChange={setCustomerEmail}
            onNameChange={setCustomerName}
            onMobileChange={setCustomerMobile}
            onCompanyChange={setCustomerCompany}
          />
        </div>
      </div>
      
      {/* Sticky Sidebar - Hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <RequiredDocumentsSidebar
          productType={getProductType()}
          customerEmail={customerEmail}
          customerName={customerName}
          customerMobile={customerMobile}
          customerCompany={customerCompany}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

        {/* Mobile Notice for Required Documents */}
        <div className="lg:hidden mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-semibold text-primary text-lg mb-2">Required Documents</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                After submitting this application, you'll receive an email with a detailed list of required documents specific to your selected service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerNew;
