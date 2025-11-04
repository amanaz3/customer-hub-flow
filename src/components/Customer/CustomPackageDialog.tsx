import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string;
}

interface CustomPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onPackageCreated: (pkg: {
    name: string;
    description: string;
    products: Product[];
    totalARR: number;
    isCustom: true;
  }) => void;
}

export function CustomPackageDialog({
  open,
  onOpenChange,
  products,
  onPackageCreated,
}: CustomPackageDialogProps) {
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [totalARR, setTotalARR] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!packageName.trim()) {
      toast({
        title: "Validation Error",
        description: "Package name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one product/service",
        variant: "destructive",
      });
      return;
    }

    if (!totalARR || parseFloat(totalARR) <= 0) {
      toast({
        title: "Validation Error",
        description: "Total ARR must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProductObjects = products.filter((p) =>
        selectedProducts.includes(p.id)
      );

      onPackageCreated({
        name: packageName,
        description: description,
        products: selectedProductObjects,
        totalARR: parseFloat(totalARR),
        isCustom: true,
      });

      toast({
        title: "Success",
        description: "Custom package created for this customer",
      });

      // Reset form
      setPackageName("");
      setDescription("");
      setSelectedProducts([]);
      setTotalARR("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom package",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Custom Package
          </DialogTitle>
          <DialogDescription>
            Create a custom package for this customer only (not saved as a reusable bundle)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="package-name">
              Package Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="package-name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., Startup Essentials"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="package-description">Description</Label>
            <Textarea
              id="package-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this custom package..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>
              Select Products/Services <span className="text-destructive">*</span>
            </Label>
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products available
                </p>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                      selectedProducts.includes(product.id) && "bg-accent"
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedProducts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedProducts.length} product(s) selected
              </p>
            )}
          </div>

          {/* Total ARR */}
          <div className="space-y-2">
            <Label htmlFor="total-arr">
              Total ARR <span className="text-destructive">*</span>
            </Label>
            <Input
              id="total-arr"
              type="number"
              step="0.01"
              min="0"
              value={totalARR}
              onChange={(e) => setTotalARR(e.target.value)}
              placeholder="Enter total ARR value"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
