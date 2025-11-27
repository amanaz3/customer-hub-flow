import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FlaskConical, Flag } from "lucide-react";

export default function DevTools() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="w-8 h-8" />
          Admin Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Admin-only testing and debugging features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dev-tools/notifications')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Test</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Test in-app and email notifications
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/settings?tab=features')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Flag className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Feature Flags</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Enable or disable application workflow features
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
