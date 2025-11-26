import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationErrorAccordionProps {
  errors: string[];
  autoDismissDelay?: number; // milliseconds, default 5000
  onDismiss?: () => void;
}

export const ValidationErrorAccordion: React.FC<ValidationErrorAccordionProps> = ({
  errors,
  autoDismissDelay = 5000,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (errors.length === 0) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setIsExpanded(true);
    setProgress(100);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (autoDismissDelay / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Auto dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissDelay);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(dismissTimer);
    };
  }, [errors, autoDismissDelay, onDismiss]);

  if (!isVisible || errors.length === 0) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-24 right-6 z-[9999] w-80 max-w-[calc(100vw-3rem)]",
        "animate-in slide-in-from-right-5 fade-in duration-300"
      )}
    >
      <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">
        {/* Progress bar */}
        <div className="h-1 bg-red-200 dark:bg-red-900">
          <div 
            className="h-full bg-red-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              {errors.length} Validation {errors.length === 1 ? 'Error' : 'Errors'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                onDismiss?.();
              }}
              className="p-0.5 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Expandable content */}
        <div 
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-48" : "max-h-0"
          )}
        >
          <div className="px-3 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
            {errors.map((error, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300"
              >
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 font-medium text-[10px]">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{error}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
