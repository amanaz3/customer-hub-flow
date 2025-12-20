import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  FileCheck, 
  Building2,
  Calendar,
  DollarSign,
  Download,
  Printer
} from 'lucide-react';
import { TaxFiling } from '../EnhancedTaxWorkflow';

interface ReviewFilingStepProps {
  filing: TaxFiling | null;
  onProceed: () => void;
  onBack: () => void;
}

const declarations = [
  {
    id: 'accurate',
    label: 'I confirm that all information provided is true, complete, and accurate to the best of my knowledge.',
  },
  {
    id: 'records',
    label: 'I confirm that proper books and records have been maintained as required by UAE Corporate Tax Law.',
  },
  {
    id: 'authorized',
    label: 'I am authorized to submit this tax return on behalf of the taxable person.',
  },
];

export function ReviewFilingStep({ filing, onProceed, onBack }: ReviewFilingStepProps) {
  const [acceptedDeclarations, setAcceptedDeclarations] = useState<Set<string>>(new Set());

  const toggleDeclaration = (id: string) => {
    setAcceptedDeclarations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const allDeclarationsAccepted = declarations.every(d => acceptedDeclarations.has(d.id));

  // Demo data
  const filingData = {
    companyName: 'Tech Solutions LLC',
    tradeLicense: 'DED-123456-2024',
    trn: '100123456789012',
    taxYear: 2024,
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    totalRevenue: 1050000,
    taxableIncome: 275500,
    taxLiability: 0, // With small business relief
    status: 'Ready for Submission'
  };

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Company Name</p>
              <p className="font-medium">{filingData.companyName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Trade License</p>
              <p className="font-mono">{filingData.tradeLicense}</p>
            </div>
            <div>
              <p className="text-muted-foreground">TRN</p>
              <p className="font-mono">{filingData.trn}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Jurisdiction</p>
              <p className="font-medium">Dubai Mainland</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Period */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tax Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tax Year</p>
              <p className="font-bold text-lg">{filingData.taxYear}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period Start</p>
              <p className="font-medium">{filingData.periodStart}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Period End</p>
              <p className="font-medium">{filingData.periodEnd}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-mono font-bold">AED {filingData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Taxable Income</p>
              <p className="font-mono font-bold">AED {filingData.taxableIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Tax Liability</p>
              <p className="font-mono font-bold text-green-600">AED {filingData.taxLiability.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className="mt-1">Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Documents */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Generated Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Tax Return Form
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Computation Sheet
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Supporting Schedules
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Declarations */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Declaration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {declarations.map((declaration) => (
            <div key={declaration.id} className="flex items-start gap-3">
              <Checkbox
                id={declaration.id}
                checked={acceptedDeclarations.has(declaration.id)}
                onCheckedChange={() => toggleDeclaration(declaration.id)}
              />
              <label
                htmlFor={declaration.id}
                className="text-sm leading-relaxed cursor-pointer"
              >
                {declaration.label}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onProceed} 
          disabled={!allDeclarationsAccepted}
          className="gap-2"
        >
          Proceed to Submit
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
