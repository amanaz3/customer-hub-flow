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
  const [previousStep, setPreviousStep] = useState<number>(1);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [hasSelectedProduct, setHasSelectedProduct] = useState<boolean>(false);
  const [shouldShowSidebarInStep2, setShouldShowSidebarInStep2] = useState<boolean>(false);
  const [userManuallyClosed, setUserManuallyClosed] = useState<boolean>(false);
  
  // Customer selection state
  const [companyMode, setCompanyMode] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [internalCustomerId, setInternalCustomerId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [hasProgressedPastStep1, setHasProgressedPastStep1] = useState<boolean>(false);

  // Track when product is selected and control sidebar visibility and state
  React.useEffect(() => {
    const movingForwardToStep2 = currentStep === 2 && previousStep === 1;
    const returningToStep2FromStep3Plus = currentStep === 2 && previousStep >= 3;
    const leavingStep2 = previousStep === 2 && currentStep !== 2;
    
    console.log('[CustomerNew] Step transition:', { 
      currentStep, 
      previousStep, 
      movingForwardToStep2, 
      returningToStep2FromStep3Plus,
      sidebarCollapsed,
      shouldShowSidebarInStep2,
      userManuallyClosed
    });
    
    // Expand sidebar ONLY when moving forward from step 1 to step 2, and user hasn't manually closed it
    if (selectedProduct && !companyMode && movingForwardToStep2 && !userManuallyClosed) {
      console.log('[CustomerNew] Expanding sidebar on forward transition to step 2');
      setHasSelectedProduct(true);
      setSidebarCollapsed(false);
      setShouldShowSidebarInStep2(true);
    }
    
    // Hide sidebar completely when returning to step 2 from step 3+
    if (returningToStep2FromStep3Plus && !companyMode) {
      console.log('[CustomerNew] Hiding sidebar when returning from step 3+');
      setShouldShowSidebarInStep2(false);
    }
    
    // Hide sidebar when leaving step 2 or moving to step 1
    if ((leavingStep2 || currentStep === 1) && !companyMode) {
      if (currentStep === 1) {
        console.log('[CustomerNew] Resetting sidebar state on step 1');
        setShouldShowSidebarInStep2(false);
        setUserManuallyClosed(false); // Reset manual close flag when going back to step 1
      }
    }
    
    setPreviousStep(currentStep);
  }, [currentStep, previousStep, selectedProduct, companyMode, userManuallyClosed]);

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

  // Auto-expand sidebar for existing customer in step 2 when product is selected
  React.useEffect(() => {
    if (companyMode && selectedCustomerId && selectedProduct) {
      if (currentStep === 2 && !userManuallyClosed) {
        setSidebarCollapsed(false);
      }
    }
  }, [companyMode, selectedCustomerId, currentStep, selectedProduct, userManuallyClosed]);

  // Track when product is selected
  React.useEffect(() => {
    if (selectedProduct) {
      setHasSelectedProduct(true);
    }
  }, [selectedProduct]);

  // Keep sidebar collapsed in step 1 for new customer
  React.useEffect(() => {
    if (currentStep === 1 && !companyMode) {
      setSidebarCollapsed(true);
    }
    // Don't touch sidebarCollapsed in steps 2-4 - let user control it manually
  }, [currentStep, companyMode]);

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
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 bg-white">
      <div className="w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[80%] px-4 sm:px-6">
        {/* Outer Card Container */}
        <div className="w-full bg-white shadow-2xl border-2 border-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 sm:p-8 lg:p-10 animate-fade-in relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="relative z-10 w-full flex justify-center">
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
        </div>
      
      {/* Sticky Sidebar - Show from step 2 onwards when product is selected */}
      {(
        (companyMode && selectedCustomerId && currentStep >= 2) || // Existing customer: show from step 2 onwards
        (!companyMode && currentStep >= 2 && selectedProduct && shouldShowSidebarInStep2) // New customer: show from step 2 onwards
      ) && (
        <div className="hidden lg:block">
          <CustomerEventsSidebar 
            key={`sidebar-${companyMode ? 'existing' : 'new'}`}
            customerId={selectedCustomerId || internalCustomerId || 'temp'} 
            collapsed={sidebarCollapsed}
            onCollapsedChange={(collapsed) => {
              console.log('[CustomerNew] Sidebar collapse changed:', collapsed);
              setSidebarCollapsed(collapsed);
              if (collapsed && currentStep === 2 && !companyMode) {
                console.log('[CustomerNew] User manually closed sidebar in step 2');
                setUserManuallyClosed(true); // Track that user manually closed it
              }
            }}
            productType={getProductType()}
            isExistingCustomer={companyMode}
            defaultTab={
              companyMode && currentStep >= 2 && selectedProduct 
                ? 'documents' 
                : (!companyMode && currentStep === 2 && selectedProduct && shouldShowSidebarInStep2)
                ? 'documents'
                : undefined
            }
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
        <div className="lg:hidden mt-8">
          <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-sm border border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
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
    </div>
  );
};

export default CustomerNew;
