import { Bill, Invoice, Payment, Reconciliation, Vendor } from '@/hooks/useBookkeeper';

// Demo vendors
export const demoVendors: Vendor[] = [
  {
    id: 'demo-vendor-1',
    name: 'Office Supplies Co.',
    email: 'billing@officesupplies.com',
    phone: '+971 4 123 4567',
    address: 'Dubai Business Bay, UAE',
    tax_id: 'TRN123456789',
    payment_terms: 30,
    notes: 'Regular monthly office supplies',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-vendor-2',
    name: 'Cloud Services Inc.',
    email: 'invoices@cloudservices.io',
    phone: '+1 555 987 6543',
    address: 'San Francisco, CA, USA',
    tax_id: 'US-TAX-456789',
    payment_terms: 15,
    notes: 'AWS and hosting services',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-vendor-3',
    name: 'Marketing Agency LLC',
    email: 'accounts@marketingagency.com',
    phone: '+971 4 555 8888',
    address: 'Dubai Media City, UAE',
    tax_id: 'TRN987654321',
    payment_terms: 45,
    notes: 'Digital marketing services',
    created_at: new Date().toISOString()
  }
];

// Demo bills (payables)
export const demoBills: Bill[] = [
  {
    id: 'demo-bill-1',
    reference_number: 'BILL-2024-001',
    vendor_id: 'demo-vendor-1',
    vendor_name: 'Office Supplies Co.',
    amount: 2500,
    tax_amount: 125,
    total_amount: 2625,
    currency: 'AED',
    bill_date: '2024-12-01',
    due_date: '2024-12-31',
    status: 'pending',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Printer Paper A4 (50 boxes)', quantity: 50, unitPrice: 35, amount: 1750 },
      { description: 'Ink Cartridges (10 units)', quantity: 10, unitPrice: 75, amount: 750 }
    ],
    notes: 'Monthly office supplies order',
    file_path: null,
    file_name: 'office-supplies-dec.pdf',
    ocr_source: 'google_vision',
    ocr_confidence: 0.94,
    ocr_raw_data: null,
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-bill-2',
    reference_number: 'BILL-2024-002',
    vendor_id: 'demo-vendor-2',
    vendor_name: 'Cloud Services Inc.',
    amount: 8500,
    tax_amount: 0,
    total_amount: 8500,
    currency: 'USD',
    bill_date: '2024-12-05',
    due_date: '2024-12-20',
    status: 'pending',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'AWS EC2 Instances', quantity: 1, unitPrice: 5200, amount: 5200 },
      { description: 'AWS S3 Storage', quantity: 1, unitPrice: 1800, amount: 1800 },
      { description: 'AWS Data Transfer', quantity: 1, unitPrice: 1500, amount: 1500 }
    ],
    notes: 'December cloud infrastructure',
    file_path: null,
    file_name: 'aws-invoice-dec.pdf',
    ocr_source: 'tesseract',
    ocr_confidence: 0.89,
    ocr_raw_data: null,
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-bill-3',
    reference_number: 'BILL-2024-003',
    vendor_id: 'demo-vendor-3',
    vendor_name: 'Marketing Agency LLC',
    amount: 15000,
    tax_amount: 750,
    total_amount: 15750,
    currency: 'AED',
    bill_date: '2024-11-15',
    due_date: '2024-12-15',
    status: 'overdue',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Social Media Campaign', quantity: 1, unitPrice: 8000, amount: 8000 },
      { description: 'Google Ads Management', quantity: 1, unitPrice: 5000, amount: 5000 },
      { description: 'Content Creation', quantity: 1, unitPrice: 2000, amount: 2000 }
    ],
    notes: 'Q4 Marketing Campaign',
    file_path: null,
    file_name: 'marketing-q4.pdf',
    ocr_source: 'google_vision',
    ocr_confidence: 0.96,
    ocr_raw_data: null,
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-bill-4',
    reference_number: 'BILL-2024-004',
    vendor_id: 'demo-vendor-1',
    vendor_name: 'Office Supplies Co.',
    amount: 1200,
    tax_amount: 60,
    total_amount: 1260,
    currency: 'AED',
    bill_date: '2024-11-01',
    due_date: '2024-11-30',
    status: 'paid',
    is_paid: true,
    paid_amount: 1260,
    paid_at: '2024-11-25',
    line_items: [
      { description: 'Office Chairs (2 units)', quantity: 2, unitPrice: 600, amount: 1200 }
    ],
    notes: 'Furniture order',
    file_path: null,
    file_name: 'furniture-nov.pdf',
    ocr_source: 'tesseract',
    ocr_confidence: 0.91,
    ocr_raw_data: null,
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  }
];

