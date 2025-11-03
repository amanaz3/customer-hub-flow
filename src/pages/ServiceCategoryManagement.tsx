import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ServiceCategory {
  id: string;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceCategoryFormData {
  category_name: string;
  is_active: boolean;
}

const ServiceCategoryManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [formData, setFormData] = useState<ServiceCategoryFormData>({
    category_name: '',
    is_active: true
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_category')
        .select('*')
        .order('category_name', { ascending: true });
      
      if (error) throw error;
      return data as ServiceCategory[];
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: ServiceCategoryFormData) => {
      const { error } = await supabase
        .from('service_category')
        .insert([{
          category_name: data.category_name,
          is_active: data.is_active
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: "Success",
        description: "Service category created successfully"
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create service category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceCategoryFormData }) => {
      const { error } = await supabase
        .from('service_category')
        .update({
          category_name: data.category_name,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: "Success",
        description: "Service category updated successfully"
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update service category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_category')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({
        title: "Success",
        description: "Service category deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete service category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      category_name: '',
      is_active: true
    });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const handleDelete = (category: ServiceCategory) => {
    if (confirm(`Are you sure you want to delete "${category.category_name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Category Management</h1>
          <p className="text-muted-foreground">
            Manage service categories for organizing products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Service Category' : 'Add New Service Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the service category information below.'
                  : 'Create a new service category for organizing products.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category_name">Category Name</Label>
                  <Input
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {editingCategory ? 'Update' : 'Create'} Category
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
      ) : categories?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FolderTree className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No service categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first service category.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Service Categories</CardTitle>
            <CardDescription>
              {categories?.length} {categories?.length === 1 ? 'category' : 'categories'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.category_name}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(category.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category)}
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

export default ServiceCategoryManagement;
