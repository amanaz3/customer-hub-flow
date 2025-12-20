import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  User, 
  Shield, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  FileText,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
}

const OnboardingWizard: React.FC<Props> = ({ isOpen, onClose, demoMode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    tradeLicense: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    selectedBank: '',
    consentGiven: false,
  });

  const totalSteps = 4;

  const steps = [
    { id: 1, title: 'Business Info', icon: Building2 },
    { id: 2, title: 'Owner Details', icon: User },
    { id: 3, title: 'Consent', icon: Shield },
    { id: 4, title: 'Connect Bank', icon: CreditCard },
  ];

  const uaeBanks = [
    { id: 'enbd', name: 'Emirates NBD', logo: '🏦' },
    { id: 'adcb', name: 'ADCB', logo: '🏛️' },
    { id: 'fab', name: 'First Abu Dhabi Bank', logo: '🏦' },
    { id: 'mashreq', name: 'Mashreq Bank', logo: '🏦' },
    { id: 'cbd', name: 'Commercial Bank of Dubai', logo: '🏛️' },
    { id: 'dib', name: 'Dubai Islamic Bank', logo: '🕌' },
    { id: 'rakbank', name: 'RAKBANK', logo: '🏦' },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">KYC Verification</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    We need some basic information about your business to comply with UAE banking regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., ABC Trading LLC"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeLicense">Trade License Number *</Label>
              <Input
                id="tradeLicense"
                placeholder="e.g., 123456"
                value={formData.tradeLicense}
                onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Jurisdiction</Label>
              <Select defaultValue="dubai">
                <SelectTrigger>
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dubai">Dubai DED</SelectItem>
                  <SelectItem value="dubai-freezone">Dubai Free Zone</SelectItem>
                  <SelectItem value="abudhabi">Abu Dhabi DED</SelectItem>
                  <SelectItem value="sharjah">Sharjah DED</SelectItem>
                  <SelectItem value="rak">RAK Free Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner / Authorized Signatory Name *</Label>
              <Input
                id="ownerName"
                placeholder="Full name as per Emirates ID"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email Address *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="email@company.com"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerMobile">Mobile Number *</Label>
              <div className="flex gap-2">
                <Select defaultValue="+971">
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+971">+971</SelectItem>
                    <SelectItem value="+966">+966</SelectItem>
                    <SelectItem value="+965">+965</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="ownerMobile"
                  placeholder="50 123 4567"
                  className="flex-1"
                  value={formData.ownerMobile}
                  onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Emirates ID (Optional)</Label>
              <Input placeholder="784-XXXX-XXXXXXX-X" />
              <p className="text-xs text-muted-foreground">
                Required for enhanced verification and higher transaction limits
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Data Access Consent
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                By connecting your bank account, you authorize us to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span>View your account balances and details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span>Access transaction history for bookkeeping</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span>Categorize transactions for VAT reporting</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium">Your Data is Secure</p>
                  <p className="text-sm text-muted-foreground">
                    We use Lean Technologies' secure Open Banking infrastructure. Your bank credentials 
                    are never stored on our servers. You can revoke access at any time.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="consent" 
                  checked={formData.consentGiven}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, consentGiven: checked as boolean })
                  }
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  I consent to the data access outlined above and agree to the{' '}
                  <a href="#" className="text-primary underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-primary underline">Privacy Policy</a>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="uae-regulations" defaultChecked />
                <Label htmlFor="uae-regulations" className="text-sm leading-relaxed cursor-pointer">
                  I understand that this service complies with UAE Central Bank Open Banking regulations
                </Label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 py-4">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">Select Your Bank</h3>
              <p className="text-sm text-muted-foreground">
                Choose your UAE bank to connect via Lean's secure platform
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {uaeBanks.map((bank) => (
                <Button
                  key={bank.id}
                  variant={formData.selectedBank === bank.id ? 'default' : 'outline'}
                  className={`h-auto py-4 flex-col gap-2 ${
                    formData.selectedBank === bank.id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:border-primary'
                  }`}
                  onClick={() => setFormData({ ...formData, selectedBank: bank.id })}
                >
                  <span className="text-2xl">{bank.logo}</span>
                  <span className="text-xs text-center">{bank.name}</span>
                </Button>
              ))}
            </div>

            {formData.selectedBank && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                <p className="text-sm">
                  <strong>Next:</strong> You'll be redirected to{' '}
                  {uaeBanks.find(b => b.id === formData.selectedBank)?.name}'s secure login page 
                  to authorize the connection.
                </p>
              </div>
            )}

            {demoMode && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">
                    Demo Mode
                  </Badge>
                  <span className="text-sm">Bank connection will be simulated</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Connect Your Bank Account</DialogTitle>
          <DialogDescription>
            Complete the setup to start syncing your UAE bank transactions
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-1" />
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!formData.selectedBank}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Connect Bank
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
