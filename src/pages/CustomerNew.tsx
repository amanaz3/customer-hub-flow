import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
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
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 bg-background">
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