// Demo invoices (receivables)
export const demoInvoices: Invoice[] = [
  {
    id: 'demo-invoice-1',
    reference_number: 'INV-2024-001',
    customer_id: null,
    customer_name: 'ABC Trading LLC',
    amount: 45000,
    tax_amount: 2250,
    total_amount: 47250,
    currency: 'AED',
    invoice_date: '2024-12-01',
    due_date: '2024-12-31',
    status: 'pending',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Company Formation - Mainland', quantity: 1, unitPrice: 25000, amount: 25000 },
      { description: 'PRO Services Annual Package', quantity: 1, unitPrice: 15000, amount: 15000 },
      { description: 'Visa Processing (3 persons)', quantity: 3, unitPrice: 1667, amount: 5000 }
    ],
    notes: 'New company setup package',
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-invoice-2',
    reference_number: 'INV-2024-002',
    customer_id: null,
    customer_name: 'XYZ Tech Solutions',
    amount: 12000,
    tax_amount: 600,
    total_amount: 12600,
    currency: 'AED',
    invoice_date: '2024-12-10',
    due_date: '2025-01-10',
    status: 'pending',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Annual Bookkeeping Service', quantity: 1, unitPrice: 8000, amount: 8000 },
      { description: 'VAT Filing (4 quarters)', quantity: 4, unitPrice: 1000, amount: 4000 }
    ],
    notes: 'Annual accounting package',
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-invoice-3',
    reference_number: 'INV-2024-003',
    customer_id: null,
    customer_name: 'Global Imports FZE',
    amount: 8500,
    tax_amount: 425,
    total_amount: 8925,
    currency: 'AED',
    invoice_date: '2024-11-20',
    due_date: '2024-12-10',
    status: 'overdue',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Trade License Renewal', quantity: 1, unitPrice: 6000, amount: 6000 },
      { description: 'Immigration Card Renewal', quantity: 1, unitPrice: 2500, amount: 2500 }
    ],
    notes: 'License renewal services - OVERDUE',
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-invoice-4',
    reference_number: 'INV-2024-004',
    customer_id: null,
    customer_name: 'StartUp Hub Inc.',
    amount: 35000,
    tax_amount: 1750,
    total_amount: 36750,
    currency: 'AED',
    invoice_date: '2024-11-01',
    due_date: '2024-11-30',
    status: 'paid',
    is_paid: true,
    paid_amount: 36750,
    paid_at: '2024-11-28',
    line_items: [
      { description: 'Freezone Company Setup', quantity: 1, unitPrice: 20000, amount: 20000 },
      { description: 'Office Space (1 year)', quantity: 1, unitPrice: 12000, amount: 12000 },
      { description: 'Bank Account Opening Assistance', quantity: 1, unitPrice: 3000, amount: 3000 }
    ],
    notes: 'Freezone package - PAID',
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-invoice-5',
    reference_number: 'INV-2024-005',
    customer_id: null,
    customer_name: 'Retail Masters LLC',
    amount: 5500,
    tax_amount: 275,
    total_amount: 5775,
    currency: 'AED',
    invoice_date: '2024-12-15',
    due_date: '2025-01-15',
    status: 'pending',
    is_paid: false,
    paid_amount: 0,
    paid_at: null,
    line_items: [
      { description: 'Corporate Tax Registration', quantity: 1, unitPrice: 2500, amount: 2500 },
      { description: 'Tax Consultation (3 hours)', quantity: 3, unitPrice: 1000, amount: 3000 }
    ],
    notes: 'Tax services',
    accounting_method: 'accrual',
    created_at: new Date().toISOString()
  }
];

