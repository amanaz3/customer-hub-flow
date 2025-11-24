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
  const [hasProgressedPastStep1, setHasProgressedPastStep1] = useState<boolean>(false);

  // Track when product is selected and expand sidebar (only in new customer flow)
  React.useEffect(() => {
    if (selectedProduct && !companyMode && currentStep === 2) {
      setHasSelectedProduct(true);
      setSidebarCollapsed(false);
    }
  }, [selectedProduct, companyMode, currentStep]);

  // Track if user has progressed past step 1
  React.useEffect(() => {
    if (currentStep >= 2) {
      setHasProgressedPastStep1(true);
    }
  }, [currentStep]);

  // Auto-expand sidebar for existing customer when customer is selected (step 1)
  // But only on initial selection, not when navigating back
  React.useEffect(() => {
    if (companyMode && selectedCustomerId && currentStep === 1 && !hasProgressedPastStep1) {
      setSidebarCollapsed(false);
    }
  }, [companyMode, selectedCustomerId, currentStep, hasProgressedPastStep1]);

  // Auto-expand sidebar for existing customer in step 2 when product is selected, collapse in step 3+
  React.useEffect(() => {
    if (companyMode && selectedCustomerId && selectedProduct) {
      if (currentStep === 2) {
        setSidebarCollapsed(false);
      } else if (currentStep >= 3) {
        setSidebarCollapsed(true);
      }
    }
  }, [companyMode, selectedCustomerId, currentStep, selectedProduct]);

  // Track when product is selected
  React.useEffect(() => {
    if (selectedProduct) {
      setHasSelectedProduct(true);
    }
  }, [selectedProduct]);

  // Keep sidebar collapsed in step 1 for new customer only
  // In step 2+, show sidebar for new customer when there's customer data or product selected
  React.useEffect(() => {
    if (currentStep === 1 && !companyMode) {
      setSidebarCollapsed(true);
    } else if (currentStep >= 2 && !companyMode) {
      // Show if there's any customer data entered or product selected
      const hasCustomerData = customerEmail || customerName || customerMobile || customerCompany;
      if (hasCustomerData || hasSelectedProduct || internalCustomerId) {
        setSidebarCollapsed(false);
      }
    }
  }, [currentStep, companyMode, hasSelectedProduct, internalCustomerId, customerEmail, customerName, customerMobile, customerCompany]);

  // Collapse sidebar and clear customer selection when switching between new/existing customer
  const handleModeChange = (newMode: boolean) => {
    setCompanyMode(newMode);
    setSidebarCollapsed(true);
    
    // Clear customer selection when switching to new customer mode
    if (!newMode) {
      setSelectedCustomerId(null);
      setInternalCustomerId(null);
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
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 bg-gradient-to-br from-background via-background to-muted/20">
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
      
      {/* Sticky Sidebar - Show when customer is selected OR in step 2+ for new customer */}
      {(
        (companyMode && selectedCustomerId) || // Existing customer: only show when customer selected
        (!companyMode && currentStep >= 2 && (customerEmail || customerName || customerMobile || customerCompany || hasSelectedProduct || internalCustomerId)) // New customer: show in step 2+ with any customer data
      ) && (
        <div className="hidden lg:block">
          <CustomerEventsSidebar 
            key={`sidebar-${companyMode ? 'existing' : 'new'}-${selectedCustomerId || internalCustomerId || 'temp'}`}
            customerId={selectedCustomerId || internalCustomerId || 'temp'} 
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            productType={getProductType()}
            isExistingCustomer={companyMode}
            defaultTab={companyMode && currentStep >= 2 && selectedProduct ? 'documents' : undefined}
            newCustomerData={{
              email: customerEmail,
              name: customerName,
              mobile: customerMobile,
              company: customerCompany,
            }}
          />
        </div>
      )}

        {/* Mobile Notice for Required Documents */}
        <div className="lg:hidden mt-8 bg-gradient-to-br from-muted/80 to-muted/60 border border-border/60 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-foreground text-base mb-1 tracking-tight">Required Documents</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
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
