import React, { useState } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Check, Loader2 } from 'lucide-react';

const planPrices: Record<string, number> = {
  starter: 5500,
  business: 8500,
  complete: 14500,
};

export const PaymentStep: React.FC = () => {
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
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateState({
      paymentCompleted: true,
      paymentReference: `PAY-${Date.now()}`,
    });
    setProcessing(false);
    nextStep();
  };

  if (state.paymentCompleted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Reference: {state.paymentReference}
          </p>
          <Button onClick={nextStep}>Continue to Next Step</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
        <CardDescription className="text-base">
          Secure payment powered by Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {state.selectedPlan.charAt(0).toUpperCase() + state.selectedPlan.slice(1)} Plan
            </span>
            <span>AED {price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (5%)</span>
            <span>AED {vat.toLocaleString()}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>AED {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Card Number</Label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>CVV</Label>
              <Input
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="h-12"
                type="password"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={processing || !cardNumber || !expiry || !cvv}
          className="w-full h-12"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay AED {total.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Your payment is secured with 256-bit SSL encryption
        </p>
      </CardContent>
    </Card>
  );
};
