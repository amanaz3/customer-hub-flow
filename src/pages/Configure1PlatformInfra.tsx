import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Configure1PlatformInfra() {
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
          <Server className="w-8 h-8" />
          Platform & Infra Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage platform and infrastructure settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Platform and infrastructure configuration options will appear here.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
