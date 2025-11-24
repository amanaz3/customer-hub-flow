import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, FileText, User, Building2, Clock, ChevronLeft, ChevronRight, Users, ClipboardList, Download, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatChecklistForSharing, shareViaWhatsApp, emailDocumentChecklist } from '@/utils/documentChecklistSharing';
import { validateEmail, validatePhoneNumber } from '@/utils/inputValidation';

interface CustomerEventsSidebarProps {
  customerId: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  productType?: 'goaml' | 'home_finance' | 'bank_account' | null;
  isExistingCustomer?: boolean;
}

export const CustomerEventsSidebar: React.FC<CustomerEventsSidebarProps> = ({ 
  customerId,
  collapsed,
  onCollapsedChange,
  productType,
  isExistingCustomer = false
}) => {
  const { toast } = useToast();
  const [internalCollapsed, setInternalCollapsed] = React.useState(true);
  // Default to 'events' for existing customer flow, 'documents' for new customer flow
  const [activeTab, setActiveTab] = useState<string>(isExistingCustomer ? 'events' : 'documents');
  const [hasAutoExpanded, setHasAutoExpanded] = React.useState(false);
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;

  // Auto-expand sidebar when productType is selected (only once)
  // For new customer: switch to documents tab
  // For existing customer: keep events tab
  React.useEffect(() => {
    if (productType && !hasAutoExpanded) {
      if (!isExistingCustomer) {
        setActiveTab('documents');
      }
      
      if (isCollapsed) {
        setHasAutoExpanded(true);
        
        if (collapsed !== undefined) {
          onCollapsedChange?.(false);
        } else {
          setInternalCollapsed(false);
        }
      }
    }
  }, [productType, hasAutoExpanded, isCollapsed, collapsed, onCollapsedChange, isExistingCustomer]);

  const toggleCollapsed = (targetTab?: string) => {
    const newValue = !isCollapsed;
    
    // When expanding sidebar with a specific tab target, use that
    // For existing customer flow, default to events
    // For new customer flow with productType, default to documents
    if (!newValue) {
      if (targetTab) {
        setActiveTab(targetTab);
      } else if (isExistingCustomer) {
        setActiveTab('events');
      } else if (productType) {
        setActiveTab('documents');
      }
    }
    
    if (collapsed !== undefined) {
      onCollapsedChange?.(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  // Fetch customer details
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId && customerId !== 'temp',
  });

  // Fetch customer applications with manual product lookup
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['customer-applications', customerId],
    queryFn: async () => {
      const { data: apps, error: appsError } = await (supabase as any)
        .from('applications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (appsError) throw appsError;
      
      // Fetch products separately
      if (apps && apps.length > 0) {
        const productIds = [...new Set(apps.map((app: any) => app.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const { data: products } = await (supabase as any)
            .from('products')
            .select('id, name')
            .in('id', productIds);
          
          // Merge product data
          return apps.map((app: any) => ({
            ...app,
            product_name: products?.find((p: any) => p.id === app.product_id)?.name,
          }));
        }
      }
      
      return apps || [];
    },
    enabled: !!customerId && customerId !== 'temp',
  });

  // Fetch status history
  const { data: statusHistory } = useQuery({
    queryKey: ['customer-status-history', customerId],
    queryFn: async () => {
      if (!applications || applications.length === 0) return [];
      
      const appIds = (applications as any[]).map((app: any) => app.id);
      const { data, error } = await (supabase as any)
        .from('status_history')
        .select('*')
        .in('application_id', appIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Add application reference numbers
      return data?.map((history: any) => ({
        ...history,
        reference_number: (applications as any[]).find((a: any) => a.id === history.application_id)?.reference_number,
      })) || [];
    },
    enabled: !!applications && applications.length > 0,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-muted text-muted-foreground',
      'Submitted': 'bg-primary/10 text-primary',
      'In Progress': 'bg-primary/10 text-primary',
      'Returned': 'bg-destructive/10 text-destructive',
      'Approved': 'bg-accent/10 text-accent',
      'Rejected': 'bg-destructive/10 text-destructive',
      'Complete': 'bg-accent/10 text-accent',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  // Get document categories based on product type
  const getDocumentCategories = () => {
    if (!productType) return [];
    
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
              'Share Certificates'
            ]
          },
          {
            title: 'Shareholder Documents',
            icon: Users,
            color: 'text-blue-600',
            count: 3,
            items: [
              'Passport Copies of all Shareholders',
              'Emirates ID or Visa Copies',
              'Proof of Address'
            ]
          }
        ];
      
      default:
        return [];
    }
  };

  const getProductTitle = () => {
    switch (productType) {
      case 'goaml': return 'GoAML Registration';
      case 'home_finance': return 'Home Finance Mortgage';
      case 'bank_account': return 'Business Bank Account';
      default: return 'Required Documents';
    }
  };

  const documentCategories = getDocumentCategories();

  if (customerLoading) {
    return (
      <div className={cn(
        "fixed right-0 top-0 h-screen bg-card border-l shadow-lg transition-all duration-300 z-[100000]",
        isCollapsed ? "w-12" : "w-80"
      )}>
        <div className="space-y-4 p-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // For temp customer (new customer in step 2 before save), show documents only
  if (customerId === 'temp' || !customer) {
    return (
      <div className={cn(
        "fixed right-0 top-0 h-screen bg-card border-l shadow-lg transition-all duration-300 z-[100000] flex flex-col",
        isCollapsed ? "w-12" : "w-80"
      )}>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "fixed top-4 h-16 w-10 rounded-l-lg rounded-r-none border border-r-0 bg-card shadow-xl hover:bg-accent transition-all duration-300 z-[100001]",
            isCollapsed ? "right-12" : "right-80"
          )}
          onClick={() => toggleCollapsed()}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {/* Collapsed State - Show Docs icon only for temp */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-4">
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors p-2 rounded bg-muted"
              onClick={() => toggleCollapsed('documents')}
              title="View Documents"
            >
              <FileText className="h-6 w-6 text-muted-foreground" />
              <Badge className="writing-mode-vertical text-[10px] px-1 py-2">Docs</Badge>
            </div>
          </div>
        )}

        {/* Show documents with full features for temp customer */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-semibold text-primary">Required Documents</span>
                  {productType && (
                    <span className="text-xs text-muted-foreground">{getProductTitle()}</span>
                  )}
                  <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    Reference only - Documents collected in subsequent steps
                  </span>
                </div>
                {productType && (
                  <Badge variant="secondary" className="text-xs">
                    {documentCategories.reduce((sum, cat) => sum + cat.count, 0)} docs
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {productType ? (
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
                           onClick={() => {
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
                               cat.items.forEach((item: string) => {
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
                           }}
                         >
                          <Download className="h-4 w-4" />
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download PDF</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="h-8 px-2"
                           onClick={() => {
                             const productTitle = getProductTitle();
                             const categories = getDocumentCategories();
                             
                             let checklist = `${productTitle.toUpperCase()} - REQUIRED DOCUMENTS CHECKLIST\n\n`;
                             checklist += `Generated: ${new Date().toLocaleDateString()}\n\n`;
                             checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
                             
                             categories.forEach(cat => {
                               checklist += `${cat.title.toUpperCase()} (${cat.count})\n`;
                               checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
                               cat.items.forEach((item: string) => {
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
                           }}
                         >
                          <FileText className="h-4 w-4" />
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Text</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            const categories = getDocumentCategories();
                            const checklistText = formatChecklistForSharing(categories);
                            navigator.clipboard.writeText(checklistText);
                            toast({
                              title: "Copied",
                              description: "Document checklist copied to clipboard",
                            });
                          }}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to Clipboard</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled
                          title="Complete customer details first"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>WhatsApp (complete customer details first)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled
                          title="Complete customer details first"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Email (complete customer details first)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Document Categories */}
                <div className="flex-1 overflow-y-auto p-4">
            <Accordion type="multiple" className="w-full space-y-2">
                {documentCategories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <AccordionItem key={index} value={`cat-${index}`} className="border rounded-lg px-3">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", category.color)} />
                          <span className="text-sm font-medium">{category.title}</span>
                          <Badge variant="secondary" className="ml-auto mr-2 text-xs">
                            {category.count}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3">
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
              </>
            ) : (
              <Card className="border-muted m-4">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a product to view required documents
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed right-0 top-0 h-screen bg-card border-l shadow-lg transition-all duration-300 z-[100000] flex flex-col",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Toggle Button - Fixed positioning for better visibility */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "fixed top-4 h-16 w-10 rounded-l-lg rounded-r-none border border-r-0 bg-card shadow-xl hover:bg-accent transition-all duration-300 z-[100001]",
          isCollapsed ? "right-12" : "right-80"
        )}
        onClick={() => toggleCollapsed()}
      >
        {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Collapsed State - Shows icons vertically */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-6">
          <div 
            className={cn(
              "flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors p-2 rounded",
              activeTab === 'events' && "bg-muted"
            )}
            onClick={() => {
              if (isCollapsed) {
                toggleCollapsed('events');
              } else {
                setActiveTab('events');
              }
            }}
            title="View Events"
          >
            <User className="h-6 w-6 text-muted-foreground" />
            <Badge className="writing-mode-vertical text-[10px] px-1 py-2">Events</Badge>
          </div>
          <div 
            className={cn(
              "flex flex-col items-center gap-2 pt-4 border-t border-border w-full cursor-pointer hover:bg-muted/50 transition-colors p-2 rounded",
              activeTab === 'documents' && "bg-muted"
            )}
            onClick={() => {
              if (isCollapsed) {
                toggleCollapsed('documents');
              } else {
                setActiveTab('documents');
              }
            }}
            title="View Documents"
          >
            <FileText className="h-6 w-6 text-muted-foreground" />
            <Badge className="writing-mode-vertical text-[10px] px-1 py-2">Docs</Badge>
          </div>
        </div>
      )}

      {/* Content Area - Always visible when expanded */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
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
                {productType && (
                  <Badge variant="secondary" className="text-xs">
                    {documentCategories.reduce((sum, cat) => sum + cat.count, 0)}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Events View */}
          {activeTab === 'events' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {/* Customer Info Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <Building2 className="w-3 h-3 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{customer.company}</div>
                <div className="text-muted-foreground">{customer.name}</div>
              </div>
            </div>
            <div className="text-muted-foreground">{customer.email}</div>
            <div className="text-muted-foreground">{customer.mobile}</div>
            <div className="pt-2 border-t border-border">
              <Badge variant="outline" className="text-xs">
                {customer.license_type || 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-4">
            {applicationsLoading ? (
              <div className="space-y-2">
                <div className="h-16 bg-muted animate-pulse rounded" />
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ) : applications && applications.length > 0 ? (
              (applications as any[]).map((app: any) => (
                <div
                  key={app.id}
                  className="p-2 rounded-md border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs font-medium text-foreground truncate">
                      {app.product_name || 'Unknown Service'}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(app.status)}`}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.reference_number}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    AED {app.amount?.toLocaleString() || '0'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No applications yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-4">
            {statusHistory && statusHistory.length > 0 ? (
              (statusHistory as any[]).slice(0, 8).map((history: any, index: number) => (
                <div
                  key={history.id || index}
                  className="flex items-start gap-2 pb-2 border-b border-border last:border-0"
                >
                  <Calendar className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground">
                      Status changed to{' '}
                      <span className="font-medium">{history.new_status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {history.reference_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(history.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-3 sm:p-4">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-semibold text-foreground">
                {applications?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Applications</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-semibold text-foreground">
                {(applications as any[])?.filter((a: any) => a.status === 'Complete').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
            </div>
          )}

           {/* Documents View */}
           {activeTab === 'documents' && (
             <div className="flex-1 flex flex-col overflow-hidden min-h-0">
           {productType ? (
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
                          onClick={() => {
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
                              cat.items.forEach((item: string) => {
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
                          }}
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
                          onClick={() => {
                            const productTitle = getProductTitle();
                            const categories = getDocumentCategories();
                            
                            let checklist = `${productTitle.toUpperCase()} - REQUIRED DOCUMENTS CHECKLIST\n\n`;
                            checklist += `Generated: ${new Date().toLocaleDateString()}\n\n`;
                            checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
                            
                            categories.forEach(cat => {
                              checklist += `${cat.title.toUpperCase()} (${cat.count})\n`;
                              checklist += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
                              cat.items.forEach((item: string) => {
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
                          }}
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
                          onClick={async () => {
                            if (!customer?.email || !validateEmail(customer.email)) {
                              toast({
                                title: "Email Required",
                                description: "Please enter a valid email address in the form first",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            const categories = getDocumentCategories();
                            const checklistText = formatChecklistForSharing(categories);
                            
                            const success = await emailDocumentChecklist({
                              recipientEmail: customer.email,
                              recipientName: customer.name || 'Customer',
                              documentList: checklistText,
                              productType: getProductTitle(),
                              customerName: customer.company,
                            });
                            
                            if (success) {
                              toast({
                                title: "Email Sent",
                                description: `Document checklist sent to ${customer.email}`,
                              });
                            } else {
                              toast({
                                title: "Error",
                                description: "Failed to send email. Please try again",
                                variant: "destructive",
                              });
                            }
                          }}
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
                          onClick={() => {
                            if (!customer?.mobile || !validatePhoneNumber(customer.mobile)) {
                              toast({
                                title: "Phone Required",
                                description: "Please enter a valid mobile number in the form first",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            try {
                              const categories = getDocumentCategories();
                              const productTitle = getProductTitle();
                              const checklistText = formatChecklistForSharing(categories);
                              shareViaWhatsApp(customer.mobile, checklistText, productTitle);
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to open WhatsApp",
                                variant: "destructive",
                              });
                            }
                          }}
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
                          onClick={() => {
                            const categories = getDocumentCategories();
                            const checklistText = formatChecklistForSharing(categories);
                            const checklist = `${getProductTitle()} - Required Documents\n\n${checklistText}`;
                            navigator.clipboard.writeText(checklist);
                            toast({
                              title: "Copied to Clipboard",
                              description: "Document checklist has been copied",
                            });
                          }}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Copy to clipboard</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
               </div>

               {/* Accordion-based Document Categories - Only expandable section */}
               <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3">
                 {/* Info Banner */}
                 <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-2 border-amber-500/30 rounded-xl flex items-start gap-3">
                   <Calendar className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                   <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                     Reference only - Documents collected in subsequent steps
                   </p>
                 </div>
                 
                 <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
                   {documentCategories.map((category, index) => {
                     const IconComponent = category.icon;
                     return (
                       <AccordionItem 
                         key={index} 
                         value={`item-${index}`} 
                         className="border-2 border-border/60 rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden"
                       >
                         <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-3 flex-1">
                             <IconComponent className={cn("h-5 w-5", category.color)} />
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
           ) : (
             <div className="flex-1 overflow-y-auto p-4">
               <Card className="border-muted">
                 <CardContent className="pt-6 text-center p-3 sm:p-4">
                   <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">
                     Select a product to view required documents
                   </p>
                 </CardContent>
               </Card>
             </div>
             )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};
