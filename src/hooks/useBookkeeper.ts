import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useBookkeeper() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBills = async () => {
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
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-reconcile', {
        body: { type, autoMatch: true }
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Reconciliation Complete', 
        description: `Matched: ${data.data.matched}, Partial: ${data.data.partial}, Unmatched: ${data.data.unmatched}` 
      });
      
      await fetchReconciliations();
      await fetchBills();
      await fetchInvoices();
      
      return data.data;
    } catch (error: any) {
      console.error('Error running reconciliation:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const getAnalytics = async (forecastDays = 30, accountingMethod: 'cash' | 'accrual' = 'accrual') => {
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-analytics', {
        body: { forecastDays, accountingMethod }
      });
      
      if (error) throw error;
      return data.data;
    } catch (error: any) {
      console.error('Error getting analytics:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const processOCR = async (
    fileBase64: string, 
    fileName: string, 
    ocrProvider: 'tesseract' | 'google_vision' | 'aws_textract'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('bookkeeper-ocr', {
        body: { fileBase64, fileName, ocrProvider }
      });
      
      if (error) throw error;
      
      if (data.apiKeyMissing) {
        toast({ 
          title: 'API Key Missing', 
          description: data.message,
          variant: 'destructive'
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('Error processing OCR:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchBills();
    fetchInvoices();
    fetchPayments();
    fetchVendors();
    fetchReconciliations();
  }, []);

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
