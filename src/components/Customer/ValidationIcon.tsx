import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidationIconProps {
  isValid: boolean;
  isError: boolean;
  show: boolean;
}

export const ValidationIcon = ({ isValid, isError, show }: ValidationIconProps) => {
  if (!show) return null;

  if (isValid) {
    return (
      <CheckCircle2 
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-scale-in" 
      />
    );
  }

  if (isError) {
    return (
      <XCircle 
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive animate-scale-in" 
      />
    );
  }

  return null;
};
