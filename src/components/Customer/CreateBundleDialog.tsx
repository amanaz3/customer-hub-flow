import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Package, DollarSign, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  service_category_id: string | null;
}

interface CreateBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBundleCreated?: (bundleId: string, bundleName: string, totalARR: number) => void;
}

export const CreateBundleDialog: React.FC<CreateBundleDialogProps> = ({
  open,
  onOpenChange,
  onBundleCreated,
}) => {
  const { toast } = useToast();
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [totalARR, setTotalARR] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load products
  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active, service_category_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCreate = async () => {
    if (!bundleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a bundle name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one product',
        variant: 'destructive',
      });
      return;
    }

    if (totalARR <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid ARR value',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('service_bundles')
        .insert({
          bundle_name: bundleName.trim(),
          bundle_description: bundleDescription.trim() || null,
          total_arr: totalARR,
          is_active: true,
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Create bundle_products entries
      const bundleProducts = selectedProducts.map((productId) => ({
        bundle_id: bundle.id,
        product_id: productId,
      }));

      const { error: productsError } = await supabase
        .from('bundle_products')
        .insert(bundleProducts);

      if (productsError) throw productsError;

      toast({
        title: 'Success',
        description: `Bundle "${bundleName}" created successfully`,
      });

      // Reset form
      setBundleName('');
      setBundleDescription('');
      setTotalARR(0);
      setSelectedProducts([]);

      // Notify parent
      if (onBundleCreated) {
        onBundleCreated(bundle.id, bundle.bundle_name, bundle.total_arr);
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating bundle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bundle',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Custom Bundle
          </DialogTitle>
          <DialogDescription>
            Select multiple products/services and set the bundle ARR value
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bundle Name */}
          <div className="space-y-2">
            <Label htmlFor="bundle-name">Bundle Name *</Label>
            <Input
              id="bundle-name"
              placeholder="e.g., Full Compliance Package"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Bundle Description */}
          <div className="space-y-2">
            <Label htmlFor="bundle-description">Description (Optional)</Label>
            <Input
              id="bundle-description"
              placeholder="Brief description of the bundle"
              value={bundleDescription}
              onChange={(e) => setBundleDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Total ARR Input */}
          <div className="space-y-2">
            <Label htmlFor="total-arr">Total ARR Value *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="total-arr"
                type="number"
                placeholder="e.g., 15000"
                value={totalARR || ''}
                onChange={(e) => setTotalARR(Number(e.target.value) || 0)}
                disabled={isSubmitting}
                className="pl-9"
              />
            </div>
          </div>

          <Separator />

          {/* Product Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Select Products/Services</Label>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {selectedProducts.length} selected
              </Badge>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => !isSubmitting && toggleProduct(product.id)}
                      className={cn(
                        'relative p-3 rounded-lg border-2 cursor-pointer transition-all',
                        'hover:shadow-sm',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card hover:border-primary/40',
                        isSubmitting && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => !isSubmitting && toggleProduct(product.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting || selectedProducts.length === 0 || !bundleName.trim() || totalARR <= 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
