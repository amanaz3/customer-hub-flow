import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Configure1Customer() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/configure-1')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          Customer Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage customer configuration settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Settings</CardTitle>
          <CardDescription>
            Configure customer-related settings here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Customer configuration options will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
