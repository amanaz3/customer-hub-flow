import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import SimplifiedCustomerForm from '@/components/Customer/SimplifiedCustomerForm';
import { CustomerEventsSidebar } from '@/components/Customer/CustomerEventsSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users } from 'lucide-react';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Primary tab state - this is now the main navigation
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  
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
  const [serviceDocuments, setServiceDocuments] = useState<Array<{
    category: string;
    documents: Array<{ name: string; required: boolean; requiredAtStages?: string[] }>;
  }>>([]);
  
  // Customer selection state (for existing customer tab)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [internalCustomerId, setInternalCustomerId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [hasProgressedPastStep1, setHasProgressedPastStep1] = useState<boolean>(false);

  // Derived mode from active tab
  const companyMode = activeTab === 'existing';

  // Track when product is selected and control sidebar visibility and state
  React.useEffect(() => {
    const movingForwardToStep2 = currentStep === 2 && previousStep === 1;
    const returningToStep2FromStep3Plus = currentStep === 2 && previousStep >= 3;
    const leavingStep2 = previousStep === 2 && currentStep !== 2;
    
    // Show sidebar (collapsed) when moving forward from step 1 to step 2 - no auto-expand
    if (selectedProduct && !companyMode && movingForwardToStep2) {
      setHasSelectedProduct(true);
      setShouldShowSidebarInStep2(true);
    }
    
    // Hide sidebar completely when returning to step 2 from step 3+
    if (returningToStep2FromStep3Plus && !companyMode) {
      setShouldShowSidebarInStep2(false);
    }
    
    // Hide sidebar when leaving step 2 or moving to step 1
    if ((leavingStep2 || currentStep === 1) && !companyMode) {
      if (currentStep === 1) {
        setShouldShowSidebarInStep2(false);
        setUserManuallyClosed(false);
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

  // Show sidebar collapsed with pulsating effect for existing customer when customer is selected
  React.useEffect(() => {
    if (companyMode && selectedCustomerId) {
      setSidebarCollapsed(true);
    }
  }, [companyMode, selectedCustomerId]);

  // Keep sidebar collapsed for existing customer
  React.useEffect(() => {
    if (companyMode && selectedCustomerId && selectedProduct) {
      setSidebarCollapsed(true);
    }
  }, [companyMode, selectedCustomerId, selectedProduct]);

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
  }, [currentStep, companyMode]);

  // Reset state when switching tabs
  const handleTabChange = (value: string) => {
    const newTab = value as 'new' | 'existing';
    setActiveTab(newTab);
    setCurrentStep(1);
    setPreviousStep(1);
    setSidebarCollapsed(true);
    setSelectedProduct(null);
    setHasSelectedProduct(false);
    setShouldShowSidebarInStep2(false);
    setUserManuallyClosed(false);
    
    // Clear existing customer selection when switching to new
    if (newTab === 'new') {
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
    
    if (productLower.includes('aml') || productLower.includes('goaml')) {
      return 'goaml';
    }
    
    if ((productLower.includes('home') && productLower.includes('finance')) || 
        productLower.includes('mortgage')) {
      return 'home_finance';
    }
    
    if (productLower.includes('bank') && productLower.includes('account')) {
      return 'bank_account';
    }
    
    return null;
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 bg-white">
      <div className="w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[80%] px-4 sm:px-6">
        {/* Outer Card Container */}
        <div id="customer-form-container" className="w-full bg-white shadow-2xl border-2 border-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 sm:p-8 lg:p-10 animate-fade-in relative overflow-hidden rounded-none">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            {/* Primary Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Tab Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  New Application
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose whether to create a new customer or select an existing one
                </p>
              </div>
              
              {/* Tab List */}
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto bg-muted/50 border border-border p-1 rounded-none mb-6">
                <TabsTrigger 
                  value="new" 
                  className="flex items-center justify-center gap-2 py-3 px-4 h-12 rounded-none transition-colors duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-sm whitespace-nowrap">New Customer</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="existing" 
                  className="flex items-center justify-center gap-2 py-3 px-4 h-12 rounded-none transition-colors duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-sm whitespace-nowrap">Existing Customer</span>
                </TabsTrigger>
              </TabsList>

              {/* New Customer Tab Content */}
              <TabsContent value="new" className="mt-0">
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-4xl">
                    <SimplifiedCustomerForm
                      onSuccess={handleSuccess}
                      onProductChange={setSelectedProduct}
                      onStepChange={setCurrentStep}
                      onEmailChange={setCustomerEmail}
                      onNameChange={setCustomerName}
                      onMobileChange={setCustomerMobile}
                      onCompanyChange={setCustomerCompany}
                      companyMode={false}
                      selectedCustomerId={null}
                      onModeChange={() => {}} // No-op since tabs control mode
                      onCustomerSelect={() => {}}
                      onCustomerIdChange={setInternalCustomerId}
                      onCancel={() => navigate('/customers')}
                      onDocumentsChange={setServiceDocuments}
                      hideCustomerTypeSelector={true}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Existing Customer Tab Content */}
              <TabsContent value="existing" className="mt-0">
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-4xl">
                    <SimplifiedCustomerForm
                      onSuccess={handleSuccess}
                      onProductChange={setSelectedProduct}
                      onStepChange={setCurrentStep}
                      onEmailChange={setCustomerEmail}
                      onNameChange={setCustomerName}
                      onMobileChange={setCustomerMobile}
                      onCompanyChange={setCustomerCompany}
                      companyMode={true}
                      selectedCustomerId={selectedCustomerId}
                      onModeChange={() => {}} // No-op since tabs control mode
                      onCustomerSelect={setSelectedCustomerId}
                      onCustomerIdChange={setInternalCustomerId}
                      onCancel={() => navigate('/customers')}
                      onDocumentsChange={setServiceDocuments}
                      hideCustomerTypeSelector={true}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      
        {/* Sticky Sidebar - Show from step 2 onwards when product is selected */}
        {(
          (companyMode && selectedCustomerId) ||
          (!companyMode && currentStep >= 3 && selectedProduct) ||
          (!companyMode && currentStep === 2 && selectedProduct)
        ) && (
          <div className="hidden lg:block">
            <CustomerEventsSidebar 
              key={`sidebar-${companyMode ? 'existing' : 'new'}`}
              customerId={selectedCustomerId || internalCustomerId || 'temp'} 
              collapsed={sidebarCollapsed}
              onCollapsedChange={(collapsed) => {
                setSidebarCollapsed(collapsed);
                if (collapsed && currentStep === 2 && !companyMode) {
                  setUserManuallyClosed(true);
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
              serviceDocuments={serviceDocuments}
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
