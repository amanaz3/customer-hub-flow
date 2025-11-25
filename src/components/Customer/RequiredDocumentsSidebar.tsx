import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, Users, FileText, ClipboardList, Mail, MessageCircle, Download, ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<string>('documents');
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  const { toast } = useToast();

  // Auto-expand sidebar when productType is selected
  React.useEffect(() => {
    if (productType) {
      // Auto-expand sidebar when product is selected
      if (isCollapsed) {
        if (collapsed !== undefined) {
          onCollapsedChange?.(false);
        } else {
          setInternalCollapsed(false);
        }
      }
    }
  }, [productType]);

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
      title: "PDF Downloaded",
      description: "Document checklist has been saved as PDF",
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
      title: "Text File Downloaded",
      description: "Document checklist has been saved as text file",
    });
  };

  const handleCopyChecklist = () => {
    const checklist = `${getProductTitle()} - Required Documents\n\n${getChecklistText()}`;
    navigator.clipboard.writeText(checklist);
    toast({
      title: "Copied to Clipboard",
      description: "Document checklist has been copied",
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
        title: "Email Sent",
        description: `Document checklist sent to ${customerEmail}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again",
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open WhatsApp",
        variant: "destructive",
      });
    }
  };

  const totalDocs = getDocumentCategories().reduce((sum, cat) => sum + cat.count, 0);
  const categories = getDocumentCategories();

  return (
    <div 
      className={cn(
        "fixed right-0 top-0 h-screen bg-card border-l shadow-lg transition-all duration-300 z-[99999] flex flex-col",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Toggle Button - Fixed positioning */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "fixed top-4 h-16 w-10 rounded-l-lg rounded-r-none border border-r-0 bg-card shadow-xl hover:bg-accent transition-all duration-300 z-[99998]",
          isCollapsed ? "right-12" : "right-80"
        )}
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
          {/* Header with tab switcher */}
          <div className="px-4 pt-4 pb-0 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-1">
              {/* Events Tab */}
              <button
                onClick={() => setActiveTab('events')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2",
                  activeTab === 'events'
                    ? "bg-background border-primary text-primary"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <User className="h-4 w-4" />
                <span>Events</span>
              </button>

              {/* Documents Tab */}
              <button
                onClick={() => setActiveTab('documents')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2",
                  activeTab === 'documents'
                    ? "bg-background border-primary text-primary"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Documents</span>
                <Badge variant="secondary" className="text-xs">
                  {totalDocs}
                </Badge>
              </button>
            </div>
          </div>

          {/* Events Tab Content */}
          {activeTab === 'events' && (
            <div className="flex-1 overflow-y-auto p-4">
              <Card className="border-muted">
                <CardContent className="pt-6 text-center p-3 sm:p-4">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Customer Information Pending
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Customer events and history will be available after the application is created
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Documents Tab Content */}
          {activeTab === 'documents' && (
            <>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-around gap-1 px-2 py-2 border-b bg-muted/20 flex-shrink-0">
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
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Text</p></TooltipContent>
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
                <TooltipContent><p>Email Checklist</p></TooltipContent>
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
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share via WhatsApp</p></TooltipContent>
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
          </div>

          {/* Document Categories */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Info Banner */}
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-2 border-amber-500/30 rounded-xl flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Reference only - Documents collected in subsequent steps
              </p>
            </div>
            
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`} 
                    className="border-2 border-border/60 rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className={cn("h-5 w-5", category.color)} />
                        <span className="text-sm font-semibold">{category.title}</span>
                        <Badge variant="secondary" className="text-xs ml-auto mr-2">
                          {category.count}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <ul className="space-y-2.5">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2.5 text-sm">
                            <span className={cn("text-lg leading-none mt-0.5", category.color)}>•</span>
                            <span className="text-muted-foreground leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
};
