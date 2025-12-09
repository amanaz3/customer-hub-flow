import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SecureDeleteVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function SecureDeleteVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  title = "Security Verification Required",
  description = "Enter the secure deletion password to proceed. This password is known only to authorized personnel."
}: SecureDeleteVerificationDialogProps) {
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (!password.trim()) {
      toast.error("Please enter the security password");
      return;
    }

    if (attempts >= 3) {
      toast.error("Too many failed attempts. Please try again later.");
      onOpenChange(false);
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-delete-password', {
        body: { password }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Security verification passed");
        setPassword("");
        setAttempts(0);
        onVerified();
        onOpenChange(false);
      } else {
        setAttempts(prev => prev + 1);
        toast.error(`Invalid password. ${3 - attempts - 1} attempts remaining.`);
        setPassword("");
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">
              This action cannot be undone. All data will be permanently deleted.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secure-password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security Password
            </Label>
            <Input
              id="secure-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure deletion password"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              autoComplete="off"
            />
          </div>

          {attempts > 0 && (
            <p className="text-sm text-muted-foreground">
              Failed attempts: {attempts}/3
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleVerify}
            disabled={isVerifying || attempts >= 3}
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
