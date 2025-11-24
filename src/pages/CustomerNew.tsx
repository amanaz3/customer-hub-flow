import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import SimplifiedCustomerForm from '@/components/Customer/SimplifiedCustomerForm';
import { CustomerEventsSidebar } from '@/components/Customer/CustomerEventsSidebar';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Track form state for sidebar
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [hasSelectedProduct, setHasSelectedProduct] = useState<boolean>(false);
  
  // Customer selection state
  const [companyMode, setCompanyMode] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [internalCustomerId, setInternalCustomerId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);

  // Track when product is selected and expand sidebar
  React.useEffect(() => {
    if (selectedProduct) {
      setHasSelectedProduct(true);
      setSidebarCollapsed(false);
    }
  }, [selectedProduct]);

  // Auto-expand sidebar when existing customer is selected (only after step 1)
  React.useEffect(() => {
    if (companyMode && selectedCustomerId && currentStep > 1) {
      setSidebarCollapsed(false);
    }
  }, [companyMode, selectedCustomerId, currentStep]);

  // Keep sidebar collapsed in step 1, allow expansion from step 2 onwards
  React.useEffect(() => {
    if (currentStep === 1) {
      setSidebarCollapsed(true);
    }
  }, [currentStep]);

  // Collapse sidebar when switching between new/existing customer
  const handleModeChange = (newMode: boolean) => {
    setCompanyMode(newMode);
    // Don't collapse if product already selected
    if (!hasSelectedProduct) {
      setSidebarCollapsed(true);
    }
  };

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
            {/* Simplified Form with Dynamic Service Configuration in Step 3 */}
            <SimplifiedCustomerForm
              onSuccess={handleSuccess}
              onProductChange={setSelectedProduct}
              onStepChange={setCurrentStep}
              onEmailChange={setCustomerEmail}
              onNameChange={setCustomerName}
              onMobileChange={setCustomerMobile}
              onCompanyChange={setCustomerCompany}
              companyMode={companyMode}
              selectedCustomerId={selectedCustomerId}
              onModeChange={handleModeChange}
              onCustomerSelect={setSelectedCustomerId}
              onCustomerIdChange={setInternalCustomerId}
              onCancel={() => navigate('/customers')}
            />
          </div>
        </div>
      
      {/* Sticky Sidebar - Show after product selection OR when existing customer is selected */}
      {((hasSelectedProduct && selectedProduct) || (companyMode && selectedCustomerId)) && (selectedCustomerId || internalCustomerId) && (
        <div className="hidden lg:block">
          <CustomerEventsSidebar 
            key={`sidebar-${companyMode ? 'existing' : 'new'}-${selectedCustomerId || internalCustomerId}`}
            customerId={selectedCustomerId || internalCustomerId || ''} 
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            productType={getProductType()}
            isExistingCustomer={companyMode && !!selectedCustomerId}
          />
        </div>
      )}

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
