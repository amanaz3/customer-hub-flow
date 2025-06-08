
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md', 
  showText = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto'
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <img 
        src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
        alt="Amana Corporate" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className="font-semibold text-gray-800">
          Amana Corporate
        </span>
      )}
    </div>
  );
};

export default Logo;
