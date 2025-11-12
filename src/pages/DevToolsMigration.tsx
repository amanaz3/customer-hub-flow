import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DataMigrationSection } from "@/components/DevTools/DataMigrationSection";

export default function DevToolsMigration() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
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
          <RefreshCw className="w-8 h-8" />
          Data Migration
        </h1>
        <p className="text-muted-foreground mt-2">
          Migrate customer records to the new applications architecture
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer to Applications Migration</CardTitle>
          <CardDescription>
            Convert customer records into application records for the new system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataMigrationSection />
        </CardContent>
      </Card>
    </div>
  );
}
