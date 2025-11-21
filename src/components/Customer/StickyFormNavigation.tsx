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
  sidebarCollapsed?: boolean;
}

export const StickyFormNavigation = ({ sections, onSectionClick, sidebarCollapsed = false }: StickyFormNavigationProps) => {
  // Filter only visible sections
  const visibleSections = sections.filter(s => s.isVisible !== false);

  if (visibleSections.length === 0) return null;

  return (
    <div 
      className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-lg"
      style={{
        marginRight: sidebarCollapsed ? '3rem' : '20rem'
      }}
    >
      <div className="w-full px-3 py-2">
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
                  ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-md shadow-success/20 border border-success/30" 
                  : section.isComplete
                  ? "bg-gradient-to-br from-success/15 to-success/10 text-success dark:text-success border border-success/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              )}
            >
              {/* Icon indicator with animation */}
              <div className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                section.hasError ? "bg-destructive text-white p-0.5" :
                section.isComplete ? "bg-success/50 text-success-foreground p-0.5" : 
                section.isActive ? "bg-success-foreground/20 p-0.5" :
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
                <div className="absolute inset-0 rounded-lg bg-success/5 blur-sm -z-10 animate-pulse" />
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
