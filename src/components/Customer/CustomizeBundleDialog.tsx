import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  description?: string;
}

interface Bundle {
  id: string;
  bundle_name: string;
  bundle_description?: string;
  total_arr: number;
  products?: Product[];
}

interface CustomizeBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: Bundle | null;
  allProducts: Product[];
  onCustomized: (customizedBundle: {
    name: string;
    description: string;
    products: Product[];
    totalARR: number;
    isCustom: true;
    basedOn: string;
  }) => void;
}

export function CustomizeBundleDialog({
  open,
  onOpenChange,
  bundle,
  allProducts,
  onCustomized,
}: CustomizeBundleDialogProps) {
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [totalARR, setTotalARR] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (bundle && open) {
      setPackageName(`${bundle.bundle_name} (Custom)`);
      setDescription(bundle.bundle_description || "");
      setTotalARR(bundle.total_arr.toString());
      
      if (bundle.products) {
        setSelectedProducts(bundle.products.map(p => p.id));
      }
    }
  }, [bundle, open]);

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
      const selectedProductObjects = allProducts.filter((p) =>
        selectedProducts.includes(p.id)
      );

      onCustomized({
        name: packageName,
        description: description,
        products: selectedProductObjects,
        totalARR: parseFloat(totalARR),
        isCustom: true,
        basedOn: bundle?.bundle_name || "",
      });

      toast({
        title: "Success",
        description: "Bundle customized for this customer",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to customize bundle",
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

  if (!bundle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Customize Bundle: {bundle.bundle_name}
          </DialogTitle>
          <DialogDescription>
            Modify this bundle for this specific customer (customization won't affect the original bundle)
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Changes will only apply to this customer. The original bundle remains unchanged.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="custom-package-name">
              Package Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="custom-package-name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., Premium Package (Custom)"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="custom-package-description">Description</Label>
            <Textarea
              id="custom-package-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Customization notes..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>
              Modify Products/Services <span className="text-destructive">*</span>
            </Label>
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {allProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products available
                </p>
              ) : (
                allProducts.map((product) => (
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
            <Label htmlFor="custom-total-arr">
              Adjusted Total ARR <span className="text-destructive">*</span>
            </Label>
            <Input
              id="custom-total-arr"
              type="number"
              step="0.01"
              min="0"
              value={totalARR}
              onChange={(e) => setTotalARR(e.target.value)}
              placeholder="Enter adjusted ARR value"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Original: {bundle.total_arr.toLocaleString()}
            </p>
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
              {isSubmitting ? "Applying..." : "Apply Customization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
