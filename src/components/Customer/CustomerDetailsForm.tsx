
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer } from '@/types/customer';

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
  }) => void;
}

const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({
  customer,
  isEditable,
  isUserOwner,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    mobile: customer.mobile || '',
    company: customer.company || '',
    email: customer.email || '',
    leadSource: customer.leadSource || 'Website',
    licenseType: customer.licenseType || 'Mainland',
    amount: customer.amount.toString() || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
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
              disabled={!isEditable || !isUserOwner}
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
              disabled={!isEditable || !isUserOwner}
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
              disabled={!isEditable || !isUserOwner}
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
              disabled={!isEditable || !isUserOwner}
            />
          </div>
          
          <div>
            <Label htmlFor="leadSource">Lead Source</Label>
            <Select
              disabled={!isEditable || !isUserOwner}
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
              disabled={!isEditable || !isUserOwner}
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="mt-1"
              disabled={!isEditable || !isUserOwner}
            />
          </div>
        </div>
        
        {isEditable && isUserOwner && (
          <div className="mt-6 flex justify-end">
            <Button onClick={() => onUpdate(formData)}>
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDetailsForm;
