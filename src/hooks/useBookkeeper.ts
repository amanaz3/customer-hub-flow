import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for bookkeeper data
export interface Bill {
  id: string;
  reference_number: string;
  vendor_id: string | null;
  vendor_name: string | null;
  bill_date: string;
  due_date: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  accounting_method: 'cash' | 'accrual';
  ocr_source: string | null;
  ocr_raw_data: any;
  ocr_confidence: number | null;
  line_items: any;
  file_path: string | null;
  file_name: string | null;
  notes: string | null;
  is_paid: boolean;
  paid_amount: number;
  paid_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  reference_number: string;
  customer_id: string | null;
  customer_name: string | null;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  accounting_method: 'cash' | 'accrual';
  line_items: any;
  notes: string | null;
  is_paid: boolean;
  paid_amount: number;
  paid_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  reference_number: string;
  payment_type: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  bank_reference: string | null;
  bill_id: string | null;
  invoice_id: string | null;
  vendor_id: string | null;
  customer_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Reconciliation {
  id: string;
  bill_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  status: 'matched' | 'partial' | 'unmatched' | 'disputed';
  matched_amount: number | null;
  discrepancy_amount: number | null;
  discrepancy_reason: string | null;
  notes: string | null;
  reconciled_at: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: number;
  notes: string | null;
  created_at: string;
}

// Import demo data lazily to avoid circular dependency
let demoDataCache: any = null;
const getDemoData = async () => {
  if (!demoDataCache) {
    const module = await import('@/data/bookkeeperDemoData');
    demoDataCache = module;
  }
  return demoDataCache;
};

export function useBookkeeper(demoMode: boolean = false) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load demo data when demo mode is enabled
  useEffect(() => {
    if (demoMode) {
      getDemoData().then((data) => {
        setBills(data.demoBills);
        setInvoices(data.demoInvoices);
        setPayments(data.demoPayments);
        setReconciliations(data.demoReconciliations);
        setVendors(data.demoVendors);
      });
    }
  }, [demoMode]);

  const fetchBills = async () => {
    if (demoMode) return; // Skip fetching in demo mode
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookkeeper_bills')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBills(data || []);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (demoMode) return; // Skip fetching in demo mode
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookkeeper_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (demoMode) return; // Skip fetching in demo mode
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookkeeper_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliations = async () => {
    if (demoMode) return; // Skip fetching in demo mode
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookkeeper_reconciliations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReconciliations(data || []);
    } catch (error: any) {
      console.error('Error fetching reconciliations:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    if (demoMode) return; // Skip fetching in demo mode
    try {
      const { data, error } = await supabase
        .from('bookkeeper_vendors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
    }
  };

  const createBill = async (billData: Partial<Bill>) => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Cannot create bills in demo mode' });
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('bookkeeper_bills')
        .insert(billData as any)
        .select()
        .single();
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Bill created successfully' });
      await fetchBills();
      return data;
    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const createPayment = async (paymentData: Partial<Payment>) => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Cannot create payments in demo mode' });
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('bookkeeper_payments')
        .insert(paymentData as any)
        .select()
        .single();
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      await fetchPayments();
      return data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const createVendor = async (vendorData: Partial<Vendor>) => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Cannot create vendors in demo mode' });
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('bookkeeper_vendors')
        .insert(vendorData as any)
        .select()
        .single();
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Vendor created successfully' });
      await fetchVendors();
      return data;
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const runReconciliation = async (type: 'payable' | 'receivable' | 'all' = 'all') => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Showing demo reconciliation results' });
      return {
        matched: 2,
        partial: 1,
        unmatched: 0,
        totalDiscrepancy: 27250,
        results: []
      };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-reconcile', {
        body: { type }
      });
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Reconciliation completed' });
      await fetchReconciliations();
      return data;
    } catch (error: any) {
      console.error('Error running reconciliation:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAnalytics = async (forecastDays: number = 30, accountingMethod: 'cash' | 'accrual' = 'accrual') => {
    if (demoMode) {
      const demoData = await getDemoData();
      return demoData.demoAnalyticsData;
    }
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-analytics', {
        body: { forecastDays, accountingMethod }
      });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const processOCR = async (
    fileBase64: string, 
    fileName: string,
    ocrProvider: 'tesseract' | 'google_vision' | 'aws_textract' = 'tesseract'
  ) => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'OCR processing not available in demo mode' });
      return {
        vendorName: 'Demo Vendor',
        invoiceNumber: 'DEMO-001',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        currency: 'AED',
        lineItems: [{ description: 'Demo Item', quantity: 1, unitPrice: 1000, amount: 1000 }],
        rawText: 'Demo OCR text',
        confidence: 0.95
      };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-ocr', {
        body: { 
          fileBase64, 
          fileName,
          ocrProvider
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error processing OCR:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data (only if not in demo mode)
  useEffect(() => {
    if (!demoMode) {
      fetchBills();
      fetchInvoices();
      fetchPayments();
      fetchReconciliations();
      fetchVendors();
    }
  }, [demoMode]);

  return {
    bills,
    invoices,
    payments,
    reconciliations,
    vendors,
    loading,
    fetchBills,
    fetchInvoices,
    fetchPayments,
    fetchReconciliations,
    fetchVendors,
    createBill,
    createPayment,
    createVendor,
    runReconciliation,
    getAnalytics,
    processOCR
  };
}
