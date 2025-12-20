import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, Flag } from "lucide-react";

const Manage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configure</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Feature Flags Card */}
        <Card className="border-2">
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
      </div>

    </div>
  );
};

export default Manage;
