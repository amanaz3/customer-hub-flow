import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Check, Loader2, Shield, Sparkles } from 'lucide-react';

const planPrices: Record<string, number> = {
  starter: 5500,
  business: 8500,
  complete: 14500,
};

const planNames: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  complete: 'Complete',
};

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateState, nextStep } = useWebflow();
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const price = planPrices[state.selectedPlan] || 0;
  const vat = price * 0.05;
  const total = price + vat;

  const handlePayment = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateState({
      paymentCompleted: true,
      paymentReference: `PAY-${Date.now()}`,
      currentStep: 7,
    });
    nextStep();
    setProcessing(false);
    navigate('/webflow-simple/details');
  };

  if (state.paymentCompleted) {
    return (
      <SimpleStepLayout
        step={6}
        title="Payment Successful!"
        subtitle="Your payment has been processed"
        nextPath="/webflow-simple/details"
        prevPath="/webflow-simple/plans"
        showPrev={false}
        backgroundVariant="accent"
      >
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-4">
            Reference: <span className="font-mono font-medium">{state.paymentReference}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            Continue to provide your details
          </div>
        </div>
      </SimpleStepLayout>
    );
  }

  return (
    <SimpleStepLayout
      step={6}
      title="Complete Payment"
      subtitle="Secure payment powered by Stripe"
      prevPath="/webflow-simple/plans"
      showNext={false}
      backgroundVariant="accent"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {planNames[state.selectedPlan]} Plan
              </span>
              <span className="font-medium">AED {price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT (5%)</span>
              <span>AED {vat.toLocaleString()}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">AED {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Card Number</Label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="h-14 text-lg border-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="h-14 text-lg border-2"
              />
            </div>
            <div className="space-y-2">
              <Label>CVV</Label>
              <Input
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="h-14 text-lg border-2"
                type="password"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={processing || !cardNumber || !expiry || !cvv}
          className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Pay AED {total.toLocaleString()}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            256-bit SSL
          </span>
          <span>•</span>
          <span>PCI Compliant</span>
          <span>•</span>
          <span>Secure Checkout</span>
        </div>
      </div>
    </SimpleStepLayout>
  );
};
