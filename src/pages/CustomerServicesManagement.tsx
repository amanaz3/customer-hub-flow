import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FolderTree, ArrowLeft, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CustomerServicesManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manage')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manage
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage service types, bundles, and categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/bundles')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Bundle Management</CardTitle>
                <CardDescription>Create and manage service bundles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure service bundle packages with combined offerings and pricing.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/service-categories')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderTree className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Service Categories</CardTitle>
                <CardDescription>Organize services by category</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define and manage service category hierarchies and classifications.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/service-form-configuration')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Service Details Form Configuration</CardTitle>
                <CardDescription>Configure dynamic forms for services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set up custom form sections and fields for each service/product type.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerServicesManagement;
