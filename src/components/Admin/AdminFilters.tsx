import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { Search, Filter, X, Users, User } from 'lucide-react';

interface AdminFiltersProps {
  customers: Customer[];
  onFilteredCustomers: (filtered: Customer[]) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ customers, onFilteredCustomers }) => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [showMySubmissions, setShowMySubmissions] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, { name: string; email: string }>>({});

  // Fetch user profiles for agent names
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email');
        
        if (error) throw error;
        
        const profileMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = { name: profile.name, email: profile.email };
          return acc;
        }, {} as Record<string, { name: string; email: string }>);
        
        setUserProfiles(profileMap);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    if (isAdmin) {
      fetchUserProfiles();
    }
  }, [isAdmin]);

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.company.toLowerCase().includes(term) ||
        customer.mobile.includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // My submissions filter (admin only)
    if (showMySubmissions && user) {
      filtered = filtered.filter(customer => customer.user_id === user.id);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      if (agentFilter === 'system') {
        filtered = filtered.filter(customer => !customer.user_id);
      } else {
        filtered = filtered.filter(customer => customer.user_id === agentFilter);
      }
    }

    onFilteredCustomers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAgentFilter('all');
    setShowMySubmissions(false);
    onFilteredCustomers(customers);
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(customers.map(c => c.status))]
      .filter(status => status !== 'Complete' && status !== 'Paid' && status !== 'Rejected');
    return statuses.sort();
  };

  const getUniqueAgents = () => {
    const agentIds = [...new Set(customers.map(c => c.user_id).filter(Boolean))];
    return agentIds;
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || agentFilter !== 'all' || showMySubmissions;
  
  // Auto-apply filters when any filter changes
  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, agentFilter, showMySubmissions, customers]);

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Admin Filters & Search
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, company, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {getUniqueStatuses().map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Manager</label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  {getUniqueAgents().map(agentId => {
                    const profile = userProfiles[agentId];
                    const displayName = profile ? profile.name : `User ${agentId?.substring(0, 8)}...`;
                    return (
                      <SelectItem key={agentId} value={agentId}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* My Submissions Toggle */}
            <div className="flex items-end">
              <Button
                variant={showMySubmissions ? "default" : "outline"}
                onClick={() => setShowMySubmissions(!showMySubmissions)}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                My Submissions
              </Button>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchTerm && (
                <Badge variant="outline" className="gap-1">
                  Search: "{searchTerm}"
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  Status: {statusFilter}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setStatusFilter('all')}
                  />
                </Badge>
              )}
              
              {agentFilter !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  Manager: {agentFilter === 'system' ? 'System' : 
                    userProfiles[agentFilter]?.name || `User ${agentFilter?.substring(0, 8)}...`}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setAgentFilter('all')}
                  />
                </Badge>
              )}
              
              {showMySubmissions && (
                <Badge variant="outline" className="gap-1">
                  My Submissions
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setShowMySubmissions(false)}
                  />
                </Badge>
              )}
            </div>
          )}
          
          {/* Results Count */}
          <div className="text-sm text-gray-600 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                Showing {customers.length} of {customers.length} applications
                {hasActiveFilters && " (filtered)"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFilters;