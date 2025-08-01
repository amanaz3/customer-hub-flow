import React, { memo, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Building2, 
  Mail, 
  Calendar, 
  DollarSign,
  ChevronRight,
  User
} from 'lucide-react';

interface ResponsiveCustomerTableProps {
  customers: Customer[];
  onDataChange?: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'complete': return 'bg-status-complete text-status-complete-foreground';
      case 'approved': return 'bg-status-approved text-status-approved-foreground';
      case 'submitted': return 'bg-status-submitted text-status-submitted-foreground';
      case 'returned': return 'bg-status-returned text-status-returned-foreground';
      case 'rejected': return 'bg-status-rejected text-status-rejected-foreground';
      default: return 'bg-status-draft text-status-draft-foreground';
    }
  };

  return (
    <Badge className={cn("text-xs font-medium", getStatusVariant(status))}>
      {status}
    </Badge>
  );
});

// Mobile card component
const MobileCustomerCard = memo(({ 
  customer, 
  onClick 
}: { 
  customer: Customer; 
  onClick: (id: string) => void;
}) => {
  return (
    <Card className="group enhanced-card hover:shadow-lg touch-friendly border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20 group-hover:ring-primary/30 transition-all duration-300">
              <User className="h-4 w-4 text-primary flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-card-foreground truncate group-hover:text-primary transition-colors">
                {customer.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate font-medium">
                {customer.company}
              </p>
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center space-x-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <Phone className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span className="truncate font-medium">{customer.mobile}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <Mail className="h-4 w-4 flex-shrink-0 text-purple-500" />
            <span className="truncate font-medium">{customer.email}</span>
          </div>

          {customer.amount && (
            <div className="flex items-center space-x-3 text-sm p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <DollarSign className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="font-bold text-green-700 dark:text-green-400">
                ${customer.amount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0 text-indigo-500" />
            <span className="font-medium">{new Date(customer.created_at || '').toLocaleDateString()}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClick(customer.id)}
            className="h-9 w-9 p-0 touch-friendly rounded-lg enhanced-button bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300"
          >
            <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Desktop table row component
const DesktopCustomerRow = memo(({ 
  customer, 
  onClick,
  submittedBy,
  isAdmin 
}: { 
  customer: Customer; 
  onClick: (id: string) => void;
  submittedBy?: string;
  isAdmin: boolean;
}) => {
  return (
    <TableRow 
      className="group cursor-pointer hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10 responsive-transition border-b border-border/30 hover:border-border/60"
      onClick={() => onClick(customer.id)}
    >
      <TableCell className="font-semibold text-foreground group-hover:text-primary transition-colors py-4">
        {customer.name}
      </TableCell>
      <TableCell className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {customer.mobile}
      </TableCell>
      <TableCell className="max-w-[200px] truncate font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {customer.company}
      </TableCell>
      {isAdmin && (
        <TableCell className="max-w-[180px] truncate font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {submittedBy || 'N/A'}
        </TableCell>
      )}
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="text-right font-bold text-foreground">
        {customer.amount ? (
          <span className="text-green-600 dark:text-green-400">
            ${customer.amount.toLocaleString()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );
});

const ResponsiveCustomerTable: React.FC<ResponsiveCustomerTableProps> = ({ 
  customers, 
  onDataChange 
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [userProfiles, setUserProfiles] = useState<{[key: string]: UserProfile}>({});

  // Fetch user profiles for admin view
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchUserProfiles = async () => {
      const uniqueUserIds = [...new Set(customers.map(c => c.user_id).filter(Boolean))];
      
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueUserIds);
        
        if (profiles) {
          const profileMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as {[key: string]: UserProfile});
          setUserProfiles(profileMap);
        }
      }
    };

    fetchUserProfiles();
  }, [customers, isAdmin]);

  const handleItemClick = useMemo(() => 
    (id: string) => navigate(`/customers/${id}`), 
    [navigate]
  );

  // Set up real-time subscription for customer updates
  useRealtimeSubscription({
    table: 'customers',
    onUpdate: () => {
      console.log('Customer data updated, refreshing...');
      if (onDataChange) {
        onDataChange();
      }
    }
  });

  const renderedItems = useMemo(() => {
    if (isMobile) {
      return customers.map((customer) => (
        <MobileCustomerCard 
          key={customer.id}
          customer={customer}
          onClick={handleItemClick}
        />
      ));
    }

    return customers.map((customer) => (
      <DesktopCustomerRow 
        key={customer.id}
        customer={customer}
        onClick={handleItemClick}
        submittedBy={customer.user_id ? userProfiles[customer.user_id]?.name : undefined}
        isAdmin={isAdmin}
      />
    ));
  }, [customers, handleItemClick, isMobile, userProfiles]);

  if (customers.length === 0) {
    return (
      <Card className="enhanced-card border-0 text-center">
        <CardContent className="p-12">
          <div className="relative mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 mx-auto w-fit">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl blur-xl opacity-50"></div>
          </div>
          <h3 className="text-xl font-bold text-card-foreground mb-3">
            No customers found
          </h3>
          <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            {isMobile ? "Try adjusting your filters or search terms." : "Get started by creating your first customer application to begin managing your business."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {renderedItems}
      </div>
    );
  }

  return (
    <div className="enhanced-card rounded-xl border-0 overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
              <TableHead className="min-w-[120px] font-semibold text-foreground/80 h-12">Customer Name</TableHead>
              <TableHead className="min-w-[100px] font-semibold text-foreground/80">Mobile</TableHead>
              <TableHead className="min-w-[150px] font-semibold text-foreground/80">Company Name</TableHead>
              {isAdmin && <TableHead className="min-w-[130px] font-semibold text-foreground/80">Submitted by</TableHead>}
              <TableHead className="min-w-[80px] font-semibold text-foreground/80">Status</TableHead>
              <TableHead className="text-right min-w-[100px] font-semibold text-foreground/80">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderedItems}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default memo(ResponsiveCustomerTable);