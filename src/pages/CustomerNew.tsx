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
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 bg-background">
      <div className="w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[80%] px-4 sm:px-6">
        {/* Primary Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tabbed Interface Container */}
          <div className="w-full max-w-4xl mx-auto">
            
            {/* Clean Flow Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    1
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:block">Customer Type</span>
                </div>
                
                {/* Progress Line */}
                <div className="flex-1 mx-4 h-0.5 bg-border relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                    style={{ width: currentStep >= 2 ? '100%' : '0%' }}
                  />
                </div>
                
                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${
                    currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>Application</span>
                </div>
              </div>
            </div>

            {/* Main Card Container */}
            <div className="bg-card border border-border overflow-hidden">
              
              {/* Section: Customer Type Selection */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-base font-semibold text-foreground tracking-tight">
                    Select Customer Type
                  </h2>
                </div>

                {/* Clean Card Selection */}
                <TabsList className="w-full h-auto p-0 bg-transparent grid grid-cols-2 gap-4">
                  <TabsTrigger 
                    value="new" 
                    className="relative h-auto p-0 bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none group"
                  >
                    <div className={`
                      w-full p-5 border transition-all duration-200 cursor-pointer
                      ${activeTab === 'new' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:border-muted-foreground/50'
                      }
                    `}>
                      <div className="flex items-center gap-4">
                        {/* Radio Indicator */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${activeTab === 'new' ? 'border-primary' : 'border-muted-foreground/40'}
                        `}>
                          {activeTab === 'new' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        
                        {/* Icon */}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-colors
                          ${activeTab === 'new' ? 'bg-primary/10' : 'bg-muted'}
                        `}>
                          <UserPlus className={`h-5 w-5 ${activeTab === 'new' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 text-left">
                          <span className={`font-semibold text-sm block ${activeTab === 'new' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            New Customer
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Create new record
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="existing" 
                    className="relative h-auto p-0 bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none group"
                  >
                    <div className={`
                      w-full p-5 border transition-all duration-200 cursor-pointer
                      ${activeTab === 'existing' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:border-muted-foreground/50'
                      }
                    `}>
                      <div className="flex items-center gap-4">
                        {/* Radio Indicator */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${activeTab === 'existing' ? 'border-primary' : 'border-muted-foreground/40'}
                        `}>
                          {activeTab === 'existing' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        
                        {/* Icon */}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-colors
                          ${activeTab === 'existing' ? 'bg-primary/10' : 'bg-muted'}
                        `}>
                          <Users className={`h-5 w-5 ${activeTab === 'existing' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 text-left">
                          <span className={`font-semibold text-sm block ${activeTab === 'existing' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Existing Customer
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Add to existing
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Section: Application Form */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-primary/40 rounded-full" />
                  <h2 className="text-base font-semibold text-foreground tracking-tight">
                    {activeTab === 'new' ? 'Customer Details' : 'Select & Add Service'}
                  </h2>
                </div>

                {/* Tab Content */}
                <TabsContent value="new" className="mt-0">
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
                    onModeChange={() => {}}
                    onCustomerSelect={() => {}}
                    onCustomerIdChange={setInternalCustomerId}
                    onCancel={() => navigate('/customers')}
                    onDocumentsChange={setServiceDocuments}
                    hideCustomerTypeSelector={true}
                  />
                </TabsContent>

                <TabsContent value="existing" className="mt-0">
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
                    onModeChange={() => {}}
                    onCustomerSelect={setSelectedCustomerId}
                    onCustomerIdChange={setInternalCustomerId}
                    onCancel={() => navigate('/customers')}
                    onDocumentsChange={setServiceDocuments}
                    hideCustomerTypeSelector={true}
                  />
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>
      
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
