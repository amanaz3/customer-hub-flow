import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, DollarSign, Percent } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceFee {
  id: string;
  product_id: string | null;
  bundle_id: string | null;
  fee_type: 'fixed' | 'percentage';
  service_charge: number;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  bundle_name?: string;
}

interface ServiceFeeFormData {
  product_id: string | null;
  bundle_id: string | null;
  fee_type: 'fixed' | 'percentage';
  service_charge: number;
  amount: number;
  currency: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
}

interface Bundle {
  id: string;
  bundle_name: string;
}

const ServiceFees: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<ServiceFee | null>(null);
  const [feeTarget, setFeeTarget] = useState<'product' | 'bundle'>('product');
  const [formData, setFormData] = useState<ServiceFeeFormData>({
    product_id: null,
    bundle_id: null,
    fee_type: 'fixed',
    service_charge: 0,
    amount: 0,
    currency: 'AED',
    description: ''
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-for-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch bundles
  const { data: bundles } = useQuery({
    queryKey: ['bundles-for-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bundles')
        .select('id, bundle_name')
        .eq('is_active', true)
        .order('bundle_name');
      if (error) throw error;
      return data as Bundle[];
    }
  });

  // Fetch service fees
  const { data: serviceFees, isLoading } = useQuery({
    queryKey: ['service-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_fees')
        .select(`
          *,
          products!service_fees_product_id_fkey (name),
          service_bundles!service_fees_bundle_id_fkey (bundle_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(fee => ({
        ...fee,
        product_name: fee.products?.name || null,
        bundle_name: fee.service_bundles?.bundle_name || null
      })) as ServiceFee[];
    }
  });

  const createFeeMutation = useMutation({
    mutationFn: async (data: ServiceFeeFormData) => {
      const { error } = await supabase
        .from('service_fees')
        .insert([{
          product_id: data.product_id,
          bundle_id: data.bundle_id,
          fee_type: data.fee_type,
          service_charge: data.service_charge,
          amount: data.amount,
          currency: data.currency,
          description: data.description || null
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-fees'] });
      toast({ title: "Success", description: "Service fee created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create service fee: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateFeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceFeeFormData }) => {
      const { error } = await supabase
        .from('service_fees')
        .update({
          product_id: data.product_id,
          bundle_id: data.bundle_id,
          fee_type: data.fee_type,
          service_charge: data.service_charge,
          amount: data.amount,
          currency: data.currency,
          description: data.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-fees'] });
      toast({ title: "Success", description: "Service fee updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update service fee: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_fees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-fees'] });
      toast({ title: "Success", description: "Service fee deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete service fee: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      product_id: null,
      bundle_id: null,
      fee_type: 'fixed',
      service_charge: 0,
      amount: 0,
      currency: 'AED',
      description: ''
    });
    setFeeTarget('product');
    setEditingFee(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (fee: ServiceFee) => {
    setEditingFee(fee);
    setFeeTarget(fee.product_id ? 'product' : 'bundle');
    setFormData({
      product_id: fee.product_id,
      bundle_id: fee.bundle_id,
      fee_type: fee.fee_type,
      service_charge: fee.service_charge,
      amount: fee.amount,
      currency: fee.currency,
      description: fee.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate selection
    if (feeTarget === 'product' && !formData.product_id) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive"
      });
      return;
    }
    if (feeTarget === 'bundle' && !formData.bundle_id) {
      toast({
        title: "Error",
        description: "Please select a bundle",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      product_id: feeTarget === 'product' ? formData.product_id : null,
      bundle_id: feeTarget === 'bundle' ? formData.bundle_id : null
    };

    if (editingFee) {
      updateFeeMutation.mutate({ id: editingFee.id, data: submitData });
    } else {
      createFeeMutation.mutate(submitData);
    }
  };

  const handleDelete = (fee: ServiceFee) => {
    if (confirm(`Are you sure you want to delete this fee configuration?`)) {
      deleteFeeMutation.mutate(fee.id);
    }
  };

  const formatFeeDisplay = (fee: ServiceFee) => {
    if (fee.fee_type === 'percentage') {
      return `${fee.amount}%`;
    }
    return `${fee.currency} ${fee.amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Fees</h1>
          <p className="text-muted-foreground">
            Manage fee configurations for products and bundles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingFee ? 'Edit Service Fee' : 'Add New Service Fee'}
              </DialogTitle>
              <DialogDescription>
                Configure fee settings for a product or bundle.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Fee Target Selection */}
                <div className="grid gap-2">
                  <Label>Fee For</Label>
                  <Select
                    value={feeTarget}
                    onValueChange={(value: 'product' | 'bundle') => {
                      setFeeTarget(value);
                      setFormData(prev => ({
                        ...prev,
                        product_id: null,
                        bundle_id: null
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product/Bundle Selection */}
                {feeTarget === 'product' ? (
                  <div className="grid gap-2">
                    <Label>Product</Label>
                    <Select
                      value={formData.product_id ?? undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>Bundle</Label>
                    <Select
                      value={formData.bundle_id ?? undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, bundle_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bundle" />
                      </SelectTrigger>
                      <SelectContent>
                        {bundles?.map((bundle) => (
                          <SelectItem key={bundle.id} value={bundle.id}>
                            {bundle.bundle_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Fee Type */}
                <div className="grid gap-2">
                  <Label>Fee Type</Label>
                  <Select
                    value={formData.fee_type}
                    onValueChange={(value: 'fixed' | 'percentage') => 
                      setFormData(prev => ({ ...prev, fee_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Charge & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="service_charge">
                      Service Charge {formData.fee_type === 'percentage' ? '(%)' : `(${formData.currency})`}
                    </Label>
                    <Input
                      id="service_charge"
                      type="number"
                      step={formData.fee_type === 'percentage' ? '0.01' : '1'}
                      min="0"
                      value={formData.service_charge}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        service_charge: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">
                      Final Amount {formData.fee_type === 'percentage' ? '(%)' : `(${formData.currency})`}
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step={formData.fee_type === 'percentage' ? '0.01' : '1'}
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                {/* Currency (only for fixed) */}
                {formData.fee_type === 'fixed' && (
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes about this fee configuration"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  {editingFee ? 'Update' : 'Create'} Fee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : serviceFees?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No service fees configured</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding fee configurations for your products and bundles.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fee Configurations</CardTitle>
            <CardDescription>
              {serviceFees?.length} {serviceFees?.length === 1 ? 'configuration' : 'configurations'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product/Bundle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Service Charge</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceFees?.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {fee.product_name || fee.bundle_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.product_id ? "default" : "secondary"}>
                        {fee.product_id ? "Product" : "Bundle"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {fee.fee_type === 'percentage' ? (
                          <><Percent className="h-3 w-3" /> Percentage</>
                        ) : (
                          <><DollarSign className="h-3 w-3" /> Fixed</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fee.fee_type === 'percentage' 
                        ? `${fee.service_charge}%` 
                        : `${fee.currency} ${fee.service_charge.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatFeeDisplay(fee)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {fee.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(fee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceFees;
