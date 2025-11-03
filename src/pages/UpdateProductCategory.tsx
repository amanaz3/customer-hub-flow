import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export default function UpdateProductCategory() {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-product-category');
      
      if (error) throw error;
      
      toast.success(data.message);
      console.log('Update result:', data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product category');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Product Category</CardTitle>
          <CardDescription>
            Update "FTA Services - VAT Filing" product category to "Tax"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Update Category'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
