import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Shield, UserPlus, Trash2, MoreVertical, Key, RotateCcw } from 'lucide-react';
import PasswordManagementDialog from '@/components/Admin/PasswordManagementDialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(['admin', 'user']),
});

type FormValues = z.infer<typeof formSchema>;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

const SecureUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [passwordAction, setPasswordAction] = useState<'reset' | 'change'>('reset');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createUser, getUsers, deleteUser, user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  });

  const loadUsers = async () => {
    // Don't try to load users if auth is still loading or user is not admin
    if (authLoading || !isAdmin) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await getUsers();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load users when auth loading is complete and user is admin
    if (!authLoading && isAdmin) {
      loadUsers();
    }
  }, [authLoading, isAdmin]);

  // Set up real-time subscription for profiles table
  useRealtimeSubscription({
    table: 'profiles',
    onUpdate: loadUsers
  });

  const addUser = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { error } = await createUser(data.email, data.name, data.role);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      } else {
        setIsDialogOpen(false);
        form.reset();
        // Real-time subscription will automatically update the list
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot delete yourself",
        variant: "destructive",
      });
      return;
    }

    const userToRemove = users.find(user => user.id === userId);
    
    if (userToRemove?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      toast({
        title: "Error",
        description: "Cannot remove the last admin user",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await deleteUser(userId);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to remove user",
          variant: "destructive",
        });
      } else {
        toast({
          title: "User Removed",
          description: "User has been removed successfully",
        });
        // Real-time subscription will automatically update the list
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAction = (user: UserProfile, action: 'reset' | 'change') => {
    setSelectedUser(user);
    setPasswordAction(action);
    setPasswordDialogOpen(true);
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <MainLayout requiredRole="admin">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold">Secure User Management</h1>
            </div>
            <p className="text-muted-foreground">
              Manage user accounts and permissions. Users are activated immediately without email verification.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add New User</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account. The user will be activated immediately with a temporary password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(addUser)} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="role">User Role</Label>
                      <Select
                        defaultValue="user"
                        onValueChange={(value) => form.setValue('role', value as 'admin' | 'user')}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found. Add a new user to get started.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handlePasswordAction(user, 'reset')}
                              disabled={isLoading}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePasswordAction(user, 'change')}
                              disabled={isLoading}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeUser(user.id)}
                              disabled={isLoading || user.id === currentUser?.id}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PasswordManagementDialog
          isOpen={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          user={selectedUser}
          action={passwordAction}
        />
      </div>
    </MainLayout>
  );
};

export default SecureUserManagement;
