import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebflow } from '@/contexts/WebflowContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleStepLayoutProps {
  children: ReactNode;
  step: number;
  title: string;
  subtitle?: string;
  nextPath?: string;
  prevPath?: string;
  showNext?: boolean;
  showPrev?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  backgroundVariant?: 'primary' | 'secondary' | 'accent' | 'gradient';
}

const stepPaths = [
  '/webflow-simple/country',
  '/webflow-simple/intent',
  '/webflow-simple/jurisdiction',
  '/webflow-simple/activity',
  '/webflow-simple/plans',
  '/webflow-simple/payment',
  '/webflow-simple/details',
  '/webflow-simple/bookkeeping',
  '/webflow-simple/dashboard',
];

export const SimpleStepLayout: React.FC<SimpleStepLayoutProps> = ({
  children,
  step,
  title,
  subtitle,
  nextPath,
  prevPath,
  showNext = true,
  showPrev = true,
  nextLabel = 'Continue',
  onNext,
  backgroundVariant = 'primary',
}) => {
  const navigate = useNavigate();
  const { canProceed, nextStep, prevStep, state, updateState } = useWebflow();

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
    updateState({ currentStep: step + 1 });
    nextStep();
    if (nextPath) {
      navigate(nextPath);
    }
  };

  const handlePrev = () => {
    updateState({ currentStep: step - 1 });
    prevStep();
    if (prevPath) {
      navigate(prevPath);
    }
  };

  const bgClasses = {
    primary: 'bg-gradient-to-br from-primary/5 via-background to-primary/10',
    secondary: 'bg-gradient-to-br from-secondary/20 via-background to-secondary/10',
    accent: 'bg-gradient-to-br from-accent/10 via-background to-accent/20',
    gradient: 'bg-gradient-to-br from-primary/10 via-background to-accent/10',
  };

  return (
    <div className={cn("min-h-screen flex flex-col", bgClasses[backgroundVariant])}>
      {/* Progress bar */}
      <div className="w-full bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 9</span>
            <span className="text-sm font-medium text-primary">{Math.round((step / 9) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {stepPaths.map((path, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i + 1 <= Math.max(...state.completedSteps, state.currentStep)) {
                    updateState({ currentStep: i + 1 });
                    navigate(path);
                  }
                }}
                disabled={i + 1 > Math.max(...state.completedSteps, state.currentStep)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-medium transition-all",
                  i + 1 === step && "bg-primary text-primary-foreground scale-110 shadow-lg",
                  i + 1 < step && "bg-primary/20 text-primary hover:bg-primary/30",
                  i + 1 > step && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Step content */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border p-8 mb-8">
            {children}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {showPrev && step > 1 ? (
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePrev}
                className="gap-2 hover:bg-background/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : <div />}

            {showNext && (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed}
                className="gap-2 min-w-[160px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
              >
                {nextLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trust footer */}
      <div className="bg-background/80 backdrop-blur-sm border-t py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Secure & Encrypted
          </span>
          <span>•</span>
          <span>Trusted by 5,000+ businesses</span>
          <span>•</span>
          <span>UAE Licensed</span>
        </div>
      </div>
    </div>
  );
};
