import React from 'react';
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

export const AgentHelpDialog: React.FC = () => {
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
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Application Process Overview
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This form follows a 2-stage process:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li><strong>Customer Details</strong> - Collect all customer information and application details</li>
                  <li><strong>Document Upload</strong> - Upload required documents after customer is created</li>
                </ol>
              </div>
            </section>

            <Separator />

            {/* Required Fields Section */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Required Information
              </h3>
              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="mb-2">Basic Information</Badge>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                    <li>Customer Name (Full legal name)</li>
                    <li>Email Address (Valid format required)</li>
                    <li>Mobile Number (10-20 digits)</li>
                    <li>Company Name (Existing or create new)</li>
                  </ul>
                </div>

                <div>
                  <Badge variant="outline" className="mb-2">Application Details</Badge>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                    <li>Product/Service Selection (Required)</li>
                    <li>License Type (Mainland/Freezone/Offshore)</li>
                    <li>Application Amount (Must be greater than 0)</li>
                    <li>Annual Turnover (Required for most services)</li>
                    <li>Lead Source (Where customer came from)</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Company Selection Tips */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Company Selection</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Existing Company:</strong> Search and select from dropdown</p>
                <p><strong>New Company:</strong> Click "+ Create New Company" button to add a new company to the system</p>
                <p className="text-xs italic">💡 Tip: Always check if company exists before creating new one</p>
              </div>
            </section>

            <Separator />

            {/* Product-Specific Fields */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Product-Specific Fields</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-1">Business Bank Account</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Mainland or Freezone status</li>
                    <li>Signatory type (Single/Joint)</li>
                    <li>Business activity details</li>
                    <li>Minimum balance range preference</li>
                  </ul>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-1">Bookkeeping Services</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Company incorporation date</li>
                    <li>Number of monthly entries</li>
                    <li>VAT/Corporate tax status</li>
                    <li>Accounting software preference</li>
                  </ul>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-1">Corporate Tax Filing</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Tax year period</li>
                    <li>First-time filing status</li>
                    <li>Tax registration number</li>
                    <li>Financial year end date</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Document Upload Guide */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Document Upload Stage
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>After creating the customer, you'll be automatically moved to the document upload stage.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Upload passport copies, trade licenses, etc.</li>
                  <li>Multiple files can be uploaded per category</li>
                  <li>Mark documents as complete when all required docs are uploaded</li>
                  <li>You can skip documents and upload later if needed</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Best Practices */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Best Practices</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-2">✓ Do's</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Verify customer email and phone before submitting</li>
                    <li>Double-check company name spelling</li>
                    <li>Fill all visible required fields</li>
                    <li>Use notes field for special instructions</li>
                    <li>Confirm product selection matches customer needs</li>
                  </ul>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-semibold text-red-700 dark:text-red-400 mb-2">✗ Don'ts</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Don't create duplicate companies</li>
                    <li>Don't skip mandatory fields</li>
                    <li>Don't use placeholder/test data</li>
                    <li>Don't navigate away with unsaved changes</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Troubleshooting */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Form won't submit?</p>
                  <p className="ml-2">Check for validation errors (red text) under each field and ensure all required fields are filled.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can't find company?</p>
                  <p className="ml-2">Use the search box to filter companies. If not found, click "+ Create New Company" to add it.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Product-specific fields not showing?</p>
                  <p className="ml-2">Ensure you've selected a product/service first. Fields appear based on your selection.</p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
