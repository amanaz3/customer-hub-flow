import React from 'react';
import { WebflowProvider, useWebflow } from '@/contexts/WebflowContext';
import { WebflowProgress } from '@/components/Webflow/WebflowProgress';
import { CountryStep } from '@/components/Webflow/steps/CountryStep';
import { BusinessIntentStep } from '@/components/Webflow/steps/BusinessIntentStep';
import { JurisdictionStep } from '@/components/Webflow/steps/JurisdictionStep';
import { BusinessActivityStep } from '@/components/Webflow/steps/BusinessActivityStep';
import { PlanPricingStep } from '@/components/Webflow/steps/PlanPricingStep';
import { PaymentStep } from '@/components/Webflow/steps/PaymentStep';
import { FounderDetailsStep } from '@/components/Webflow/steps/FounderDetailsStep';
import { BookkeepingTaxStep } from '@/components/Webflow/steps/BookkeepingTaxStep';
import { DashboardStep } from '@/components/Webflow/steps/DashboardStep';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

const WebflowContent: React.FC = () => {
  const { state, nextStep, prevStep, canProceed } = useWebflow();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1: return <CountryStep />;
      case 2: return <BusinessIntentStep />;
      case 3: return <JurisdictionStep />;
      case 4: return <BusinessActivityStep />;
      case 5: return <PlanPricingStep />;
      case 6: return <PaymentStep />;
      case 7: return <FounderDetailsStep />;
      case 8: return <BookkeepingTaxStep />;
      case 9: return <DashboardStep />;
      default: return <CountryStep />;
    }
  };

  const isPaymentStep = state.currentStep === 6;
  const isDashboard = state.currentStep === 9;

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Start Your UAE Business
          </h1>
          <p className="text-muted-foreground mt-2">
            Company formation, banking, and compliance made simple
          </p>
        </div>

        {/* Progress */}
        <WebflowProgress />

        {/* Current Step */}
        <div className="mt-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {!isDashboard && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={state.currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>

              {!isPaymentStep && (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Your progress is automatically saved</p>
          <p className="mt-1">
            Need help? <a href="#" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

const Webflow: React.FC = () => {
  return (
    <WebflowProvider>
      <WebflowContent />
    </WebflowProvider>
  );
};

export default Webflow;
