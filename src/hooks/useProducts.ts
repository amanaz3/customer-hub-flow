import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, UserProduct } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchUserProducts = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching user products:', error);
      toast({
        title: "Error", 
        description: "Failed to fetch user products",
        variant: "destructive",
      });
    }
  };

  const getUserAssignedProducts = async (userId: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_products', { user_uuid: userId });
      
      if (error) throw error;
      
      return data?.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        is_active: true,
      })) || [];
    } catch (error) {
      console.error('Error fetching user assigned products:', error);
      return [];
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignProductToUser = async (userId: string, productId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .insert([{ user_id: userId, product_id: productId }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product assigned to user successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error assigning product to user:', error);
      toast({
        title: "Error", 
        description: "Failed to assign product to user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeProductFromUser = async (userId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('user_products')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product removed from user successfully",
      });
    } catch (error) {
      console.error('Error removing product from user:', error);
      toast({
        title: "Error",
        description: "Failed to remove product from user", 
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchUserProducts(),
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  return {
    products,
    userProducts,
    loading,
    fetchProducts,
    fetchUserProducts,
    getUserAssignedProducts,
    createProduct,
    updateProduct,
    assignProductToUser,
    removeProductFromUser,
  };
};