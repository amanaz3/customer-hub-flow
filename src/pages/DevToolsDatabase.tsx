import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DatabaseViewerSection } from "@/components/DevTools/DatabaseViewerSection";

export default function DevToolsDatabase() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dev-tools')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Tools
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="w-8 h-8" />
          Database Viewer
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse and inspect database tables and records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>
            View table schema, metadata, and data (showing 50 most recent rows)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseViewerSection />
        </CardContent>
      </Card>
    </div>
  );
}
