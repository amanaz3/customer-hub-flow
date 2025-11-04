import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string | null;
}

interface Bundle {
  id: string;
  bundle_name: string;
  bundle_description: string | null;
  total_arr: number;
  is_active: boolean;
  products?: Product[];
}

const BundleManagement = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    bundle_name: '',
    bundle_description: '',
    total_arr: 0,
    selectedProducts: [] as string[],
  });

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('service_bundles')
        .select('*')
        .order('bundle_name');

      if (bundlesError) throw bundlesError;

      // Fetch products for each bundle
      const bundlesWithProducts = await Promise.all(
        (bundlesData || []).map(async (bundle) => {
          const { data: bundleProducts, error: productsError } = await supabase
            .from('bundle_products')
            .select('product_id, products(id, name, description)')
            .eq('bundle_id', bundle.id);

          if (productsError) throw productsError;

          return {
            ...bundle,
            products: bundleProducts?.map((bp: any) => bp.products) || [],
          };
        })
      );

      setBundles(bundlesWithProducts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.bundle_name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Bundle name is required',
          variant: 'destructive',
        });
        return;
      }

      if (editingBundle) {
        // Update existing bundle
        const { error: updateError } = await supabase
          .from('service_bundles')
          .update({
            bundle_name: formData.bundle_name,
            bundle_description: formData.bundle_description,
            total_arr: formData.total_arr,
          })
          .eq('id', editingBundle.id);

        if (updateError) throw updateError;

        // Delete existing bundle products
        await supabase
          .from('bundle_products')
          .delete()
          .eq('bundle_id', editingBundle.id);

        // Insert new bundle products
        if (formData.selectedProducts.length > 0) {
          const { error: productsError } = await supabase
            .from('bundle_products')
            .insert(
              formData.selectedProducts.map((productId) => ({
                bundle_id: editingBundle.id,
                product_id: productId,
              }))
            );

          if (productsError) throw productsError;
        }

        toast({
          title: 'Success',
          description: 'Bundle updated successfully',
        });
      } else {
        // Create new bundle
        const { data: newBundle, error: insertError } = await supabase
          .from('service_bundles')
          .insert({
            bundle_name: formData.bundle_name,
            bundle_description: formData.bundle_description,
            total_arr: formData.total_arr,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert bundle products
        if (formData.selectedProducts.length > 0) {
          const { error: productsError } = await supabase
            .from('bundle_products')
            .insert(
              formData.selectedProducts.map((productId) => ({
                bundle_id: newBundle.id,
                product_id: productId,
              }))
            );

          if (productsError) throw productsError;
        }

        toast({
          title: 'Success',
          description: 'Bundle created successfully',
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchBundles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const { error } = await supabase
        .from('service_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Bundle deleted successfully',
      });

      fetchBundles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      bundle_name: bundle.bundle_name,
      bundle_description: bundle.bundle_description || '',
      total_arr: bundle.total_arr,
      selectedProducts: bundle.products?.map((p) => p.id) || [],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bundle_name: '',
      bundle_description: '',
      total_arr: 0,
      selectedProducts: [],
    });
    setEditingBundle(null);
  };

  const toggleProductSelection = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter((id) => id !== productId)
        : [...prev.selectedProducts, productId],
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8" />
            Bundle Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage service bundles with multiple products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
              </DialogTitle>
              <DialogDescription>
                Configure bundle details and select products to include
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bundle_name">Bundle Name *</Label>
                <Input
                  id="bundle_name"
                  value={formData.bundle_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bundle_name: e.target.value })
                  }
                  placeholder="e.g., Full Package"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bundle_description">Description</Label>
                <Textarea
                  id="bundle_description"
                  value={formData.bundle_description}
                  onChange={(e) =>
                    setFormData({ ...formData, bundle_description: e.target.value })
                  }
                  placeholder="Describe what this bundle includes"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_arr">Total ARR</Label>
                <Input
                  id="total_arr"
                  type="number"
                  value={formData.total_arr}
                  onChange={(e) =>
                    setFormData({ ...formData, total_arr: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={product.id}
                        checked={formData.selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <Label
                        htmlFor={product.id}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {product.name}
                        {product.description && (
                          <span className="text-muted-foreground ml-2">
                            - {product.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editingBundle ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading bundles...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {bundle.bundle_name}
                      {!bundle.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {bundle.bundle_description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(bundle)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total ARR</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${bundle.total_arr.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Included Products ({bundle.products?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bundle.products && bundle.products.length > 0 ? (
                        bundle.products.map((product) => (
                          <Badge key={product.id} variant="outline">
                            {product.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No products</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && bundles.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Bundles Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first service bundle to get started
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      )}
    </div>
  );
};

export default BundleManagement;
