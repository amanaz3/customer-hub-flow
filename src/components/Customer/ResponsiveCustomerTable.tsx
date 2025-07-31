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
    <Card className="responsive-transition hover:shadow-md touch-friendly">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-card-foreground truncate">
                {customer.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {customer.company}
              </p>
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{customer.mobile}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>

          {customer.amount && (
            <div className="flex items-center space-x-2 text-xs">
              <DollarSign className="h-3 w-3 flex-shrink-0 text-green-600" />
              <span className="font-medium text-green-700">
                ${customer.amount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{new Date(customer.created_at || '').toLocaleDateString()}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClick(customer.id)}
            className="h-8 w-8 p-0 touch-friendly"
          >
            <ChevronRight className="h-4 w-4" />
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
  submittedBy 
}: { 
  customer: Customer; 
  onClick: (id: string) => void;
  submittedBy?: string;
}) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 responsive-transition"
      onClick={() => onClick(customer.id)}
    >
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>{customer.mobile}</TableCell>
      <TableCell className="max-w-[200px] truncate">{customer.company}</TableCell>
      <TableCell className="max-w-[180px] truncate">{submittedBy || 'N/A'}</TableCell>
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="text-right font-medium">
        {customer.amount ? `$${customer.amount.toLocaleString()}` : '-'}
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
      />
    ));
  }, [customers, handleItemClick, isMobile, userProfiles]);

  if (customers.length === 0) {
    return (
      <Card className="responsive-transition">
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">
            No customers found
          </h3>
          <p className="text-muted-foreground">
            {isMobile ? "Try adjusting your filters." : "Get started by creating your first customer application."}
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
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Customer Name</TableHead>
              <TableHead className="min-w-[100px]">Mobile</TableHead>
              <TableHead className="min-w-[150px]">Company Name</TableHead>
              <TableHead className="min-w-[130px]">Submitted by</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="text-right min-w-[100px]">Amount</TableHead>
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