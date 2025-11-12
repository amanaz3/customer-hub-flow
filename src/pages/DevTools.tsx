import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, Database, Wrench } from "lucide-react";

export default function DevTools() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="w-8 h-8" />
          Developer Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Admin-only testing and debugging features
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Testing
            </CardTitle>
            <CardDescription>
              Test in-app and email notifications without affecting production data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/notification-testing')}
              className="w-full"
            >
              Open Notification Testing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Viewer
            </CardTitle>
            <CardDescription>
              Browse and inspect database tables and records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/admin/database')}
              className="w-full"
            >
              Open Database Viewer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
