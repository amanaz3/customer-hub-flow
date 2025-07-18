
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { generateSecurePassword, validatePasswordStrength } from '@/utils/passwordUtils';
import { useToast } from '@/hooks/use-toast';

interface SecurePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordSet: (password: string) => void;
  userName: string;
}

const SecurePasswordDialog: React.FC<SecurePasswordDialogProps> = ({
  open,
  onOpenChange,
  onPasswordSet,
  userName
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && !useCustomPassword) {
      generateNewPassword();
    }
  }, [open, useCustomPassword]);

  const generateNewPassword = () => {
    const newPassword = generateSecurePassword(12);
    setPassword(newPassword);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Password Copied",
        description: "Password has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy password to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = () => {
    if (useCustomPassword) {
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        toast({
          title: "Weak Password",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }
    }

    onPasswordSet(password);
    onOpenChange(false);
    setPassword('');
    setUseCustomPassword(false);
  };

  const passwordValidation = validatePasswordStrength(password);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Password for {userName}</DialogTitle>
          <DialogDescription>
            Choose a secure password for the new user account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="auto-generate"
              name="password-type"
              checked={!useCustomPassword}
              onChange={() => setUseCustomPassword(false)}
              className="w-4 h-4"
            />
            <Label htmlFor="auto-generate">Auto-generate secure password</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="custom-password"
              name="password-type"
              checked={useCustomPassword}
              onChange={() => setUseCustomPassword(true)}
              className="w-4 h-4"
            />
            <Label htmlFor="custom-password">Set custom password</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={!useCustomPassword}
                  className="pr-20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-6 w-6 p-0"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {!useCustomPassword && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateNewPassword}
                  className="px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {useCustomPassword && !passwordValidation.isValid && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <li key={`error-${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              The user will need to change this password on their first login for security.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            aria-label="Cancel password reset"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            aria-label="Confirm password reset"
            disabled={useCustomPassword && !passwordValidation.isValid}
          >
            Set Password & Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurePasswordDialog;
