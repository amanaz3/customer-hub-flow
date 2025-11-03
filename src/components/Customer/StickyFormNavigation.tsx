import { Check, Circle, CircleDot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
  isComplete?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  hasError?: boolean;
}

interface StickyFormNavigationProps {
  sections: Section[];
  onSectionClick: (sectionId: string) => void;
}

export const StickyFormNavigation = ({ sections, onSectionClick }: StickyFormNavigationProps) => {
  // Filter only visible sections
  const visibleSections = sections.filter(s => s.isVisible !== false);

  if (visibleSections.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-lg">
      <div className="max-w-4xl mx-auto px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {visibleSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionClick(section.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap",
                "hover:scale-105 active:scale-95",
                section.hasError
                  ? "bg-gradient-to-br from-destructive/15 to-destructive/10 text-destructive border border-destructive/40 animate-pulse"
                  : section.isActive 
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                  : section.isComplete
                  ? "bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400 border border-green-500/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              )}
            >
              {/* Icon indicator with animation */}
              <div className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                section.hasError ? "bg-destructive text-white p-0.5" :
                section.isComplete ? "bg-green-500 text-white p-0.5" : 
                section.isActive ? "bg-primary-foreground/20 p-0.5" :
                "p-0"
              )}>
                {section.hasError ? (
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                ) : section.isComplete ? (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 animate-in zoom-in duration-200" />
                ) : section.isActive ? (
                  <CircleDot className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                ) : (
                  <Circle className="h-3 w-3 flex-shrink-0" />
                )}
              </div>
              
              {/* Section label */}
              <span className="hidden sm:inline font-semibold">{section.label}</span>
              
              {/* Mobile: Show only number */}
              <span className="sm:hidden font-bold">{index + 1}</span>

              {/* Active indicator glow */}
              {section.isActive && !section.hasError && (
                <div className="absolute inset-0 rounded-lg bg-primary/5 blur-sm -z-10 animate-pulse" />
              )}
              
              {/* Error indicator glow */}
              {section.hasError && (
                <div className="absolute inset-0 rounded-lg bg-destructive/10 blur-md -z-10 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
