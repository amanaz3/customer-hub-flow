import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, ArrowLeft, Flag, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SandboxCardConfiguration } from "@/components/configure/SandboxCardConfiguration";

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
          Back to Configure
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
        {/* Feature Flags Card */}
        <Card className="hover:shadow-lg transition-shadow border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Flag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable workflow features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/settings?tab=features')}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Manage Features</p>
                <p className="text-xs text-muted-foreground">Toggle features on/off</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sandbox Cards Configuration */}
        <SandboxCardConfiguration />
      </div>
    </div>
  );
}
