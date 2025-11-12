import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Database, Wrench, RefreshCw } from "lucide-react";

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
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Notification Testing</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Test in-app and email notifications without affecting production data
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dev-tools/database')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Database Viewer</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Browse and inspect database tables, schema, and records
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dev-tools/migration')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Data Migration</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Migrate customer records to the new applications architecture
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
