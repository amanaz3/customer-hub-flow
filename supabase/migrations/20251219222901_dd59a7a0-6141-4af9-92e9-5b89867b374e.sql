-- Create enum types for bookkeeper
CREATE TYPE bookkeeper_account_type AS ENUM ('payable', 'receivable');
CREATE TYPE bookkeeper_transaction_type AS ENUM ('bill', 'payment', 'invoice', 'receipt');
CREATE TYPE bookkeeper_accounting_method AS ENUM ('cash', 'accrual');
CREATE TYPE bookkeeper_reconciliation_status AS ENUM ('matched', 'partial', 'unmatched', 'disputed');

-- Vendors table
CREATE TABLE bookkeeper_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bills table (invoices from vendors - Accounts Payable)
CREATE TABLE bookkeeper_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL,
  vendor_id UUID REFERENCES bookkeeper_vendors(id),
  vendor_name TEXT,
  bill_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT DEFAULT 'pending',
  accounting_method bookkeeper_accounting_method DEFAULT 'accrual',
  ocr_source TEXT,
  ocr_raw_data JSONB,
  ocr_confidence DECIMAL(5,2),
  line_items JSONB,
  file_path TEXT,
  file_name TEXT,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices table (invoices to customers - Accounts Receivable)
CREATE TABLE bookkeeper_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT DEFAULT 'pending',
  accounting_method bookkeeper_accounting_method DEFAULT 'accrual',
  line_items JSONB,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments table (payments made or received)
CREATE TABLE bookkeeper_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  payment_method TEXT,
  bank_reference TEXT,
  bill_id UUID REFERENCES bookkeeper_bills(id),
  invoice_id UUID REFERENCES bookkeeper_invoices(id),
  vendor_id UUID REFERENCES bookkeeper_vendors(id),
  customer_id UUID REFERENCES customers(id),
  notes TEXT,
  file_path TEXT,
  file_name TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table (general ledger entries)
CREATE TABLE bookkeeper_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type bookkeeper_transaction_type NOT NULL,
  account_type bookkeeper_account_type NOT NULL,
  transaction_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  bill_id UUID REFERENCES bookkeeper_bills(id),
  invoice_id UUID REFERENCES bookkeeper_invoices(id),
  payment_id UUID REFERENCES bookkeeper_payments(id),
  accounting_method bookkeeper_accounting_method DEFAULT 'accrual',
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reconciliation table
CREATE TABLE bookkeeper_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bookkeeper_bills(id),
  invoice_id UUID REFERENCES bookkeeper_invoices(id),
  payment_id UUID REFERENCES bookkeeper_payments(id),
  status bookkeeper_reconciliation_status DEFAULT 'unmatched',
  matched_amount DECIMAL(12,2),
  discrepancy_amount DECIMAL(12,2),
  discrepancy_reason TEXT,
  notes TEXT,
  reconciled_by UUID REFERENCES profiles(id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OCR Processing queue
CREATE TABLE bookkeeper_ocr_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  ocr_provider TEXT DEFAULT 'tesseract',
  status TEXT DEFAULT 'pending',
  extracted_data JSONB,
  confidence_score DECIMAL(5,2),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  bill_id UUID REFERENCES bookkeeper_bills(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cash flow forecasts
CREATE TABLE bookkeeper_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL,
  expected_inflow DECIMAL(12,2) DEFAULT 0,
  expected_outflow DECIMAL(12,2) DEFAULT 0,
  net_cash_flow DECIMAL(12,2) DEFAULT 0,
  overdue_receivables DECIMAL(12,2) DEFAULT 0,
  overdue_payables DECIMAL(12,2) DEFAULT 0,
  forecast_data JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE bookkeeper_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_ocr_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeper_forecasts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view vendors" ON bookkeeper_vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vendors" ON bookkeeper_vendors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vendors" ON bookkeeper_vendors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vendors" ON bookkeeper_vendors FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view bills" ON bookkeeper_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bills" ON bookkeeper_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bills" ON bookkeeper_bills FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bills" ON bookkeeper_bills FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view invoices" ON bookkeeper_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON bookkeeper_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON bookkeeper_invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON bookkeeper_invoices FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view payments" ON bookkeeper_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON bookkeeper_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON bookkeeper_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payments" ON bookkeeper_payments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view transactions" ON bookkeeper_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON bookkeeper_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transactions" ON bookkeeper_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete transactions" ON bookkeeper_transactions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view reconciliations" ON bookkeeper_reconciliations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reconciliations" ON bookkeeper_reconciliations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reconciliations" ON bookkeeper_reconciliations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reconciliations" ON bookkeeper_reconciliations FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view ocr_queue" ON bookkeeper_ocr_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ocr_queue" ON bookkeeper_ocr_queue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ocr_queue" ON bookkeeper_ocr_queue FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete ocr_queue" ON bookkeeper_ocr_queue FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view forecasts" ON bookkeeper_forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert forecasts" ON bookkeeper_forecasts FOR INSERT TO authenticated WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_bookkeeper_bills_vendor ON bookkeeper_bills(vendor_id);
CREATE INDEX idx_bookkeeper_bills_status ON bookkeeper_bills(status);
CREATE INDEX idx_bookkeeper_bills_due_date ON bookkeeper_bills(due_date);
CREATE INDEX idx_bookkeeper_invoices_customer ON bookkeeper_invoices(customer_id);
CREATE INDEX idx_bookkeeper_invoices_status ON bookkeeper_invoices(status);
CREATE INDEX idx_bookkeeper_invoices_due_date ON bookkeeper_invoices(due_date);
CREATE INDEX idx_bookkeeper_payments_bill ON bookkeeper_payments(bill_id);
CREATE INDEX idx_bookkeeper_payments_invoice ON bookkeeper_payments(invoice_id);
CREATE INDEX idx_bookkeeper_transactions_date ON bookkeeper_transactions(transaction_date);
CREATE INDEX idx_bookkeeper_reconciliations_status ON bookkeeper_reconciliations(status);
CREATE INDEX idx_bookkeeper_ocr_queue_status ON bookkeeper_ocr_queue(status);

-- Create storage bucket for bill files
INSERT INTO storage.buckets (id, name, public) VALUES ('bookkeeper-files', 'bookkeeper-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload bookkeeper files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bookkeeper-files');
CREATE POLICY "Authenticated users can view bookkeeper files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'bookkeeper-files');
CREATE POLICY "Authenticated users can update bookkeeper files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bookkeeper-files');
CREATE POLICY "Authenticated users can delete bookkeeper files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bookkeeper-files');