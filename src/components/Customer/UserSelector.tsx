import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Search, Users, Loader2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface UserSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showWorkload?: boolean;
  excludeUserIds?: string[];
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select a user...",
  showWorkload = false,
  excludeUserIds = []
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [workload, setWorkload] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    if (showWorkload) {
      fetchWorkload();
    }
  }, [showWorkload]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const filteredUsers = (data || []).filter(user => 
        !excludeUserIds.includes(user.id)
      );
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkload = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('user_id')
        .in('status', ['Draft', 'Submitted', 'Returned', 'Sent to Bank', 'Need More Info']);

      if (error) throw error;

      const workloadCount = (data || []).reduce((acc, customer) => {
        if (customer.user_id) {
          acc[customer.user_id] = (acc[customer.user_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      setWorkload(workloadCount);
    } catch (error) {
      console.error('Error fetching workload:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWorkloadBadgeVariant = (count: number) => {
    if (count === 0) return 'secondary';
    if (count <= 5) return 'default';
    if (count <= 10) return 'secondary';
    return 'destructive';
  };

  const getWorkloadColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 5) return 'text-blue-600';
    if (count <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <SelectItem 
                  key={user.id} 
                  value={user.id}
                  className="p-3 cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {showWorkload && (
                      <div className="flex items-center gap-2 ml-2">
                        <Badge 
                          variant={getWorkloadBadgeVariant(workload[user.id] || 0)}
                          className="text-xs"
                        >
                          {workload[user.id] || 0} apps
                        </Badge>
                        <div className={`text-xs font-medium ${getWorkloadColor(workload[user.id] || 0)}`}>
                          {workload[user.id] === 0 ? 'Available' :
                           workload[user.id] <= 5 ? 'Light' :
                           workload[user.id] <= 10 ? 'Moderate' : 'Heavy'}
                        </div>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Selected user info */}
      {value && (
        <div className="text-xs text-muted-foreground">
          {(() => {
            const selectedUser = users.find(u => u.id === value);
            const currentWorkload = workload[value] || 0;
            
            if (!selectedUser) return null;
            
            return (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <span>Selected: {selectedUser.name}</span>
                {showWorkload && (
                  <>
                    <span>•</span>
                    <span className={getWorkloadColor(currentWorkload)}>
                      Current workload: {currentWorkload} applications
                    </span>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};