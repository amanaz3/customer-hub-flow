import { Check, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
  isComplete?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-3 py-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionClick(section.id)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-none border-b-3 text-xs font-medium transition-all whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground",
                section.isActive 
                  ? "border-b-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" 
                  : section.isComplete
                  ? "border-b-green-300 bg-green-50/50 text-green-600 dark:bg-green-950/50 dark:text-green-500"
                  : "border-b-transparent text-muted-foreground"
              )}
            >
              {/* Icon indicator */}
              {section.isComplete ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : section.isActive ? (
                <CircleDot className="h-3 w-3 flex-shrink-0" />
              ) : (
                <Circle className="h-3 w-3 flex-shrink-0" />
              )}
              
              {/* Section label */}
              <span className="hidden sm:inline">{section.label}</span>
              
              {/* Mobile: Show only number */}
              <span className="sm:hidden">{index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
