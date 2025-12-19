import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Camera, Settings } from 'lucide-react';
import { useBookkeeper } from '@/hooks/useBookkeeper';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedData {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  rawText: string;
  confidence: number;
}

export function BillUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [ocrProvider, setOcrProvider] = useState<'tesseract' | 'google_vision' | 'aws_textract'>('tesseract');
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [accountingMethod, setAccountingMethod] = useState<'cash' | 'accrual'>('accrual');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createBill, processOCR, vendors, createVendor } = useBookkeeper();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setApiKeyMissing(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!file) return;
    
    setProcessing(true);
    setApiKeyMissing(false);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const result = await processOCR(base64, file.name, ocrProvider);
        
        if (result) {
          setExtractedData(result.data);
          setApiKeyMissing(result.apiKeyMissing || false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveBill = async () => {
    if (!extractedData) return;
    
    // Upload file to storage
    let filePath = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bookkeeper-files')
        .upload(`bills/${fileName}`, file);
      
      if (!uploadError) {
        filePath = uploadData.path;
      }
    }
    
    const bill = await createBill({
      reference_number: extractedData.invoiceNumber || `BILL-${Date.now()}`,
      vendor_name: extractedData.vendorName,
      bill_date: extractedData.invoiceDate || new Date().toISOString().split('T')[0],
      due_date: extractedData.dueDate,
      amount: extractedData.subtotal || extractedData.totalAmount || 0,
      tax_amount: extractedData.taxAmount || 0,
      total_amount: extractedData.totalAmount || 0,
      currency: extractedData.currency,
      status: 'pending',
      accounting_method: accountingMethod,
      ocr_source: ocrProvider,
      ocr_raw_data: extractedData,
      ocr_confidence: extractedData.confidence,
      line_items: extractedData.lineItems,
      file_path: filePath,
      file_name: file?.name
    });
    
    if (bill) {
      setFile(null);
      setExtractedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Bill / Invoice
          </CardTitle>
          <CardDescription>
            Upload invoices, receipts, or bills for OCR processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OCR Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>OCR Provider</Label>
              <Select value={ocrProvider} onValueChange={(v) => setOcrProvider(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tesseract">
                    <div className="flex items-center gap-2">
                      <span>Tesseract.js</span>
                      <Badge variant="secondary" className="text-xs">Local - Free</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="google_vision">
                    <div className="flex items-center gap-2">
                      <span>Google Vision</span>
                      <Badge variant="outline" className="text-xs">Cloud API</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="aws_textract">
                    <div className="flex items-center gap-2">
                      <span>AWS Textract</span>
                      <Badge variant="outline" className="text-xs">Cloud API</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Accounting Method</Label>
              <Select value={accountingMethod} onValueChange={(v) => setAccountingMethod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accrual">Accrual Basis</SelectItem>
                  <SelectItem value="cash">Cash Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* API Key Warning */}
          {(ocrProvider === 'google_vision' || ocrProvider === 'aws_textract') && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                {ocrProvider === 'google_vision' 
                  ? 'Set GOOGLE_VISION_API_KEY in Supabase Edge Function secrets to use Google Vision OCR.'
                  : 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Supabase Edge Function secrets to use AWS Textract.'}
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="bill-upload"
            />
            <label htmlFor="bill-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, PDF
                </span>
              </div>
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <Button onClick={handleProcessOCR} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Extract Data'
                )}
              </Button>
            </div>
          )}

          {/* API Key Missing Warning */}
          {apiKeyMissing && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Not Configured</AlertTitle>
              <AlertDescription>
                The selected OCR provider requires an API key. Using demo data instead.
                Please configure the required secrets in Supabase Edge Functions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data Preview */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Extracted Data
              {extractedData.confidence > 0 && (
                <Badge variant={extractedData.confidence > 0.8 ? 'default' : 'secondary'}>
                  {(extractedData.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="line-items">Line Items</TabsTrigger>
                <TabsTrigger value="raw">Raw Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input 
                      value={extractedData.vendorName || ''} 
                      onChange={(e) => setExtractedData({...extractedData, vendorName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input 
                      value={extractedData.invoiceNumber || ''} 
                      onChange={(e) => setExtractedData({...extractedData, invoiceNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <Input 
                      type="date"
                      value={extractedData.invoiceDate || ''} 
                      onChange={(e) => setExtractedData({...extractedData, invoiceDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date"
                      value={extractedData.dueDate || ''} 
                      onChange={(e) => setExtractedData({...extractedData, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <Input 
                      type="number"
                      value={extractedData.subtotal || ''} 
                      onChange={(e) => setExtractedData({...extractedData, subtotal: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Amount</Label>
                    <Input 
                      type="number"
                      value={extractedData.taxAmount || ''} 
                      onChange={(e) => setExtractedData({...extractedData, taxAmount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <Input 
                      type="number"
                      value={extractedData.totalAmount || ''} 
                      onChange={(e) => setExtractedData({...extractedData, totalAmount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={extractedData.currency} 
                      onValueChange={(v) => setExtractedData({...extractedData, currency: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="line-items">
                {extractedData.lineItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Description</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Unit Price</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.lineItems.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="text-right p-2">{item.quantity}</td>
                            <td className="text-right p-2">{item.unitPrice.toFixed(2)}</td>
                            <td className="text-right p-2">{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No line items extracted
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="raw">
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                  {extractedData.rawText}
                </pre>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setExtractedData(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBill}>
                Save Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
