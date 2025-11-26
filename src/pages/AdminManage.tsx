import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, UserCog, Box } from "lucide-react";

export default function AdminManage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Manage
          </h1>
          <p className="text-muted-foreground mt-1">
            Management tools and settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/users')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and permissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create, edit, and manage user accounts and their access permissions.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/products')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Box className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage products and services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage products and service offerings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
