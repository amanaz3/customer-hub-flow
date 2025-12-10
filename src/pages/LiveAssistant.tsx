import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, FileText, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { formatCustomerReferenceWithPrefix } from '@/utils/referenceNumberFormatter';
import LiveAssistantPanel from '@/components/LiveAssistant/LiveAssistantPanel';
import { cn } from '@/lib/utils';

interface CustomerWithStats {
  id: string;
  name: string;
  company: string;
  email: string;
  mobile: string;
  reference_number: number;
  created_at: string;
  updated_at: string;
  application_count: number;
  last_activity: string;
}

const LiveAssistant = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerListExpanded, setIsCustomerListExpanded] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [user?.id, isAdmin]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          company,
          email,
          mobile,
          reference_number,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data: customersData, error: customersError } = await query;
      if (customersError) throw customersError;

      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { count } = await supabase
            .from('account_applications')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id);

          return {
            ...customer,
            application_count: count || 0,
            last_activity: customer.updated_at
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [customers, searchTerm]);

  const maxReferenceNumber = useMemo(() => 
    Math.max(...customers.map(c => c.reference_number), 0),
    [customers]
  );

  const handleReplySelected = (text: string) => {
    toast({
      title: "Reply Selected",
      description: text,
    });
  };

  const handleSaveToCRM = () => {
    toast({
      title: "Saved to CRM",
      description: "Call summary has been saved successfully.",
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Collapsible Customer List Sidebar */}
      <div 
        className={cn(
          "border-r border-border bg-card transition-all duration-300 ease-in-out flex flex-col",
          isCustomerListExpanded ? "w-[500px]" : "w-16"
        )}
      >
        {/* Toggle Button */}
        <div className="p-2 border-b border-border flex items-center justify-between">
          {isCustomerListExpanded && (
            <span className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({filteredCustomers.length})
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCustomerListExpanded(!isCustomerListExpanded)}
            className={cn(!isCustomerListExpanded && "mx-auto")}
          >
            {isCustomerListExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsed State - Icon List */}
        {!isCustomerListExpanded && (
          <div className="flex-1 overflow-auto py-2">
            {filteredCustomers.slice(0, 20).map((customer) => (
              <Button
                key={customer.id}
                variant="ghost"
                size="icon"
                className="w-full h-12 rounded-none"
                onClick={() => navigate(`/customers/${customer.id}`)}
                title={`${customer.company} - ${customer.name}`}
              >
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}

        {/* Expanded State - Full List */}
        {isCustomerListExpanded && (
          <div className="flex-1 overflow-auto p-3 space-y-3">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
            
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{customer.company}</div>
                        <div className="text-xs text-muted-foreground truncate">{customer.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.mobile}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-primary">
                        {customer.application_count} apps
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Live Assistant Panel (Full Width) */}
      <div className="flex-1 overflow-hidden">
        <LiveAssistantPanel 
          onReplySelected={handleReplySelected}
          onSaveToCRM={handleSaveToCRM}
          fullWidth
        />
      </div>
    </div>
  );
};

export default memo(LiveAssistant);
