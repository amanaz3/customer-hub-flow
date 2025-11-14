import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, CheckCircle, FileText, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface HelpContent {
  overview: string;
  required_basic: string;
  required_application: string;
  company_tips: string;
  bank_account_fields: string;
  bookkeeping_fields: string;
  tax_filing_fields: string;
  document_upload_info: string;
  best_practices_dos: string;
  best_practices_donts: string;
  troubleshooting: string;
}

const defaultContent: HelpContent = {
  overview: "This form follows a 2-stage process:\n1. Customer Details - Collect all customer information and application details\n2. Document Upload - Upload required documents after customer is created",
  required_basic: "Customer Name (Full legal name)\nEmail Address (Optional - Valid format if provided)\nMobile Number (10-20 digits)\nCompany Name (Existing or create new)",
  required_application: "Product/Service Selection (Required)\nLicense Type (Mainland/Freezone/Offshore)\nApplication Amount (Must be greater than 0)\nAnnual Turnover (Required for most services)\nLead Source (Where customer came from)",
  company_tips: "Existing Company: Search and select from dropdown\nNew Company: Click '+ Create New Company' button to add a new company to the system\n💡 Tip: Always check if company exists before creating new one",
  bank_account_fields: "Mainland or Freezone status\nSignatory type (Single/Joint)\nBusiness activity details\nMinimum balance range preference",
  bookkeeping_fields: "Company incorporation date\nNumber of monthly entries\nVAT/Corporate tax status\nAccounting software preference",
  tax_filing_fields: "Tax year period\nFirst-time filing status\nTax registration number\nFinancial year end date",
  document_upload_info: "After creating the customer, you'll be automatically moved to the document upload stage.\n• Upload passport copies, trade licenses, etc.\n• Multiple files can be uploaded per category\n• Mark documents as complete when all required docs are uploaded\n• You can skip documents and upload later if needed",
  best_practices_dos: "Verify customer email and phone before submitting\nDouble-check company name spelling\nFill all visible required fields\nUse notes field for special instructions\nConfirm product selection matches customer needs",
  best_practices_donts: "Don't create duplicate companies\nDon't skip mandatory fields\nDon't use placeholder/test data\nDon't navigate away with unsaved changes",
  troubleshooting: "Form won't submit? | Check for validation errors (red text) under each field and ensure all required fields are filled.\nCan't find company? | Use the search box to filter companies. If not found, click '+ Create New Company' to add it.\nProduct-specific fields not showing? | Ensure you've selected a product/service first. Fields appear based on your selection."
};

export const AgentHelpDialog: React.FC = () => {
  const [content, setContent] = useState<HelpContent>(defaultContent);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('agent_help_content');
      if (stored) {
        const parsed = JSON.parse(stored);
        setContent(parsed);
      }
    } catch (error) {
      console.error('Error loading help content:', error);
    }
  }, []);

  const parseList = (text: string) => {
    return text.split('\n').filter(line => line.trim());
  };

  const parseTroubleshooting = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map(line => {
      const [problem, solution] = line.split('|').map(s => s.trim());
      return { problem, solution };
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Agent Help Guide
          </DialogTitle>
          <DialogDescription>
            Quick reference guide for creating customer applications
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Overview Section */}
            {content.overview && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Application Process Overview
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {parseList(content.overview).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Required Fields Section */}
            {(content.required_basic || content.required_application) && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Required Information
                </h3>
                <div className="space-y-3">
                  {content.required_basic && (
                    <div>
                      <Badge variant="outline" className="mb-2">Basic Information</Badge>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                        {parseList(content.required_basic).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.required_application && (
                    <div>
                      <Badge variant="outline" className="mb-2">Application Details</Badge>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                        {parseList(content.required_application).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Company Selection Tips */}
            {content.company_tips && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Company Selection</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {parseList(content.company_tips).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Product-Specific Fields */}
            {(content.bank_account_fields || content.bookkeeping_fields || content.tax_filing_fields) && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Product-Specific Fields</h3>
                <div className="space-y-3 text-sm">
                  {content.bank_account_fields && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="font-semibold mb-1">Business Bank Account</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        {parseList(content.bank_account_fields).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.bookkeeping_fields && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="font-semibold mb-1">Bookkeeping Services</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        {parseList(content.bookkeeping_fields).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.tax_filing_fields && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="font-semibold mb-1">Corporate Tax Filing</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        {parseList(content.tax_filing_fields).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Document Upload Guide */}
            {content.document_upload_info && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Document Upload Stage
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {parseList(content.document_upload_info).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            {/* Best Practices */}
            {(content.best_practices_dos || content.best_practices_donts) && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Best Practices</h3>
                <div className="space-y-2 text-sm">
                  {content.best_practices_dos && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-2">✓ Do's</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        {parseList(content.best_practices_dos).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.best_practices_donts && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="font-semibold text-red-700 dark:text-red-400 mb-2">✗ Don'ts</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                        {parseList(content.best_practices_donts).map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Troubleshooting */}
            {content.troubleshooting && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {parseTroubleshooting(content.troubleshooting).map((item, idx) => (
                    <div key={idx}>
                      <p className="font-semibold text-foreground">{item.problem}</p>
                      <p className="ml-2">{item.solution}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
