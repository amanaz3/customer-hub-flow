import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, User, Building2, Clock, ChevronLeft, ChevronRight, Users, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CustomerEventsSidebarProps {
  customerId: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  productType?: 'goaml' | 'home_finance' | 'bank_account' | null;
}

export const CustomerEventsSidebar: React.FC<CustomerEventsSidebarProps> = ({ 
  customerId,
  collapsed,
  onCollapsedChange,
  productType 
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(true);
  const [activeTab, setActiveTab] = useState<string>('events');
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
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
            count: 2,
            items: [
              'Passport Copies of all Shareholders',
              'Emirates ID or Visa Copies'
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
      "fixed right-0 top-16 h-[calc(100vh-4rem)] bg-card border-l shadow-lg transition-all duration-300 z-[100000] overflow-y-auto",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Toggle Button - Fixed positioning for better visibility */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "fixed top-24 h-16 w-10 rounded-l-lg rounded-r-none border border-r-0 bg-card shadow-xl hover:bg-accent transition-all duration-300 z-[100001]",
          isCollapsed ? "right-12" : "right-80"
        )}
        onClick={toggleCollapsed}
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
              setActiveTab('events');
              toggleCollapsed();
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
              setActiveTab('documents');
              toggleCollapsed();
            }}
            title="View Documents"
          >
            <FileText className="h-6 w-6 text-muted-foreground" />
            <Badge className="writing-mode-vertical text-[10px] px-1 py-2">Docs</Badge>
          </div>
        </div>
      )}

      {/* Expanded State with Tabs */}
      {!isCollapsed && (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="events" className="text-xs">
              <User className="h-4 w-4 mr-1" />
              Events
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              <FileText className="h-4 w-4 mr-1" />
              Documents
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
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
        </TabsContent>

        {/* Documents Tab Content */}
        <TabsContent value="documents" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {productType ? (
            <Card className="border-primary/20">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">{getProductTitle()}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {documentCategories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <AccordionItem key={index} value={`doc-${index}`} className="border-b last:border-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${category.color}`} />
                            <span className="text-xs font-medium">{category.title}</span>
                            <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                              {category.count}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 pl-6">
                            {category.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Select a product to view required documents
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};
