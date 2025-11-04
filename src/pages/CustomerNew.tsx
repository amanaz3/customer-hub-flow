import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import ComprehensiveCustomerForm from '@/components/Customer/ComprehensiveCustomerForm';
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
    <div className="w-full relative">
      <div className="w-full bg-gradient-subtle -mx-3 sm:-mx-4 md:-mx-6 -mt-4 sm:-mt-2">
        <div className={`px-4 pb-4 transition-all duration-300 ${sidebarCollapsed ? 'lg:pr-12' : 'lg:pr-80'}`}>
          {/* Multi-Step Form */}
          <ComprehensiveCustomerForm 
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
    </div>
  );
};

export default CustomerNew;
