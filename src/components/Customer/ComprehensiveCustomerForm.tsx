import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { jsPDF } from 'jspdf';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { supabase } from '@/lib/supabase';
import { Document } from '@/types/customer';
import DocumentUpload from './DocumentUpload';
import { ProductionRateLimit } from '@/utils/productionRateLimit';
import FeatureAnalytics from '@/utils/featureAnalytics';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import { validateEmail, validatePhoneNumber, validateCompanyName, sanitizeInput } from '@/utils/inputValidation';
import { CreateCompanyDialog } from './CreateCompanyDialog';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import { Building2, Plus, Save, Users, ClipboardList, Check, CircleDot, Circle, AlertCircle, Info, Search, Eye, EyeOff, Mail, Share2, Send, Zap, UserCog, Layers, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { emailDocumentChecklist, shareViaWhatsApp, formatChecklistForSharing } from '@/utils/documentChecklistSharing';
import { AgentHelpDialog } from './AgentHelpDialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NavigationBlocker } from '@/components/Navigation/NavigationBlocker';
import { StickyFormNavigation } from './StickyFormNavigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Enter a valid email address")
    .max(254, "Email address too long"),
  mobile: z.string()
    .min(10, "Enter a valid phone number")
    .max(20, "Phone number too long"),
  company: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name too long"),
  amount: z.number()
    .min(0.01, "Amount must be greater than 0")
    .max(10000000, "Amount cannot exceed 10,000,000"),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'WhatsApp', 'Other']),
  annual_turnover: z.number()
    .min(0.01, "Annual turnover must be greater than 0")
    .max(1000000000, "Annual turnover cannot exceed 1,000,000,000"),
  jurisdiction: z.string().optional(),
  nationality: z.string().optional(),
  proposed_activity: z.string().optional(),
  bank_preference_1: z.string().optional(),
  bank_preference_2: z.string().optional(),
  bank_preference_3: z.string().optional(),
  customer_notes: z.string().optional(),
  product_id: z.string().min(1, "Please select a product/service"),
  service_type_id: z.string().optional(),
  no_of_shareholders: z.number()
    .min(1, "Number of shareholders must be at least 1")
    .max(10, "Number of shareholders cannot exceed 10")
    .default(1),
  // Business Bank Account specific fields
  mainland_or_freezone: z.enum(['mainland', 'freezone']).optional(),
  signatory_type: z.enum(['single', 'joint']).optional(),
  business_activity_details: z.string().optional(),
  minimum_balance_range: z.enum(['0-10k', '10k-100k', '100k-150k', '150k-250k', 'above-250k']).optional(),
  // Bookkeeping-specific fields
  company_incorporation_date: z.string().optional(),
  number_of_entries_per_month: z.string().optional(),
  vat_corporate_tax_status: z.string().optional(),
  wps_transfer_required: z.boolean().optional(),
  accounting_software: z.string().optional(),
  monthly_transactions: z.string().optional(),
  vat_registered: z.boolean().optional(),
  bank_accounts_count: z.number().optional(),
  employees_count: z.number().optional(),
  service_start_date: z.string().optional(),
  has_previous_records: z.boolean().optional(),
  reporting_frequency: z.string().optional(),
  // Home Finance specific fields
  uae_residency_status: z.enum(['Resident', 'Non-Resident']).optional(),
  salary_range: z.string().optional(),
  business_turnover: z.string().optional(),
  // Business Finance specific fields
  company_turnover: z.string().optional(),
  years_since_registration: z.number().optional(),
  vat_registration_status: z.enum(['Registered', 'Not Registered', 'In Process']).optional(),
  purpose_of_finance: z.string().optional(),
  service_charges: z.number().optional(),
  // Corporate tax filing fields
  tax_year_period: z.string().optional(),
  first_time_filing: z.boolean().optional(),
  tax_registration_number: z.string().optional(),
  financial_year_end_date: z.string().optional(),
  has_foreign_operations: z.boolean().optional(),
  tax_exemptions: z.string().optional(),
  previous_tax_consultant: z.string().optional(),
  filing_deadline: z.string().optional(),
  // GoAML fields
  trade_license_number: z.string().optional(),
  date_of_incorporation: z.string().optional(),
  registered_office_address: z.string().optional(),
  nature_of_business: z.string().optional(),
  number_of_ubos: z.number().optional(),
  compliance_officer_name: z.string().optional(),
  compliance_officer_email: z.string().email().optional().or(z.literal('')),
  compliance_officer_phone: z.string().optional(),
  compliance_officer_position: z.string().optional(),
  expected_annual_transaction_volume: z.string().optional(),
  transaction_types: z.string().optional(),
  customer_types: z.string().optional(),
  high_risk_countries: z.string().optional(),
  source_of_funds: z.string().optional(),
  // AML/MLRO fields
  mlro_name: z.string().optional(),
  mlro_email: z.string().email().optional().or(z.literal('')),
  mlro_phone: z.string().optional(),
  aml_policy_required: z.boolean().optional(),
  // Customer Identification fields
  customer_full_legal_name: z.string().optional(),
  customer_date_of_birth: z.string().optional(),
  customer_nationality: z.string().optional(),
  customer_national_id: z.string().optional(),
  customer_passport_number: z.string().optional(),
  customer_id_expiry_date: z.string().optional(),
  customer_residential_address: z.string().optional(),
  customer_contact_phone: z.string().optional(),
  customer_contact_email: z.string().email().optional().or(z.literal('')),
  // Business/Company Information fields (for corporate clients)
  business_company_name: z.string().optional(),
  business_registration_number: z.string().optional(),
  business_trade_license_number: z.string().optional(),
  business_trade_license_expiry: z.string().optional(),
  business_activity_sector: z.string().optional(),
  business_company_address: z.string().optional(),
  business_authorized_signatories: z.string().optional(),
  business_beneficial_ownership: z.string().optional(),
  business_ubo_information: z.string().optional(),
  // Financial Profile fields
  financial_source_of_funds: z.string().optional(),
  financial_source_of_wealth: z.string().optional(),
  financial_expected_monthly_volume: z.string().optional(),
  financial_expected_annual_volume: z.string().optional(),
  financial_account_purpose: z.string().optional(),
  financial_anticipated_activity: z.string().optional(),
  financial_employment_status: z.string().optional(),
  financial_employer_details: z.string().optional(),
  financial_annual_income: z.string().optional(),
  financial_annual_turnover: z.string().optional(),
  // Risk Assessment fields
  risk_pep_status: z.enum(['yes', 'no', 'related']).optional(),
  risk_pep_details: z.string().optional(),
  risk_sanctions_screening: z.string().optional(),
  risk_adverse_media: z.string().optional(),
  risk_country_risk: z.string().optional(),
  risk_business_relationship_purpose: z.string().optional(),
  // Home Finance fields
  monthly_gross_salary: z.number().optional(),
  employment_status: z.string().optional(),
  employer_name: z.string().optional(),
  years_with_employer: z.number().optional(),
  additional_income: z.number().optional(),
  additional_income_source: z.string().optional(),
  existing_loan_commitments: z.number().optional(),
  credit_card_limit: z.number().optional(),
  credit_card_outstanding: z.number().optional(),
  property_type: z.string().optional(),
  property_location: z.string().optional(),
  property_value: z.number().optional(),
  developer_name: z.string().optional(),
  property_status: z.string().optional(),
  intended_use: z.string().optional(),
  loan_amount_required: z.number().optional(),
  down_payment_amount: z.number().optional(),
  preferred_loan_tenure: z.number().optional(),
  purchase_purpose: z.string().optional(),
  has_co_applicant: z.boolean().optional(),
  co_applicant_name: z.string().optional(),
  co_applicant_income: z.number().optional(),
  co_applicant_relationship: z.string().optional(),
  // VAT Registration fields
  vat_registration_type: z.string().optional(),
  already_registered_vat: z.boolean().optional(),
  existing_trn: z.string().optional(),
  business_activity_description: z.string().optional(),
  import_activities: z.boolean().optional(),
  export_activities: z.boolean().optional(),
  import_countries: z.string().optional(),
  export_countries: z.string().optional(),
  previous_tax_period: z.string().optional(),
  vat_accounting_software: z.string().optional(),
  multiple_business_locations: z.boolean().optional(),
  number_of_locations: z.number().optional(),
  // FTA Portal Credentials (for VAT, Tax Registration, and Tax Filing services)
  fta_portal_email: z.string().email().optional().or(z.literal('')),
  fta_portal_password: z.string().optional(),
  // Deal/Application fields
  banking_preferences: z.string().optional(),
  payment_method: z.string().optional(),
  arr_value: z.number().optional(),
  deal_stage: z.enum(['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  expected_close_date: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ComprehensiveCustomerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<FormData>;
  onProductChange?: (productName: string | null) => void;
  onEmailChange?: (email: string) => void;
  onNameChange?: (name: string) => void;
  onMobileChange?: (mobile: string) => void;
  onCompanyChange?: (company: string) => void;
  sidebarCollapsed?: boolean;
}

const ComprehensiveCustomerForm: React.FC<ComprehensiveCustomerFormProps> = ({
  onSuccess,
  initialData,
  onProductChange,
  onEmailChange,
  onNameChange,
  onMobileChange,
  onCompanyChange,
  sidebarCollapsed = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState<'details' | 'preview' | 'documents'>('details');
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'concept' | 'wizard' | 'tabs' | 'single' | 'progressive'>('concept');
  const [expertMode, setExpertMode] = useState<'simple' | 'expert'>('simple');
  const [wizardStep, setWizardStep] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showSuccessTransition, setShowSuccessTransition] = useState(false);
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const [highlightDealInfo, setHighlightDealInfo] = useState(false);
  const [serviceSelectionExpanded, setServiceSelectionExpanded] = useState(false);
  const [sectionsWithErrors, setSectionsWithErrors] = useState<Set<string>>(new Set());
  const [bankPreferenceMode, setBankPreferenceMode] = useState<'preferred' | 'any'>('preferred');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showFTAPassword, setShowFTAPassword] = useState(false);
  const hasUserInteractedWithCategory = useRef(false);
  const [step1Collapsed, setStep1Collapsed] = useState(false);
  const [step2Collapsed, setStep2Collapsed] = useState(false);
  const [progressStep, setProgressStep] = useState<1 | 2 | 3>(1);
  const [activeSubcard, setActiveSubcard] = useState<string>('Customer Details / Basic Information');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Generate label for all expanded cards
  const getExpandedCardsLabel = () => {
    if (hoveredCard) return hoveredCard;
    
    const cardNameMap: Record<string, string> = {
      'basic': 'Basic Information',
      'lead': 'Source & Channel',
      'service': 'Service Selection',
      'application': 'Deal Information',
    };
    
    const expandedNames = accordionValue
      .map(val => cardNameMap[val])
      .filter(Boolean);
    
    if (expandedNames.length === 0) {
      return activeSubcard;
    } else if (expandedNames.length === 1) {
      const singleCard = expandedNames[0];
      // Determine which step this belongs to
      if (singleCard === 'Basic Information' || singleCard === 'Source & Channel') {
        return `Customer Details / ${singleCard}`;
      } else {
        return `Application Details / ${singleCard}`;
      }
    } else {
      // Multiple cards expanded - show them all
      return expandedNames.join(' • ');
    }
  };

  // Get the last expanded card for a specific step
  const getStepLastExpandedCard = (step: 1 | 2) => {
    const cardNameMap: Record<string, string> = {
      'basic': 'Basic Information',
      'lead': 'Source & Channel',
      'service': 'Service Selection',
      'application': 'Deal Information',
    };
    
    const step1Cards = ['basic', 'lead'];
    const step2Cards = ['service', 'application'];
    
    const relevantCards = accordionValue
      .filter(val => step === 1 ? step1Cards.includes(val) : step2Cards.includes(val));
    
    if (relevantCards.length === 0) return null;
    
    // Return the last expanded card for this step
    const lastCard = relevantCards[relevantCards.length - 1];
    return cardNameMap[lastCard] || null;
  };

  // Dynamic sticky measurements for consistent spacing
  const stageRef = useRef<HTMLDivElement | null>(null);
  const modeLayoutRef = useRef<HTMLDivElement | null>(null);
  const stickyNavRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const formContentCardRef = useRef<HTMLDivElement | null>(null);
  const customerSelectionCardRef = useRef<HTMLDivElement | null>(null);
  const [stageHeight, setStageHeight] = useState(0);
  const [modeLayoutHeight, setModeLayoutHeight] = useState(0);
  const [stickyNavHeight, setStickyNavHeight] = useState(0);
  const [selectionHeight, setSelectionHeight] = useState(0);
  const stickyGap = 0; // px gap to keep consistent padding
  const totalStickyOffset = stageHeight + modeLayoutHeight + selectionHeight + stickyNavHeight + stickyGap;

  // Smoothly scroll to bring form content card back to original position
  const scrollFormCardIntoView = useCallback(() => {
    const el = formContentCardRef.current;
    if (!el) return;

    // Double RAF ensures layout is fully settled after mode/tab changes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          console.info('[ComprehensiveCustomerForm] Reattaching form card via scrollIntoView');
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
          // Fallback precise calculation accounting for sticky headers
          const stageOffset = stageRef.current?.offsetHeight ?? 0;
          const modeLayoutOffset = modeLayoutRef.current?.offsetHeight ?? 0;
          const customerSelectionOffset = customerSelectionCardRef.current?.offsetHeight ?? 0;
          const rect = el.getBoundingClientRect();
          const targetTop = Math.max(0, window.scrollY + rect.top - stageOffset - modeLayoutOffset - customerSelectionOffset);
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      });
    });
  }, []);

  useEffect(() => {
    const update = () => {
      const sh = stageRef.current?.offsetHeight ?? 0;
      const mlh = modeLayoutRef.current?.offsetHeight ?? 0;
      const nh = stickyNavRef.current?.offsetHeight ?? 0;
      const selh = customerSelectionCardRef.current?.offsetHeight ?? 0;
      setStageHeight(sh);
      setModeLayoutHeight(mlh);
      setStickyNavHeight(nh);
      setSelectionHeight(selh);
      // Expose for CSS if needed
      document.documentElement.style.setProperty('--customer-sticky-offset', `${sh + mlh + selh + nh}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [currentStage, customerMode, documents.length]);

  // Ensure keyboard scrolling targets the inner scroll container
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
  }, [currentStage]);

  // Ensure scrollbar reaches absolute top when switching tabs and after sticky heights update
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 5;

    const scrollAllToTop = () => {
      const mainEl = document.querySelector('main') as HTMLElement | null;
      // Scroll known containers
      if (mainEl) mainEl.scrollTop = 0;
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      window.scrollTo(0, 0);
      // Anchor top section as a fallback
      stageRef.current?.scrollIntoView({ block: 'start' });

      attempts++;
      if (attempts < maxAttempts) requestAnimationFrame(scrollAllToTop);
    };

    // Run immediately and again after layout/sticky measurements settle
    scrollAllToTop();
    requestAnimationFrame(scrollAllToTop);
    setTimeout(() => requestAnimationFrame(scrollAllToTop), 0);
  }, [customerMode, stageHeight, selectionHeight, stickyNavHeight]);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'new' | 'existing' | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { uploadDocument } = useCustomer();
  const queryClient = useQueryClient();

  // Fetch all active products for the dropdown
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active, service_category_id')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Filter products based on category filter, search term, and sort "Others" to the end
  const categoryProducts = categoryFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.service_category_id === categoryFilter);
  
  const products = categoryProducts
    .filter(p => 
      productSearchTerm === '' || 
      p.name?.toLowerCase().includes(productSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aIsOther = a.name?.toLowerCase().includes('other');
      const bIsOther = b.name?.toLowerCase().includes('other');
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return 0;
    });

  // Fetch all active service categories for the dropdown
  const { data: serviceCategories = [], isLoading: serviceCategoriesLoading } = useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_category')
        .select('*')
        .eq('is_active', true)
        .order('category_name');
      
      if (error) {
        console.error('Error fetching service categories:', error);
        throw error;
      }
      return data;
    }
  });

  // Fetch the most frequently used product as default
  const { data: defaultProduct } = useQuery({
    queryKey: ['default_product_most_used'],
    queryFn: async () => {
      console.log('Finding most used product...');
      
      // Get product usage count from customers table
      const { data: productCounts, error: countError } = await supabase
        .from('customers')
        .select('product_id')
        .not('product_id', 'is', null);
      
      if (countError) {
        console.error('Error fetching product usage:', countError);
        return null;
      }
      
      // Count occurrences of each product
      const counts = productCounts.reduce((acc, customer) => {
        const productId = customer.product_id;
        acc[productId] = (acc[productId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Product usage counts:', counts);
      
      // Find the most used product
      let mostUsedProductId = null;
      let maxCount = 0;
      
      for (const [productId, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          mostUsedProductId = productId;
        }
      }
      
      if (!mostUsedProductId) {
        console.log('No usage data found, falling back to Business Bank Account');
        // Fallback to Business Bank Account if no usage data
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('id, service_category_id')
          .ilike('name', '%business%bank%account%')
          .eq('is_active', true)
          .limit(1)
          .single();
        
        if (fallbackError) {
          console.error('Fallback product not found:', fallbackError);
          return null;
        }
        
        console.log('Using fallback product:', fallbackData);
        return fallbackData?.id || null;
      }

      console.log(`Most used product ID: ${mostUsedProductId} (used ${maxCount} times)`);
      return mostUsedProductId;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur', // Validate when user leaves a field
    reValidateMode: 'onChange', // Re-validate on every change after first blur
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      company: '',
      amount: 0,
      license_type: 'Mainland',
      lead_source: 'Referral',
      annual_turnover: 0,
      jurisdiction: '',
      bank_preference_1: '',
      bank_preference_2: '',
      bank_preference_3: '',
      customer_notes: '',
      product_id: '',
      service_type_id: '',
      no_of_shareholders: 1,
      mainland_or_freezone: undefined,
      signatory_type: undefined,
      business_activity_details: '',
      minimum_balance_range: undefined,
      // Bookkeeping defaults
      company_incorporation_date: '',
      number_of_entries_per_month: '',
      vat_corporate_tax_status: '',
      wps_transfer_required: false,
      accounting_software: '',
      monthly_transactions: '',
      vat_registered: false,
      bank_accounts_count: 1,
      employees_count: 0,
      service_start_date: '',
      has_previous_records: false,
      reporting_frequency: 'Monthly',
      // Tax filing defaults
      tax_year_period: '',
      first_time_filing: false,
      tax_registration_number: '',
      financial_year_end_date: '',
      has_foreign_operations: false,
      tax_exemptions: '',
      previous_tax_consultant: '',
      filing_deadline: '',
      // GoAML defaults
      trade_license_number: '',
      date_of_incorporation: '',
      registered_office_address: '',
      nature_of_business: '',
      number_of_ubos: 1,
      compliance_officer_name: '',
      compliance_officer_email: '',
      compliance_officer_phone: '',
      compliance_officer_position: '',
      expected_annual_transaction_volume: '',
      transaction_types: '',
      customer_types: '',
      high_risk_countries: '',
      source_of_funds: '',
      // AML/MLRO defaults
      mlro_name: '',
      mlro_email: '',
      mlro_phone: '',
      aml_policy_required: false,
      // Home Finance defaults
      monthly_gross_salary: 0,
      employment_status: '',
      employer_name: '',
      years_with_employer: 0,
      uae_residency_status: undefined,
      salary_range: '',
      business_turnover: '',
      // Business Finance defaults
      company_turnover: '',
      years_since_registration: 0,
      vat_registration_status: undefined,
      purpose_of_finance: '',
      service_charges: 0,
      additional_income: 0,
      additional_income_source: '',
      existing_loan_commitments: 0,
      credit_card_limit: 0,
      credit_card_outstanding: 0,
      property_type: '',
      property_location: '',
      property_value: 0,
      developer_name: '',
      property_status: '',
      intended_use: '',
      loan_amount_required: 0,
      down_payment_amount: 0,
      preferred_loan_tenure: 25,
      purchase_purpose: '',
      has_co_applicant: false,
      co_applicant_name: '',
      co_applicant_income: 0,
      co_applicant_relationship: '',
      // VAT defaults
      vat_registration_type: '',
      already_registered_vat: false,
      existing_trn: '',
      business_activity_description: '',
      import_activities: false,
      export_activities: false,
      import_countries: '',
      export_countries: '',
      previous_tax_period: '',
      vat_accounting_software: '',
      multiple_business_locations: false,
      number_of_locations: 1,
      // FTA Portal defaults
      fta_portal_email: '',
      fta_portal_password: '',
      ...initialData
    },
  });

  const watchLicenseType = form.watch('license_type');
  const watchShareholderCount = form.watch('no_of_shareholders');
  const watchProductId = form.watch('product_id');
  const watchEmploymentStatus = form.watch('employment_status');
  
  // Watch form fields for section validation
  const watchName = form.watch('name');
  const watchEmail = form.watch('email');
  const watchMobile = form.watch('mobile');
  const watchCompany = form.watch('company');
  const watchLeadSource = form.watch('lead_source');
  
  // Section completion checks (value + no validation errors)
  const basicValuesFilled = Boolean(watchName?.trim() && watchEmail?.trim() && watchMobile?.trim() && watchCompany?.trim());
  const basicHasError = Boolean(
    form.formState.errors.name ||
    form.formState.errors.email ||
    form.formState.errors.mobile ||
    form.formState.errors.company
  );
  const isBasicInfoComplete = basicValuesFilled && !basicHasError;
  
  const leadHasError = Boolean(form.formState.errors.lead_source);
  const isSourceChannelComplete = isBasicInfoComplete && Boolean(watchLeadSource) && !leadHasError;
  
  const serviceHasError = Boolean(form.formState.errors.product_id);
  const isServiceSelectionComplete = isSourceChannelComplete && Boolean(watchProductId) && !serviceHasError;

  // Map field names to their corresponding accordion sections
  const getFieldSection = (fieldName: string): string | null => {
    // Basic Information
    if (['name', 'email', 'mobile', 'company'].includes(fieldName)) return 'basic';
    
    // Source & Channel
    if (['lead_source'].includes(fieldName)) return 'lead';
    
    // Service Selection
    if (['product_id', 'service_type_id'].includes(fieldName)) return 'service';
    
    // Deal Information - expanded to catch all possible fields
    if (['amount', 'annual_turnover', 'license_type', 'jurisdiction', 
         'bank_preference_1', 'bank_preference_2', 'bank_preference_3', 'customer_notes',
         'no_of_shareholders', 'mainland_or_freezone', 'signatory_type', 'business_activity_details',
         'minimum_balance_range', 'arr_value', 'deal_stage', 'expected_close_date',
         'probability', 'notes', 'banking_preferences', 'payment_method',
         'accounting_software', 'monthly_transactions', 'vat_registered', 'bank_accounts_count',
         'company_incorporation_date', 'number_of_entries_per_month', 'vat_corporate_tax_status', 'wps_transfer_required',
         'employees_count', 'service_start_date', 'has_previous_records', 'reporting_frequency',
         'monthly_gross_salary', 'employment_status', 'employer_name', 'years_with_employer',
         'additional_income', 'additional_income_source', 'existing_loan_commitments',
         'credit_card_limit', 'credit_card_outstanding', 'property_type', 'property_location',
         'property_value', 'developer_name', 'property_status', 'intended_use',
         'loan_amount_required', 'down_payment_amount', 'preferred_loan_tenure',
         'purchase_purpose', 'has_co_applicant', 'co_applicant_name', 'co_applicant_income',
         'co_applicant_relationship', 'trade_license_number', 'date_of_incorporation',
         'registered_office_address', 'nature_of_business', 'number_of_ubos',
         'compliance_officer_name', 'compliance_officer_email', 'compliance_officer_phone',
         'compliance_officer_position', 'expected_annual_transaction_volume', 'transaction_types',
         'customer_types', 'high_risk_countries', 'source_of_funds', 
         'mlro_name', 'mlro_email', 'mlro_phone', 'aml_policy_required',
         'vat_registration_type',
         'already_registered_vat', 'existing_trn', 'business_activity_description',
         'import_activities', 'export_activities', 'import_countries', 'export_countries',
         'previous_tax_period', 'vat_accounting_software', 'multiple_business_locations',
         'number_of_locations', 'tax_year_period', 'first_time_filing', 'tax_registration_number',
         'financial_year_end_date', 'has_foreign_operations', 'tax_exemptions',
         'previous_tax_consultant', 'filing_deadline'].includes(fieldName)) {
      return 'application';
    }
    
    return null;
  };

  // Handle draft validation with error tracking
  const handlePreviewDraft = useCallback(async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      // Track which sections have errors
      const errors = form.formState.errors;
      const errorSections = new Set<string>();
      
      console.log('Form validation errors:', errors);
      
      Object.keys(errors).forEach((fieldName) => {
        const section = getFieldSection(fieldName);
        console.log(`Field "${fieldName}" mapped to section:`, section);
        if (section) {
          errorSections.add(section);
        }
      });
      
      setSectionsWithErrors(errorSections);
      
      // Expand all sections with errors
      setAccordionValue(prev => {
        const newValue = new Set([...prev, ...Array.from(errorSections)]);
        return Array.from(newValue);
      });
      
      // Scroll to the first error section
      if (errorSections.size > 0) {
        const firstErrorSection = Array.from(errorSections)[0];
        setTimeout(() => {
          const sectionElement = document.querySelector(`[data-section-id="${firstErrorSection}"]`);
          if (sectionElement) {
            const elementPosition = (sectionElement as HTMLElement).getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - totalStickyOffset - 20;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      
      toast({
        title: 'Validation Error',
        description: `Please fix errors in ${errorSections.size} section${errorSections.size !== 1 ? 's' : ''} before continuing`,
        variant: 'destructive',
      });
    } else {
      setSectionsWithErrors(new Set());
      setCurrentStage('preview');
    }
  }, [form, toast, totalStickyOffset]);

  // Real-time error tracking - update sectionsWithErrors as user types
  useEffect(() => {
    const errors = form.formState.errors;
    const errorSections = new Set<string>();
    
    Object.keys(errors).forEach((fieldName) => {
      const section = getFieldSection(fieldName);
      if (section) {
        errorSections.add(section);
      }
    });
    
    setSectionsWithErrors(errorSections);
  }, [form.formState.errors]);

  // Auto-select Business Bank Account as default product when form loads
  useEffect(() => {
    console.log('Default product selection check:', {
      defaultProduct,
      watchProductId,
      initialData: !!initialData,
      hasUserInteracted: hasUserInteractedWithCategory.current,
      allProductsCount: allProducts.length
    });
    
    if (defaultProduct && !watchProductId && !initialData && !hasUserInteractedWithCategory.current) {
      console.log('Auto-selecting Business Bank Account:', defaultProduct);
      
      form.setValue('product_id', defaultProduct, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      
      // Also set the category filter to this product's category
      const product = allProducts.find(p => p.id === defaultProduct);
      console.log('Found product for category:', product);
      
      if (product?.service_category_id) {
        console.log('Setting category filter to:', product.service_category_id);
        setCategoryFilter(product.service_category_id);
      }
    }
  }, [defaultProduct, watchProductId, initialData, form, allProducts]);

  // Real-time subscription to update default product when products change
  useEffect(() => {
    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          // Invalidate and refetch the default product query
          queryClient.invalidateQueries({ queryKey: ['default_product_business_bank'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-scroll and highlight Deal Information when product is selected
  useEffect(() => {
    if (watchProductId) {
      // Expand Deal Information section if not already expanded
      setAccordionValue(prev => {
        if (!prev.includes('application')) {
          return [...prev, 'application'];
        }
        return prev;
      });

      // Scroll to Deal Information section smoothly (temporarily disabled to prevent auto-jumps)
      // setTimeout(() => {
      //   const dealInfoSection = document.querySelector('[data-section="deal-information"]');
      //   if (dealInfoSection) {
      //     const elementPosition = dealInfoSection.getBoundingClientRect().top;
      //     const offsetPosition = elementPosition + window.pageYOffset - 80;
      //     window.scrollTo({
      //       top: offsetPosition,
      //       behavior: 'smooth'
      //     });
      //     setHighlightDealInfo(true);
      //     setTimeout(() => setHighlightDealInfo(false), 2000);
      //   }
      // }, 100);
    } else {
      // Collapse Deal Information section when product is unselected
      setAccordionValue(prev => prev.filter(item => item !== 'application'));
    }
  }, [watchProductId]);

  // Check which product type is selected
  const selectedProduct = products.find(p => p.id === watchProductId);
  const selectedProductName = selectedProduct?.name.toLowerCase() || '';
  const selectedProductCategoryId = selectedProduct?.service_category_id || '';
  
  // Find the category name for the selected product
  const selectedCategory = serviceCategories.find(cat => cat.id === selectedProductCategoryId);
  const selectedProductNameNoSpaces = selectedProductName.replace(/\s+/g, '');
  
  // Determine the primary product type (mutually exclusive for cleaner UI)
  const getProductType = () => {
    if (selectedProductName.includes('aml') && selectedProductName.includes('services')) return 'aml_services';
    if (selectedProductName.includes('goaml')) return 'goaml';
    if (selectedProductName.includes('home') && selectedProductName.includes('finance')) return 'home_finance';
    if (selectedProductName.includes('business') && selectedProductName.includes('finance')) return 'business_finance';
    if (selectedProductNameNoSpaces.includes('bookkeeping') || 
        selectedProductNameNoSpaces.includes('book') || 
        selectedProductName.includes('accounting')) return 'bookkeeping';
    if (selectedProductName.includes('vat') && selectedProductName.includes('registration')) return 'vat_registration';
    if (selectedProductName.includes('registration') && selectedProductName.includes('tax')) return 'tax_registration';
    if (selectedProductName.includes('filing') || (selectedProductName.includes('tax') && !selectedProductName.includes('registration'))) return 'tax_filing';
    if (selectedProductName.includes('bank')) return 'bank_account';
    if (selectedProductName.includes('company') || 
        selectedProductName.includes('formation') || 
        selectedProductName.includes('license')) return 'company_formation';
    return 'general'; // Default for any other products
  };
  
  const productType = getProductType();
  
  // Legacy flags for backward compatibility (if needed elsewhere)
  const hasBookkeeping = productType === 'bookkeeping';
  const hasCompanyFormation = productType === 'company_formation';
  const hasBankAccount = productType === 'bank_account';
  const hasGoAML = productType === 'goaml';
  const hasAMLServices = productType === 'aml_services';
  const hasHomeFinance = productType === 'home_finance';
  const hasBusinessFinance = productType === 'business_finance';
  const hasVAT = productType === 'vat_registration';
  const hasTaxRegistration = productType === 'tax_registration';
  const hasTaxFiling = productType === 'tax_filing';
  
  // Check if service requires FTA Portal credentials
  const requiresFTAPortal = hasVAT || hasTaxRegistration || hasTaxFiling;

  // Notify parent component of form field changes for sidebar
  useEffect(() => {
    if (onProductChange) {
      onProductChange(selectedProductName || null);
    }
  }, [selectedProductName, onProductChange]);

  useEffect(() => {
    if (onEmailChange) {
      onEmailChange(watchEmail || '');
    }
  }, [watchEmail, onEmailChange]);

  useEffect(() => {
    if (onNameChange) {
      onNameChange(watchName || '');
    }
  }, [watchName, onNameChange]);

  useEffect(() => {
    if (onMobileChange) {
      onMobileChange(watchMobile || '');
    }
  }, [watchMobile, onMobileChange]);

  useEffect(() => {
    if (onCompanyChange) {
      onCompanyChange(watchCompany || '');
    }
  }, [watchCompany, onCompanyChange]);

  // Fetch existing customers for selection
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        let query = supabase
          .from('customers')
          .select('id, company, name, email, mobile')
          .order('company', { ascending: true });

        // Non-admin users can only see their own customers
        if (!isAdmin && user?.id) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setExistingCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id, isAdmin]);

  // Handle existing customer selection
  const handleCustomerSelect = useCallback((customerId: string | null, customer: any) => {
    setSelectedCustomerId(customerId || '');
    if (customer) {
      form.setValue('company', customer.company);
      form.setValue('name', customer.name);
      form.setValue('email', customer.email);
      form.setValue('mobile', customer.mobile);
    }
  }, [form]);

  // Handle new company creation from dialog
  const handleCompanyCreated = useCallback((customer: any) => {
    setExistingCustomers(prev => [...prev, customer]);
    setSelectedCustomerId(customer.id);
    form.setValue('company', customer.company);
    form.setValue('name', customer.name);
    form.setValue('email', customer.email);
    form.setValue('mobile', customer.mobile);
    toast({
      title: 'Success',
      description: 'Company added to the list',
    });
  }, [form, toast]);

  // Check if form has unsaved data - only consider typed text in inputs/areas
  const hasUnsavedData = useCallback(() => {
    const formValues = form.getValues() as Record<string, unknown>;
    const dirty = form.formState.dirtyFields as Record<string, any>;

    // Consider a field as unsaved only if:
    // - it's a string (typed text)
    // - it's non-empty after trim
    // - the field is dirty (user changed it from default)
    const hasTypedText = Object.entries(formValues).some(([key, value]) => {
      return typeof value === 'string' && value.trim() !== '' && !!dirty?.[key];
    });

    // Log safe booleans only
    console.log('[ComprehensiveCustomerForm] hasUnsavedData (typed text only):', {
      mode: customerMode,
      hasTypedText,
    });

    return hasTypedText;
  }, [form, customerMode]);

  // Handle mode switch with confirmation
  const handleModeSwitch = useCallback((newMode: 'new' | 'existing') => {
    if (newMode === customerMode) return;

    if (hasUnsavedData()) {
      setPendingMode(newMode);
      setShowSwitchConfirm(true);
    } else {
      // No unsaved data, switch directly
      setCustomerMode(newMode);
      if (newMode === 'new') {
        setSelectedCustomerId('');
        form.reset();
      }

      // Scroll form content card to its original position
      requestAnimationFrame(() => scrollFormCardIntoView());
    }
  }, [customerMode, hasUnsavedData, form, scrollFormCardIntoView]);

  // Confirm mode switch without saving
  const confirmModeSwitch = useCallback(() => {
    if (pendingMode) {
      setCustomerMode(pendingMode);
      if (pendingMode === 'new') {
        setSelectedCustomerId('');
        form.reset();
      } else {
        // Switching to existing, clear form
        form.reset();
      }
      setPendingMode(null);

      // Scroll form content card to its original position
      requestAnimationFrame(() => scrollFormCardIntoView());
    }
    setShowSwitchConfirm(false);
  }, [pendingMode, form, scrollFormCardIntoView]);

  // Cancel mode switch
  const cancelModeSwitch = useCallback(() => {
    setPendingMode(null);
    setShowSwitchConfirm(false);
  }, []);

  // Handle section navigation
  const handleSectionNavigation = useCallback((sectionId: string) => {
    // Expand the section if not already expanded
    setAccordionValue(prev => {
      if (!prev.includes(sectionId)) {
        return [...prev, sectionId];
      }
      return prev;
    });

    // Scroll to the section with offset for sticky header (temporarily disabled to prevent auto-jumps)
    // setTimeout(() => {
    //   const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
    //   if (sectionElement) {
    //     const elementPosition = (sectionElement as HTMLElement).getBoundingClientRect().top;
    //     const offsetPosition = elementPosition + window.pageYOffset - totalStickyOffset;
    //     window.scrollTo({
    //       top: offsetPosition,
    //       behavior: 'smooth'
    //     });
    //   }
    // }, 100);
  }, []);

  // Wizard steps configuration
  const wizardSteps = [
    { id: 'basic', label: 'Basic Info', icon: Users },
    { id: 'lead', label: 'Source & Channel', icon: ClipboardList },
    { id: 'service', label: 'Service Selection', icon: Building2 },
    { id: 'application', label: 'Deal Info', icon: Save },
  ];

  const handleWizardNext = useCallback(() => {
    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [wizardStep, wizardSteps.length]);

  const handleWizardPrevious = useCallback(() => {
    if (wizardStep > 0) {
      setWizardStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [wizardStep]);

  // Define sections for navigation
  const navigationSections = [
    {
      id: 'basic',
      label: 'Basic Info',
      isComplete: !!isBasicInfoComplete,
      isActive: accordionValue.includes('basic'),
      isVisible: true, // Always show
      hasError: sectionsWithErrors.has('basic'),
    },
    {
      id: 'lead',
      label: 'Source & Channel',
      isComplete: !!isSourceChannelComplete,
      isActive: accordionValue.includes('lead'),
      isVisible: true, // Always show
      hasError: sectionsWithErrors.has('lead'),
    },
    {
      id: 'service',
      label: 'Service',
      isComplete: !!isServiceSelectionComplete,
      isActive: accordionValue.includes('service'),
      isVisible: true, // Always show
      hasError: sectionsWithErrors.has('service'),
    },
    {
      id: 'application',
      label: 'Deal Info',
      isComplete: false, // Add logic for deal info completion if needed
      isActive: accordionValue.includes('application'),
      isVisible: customerMode === 'new' && (!!isServiceSelectionComplete || (accordionValue.includes('service') && !!watchProductId)),
      hasError: sectionsWithErrors.has('application'),
    },
  ];

  // Create default documents when license type changes
  const createDefaultDocuments = useCallback(async (customerId: string, licenseType: string, shareholderCount: number = 1) => {
    interface DefaultDocument {
      name: string;
      is_mandatory: boolean;
      category: string;
      requires_license_type?: string;
    }

    const defaultDocuments: DefaultDocument[] = [
      // Mandatory documents for all license types
      { name: 'Passport Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Emirates ID Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Trade License Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Memorandum of Association (MOA)', is_mandatory: true, category: 'mandatory' },
      { name: 'Bank Statements (Last 6 months)', is_mandatory: true, category: 'mandatory' },
      
      // Supporting documents (optional but recommended)
      { name: 'Company Profile', is_mandatory: false, category: 'supporting' },
      { name: 'Audited Financial Statements', is_mandatory: false, category: 'supporting' },
      { name: 'Business Plan', is_mandatory: false, category: 'supporting' },
      { name: 'Proof of Address', is_mandatory: false, category: 'supporting' },
    ];

    // Generate multiple signatory document sets based on number of shareholders
    for (let i = 1; i <= shareholderCount; i++) {
      const shareholderLabel = shareholderCount > 1 ? ` (Shareholder ${i})` : '';
      // Segregate documents into different categories
      defaultDocuments.push(
        { name: `Authorized Signatory Passport${shareholderLabel}`, is_mandatory: false, category: 'passport_docs' },
        { name: `Authorized Signatory Emirates ID${shareholderLabel}`, is_mandatory: false, category: 'emirates_id_docs' },
        { name: `Bank Statement${shareholderLabel}`, is_mandatory: false, category: 'bank_statement_docs' },
      );
    }

    // Add Freezone-specific documents if applicable
    if (licenseType === 'Freezone') {
      defaultDocuments.push(
        { name: 'Freezone License Copy', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'Lease Agreement (Freezone)', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'No Objection Certificate', is_mandatory: false, category: 'freezone', requires_license_type: 'Freezone' }
      );
    }

    const documentsToInsert = defaultDocuments.map(doc => ({
      customer_id: customerId,
      name: doc.name,
      is_mandatory: doc.is_mandatory,
      category: doc.category as "mandatory" | "freezone" | "supporting" | "signatory",
      requires_license_type: doc.requires_license_type ? doc.requires_license_type as "Mainland" | "Freezone" | "Offshore" : null,
      is_uploaded: false,
      file_path: null
    }));

    const { data, error } = await supabase
      .from('documents')
      .insert(documentsToInsert)
      .select();

    if (error) {
      console.error('Error creating default documents:', error);
      throw error;
    }

    return data;
  }, []);

  const validateForm = useCallback((data: FormData): string[] => {
    const errors: string[] = [];
    
    if (!validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!validatePhoneNumber(data.mobile)) {
      errors.push('Please enter a valid phone number');
    }
    
    if (!validateCompanyName(data.company)) {
      errors.push('Please enter a valid company name');
    }
    
    return errors;
  }, []);

  const handleSubmit = useCallback(async (data: FormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create applications.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check
    const rateLimitResult = ProductionRateLimit.checkRateLimit(user.id, 'customerCreate');
    if (!rateLimitResult.allowed) {
      toast({
        title: 'Rate Limited',
        description: `Too many creation attempts. Please wait before trying again.`,
        variant: 'destructive',
      });
      return;
    }

    // Form validation
    const validationErrors = validateForm(data);
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    PerformanceMonitor.startTiming('application-create');

    try {
      FeatureAnalytics.trackUserAction('application_create_attempt', {
        license_type: data.license_type,
        lead_source: data.lead_source,
        amount: data.amount
      }, user.id);

      // Step 0: Encrypt FTA password if provided
      let encryptedFTAPassword = null;
      let ftaPasswordIV = null;
      
      if (data.fta_portal_password && data.fta_portal_password.trim()) {
        try {
          const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('encrypt-fta-credentials', {
            body: {
              action: 'encrypt',
              password: data.fta_portal_password.trim()
            }
          });

          if (encryptError) {
            console.error('FTA password encryption error:', encryptError);
            throw new Error('Failed to encrypt FTA password');
          }

          encryptedFTAPassword = encryptResult.encrypted;
          ftaPasswordIV = encryptResult.iv;
          console.log('FTA password encrypted successfully');
        } catch (encryptErr) {
          console.error('Encryption failed:', encryptErr);
          toast({
            title: 'Encryption Error',
            description: 'Failed to secure FTA password. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Step 1: Find or create customer
      let customerId = selectedCustomerId;
      
      if (customerMode === 'new' || !selectedCustomerId) {
        // Create new customer with basic info + license_type
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: sanitizeInput(data.name.trim()),
            email: data.email.toLowerCase().trim(),
            mobile: data.mobile.replace(/\s/g, ''),
            company: sanitizeInput(data.company.trim()),
            license_type: data.license_type, // license_type stays with customer
            user_id: user.id,
            lead_source: 'Website', // Default value
            amount: 0, // Default value, actual amount goes to application
            status: 'Draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (customerError) {
          console.error('Customer creation error:', customerError);
          throw customerError;
        }

        customerId = customer.id;
      }

      // Step 2: Create application with application-specific data
      const { data: application, error: appError } = await supabase
        .from('account_applications')
        .insert([{
          customer_id: customerId,
          application_type: 'license',
          submission_source: 'web_form',
          status: 'draft',
            application_data: {
            lead_source: data.lead_source,
            amount: data.amount,
            preferred_bank: data.bank_preference_1?.trim() || null,
            preferred_bank_2: data.bank_preference_2?.trim() || null,
            preferred_bank_3: data.bank_preference_3?.trim() || null,
            annual_turnover: data.annual_turnover,
            jurisdiction: data.jurisdiction ? sanitizeInput(data.jurisdiction.trim()) : null,
            customer_notes: data.customer_notes ? sanitizeInput(data.customer_notes.trim()) : null,
            nationality: data.nationality ? sanitizeInput(data.nationality.trim()) : null,
            proposed_activity: data.proposed_activity ? sanitizeInput(data.proposed_activity.trim()) : null,
            mainland_or_freezone: data.mainland_or_freezone,
            number_of_shareholders: data.no_of_shareholders,
            signatory_type: data.signatory_type,
            business_activity_details: data.business_activity_details ? sanitizeInput(data.business_activity_details.trim()) : null,
            minimum_balance_range: data.minimum_balance_range,
            product_id: data.product_id,
            user_id: user.id,
            // Bookkeeping-specific fields
            ...(data.company_incorporation_date && { company_incorporation_date: data.company_incorporation_date }),
            ...(data.number_of_entries_per_month && { number_of_entries_per_month: data.number_of_entries_per_month }),
            ...(data.vat_corporate_tax_status && { vat_corporate_tax_status: data.vat_corporate_tax_status }),
            ...(data.wps_transfer_required !== undefined && { wps_transfer_required: data.wps_transfer_required }),
            ...(data.accounting_software && { accounting_software: data.accounting_software }),
            ...(data.monthly_transactions && { monthly_transactions: data.monthly_transactions }),
            ...(data.vat_registered !== undefined && { vat_registered: data.vat_registered }),
            ...(data.bank_accounts_count && { bank_accounts_count: data.bank_accounts_count }),
            ...(data.employees_count !== undefined && { employees_count: data.employees_count }),
            ...(data.service_start_date && { service_start_date: data.service_start_date }),
            ...(data.has_previous_records !== undefined && { has_previous_records: data.has_previous_records }),
            ...(data.reporting_frequency && { reporting_frequency: data.reporting_frequency }),
            // Corporate tax filing fields
            ...(data.tax_year_period && { tax_year_period: data.tax_year_period }),
            ...(data.first_time_filing !== undefined && { first_time_filing: data.first_time_filing }),
            ...(data.tax_registration_number && { tax_registration_number: data.tax_registration_number }),
            ...(data.financial_year_end_date && { financial_year_end_date: data.financial_year_end_date }),
            ...(data.has_foreign_operations !== undefined && { has_foreign_operations: data.has_foreign_operations }),
            ...(data.tax_exemptions && { tax_exemptions: data.tax_exemptions }),
            ...(data.previous_tax_consultant && { previous_tax_consultant: data.previous_tax_consultant }),
            ...(data.filing_deadline && { filing_deadline: data.filing_deadline }),
            // FTA Portal credentials (encrypted)
            ...(data.fta_portal_email && { fta_portal_email: data.fta_portal_email }),
            ...(encryptedFTAPassword && { fta_portal_password_encrypted: encryptedFTAPassword }),
            ...(ftaPasswordIV && { fta_portal_password_iv: ftaPasswordIV }),
            // AML/MLRO fields
            ...(data.mlro_name && { mlro_name: sanitizeInput(data.mlro_name) }),
            ...(data.mlro_email && { mlro_email: data.mlro_email }),
            ...(data.mlro_phone && { mlro_phone: sanitizeInput(data.mlro_phone) }),
            ...(data.aml_policy_required !== undefined && { aml_policy_required: data.aml_policy_required }),
            // Customer Identification fields
            ...(data.customer_full_legal_name && { customer_full_legal_name: sanitizeInput(data.customer_full_legal_name) }),
            ...(data.customer_date_of_birth && { customer_date_of_birth: data.customer_date_of_birth }),
            ...(data.customer_nationality && { customer_nationality: sanitizeInput(data.customer_nationality) }),
            ...(data.customer_national_id && { customer_national_id: sanitizeInput(data.customer_national_id) }),
            ...(data.customer_passport_number && { customer_passport_number: sanitizeInput(data.customer_passport_number) }),
            ...(data.customer_id_expiry_date && { customer_id_expiry_date: data.customer_id_expiry_date }),
            ...(data.customer_residential_address && { customer_residential_address: sanitizeInput(data.customer_residential_address) }),
            ...(data.customer_contact_phone && { customer_contact_phone: sanitizeInput(data.customer_contact_phone) }),
            ...(data.customer_contact_email && { customer_contact_email: data.customer_contact_email }),
            // Business/Company Information fields
            ...(data.business_company_name && { business_company_name: sanitizeInput(data.business_company_name) }),
            ...(data.business_registration_number && { business_registration_number: sanitizeInput(data.business_registration_number) }),
            ...(data.business_trade_license_number && { business_trade_license_number: sanitizeInput(data.business_trade_license_number) }),
            ...(data.business_trade_license_expiry && { business_trade_license_expiry: data.business_trade_license_expiry }),
            ...(data.business_activity_sector && { business_activity_sector: sanitizeInput(data.business_activity_sector) }),
            ...(data.business_company_address && { business_company_address: sanitizeInput(data.business_company_address) }),
            ...(data.business_authorized_signatories && { business_authorized_signatories: sanitizeInput(data.business_authorized_signatories) }),
            ...(data.business_beneficial_ownership && { business_beneficial_ownership: sanitizeInput(data.business_beneficial_ownership) }),
            ...(data.business_ubo_information && { business_ubo_information: sanitizeInput(data.business_ubo_information) }),
            // Financial Profile fields
            ...(data.financial_source_of_funds && { financial_source_of_funds: sanitizeInput(data.financial_source_of_funds) }),
            ...(data.financial_source_of_wealth && { financial_source_of_wealth: sanitizeInput(data.financial_source_of_wealth) }),
            ...(data.financial_expected_monthly_volume && { financial_expected_monthly_volume: sanitizeInput(data.financial_expected_monthly_volume) }),
            ...(data.financial_expected_annual_volume && { financial_expected_annual_volume: sanitizeInput(data.financial_expected_annual_volume) }),
            ...(data.financial_account_purpose && { financial_account_purpose: sanitizeInput(data.financial_account_purpose) }),
            ...(data.financial_anticipated_activity && { financial_anticipated_activity: sanitizeInput(data.financial_anticipated_activity) }),
            ...(data.financial_employment_status && { financial_employment_status: data.financial_employment_status }),
            ...(data.financial_employer_details && { financial_employer_details: sanitizeInput(data.financial_employer_details) }),
            ...(data.financial_annual_income && { financial_annual_income: sanitizeInput(data.financial_annual_income) }),
            ...(data.financial_annual_turnover && { financial_annual_turnover: sanitizeInput(data.financial_annual_turnover) }),
            // Risk Assessment fields
            ...(data.risk_pep_status && { risk_pep_status: data.risk_pep_status }),
            ...(data.risk_pep_details && { risk_pep_details: sanitizeInput(data.risk_pep_details) }),
            ...(data.risk_sanctions_screening && { risk_sanctions_screening: sanitizeInput(data.risk_sanctions_screening) }),
            ...(data.risk_adverse_media && { risk_adverse_media: sanitizeInput(data.risk_adverse_media) }),
            ...(data.risk_country_risk && { risk_country_risk: sanitizeInput(data.risk_country_risk) }),
            ...(data.risk_business_relationship_purpose && { risk_business_relationship_purpose: sanitizeInput(data.risk_business_relationship_purpose) }),
          }
        }])
        .select()
        .single();

      if (appError) {
        console.error('Application creation error:', appError);
        throw appError;
      }

      // Step 3: Create default application documents
      const defaultDocTypes = [
        'Passport Copy',
        'Emirates ID Copy',
        'Trade License Copy',
        'Memorandum of Association (MOA)',
        'Bank Statements (Last 6 months)',
        'Company Profile',
        'Audited Financial Statements',
        'Business Plan',
        'Proof of Address'
      ];

      // Add shareholder documents
      for (let i = 1; i <= data.no_of_shareholders; i++) {
        const shareholderLabel = data.no_of_shareholders > 1 ? ` (Shareholder ${i})` : '';
        defaultDocTypes.push(
          `Authorized Signatory Passport${shareholderLabel}`,
          `Authorized Signatory Emirates ID${shareholderLabel}`,
          `Bank Statement${shareholderLabel}`
        );
      }

      // Add Freezone-specific documents
      if (data.license_type === 'Freezone') {
        defaultDocTypes.push(
          'Freezone License Copy',
          'Lease Agreement (Freezone)',
          'No Objection Certificate'
        );
      }

      const documentsToInsert = defaultDocTypes.map(docType => ({
        application_id: application.id,
        document_type: docType,
        is_uploaded: false,
        file_path: null
      }));

      const { data: appDocs, error: docsError } = await supabase
        .from('application_documents')
        .insert(documentsToInsert)
        .select();

      if (docsError) {
        console.error('Error creating application documents:', docsError);
        // Don't fail the whole process if documents fail
      }

      // Note: appDocs are application_documents, not customer documents
      // Store application ID for later reference
      setCreatedCustomerId(application.id); // Store application ID for document upload

      PerformanceMonitor.endTiming('application-create');
      
      FeatureAnalytics.trackUserAction('application_create_success', {
        application_id: application.id,
        customer_id: customerId,
        license_type: data.license_type,
        lead_source: data.lead_source
      }, user.id);

      toast({
        title: 'Application Created',
        description: `Application for ${data.company} has been successfully created.`,
      });

      // Show success transition animation
      setShowSuccessTransition(true);
      
      // Wait for animation then move to documents stage
      setTimeout(() => {
        setShowSuccessTransition(false);
        setCurrentStage('documents');
      }, 2000);
      
      // Trigger refresh in parent
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user.id,
        userRole: user.profile?.role,
        page: 'application_create'
      });

      FeatureAnalytics.trackUserAction('application_create_failed', {
        error: 'Unexpected error'
      }, user.id);

      toast({
        title: 'Error',
        description: 'Failed to create application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, validateForm, customerMode, selectedCustomerId]);

  const handleDocumentUpload = useCallback(async (documentId: string, filePath: string) => {
    if (!createdCustomerId) return;
    
    try {
      await uploadDocument(createdCustomerId, documentId, filePath);
      
      // Update local documents state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, is_uploaded: true, file_path: filePath }
          : doc
      ));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    }
  }, [createdCustomerId, uploadDocument, toast]);

  const handleFinish = useCallback(() => {
    // Always call onSuccess to trigger refresh
    if (onSuccess) {
      onSuccess();
    }
    
    toast({
      title: 'Application Complete',
      description: 'Customer application has been created successfully.',
    });
  }, [onSuccess, toast]);

  const mandatoryDocuments = documents.filter(doc => doc.is_mandatory);
  const mandatoryDocumentsUploaded = mandatoryDocuments.every(doc => doc.is_uploaded);
  const allMandatoryUploaded = mandatoryDocuments.length > 0 && mandatoryDocumentsUploaded;

  return (
    <div className="relative max-w-5xl mx-auto pb-6">
      {/* Navigation Blocker - prevents navigation when there's unsaved data */}
      <NavigationBlocker 
        when={hasUnsavedData() && !createdCustomerId} 
        message="You have unsaved changes in the application form. Leaving this page will discard all your progress. Are you sure you want to continue?"
      />
      
      {/* Success Transition Overlay */}
      {showSuccessTransition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="text-center space-y-4">
              {/* Success Checkmark */}
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Application Created! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Moving to document upload...
                </p>
              </div>

              {/* Animated Arrow */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                  Details
                </div>
                <div className="flex gap-1 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animation-delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animation-delay-200"></div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Documents
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Indicator - Premium Stylish Design */}
      <Card ref={stageRef} className="sticky top-0 z-[100] border border-b-2 border-border shadow-elegant ring-1 ring-border/50 overflow-hidden bg-gradient-to-b from-primary/[0.02] to-background/95 backdrop-blur-md mb-0 rounded-b-none">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <CardContent className="relative pt-2 px-3 pb-1">
          {/* Progress Indicator Badge with Help Button */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex-1" />
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 border-primary/20 text-primary font-medium flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Progress Guide
            </Badge>
            <div className="flex-1 flex justify-end">
              <AgentHelpDialog />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* Stage 1 */}
            <div className="flex flex-col items-center gap-1 flex-1 group cursor-pointer transition-transform hover:scale-105">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 relative",
                progressStep === 1 
                  ? "bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-110 rotate-6" 
                  : progressStep > 1
                  ? "bg-gradient-to-br from-emerald-400 via-green-400 to-emerald-500 text-white shadow-md shadow-emerald-400/40 ring-1 ring-emerald-300/50 ring-offset-1 ring-offset-background"
                  : "bg-gradient-to-br from-gray-100 via-muted to-gray-200 dark:from-gray-800 dark:via-muted dark:to-gray-900 text-gray-400 dark:text-gray-600"
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-lg opacity-0 transition-opacity duration-500",
                  progressStep === 1 && "opacity-70 bg-emerald-500 animate-pulse"
                )} />
                {progressStep > 1 ? (
                  <svg className="w-4 h-4 relative z-10 animate-scale-in" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <ClipboardList className="w-4 h-4 relative z-10" />
                )}
              </div>
              <div className="text-center space-y-0">
                <div className={cn(
                  "text-[10px] font-extrabold tracking-wide",
                  progressStep === 1 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : progressStep > 1
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  Step 1
                </div>
                <div className={cn(
                  "text-[10px] font-semibold",
                  progressStep === 1 || progressStep > 1
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}>
                  Customer Details{getStepLastExpandedCard(1) ? ` / ${getStepLastExpandedCard(1)}` : ''}
                </div>
              </div>
            </div>

            {/* Connecting Line 1 with Enhanced Gradient */}
            <div className="flex-1 relative px-1" style={{ maxWidth: '60px' }}>
              <div className="relative h-1.5 flex items-center">
                <div className={cn(
                  "h-1.5 rounded-full transition-all duration-700 flex-1 relative overflow-hidden",
                  progressStep >= 2
                    ? "bg-gradient-to-r from-emerald-400 via-blue-400 to-blue-500 shadow-sm shadow-blue-500/30" 
                    : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
                )}>
                  {progressStep >= 2 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
                  )}
                </div>
                <div className={cn(
                  "absolute -right-2 w-8 h-8 rounded-full transition-all duration-500 flex items-center justify-center backdrop-blur-sm",
                  progressStep >= 2
                    ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/70 ring-2 ring-blue-400/50 ring-offset-1 ring-offset-background" 
                    : "bg-gray-400 dark:bg-gray-600 shadow-md"
                )}>
                  {/* Chevron Arrow - Always white for maximum contrast */}
                  <div className="w-4 h-4 border-r-[2px] border-t-[2px] border-white rotate-45 transition-all duration-300" />
                </div>
              </div>
            </div>
            
            {/* Stage 2 - Application Details */}
            <div className="flex flex-col items-center gap-1 flex-1 group cursor-pointer transition-transform hover:scale-105">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 relative",
                  progressStep === 2
                    ? "bg-gradient-to-br from-blue-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110 -rotate-6" 
                    : progressStep > 2 
                    ? "bg-gradient-to-br from-blue-400 via-sky-400 to-blue-500 text-white shadow-md shadow-blue-400/40 ring-1 ring-blue-300/50 ring-offset-1 ring-offset-background"
                    : "bg-gradient-to-br from-gray-100 via-muted to-gray-200 dark:from-gray-800 dark:via-muted dark:to-gray-900 text-gray-400 dark:text-gray-600 opacity-50"
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-lg opacity-0 transition-opacity duration-500",
                  progressStep === 2 && "opacity-70 bg-blue-500 animate-pulse"
                )} />
                {progressStep > 2 ? (
                  <svg className="w-4 h-4 relative z-10 animate-scale-in" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Building2 className="w-4 h-4 relative z-10" />
                )}
              </div>
              <div className="text-center space-y-0">
                <div className={cn(
                  "text-[10px] font-extrabold tracking-wide",
                  progressStep === 2
                    ? "text-blue-600 dark:text-blue-400" 
                    : progressStep > 2
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  Step 2
                </div>
                <div className={cn(
                  "text-[10px] font-semibold",
                  progressStep >= 2
                    ? "text-foreground" 
                    : "text-muted-foreground/50"
                )}>
                  Application Details{getStepLastExpandedCard(2) ? ` / ${getStepLastExpandedCard(2)}` : ''}
                </div>
              </div>
            </div>

            {/* Connecting Line 2 with Enhanced Gradient */}
            <div className="flex-1 relative px-1" style={{ maxWidth: '60px' }}>
              <div className="relative h-1.5 flex items-center">
                <div className={cn(
                  "h-1.5 rounded-full transition-all duration-700 flex-1 relative overflow-hidden",
                  progressStep >= 3
                    ? "bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 shadow-sm shadow-purple-500/30" 
                    : "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
                )}>
                  {progressStep >= 3 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
                  )}
                </div>
                <div className={cn(
                  "absolute -right-2 w-8 h-8 rounded-full transition-all duration-500 flex items-center justify-center backdrop-blur-sm",
                  progressStep >= 3
                    ? "bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/70 ring-2 ring-purple-400/50 ring-offset-1 ring-offset-background" 
                    : "bg-gray-400 dark:bg-gray-600 shadow-md"
                )}>
                  {/* Chevron Arrow - Always white for maximum contrast */}
                  <div className="w-4 h-4 border-r-[2px] border-t-[2px] border-white rotate-45 transition-all duration-300" />
                </div>
              </div>
            </div>
            
            {/* Stage 3 - Preview */}
            <div className="flex flex-col items-center gap-1 flex-1 group cursor-pointer transition-transform hover:scale-105">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 relative",
                  progressStep === 3
                    ? "bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110 rotate-6" 
                    : progressStep > 3
                    ? "bg-gradient-to-br from-purple-400 via-violet-400 to-purple-500 text-white shadow-md shadow-purple-400/40 ring-1 ring-purple-300/50 ring-offset-1 ring-offset-background"
                    : "bg-gradient-to-br from-gray-100 via-muted to-gray-200 dark:from-gray-800 dark:via-muted dark:to-gray-900 text-gray-400 dark:text-gray-600 opacity-50"
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-lg opacity-0 transition-opacity duration-500",
                  progressStep === 3 && "opacity-70 bg-purple-500 animate-pulse"
                )} />
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-center space-y-0">
                <div className={cn(
                  "text-[10px] font-extrabold tracking-wide",
                  progressStep === 3
                    ? "text-purple-600 dark:text-purple-400" 
                    : progressStep > 3
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  Step 3
                </div>
                <div className={cn(
                  "text-[10px] font-semibold",
                  progressStep >= 3
                    ? "text-foreground" 
                    : "text-muted-foreground/50"
                )}>
                  Review & Submit
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Customer Selection Card - Sticky */}
      <div ref={customerSelectionCardRef} className="sticky z-40 -mt-px" style={{ top: `${stageHeight}px` }}>
        <Card className="w-full overflow-hidden relative z-10 border shadow-md bg-gradient-to-b from-background to-background/95 backdrop-blur-sm rounded-t-none rounded-b-none border-t-0 mb-0">
        {/* Customer Mode Selection */}
        <div className="grid grid-cols-2 w-full border-b border-border">
          {customerMode === 'existing' ? (
            <>
              <button
                type="button"
                onClick={() => handleModeSwitch('existing')}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 py-2 px-3 transition-all duration-300 text-xs font-semibold",
                  "border-b-2 border-green-500 shadow-sm",
                  "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                )}
                aria-selected={true}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Select Existing</span>
                <span className="sm:hidden">Existing</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleModeSwitch('new')}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 py-2 px-3 transition-all duration-300 text-xs font-semibold",
                  "border-b-2 border-transparent text-muted-foreground",
                  "hover:bg-muted/50 hover:text-foreground"
                )}
                aria-selected={false}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create New Customer</span>
                <span className="sm:hidden">New</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleModeSwitch('new')}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 py-2 px-3 transition-all duration-300 text-xs font-semibold",
                  "border-b-2 border-green-500 shadow-sm",
                  "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                )}
                aria-selected={true}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create New Customer</span>
                <span className="sm:hidden">New</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleModeSwitch('existing')}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 py-2 px-3 transition-all duration-300 text-xs font-semibold",
                  "border-b-2 border-transparent text-muted-foreground",
                  "hover:bg-muted/50 hover:text-foreground"
                )}
                aria-selected={false}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Select Existing</span>
                <span className="sm:hidden">Existing</span>
              </button>
            </>
          )}
        </div>
      </Card>
      </div>
      
      {/* Mode and Layout Selectors - Sticky */}
      <Card ref={modeLayoutRef} className="sticky z-40 -mt-px border shadow-md bg-gradient-to-b from-background to-background/95 backdrop-blur-sm rounded-none border-t-0 mb-0" style={{ top: `${stageHeight + selectionHeight}px` }}>
        <div className="px-3 py-1.5 bg-muted/30">
          <div className="flex items-center gap-4">
            {/* Expert/Simple Toggle */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCog className="h-3 w-3" />
                <span className="font-medium">Mode:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="expert-toggle" className={cn("text-xs cursor-pointer", expertMode === 'simple' && "font-semibold text-foreground")}>
                  Simple
                </Label>
                <Switch
                  id="expert-toggle"
                  checked={expertMode === 'expert'}
                  onCheckedChange={(checked) => setExpertMode(checked ? 'expert' : 'simple')}
                />
                <Label htmlFor="expert-toggle" className={cn("text-xs cursor-pointer", expertMode === 'expert' && "font-semibold text-foreground")}>
                  Expert
                </Label>
              </div>
            </div>
            
            {/* Layout Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ClipboardList className="h-3 w-3" />
                <span className="font-medium">Layout:</span>
              </div>
              <Select value={formMode} onValueChange={(value) => setFormMode(value as typeof formMode)}>
                <SelectTrigger className="w-[120px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concept">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3" />
                      <span>Concept</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="wizard">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      <span>Wizard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tabs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      <span>Tabs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="single">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="h-3 w-3" />
                      <span>Single Page</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="progressive">
                    <div className="flex items-center gap-1.5">
                      <UserCog className="h-3 w-3" />
                      <span>Progressive</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Form Content Card - Sticky */}
      <Card
        ref={formContentCardRef}
        className="sticky w-full overflow-hidden z-30 border shadow-lg bg-background/95 backdrop-blur-md rounded-t-none border-t-0 -mt-px"
        style={{ top: `${stageHeight + modeLayoutHeight + selectionHeight}px`, marginBottom: 0 }}
      >
        {/* Form Navigation - Sticky */}
        {false && customerMode === 'new' && <div ref={stickyNavRef} className="sticky z-50 isolate bg-gradient-to-r from-background via-background to-background border-b shadow-lg backdrop-blur-sm" style={{ top: stageHeight + stickyGap }}>
          {/* Form Navigation inside sticky container */}
          {currentStage === 'details' && (
            <div className="bg-background border-t border-border">
              <div className="flex items-center gap-0.5 overflow-x-auto py-1 px-4">
                {navigationSections.filter(s => s.isVisible !== false).map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionNavigation(section.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-none border-b-2 text-xs font-medium transition-all whitespace-nowrap",
                      "hover:bg-accent hover:text-accent-foreground",
                      section.isActive 
                        ? "border-b-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" 
                        : section.isComplete
                        ? "border-b-green-300 bg-green-50/50 text-green-600 dark:bg-green-950/50 dark:text-green-500"
                        : "border-b-transparent text-muted-foreground"
                    )}
                  >
                    {section.isComplete ? (
                      <Check className="h-2.5 w-2.5 flex-shrink-0" />
                    ) : section.isActive ? (
                      <CircleDot className="h-2.5 w-2.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>}

        <CardContent className="space-y-1 pb-3 pt-2">
        {/* Customer Selection Content - Not Sticky */}
        <div className="space-y-1 relative z-0">

          {customerMode === 'existing' && (
            <div className="space-y-3 pt-2">
              <ExistingCustomerSelector
                userId={user?.id || ''}
                value={selectedCustomerId || null}
                onChange={handleCustomerSelect}
              />
              
              {/* Show form sections when in existing mode and details stage */}
              {currentStage === 'details' && (
                <div className="space-y-1 pt-1">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-1">
                      {formMode === 'wizard' ? (
                        /* Wizard Mode - Show one step at a time */
                        <div className="space-y-4">
                          {/* Wizard Progress */}
                          <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                              {wizardSteps.map((step, index) => {
                                const StepIcon = step.icon;
                                return (
                                  <React.Fragment key={step.id}>
                                    <div className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                                      index === wizardStep 
                                        ? "bg-primary text-primary-foreground font-semibold" 
                                        : index < wizardStep
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    )}>
                                      <StepIcon className="h-4 w-4" />
                                      <span className="text-xs hidden sm:inline">{step.label}</span>
                                      <span className="text-xs sm:hidden">{index + 1}</span>
                                    </div>
                                    {index < wizardSteps.length - 1 && (
                                      <div className={cn(
                                        "h-0.5 w-8 transition-all",
                                        index < wizardStep ? "bg-primary" : "bg-muted"
                                      )} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {/* Wizard Step Content - Basic Info */}
                          {wizardStep === 0 && (
                            <Card className="border rounded-lg bg-background shadow-sm">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Basic Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                      id="name"
                                      {...form.register('name')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.name && (
                                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      {...form.register('email')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.email && (
                                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile *</Label>
                                    <Input
                                      id="mobile"
                                      {...form.register('mobile')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.mobile && (
                                      <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="company">Company *</Label>
                                    <Input
                                      id="company"
                                      {...form.register('company')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.company && (
                                      <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Wizard Navigation Buttons */}
                          <div className="flex justify-between pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleWizardPrevious}
                              disabled={wizardStep === 0}
                            >
                              Previous
                            </Button>
                            {wizardStep < wizardSteps.length - 1 ? (
                              <Button
                                type="button"
                                onClick={handleWizardNext}
                              >
                                Next
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Saving...' : 'Save Draft'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : formMode === 'tabs' ? (
                        /* Tabs Mode - All sections accessible via tabs */
                        <Tabs defaultValue="basic" className="space-y-4">
                          <TabsList className="grid w-full grid-cols-4 h-auto">
                            <TabsTrigger value="basic" className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span className="hidden sm:inline">Basic Info</span>
                              <span className="sm:hidden">Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="lead" className="flex items-center gap-2">
                              <ClipboardList className="h-4 w-4" />
                              <span className="hidden sm:inline">Source</span>
                              <span className="sm:hidden">Source</span>
                            </TabsTrigger>
                            <TabsTrigger value="service" className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Service</span>
                              <span className="sm:hidden">Service</span>
                            </TabsTrigger>
                            <TabsTrigger value="deal" className="flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              <span className="hidden sm:inline">Deal Info</span>
                              <span className="sm:hidden">Deal</span>
                            </TabsTrigger>
                          </TabsList>

                          {/* Basic Info Tab */}
                          <TabsContent value="basic" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Basic Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-name">Full Name *</Label>
                                    <Input
                                      id="tab-name"
                                      {...form.register('name')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.name && (
                                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-email">Email *</Label>
                                    <Input
                                      id="tab-email"
                                      type="email"
                                      {...form.register('email')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.email && (
                                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-mobile">Mobile *</Label>
                                    <Input
                                      id="tab-mobile"
                                      {...form.register('mobile')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.mobile && (
                                      <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-company">Company *</Label>
                                    <Input
                                      id="tab-company"
                                      {...form.register('company')}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.company && (
                                      <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* Source & Channel Tab */}
                          <TabsContent value="lead" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4" />
                                  Source & Channel Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <Label htmlFor="tab-lead-source">Lead Source *</Label>
                                  <Select
                                    value={form.watch('lead_source')}
                                    onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }}
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Website">Website</SelectItem>
                                      <SelectItem value="Referral">Referral</SelectItem>
                                      <SelectItem value="Social Media">Social Media</SelectItem>
                                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* Service Selection Tab */}
                          <TabsContent value="service" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Service Selection
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <Label htmlFor="tab-product">Product/Service *</Label>
                                  <Select
                                    value={form.watch('product_id')}
                                    onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }}
                                    disabled={isSubmitting || productsLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a product or service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.product_id && (
                                    <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* Deal Info Tab */}
                          <TabsContent value="deal" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  Deal Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-amount">Amount *</Label>
                                    <Input
                                      id="tab-amount"
                                      type="number"
                                      {...form.register('amount', { valueAsNumber: true })}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.amount && (
                                      <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="tab-license-type">License Type *</Label>
                                    <Select
                                      value={form.watch('license_type')}
                                      onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }}
                                      disabled={isSubmitting}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mainland">Mainland</SelectItem>
                                        <SelectItem value="Freezone">Freezone</SelectItem>
                                        <SelectItem value="Offshore">Offshore</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* Save Button */}
                          <div className="flex justify-end pt-4">
                            <Button
                              type="button"
                              onClick={form.handleSubmit(handleSubmit)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Save Draft'}
                            </Button>
                          </div>
                        </Tabs>
                      ) : formMode === 'progressive' ? (
                        /* Progressive Mode - Reveal sections as they're completed */
                        <div className="space-y-4">
                          {/* Basic Information - Always shown first */}
                          <Card className="border rounded-lg bg-background shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Basic Information
                                {isBasicInfoComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="prog-name">Full Name *</Label>
                                  <Input
                                    id="prog-name"
                                    {...form.register('name')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.name && (
                                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="prog-email">Email *</Label>
                                  <Input
                                    id="prog-email"
                                    type="email"
                                    {...form.register('email')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.email && (
                                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="prog-mobile">Mobile *</Label>
                                  <Input
                                    id="prog-mobile"
                                    {...form.register('mobile')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.mobile && (
                                    <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="prog-company">Company *</Label>
                                  <Input
                                    id="prog-company"
                                    {...form.register('company')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.company && (
                                    <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Source & Channel - Show after basic info is complete */}
                          {isBasicInfoComplete && (
                            <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4" />
                                  Source & Channel Information
                                  {isSourceChannelComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <Label htmlFor="prog-lead-source">Lead Source *</Label>
                                  <Select
                                    value={form.watch('lead_source')}
                                    onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }}
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Website">Website</SelectItem>
                                      <SelectItem value="Referral">Referral</SelectItem>
                                      <SelectItem value="Social Media">Social Media</SelectItem>
                                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Service Selection - Show after source is complete */}
                          {isBasicInfoComplete && isSourceChannelComplete && (
                            <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Service Selection
                                  {isServiceSelectionComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <Label htmlFor="prog-product">Product/Service *</Label>
                                  <Select
                                    value={form.watch('product_id')}
                                    onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }}
                                    disabled={isSubmitting || productsLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a product or service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.product_id && (
                                    <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Deal Info - Show after service is selected */}
                          {isBasicInfoComplete && isSourceChannelComplete && isServiceSelectionComplete && (
                            <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  Deal Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="prog-amount">Amount *</Label>
                                    <Input
                                      id="prog-amount"
                                      type="number"
                                      {...form.register('amount', { valueAsNumber: true })}
                                      disabled={isSubmitting}
                                      required
                                    />
                                    {form.formState.errors.amount && (
                                      <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="prog-license-type">License Type *</Label>
                                    <Select
                                      value={form.watch('license_type')}
                                      onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }}
                                      disabled={isSubmitting}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mainland">Mainland</SelectItem>
                                        <SelectItem value="Freezone">Freezone</SelectItem>
                                        <SelectItem value="Offshore">Offshore</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Save Button - Show when all sections are visible */}
                          {isBasicInfoComplete && isSourceChannelComplete && isServiceSelectionComplete && (
                            <div className="flex justify-end pt-4 animate-fade-in">
                              <Button
                                type="button"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Saving...' : 'Save Draft'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : formMode === 'single' ? (
                        /* Single Page Mode - All sections visible at once */
                        <div className="space-y-6">
                          {/* Basic Information */}
                          <Card className="border rounded-lg bg-background shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Basic Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="single-name">Full Name *</Label>
                                  <Input
                                    id="single-name"
                                    {...form.register('name')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.name && (
                                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-email">Email *</Label>
                                  <Input
                                    id="single-email"
                                    type="email"
                                    {...form.register('email')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.email && (
                                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-mobile">Mobile *</Label>
                                  <Input
                                    id="single-mobile"
                                    {...form.register('mobile')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.mobile && (
                                    <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-company">Company *</Label>
                                  <Input
                                    id="single-company"
                                    {...form.register('company')}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.company && (
                                    <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Source & Channel Information */}
                          <Card className="border rounded-lg bg-background shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Source & Channel Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label htmlFor="single-lead-source">Lead Source *</Label>
                                <Select
                                  value={form.watch('lead_source')}
                                  onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }}
                                  disabled={isSubmitting}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Website">Website</SelectItem>
                                    <SelectItem value="Referral">Referral</SelectItem>
                                    <SelectItem value="Social Media">Social Media</SelectItem>
                                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Service Selection */}
                          <Card className="border rounded-lg bg-background shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Service Selection
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Category Filter */}
                                <div className="space-y-2">
                                  <Label className="text-sm text-muted-foreground">Filter by Category (Optional)</Label>
                                  <Tabs 
                                    value={categoryFilter} 
                                    onValueChange={(value) => {
                                      hasUserInteractedWithCategory.current = true;
                                      setCategoryFilter(value);
                                    }}
                                    className="w-full"
                                  >
                                    <TabsList className="grid w-full h-auto bg-background border-b-2 border-border p-0" style={{ gridTemplateColumns: `repeat(${serviceCategories.length + 1}, minmax(0, 1fr))` }}>
                                      <TabsTrigger value="all" disabled={isSubmitting || serviceCategoriesLoading} className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                        All
                                      </TabsTrigger>
                                      {serviceCategories.map((cat) => (
                                        <TabsTrigger key={cat.id} value={cat.id} disabled={isSubmitting || serviceCategoriesLoading} className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs">
                                          {cat.category_name}
                                        </TabsTrigger>
                                      ))}
                                    </TabsList>
                                  </Tabs>
                                </div>

                                {/* Product Selection */}
                                <div className="space-y-2">
                                  <Label htmlFor="single-product">Product/Service *</Label>
                                  <Select
                                    value={form.watch('product_id')}
                                    onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }}
                                    disabled={isSubmitting || productsLoading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a product or service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.product_id && (
                                    <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Deal Information */}
                          <Card className="border rounded-lg bg-background shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Deal Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="single-amount">Amount *</Label>
                                  <Input
                                    id="single-amount"
                                    type="number"
                                    {...form.register('amount', { valueAsNumber: true })}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.amount && (
                                    <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-license-type">License Type *</Label>
                                  <Select
                                    value={form.watch('license_type')}
                                    onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }}
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Mainland">Mainland</SelectItem>
                                      <SelectItem value="Freezone">Freezone</SelectItem>
                                      <SelectItem value="Offshore">Offshore</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="single-annual-turnover">Annual Turnover *</Label>
                                  <Input
                                    id="single-annual-turnover"
                                    type="number"
                                    {...form.register('annual_turnover', { valueAsNumber: true })}
                                    disabled={isSubmitting}
                                    required
                                  />
                                  {form.formState.errors.annual_turnover && (
                                    <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Save Button */}
                          <div className="flex justify-end pt-4">
                            <Button
                              type="button"
                              onClick={form.handleSubmit(handleSubmit)}
                              disabled={isSubmitting}
                              size="lg"
                            >
                              {isSubmitting ? 'Saving...' : 'Save Draft'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Concept/Accordion Mode */
                        <Accordion type="multiple" value={accordionValue} onValueChange={(value) => {
                        setAccordionValue(value);
                        if (value.includes('service')) {
                          setServiceSelectionExpanded(true);
                        }
                      }} className="space-y-1">
                      {/* Basic Information */}
                      <AccordionItem value="basic" className="border rounded-lg bg-background shadow-sm" data-section-id="basic" style={{ scrollMarginTop: totalStickyOffset }}>
                        <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Basic Information</h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-2 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                {...form.register('name')}
                                disabled={isSubmitting}
                                required
                              />
                              {form.formState.errors.name && (
                                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                {...form.register('email')}
                                disabled={isSubmitting}
                                required
                              />
                              {form.formState.errors.email && (
                                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="mobile">Mobile *</Label>
                              <Input
                                id="mobile"
                                {...form.register('mobile')}
                                disabled={isSubmitting}
                                required
                              />
                              {form.formState.errors.mobile && (
                                <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="company">Company *</Label>
                              <Input
                                id="company"
                                {...form.register('company')}
                                disabled={isSubmitting}
                                required
                              />
                              {form.formState.errors.company && (
                                <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Source & Channel */}
                      <AccordionItem value="lead" className="border rounded-lg bg-background shadow-sm" data-section-id="lead" style={{ scrollMarginTop: totalStickyOffset }}>
                        <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <ClipboardList className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Source & Channel Information</h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-2 pt-2">
                          <div className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="lead_source">Lead Source *</Label>
                              <Select
                                value={form.watch('lead_source')}
                                onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }}
                                disabled={isSubmitting}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Website">Website</SelectItem>
                                  <SelectItem value="Referral">Referral</SelectItem>
                                  <SelectItem value="Social Media">Social Media</SelectItem>
                                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Service Selection */}
                      <AccordionItem value="service" className="border rounded-lg bg-background shadow-sm" data-section-id="service" style={{ scrollMarginTop: totalStickyOffset }}>
                        <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Service Selection</h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-2 pt-2">
                          <div className="pt-0 space-y-1">
                            {/* Category Filter Tabs */}
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Filter by Category (Optional)</Label>
                              <Tabs 
                                value={categoryFilter} 
                                onValueChange={(value) => {
                                  hasUserInteractedWithCategory.current = true;
                                  setCategoryFilter(value);
                                  const currentProductId = form.getValues('product_id');
                                  if (value !== 'all') {
                                    const currentProduct = allProducts.find(p => p.id === currentProductId);
                                    const belongsToNewCategory = currentProduct && currentProduct.service_category_id === value;
                                    if (!belongsToNewCategory) {
                                      form.setValue('product_id', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                                      form.clearErrors('product_id');
                                    } else {
                                      form.clearErrors('product_id');
                                    }
                                  } else {
                                    // Switching to 'all' should not clear a valid selection
                                    form.clearErrors('product_id');
                                  }
                                }}
                                className="w-full"
                              >
                                <TabsList className="grid w-full h-auto bg-background border-b-2 border-border p-0" style={{ gridTemplateColumns: `repeat(${serviceCategories.length + 1}, minmax(0, 1fr))` }}>
                                  <TabsTrigger 
                                    value="all"
                                    disabled={isSubmitting || serviceCategoriesLoading}
                                    className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                                  >
                                    <span className="font-medium text-sm">All Products</span>
                                    <Badge variant="secondary" className={cn(
                                      "text-xs",
                                      categoryFilter === 'all' && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                                    )}>
                                      {allProducts.length}
                                    </Badge>
                                  </TabsTrigger>
                                  {serviceCategories.map((category) => {
                                    const count = allProducts.filter(p => p.service_category_id === category.id).length;
                                    return (
                                      <TabsTrigger 
                                        key={category.id}
                                        value={category.id}
                                        disabled={isSubmitting || serviceCategoriesLoading}
                                        className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                                      >
                                        <span className="font-medium text-sm">{category.category_name}</span>
                                        <Badge variant="secondary" className={cn(
                                          "text-xs",
                                          categoryFilter === category.id && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                                        )}>
                                          {count}
                                        </Badge>
                                      </TabsTrigger>
                                    );
                                  })}
                                </TabsList>
                              </Tabs>
                            </div>

                            {/* Search Bar - Only show when category has products */}
                            {categoryProducts.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Search Products</Label>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder="Search products/services..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="pl-9 bg-background"
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Products Grid */}
                            <div className="space-y-3">
                              <Label>Product / Service *</Label>
                              {productsLoading ? (
                                <p className="text-sm text-muted-foreground">Loading products...</p>
                              ) : products.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No products available in this category.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {products.map((product) => {
                                    const isSelected = watchProductId === product.id;
                                    return (
                                     <div
                                         key={product.id}
                                         onClick={() => {
                                           if (!isSubmitting) {
                                             // Set the product
                                             form.setValue('product_id', product.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                                             form.clearErrors('product_id');
                                             
                                             // Switch to the product's category tab
                                             if (product.service_category_id) {
                                               setCategoryFilter(product.service_category_id);
                                               // Reset the interaction flag since we're programmatically setting it
                                               hasUserInteractedWithCategory.current = false;
                                             }
                                             
                                             // Auto-open Deal Information section
                                             if (!accordionValue.includes('application')) {
                                               setAccordionValue([...accordionValue, 'application']);
                                             }
                                           }
                                         }}
                                        className={cn(
                                          "relative p-3 rounded-md border-2 cursor-pointer transition-all duration-200",
                                          "hover:shadow-sm",
                                          isSelected
                                            ? "border-green-600 bg-green-50 dark:bg-green-950/30 shadow-md"
                                            : "border-border bg-card hover:border-green-300",
                                          isSubmitting && "opacity-50 cursor-not-allowed"
                                        )}
                                       >
                                        <TooltipProvider>
                                          <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-2 w-full">
                                                <div className="flex-1 min-w-0">
                                                  <h4
                                                    title={product.name}
                                                    aria-label={product.name}
                                                    className={cn(
                                                      "font-medium text-sm truncate cursor-help",
                                                      isSelected && "text-green-700 dark:text-green-400"
                                                    )}
                                                  >
                                                    {product.name}
                                                  </h4>
                                                </div>
                                                {isSelected && (
                                            <div className="flex-shrink-0">
                                              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                                <svg
                                                  className="w-3 h-3 text-white"
                                                  fill="none"
                                                  strokeWidth="2.5"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                           )}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <p className="text-sm">{product.name}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {form.formState.errors.product_id && (
                                <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                       </AccordionItem>

                      {/* Deal Information - Only shown when product is selected */}
                      {(accordionValue.includes('service') && watchProductId) && (
                      <AccordionItem
                        value="application" 
                        className={cn(
                          "border rounded-lg bg-background shadow-sm transition-all duration-500",
                          highlightDealInfo && "ring-4 ring-blue-400 shadow-lg shadow-blue-200 dark:shadow-blue-900"
                        )}
                        data-section="deal-information"
                        data-section-id="application"
                        style={{ scrollMarginTop: totalStickyOffset }}
                      >
                        <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              highlightDealInfo ? "bg-blue-100 dark:bg-blue-900" : "bg-primary/10"
                            )}>
                              <CircleDot className={cn(
                                "h-4 w-4 transition-colors",
                                highlightDealInfo ? "text-blue-600 dark:text-blue-400" : "text-primary"
                              )} />
                            </div>
                            <h3 className={cn(
                              "text-xs font-bold uppercase tracking-wide transition-colors",
                              highlightDealInfo ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                            )}>
                              Deal Information
                            </h3>
                            {highlightDealInfo && (
                              <span className="ml-2 inline-block animate-pulse">✨</span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-4">
                          <div className="space-y-4">
                            {/* License Type */}
                            <FormField
                              control={form.control}
                              name="license_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>License Type</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="e.g., Business License" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Number of Shareholders */}
                            <FormField
                              control={form.control}
                              name="no_of_shareholders"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Shareholders</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Banking Preferences */}
                            <FormField
                              control={form.control}
                              name="banking_preferences"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Banking Preferences</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="Preferred bank" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Payment Method */}
                            <FormField
                              control={form.control}
                              name="payment_method"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="e.g., Bank Transfer" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      )}

                      {/* Additional Information */}
                      {(accordionValue.includes('service') && watchProductId) && (
                      <AccordionItem
                        value="additional-info"
                        className="border rounded-lg bg-background shadow-sm"
                        data-section="additional-info"
                        data-section-id="additional-info"
                        style={{ scrollMarginTop: totalStickyOffset }}
                      >
                        <AccordionTrigger className="px-4 hover:no-underline justify-start gap-2 border-b">
                          <h3 className="text-base font-medium">Additional Information</h3>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* ARR Value */}
                            <FormField
                              control={form.control}
                              name="arr_value"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ARR Value</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                                      placeholder="Annual Recurring Revenue"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Deal Stage */}
                            <FormField
                              control={form.control}
                              name="deal_stage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Deal Stage</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select deal stage" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="prospect">Prospect</SelectItem>
                                      <SelectItem value="qualified">Qualified</SelectItem>
                                      <SelectItem value="proposal">Proposal</SelectItem>
                                      <SelectItem value="negotiation">Negotiation</SelectItem>
                                      <SelectItem value="won">Won</SelectItem>
                                      <SelectItem value="lost">Lost</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Expected Close Date */}
                            <FormField
                              control={form.control}
                              name="expected_close_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expected Close Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Probability */}
                            <FormField
                              control={form.control}
                              name="probability"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Probability (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Notes */}
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} value={field.value || ''} placeholder="Additional notes about the deal" rows={4} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      )}
                    </Accordion>
                    )}
                  </form>
                  </Form>
                </div>
              )}
            </div>
          )}
        </div>

        <CreateCompanyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCompanyCreated={handleCompanyCreated}
        />

        {currentStage === 'details' && customerMode === 'new' && (
          <div className="space-y-1 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-1">
              {formMode === 'concept' ? (
              <Accordion type="multiple" value={accordionValue} onValueChange={(value) => {
                setAccordionValue(value);
                
                // Determine the most recently expanded item (last in array)
                const lastExpanded = value[value.length - 1];
                
                // Check if Step 1 data is validated (basic info complete)
                const isStep1Validated = isBasicInfoComplete && isSourceChannelComplete;
                
                // Update progress step and active subcard based on expanded items
                // Only allow progress to Step 2 if Step 1 is validated
                if (value.includes('service')) {
                  setServiceSelectionExpanded(true);
                  // Only transition to step 2 if step 1 is validated
                  if (isStep1Validated) {
                    setProgressStep(2);
                  }
                  setActiveSubcard('Application Details / Service Selection');
                } else if (value.includes('application')) {
                  // Only transition to step 2 if step 1 is validated
                  if (isStep1Validated) {
                    setProgressStep(2);
                  }
                  setActiveSubcard('Application Details / Deal Information');
                } else if (value.includes('lead')) {
                  setProgressStep(1);
                  setActiveSubcard('Customer Details / Source & Channel');
                } else if (value.includes('basic')) {
                  setProgressStep(1);
                  setActiveSubcard('Customer Details / Basic Information');
                } else if (lastExpanded === 'basic') {
                  setProgressStep(1);
                  setActiveSubcard('Customer Details / Basic Information');
                } else if (lastExpanded === 'lead') {
                  setProgressStep(1);
                  setActiveSubcard('Customer Details / Source & Channel');
                }
              }} className="space-y-1">
                {/* Step 1: Customer Details (Basic Information + Source & Channel) */}
                <Collapsible open={!step1Collapsed} onOpenChange={(open) => setStep1Collapsed(!open)}>
                  <Card 
                    className="border-2 rounded-lg bg-background shadow-md hover:shadow-lg transition-shadow"
                    onMouseEnter={() => setHoveredCard('Customer Details')}
                    onMouseLeave={() => setHoveredCard(null)}
                    onFocus={() => setHoveredCard('Customer Details')}
                    onBlur={() => setHoveredCard(null)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/15 transition-all">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span>Step 1: Customer Details</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", step1Collapsed && "rotate-180")} />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-3 space-y-1">
                    {/* Basic Information */}
                    <AccordionItem 
                      value="basic" 
                      className="border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow" 
                      data-section-id="basic" 
                      style={{ scrollMarginTop: totalStickyOffset }}
                      onMouseEnter={() => setHoveredCard('Customer Details / Basic Information')}
                      onMouseLeave={() => setHoveredCard(null)}
                      onFocus={() => setHoveredCard('Customer Details / Basic Information')}
                      onBlur={() => setHoveredCard(null)}
                    >
                      <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-all group">
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                              <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 rounded-xl bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Basic Information</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {sectionsWithErrors.has('basic') && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/25 border-2 border-destructive shadow-lg shadow-destructive/20 animate-pulse">
                                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                <span className="text-xs font-medium text-destructive">Has Errors</span>
                              </div>
                            )}
                            {isBasicInfoComplete && !sectionsWithErrors.has('basic') && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 animate-in fade-in zoom-in duration-500 shadow-lg shadow-green-500/20">
                                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-400">Complete</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-2 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              {...form.register('name')}
                              disabled={isSubmitting}
                              required
                            />
                            {form.formState.errors.name && (
                              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              {...form.register('email')}
                              disabled={isSubmitting}
                              required
                            />
                            {form.formState.errors.email && (
                              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="mobile">Mobile *</Label>
                            <Input
                              id="mobile"
                              {...form.register('mobile')}
                              disabled={isSubmitting}
                              required
                            />
                            {form.formState.errors.mobile && (
                              <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="company">Company *</Label>
                            <Input
                              id="company"
                              {...form.register('company')}
                              disabled={isSubmitting}
                              required
                            />
                            {form.formState.errors.company && (
                              <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Source & Channel */}
                    <AccordionItem 
                      value="lead" 
                      className="border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow" 
                      data-section-id="lead" 
                      style={{ scrollMarginTop: totalStickyOffset }}
                      onMouseEnter={() => setHoveredCard('Customer Details / Source & Channel')}
                      onMouseLeave={() => setHoveredCard(null)}
                      onFocus={() => setHoveredCard('Customer Details / Source & Channel')}
                      onBlur={() => setHoveredCard(null)}
                    >
                      <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-all group">
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                              <ClipboardList className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 rounded-xl bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Source & Channel Information</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {sectionsWithErrors.has('lead') && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/25 border-2 border-destructive shadow-lg shadow-destructive/20 animate-pulse">
                                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                <span className="text-xs font-medium text-destructive">Has Errors</span>
                              </div>
                            )}
                            {isSourceChannelComplete && !sectionsWithErrors.has('lead') && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 animate-in fade-in zoom-in duration-500 shadow-lg shadow-green-500/20">
                                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-400">Complete</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-2 pt-2">
                        <div className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="lead_source">Lead Source *</Label>
                            <Select
                              value={form.watch('lead_source')}
                              onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Social Media">Social Media</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 2: Application Details (Service Selection + Deal Information) */}
                <Collapsible open={!step2Collapsed} onOpenChange={(open) => setStep2Collapsed(!open)}>
                  <Card 
                    className="border-2 rounded-lg bg-background shadow-md hover:shadow-lg transition-shadow"
                    onMouseEnter={() => setHoveredCard('Application Details')}
                    onMouseLeave={() => setHoveredCard(null)}
                    onFocus={() => setHoveredCard('Application Details')}
                    onBlur={() => setHoveredCard(null)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/15 transition-all">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <span>Step 2: Application Details</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", step2Collapsed && "rotate-180")} />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-3 space-y-1">
        {/* Service Selection */}
        <AccordionItem 
          value="service" 
          className="border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow" 
          data-section-id="service" 
          style={{ scrollMarginTop: totalStickyOffset }}
          onMouseEnter={() => setHoveredCard('Application Details / Service Selection')}
          onMouseLeave={() => setHoveredCard(null)}
          onFocus={() => setHoveredCard('Application Details / Service Selection')}
          onBlur={() => setHoveredCard(null)}
        >
              <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                      <Building2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 rounded-xl bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Service Selection</h3>
                      {selectedProduct && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{selectedProduct.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionsWithErrors.has('service') && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/25 border-2 border-destructive shadow-lg shadow-destructive/20 animate-pulse">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs font-medium text-destructive">Has Errors</span>
                      </div>
                    )}
                    {isServiceSelectionComplete && !sectionsWithErrors.has('service') && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 animate-in fade-in zoom-in duration-500 shadow-lg shadow-green-500/20">
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Complete</span>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
                  <AccordionContent className="px-4 pb-2 pt-2">
                    <div className="pt-0 space-y-2">
                      {/* Category Filter Tabs */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Filter by Category (Optional)</Label>
                        <Tabs 
                          value={categoryFilter} 
                          onValueChange={(value) => {
                            hasUserInteractedWithCategory.current = true;
                            setCategoryFilter(value);
                            const currentProductId = form.getValues('product_id');
                            if (value !== 'all') {
                              const currentProduct = allProducts.find(p => p.id === currentProductId);
                              const belongsToNewCategory = currentProduct && currentProduct.service_category_id === value;
                              if (!belongsToNewCategory) {
                                form.setValue('product_id', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                                form.clearErrors('product_id');
                              } else {
                                form.clearErrors('product_id');
                              }
                            } else {
                              // Switching to 'all' should not clear a valid selection
                              form.clearErrors('product_id');
                            }
                          }}
                          className="w-full"
                        >
                          <TabsList className="grid w-full h-auto bg-background border-b-2 border-border p-0" style={{ gridTemplateColumns: `repeat(${serviceCategories.length + 1}, minmax(0, 1fr))` }}>
                            <TabsTrigger 
                              value="all"
                              disabled={isSubmitting || serviceCategoriesLoading}
                              className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                            >
                              <span className="font-medium text-sm">All Products</span>
                              <Badge variant="secondary" className={cn(
                                "text-xs",
                                categoryFilter === 'all' && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                              )}>
                                {allProducts.length}
                              </Badge>
                            </TabsTrigger>
                            {serviceCategories.map((category) => {
                              const count = allProducts.filter(p => p.service_category_id === category.id).length;
                              return (
                                <TabsTrigger 
                                  key={category.id}
                                  value={category.id}
                                  disabled={isSubmitting || serviceCategoriesLoading}
                                  className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                                >
                                  <span className="font-medium text-sm">{category.category_name}</span>
                                  <Badge variant="secondary" className={cn(
                                    "text-xs",
                                    categoryFilter === category.id && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  )}>
                                    {count}
                                  </Badge>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Search Bar - Only show when category has products */}
                      {categoryProducts.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Search Products</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Search products/services..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              className="pl-9 bg-background"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      )}

                      {/* Products Grid */}
                      <div className="space-y-3">
                        <Label>Product / Service *</Label>
                        {productsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading products...</p>
                        ) : products.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No products available in this category.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {products.map((product) => {
                              const isSelected = watchProductId === product.id;
                              return (
                                 <div
                                   key={product.id}
                                   onClick={() => {
                                     if (!isSubmitting) {
                                       // Set the product
                                       form.setValue('product_id', product.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                                       form.clearErrors('product_id');
                                       
                                       // Switch to the product's category tab
                                       if (product.service_category_id) {
                                         setCategoryFilter(product.service_category_id);
                                         // Reset the interaction flag since we're programmatically setting it
                                         hasUserInteractedWithCategory.current = false;
                                       }
                                       
                                       // Auto-open Deal Information section
                                       if (!accordionValue.includes('application')) {
                                         setAccordionValue([...accordionValue, 'application']);
                                       }
                                     }
                                   }}
                                   className={cn(
                                     "relative p-3 rounded-md border-2 cursor-pointer transition-all duration-200",
                                     "hover:shadow-sm",
                                     isSelected
                                       ? "border-green-600 bg-green-50 dark:bg-green-950/30 shadow-md"
                                       : "border-border bg-card hover:border-green-300",
                                     isSubmitting && "opacity-50 cursor-not-allowed"
                                   )}
                                 >
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4
                                        title={product.name}
                                        aria-label={product.name}
                                        className={cn(
                                          "font-medium text-sm truncate cursor-help",
                                          isSelected && "text-green-700 dark:text-green-400"
                                        )}
                                      >
                                        {product.name}
                                      </h4>
                                    </div>
                                    {isSelected && (
                                       <div className="flex-shrink-0">
                                         <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                           <svg
                                             className="w-3 h-3 text-white"
                                             fill="none"
                                             strokeWidth="2.5"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                           >
                                             <path
                                               strokeLinecap="round"
                                               strokeLinejoin="round"
                                               d="M5 13l4 4L19 7"
                                             />
                                           </svg>
                                         </div>
                                       </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {form.formState.errors.product_id && (
                          <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                        )}
                       </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

        {/* Deal Information - Only shown when a product is selected */}
        {serviceSelectionExpanded && watchProductId && (
        <AccordionItem
          value="application" 
          className={cn(
            "border rounded-lg transition-all duration-500 shadow-sm",
            highlightDealInfo && "ring-4 ring-blue-400 shadow-lg shadow-blue-200 dark:shadow-blue-900"
          )}
          data-section="deal-information"
          data-section-id="application"
          onMouseEnter={() => setHoveredCard('Application Details / Deal Information')}
          onMouseLeave={() => setHoveredCard(null)}
          onFocus={() => setHoveredCard('Application Details / Deal Information')}
          onBlur={() => setHoveredCard(null)}
        >
              <AccordionTrigger className="px-4 py-2 hover:no-underline border-b-2 border-border/50 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={cn(
                      "relative p-1.5 rounded-lg transition-all duration-300",
                      highlightDealInfo 
                        ? "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 scale-110" 
                        : "bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10"
                    )}>
                      <CircleDot className={cn(
                        "h-4 w-4 transition-all duration-300",
                        highlightDealInfo ? "text-blue-600 dark:text-blue-400 animate-pulse" : "text-primary group-hover:scale-110"
                      )} />
                      <div className="absolute inset-0 rounded-xl bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn(
                        "text-xs font-bold uppercase tracking-wide transition-colors",
                        highlightDealInfo ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                      )}>
                        Deal Information
                      </h3>
                      {selectedProduct && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{selectedProduct.name}</span>
                        </div>
                      )}
                    </div>
                    {highlightDealInfo && (
                      <span className="ml-2 inline-block animate-pulse text-lg">✨</span>
                    )}
                  </div>
                  {sectionsWithErrors.has('application') && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/25 border-2 border-destructive shadow-lg shadow-destructive/20 animate-pulse">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">Has Errors</span>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3 space-y-3 pt-2">
                {/* Application Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
                    <Save className="h-3 w-3 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Application Information</h4>
                  </div>
                  
                  <div className="space-y-6 pl-1">
                    {hasCompanyFormation && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="proposed_activity">Proposed Activity</Label>
                          <Input
                            id="proposed_activity"
                            {...form.register('proposed_activity')}
                            placeholder="e.g., Trading, Consulting, Manufacturing"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nationality">Nationality</Label>
                          <Input
                            id="nationality"
                            list="nationality-options"
                            {...form.register('nationality')}
                            placeholder="Type to search nationalities..."
                            disabled={isSubmitting}
                            className="bg-background"
                          />
                          <datalist id="nationality-options">
...
                            <option value="Peruvian" />
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="license_type">License Type *</Label>
                          <Select
                            value={form.watch('license_type')}
                            onValueChange={(value) => form.setValue('license_type', value as any)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mainland">Mainland</SelectItem>
                              <SelectItem value="Freezone">Freezone</SelectItem>
                              <SelectItem value="Offshore">Offshore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jurisdiction">Jurisdiction</Label>
                          <select
                            id="jurisdiction"
                            {...form.register('jurisdiction')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select jurisdiction (optional)</option>
                            <option value="Dubai">Dubai</option>
                            <option value="Abu Dhabi">Abu Dhabi</option>
                            <option value="Sharjah">Sharjah</option>
                            <option value="Ajman">Ajman</option>
                            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                            <option value="Fujairah">Fujairah</option>
                            <option value="Umm Al Quwain">Umm Al Quwain</option>
                            <option value="Mainland">Mainland</option>
                            <option value="Freezone">Freezone</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="no_of_shareholders">Number of Shareholders *</Label>
                          <Input
                            id="no_of_shareholders"
                            type="number"
                            min="1"
                            max="10"
                            {...form.register('no_of_shareholders', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            required
                          />
                          {form.formState.errors.no_of_shareholders && (
                            <p className="text-sm text-red-600">{form.formState.errors.no_of_shareholders.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Number of shareholders will determine how many signatory document sets are created (1-10)
                          </p>
                        </div>
                        </div>
                      </>
                    )}
                    
                    {/* Home Finance Employment & Property Details */}
                    {hasHomeFinance && (
                      <>
                        {/* UAE Residency Status */}
                        <div className="space-y-2 pl-4">
                          <Label htmlFor="uae_residency_status">UAE Residency Status *</Label>
                          <select
                            id="uae_residency_status"
                            {...form.register('uae_residency_status')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select residency status</option>
                            <option value="Resident">Resident</option>
                            <option value="Non-Resident">Non-Resident</option>
                          </select>
                        </div>

                        {/* Employment Information Subsection */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 pl-3 py-1.5 border-l-4 border-muted/40 bg-muted/20 rounded-r">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employment Details</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">

                        <div className="space-y-2">
                          <Label htmlFor="employment_status">Employment Status *</Label>
                          <select
                            id="employment_status"
                            {...form.register('employment_status')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select employment status</option>
                            <option value="Employed">Employed (Salaried)</option>
                            <option value="Self-Employed">Self-Employed</option>
                            <option value="Business Owner">Business Owner</option>
                            <option value="Professional">Professional (Doctor/Lawyer/etc.)</option>
                          </select>
                        </div>

                        {/* Conditional: Salary Range for Salaried */}
                        {watchEmploymentStatus === 'Employed' && (
                          <div className="space-y-2">
                            <Label htmlFor="salary_range">Salary Range (AED) *</Label>
                            <select
                              id="salary_range"
                              {...form.register('salary_range')}
                              disabled={isSubmitting}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select salary range</option>
                              <option value="Below 10,000">Below 10,000</option>
                              <option value="10,000 - 20,000">10,000 - 20,000</option>
                              <option value="20,000 - 30,000">20,000 - 30,000</option>
                              <option value="30,000 - 50,000">30,000 - 50,000</option>
                              <option value="50,000 - 75,000">50,000 - 75,000</option>
                              <option value="75,000 - 100,000">75,000 - 100,000</option>
                              <option value="Above 100,000">Above 100,000</option>
                            </select>
                          </div>
                        )}

                        {/* Conditional: Business Turnover for Self-Employed */}
                        {watchEmploymentStatus === 'Self-Employed' && (
                          <div className="space-y-2">
                            <Label htmlFor="business_turnover">Business Turnover (AED) *</Label>
                            <select
                              id="business_turnover"
                              {...form.register('business_turnover')}
                              disabled={isSubmitting}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select turnover range</option>
                              <option value="Below 100,000">Below 100,000</option>
                              <option value="100,000 - 500,000">100,000 - 500,000</option>
                              <option value="500,000 - 1,000,000">500,000 - 1,000,000</option>
                              <option value="1,000,000 - 5,000,000">1,000,000 - 5,000,000</option>
                              <option value="Above 5,000,000">Above 5,000,000</option>
                            </select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="employer_name">Employer/Company Name</Label>
                          <Input
                            id="employer_name"
                            {...form.register('employer_name')}
                            placeholder="Current employer"
                            disabled={isSubmitting}
                          />
                        </div>

                          <div className="space-y-2">
                            <Label htmlFor="years_with_employer">Years with Current Employer</Label>
                            <Input
                              id="years_with_employer"
                              type="number"
                              step="0.5"
                              {...form.register('years_with_employer', { valueAsNumber: true })}
                              placeholder="e.g., 2.5"
                              disabled={isSubmitting}
                            />
                          </div>
                          </div>
                        </div>

                        {/* Property Information Subsection */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 pl-3 py-1.5 border-l-4 border-muted/40 bg-muted/20 rounded-r">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property Details</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">

                        <div className="space-y-2">
                          <Label htmlFor="property_type">Property Type *</Label>
                          <select
                            id="property_type"
                            {...form.register('property_type')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select property type</option>
                            <option value="Villa">Villa</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Townhouse">Townhouse</option>
                            <option value="Penthouse">Penthouse</option>
                            <option value="Land">Land/Plot</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_location">Property Location (Emirate) *</Label>
                          <select
                            id="property_location"
                            {...form.register('property_location')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select emirate</option>
                            <option value="Dubai">Dubai</option>
                            <option value="Abu Dhabi">Abu Dhabi</option>
                            <option value="Sharjah">Sharjah</option>
                            <option value="Ajman">Ajman</option>
                            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                            <option value="Fujairah">Fujairah</option>
                            <option value="Umm Al Quwain">Umm Al Quwain</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_value">Property Value/Price (AED) *</Label>
                          <Input
                            id="property_value"
                            type="number"
                            step="0.01"
                            {...form.register('property_value', { valueAsNumber: true })}
                            placeholder="Total property price"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_status">Property Status</Label>
                          <select
                            id="property_status"
                            {...form.register('property_status')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select status</option>
                            <option value="Ready">Ready Property</option>
                            <option value="Under Construction">Under Construction (Off-plan)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="developer_name">Developer Name (if off-plan)</Label>
                          <Input
                            id="developer_name"
                            {...form.register('developer_name')}
                            placeholder="Developer name"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="intended_use">Intended Use</Label>
                          <select
                            id="intended_use"
                            {...form.register('intended_use')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select intended use</option>
                            <option value="Primary Residence">Primary Residence</option>
                            <option value="Investment">Investment Property</option>
                            <option value="Second Home">Second Home</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchase_purpose">Purchase Purpose</Label>
                          <select
                            id="purchase_purpose"
                            {...form.register('purchase_purpose')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select purpose</option>
                            <option value="First Home">First Home Purchase</option>
                            <option value="Upgrade">Property Upgrade</option>
                            <option value="Investment">Investment</option>
                            <option value="Additional Property">Additional Property</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferred_loan_tenure">Preferred Loan Tenure (years)</Label>
                          <select
                            id="preferred_loan_tenure"
                            {...form.register('preferred_loan_tenure', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="15">15 years</option>
                            <option value="20">20 years</option>
                            <option value="25">25 years</option>
                          </select>
                         </div>
                         
                         {/* Co-Applicant Information - inside Property section */}
                         <div className="col-span-full mt-3 pt-3 border-t border-muted/30">
                           <div className="flex items-center space-x-2">
                             <Checkbox
                               id="has_co_applicant"
                               checked={form.watch('has_co_applicant') || false}
                               onCheckedChange={(checked) => form.setValue('has_co_applicant', !!checked)}
                               disabled={isSubmitting}
                             />
                             <Label htmlFor="has_co_applicant">I have a co-applicant</Label>
                           </div>

                           {form.watch('has_co_applicant') && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-l-2 border-muted pl-4 mt-2">
                               <div className="space-y-2">
                                 <Label htmlFor="co_applicant_name">Co-Applicant Name</Label>
                                 <Input
                                   id="co_applicant_name"
                                   {...form.register('co_applicant_name')}
                                   placeholder="Full name"
                                   disabled={isSubmitting}
                                 />
                               </div>

                               <div className="space-y-2">
                                 <Label htmlFor="co_applicant_income">Co-Applicant Monthly Income (AED)</Label>
                                 <Input
                                   id="co_applicant_income"
                                   type="number"
                                   step="0.01"
                                   {...form.register('co_applicant_income', { valueAsNumber: true })}
                                   placeholder="Monthly salary"
                                   disabled={isSubmitting}
                                 />
                               </div>

                               <div className="space-y-2">
                                 <Label htmlFor="co_applicant_relationship">Relationship to Main Applicant</Label>
                                 <select
                                   id="co_applicant_relationship"
                                   {...form.register('co_applicant_relationship')}
                                   disabled={isSubmitting}
                                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                 >
                                   <option value="">Select relationship</option>
                                   <option value="Spouse">Spouse</option>
                                   <option value="Parent">Parent</option>
                                   <option value="Sibling">Sibling</option>
                                   <option value="Business Partner">Business Partner</option>
                                   <option value="Other">Other</option>
                                 </select>
                               </div>
                             </div>
                           )}
                         </div>
                         </div>
                       </div>
                       </>
                     )}

                    {/* Business Bank Account Application Information */}
                    {hasBankAccount && (
                      <>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor="mainland_or_freezone">License Type *</Label>
                                <select
                                  id="mainland_or_freezone"
                                  {...form.register('mainland_or_freezone')}
                                  disabled={isSubmitting}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select type</option>
                                  <option value="mainland">Mainland</option>
                                  <option value="freezone">Free Zone</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                                <select
                                  id="jurisdiction"
                                  {...form.register('jurisdiction')}
                                  disabled={isSubmitting}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select jurisdiction (optional)</option>
                                  <option value="DIFC">DIFC (Dubai International Financial Centre)</option>
                                  <option value="ADGM">ADGM (Abu Dhabi Global Market)</option>
                                  <option value="DMCC">DMCC (Dubai Multi Commodities Centre)</option>
                                  <option value="JAFZA">JAFZA (Jebel Ali Free Zone)</option>
                                  <option value="Dubai">Dubai</option>
                                  <option value="Abu Dhabi">Abu Dhabi</option>
                                  <option value="Sharjah">Sharjah</option>
                                  <option value="Ajman">Ajman</option>
                                  <option value="RAK">RAK (Ras Al Khaimah)</option>
                                  <option value="UAQ">UAQ (Umm Al Quwain)</option>
                                  <option value="Fujairah">Fujairah</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Label htmlFor="no_of_shareholders">Number of Shareholders *</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>Number of shareholders will determine how many signatory document sets are created (1-10)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input
                                  id="no_of_shareholders"
                                  type="number"
                                  min="1"
                                  max="10"
                                  {...form.register('no_of_shareholders', { valueAsNumber: true })}
                                  disabled={isSubmitting}
                                  placeholder="1-10"
                                />
                                {form.formState.errors.no_of_shareholders && (
                                  <p className="text-sm text-destructive">{form.formState.errors.no_of_shareholders.message}</p>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="signatory_type">Signatory Type *</Label>
                                <select
                                  id="signatory_type"
                                  {...form.register('signatory_type')}
                                  disabled={isSubmitting}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select signatory type</option>
                                  <option value="single">Single Signatory</option>
                                  <option value="joint">Joint Signatory</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="business_activity_details">Business Activity Details *</Label>
                              <Textarea
                                id="business_activity_details"
                                {...form.register('business_activity_details')}
                                placeholder="Describe the business activities in detail..."
                                disabled={isSubmitting}
                                rows={4}
                              />
                            </div>
                        </div>
                        
                        {/* Banking Preferences */}
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                            <CircleDot className="h-3 w-3 text-primary" />
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Banking Preferences</h4>
                          </div>
                          
                          <div className="space-y-2 pl-1">
                            <div className="space-y-2">
                              <Label htmlFor="minimum_balance_range">Minimum Balance to be Maintained *</Label>
                              <select
                                id="minimum_balance_range"
                                {...form.register('minimum_balance_range')}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select balance range</option>
                                <option value="0-10k">0 – 10K</option>
                                <option value="10k-100k">10K – 100K</option>
                                <option value="100k-150k">100K – 150K</option>
                                <option value="150k-250k">150K – 250K</option>
                                <option value="above-250k">Above 250K</option>
                              </select>
                            </div>
                            
                            <RadioGroup
                              value={bankPreferenceMode}
                              onValueChange={(value) => {
                                setBankPreferenceMode(value as 'preferred' | 'any');
                                // Clear bank preference fields if switching to "any"
                                if (value === 'any') {
                                  form.setValue('bank_preference_1', '');
                                  form.setValue('bank_preference_2', '');
                                  form.setValue('bank_preference_3', '');
                                }
                              }}
                              disabled={isSubmitting}
                              className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              <label
                                htmlFor="bank-preferred"
                                className={cn(
                                  "flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                                  bankPreferenceMode === 'preferred' 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border"
                                )}
                              >
                                <RadioGroupItem value="preferred" id="bank-preferred" />
                                <div className="flex-1">
                                  <div className="font-medium">I have preferred banks</div>
                                  <div className="text-sm text-muted-foreground">Select up to 3 banks in order of preference</div>
                                </div>
                              </label>
                              
                              <label
                                htmlFor="bank-any"
                                className={cn(
                                  "flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                                  bankPreferenceMode === 'any' 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border"
                                )}
                              >
                                <RadioGroupItem value="any" id="bank-any" />
                                <div className="flex-1">
                                  <div className="font-medium">Any bank is fine</div>
                                  <div className="text-sm text-muted-foreground">No specific bank preference</div>
                                </div>
                              </label>
                            </RadioGroup>

                            {bankPreferenceMode === 'preferred' && (
                              <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                                <div className="space-y-2">
                                  <Label htmlFor="bank_preference_1" className="text-sm font-medium">
                                    Preferred Bank <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="bank_preference_1"
                                    {...form.register('bank_preference_1')}
                                    placeholder="Enter your first choice bank"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label htmlFor="bank_preference_2" className="text-sm">2nd Preference (Optional)</Label>
                                    <Input
                                      id="bank_preference_2"
                                      {...form.register('bank_preference_2')}
                                      placeholder="Second choice"
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="bank_preference_3" className="text-sm">3rd Preference (Optional)</Label>
                                    <Input
                                      id="bank_preference_3"
                                      {...form.register('bank_preference_3')}
                                      placeholder="Third choice"
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                      </>
                    )}
                    
                    {/* Purpose of Finance - Business Finance only */}
                    {hasBusinessFinance && (
                      <div className="space-y-2">
                        <Label htmlFor="purpose_of_finance">Purpose of Finance *</Label>
                        <select
                          id="purpose_of_finance"
                          {...form.register('purpose_of_finance')}
                          disabled={isSubmitting}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select purpose</option>
                          <option value="Working Capital">Working Capital</option>
                          <option value="Business Expansion">Business Expansion</option>
                          <option value="Equipment Purchase">Equipment Purchase</option>
                          <option value="Inventory Financing">Inventory Financing</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Debt Consolidation">Debt Consolidation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {/* AML Services Application Fields */}
                    {hasAMLServices && (
                      <>
                        {/* AML/MLRO Information Section */}
                        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">AML/MLRO Information</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mlro_name">MLRO Name *</Label>
                              <Input
                                id="mlro_name"
                                {...form.register('mlro_name')}
                                placeholder="Money Laundering Reporting Officer name"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="mlro_email">MLRO Email *</Label>
                              <Input
                                id="mlro_email"
                                type="email"
                                {...form.register('mlro_email')}
                                placeholder="mlro@company.com"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="mlro_phone">MLRO Phone Number *</Label>
                              <Input
                                id="mlro_phone"
                                {...form.register('mlro_phone')}
                                placeholder="+971 XX XXX XXXX"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2 flex items-center pt-6">
                              <Checkbox
                                id="aml_policy_required"
                                checked={form.watch('aml_policy_required') || false}
                                onCheckedChange={(checked) => form.setValue('aml_policy_required', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="aml_policy_required" className="ml-2 cursor-pointer">
                                AML Policy Required
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Customer Identification Section */}
                        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">1. Customer Identification</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="customer_full_legal_name">Full Legal Name *</Label>
                              <Input
                                id="customer_full_legal_name"
                                {...form.register('customer_full_legal_name')}
                                placeholder="As per official documents"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_date_of_birth">Date of Birth *</Label>
                              <Input
                                id="customer_date_of_birth"
                                type="date"
                                {...form.register('customer_date_of_birth')}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_nationality">Nationality *</Label>
                              <Input
                                id="customer_nationality"
                                {...form.register('customer_nationality')}
                                placeholder="Country of citizenship"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_national_id">National ID Number</Label>
                              <Input
                                id="customer_national_id"
                                {...form.register('customer_national_id')}
                                placeholder="National ID or Emirates ID"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_passport_number">Passport Number *</Label>
                              <Input
                                id="customer_passport_number"
                                {...form.register('customer_passport_number')}
                                placeholder="Passport number"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_id_expiry_date">ID Expiry Date *</Label>
                              <Input
                                id="customer_id_expiry_date"
                                type="date"
                                {...form.register('customer_id_expiry_date')}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="customer_residential_address">Residential Address (with proof) *</Label>
                              <Textarea
                                id="customer_residential_address"
                                {...form.register('customer_residential_address')}
                                placeholder="Full residential address"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_contact_phone">Contact Phone *</Label>
                              <Input
                                id="customer_contact_phone"
                                {...form.register('customer_contact_phone')}
                                placeholder="+971 XX XXX XXXX"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customer_contact_email">Contact Email *</Label>
                              <Input
                                id="customer_contact_email"
                                type="email"
                                {...form.register('customer_contact_email')}
                                placeholder="customer@email.com"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Business/Company Information Section */}
                        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">2. Business/Company Information (for corporate clients)</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="business_company_name">Company Name</Label>
                              <Input
                                id="business_company_name"
                                {...form.register('business_company_name')}
                                placeholder="Legal company name"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="business_registration_number">Registration Number</Label>
                              <Input
                                id="business_registration_number"
                                {...form.register('business_registration_number')}
                                placeholder="Company registration number"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="business_trade_license_number">Trade License Number</Label>
                              <Input
                                id="business_trade_license_number"
                                {...form.register('business_trade_license_number')}
                                placeholder="Trade license number"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="business_trade_license_expiry">Trade License Expiry</Label>
                              <Input
                                id="business_trade_license_expiry"
                                type="date"
                                {...form.register('business_trade_license_expiry')}
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="business_activity_sector">Business Activity/Sector</Label>
                              <Input
                                id="business_activity_sector"
                                {...form.register('business_activity_sector')}
                                placeholder="e.g., Technology, Finance, Retail"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="business_company_address">Company Address</Label>
                              <Textarea
                                id="business_company_address"
                                {...form.register('business_company_address')}
                                placeholder="Registered business address"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="business_authorized_signatories">Authorized Signatories</Label>
                              <Textarea
                                id="business_authorized_signatories"
                                {...form.register('business_authorized_signatories')}
                                placeholder="List of authorized persons with signing authority"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="business_beneficial_ownership">Beneficial Ownership Details (25%+ ownership)</Label>
                              <Textarea
                                id="business_beneficial_ownership"
                                {...form.register('business_beneficial_ownership')}
                                placeholder="Details of beneficial owners with 25% or more ownership"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="business_ubo_information">Ultimate Beneficial Owner (UBO) Information</Label>
                              <Textarea
                                id="business_ubo_information"
                                {...form.register('business_ubo_information')}
                                placeholder="Full details of ultimate beneficial owners"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Financial Profile Section */}
                        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">3. Financial Profile</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="financial_source_of_funds">Source of Funds *</Label>
                              <Input
                                id="financial_source_of_funds"
                                {...form.register('financial_source_of_funds')}
                                placeholder="e.g., Salary, Business income, Investment"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_source_of_wealth">Source of Wealth</Label>
                              <Input
                                id="financial_source_of_wealth"
                                {...form.register('financial_source_of_wealth')}
                                placeholder="Origin of wealth"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_expected_monthly_volume">Expected Monthly Transaction Volume</Label>
                              <Input
                                id="financial_expected_monthly_volume"
                                {...form.register('financial_expected_monthly_volume')}
                                placeholder="e.g., AED 100,000"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_expected_annual_volume">Expected Annual Transaction Volume</Label>
                              <Input
                                id="financial_expected_annual_volume"
                                {...form.register('financial_expected_annual_volume')}
                                placeholder="e.g., AED 1,200,000"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="financial_account_purpose">Purpose of Account/Service *</Label>
                              <Textarea
                                id="financial_account_purpose"
                                {...form.register('financial_account_purpose')}
                                placeholder="Describe the intended use of the account or service"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="financial_anticipated_activity">Anticipated Account Activity</Label>
                              <Textarea
                                id="financial_anticipated_activity"
                                {...form.register('financial_anticipated_activity')}
                                placeholder="Expected types and frequency of transactions"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_employment_status">Employment Status</Label>
                              <select
                                id="financial_employment_status"
                                {...form.register('financial_employment_status')}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select status</option>
                                <option value="Employed">Employed</option>
                                <option value="Self-Employed">Self-Employed</option>
                                <option value="Business Owner">Business Owner</option>
                                <option value="Unemployed">Unemployed</option>
                                <option value="Retired">Retired</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_employer_details">Employer Details</Label>
                              <Input
                                id="financial_employer_details"
                                {...form.register('financial_employer_details')}
                                placeholder="Employer name and position"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_annual_income">Annual Income (Personal)</Label>
                              <Input
                                id="financial_annual_income"
                                {...form.register('financial_annual_income')}
                                placeholder="e.g., AED 300,000"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="financial_annual_turnover">Annual Turnover (Business)</Label>
                              <Input
                                id="financial_annual_turnover"
                                {...form.register('financial_annual_turnover')}
                                placeholder="e.g., AED 5,000,000"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Risk Assessment Section */}
                        <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">4. Risk Assessment</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="risk_pep_status">PEP Status (Politically Exposed Person) *</Label>
                              <select
                                id="risk_pep_status"
                                {...form.register('risk_pep_status')}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select PEP status</option>
                                <option value="yes">Yes - PEP</option>
                                <option value="no">No - Not a PEP</option>
                                <option value="related">Related to PEP</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="risk_pep_details">PEP Details (if applicable)</Label>
                              <Input
                                id="risk_pep_details"
                                {...form.register('risk_pep_details')}
                                placeholder="Position, relationship, or details"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="risk_sanctions_screening">Sanctions Screening Results</Label>
                              <Textarea
                                id="risk_sanctions_screening"
                                {...form.register('risk_sanctions_screening')}
                                placeholder="Results of sanctions list screening"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="risk_adverse_media">Adverse Media Checks</Label>
                              <Textarea
                                id="risk_adverse_media"
                                {...form.register('risk_adverse_media')}
                                placeholder="Results of adverse media screening"
                                disabled={isSubmitting}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="risk_country_risk">Country Risk (if international transactions)</Label>
                              <Input
                                id="risk_country_risk"
                                {...form.register('risk_country_risk')}
                                placeholder="List high-risk countries involved"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="risk_business_relationship_purpose">Business Relationship Purpose *</Label>
                              <Input
                                id="risk_business_relationship_purpose"
                                {...form.register('risk_business_relationship_purpose')}
                                placeholder="Purpose of establishing the relationship"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}


                    {/* GoAML Application Fields */}
                    {hasGoAML && (
                      <>

                        <div className="space-y-2">
                          <Label htmlFor="trade_license_number">Trade License Number *</Label>
                          <Input
                            id="trade_license_number"
                            {...form.register('trade_license_number')}
                            placeholder="Enter trade license number"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_of_incorporation">Date of Incorporation</Label>
                          <Input
                            id="date_of_incorporation"
                            type="date"
                            {...form.register('date_of_incorporation')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_name">Compliance Officer Name *</Label>
                          <Input
                            id="compliance_officer_name"
                            {...form.register('compliance_officer_name')}
                            placeholder="Full name"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_position">Officer Position</Label>
                          <Input
                            id="compliance_officer_position"
                            {...form.register('compliance_officer_position')}
                            placeholder="e.g., Chief Compliance Officer"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_email">Officer Email</Label>
                          <Input
                            id="compliance_officer_email"
                            type="email"
                            {...form.register('compliance_officer_email')}
                            placeholder="officer@company.com"
                            disabled={isSubmitting}
                          />
                          {form.formState.errors.compliance_officer_email && (
                            <p className="text-sm text-red-600">{form.formState.errors.compliance_officer_email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_phone">Officer Phone</Label>
                          <Input
                            id="compliance_officer_phone"
                            {...form.register('compliance_officer_phone')}
                            placeholder="+971 XX XXX XXXX"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    )}

                    {/* Bookkeeping Details - shown for bookkeeping products */}
                    {hasBookkeeping && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="company_incorporation_date">Company Incorporation Date</Label>
                          <Input
                            id="company_incorporation_date"
                            type="date"
                            {...form.register('company_incorporation_date')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="number_of_entries_per_month">Number of Entries per Month</Label>
                          <Select
                            value={form.watch('number_of_entries_per_month') || ''}
                            onValueChange={(value) => form.setValue('number_of_entries_per_month', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of entries" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-50">0-50 entries</SelectItem>
                              <SelectItem value="51-100">51-100 entries</SelectItem>
                              <SelectItem value="101-200">101-200 entries</SelectItem>
                              <SelectItem value="201-500">201-500 entries</SelectItem>
                              <SelectItem value="500+">500+ entries</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="annual_turnover">Annual Turnover (AED)</Label>
                          <Input
                            id="annual_turnover"
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register('annual_turnover', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            placeholder="Enter annual turnover"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vat_corporate_tax_status">VAT and Corporate Tax Registration Status</Label>
                          <Select
                            value={form.watch('vat_corporate_tax_status') || ''}
                            onValueChange={(value) => form.setValue('vat_corporate_tax_status', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select registration status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_registered">Not Registered</SelectItem>
                              <SelectItem value="vat_only">VAT Only</SelectItem>
                              <SelectItem value="corporate_tax_only">Corporate Tax Only</SelectItem>
                              <SelectItem value="both_registered">Both Registered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 flex items-center space-x-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10 transition-colors">
                          <Checkbox
                            id="wps_transfer_required"
                            checked={form.watch('wps_transfer_required') || false}
                            onCheckedChange={(checked) => form.setValue('wps_transfer_required', !!checked)}
                            disabled={isSubmitting}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-2 border-muted-foreground w-5 h-5"
                          />
                          <Label htmlFor="wps_transfer_required" className="cursor-pointer font-medium text-foreground">WPS Transfer Requirement</Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accounting_software">Current Accounting Software</Label>
                          <Select
                            value={form.watch('accounting_software') || ''}
                            onValueChange={(value) => form.setValue('accounting_software', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select software" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="xero">Xero</SelectItem>
                              <SelectItem value="quickbooks">QuickBooks</SelectItem>
                              <SelectItem value="zoho">Zoho Books</SelectItem>
                              <SelectItem value="sage">Sage</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="monthly_transactions">Monthly Transaction Volume</Label>
                          <Select
                            value={form.watch('monthly_transactions') || ''}
                            onValueChange={(value) => form.setValue('monthly_transactions', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select volume" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-50">0-50 transactions</SelectItem>
                              <SelectItem value="51-100">51-100 transactions</SelectItem>
                              <SelectItem value="101-250">101-250 transactions</SelectItem>
                              <SelectItem value="251-500">251-500 transactions</SelectItem>
                              <SelectItem value="500+">500+ transactions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {hasBookkeeping && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="bank_accounts_count">Number of Bank Accounts</Label>
                          <Input
                            id="bank_accounts_count"
                            type="number"
                            min="1"
                            max="20"
                            {...form.register('bank_accounts_count', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            placeholder="How many bank accounts to reconcile?"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employees_count">Number of Employees (for Payroll)</Label>
                          <Input
                            id="employees_count"
                            type="number"
                            min="0"
                            max="1000"
                            {...form.register('employees_count', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            placeholder="Enter number of employees"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="service_start_date">Preferred Service Start Date</Label>
                          <Input
                            id="service_start_date"
                            type="date"
                            {...form.register('service_start_date')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reporting_frequency">Reporting Frequency</Label>
                          <Select
                            value={form.watch('reporting_frequency') || 'Monthly'}
                            onValueChange={(value) => form.setValue('reporting_frequency', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10 transition-colors">
                          <Checkbox
                            id="vat_registered"
                            checked={form.watch('vat_registered') || false}
                            onCheckedChange={(checked) => form.setValue('vat_registered', !!checked)}
                            disabled={isSubmitting}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-2 border-muted-foreground w-5 h-5"
                          />
                          <Label htmlFor="vat_registered" className="cursor-pointer font-medium text-foreground">VAT Registered</Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10 transition-colors">
                          <Checkbox
                            id="has_previous_records"
                            checked={form.watch('has_previous_records') || false}
                            onCheckedChange={(checked) => form.setValue('has_previous_records', !!checked)}
                            disabled={isSubmitting}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-2 border-muted-foreground w-5 h-5"
                          />
                          <Label htmlFor="has_previous_records" className="cursor-pointer font-medium text-foreground">Has Previous Accounting Records</Label>
                        </div>
                      </div>
                    )}
                    
                    {/* FTA Portal Access Credentials - for VAT, Tax Registration, and Tax Filing services */}
                    {requiresFTAPortal && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-orange-500/30">
                          <CircleDot className="h-3 w-3 text-orange-600" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">FTA Portal Access Credentials</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                          <div className="space-y-2">
                            <Label htmlFor="fta_portal_email">FTA Portal Email</Label>
                            <Input
                              id="fta_portal_email"
                              type="email"
                              {...form.register('fta_portal_email')}
                              placeholder="Enter FTA portal email address"
                              disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                              Email used for Federal Tax Authority portal access
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fta_portal_password">FTA Portal Password</Label>
                            <div className="relative">
                              <Input
                                id="fta_portal_password"
                                type={showFTAPassword ? "text" : "password"}
                                {...form.register('fta_portal_password')}
                                placeholder="Enter FTA portal password"
                                disabled={isSubmitting}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFTAPassword(!showFTAPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isSubmitting}
                              >
                                {showFTAPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Password is encrypted and stored securely
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>


                {/* Business Information - Business Finance only */}
                {hasBusinessFinance && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-3 border-b border-primary/20">
                      <Building2 className="h-3 w-3 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Business Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                      <div className="space-y-2">
                        <Label htmlFor="company_turnover">Company Turnover (AED) *</Label>
                        <select
                          id="company_turnover"
                          {...form.register('company_turnover')}
                          disabled={isSubmitting}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select turnover range</option>
                          <option value="Below 500,000">Below 500,000</option>
                          <option value="500,000 - 1,000,000">500,000 - 1,000,000</option>
                          <option value="1,000,000 - 5,000,000">1,000,000 - 5,000,000</option>
                          <option value="5,000,000 - 10,000,000">5,000,000 - 10,000,000</option>
                          <option value="10,000,000 - 50,000,000">10,000,000 - 50,000,000</option>
                          <option value="Above 50,000,000">Above 50,000,000</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="years_since_registration">Years Since Company Registration *</Label>
                        <Input
                          id="years_since_registration"
                          type="number"
                          step="0.5"
                          {...form.register('years_since_registration', { valueAsNumber: true })}
                          placeholder="e.g., 3.5"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vat_registration_status">VAT Registration Status *</Label>
                        <select
                          id="vat_registration_status"
                          {...form.register('vat_registration_status')}
                          disabled={isSubmitting}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select status</option>
                          <option value="Registered">Registered</option>
                          <option value="Not Registered">Not Registered</option>
                          <option value="In Process">In Process</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                    <CircleDot className="h-3 w-3 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Financial Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                    {!hasCompanyFormation && (
                      <div className="space-y-2">
                        <Label htmlFor="annual_turnover">Annual Turnover (AED) *</Label>
                        <Input
                          id="annual_turnover"
                          type="number"
                          min="0"
                          step="0.01"
                          {...form.register('annual_turnover', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          required
                        />
                        {form.formState.errors.annual_turnover && (
                          <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>
                        )}
                      </div>
                    )}

                    {/* Service Charges - All products except Home Finance and Business Finance */}
                    {!hasHomeFinance && !hasBusinessFinance && (
                      <div className="space-y-2">
                        <Label htmlFor="service_charges">Service Charges (AED) *</Label>
                        <Input
                          id="service_charges"
                          type="number"
                          min="0"
                          step="0.01"
                          {...form.register('service_charges', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          placeholder="Enter service charges"
                        />
                        {form.formState.errors.service_charges && (
                          <p className="text-sm text-red-600">{form.formState.errors.service_charges.message}</p>
                        )}
                      </div>
                    )}

                    {/* GoAML Financial Fields */}
                    {hasGoAML && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="expected_annual_transaction_volume">Expected Annual Transaction Volume</Label>
                          <select
                            id="expected_annual_transaction_volume"
                            {...form.register('expected_annual_transaction_volume')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select volume range</option>
                            <option value="0-100k">0 - 100,000 AED</option>
                            <option value="100k-500k">100,000 - 500,000 AED</option>
                            <option value="500k-1m">500,000 - 1,000,000 AED</option>
                            <option value="1m-5m">1,000,000 - 5,000,000 AED</option>
                            <option value="5m+">5,000,000+ AED</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transaction_types">Expected Transaction Types</Label>
                          <Input
                            id="transaction_types"
                            {...form.register('transaction_types')}
                            placeholder="e.g., Wire Transfer, Cash, Cheques"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="source_of_funds">Primary Source of Funds</Label>
                          <Input
                            id="source_of_funds"
                            {...form.register('source_of_funds')}
                            placeholder="e.g., Trading revenue, Investment income"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    )}

                    {/* Home Finance Financial Fields */}
                    {hasHomeFinance && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="monthly_gross_salary">Monthly Gross Salary (AED) *</Label>
                          <Input
                            id="monthly_gross_salary"
                            type="number"
                            step="0.01"
                            {...form.register('monthly_gross_salary', { valueAsNumber: true })}
                            placeholder="Enter monthly salary"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="additional_income">Additional Monthly Income (AED)</Label>
                          <Input
                            id="additional_income"
                            type="number"
                            step="0.01"
                            {...form.register('additional_income', { valueAsNumber: true })}
                            placeholder="Rental, investment income, etc."
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="additional_income_source">Source of Additional Income</Label>
                          <Input
                            id="additional_income_source"
                            {...form.register('additional_income_source')}
                            placeholder="e.g., Rental income, dividends"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="existing_loan_commitments">Existing Monthly Loan Commitments (AED)</Label>
                          <Input
                            id="existing_loan_commitments"
                            type="number"
                            step="0.01"
                            {...form.register('existing_loan_commitments', { valueAsNumber: true })}
                            placeholder="Total monthly payments"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="credit_card_limit">Total Credit Card Limit (AED)</Label>
                          <Input
                            id="credit_card_limit"
                            type="number"
                            step="0.01"
                            {...form.register('credit_card_limit', { valueAsNumber: true })}
                            placeholder="Combined credit limit"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="credit_card_outstanding">Credit Card Outstanding (AED)</Label>
                          <Input
                            id="credit_card_outstanding"
                            type="number"
                            step="0.01"
                            {...form.register('credit_card_outstanding', { valueAsNumber: true })}
                            placeholder="Current outstanding balance"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loan_amount_required">Loan Amount Required (AED) *</Label>
                          <Input
                            id="loan_amount_required"
                            type="number"
                            step="0.01"
                            {...form.register('loan_amount_required', { valueAsNumber: true })}
                            placeholder="Amount to finance"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="down_payment_amount">Down Payment Available (AED) *</Label>
                          <Input
                            id="down_payment_amount"
                            type="number"
                            step="0.01"
                            {...form.register('down_payment_amount', { valueAsNumber: true })}
                            placeholder="Your down payment"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    )}
                    
                    {/* Deal Amount - Always shown last */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Deal Amount (AED) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        {...form.register('amount', { valueAsNumber: true })}
                        disabled={isSubmitting}
                        required
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Required Documents Section - GoAML */}
                {hasGoAML && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <span className="text-xs">ℹ️</span>
                      <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                    </div>
                    <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                      <span className="text-base leading-none">💡</span>
                      <span>This is an informational checklist only. Documents will be collected in subsequent registration steps.</span>
                    </p>
                      <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                        <AccordionItem value="goaml-docs" className="border-0">
                          <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                            <span className="text-muted-foreground">View document checklist</span>
                          </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                          <ul className="text-sm space-y-1.5 text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Trade License Copy (certified)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Passport Copies of all Beneficial Owners (UBOs)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Emirates ID Copies of all UBOs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Proof of Address for all UBOs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Memorandum of Association (MOA)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Board Resolution appointing Compliance Officer</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Company Organization Chart</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Bank Account Details & Statements (Last 6 months)</span>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                )}
            </AccordionContent>
          </AccordionItem>
            )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Required Documents Section - GoAML */}
                {hasGoAML && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                        <Badge variant="secondary" className="text-xs">8 items</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const doc = new jsPDF();
                                  
                                  doc.setFontSize(16);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('GoAML REGISTRATION', 105, 20, { align: 'center' });
                                  doc.text('Required Documents Checklist', 105, 28, { align: 'center' });
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });
                                  
                                  doc.setLineWidth(0.5);
                                  doc.line(20, 40, 190, 40);
                                  
                                  let yPos = 50;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('COMPANY DOCUMENTS (3)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Trade License Copy (certified)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Memorandum of Association (MOA)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Company Organization Chart', 25, yPos);
                                  yPos += 12;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('BENEFICIAL OWNER DOCUMENTS (3)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Passport Copies of all UBOs', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Emirates ID Copies of all UBOs', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Proof of Address for all UBOs', 25, yPos);
                                  yPos += 12;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('COMPLIANCE DOCUMENTS (2)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Board Resolution appointing Compliance Officer', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Bank Account Details & Statements (Last 6 months)', 25, yPos);
                                  yPos += 15;
                                  
                                  doc.setLineWidth(0.5);
                                  doc.line(20, yPos, 190, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(9);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('NOTES:', 20, yPos);
                                  yPos += 6;
                                  
                                  doc.setFont(undefined, 'normal');
                                  doc.text('• Documents will be collected in subsequent registration steps', 20, yPos);
                                  yPos += 5;
                                  doc.text('• All copies must be certified where indicated', 20, yPos);
                                  yPos += 5;
                                  doc.text('• UBO = Ultimate Beneficial Owner (25%+ ownership)', 20, yPos);
                                  
                                  doc.save(`GoAML-Registration-Checklist-${new Date().toISOString().split('T')[0]}.pdf`);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "PDF checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download PDF checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `GoAML REGISTRATION - REQUIRED DOCUMENTS CHECKLIST

Generated: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPANY DOCUMENTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Trade License Copy (certified)
□ Memorandum of Association (MOA)
□ Company Organization Chart


BENEFICIAL OWNER DOCUMENTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Passport Copies of all UBOs
□ Emirates ID Copies of all UBOs
□ Proof of Address for all UBOs


COMPLIANCE DOCUMENTS (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Board Resolution appointing Compliance Officer
□ Bank Account Details & Statements (Last 6 months)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES:
• Documents will be collected in subsequent registration steps
• All copies must be certified where indicated
• UBO = Ultimate Beneficial Owner (25%+ ownership)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                                  
                                  const blob = new Blob([checklist], { type: 'text/plain' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `GoAML-Registration-Checklist-${new Date().toISOString().split('T')[0]}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "Text checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download text checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `GoAML Registration - Required Documents\n\nCompany Documents:\n• Trade License Copy (certified)\n• Memorandum of Association (MOA)\n• Company Organization Chart\n\nBeneficial Owner Documents:\n• Passport Copies of all UBOs\n• Emirates ID Copies of all UBOs\n• Proof of Address for all UBOs\n\nCompliance Documents:\n• Board Resolution appointing Compliance Officer\n• Bank Account Details & Statements (Last 6 months)`;
                                  navigator.clipboard.writeText(checklist);
                                  toast({
                                    title: "Copied!",
                                    description: "Checklist copied to clipboard",
                                  });
                                }}
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async () => {
                                  const email = form.watch('email');
                                  const name = form.watch('name');
                                  
                                  if (!email || !validateEmail(email)) {
                                    toast({
                                      title: "Email Required",
                                      description: "Please enter a valid email address in the Basic Information section first",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const checklist = `Company Documents:\n• Trade License Copy (certified)\n• Memorandum of Association (MOA)\n• Company Organization Chart\n\nBeneficial Owner Documents:\n• Passport Copies of all UBOs\n• Emirates ID Copies of all UBOs\n• Proof of Address for all UBOs\n\nCompliance Documents:\n• Board Resolution appointing Compliance Officer\n• Bank Account Details & Statements (Last 6 months)`;
                                  
                                  const success = await emailDocumentChecklist({
                                    recipientEmail: email,
                                    recipientName: name || 'Customer',
                                    documentList: checklist,
                                    productType: 'GoAML Registration',
                                    customerName: form.watch('company'),
                                  });
                                  
                                  if (success) {
                                    toast({
                                      title: "Email Sent!",
                                      description: `Checklist sent to ${email}`,
                                    });
                                  } else {
                                    toast({
                                      title: "Failed to send",
                                      description: "Please try again or contact support",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Email checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const mobile = form.watch('mobile');
                                  
                                  if (!mobile || !validatePhoneNumber(mobile)) {
                                    toast({
                                      title: "Phone Required",
                                      description: "Please enter a valid mobile number in the Basic Information section first",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const checklist = `Company Documents:\n• Trade License Copy (certified)\n• Memorandum of Association (MOA)\n• Company Organization Chart\n\nBeneficial Owner Documents:\n• Passport Copies of all UBOs\n• Emirates ID Copies of all UBOs\n• Proof of Address for all UBOs\n\nCompliance Documents:\n• Board Resolution appointing Compliance Officer\n• Bank Account Details & Statements (Last 6 months)`;
                                  
                                  try {
                                    shareViaWhatsApp(mobile, checklist, 'GoAML Registration');
                                    toast({
                                      title: "Opening WhatsApp...",
                                      description: "Share checklist via WhatsApp",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Failed to open WhatsApp",
                                      description: "Please check the mobile number",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share via WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>Agent reference only - Documents collected in subsequent registration steps.</span>
                    </p>
                    <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                      <AccordionItem value="goaml-docs" className="border-0">
                        <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                          <span className="text-muted-foreground">📋 View categorized document checklist</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* Company Documents */}
                            <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">Company Documents</p>
                                <Badge variant="outline" className="text-xs">3</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Trade License Copy (certified)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Memorandum of Association (MOA)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Company Organization Chart</span>
                                </li>
                              </ul>
                            </div>

                            {/* Beneficial Owner Documents */}
                            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Beneficial Owner Documents</p>
                                <Badge variant="outline" className="text-xs">3</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Passport Copies of all Beneficial Owners (UBOs)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Emirates ID Copies of all UBOs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Proof of Address for all UBOs</span>
                                </li>
                              </ul>
                            </div>

                            {/* Compliance Documents */}
                            <div className="rounded-md border border-green-200 dark:border-green-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CircleDot className="h-4 w-4 text-green-600" />
                                <p className="text-xs font-semibold text-green-900 dark:text-green-100">Compliance Documents</p>
                                <Badge variant="outline" className="text-xs">2</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Board Resolution appointing Compliance Officer</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Bank Account Details & Statements (Last 6 months)</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Required Documents Section - AML Services */}
                {hasAMLServices && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                        <Badge variant="secondary" className="text-xs">7 items</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const doc = new jsPDF();
                                  
                                  // Header
                                  doc.setFontSize(16);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('AML SERVICES', 105, 20, { align: 'center' });
                                  doc.text('Required Documents Checklist', 105, 28, { align: 'center' });
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });
                                  
                                  doc.setLineWidth(0.5);
                                  doc.line(20, 40, 190, 40);
                                  
                                  let yPos = 50;
                                  
                                  // Personal Documents
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('PERSONAL DOCUMENTS (2)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Copy of Emirates ID / Passport', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Proof of address (utility bill, tenancy contract)', 25, yPos);
                                  yPos += 12;
                                  
                                  // Company Documents
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('COMPANY DOCUMENTS (3)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Trade license (for companies)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Memorandum of Association', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Board resolution for authorized signatories', 25, yPos);
                                  yPos += 12;
                                  
                                  // Financial Documents
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('FINANCIAL DOCUMENTS (2)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Bank statements (last 3-6 months)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Source of funds documentation', 25, yPos);
                                  yPos += 15;
                                  
                                  // Footer Notes
                                  doc.setLineWidth(0.5);
                                  doc.line(20, yPos, 190, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(9);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('NOTES:', 20, yPos);
                                  yPos += 6;
                                  
                                  doc.setFont(undefined, 'normal');
                                  doc.text('• Documents will be requested during AML compliance process', 20, yPos);
                                  yPos += 5;
                                  doc.text('• Keep copies for your records', 20, yPos);
                                  yPos += 5;
                                  doc.text('• Ensure all documents are current and valid', 20, yPos);
                                  
                                  doc.save(`AML-Services-Checklist-${new Date().toISOString().split('T')[0]}.pdf`);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "PDF checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download PDF checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `AML SERVICES - REQUIRED DOCUMENTS CHECKLIST
                                  
Generated: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONAL DOCUMENTS (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Copy of Emirates ID / Passport
□ Proof of address (utility bill, tenancy contract)


COMPANY DOCUMENTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Trade license (for companies)
□ Memorandum of Association
□ Board resolution for authorized signatories


FINANCIAL DOCUMENTS (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Bank statements (last 3-6 months)
□ Source of funds documentation


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES:
• Documents will be requested during AML compliance process
• Keep copies for your records
• Ensure all documents are current and valid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                                  
                                  const blob = new Blob([checklist], { type: 'text/plain' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `AML-Services-Checklist-${new Date().toISOString().split('T')[0]}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "Text checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download text checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `AML Services - Required Documents Checklist\n\nPersonal Documents:\n• Copy of Emirates ID / Passport\n• Proof of address (utility bill, tenancy contract)\n\nCompany Documents:\n• Trade license (for companies)\n• Memorandum of Association\n• Board resolution for authorized signatories\n\nFinancial Documents:\n• Bank statements (last 3-6 months)\n• Source of funds documentation`;
                                  navigator.clipboard.writeText(checklist);
                                  toast({
                                    title: "Copied!",
                                    description: "Checklist copied to clipboard",
                                  });
                                }}
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>Agent reference only - Documents will be requested during AML compliance process.</span>
                    </p>
                    <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                      <AccordionItem value="aml-services-docs" className="border-0">
                        <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                          <span className="text-muted-foreground">📋 View categorized document checklist</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* Personal Documents */}
                            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Personal Documents</p>
                                <Badge variant="outline" className="text-xs">2</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Copy of Emirates ID / Passport</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Proof of address (utility bill, tenancy contract)</span>
                                </li>
                              </ul>
                            </div>

                            {/* Company Documents */}
                            <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">Company Documents</p>
                                <Badge variant="outline" className="text-xs">3</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Trade license (for companies)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Memorandum of Association</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Board resolution for authorized signatories</span>
                                </li>
                              </ul>
                            </div>

                            {/* Financial Documents */}
                            <div className="rounded-md border border-green-200 dark:border-green-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CircleDot className="h-4 w-4 text-green-600" />
                                <p className="text-xs font-semibold text-green-900 dark:text-green-100">Financial Documents</p>
                                <Badge variant="outline" className="text-xs">2</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Bank statements (last 3-6 months)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Source of funds documentation</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Required Documents Section - Home Finance */}
                {hasHomeFinance && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                        <Badge variant="secondary" className="text-xs">10 items</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const doc = new jsPDF();
                                  
                                  doc.setFontSize(16);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('HOME FINANCE MORTGAGE', 105, 20, { align: 'center' });
                                  doc.text('Required Documents Checklist', 105, 28, { align: 'center' });
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });
                                  
                                  doc.setLineWidth(0.5);
                                  doc.line(20, 40, 190, 40);
                                  
                                  let yPos = 50;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('PERSONAL DOCUMENTS (2)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Passport Copy with valid UAE Visa', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Emirates ID Copy (both sides)', 25, yPos);
                                  yPos += 12;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('EMPLOYMENT & FINANCIAL (2)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Salary Certificate (last 3 months)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Bank Statements (last 6 months)', 25, yPos);
                                  yPos += 12;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('PROPERTY DOCUMENTS (3)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Property Valuation Report', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Property Documents (Title Deed / MOU / Sale Agreement)', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Proof of Down Payment (Bank Statement)', 25, yPos);
                                  yPos += 12;
                                  
                                  doc.setFontSize(12);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('ADDITIONAL DOCUMENTS (3)', 20, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(10);
                                  doc.setFont(undefined, 'normal');
                                  doc.text('☐ Credit Report Authorization Form', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Self-Employed: Trade License, MOA, Audited Financials', 25, yPos);
                                  yPos += 7;
                                  doc.text('☐ Co-Applicant: All above documents for co-applicant', 25, yPos);
                                  yPos += 15;
                                  
                                  doc.setLineWidth(0.5);
                                  doc.line(20, yPos, 190, yPos);
                                  yPos += 8;
                                  
                                  doc.setFontSize(9);
                                  doc.setFont(undefined, 'bold');
                                  doc.text('NOTES:', 20, yPos);
                                  yPos += 6;
                                  
                                  doc.setFont(undefined, 'normal');
                                  doc.text('• Documents requested during mortgage processing stage', 20, yPos);
                                  yPos += 5;
                                  doc.text('• Self-employed applicants need additional business documents', 20, yPos);
                                  yPos += 5;
                                  doc.text('• Co-applicant documents required if applicable', 20, yPos);
                                  
                                  doc.save(`Home-Finance-Checklist-${new Date().toISOString().split('T')[0]}.pdf`);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "PDF checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download PDF checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `HOME FINANCE MORTGAGE - REQUIRED DOCUMENTS CHECKLIST

Generated: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONAL DOCUMENTS (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Passport Copy with valid UAE Visa
□ Emirates ID Copy (both sides)


EMPLOYMENT & FINANCIAL (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Salary Certificate (last 3 months)
□ Bank Statements (last 6 months)


PROPERTY DOCUMENTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Property Valuation Report
□ Property Documents (Title Deed / MOU / Sale Agreement)
□ Proof of Down Payment (Bank Statement showing available funds)


ADDITIONAL DOCUMENTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Credit Report Authorization Form
□ If Self-Employed: Trade License, MOA, Audited Financials (last 2 years)
□ If Co-Applicant: All above documents for co-applicant as well


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES:
• Documents requested during mortgage processing stage
• Self-employed applicants need additional business documents
• Co-applicant documents required if applicable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                                  
                                  const blob = new Blob([checklist], { type: 'text/plain' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `Home-Finance-Checklist-${new Date().toISOString().split('T')[0]}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  
                                  toast({
                                    title: "Downloaded!",
                                    description: "Text checklist saved to downloads",
                                  });
                                }}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download text checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const checklist = `Home Finance Mortgage - Required Documents\n\nPersonal Documents:\n• Passport Copy with valid UAE Visa\n• Emirates ID Copy (both sides)\n\nEmployment & Financial:\n• Salary Certificate (last 3 months)\n• Bank Statements (last 6 months)\n\nProperty Documents:\n• Property Valuation Report\n• Property Documents (Title Deed / MOU / Sale Agreement)\n• Proof of Down Payment\n\nAdditional Documents:\n• Credit Report Authorization Form\n• If Self-Employed: Trade License, MOA, Audited Financials\n• If Co-Applicant: All documents for co-applicant`;
                                  navigator.clipboard.writeText(checklist);
                                  toast({
                                    title: "Copied!",
                                    description: "Checklist copied to clipboard",
                                  });
                                }}
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async () => {
                                  const email = form.watch('email');
                                  const name = form.watch('name');
                                  
                                  if (!email || !validateEmail(email)) {
                                    toast({
                                      title: "Email Required",
                                      description: "Please enter a valid email address in the Basic Information section first",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const checklist = `Personal Documents:\n• Passport Copy with valid UAE Visa\n• Emirates ID Copy (both sides)\n\nEmployment & Financial:\n• Salary Certificate (last 3 months)\n• Bank Statements (last 6 months)\n\nProperty Documents:\n• Property Valuation Report\n• Property Documents (Title Deed / MOU / Sale Agreement)\n• Proof of Down Payment\n\nAdditional Documents:\n• Credit Report Authorization Form\n• If Self-Employed: Trade License, MOA, Audited Financials\n• If Co-Applicant: All documents for co-applicant`;
                                  
                                  const success = await emailDocumentChecklist({
                                    recipientEmail: email,
                                    recipientName: name || 'Customer',
                                    documentList: checklist,
                                    productType: 'Home Finance Mortgage',
                                    customerName: form.watch('company'),
                                  });
                                  
                                  if (success) {
                                    toast({
                                      title: "Email Sent!",
                                      description: `Checklist sent to ${email}`,
                                    });
                                  } else {
                                    toast({
                                      title: "Failed to send",
                                      description: "Please try again or contact support",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Email checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  const mobile = form.watch('mobile');
                                  
                                  if (!mobile || !validatePhoneNumber(mobile)) {
                                    toast({
                                      title: "Phone Required",
                                      description: "Please enter a valid mobile number in the Basic Information section first",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const checklist = `Personal Documents:\n• Passport Copy with valid UAE Visa\n• Emirates ID Copy (both sides)\n\nEmployment & Financial:\n• Salary Certificate (last 3 months)\n• Bank Statements (last 6 months)\n\nProperty Documents:\n• Property Valuation Report\n• Property Documents (Title Deed / MOU / Sale Agreement)\n• Proof of Down Payment\n\nAdditional Documents:\n• Credit Report Authorization Form\n• If Self-Employed: Trade License, MOA, Audited Financials\n• If Co-Applicant: All documents for co-applicant`;
                                  
                                  try {
                                    shareViaWhatsApp(mobile, checklist, 'Home Finance Mortgage');
                                    toast({
                                      title: "Opening WhatsApp...",
                                      description: "Share checklist via WhatsApp",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Failed to open WhatsApp",
                                      description: "Please check the mobile number",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share via WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>Agent reference only - Documents requested during mortgage processing stage.</span>
                    </p>
                    <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                      <AccordionItem value="home-finance-docs" className="border-0">
                        <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                          <span className="text-muted-foreground">📋 View categorized document checklist</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* Personal Documents */}
                            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Personal Documents</p>
                                <Badge variant="outline" className="text-xs">2</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Passport Copy with valid UAE Visa</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Emirates ID Copy (both sides)</span>
                                </li>
                              </ul>
                            </div>

                            {/* Employment & Financial Documents */}
                            <div className="rounded-md border border-green-200 dark:border-green-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CircleDot className="h-4 w-4 text-green-600" />
                                <p className="text-xs font-semibold text-green-900 dark:text-green-100">Employment & Financial</p>
                                <Badge variant="outline" className="text-xs">2</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Salary Certificate (last 3 months)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>Bank Statements (last 6 months)</span>
                                </li>
                              </ul>
                            </div>

                            {/* Property Documents */}
                            <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">Property Documents</p>
                                <Badge variant="outline" className="text-xs">3</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Property Valuation Report</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Property Documents (Title Deed / MOU / Sale Agreement)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>Proof of Down Payment (Bank Statement showing available funds)</span>
                                </li>
                              </ul>
                            </div>

                            {/* Additional Documents */}
                            <div className="rounded-md border border-orange-200 dark:border-orange-800 bg-background/50 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">Additional Documents</p>
                                <Badge variant="outline" className="text-xs">3</Badge>
                              </div>
                              <ul className="text-sm space-y-1.5 text-muted-foreground ml-6">
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-500 mt-0.5">•</span>
                                  <span>Credit Report Authorization Form</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If Self-Employed:</strong> Trade License, MOA, Audited Financials (last 2 years)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If Co-Applicant:</strong> All above documents for co-applicant as well</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

              {/* VAT Registration Details */}
              {hasVAT && (
                <>
                  <div className="-mx-4 px-4 py-2 border-b">
                    <h3 className="text-base font-medium">VAT Registration Details</h3>
                  </div>
                  <div>
                    
                    {/* Registration Type & Status */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Registration Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="vat_registration_type">Registration Type *</Label>
                          <select
                            id="vat_registration_type"
                            {...form.register('vat_registration_type')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select type</option>
                            <option value="Mandatory">Mandatory Registration (Turnover &gt; AED 375,000)</option>
                            <option value="Voluntary">Voluntary Registration (Turnover &lt; AED 375,000)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="annual_turnover">Expected Annual Turnover (AED) *</Label>
                          <Input
                            id="annual_turnover"
                            type="number"
                            step="0.01"
                            {...form.register('annual_turnover', { valueAsNumber: true })}
                            placeholder="Total annual revenue"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="already_registered_vat"
                              checked={form.watch('already_registered_vat') || false}
                              onCheckedChange={(checked) => form.setValue('already_registered_vat', !!checked)}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="already_registered_vat">Already registered for VAT (need to update/amend)</Label>
                          </div>
                        </div>

                        {form.watch('already_registered_vat') && (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="existing_trn">Existing Tax Registration Number (TRN)</Label>
                            <Input
                              id="existing_trn"
                              {...form.register('existing_trn')}
                              placeholder="Enter your TRN"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="financial_year_end_date">Financial Year End Date</Label>
                          <Input
                            id="financial_year_end_date"
                            type="date"
                            {...form.register('financial_year_end_date')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vat_accounting_software">Accounting Software Used</Label>
                          <Input
                            id="vat_accounting_software"
                            {...form.register('vat_accounting_software')}
                            placeholder="e.g., Zoho Books, QuickBooks, Tally"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Activity Details */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Business Activity Details</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="business_activity_description">Detailed Business Activity Description *</Label>
                          <Textarea
                            id="business_activity_description"
                            {...form.register('business_activity_description')}
                            placeholder="Describe all business activities (trading, services, manufacturing, etc.)"
                            disabled={isSubmitting}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="import_activities"
                                checked={form.watch('import_activities') || false}
                                onCheckedChange={(checked) => form.setValue('import_activities', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="import_activities">Business involves imports</Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="export_activities"
                                checked={form.watch('export_activities') || false}
                                onCheckedChange={(checked) => form.setValue('export_activities', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="export_activities">Business involves exports</Label>
                            </div>
                          </div>
                        </div>

                        {form.watch('import_activities') && (
                          <div className="space-y-2">
                            <Label htmlFor="import_countries">Main Countries for Imports</Label>
                            <Input
                              id="import_countries"
                              {...form.register('import_countries')}
                              placeholder="e.g., China, India, Germany"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

                        {form.watch('export_activities') && (
                          <div className="space-y-2">
                            <Label htmlFor="export_countries">Main Countries for Exports</Label>
                            <Input
                              id="export_countries"
                              {...form.register('export_countries')}
                              placeholder="e.g., Saudi Arabia, Kuwait, Oman"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="multiple_business_locations"
                                checked={form.watch('multiple_business_locations') || false}
                                onCheckedChange={(checked) => form.setValue('multiple_business_locations', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="multiple_business_locations">Multiple business locations/branches</Label>
                            </div>
                          </div>

                          {form.watch('multiple_business_locations') && (
                            <div className="space-y-2">
                              <Label htmlFor="number_of_locations">Number of Locations</Label>
                              <Input
                                id="number_of_locations"
                                type="number"
                                min="1"
                                {...form.register('number_of_locations', { valueAsNumber: true })}
                                placeholder="Total branches/locations"
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>

                        {form.watch('already_registered_vat') && (
                          <div className="space-y-2">
                            <Label htmlFor="previous_tax_period">Previous Tax Period Filed</Label>
                            <Input
                              id="previous_tax_period"
                              {...form.register('previous_tax_period')}
                              placeholder="e.g., Q4 2024, Jan-Mar 2024"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the VAT registration process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="vat-reg-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                            <ul className="text-sm space-y-1.5 text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Trade License Copy (certified)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Passport Copies of all Partners/Shareholders</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Emirates ID Copies of all Partners/Shareholders</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Memorandum of Association (MOA)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Tenancy Contract / Ejari</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Bank Account Details & Bank Statements (last 6 months)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Financial Statements (if available)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Customs Registration (if importing/exporting)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If already VAT registered:</strong> Previous VAT returns and TRN certificate</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If multiple locations:</strong> Details and documents for all branches</span>
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                  <Separator className="my-3" />
                </>
              )}

              {/* Corporate Tax Registration Details */}
              {hasTaxRegistration && (
                <AccordionItem value="tax-registration" className="border rounded-lg bg-background shadow-sm" style={{ scrollMarginTop: totalStickyOffset }}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <h3 className="text-base font-medium">Corporate Tax Registration Details</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="company">Trade License Number *</Label>
                        <Input
                          id="trade_license_number"
                          {...form.register('customer_notes')}
                          placeholder="Enter trade license number"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="annual_turnover">Expected Annual Revenue (AED) *</Label>
                        <Input
                          id="annual_turnover"
                          type="number"
                          step="0.01"
                          {...form.register('annual_turnover', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          required
                        />
                        {form.formState.errors.annual_turnover && (
                          <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="financial_year_end_date">Financial Year End Date</Label>
                        <Input
                          id="financial_year_end_date"
                          type="date"
                          {...form.register('financial_year_end_date')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Business Activity/Sector</Label>
                        <Input
                          id="jurisdiction"
                          {...form.register('jurisdiction')}
                          placeholder="e.g., Trading, Consulting, Manufacturing"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="customer_notes">Additional Registration Notes</Label>
                        <Textarea
                          id="customer_notes"
                          {...form.register('customer_notes')}
                          placeholder="Any special requirements or information for registration"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_foreign_operations"
                          checked={form.watch('has_foreign_operations') || false}
                          onCheckedChange={(checked) => form.setValue('has_foreign_operations', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="has_foreign_operations">Has foreign shareholders or operations</Label>
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the registration process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="corp-tax-reg-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                            <ul className="text-sm space-y-1.5 text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Trade License Copy (certified)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Passport Copies of all Shareholders/Partners</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Emirates ID Copies of all Shareholders/Partners</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Memorandum of Association (MOA)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Tenancy Contract / Ejari</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Financial Year End Confirmation Letter</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Bank Account Details</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Company Organization Chart</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If foreign operations:</strong> Details of foreign entities and cross-border transactions</span>
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Corporate Tax Filing Details */}
              {hasTaxFiling && (
                <AccordionItem value="tax-filing" className="border rounded-lg bg-background shadow-sm" style={{ scrollMarginTop: totalStickyOffset }}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <h3 className="text-base font-medium">Corporate Tax Filing Details</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="tax_registration_number">Tax Registration Number (TRN) *</Label>
                        <Input
                          id="tax_registration_number"
                          {...form.register('tax_registration_number')}
                          placeholder="Enter your TRN"
                          disabled={isSubmitting}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_year_period">Tax Year/Period *</Label>
                        <Input
                          id="tax_year_period"
                          {...form.register('tax_year_period')}
                          placeholder="e.g., 2024"
                          disabled={isSubmitting}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="financial_year_end_date">Financial Year End Date</Label>
                        <Input
                          id="financial_year_end_date"
                          type="date"
                          {...form.register('financial_year_end_date')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filing_deadline">Filing Deadline</Label>
                        <Input
                          id="filing_deadline"
                          type="date"
                          {...form.register('filing_deadline')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="annual_turnover">Annual Revenue (AED)</Label>
                        <Input
                          id="annual_turnover"
                          type="number"
                          step="0.01"
                          {...form.register('annual_turnover', { valueAsNumber: true })}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previous_tax_consultant">Previous Tax Consultant</Label>
                        <Input
                          id="previous_tax_consultant"
                          {...form.register('previous_tax_consultant')}
                          placeholder="If switching from another consultant"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tax_exemptions">Tax Exemptions or Special Status</Label>
                        <Textarea
                          id="tax_exemptions"
                          {...form.register('tax_exemptions')}
                          placeholder="Describe any tax exemptions or special status"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="first_time_filing"
                          checked={form.watch('first_time_filing') || false}
                          onCheckedChange={(checked) => form.setValue('first_time_filing', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="first_time_filing">First time filing</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_foreign_operations"
                          checked={form.watch('has_foreign_operations') || false}
                          onCheckedChange={(checked) => form.setValue('has_foreign_operations', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="has_foreign_operations">Has foreign operations/transactions</Label>
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the filing process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="required-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                              <ul className="text-sm space-y-1.5 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Tax Registration Number (TRN) Certificate</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Financial Statements (Balance Sheet, P&L, Cash Flow)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Trial Balance for the tax period</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>General Ledger (detailed transactions)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Bank Statements (entire tax period)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Schedule of Fixed Assets & Depreciation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Details of Related Party Transactions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Payroll Records (if applicable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>VAT Returns (if registered)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If first time filing:</strong> Opening balance sheet and incorporation documents</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If foreign operations:</strong> Foreign subsidiary financials and transfer pricing documentation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If switching consultant:</strong> Previous tax returns and correspondence with FTA</span>
                                </li>
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}


              </Accordion>
              ) : formMode === 'wizard' ? (
                /* Wizard Mode - Show one step at a time */
                <div className="space-y-4">
                  {/* Wizard Progress */}
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      {wizardSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <React.Fragment key={step.id}>
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                              index === wizardStep 
                                ? "bg-primary text-primary-foreground font-semibold" 
                                : index < wizardStep
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <StepIcon className="h-4 w-4" />
                              <span className="text-xs hidden sm:inline">{step.label}</span>
                              <span className="text-xs sm:hidden">{index + 1}</span>
                            </div>
                            {index < wizardSteps.length - 1 && (
                              <div className={cn(
                                "h-0.5 w-8 transition-all",
                                index < wizardStep ? "bg-primary" : "bg-muted"
                              )} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wizard Step Content - Basic Info */}
                  {wizardStep === 0 && (
                    <Card className="border rounded-lg bg-background shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-name">Full Name *</Label>
                            <Input id="new-wiz-name" {...form.register('name')} disabled={isSubmitting} required />
                            {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-email">Email *</Label>
                            <Input id="new-wiz-email" type="email" {...form.register('email')} disabled={isSubmitting} required />
                            {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-mobile">Mobile *</Label>
                            <Input id="new-wiz-mobile" {...form.register('mobile')} disabled={isSubmitting} required />
                            {form.formState.errors.mobile && <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-company">Company *</Label>
                            <Input id="new-wiz-company" {...form.register('company')} disabled={isSubmitting} required />
                            {form.formState.errors.company && <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Wizard Step Content - Source & Channel */}
                  {wizardStep === 1 && (
                    <Card className="border rounded-lg bg-background shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Source & Channel Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-wiz-lead-source">Lead Source *</Label>
                          <Select value={form.watch('lead_source')} onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Wizard Step Content - Service Selection */}
                  {wizardStep === 2 && (
                    <Card className="border rounded-lg bg-background shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Service Selection
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-wiz-product">Product/Service *</Label>
                          <Select value={form.watch('product_id')} onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }} disabled={isSubmitting || productsLoading}>
                            <SelectTrigger><SelectValue placeholder="Select a product or service" /></SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.product_id && <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Wizard Step Content - Deal Info */}
                  {wizardStep === 3 && (
                    <Card className="border rounded-lg bg-background shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Deal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-amount">Amount *</Label>
                            <Input id="new-wiz-amount" type="number" {...form.register('amount', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.amount && <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-license">License Type *</Label>
                            <Select value={form.watch('license_type')} onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mainland">Mainland</SelectItem>
                                <SelectItem value="Freezone">Freezone</SelectItem>
                                <SelectItem value="Offshore">Offshore</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-wiz-turnover">Annual Turnover *</Label>
                            <Input id="new-wiz-turnover" type="number" {...form.register('annual_turnover', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.annual_turnover && <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Wizard Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleWizardPrevious} disabled={wizardStep === 0}>
                      Previous
                    </Button>
                    {wizardStep < wizardSteps.length - 1 ? (
                      <Button type="button" onClick={handleWizardNext}>
                        Next
                      </Button>
                    ) : (
                      <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : formMode === 'tabs' ? (
                /* Tabs Mode - All sections accessible via tabs */
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Basic Info</span>
                      <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="lead" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      <span className="hidden sm:inline">Source</span>
                      <span className="sm:hidden">Source</span>
                    </TabsTrigger>
                    <TabsTrigger value="service" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Service</span>
                      <span className="sm:hidden">Service</span>
                    </TabsTrigger>
                    <TabsTrigger value="deal" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Deal Info</span>
                      <span className="sm:hidden">Deal</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-name">Full Name *</Label>
                            <Input id="new-tab-name" {...form.register('name')} disabled={isSubmitting} required />
                            {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-email">Email *</Label>
                            <Input id="new-tab-email" type="email" {...form.register('email')} disabled={isSubmitting} required />
                            {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-mobile">Mobile *</Label>
                            <Input id="new-tab-mobile" {...form.register('mobile')} disabled={isSubmitting} required />
                            {form.formState.errors.mobile && <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-company">Company *</Label>
                            <Input id="new-tab-company" {...form.register('company')} disabled={isSubmitting} required />
                            {form.formState.errors.company && <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Source & Channel Tab */}
                  <TabsContent value="lead" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Source & Channel Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-tab-lead-source">Lead Source *</Label>
                          <Select value={form.watch('lead_source')} onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Service Selection Tab */}
                  <TabsContent value="service" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Service Selection
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-tab-product">Product/Service *</Label>
                          <Select value={form.watch('product_id')} onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }} disabled={isSubmitting || productsLoading}>
                            <SelectTrigger><SelectValue placeholder="Select a product or service" /></SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.product_id && <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Deal Info Tab */}
                  <TabsContent value="deal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Deal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-amount">Amount *</Label>
                            <Input id="new-tab-amount" type="number" {...form.register('amount', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.amount && <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-license-type">License Type *</Label>
                            <Select value={form.watch('license_type')} onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mainland">Mainland</SelectItem>
                                <SelectItem value="Freezone">Freezone</SelectItem>
                                <SelectItem value="Offshore">Offshore</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-tab-turnover">Annual Turnover *</Label>
                            <Input id="new-tab-turnover" type="number" {...form.register('annual_turnover', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.annual_turnover && <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>
                </Tabs>
              ) : formMode === 'progressive' ? (
                /* Progressive Mode - Reveal sections as they're completed */
                <div className="space-y-4">
                  {/* Basic Information - Always shown first */}
                  <Card className="border rounded-lg bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Basic Information
                        {isBasicInfoComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-name">Full Name *</Label>
                          <Input id="new-prog-name" {...form.register('name')} disabled={isSubmitting} required />
                          {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-email">Email *</Label>
                          <Input id="new-prog-email" type="email" {...form.register('email')} disabled={isSubmitting} required />
                          {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-mobile">Mobile *</Label>
                          <Input id="new-prog-mobile" {...form.register('mobile')} disabled={isSubmitting} required />
                          {form.formState.errors.mobile && <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-company">Company *</Label>
                          <Input id="new-prog-company" {...form.register('company')} disabled={isSubmitting} required />
                          {form.formState.errors.company && <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Source & Channel - Show after basic info is complete */}
                  {isBasicInfoComplete && (
                    <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Source & Channel Information
                          {isSourceChannelComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-lead-source">Lead Source *</Label>
                          <Select value={form.watch('lead_source')} onValueChange={(value) => { form.setValue('lead_source', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('lead_source'); }} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Service Selection - Show after source is complete */}
                  {isBasicInfoComplete && isSourceChannelComplete && (
                    <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Service Selection
                          {isServiceSelectionComplete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="new-prog-product">Product/Service *</Label>
                          <Select value={form.watch('product_id')} onValueChange={(value) => { form.setValue('product_id', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.clearErrors('product_id'); }} disabled={isSubmitting || productsLoading}>
                            <SelectTrigger><SelectValue placeholder="Select a product or service" /></SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.product_id && <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Deal Info - Show after service is selected */}
                  {isBasicInfoComplete && isSourceChannelComplete && isServiceSelectionComplete && (
                    <Card className="border rounded-lg bg-background shadow-sm animate-fade-in">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Deal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-prog-amount">Amount *</Label>
                            <Input id="new-prog-amount" type="number" {...form.register('amount', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.amount && <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-prog-license">License Type *</Label>
                            <Select value={form.watch('license_type')} onValueChange={(value) => { form.setValue('license_type', value as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true }); }} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mainland">Mainland</SelectItem>
                                <SelectItem value="Freezone">Freezone</SelectItem>
                                <SelectItem value="Offshore">Offshore</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-prog-turnover">Annual Turnover *</Label>
                            <Input id="new-prog-turnover" type="number" {...form.register('annual_turnover', { valueAsNumber: true })} disabled={isSubmitting} required />
                            {form.formState.errors.annual_turnover && <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Save Button - Show when all sections are visible */}
                  {isBasicInfoComplete && isSourceChannelComplete && isServiceSelectionComplete && (
                    <div className="flex justify-end pt-4 animate-fade-in">
                      <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : formMode === 'single' ? (
                /* Single Page Mode - All sections visible at once */
                <div className="space-y-4">
                  {/* Basic Information */}
                  <Card className="border rounded-lg bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-single-name">Full Name *</Label>
                          <Input id="new-single-name" {...form.register('name')} disabled={isSubmitting} required />
                          {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-single-email">Email *</Label>
                          <Input id="new-single-email" type="email" {...form.register('email')} disabled={isSubmitting} required />
                          {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-single-mobile">Mobile *</Label>
                          <Input id="new-single-mobile" {...form.register('mobile')} disabled={isSubmitting} required />
                          {form.formState.errors.mobile && <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-single-company">Company *</Label>
                          <Input id="new-single-company" {...form.register('company')} disabled={isSubmitting} required />
                          {form.formState.errors.company && <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Source & Channel */}
                  <Card className="border rounded-lg bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Source & Channel Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="new-single-lead-source">Lead Source *</Label>
                        <Select value={form.watch('lead_source')} onValueChange={(value) => form.setValue('lead_source', value as any, { shouldDirty: true })} disabled={isSubmitting}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Selection */}
                  <Card className="border rounded-lg bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Service Selection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="new-single-product">Product/Service *</Label>
                        <Select value={form.watch('product_id')} onValueChange={(value) => form.setValue('product_id', value, { shouldDirty: true })} disabled={isSubmitting || productsLoading}>
                          <SelectTrigger><SelectValue placeholder="Select a product or service" /></SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.product_id && <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deal Information */}
                  <Card className="border rounded-lg bg-background shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Deal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-single-amount">Amount *</Label>
                          <Input id="new-single-amount" type="number" {...form.register('amount', { valueAsNumber: true })} disabled={isSubmitting} required />
                          {form.formState.errors.amount && <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-single-license">License Type *</Label>
                          <Select value={form.watch('license_type')} onValueChange={(value) => form.setValue('license_type', value as any, { shouldDirty: true })} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mainland">Mainland</SelectItem>
                              <SelectItem value="Freezone">Freezone</SelectItem>
                              <SelectItem value="Offshore">Offshore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-single-turnover">Annual Turnover *</Label>
                          <Input id="new-single-turnover" type="number" {...form.register('annual_turnover', { valueAsNumber: true })} disabled={isSubmitting} required />
                          {form.formState.errors.annual_turnover && <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* For other modes (wizard, tabs), use fallback message */
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">The {formMode} mode is coming soon for new customers.</p>
                  <p className="text-sm text-muted-foreground">Please use "Concept", "Progressive", or "Single Page" mode for now.</p>
                </div>
              )}

              {/* Additional Notes */}
              <div className="mt-4 mb-3">
                <h3 className="text-base font-medium mb-3">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="customer_notes">Notes</Label>
                  <Textarea
                    id="customer_notes"
                    {...form.register('customer_notes')}
                    disabled={isSubmitting}
                    rows={3}
                    placeholder="Any additional notes or requirements..."
                  />
                </div>
              </div>
            </form>
            </Form>
          </div>
        )}

        {currentStage === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Review Draft</h3>
                <p className="text-sm text-muted-foreground">
                  Please review all details before saving
                </p>
              </div>
              <Badge variant="outline">Draft Preview</Badge>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{form.getValues('name')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{form.getValues('email')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="font-medium">{form.getValues('mobile')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{form.getValues('company')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Selection</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product/Service</p>
                      <p className="font-medium">
                        {products.find(p => p.id === form.getValues('product_id'))?.name || 'Not selected'}
                      </p>
                    </div>
                    {form.getValues('license_type') && (
                      <div>
                        <p className="text-sm text-muted-foreground">License Type</p>
                        <p className="font-medium">{form.getValues('license_type')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Turnover</p>
                      <p className="font-medium">AED {form.getValues('annual_turnover')?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Preference</p>
                      <p className="font-medium">
                        {form.getValues('bank_preference_1') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bookkeeping Details - if any bookkeeping fields are filled */}
              {hasBookkeeping && (form.getValues('company_incorporation_date') || form.getValues('number_of_entries_per_month') || 
               form.getValues('vat_corporate_tax_status') || form.getValues('wps_transfer_required') ||
               form.getValues('accounting_software') || form.getValues('monthly_transactions')) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bookkeeping Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      {form.getValues('company_incorporation_date') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Company Incorporation Date</p>
                          <p className="font-medium">{form.getValues('company_incorporation_date')}</p>
                        </div>
                      )}
                      {form.getValues('number_of_entries_per_month') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Number of Entries per Month</p>
                          <p className="font-medium">{form.getValues('number_of_entries_per_month')}</p>
                        </div>
                      )}
                      {form.getValues('vat_corporate_tax_status') && (
                        <div>
                          <p className="text-sm text-muted-foreground">VAT & Corporate Tax Status</p>
                          <p className="font-medium">
                            {form.getValues('vat_corporate_tax_status')?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      )}
                      {form.getValues('wps_transfer_required') !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">WPS Transfer Required</p>
                          <p className="font-medium">{form.getValues('wps_transfer_required') ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {form.getValues('accounting_software') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Accounting Software</p>
                          <p className="font-medium">{form.getValues('accounting_software')}</p>
                        </div>
                      )}
                      {form.getValues('monthly_transactions') && (
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Transaction Volume</p>
                          <p className="font-medium">{form.getValues('monthly_transactions')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Notes */}
              {form.getValues('customer_notes') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{form.getValues('customer_notes')}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStage('details')}
                disabled={isSubmitting}
              >
                Back to Edit
              </Button>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? 'Saving Draft...' : 'Confirm & Save Draft'}
              </Button>
            </div>
          </div>
        )}

        {currentStage === 'documents' && createdCustomerId && (
          <div className="space-y-6">
            {documents.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Document Upload</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload required documents for the customer application
                    </p>
                  </div>
                  <Badge variant={allMandatoryUploaded ? "default" : "secondary"}>
                    {documents.filter(doc => doc.is_uploaded).length}/{documents.length} Uploaded
                  </Badge>
                </div>

                <DocumentUpload
                  documents={documents}
                  customerId={createdCustomerId}
                  onUpload={handleDocumentUpload}
                />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStage('details')}
                    disabled={isSubmitting}
                  >
                    Back to Details
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {allMandatoryUploaded ? 'Complete Application' : 'Save & Continue Later'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please create the customer first to upload documents.</p>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStage('details')}
                  className="mt-4"
                >
                  Go to Customer Details
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Floating Action Buttons - Only show on details stage before submission */}
    {currentStage === 'details' && !createdCustomerId && (
      <div 
        className="fixed bottom-6 flex gap-2 z-50 transition-all duration-300 hidden lg:flex"
        style={{
          right: sidebarCollapsed ? '5rem' : '22rem'
        }}
      >
        <button
          type="button"
          onClick={handlePreviewDraft}
          disabled={isSubmitting}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg border border-blue-600/20 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          title="Preview Draft"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="absolute -top-9 right-0 bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
            Preview Draft
          </span>
        </button>
        <button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
          className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg border border-green-600/20 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          title="Save as Draft"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className="absolute -top-9 right-0 bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
                Save Draft
              </span>
            </>
          )}
        </button>
      </div>
    )}
    
    {/* Confirmation Dialog for switching tabs with unsaved data */}
    <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved data in the current form. Switching tabs will clear this information. 
            Do you want to continue without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelModeSwitch}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmModeSwitch}>
            Continue Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default ComprehensiveCustomerForm;