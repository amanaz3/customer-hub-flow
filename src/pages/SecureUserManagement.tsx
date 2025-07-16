import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Users, Shield, Trash2, Plus, Key } from 'lucide-react';
import SecurePasswordDialog from '@/components/Admin/SecurePasswordDialog';
import PasswordManagementDialog from '@/components/Admin/PasswordManagementDialog';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(['admin', 'user']),
});

type FormValues = z.infer<typeof formSchema>;

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

const SecureUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordManagementOpen, setIsPasswordManagementOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<FormValues | null>(null);
  const { toast } = useToast();
  const { createUser, deleteUser, getUsers } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  });

  // Load users from Supabase on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getUsers();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error", 
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (data: FormValues) => {
    // Store the form data and open password dialog
    setPendingUserData(data);
    setIsPasswordDialogOpen(true);
    setIsDialogOpen(false);
  };

  const handlePasswordSet = async (password: string) => {
    if (!pendingUserData) return;

    try {
      const { error } = await createUser(
        pendingUserData.email, 
        pendingUserData.name, 
        pendingUserData.role,
        password
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
        return;
      }

      // Reset form and pending data
      form.reset();
      setPendingUserData(null);
      
      // Refresh users list
      await fetchUsers();
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = (user: UserProfile) => {
    setSelectedUser(user);
    setIsPasswordManagementOpen(true);
  };

  const removeUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await deleteUser(userId);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      // Refresh users list
      await fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Add, edit, or remove users from the system
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account. You'll set a secure password in the next step.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        className="mt-1"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        className="mt-1"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        defaultValue="user"
                        onValueChange={(value) => form.setValue('role', value as 'admin' | 'user')}
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
                    <Button type="submit">Next: Set Password</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Password Dialog */}
        <SecurePasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsPasswordDialogOpen(open);
            if (!open) {
              setPendingUserData(null);
            }
          }}
          onPasswordSet={handlePasswordSet}
          userName={pendingUserData?.name || ''}
        />
        
        {/* Password Management Dialog */}
        <PasswordManagementDialog
          isOpen={isPasswordManagementOpen}
          onClose={() => {
            setIsPasswordManagementOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          action="change"
        />
        
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
                    Loading users...
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
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && <Shield className="w-4 h-4 text-blue-600" />}
                        <span className={`capitalize ${user.role === 'admin' ? 'text-blue-600 font-semibold' : ''}`}>
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePassword(user)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

export default SecureUserManagement;
