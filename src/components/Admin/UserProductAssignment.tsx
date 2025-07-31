import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/lib/supabase';
import { Product, UserProduct } from '@/types/customer';
import { X, Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const UserProductAssignment = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userProducts, setUserProducts] = useState<{ [userId: string]: UserProduct[] }>({});
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);

  const { assignProductToUser, removeProductFromUser } = useProducts();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

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
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select(`
          *,
          product:products(*)
        `);
      
      if (error) throw error;
      
      // Group by user_id
      const grouped = (data || []).reduce((acc: { [key: string]: UserProduct[] }, item) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push(item);
        return acc;
      }, {});
      
      setUserProducts(grouped);
    } catch (error) {
      console.error('Error fetching user products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user product assignments",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchProducts(),
        fetchUserProducts(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleAssignProduct = async () => {
    if (!selectedUser || !selectedProduct) {
      toast({
        title: "Error",
        description: "Please select both a user and a product",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignProductToUser(selectedUser, selectedProduct);
      await fetchUserProducts();
      setSelectedProduct('');
    } catch (error) {
      console.error('Error assigning product:', error);
    }
  };

  const handleRemoveProduct = async (userId: string, productId: string) => {
    try {
      await removeProductFromUser(userId, productId);
      await fetchUserProducts();
    } catch (error) {
      console.error('Error removing product:', error);
    }
  };

  const getAvailableProducts = (userId: string) => {
    const userProductIds = (userProducts[userId] || []).map(up => up.product_id);
    return products.filter(product => !userProductIds.includes(product.id));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">User Product Assignment</h2>
        <p className="text-muted-foreground">Assign products to users for application creation</p>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Product to User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Select User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium">Select Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUser && getAvailableProducts(selectedUser).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAssignProduct}
              disabled={!selectedUser || !selectedProduct}
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List with Assigned Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="w-fit">
                {user.role}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Assigned Products:</h4>
                {userProducts[user.id]?.length ? (
                  <div className="space-y-2">
                    {userProducts[user.id].map((userProduct) => (
                      <div
                        key={userProduct.id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm">
                          {userProduct.product?.name || 'Unknown Product'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(user.id, userProduct.product_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No products assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserProductAssignment;