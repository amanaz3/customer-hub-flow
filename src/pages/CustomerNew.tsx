import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import SimplifiedCustomerForm from '@/components/Customer/SimplifiedCustomerForm';
import { CustomerEventsSidebar } from '@/components/Customer/CustomerEventsSidebar';
import { AgentRuleEngineToggle } from '@/components/Application/AgentRuleEngineToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Circle, CircleDot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { applicationId } = useParams<{ applicationId?: string }>();
  
  // Primary tab state - this is now the main navigation
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(!!applicationId);
  
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
  const [ruleEngineContext, setRuleEngineContext] = useState<Record<string, any>>({});
  
  // Customer selection state (for existing customer tab)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [internalCustomerId, setInternalCustomerId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [hasProgressedPastStep1, setHasProgressedPastStep1] = useState<boolean>(false);

  // Derived mode from active tab
  const companyMode = activeTab === 'existing';

  // When resuming an application, detect if it was created with existing customer
  useEffect(() => {
    if (!applicationId) {
      setIsLoadingResume(false);
      return;
    }
    
    const detectResumeMode = async () => {
      try {
        const { data: app, error } = await supabase
          .from('account_applications')
          .select('application_data, customer_id')
          .eq('id', applicationId)
          .maybeSingle();
        
        if (error || !app) {
          console.error('[CustomerNew] Error loading resume application:', error);
          setIsLoadingResume(false);
          return;
        }
        
        const appData = app.application_data as any || {};
        
        // Check if this was created with an existing customer
        // If step1 has existing_customer_mode flag or customer was pre-selected
        const isExistingCustomerMode = appData.step1?.existing_customer_mode === true;
        
        if (isExistingCustomerMode && app.customer_id) {
          setActiveTab('existing');
          setSelectedCustomerId(app.customer_id);
        } else {
          setActiveTab('new');
        }
        
        setIsLoadingResume(false);
      } catch (err) {
        console.error('[CustomerNew] Error detecting resume mode:', err);
        setIsLoadingResume(false);
      }
    };
    
    detectResumeMode();
  }, [applicationId]);

  // Debug log for selectedCustomerId changes
  useEffect(() => {
    console.log('[CustomerNew] selectedCustomerId changed:', selectedCustomerId);
  }, [selectedCustomerId]);

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

  // Show loading state while detecting resume mode
  if (isLoadingResume) {
    return (
      <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 bg-muted/30">
      <div className="w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[80%] px-4 sm:px-6">
        {/* Seamless Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="w-full max-w-4xl mx-auto">
            
            {/* Rule Engine Toggle - Only visible when admin enabled */}
            <div className="flex justify-end mb-2">
              <AgentRuleEngineToggle />
            </div>
            
            {/* Connected Tabs with Clear Boundary - Hidden when resuming predraft application */}
            {!applicationId && (
              <div className="flex overflow-hidden border border-b-0 border-border">
                {/* New Customer Tab */}
                <button
                  onClick={() => handleTabChange('new')}
                  className={`flex-1 relative h-12 transition-all duration-200 group ${
                    activeTab === 'new' 
                      ? 'bg-card shadow-sm' 
                      : 'bg-muted/60 hover:bg-muted/70 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {activeTab === 'new' ? (
                      <CircleDot className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                    <UserPlus className={`h-4 w-4 transition-colors ${activeTab === 'new' ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'}`} />
                    <span className={`font-medium text-sm transition-all ${activeTab === 'new' ? 'text-foreground' : 'text-muted-foreground/60 group-hover:text-foreground'}`}>
                      New Customer
                    </span>
                  </div>
                  {/* Active indicator bar */}
                  {activeTab === 'new' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                
                {/* Vertical Boundary */}
                <div className="w-px bg-border" />
                
                {/* Existing Customer Tab */}
                <button
                  onClick={() => handleTabChange('existing')}
                  className={`flex-1 relative h-12 transition-all duration-200 group ${
                    activeTab === 'existing' 
                      ? 'bg-card shadow-sm' 
                      : 'bg-muted/60 hover:bg-muted/70 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {activeTab === 'existing' ? (
                      <CircleDot className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                    <Users className={`h-4 w-4 transition-colors ${activeTab === 'existing' ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'}`} />
                    <span className={`font-medium text-sm transition-all ${activeTab === 'existing' ? 'text-foreground' : 'text-muted-foreground/60 group-hover:text-foreground'}`}>
                      Existing Customer
                    </span>
                  </div>
                  {/* Active indicator bar */}
                  {activeTab === 'existing' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>
            )}

            {/* Seamless Content Panel - connects to active tab */}
            <div className={`bg-gradient-to-br from-teal-50/50 to-card dark:from-teal-950/20 dark:to-card border border-border ${!applicationId ? '-mt-px' : ''}`}>
              <TabsContent value="new" className="mt-0 p-6 sm:p-8">
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
                  resumeApplicationId={applicationId}
                  onRuleEngineContextChange={setRuleEngineContext}
                />
              </TabsContent>

              <TabsContent value="existing" className="mt-0 p-6 sm:p-8">
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
                  resumeApplicationId={applicationId}
                  onRuleEngineContextChange={setRuleEngineContext}
                />
              </TabsContent>
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
              ruleEngineContext={ruleEngineContext}
            />
          </div>
        )}

        {/* Mobile Notice for Required Documents */}
        <div className="lg:hidden mt-8">
          <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-sm border border-primary/20 p-6 shadow-sm hover:shadow-md transition-all duration-300">
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
