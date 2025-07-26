import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';

interface CustomerDetailsFormProps {
  customer: Customer;
  isEditable: boolean;
  isUserOwner: boolean;
  onUpdate: (formData: {
    name: string;
    mobile: string;
    company: string;
    email: string;
    leadSource: string;
    licenseType: string;
    amount: string;
    preferredBank?: string;
    annualTurnover?: string;
    jurisdiction?: string;
    customerNotes?: string;
  }) => void;
}

const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({
  customer,
  isEditable,
  isUserOwner,
  onUpdate,
}) => {
  const { isAdmin } = useAuth();
  
  // Determine if the current user can edit this customer
  const canEdit = isEditable && (isUserOwner || isAdmin);
  
  const [formData, setFormData] = useState({
    name: customer.name || '',
    mobile: customer.mobile || '',
    company: customer.company || '',
    email: customer.email || '',
    leadSource: customer.leadSource || 'Website',
    licenseType: customer.licenseType || 'Mainland',
    amount: customer.amount.toString() || '',
    preferredBank: customer.preferred_bank || '',
    annualTurnover: customer.annual_turnover?.toString() || '',
    jurisdiction: customer.jurisdiction || 'Mainland',
    customerNotes: customer.customer_notes || '',
  });

  const [anySuitableBank, setAnySuitableBank] = useState(
    customer.preferred_bank === 'Any Suitable Bank'
  );

  const [bankPreferences, setBankPreferences] = useState(() => {
    if (customer.preferred_bank && customer.preferred_bank !== 'Any Suitable Bank') {
      const banks = customer.preferred_bank.split(', ').filter(bank => bank.trim() !== '');
      return {
        bank1: banks[0] || '',
        bank2: banks[1] || '',
        bank3: banks[2] || '',
      };
    }
    return { bank1: '', bank2: '', bank3: '' };
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBankPreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankPreferences({
      ...bankPreferences,
      [name]: value,
    });
  };

  const handleAnySuitableBankChange = (checked: boolean | "indeterminate") => {
    setAnySuitableBank(checked === true);
  };

  const handleSubmit = () => {
    let preferredBank = '';
    if (anySuitableBank) {
      preferredBank = 'Any Suitable Bank';
    } else {
      const banks = [bankPreferences.bank1, bankPreferences.bank2, bankPreferences.bank3]
        .filter(bank => bank && bank.trim() !== '');
      preferredBank = banks.join(', ');
    }

    onUpdate({
      ...formData,
      preferredBank,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Customer Information
          {isAdmin && !isUserOwner && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (Admin Access)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>
          
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>
          
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>
          
          <div>
            <Label htmlFor="leadSource">Lead Source</Label>
            <Select
              disabled={!canEdit}
              value={formData.leadSource}
              onValueChange={(value) => handleSelectChange('leadSource', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="licenseType">License Type</Label>
            <Select
              disabled={!canEdit}
              value={formData.licenseType}
              onValueChange={(value) => handleSelectChange('licenseType', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mainland">Mainland</SelectItem>
                <SelectItem value="Freezone">Freezone</SelectItem>
                <SelectItem value="Offshore">Offshore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="jurisdiction">Jurisdiction</Label>
            <Select
              disabled={!canEdit}
              value={formData.jurisdiction}
              onValueChange={(value) => handleSelectChange('jurisdiction', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mainland">Mainland</SelectItem>
                <SelectItem value="Freezone">Freezone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (AED)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label htmlFor="annualTurnover">Annual Turnover (AED)</Label>
            <Input
              id="annualTurnover"
              name="annualTurnover"
              type="number"
              value={formData.annualTurnover}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Preferred Banks Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anySuitableBank"
              checked={anySuitableBank}
              onCheckedChange={handleAnySuitableBankChange}
              disabled={!canEdit}
            />
            <Label htmlFor="anySuitableBank">Any Suitable Bank</Label>
          </div>

          {!anySuitableBank && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferred Banks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bank1">First Preference</Label>
                  <Input
                    id="bank1"
                    name="bank1"
                    value={bankPreferences.bank1}
                    onChange={handleBankPreferenceChange}
                    className="mt-1"
                    placeholder="Enter bank name"
                    disabled={!canEdit}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bank2">Second Preference</Label>
                  <Input
                    id="bank2"
                    name="bank2"
                    value={bankPreferences.bank2}
                    onChange={handleBankPreferenceChange}
                    className="mt-1"
                    placeholder="Enter bank name"
                    disabled={!canEdit}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bank3">Third Preference</Label>
                  <Input
                    id="bank3"
                    name="bank3"
                    value={bankPreferences.bank3}
                    onChange={handleBankPreferenceChange}
                    className="mt-1"
                    placeholder="Enter bank name"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <Label htmlFor="customerNotes">Customer Notes</Label>
          <Textarea
            id="customerNotes"
            name="customerNotes"
            value={formData.customerNotes}
            onChange={handleInputChange}
            className="mt-1"
            rows={4}
            placeholder="Mention any specific queries or requirements here..."
            disabled={!canEdit}
          />
        </div>
        
        {canEdit && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSubmit}
              aria-label="Save customer details changes"
            >
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDetailsForm;