// Demo payments
export const demoPayments: Payment[] = [
  {
    id: 'demo-payment-1',
    reference_number: 'PAY-2024-001',
    payment_type: 'outgoing',
    amount: 1260,
    currency: 'AED',
    payment_date: '2024-11-25',
    payment_method: 'bank_transfer',
    bank_reference: 'TRF-789456123',
    bill_id: 'demo-bill-4',
    invoice_id: null,
    vendor_id: 'demo-vendor-1',
    customer_id: null,
    notes: 'Payment for furniture order',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-payment-2',
    reference_number: 'PAY-2024-002',
    payment_type: 'incoming',
    amount: 36750,
    currency: 'AED',
    payment_date: '2024-11-28',
    payment_method: 'bank_transfer',
    bank_reference: 'TRF-456789123',
    bill_id: null,
    invoice_id: 'demo-invoice-4',
    vendor_id: null,
    customer_id: null,
    notes: 'Payment from StartUp Hub Inc.',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-payment-3',
    reference_number: 'PAY-2024-003',
    payment_type: 'incoming',
    amount: 20000,
    currency: 'AED',
    payment_date: '2024-12-05',
    payment_method: 'cheque',
    bank_reference: 'CHQ-112233',
    bill_id: null,
    invoice_id: 'demo-invoice-1',
    vendor_id: null,
    customer_id: null,
    notes: 'Partial payment from ABC Trading LLC',
    created_at: new Date().toISOString()
  }
];

// Demo reconciliations
export const demoReconciliations: Reconciliation[] = [
  {
    id: 'demo-recon-1',
    bill_id: 'demo-bill-4',
    invoice_id: null,
    payment_id: 'demo-payment-1',
    status: 'matched',
    matched_amount: 1260,
    discrepancy_amount: 0,
    discrepancy_reason: null,
    reconciled_at: '2024-11-26',
    notes: 'Auto-matched by system',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-recon-2',
    bill_id: null,
    invoice_id: 'demo-invoice-4',
    payment_id: 'demo-payment-2',
    status: 'matched',
    matched_amount: 36750,
    discrepancy_amount: 0,
    discrepancy_reason: null,
    reconciled_at: '2024-11-29',
    notes: 'Full payment received',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-recon-3',
    bill_id: null,
    invoice_id: 'demo-invoice-1',
    payment_id: 'demo-payment-3',
    status: 'partial',
    matched_amount: 20000,
    discrepancy_amount: 27250,
    discrepancy_reason: 'Partial payment - AED 27,250 remaining',
    reconciled_at: '2024-12-06',
    notes: 'Customer will pay remaining in 2 installments',
    created_at: new Date().toISOString()
  }
];

// Demo analytics data
export const demoAnalyticsData = {
  summary: {
    totalExpectedInflow: 74550,
    totalExpectedOutflow: 26875,
    netCashFlow: 47675,
    overdueReceivables: 8925,
    overduePayables: 15750,
    accountingMethod: 'accrual'
  },
  weeklyForecasts: [
    { weekStart: '2024-12-16', weekEnd: '2024-12-22', expectedInflow: 27250, expectedOutflow: 8500, netCashFlow: 18750 },
    { weekStart: '2024-12-23', weekEnd: '2024-12-29', expectedInflow: 12600, expectedOutflow: 2625, netCashFlow: 9975 },
    { weekStart: '2024-12-30', weekEnd: '2025-01-05', expectedInflow: 5775, expectedOutflow: 0, netCashFlow: 5775 },
    { weekStart: '2025-01-06', weekEnd: '2025-01-12', expectedInflow: 12600, expectedOutflow: 0, netCashFlow: 12600 }
  ],
  agingBuckets: {
    current: { payables: 11125, receivables: 60525 },
    '1-30': { payables: 15750, receivables: 8925 },
    '31-60': { payables: 0, receivables: 0 },
    '61-90': { payables: 0, receivables: 0 },
    '90+': { payables: 0, receivables: 0 }
  },
  billsCount: 4,
  invoicesCount: 5
};
