import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRRequest {
  fileBase64: string;
  fileName: string;
  ocrProvider: 'tesseract' | 'google_vision' | 'aws_textract';
  fileType?: string;
}

interface ExtractedBillData {
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

// Helper function to parse extracted text into structured data
function parseExtractedText(text: string): ExtractedBillData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Extract vendor name (usually first few lines)
  let vendorName: string | null = null;
  if (lines.length > 0) {
    vendorName = lines[0];
  }
  
  // Extract invoice number
  let invoiceNumber: string | null = null;
  const invoiceMatch = text.match(/(?:invoice|inv|bill)[\s#:]*([A-Z0-9-]+)/i);
  if (invoiceMatch) {
    invoiceNumber = invoiceMatch[1];
  }
  
  // Extract dates
  let invoiceDate: string | null = null;
  let dueDate: string | null = null;
  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/g;
  const dates = text.match(dateRegex);
  if (dates && dates.length > 0) {
    invoiceDate = dates[0];
    if (dates.length > 1) {
      dueDate = dates[1];
    }
  }
  
  // Extract amounts
  let subtotal: number | null = null;
  let taxAmount: number | null = null;
  let totalAmount: number | null = null;
  
  const amountRegex = /(?:total|amount|sum|subtotal|tax|vat)[\s:]*(?:aed|usd|eur|gbp|\$|€|£)?[\s]*([0-9,]+\.?\d*)/gi;
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const context = match[0].toLowerCase();
    
    if (context.includes('tax') || context.includes('vat')) {
      taxAmount = amount;
    } else if (context.includes('subtotal')) {
      subtotal = amount;
    } else if (context.includes('total')) {
      totalAmount = amount;
    }
  }
  
  // If we have subtotal and tax but no total, calculate it
  if (subtotal && taxAmount && !totalAmount) {
    totalAmount = subtotal + taxAmount;
  }
  
  // Extract currency
  let currency = 'AED';
  if (text.match(/usd|\$/i)) currency = 'USD';
  else if (text.match(/eur|€/i)) currency = 'EUR';
  else if (text.match(/gbp|£/i)) currency = 'GBP';
  
  // Extract line items (simplified)
  const lineItems: ExtractedBillData['lineItems'] = [];
  const lineItemRegex = /(.+?)\s+(\d+)\s+x?\s*([0-9,]+\.?\d*)\s+([0-9,]+\.?\d*)/g;
  while ((match = lineItemRegex.exec(text)) !== null) {
    lineItems.push({
      description: match[1].trim(),
      quantity: parseInt(match[2]),
      unitPrice: parseFloat(match[3].replace(/,/g, '')),
      amount: parseFloat(match[4].replace(/,/g, ''))
    });
  }
  
  return {
    vendorName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    subtotal,
    taxAmount,
    totalAmount,
    currency,
    lineItems,
    rawText: text,
    confidence: 0.7 // Default confidence for text parsing
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileName, ocrProvider, fileType }: OCRRequest = await req.json();
    
    console.log(`Processing OCR request: provider=${ocrProvider}, file=${fileName}`);
    
    let extractedText = '';
    let confidence = 0;
    let providerUsed = ocrProvider;
    let apiKeyMissing = false;
    
    // Check for required API keys based on provider
    if (ocrProvider === 'google_vision') {
      const googleApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
      if (!googleApiKey) {
        apiKeyMissing = true;
        console.log('Google Vision API key not configured, falling back to mock extraction');
      } else {
        // Call Google Vision API
        try {
          const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  image: { content: fileBase64 },
                  features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                }]
              })
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.responses?.[0]?.fullTextAnnotation?.text) {
              extractedText = data.responses[0].fullTextAnnotation.text;
              confidence = 0.95;
            }
          }
        } catch (error) {
          console.error('Google Vision API error:', error);
          apiKeyMissing = true;
        }
      }
    } else if (ocrProvider === 'aws_textract') {
      const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID');
      const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
      
      if (!awsAccessKey || !awsSecretKey) {
        apiKeyMissing = true;
        console.log('AWS credentials not configured, falling back to mock extraction');
      } else {
        // AWS Textract would be called here
        // For now, we'll use mock data since AWS SDK setup is complex
        apiKeyMissing = true;
      }
    } else if (ocrProvider === 'tesseract') {
      // Tesseract.js runs client-side, so we just acknowledge
      // The actual OCR should happen on the frontend
      providerUsed = 'tesseract';
    }
    
    // If API key is missing or we're using tesseract, return instructions
    if (apiKeyMissing || ocrProvider === 'tesseract') {
      // Return a mock extraction for demo purposes
      const mockData: ExtractedBillData = {
        vendorName: 'Sample Vendor LLC',
        invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 1000,
        taxAmount: 50,
        totalAmount: 1050,
        currency: 'AED',
        lineItems: [
          { description: 'Service Fee', quantity: 1, unitPrice: 1000, amount: 1000 }
        ],
        rawText: 'Mock extraction - Configure API keys for real OCR',
        confidence: 0
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          provider: providerUsed,
          apiKeyMissing,
          message: apiKeyMissing 
            ? `${ocrProvider === 'google_vision' ? 'GOOGLE_VISION_API_KEY' : 'AWS credentials'} not configured. Using mock data for demo.`
            : 'Tesseract OCR should be processed client-side. Mock data returned for demo.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the extracted text
    const parsedData = parseExtractedText(extractedText);
    parsedData.confidence = confidence;
    
    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
        provider: providerUsed,
        apiKeyMissing: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('OCR processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'OCR processing failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
