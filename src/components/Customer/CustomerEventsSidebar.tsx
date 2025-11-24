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
  isNewApplication?: boolean;
}

export const CustomerEventsSidebar: React.FC<CustomerEventsSidebarProps> = ({ 
  customerId,
  collapsed,
  onCollapsedChange,
  productType,
  isNewApplication = false
}) => {
  const { toast } = useToast();
  const [internalCollapsed, setInternalCollapsed] = React.useState(true);
  const [activeTab, setActiveTab] = useState<string>('events');
  const [hasAutoExpanded, setHasAutoExpanded] = React.useState(false);
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;

  // Auto-expand sidebar but stay on events tab for new applications
  React.useEffect(() => {
    if (productType && !hasAutoExpanded && isCollapsed) {
      // Explicitly set tab based on application type
      if (isNewApplication) {
        setActiveTab('events');
      } else {
        setActiveTab('documents');
      }
      setHasAutoExpanded(true);
      
      if (collapsed !== undefined) {
        onCollapsedChange?.(false);
      } else {
        setInternalCollapsed(false);
      }
    }
  }, [productType, hasAutoExpanded, isCollapsed, collapsed, onCollapsedChange, isNewApplication]);

  const toggleCollapsed = (targetTab?: string) => {
    const newValue = !isCollapsed;
    
    // When expanding sidebar with a specific tab target, use that
    // Otherwise, when expanding with productType available, default to documents
    if (!newValue) {
      if (targetTab) {
        setActiveTab(targetTab);
      } else if (productType && activeTab !== 'events') {
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
    enabled: !!customerId,
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
    enabled: !!customerId,
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

  if (!customer) return null;

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
          {/* Header with view switcher */}
          <div className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0">
            {activeTab === 'events' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Events</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('documents')}
                  className="h-8 px-2"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="text-xs">Docs</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">Required Documents</span>
                    {productType && (
                      <span className="text-xs text-muted-foreground">{getProductTitle()}</span>
                    )}
                  </div>
                  {productType && (
                    <Badge variant="secondary" className="text-xs">
                      {documentCategories.reduce((sum, cat) => sum + cat.count, 0)} docs
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('events')}
                  className="h-8 px-2"
                >
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-xs">Events</span>
                </Button>
              </div>
            )}
          </div>

          {/* Events View */}
          {activeTab === 'events' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Customer Info Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
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
               {isNewApplication ? (
                 /* Empty State for New Applications */
                 <div className="flex-1 flex items-center justify-center p-6">
                   <Card className="border-muted max-w-sm">
                     <CardContent className="pt-6 text-center">
                       <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                       <h3 className="text-sm font-semibold text-foreground mb-2">No Documents Yet</h3>
                       <p className="text-xs text-muted-foreground">
                         This is a new application. Documents will be uploaded after the application is submitted.
                       </p>
                     </CardContent>
                   </Card>
                 </div>
               ) : (
                 <>
                   {/* Action Buttons Bar */}
                   <div className="flex items-center justify-around gap-1 px-2 py-2 border-b bg-muted/20 flex-shrink-0">
...
                   </div>

                   {/* Info Banner */}
                   <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b flex items-start gap-2 flex-shrink-0">
                     <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                     <p className="text-xs text-blue-900 dark:text-blue-100">
                       Reference only - Documents collected in subsequent steps
                     </p>
                   </div>

                   {/* Accordion-based Document Categories - Only expandable section */}
                   <div className="flex-1 overflow-y-auto p-4 min-h-0">
                     <Accordion type="single" collapsible defaultValue="item-0" className="space-y-2">
                       {documentCategories.map((category, index) => {
                         const IconComponent = category.icon;
                         return (
                           <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg">
                             <AccordionTrigger className="px-3 py-2 hover:no-underline">
                               <div className="flex items-center gap-2">
                                 <IconComponent className={cn("h-4 w-4", category.color)} />
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
                 </>
               )}
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
           )}
        </div>
      )}
    </div>
  );
};
