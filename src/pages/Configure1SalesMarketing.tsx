import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Configure1SalesMarketing() {
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
          Back to Configure 1
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="w-8 h-8" />
          Sales & Marketing Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage sales and marketing configuration settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales & Marketing Settings</CardTitle>
          <CardDescription>
            Configure sales and marketing settings here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sales & Marketing configuration options will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
