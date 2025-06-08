
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Eye, EyeOff, Key, RotateCcw } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface PasswordManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  action: 'reset' | 'change';
}

const PasswordManagementDialog: React.FC<PasswordManagementDialogProps> = ({
  isOpen,
  onClose,
  user,
  action
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetUserPassword, changeUserPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = action === 'reset' 
        ? await resetUserPassword(user.id, password)
        : await changeUserPassword(user.id, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} password`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Password ${action === 'reset' ? 'reset' : 'changed'} successfully for ${user.name}`,
        });
        handleClose();
      }
    } catch (error) {
      console.error(`${action} password error:`, error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    onClose();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setConfirmPassword(result);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {action === 'reset' ? <RotateCcw className="h-5 w-5" /> : <Key className="h-5 w-5" />}
            <span>{action === 'reset' ? 'Reset' : 'Change'} Password</span>
          </DialogTitle>
          <DialogDescription>
            {action === 'reset' ? 'Reset' : 'Change'} password for {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isLoading}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isLoading}
              required
              minLength={8}
              className="mt-1"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={generateRandomPassword}
            disabled={isLoading}
            className="w-full"
          >
            Generate Random Password
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : `${action === 'reset' ? 'Reset' : 'Change'} Password`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordManagementDialog;
