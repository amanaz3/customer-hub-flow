import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import SimplifiedCustomerForm from '@/components/Customer/SimplifiedCustomerForm';
import { RequiredDocumentsSidebar } from '@/components/Customer/RequiredDocumentsSidebar';
import { CustomerEventsSidebar } from '@/components/Customer/CustomerEventsSidebar';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);
  
  // Customer selection state
  const [companyMode, setCompanyMode] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 bg-background">
      <div className="w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[80%] px-4 sm:px-6">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl">
            {/* Simplified Form */}
            <SimplifiedCustomerForm
            onSuccess={handleSuccess}
            onProductChange={setSelectedProduct}
            onEmailChange={setCustomerEmail}
            onNameChange={setCustomerName}
            onMobileChange={setCustomerMobile}
            onCompanyChange={setCustomerCompany}
            companyMode={companyMode}
            selectedCustomerId={selectedCustomerId}
            onModeChange={setCompanyMode}
            onCustomerSelect={setSelectedCustomerId}
          />
        </div>
      </div>
      
      {/* Sticky Sidebar - Hidden on mobile/tablet */}
      {!sidebarHidden && (
        <div className="hidden lg:block">
          {companyMode && selectedCustomerId ? (
            <CustomerEventsSidebar customerId={selectedCustomerId} />
          ) : (
            <RequiredDocumentsSidebar
              productType={getProductType()}
              customerEmail={customerEmail}
              customerName={customerName}
              customerMobile={customerMobile}
              customerCompany={customerCompany}
              onCollapsedChange={() => {}}
            />
          )}
        </div>
      )}
      
      {/* Sidebar Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="hidden lg:flex fixed right-4 top-24 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => setSidebarHidden(!sidebarHidden)}
      >
        {sidebarHidden ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

        {/* Mobile Notice for Required Documents */}
        <div className="lg:hidden mt-8 bg-muted border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-foreground text-base mb-1">Required Documents</h3>
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
