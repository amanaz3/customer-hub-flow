import React from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, Users, FileText, ClipboardList, Mail, Share2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, validatePhoneNumber } from '@/utils/inputValidation';
import { emailDocumentChecklist, shareViaWhatsApp } from '@/utils/documentChecklistSharing';
import { cn } from '@/lib/utils';

interface RequiredDocumentsSidebarProps {
  productType: 'goaml' | 'home_finance' | 'bank_account' | null;
  customerEmail?: string;
  customerName?: string;
  customerMobile?: string;
  customerCompany?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const RequiredDocumentsSidebar: React.FC<RequiredDocumentsSidebarProps> = ({
  productType,
  customerEmail,
  customerName,
  customerMobile,
  customerCompany,
  collapsed,
  onCollapsedChange,
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(true);
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  const { toast } = useToast();

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    if (collapsed !== undefined) {
      onCollapsedChange?.(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  // Don't show sidebar if no product type
  if (!productType) {
    return null;
  }

  const getProductTitle = () => {
    switch (productType) {
      case 'goaml': return 'GoAML Registration';
      case 'home_finance': return 'Home Finance Mortgage';
      case 'bank_account': return 'Business Bank Account';
      default: return 'Required Documents';
    }
  };

  const getDocumentCategories = () => {
    switch (productType) {
      case 'goaml':
        return [
          {
            title: 'Company Documents',
            icon: Building2,
            color: 'text-purple-600',
            count: 3,
            items: [
              'Trade License Copy (certified)',
              'Memorandum of Association (MOA)',
              'Company Organization Chart'
            ]
          },
          {
            title: 'Beneficial Owner Documents',
            icon: Users,
            color: 'text-blue-600',
            count: 3,
            items: [
              'Passport Copies of all UBOs',
              'Emirates ID Copies of all UBOs',
              'Proof of Address for all UBOs'
            ]
          },
          {
            title: 'Compliance Documents',
            icon: FileText,
            color: 'text-green-600',
            count: 2,
            items: [
              'Board Resolution appointing Compliance Officer',
              'Bank Account Details & Statements (Last 6 months)'
            ]
          }
        ];
      
      case 'home_finance':
        return [
          {
            title: 'Personal Documents',
            icon: Users,
            color: 'text-blue-600',
            count: 2,
            items: [
              'Passport Copy with valid UAE Visa',
              'Emirates ID Copy (both sides)'
            ]
          },
          {
            title: 'Employment & Financial',
            icon: FileText,
            color: 'text-green-600',
            count: 2,
            items: [
              'Salary Certificate (last 3 months)',
              'Bank Statements (last 6 months)'
            ]
          },
          {
            title: 'Property Documents',
            icon: Building2,
            color: 'text-purple-600',
            count: 3,
            items: [
              'Property Valuation Report',
              'Property Documents (Title Deed / MOU / Sale Agreement)',
              'Proof of Down Payment'
            ]
          },
          {
            title: 'Additional Documents',
            icon: ClipboardList,
            color: 'text-orange-600',
            count: 2,
            items: [
              'Credit Report Authorization Form',
              'If Self-Employed: Trade License, MOA, Audited Financials'
            ]
          }
        ];

      case 'bank_account':
        return [
          {
            title: 'Company Documents',
            icon: Building2,
            color: 'text-purple-600',
            count: 3,
            items: [
              'Trade License Copy',
              'Memorandum of Association (MOA)',
              'Company Organization Chart'
            ]
          },
          {
            title: 'Shareholder Documents',
            icon: Users,
            color: 'text-blue-600',
            count: 3,
            items: [
              'Passport Copies of all shareholders',
              'Emirates ID Copies',
              'Proof of Address'
            ]
          }
        ];

      default:
        return [];
    }
  };

  const getChecklistText = () => {
    const categories = getDocumentCategories();
    return categories
      .map(cat => `${cat.title}:\n${cat.items.map(item => `• ${item}`).join('\n')}`)
      .join('\n\n');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const categories = getDocumentCategories();
    const productTitle = getProductTitle();
    
    let yPos = 20;
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(productTitle.toUpperCase(), 20, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Required Documents Checklist', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;
    
    categories.forEach(cat => {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${cat.title.toUpperCase()} (${cat.count})`, 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      cat.items.forEach(item => {
        doc.text(`☐ ${item}`, 25, yPos);
        yPos += 7;
      });
      yPos += 5;
    });
    
    doc.save(`${productTitle.replace(/\s+/g, '-')}-Checklist-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Downloaded!",
      description: "PDF checklist saved to downloads",
    });
  };

  const handleDownloadText = () => {
    const productTitle = getProductTitle();
    const categories = getDocumentCategories();
    
    let checklist = `${productTitle.toUpperCase()} - REQUIRED DOCUMENTS CHECKLIST\n\n`;
    checklist += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    categories.forEach(cat => {
      checklist += `${cat.title.toUpperCase()} (${cat.count})\n`;
      checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      cat.items.forEach(item => {
        checklist += `□ ${item}\n`;
      });
      checklist += '\n\n';
    });
    
    const blob = new Blob([checklist], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productTitle.replace(/\s+/g, '-')}-Checklist-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Downloaded!",
      description: "Text checklist saved to downloads",
    });
  };

  const handleCopyChecklist = () => {
    const checklist = `${getProductTitle()} - Required Documents\n\n${getChecklistText()}`;
    navigator.clipboard.writeText(checklist);
    toast({
      title: "Copied!",
      description: "Checklist copied to clipboard",
    });
  };

  const handleEmailChecklist = async () => {
    if (!customerEmail || !validateEmail(customerEmail)) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address in the form first",
        variant: "destructive",
      });
      return;
    }
    
    const success = await emailDocumentChecklist({
      recipientEmail: customerEmail,
      recipientName: customerName || 'Customer',
      documentList: getChecklistText(),
      productType: getProductTitle(),
      customerName: customerCompany,
    });
    
    if (success) {
      toast({
        title: "Email Sent!",
        description: `Checklist sent to ${customerEmail}`,
      });
    } else {
      toast({
        title: "Failed to send",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (!customerMobile || !validatePhoneNumber(customerMobile)) {
      toast({
        title: "Phone Required",
        description: "Please enter a valid mobile number in the form first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      shareViaWhatsApp(customerMobile, getChecklistText(), getProductTitle());
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
  };

  const totalDocs = getDocumentCategories().reduce((sum, cat) => sum + cat.count, 0);
  const categories = getDocumentCategories();

  return (
    <div 
      className={cn(
        "fixed right-0 top-0 h-screen bg-card border-l shadow-lg transition-all duration-300 z-[500]",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-8 top-4 h-16 w-8 rounded-r-none border-l-0 bg-card border shadow-md"
        onClick={toggleCollapsed}
      >
        {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <Badge className="writing-mode-vertical">{totalDocs}</Badge>
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Required Documents</h3>
              <Badge variant="secondary">{totalDocs} docs</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{getProductTitle()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-1 px-4 py-2 border-b bg-muted/30">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleDownloadPDF}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download PDF</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleDownloadText}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download text</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleCopyChecklist}
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy to clipboard</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleEmailChecklist}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Email checklist</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleWhatsAppShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share via WhatsApp</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Info Banner */}
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900 dark:text-blue-100">
              Reference only - Documents collected in subsequent steps
            </p>
          </div>

          {/* Document Categories */}
          <div className="flex-1 overflow-y-auto p-4">
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-2">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", category.color)} />
                        <span className="text-sm font-medium">{category.title}</span>
                        <Badge variant="outline" className="text-xs">{category.count}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <ul className="space-y-2">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm">
                            <span className={cn("mt-1", category.color)}>•</span>
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};
