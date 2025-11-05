import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExistingCustomerSelector } from '@/components/Customer/ExistingCustomerSelector';
import { User, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';

interface CustomerSelectionCardProps {
  onCustomerSelected: (customerId: string | null, customerData?: NewCustomerData) => void;
  selectedCustomerId: string | null;
  newCustomerData: NewCustomerData | null;
}

export interface NewCustomerData {
  name: string;
  email: string;
  mobile: string;
  company: string;
}

export const CustomerSelectionCard: React.FC<CustomerSelectionCardProps> = ({
  onCustomerSelected,
  selectedCustomerId,
  newCustomerData
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
    name: newCustomerData?.name || '',
    email: newCustomerData?.email || '',
    mobile: newCustomerData?.mobile || '',
    company: newCustomerData?.company || ''
  });

  const handleExistingCustomerSelect = (customerId: string) => {
    onCustomerSelected(customerId, null);
  };

  const handleNewCustomerContinue = () => {
    if (newCustomer.name && newCustomer.email) {
      onCustomerSelected(null, newCustomer);
    }
  };

  const isNewCustomerValid = newCustomer.name.trim() && newCustomer.email.trim();
  const isCustomerSelected = selectedCustomerId !== null || (activeTab === 'new' && newCustomerData !== null);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Step 1: Select Customer
            </CardTitle>
            <CardDescription className="mt-1">
              Choose an existing customer or create a new one
            </CardDescription>
          </div>
          {isCustomerSelected && (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existing' | 'new')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Existing Customer
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New Customer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <ExistingCustomerSelector
              userId={user?.id || ''}
              value={selectedCustomerId || ''}
              onChange={handleExistingCustomerSelect}
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  placeholder="Phone number"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleNewCustomerContinue}
                disabled={!isNewCustomerValid}
              >
                Continue with New Customer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
