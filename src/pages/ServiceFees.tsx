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
    <div className="container mx-auto py-4 space-y-4 max-w-6xl">
      {/* Compact Header */}
      <div className="flex justify-between items-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Service Fees</h1>
            <p className="text-xs text-muted-foreground">
              Manage fee configurations
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">
                {editingFee ? 'Edit Service Fee' : 'Add New Service Fee'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure fee settings for a product or bundle.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-3 py-3">
                {/* Fee Target Selection */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">Fee For</Label>
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
                    <SelectTrigger className="h-9">
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
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium">Product</Label>
                    <Select
                      value={formData.product_id ?? undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger className="h-9">
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
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium">Bundle</Label>
                    <Select
                      value={formData.bundle_id ?? undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, bundle_id: value }))}
                    >
                      <SelectTrigger className="h-9">
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
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">Fee Type</Label>
                  <Select
                    value={formData.fee_type}
                    onValueChange={(value: 'fixed' | 'percentage') => 
                      setFormData(prev => ({ ...prev, fee_type: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-3.5 w-3.5" />
                          Percentage
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Charge & Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="service_charge" className="text-xs font-medium">
                      Service Charge {formData.fee_type === 'percentage' ? '(%)' : `(${formData.currency})`}
                    </Label>
                    <Input
                      id="service_charge"
                      type="number"
                      step={formData.fee_type === 'percentage' ? '0.01' : '1'}
                      min="0"
                      className="h-9"
                      value={formData.service_charge}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        service_charge: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="amount" className="text-xs font-medium">
                      Final Amount {formData.fee_type === 'percentage' ? '(%)' : `(${formData.currency})`}
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step={formData.fee_type === 'percentage' ? '0.01' : '1'}
                      min="0"
                      className="h-9"
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
                  <div className="grid gap-1.5">
                    <Label htmlFor="currency" className="text-xs font-medium">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className="h-9">
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
                <div className="grid gap-1.5">
                  <Label htmlFor="description" className="text-xs font-medium">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes about this fee configuration"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  {editingFee ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : serviceFees?.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">No service fees configured</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Add fee configurations for your products and bundles.
            </p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Fee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Fee Configurations</CardTitle>
              <Badge variant="secondary" className="text-xs font-normal">
                {serviceFees?.length} {serviceFees?.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-xs font-medium">Product/Bundle</TableHead>
                  <TableHead className="h-9 text-xs font-medium w-[90px]">Type</TableHead>
                  <TableHead className="h-9 text-xs font-medium w-[100px]">Fee Type</TableHead>
                  <TableHead className="h-9 text-xs font-medium w-[110px]">Service Charge</TableHead>
                  <TableHead className="h-9 text-xs font-medium w-[100px]">Final Amount</TableHead>
                  <TableHead className="h-9 text-xs font-medium">Description</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceFees?.map((fee) => (
                  <TableRow key={fee.id} className="group">
                    <TableCell className="py-2 font-medium text-sm">
                      {fee.product_name || fee.bundle_name || '-'}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 font-normal ${
                          fee.product_id 
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                            : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                        }`}
                      >
                        {fee.product_id ? "Product" : "Bundle"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 gap-0.5 font-normal ${
                          fee.fee_type === 'percentage'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}
                      >
                        {fee.fee_type === 'percentage' ? (
                          <><Percent className="h-2.5 w-2.5" /> %</>
                        ) : (
                          <><DollarSign className="h-2.5 w-2.5" /> Fixed</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-sm tabular-nums">
                      {fee.fee_type === 'percentage' 
                        ? `${fee.service_charge}%` 
                        : `${fee.currency} ${fee.service_charge.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="py-2 font-semibold text-sm tabular-nums text-primary">
                      {formatFeeDisplay(fee)}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground max-w-[180px] truncate">
                      {fee.description || '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(fee)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(fee)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
